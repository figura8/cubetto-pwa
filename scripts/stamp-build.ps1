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

if ($updated -eq $content) {
  throw "Impossibile trovare data-build in $indexPath"
}

Set-Content -Path $indexPath -Value $updated -NoNewline
Write-Output "Stamped build: $stamp"
