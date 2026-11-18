$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location -LiteralPath $projectRoot
$qaRoot = Join-Path $projectRoot '.tooling/supabase-qa'
$metadata = Get-Content -LiteralPath (Join-Path $qaRoot 'metadata.json') -Raw | ConvertFrom-Json
if ($metadata.projectId -notmatch '^[a-z0-9-]+$') { throw 'Invalid isolated QA project ID.' }
$ErrorActionPreference = 'Continue'
npx.cmd --yes supabase@3.1.0 stop --workdir $qaRoot --project-id $metadata.projectId *> (Join-Path $qaRoot 'stop.log')
if ($LASTEXITCODE -ne 0) { throw "Local QA stop failed exit=$LASTEXITCODE" }
Write-Host 'Stopped only this isolated QA project; database and storage volumes are preserved.'
