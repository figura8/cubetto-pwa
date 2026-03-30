[CmdletBinding()]
param(
  [string]$MainWorktreePath,
  [string]$LiveWorktreePath,
  [string]$RemoteName = 'origin',
  [switch]$Push,
  [switch]$SkipConfirmation
)

$ErrorActionPreference = 'Stop'

$scriptRoot = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Path }
if (-not $MainWorktreePath) {
  $MainWorktreePath = Split-Path -Parent $scriptRoot
}
if (-not $LiveWorktreePath) {
  $LiveWorktreePath = Join-Path (Split-Path -Parent (Split-Path -Parent $scriptRoot)) 'cubetto-pwa'
}

$mainWorktreePath = (Resolve-Path $MainWorktreePath).Path
$liveWorktreePath = (Resolve-Path $LiveWorktreePath).Path

function Invoke-Git {
  param(
    [string]$RepoPath,
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Args
  )

  & git -C $RepoPath @Args
  if ($LASTEXITCODE -ne 0) {
    throw "Comando git fallito in ${RepoPath}: git $($Args -join ' ')"
  }
}

function Get-GitOutput {
  param(
    [string]$RepoPath,
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Args
  )

  $output = & git -C $RepoPath @Args
  if ($LASTEXITCODE -ne 0) {
    throw "Comando git fallito in ${RepoPath}: git $($Args -join ' ')"
  }
  return ($output | Out-String).Trim()
}

function Invoke-PowerShellScript {
  param(
    [string]$ScriptPath,
    [string[]]$ArgumentList = @()
  )

  $shellCommand = Get-Command 'pwsh' -ErrorAction SilentlyContinue
  if ($shellCommand) {
    & $shellCommand.Source -ExecutionPolicy Bypass -File $ScriptPath @ArgumentList
  } else {
    & powershell -ExecutionPolicy Bypass -File $ScriptPath @ArgumentList
  }

  if ($LASTEXITCODE -ne 0) {
    throw "Script PowerShell fallito: $ScriptPath"
  }
}

function Assert-CleanWorktree {
  param(
    [string]$RepoPath,
    [string]$Label
  )

  $status = Get-GitOutput $RepoPath 'status' '--porcelain'
  if ($status) {
    throw "$Label ha modifiche non committate. Pulisci il worktree prima di lanciare la release."
  }
}

function Get-IndexDataAttribute {
  param(
    [string]$RepoPath,
    [string]$Name
  )

  $indexPath = Join-Path $RepoPath 'index.html'
  if (-not (Test-Path $indexPath)) {
    throw "index.html non trovato in $RepoPath"
  }
  $content = Get-Content -Raw $indexPath
  $match = [regex]::Match($content, "$Name=""([^""]+)""")
  if (-not $match.Success) {
    throw "Attributo $Name non trovato in $indexPath"
  }
  return $match.Groups[1].Value
}

function Assert-IndexDataAttribute {
  param(
    [string]$RepoPath,
    [string]$Name,
    [string]$Expected
  )

  $actual = Get-IndexDataAttribute -RepoPath $RepoPath -Name $Name
  if ($actual -ne $Expected) {
    throw "Valore non valido per $Name in $RepoPath. Atteso '$Expected', trovato '$actual'."
  }
}

function New-BackupBranchIfDiverged {
  param(
    [string]$RepoPath,
    [string]$BranchName,
    [string]$RemoteName
  )

  $aheadBehind = Get-GitOutput $RepoPath 'rev-list' '--left-right' '--count' "${BranchName}...${RemoteName}/${BranchName}"
  $ahead, $behind = $aheadBehind -split '\s+'

  if ([int]$ahead -le 0 -or [int]$behind -le 0) {
    return
  }

  $timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
  $backupBranch = "backup/${BranchName}-${timestamp}"
  Invoke-Git $RepoPath 'branch' $backupBranch $BranchName
  Write-Output "Creato backup locale ${backupBranch} prima di riallineare ${BranchName}."
}

function Get-LastCommitForPath {
  param(
    [string]$RepoPath,
    [string]$RelativePath
  )

  $commit = Get-GitOutput $RepoPath 'log' '-1' '--format=%h %ad %s' '--date=iso-short' '--' $RelativePath
  if (-not $commit) {
    return 'nessun commit trovato'
  }
  return $commit
}

