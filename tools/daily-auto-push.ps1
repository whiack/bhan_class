$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$logPath = Join-Path (Split-Path -Parent $repoRoot) "daily-auto-push.log"

function Write-Log {
  param([string]$Message)
  $stamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  Add-Content -LiteralPath $logPath -Value "[$stamp] $Message" -Encoding UTF8
}

try {
  Set-Location -LiteralPath $repoRoot
  Write-Log "Start daily auto sync."

  $status = git status --porcelain
  if (-not $status) {
    Write-Log "No changes. Nothing to commit."
    exit 0
  }

  git add -A
  $afterAdd = git status --porcelain
  if (-not $afterAdd) {
    Write-Log "No staged changes after git add."
    exit 0
  }

  $message = "Daily auto sync $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
  git commit -m $message
  if ($LASTEXITCODE -ne 0) { throw "git commit failed with exit code $LASTEXITCODE" }
  git push origin main
  if ($LASTEXITCODE -ne 0) { throw "git push failed with exit code $LASTEXITCODE" }

  Write-Log "Pushed successfully: $message"
}
catch {
  Write-Log "FAILED: $($_.Exception.Message)"
  exit 1
}
