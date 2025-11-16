param(
  [switch]$SkipHistory = $false
)

Write-Host "TS-PLATO: discovering targets..."
$targets = @()
if (Test-Path packages) {
  $targets += Get-ChildItem -Path 'packages' -Directory -ErrorAction SilentlyContinue | Where-Object { Test-Path (Join-Path $_.FullName 'src') }
}
if (Test-Path apps) {
  $targets += Get-ChildItem -Path 'apps' -Directory -ErrorAction SilentlyContinue | Where-Object { Test-Path (Join-Path $_.FullName 'src') }
}

if (-not $targets -or $targets.Count -eq 0) {
  Write-Error "No targets found under packages/* or apps/* with a src directory."
  exit 1
}

$coverage = Join-Path (Get-Location) 'coverage'
if (-not (Test-Path $coverage)) { New-Item -ItemType Directory -Path $coverage | Out-Null }

Write-Host "TS-PLATO: generating per-target reports..."
foreach ($t in $targets) {
  $name = Split-Path $t.FullName -Leaf
  $src  = Join-Path $t.FullName 'src'
  $outDir = Join-Path $coverage "ts-plato-$name"

  Write-Host ("  -> {0}" -f $name)  # Prepare ts-plato arguments
  $platoArgs = @(
    "ts-plato",
    "--dir", "$outDir",
    "--title", "Code Analysis: $name",
    "--recurse",
    "$src"
  )

  # Add history flag if not skipping and history file exists
  $historyFile = Join-Path $outDir 'report.history.json'
  if (-not $SkipHistory -and (Test-Path $historyFile)) {
    $platoArgs += @("--history", "$historyFile")
  }

  # Run ts-plato
  & pnpm dlx @platoArgs

  if ($LASTEXITCODE -ne 0) {
    Write-Warning "ts-plato failed for $name (exit code: $LASTEXITCODE)"
  }
}

Write-Host "TS-PLATO: analysis complete!"
Write-Host ""
Write-Host "Reports generated in coverage/ts-plato-*/"
Write-Host "Open any index.html file to view detailed analysis."
Write-Host ""
Write-Host "To view a summary of all packages, run:"
Write-Host "  node .\metrics\ts-plato\summary.cjs"
