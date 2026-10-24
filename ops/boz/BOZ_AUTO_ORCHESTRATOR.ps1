param([switch]$RunTests,[switch]$RunWorker)
$ErrorActionPreference = 'Stop'
$control = Split-Path -Parent $MyInvocation.MyCommand.Path
$pythonExe = 'D:\TELCOHAUZ_BOZ_AI_WORKFORCE\tools\python-3.12.10\python.exe'
$scriptArgs = @((Join-Path $control 'boz_automation.py'))
if ($RunTests) { $scriptArgs += '--run-tests' }
if ($RunWorker) { $scriptArgs += '--run-worker' }
& $pythonExe @scriptArgs
if ($LASTEXITCODE -ne 0) { throw "BOZ automation failed with exit code $LASTEXITCODE; inspect AUTO_LOGS." }
