[CmdletBinding()]
param(
  [string]$RepoRoot,
  [ValidateSet('main', 'live')]
  [string]$Channel = 'main'
)

$ErrorActionPreference = 'Stop'

$scriptRoot = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Path }
if (-not $RepoRoot) {
  $RepoRoot = Split-Path -Parent $scriptRoot
}

$repoRoot = (Resolve-Path $RepoRoot).Path
$indexPath = Join-Path $repoRoot 'index.html'

if (-not (Test-Path $indexPath)) {
  throw "Impossibile trovare index.html in $repoRoot"
}

$settings = switch ($Channel) {
  'live' {
    @{
      releaseChannel = 'live'
      editorEnabled = 'false'
      debugToolsEnabled = 'false'
      buildBadgeEnabled = 'false'
    }
  }
  default {
    @{
      releaseChannel = 'main'
      editorEnabled = 'true'
      debugToolsEnabled = 'true'
      buildBadgeEnabled = 'true'
    }
  }
}

$content = Get-Content -Raw $indexPath

function Set-DataAttribute {
  param(
    [string]$Html,
    [string]$Name,
    [string]$Value
  )

  $pattern = "$Name=""[^""]*"""
  $replacement = "$Name=""$Value"""

  if ($Html -notmatch $pattern) {
    throw "Impossibile trovare l'attributo $Name in $indexPath"
  }

  return [regex]::Replace($Html, $pattern, $replacement, 1)
}

$updated = $content
$updated = Set-DataAttribute -Html $updated -Name 'data-release-channel' -Value $settings.releaseChannel
$updated = Set-DataAttribute -Html $updated -Name 'data-editor-enabled' -Value $settings.editorEnabled
$updated = Set-DataAttribute -Html $updated -Name 'data-debug-tools-enabled' -Value $settings.debugToolsEnabled
$updated = Set-DataAttribute -Html $updated -Name 'data-build-badge-enabled' -Value $settings.buildBadgeEnabled

Set-Content -Path $indexPath -Value $updated -NoNewline

Write-Output "Release mode impostato: $Channel"