function Confirm-ReleasePreflight {
  param(
    [string]$RepoPath,
    [string]$RemoteName
  )

  $levelsPath = 'data/editor-levels.json'
  $headCommit = Get-GitOutput $RepoPath 'rev-parse' '--short' 'HEAD'
  $remoteCommit = Get-GitOutput $RepoPath 'rev-parse' '--short' "$RemoteName/main"
  $levelsStatus = Get-GitOutput $RepoPath 'status' '--short' '--' $levelsPath
  $levelsCommit = Get-LastCommitForPath -RepoPath $RepoPath -RelativePath $levelsPath

  Write-Output ''
  Write-Output 'Preflight release live'
  Write-Output '---------------------'
  Write-Output "- main locale pronto per release: si ($headCommit)"
  Write-Output "- origin/main allineato: si ($remoteCommit)"
  Write-Output "- sorgente canonica livelli: $levelsPath"
  Write-Output "- stato locale livelli: $(if ($levelsStatus) { $levelsStatus } else { 'pulito' })"
  Write-Output "- ultimo commit che ha toccato i livelli: $levelsCommit"
  Write-Output ''

  $answer = (Read-Host 'Aspetta: hai gia pushato i commit giusti su GitHub e questi livelli locali sono davvero quelli da pubblicare su live? [y/N]').Trim().ToLowerInvariant()
  if ($answer -notin @('y', 'yes', 's', 'si')) {
    throw 'Release live annullata: preflight livelli non confermato.'
  }
}

if (-not (Test-Path (Join-Path $mainWorktreePath '.git'))) {
  throw "Main worktree non valido: $mainWorktreePath"
}

if (-not (Test-Path (Join-Path $liveWorktreePath '.git'))) {
  throw "Live worktree non valido: $liveWorktreePath"
}

Assert-CleanWorktree -RepoPath $mainWorktreePath -Label 'Il worktree main'
Assert-CleanWorktree -RepoPath $liveWorktreePath -Label 'Il worktree live'

$mainBranch = Get-GitOutput $mainWorktreePath 'rev-parse' '--abbrev-ref' 'HEAD'
if ($mainBranch -ne 'main') {
  throw "Il worktree main deve essere sul branch main. Stato attuale: $mainBranch"
}

$liveBranch = Get-GitOutput $liveWorktreePath 'rev-parse' '--abbrev-ref' 'HEAD'
if ($liveBranch -ne 'live') {
  throw "Il worktree live deve essere sul branch live. Stato attuale: $liveBranch"
}

Invoke-Git $mainWorktreePath 'fetch' '--prune' $RemoteName
Invoke-Git $liveWorktreePath 'fetch' '--prune' $RemoteName

$mainAheadBehind = Get-GitOutput $mainWorktreePath 'rev-list' '--left-right' '--count' "main...$RemoteName/main"
$mainAhead, $mainBehind = $mainAheadBehind -split '\s+'
if ([int]$mainAhead -ne 0) {
  throw "Il branch main locale ha commit non pushati. Fai push su $RemoteName/main prima della release live."
}
if ([int]$mainBehind -ne 0) {
  throw "Il branch main locale e indietro rispetto a $RemoteName/main. Allinealo prima della release live."
}

if (-not $SkipConfirmation) {
  Confirm-ReleasePreflight -RepoPath $mainWorktreePath -RemoteName $RemoteName
}

New-BackupBranchIfDiverged -RepoPath $liveWorktreePath -BranchName 'live' -RemoteName $RemoteName
Invoke-Git $liveWorktreePath 'reset' '--hard' "$RemoteName/live"
Invoke-Git $liveWorktreePath 'merge' '-X' 'theirs' '--no-edit' "$RemoteName/main"

$previousBuild = Get-IndexDataAttribute -RepoPath $liveWorktreePath -Name 'data-build'

Invoke-PowerShellScript -ScriptPath (Join-Path $scriptRoot 'stamp-build.ps1') -ArgumentList @('-RepoRoot', $liveWorktreePath)
Invoke-PowerShellScript -ScriptPath (Join-Path $scriptRoot 'set-release-mode.ps1') -ArgumentList @('-RepoRoot', $liveWorktreePath, '-Channel', 'live')

$currentBuild = Get-IndexDataAttribute -RepoPath $liveWorktreePath -Name 'data-build'
if ($currentBuild -eq $previousBuild) {
  throw "Build stamp invariato ($currentBuild). Release live annullata per sicurezza."
}

Assert-IndexDataAttribute -RepoPath $liveWorktreePath -Name 'data-release-channel' -Expected 'live'
Assert-IndexDataAttribute -RepoPath $liveWorktreePath -Name 'data-editor-enabled' -Expected 'false'
Assert-IndexDataAttribute -RepoPath $liveWorktreePath -Name 'data-debug-tools-enabled' -Expected 'false'
Assert-IndexDataAttribute -RepoPath $liveWorktreePath -Name 'data-build-badge-enabled' -Expected 'false'

$statusAfter = Get-GitOutput $liveWorktreePath 'status' '--porcelain'
if (-not $statusAfter) {
  Write-Output 'Live gia allineato: nessuna modifica da committare.'
  return
}

Invoke-Git $liveWorktreePath 'add' '-A'
Invoke-Git $liveWorktreePath 'commit' '-m' 'Prepare live player-only release'

if ($Push) {
  Invoke-Git $liveWorktreePath 'push' $RemoteName 'live'
  Write-Output "Release live completata e pushata. Build: $currentBuild"
} else {
  Write-Output "Release live preparata localmente (build $currentBuild). Esegui git push origin live nel worktree live per pubblicarla."
}
