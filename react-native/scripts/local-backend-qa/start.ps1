param([switch]$Realtime)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location -LiteralPath $projectRoot
if ($Realtime) { node.exe scripts/local-backend-qa/prepare.mjs --realtime }
else { node.exe scripts/local-backend-qa/prepare.mjs }
if ($LASTEXITCODE -ne 0) { throw 'Local QA preparation failed; no containers started.' }
$qaRoot = Join-Path $projectRoot '.tooling/supabase-qa'
# Native stderr can be PowerShell ErrorRecords even on a successful CLI run.
$ErrorActionPreference = 'Continue'
$excludedServices = 'imgproxy,mailpit,postgres-meta,studio,edge-runtime,logflare,vector,supavisor'
$qaConfig = [IO.File]::ReadAllText((Join-Path $qaRoot 'supabase/config.toml'))
if ($qaConfig -notmatch '(?m)\[realtime\]\r?\n(?:#[^\r\n]*\r?\n)*enabled\s*=\s*true') { $excludedServices = 'realtime,' + $excludedServices }
npx.cmd --yes supabase@3.1.0 start --workdir $qaRoot --exclude $excludedServices *> (Join-Path $qaRoot 'start.log')
$startExit = $LASTEXITCODE
if ($startExit -ne 0) { throw "Local Supabase startup failed exit=$startExit. Inspect the ignored log with credentials redacted; start Docker Desktop if its Linux engine is unavailable." }
npx.cmd --yes supabase@3.1.0 status --workdir $qaRoot --output json 1> (Join-Path $qaRoot 'credentials.raw.json') 2> (Join-Path $qaRoot 'status.stderr.log')
$statusExit = $LASTEXITCODE
$ErrorActionPreference = 'Stop'
if ($statusExit -ne 0) { throw "Local Supabase status failed exit=$statusExit" }
@'
const fs=require('fs'),base='.tooling/supabase-qa/';const bytes=fs.readFileSync(base+'credentials.raw.json');const text=bytes.toString(bytes[0]===255&&bytes[1]===254?'utf16le':'utf8').replace(/^\uFEFF/,'');const data=JSON.parse(text);if(new URL(data.API_URL).origin!=='http://127.0.0.1:55431')throw new Error('Refused non-local QA endpoint');fs.writeFileSync(base+'credentials.json',JSON.stringify(data,null,2));
'@ | node.exe
if ($LASTEXITCODE -ne 0) { throw 'Local credential file parsing failed.' }
Write-Host 'Local QA is ready. Credentials remain only in ignored .tooling/supabase-qa/credentials.json.'
