$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Install Node.js 22 or 24 LTS from https://nodejs.org then reopen PowerShell.' }
node scripts/install.mjs
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
