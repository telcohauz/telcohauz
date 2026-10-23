$ErrorActionPreference = 'Stop'
$control = Split-Path -Parent $MyInvocation.MyCommand.Path
$pythonExe = 'D:\TELCOHAUZ_BOZ_AI_WORKFORCE\tools\python-3.12.10\python.exe'
if (-not(Test-Path -LiteralPath $pythonExe)) { throw 'Project Python runtime missing.' }
if ([TimeZoneInfo]::Local.GetUtcOffset([datetime]::Now).TotalHours -ne 8) { throw 'Expected UTC+08:00; configure an explicit MYT trigger before registration.' }
$base = '"' + (Join-Path $control 'boz_automation.py') + '" --run-worker'
$principal = New-ScheduledTaskPrincipal -UserId ([Security.Principal.WindowsIdentity]::GetCurrent().Name) -LogonType Interactive -RunLevel Limited
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Minutes 30)
$hourAction = New-ScheduledTaskAction -Execute $pythonExe -Argument $base -WorkingDirectory $control
$hourTrigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(2) -RepetitionInterval (New-TimeSpan -Hours 1) -RepetitionDuration (New-TimeSpan -Days 3650)
$dailyAction = New-ScheduledTaskAction -Execute $pythonExe -Argument ($base+' --run-tests') -WorkingDirectory $control
$dailyTrigger = New-ScheduledTaskTrigger -Daily -At '06:00'
Register-ScheduledTask -TaskName 'TELCOHAUZ_BOZ_HOURLY' -Action $hourAction -Trigger $hourTrigger -Principal $principal -Settings $settings -Description 'Hourly BOZ evidence, blocker probes and one allowlisted worker job; no production writes' -Force | Out-Null
Register-ScheduledTask -TaskName 'TELCOHAUZ_BOZ_DAILY_TESTS' -Action $dailyAction -Trigger $dailyTrigger -Principal $principal -Settings $settings -Description '06:00 MYT: Workforce, BOZ API and automation regression tests; evidence and gated queue tick' -Force | Out-Null
Get-ScheduledTask -TaskName 'TELCOHAUZ_BOZ_HOURLY','TELCOHAUZ_BOZ_DAILY_TESTS' | ForEach-Object { $t=$_;$i=Get-ScheduledTaskInfo -TaskName $t.TaskName; [pscustomobject]@{TaskName=$t.TaskName;State=[string]$t.State;LastRun=$i.LastRunTime;NextRun=$i.NextRunTime;Result=$i.LastTaskResult} } | ConvertTo-Json
