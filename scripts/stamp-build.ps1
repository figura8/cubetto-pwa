[CmdletBinding()]
param(
  [string]$RepoRoot
)

$ErrorActionPreference = 'Stop'

$scriptRoot = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Path }
if (-not $RepoRoot) {
  $RepoRoot = Split-Path -Parent $scriptRoot
}

$repoRoot = (Resolve-Path $RepoRoot).Path
$indexPath = Join-Path $repoRoot 'index.html'
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'

$content = Get-Content -Raw $indexPath
$updated = [regex]::Replace($content, 'data-build=\"[^\"]+\"', "data-build=""$stamp""", 1)
$updated = [regex]::Replace($updated, '(styles/(?:app|character)\.css\?v=)[^"]+', "`${1}$stamp")
$updated = [regex]::Replace($updated, '(js/core/app-loader\.js\?v=)[^"]+', "`${1}$stamp")

if ($updated -eq $content) {
  throw "Impossibile trovare data-build in $indexPath"
}

Set-Content -Path $indexPath -Value $updated -NoNewline
Write-Output "Stamped build: $stamp"
