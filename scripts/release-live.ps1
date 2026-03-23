[CmdletBinding()]
param(
  [string]$MainWorktreePath,
  [string]$LiveWorktreePath,
  [string]$RemoteName = 'origin',
  [switch]$Push
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

New-BackupBranchIfDiverged -RepoPath $liveWorktreePath -BranchName 'live' -RemoteName $RemoteName
Invoke-Git $liveWorktreePath 'reset' '--hard' "$RemoteName/live"
Invoke-Git $liveWorktreePath 'merge' '-X' 'theirs' '--no-edit' "$RemoteName/main"

& pwsh -ExecutionPolicy Bypass -File (Join-Path $scriptRoot 'stamp-build.ps1') -RepoRoot $liveWorktreePath
if ($LASTEXITCODE -ne 0) {
  throw 'Stamp build fallito per il branch live.'
}

& pwsh -ExecutionPolicy Bypass -File (Join-Path $scriptRoot 'set-release-mode.ps1') -RepoRoot $liveWorktreePath -Channel 'live'
if ($LASTEXITCODE -ne 0) {
  throw 'Impostazione release mode fallita per il branch live.'
}

$statusAfter = Get-GitOutput $liveWorktreePath 'status' '--porcelain'
if (-not $statusAfter) {
  Write-Output 'Live gia allineato: nessuna modifica da committare.'
  return
}

Invoke-Git $liveWorktreePath 'add' '-A'
Invoke-Git $liveWorktreePath 'commit' '-m' 'Prepare live player-only release'

if ($Push) {
  Invoke-Git $liveWorktreePath 'push' $RemoteName 'live'
  Write-Output 'Release live completata e pushata.'
} else {
  Write-Output 'Release live preparata localmente. Esegui git push origin live nel worktree live per pubblicarla.'
}
