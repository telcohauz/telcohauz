"""Register limited interactive Windows tasks without changing script policy."""
import argparse, datetime as dt, os, subprocess, sys
from pathlib import Path
from xml.sax.saxutils import escape
MYT=dt.timezone(dt.timedelta(hours=8))
def task_xml(user,python,script,daily=False):
    current=dt.datetime.now(MYT)
    if daily:
        boundary=current.replace(hour=6,minute=0,second=0,microsecond=0)
        if boundary<=current:boundary+=dt.timedelta(days=1)
        trigger='<CalendarTrigger><StartBoundary>'+boundary.isoformat()+'</StartBoundary><Enabled>true</Enabled><ScheduleByDay><DaysInterval>1</DaysInterval></ScheduleByDay></CalendarTrigger>'
    else:
        boundary=current+dt.timedelta(minutes=2)
        trigger='<TimeTrigger><Repetition><Interval>PT1H</Interval><StopAtDurationEnd>false</StopAtDurationEnd></Repetition><StartBoundary>'+boundary.isoformat()+'</StartBoundary><Enabled>true</Enabled></TimeTrigger>'
    args='"'+script+'" --run-worker'+(' --run-tests' if daily else '')
    return '<?xml version="1.0" encoding="UTF-16"?><Task version="1.2" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task"><Triggers>'+trigger+'</Triggers><Principals><Principal id="Owner"><UserId>'+escape(user)+'</UserId><LogonType>InteractiveToken</LogonType><RunLevel>LeastPrivilege</RunLevel></Principal></Principals><Settings><MultipleInstancesPolicy>IgnoreNew</MultipleInstancesPolicy><DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries><StopIfGoingOnBatteries>false</StopIfGoingOnBatteries><StartWhenAvailable>true</StartWhenAvailable><Enabled>true</Enabled><ExecutionTimeLimit>PT30M</ExecutionTimeLimit></Settings><Actions Context="Owner"><Exec><Command>'+escape(python)+'</Command><Arguments>'+escape(args)+'</Arguments><WorkingDirectory>'+escape(str(Path(script).parent))+'</WorkingDirectory></Exec></Actions></Task>'
def register(control,dry_run=False):
    control=Path(control);runtime=Path(r'D:\TELCOHAUZ_BOZ_AI_WORKFORCE\tools\python-3.12.10\python.exe')
    if not dry_run and (os.name!='nt' or not runtime.exists()):raise RuntimeError('Windows project runtime required')
    if not dry_run and dt.datetime.now().astimezone().utcoffset()!=dt.timedelta(hours=8):raise RuntimeError('Expected local MYT UTC+08:00')
    user=os.environ.get('USERDOMAIN',os.environ.get('COMPUTERNAME',''))+'\\'+os.environ.get('USERNAME','')
    archive=control/'AUTO_LOGS'/('scheduler-'+dt.datetime.now(MYT).strftime('%Y%m%d-%H%M%S'));archive.mkdir(parents=True,exist_ok=False)
    for name,daily in [('TELCOHAUZ_BOZ_HOURLY',False),('TELCOHAUZ_BOZ_DAILY_TESTS',True)]:
        file=archive/(name+'.xml');file.write_text(task_xml(user,str(runtime),str(control/'boz_automation.py'),daily),encoding='utf-16')
        if not dry_run:
            old=subprocess.run(['schtasks.exe','/Query','/TN',name,'/XML'],capture_output=True,timeout=60)
            if old.returncode==0:(archive/(name+'.before.xml')).write_bytes(old.stdout)
            result=subprocess.run(['schtasks.exe','/Create','/TN',name,'/XML',str(file),'/F'],capture_output=True,text=True,timeout=60)
            if result.returncode:raise RuntimeError('Task registration failed: '+name)
        print(name+': '+('XML_PREPARED' if dry_run else 'REGISTERED'))
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--control',default=r'D:\TELCOHAUZ_BOS\00_CONTROL_CENTER');p.add_argument('--dry-run',action='store_true');a=p.parse_args();register(a.control,a.dry_run)
