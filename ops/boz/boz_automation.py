"""Allowlisted BOZ maintenance. No model-generated commands or production writes."""
import argparse, contextlib, datetime as dt, hashlib, html, importlib.util, json, os
from pathlib import Path
import re, socket, sqlite3, subprocess, sys, time, urllib.error, urllib.request
TZ=dt.timezone(dt.timedelta(hours=8))
MODEL='qwen3:1.7b'
def now(): return dt.datetime.now(TZ).isoformat()
def atomic(path,value):
    path=Path(path);path.parent.mkdir(parents=True,exist_ok=True)
    tmp=path.with_name(path.name+'.tmp');tmp.write_text(value,encoding='utf-8');os.replace(tmp,path)
def read_json(path): return json.loads(Path(path).read_text(encoding='utf-8-sig'))
@contextlib.contextmanager
def exclusive(path):
    # OS releases the lock on process exit, including interruption; no PID deletion.
    f=open(path,'a+b');f.seek(0,2)
    if not f.tell():f.write(b'0');f.flush()
    f.seek(0)
    try:
        if os.name=='nt':
            import msvcrt
            msvcrt.locking(f.fileno(),msvcrt.LK_NBLCK,1)
        else:
            import fcntl
            fcntl.flock(f,fcntl.LOCK_EX|fcntl.LOCK_NB)
    except OSError:
        f.close();raise RuntimeError('Another automation run holds the lock')
    try:yield
    finally:
        f.seek(0)
        if os.name=='nt':msvcrt.locking(f.fileno(),msvcrt.LK_UNLCK,1)
        else:fcntl.flock(f,fcntl.LOCK_UN)
        f.close()
def transient_retry(fn,attempts=3):
    for i in range(attempts):
        try:return fn()
        except urllib.error.HTTPError as e:
            if e.code not in (408,429,500,502,503,504) or i==attempts-1:raise
        except (TimeoutError,urllib.error.URLError,ConnectionError):
            if i==attempts-1:raise
        time.sleep(min(2**i,4))
def local_json(route,body=None,timeout=8):
    # Fixed loopback address only; preserve normal proxy/security configuration.
    raw=None if body is None else json.dumps(body).encode()
    req=urllib.request.Request('http://127.0.0.1:11434'+route,raw,{'Content-Type':'application/json'})
    with urllib.request.urlopen(req,timeout=timeout) as r:return json.load(r)
def model_probe():
    tags=transient_retry(lambda:local_json('/api/tags'))
    models={x['name']:x for x in tags.get('models',[])}
    if MODEL not in models:return {'state':'MODEL_MISSING','model':MODEL}
    result=local_json('/api/generate',{'model':MODEL,'prompt':'Reply with one short word: SEDIA','stream':False,'think':False,'keep_alive':'2m','options':{'num_ctx':512,'num_predict':24,'num_thread':2,'num_batch':64,'temperature':0}},timeout=90)
    answer=result.get('response')
    if not isinstance(answer,str) or not answer.strip():return {'state':'EMPTY_RESPONSE','model':MODEL}
    return {'state':'READY','model':MODEL,'bytes':models[MODEL].get('size'),'response_sha256':hashlib.sha256(answer.encode()).hexdigest()}
def run_test(label,command,logs,timeout):
    start=now();dest=logs/(label+'.log')
    atomic(logs/'progress.json',json.dumps({'at':start,'stage':label,'state':'STARTING'}))
    try:
        with dest.open('w',encoding='utf-8') as output:
            p=subprocess.run(command,stdin=subprocess.DEVNULL,stdout=output,stderr=subprocess.STDOUT,timeout=timeout,shell=False,creationflags=subprocess.CREATE_NO_WINDOW if os.name=='nt' else 0)
        text=dest.read_text(encoding='utf-8',errors='replace');count=re.search(r'Ran (\d+) tests?',text)
        return {'state':'PASS' if p.returncode==0 else 'FAIL','exit_code':p.returncode,'count':int(count[1]) if count else None,'at':start,'log':str(dest),'sha256':hashlib.sha256(dest.read_bytes()).hexdigest()}
    except subprocess.TimeoutExpired:return {'state':'TIMEOUT','at':start,'log':str(dest)}
def queue_summary(work):
    path=work/'queue.sqlite3'
    if not path.exists():return {'state':'MISSING','counts':{}}
    with contextlib.closing(sqlite3.connect(path.as_uri()+'?mode=ro',uri=True,timeout=5)) as c:
        return {'state':'READABLE','counts':dict(c.execute('SELECT status,count(*) FROM jobs GROUP BY status'))}
def worker_lock_status(work,python):
    lock=work/'worker.lock'
    if not lock.exists():return 'CLEAR'
    raw=lock.read_text().strip()
    if not raw.isdecimal() or int(raw)<=0:return 'UNVERIFIED_LOCK'
    if os.name!='nt':return 'UNVERIFIED_LOCK'
    # PID alone is insufficient: verify the executable and exact script path.
    command=f"Get-CimInstance Win32_Process -Filter 'ProcessId={int(raw)}' | Select-Object ExecutablePath,CommandLine | ConvertTo-Json -Compress"
    p=subprocess.run(['powershell.exe','-NoProfile','-Command',command],capture_output=True,text=True,timeout=15)
    if p.returncode or p.stderr.strip():return 'UNVERIFIED_LOCK'
    if p.stdout.strip():
        proc=json.loads(p.stdout)
        if not proc.get('CommandLine') or not proc.get('ExecutablePath'):return 'UNVERIFIED_LOCK'
        if str(work/'workforce.py').lower() in proc['CommandLine'].lower() and str(python).lower()==proc['ExecutablePath'].lower():return 'RUNNING'
        return 'PID_REUSED_REVIEW_REQUIRED'
    archive=work/'archive'/('stale-worker-lock-'+str(time.time_ns())+'.txt');archive.parent.mkdir(exist_ok=True)
    lock.rename(archive)
    return 'STALE_ARCHIVED'
def worker_tick(work,python,logs,model_ready):
    state=worker_lock_status(work,python)
    if state not in ('CLEAR','STALE_ARCHIVED'):return {'state':state}
    command=[str(python),str(work/'workforce.py'),'run']
    if not model_ready:command.append('--skip-drafts')
    result=run_test('worker-tick',command,logs,420)
    return {'state':'TICK_COMPLETED' if result['state']=='PASS' else result['state'],'lock':state,'log':result['log'],'model_ready':model_ready}
def probe_blockers(register,model,queue,control,work):
    checks=[]
    dependencies={'AUTH-001':['SEC-002','SEC-003'],'PAY-001':['AUTH-001'],'ANDROID-001':['AUTH-001'],'CAT-001':['SEC-003']}
    probes={
        'SEC-002':('REVIEW_REQUIRED','Compare app/source/schema mapping; no automatic DB retarget.'),
        'SEC-003':('ROLE_TESTS_REQUIRED','Live RLS, grants, auth and two-shop tests still required.'),
        'BUILD-001':('CI_EVIDENCE_REQUIRED','Public registry reachability alone does not validate a build.'),
        'AUTH-001':('AUTHORIZED_TEST_SESSION_REQUIRED','Local fixture tests do not establish deployed user access.'),
        'WF-001':('RUNTIME_READY' if model.get('state')=='READY' else 'MODEL_BLOCKED',model.get('state','UNKNOWN')),
        'CAT-001':('SOURCE_REVIEW_REQUIRED','Historical prices and physical stock require source evidence.'),
        'PAY-001':('PROVIDER_GATE','No real charge, order or KYC automation.'),
        'ANDROID-001':('DEVICE_TEST_REQUIRED','APK presence does not prove SDK/signature/device acceptance.'),
        'SCOPE-001':('CONNECTOR_REVIEW_REQUIRED','Account-wide reconciliation is not delegated to a local language model.'),
        'OUTPUT-001':('LOCAL_OUTPUT_READY','Reports persist in the canonical Windows control directory.')}
    for b in sorted(register.get('blockers',[]),key=lambda x:(x.get('priority','P9'),x['id'])):
        state,detail=probes.get(b['id'],('REVIEW_REQUIRED','No approved executor for this blocker.'))
        b.update(last_checked=now(),last_probe={'state':state,'detail':detail},dependency=b.get('dependency',dependencies.get(b['id'],[])))
        b.setdefault('cause',b.get('reason','UNKNOWN'));b.setdefault('evidence',[])
        b.setdefault('test','See AUTO_LATEST.json; probe is not definition-of-done acceptance.')
        b.setdefault('exact_command_or_link','Read PROMPTS/'+b['id']+'.md')
        checks.append({'id':b['id'],'priority':b.get('priority'),'state':state,'depends_on':b['dependency'],'next_action':b.get('next_action'),'release_status':b['status']})
    register['at']=now();return checks

def execute(control,work,boz,run_tests=False,run_worker=False):
    control=Path(control).resolve();work=Path(work).resolve();boz=Path(boz).resolve()
    logs=control/'AUTO_LOGS'/dt.datetime.now(TZ).strftime('%Y%m%d-%H%M%S-%f');logs.mkdir(parents=True,exist_ok=False)
    python=work/'tools'/'python-3.12.10'/'python.exe' if os.name=='nt' else Path(sys.executable)
    with exclusive(control/'automation.lock'):
        atomic(logs/'progress.json',json.dumps({'at':now(),'stage':'model_probe','state':'STARTING'}))
        summary={'schema_version':2,'at':now(),'host':socket.gethostname(),'mode':'daily' if run_tests else 'hourly','state':'COMPLETED','logs':str(logs),'tests':{},'worker':{'state':'NOT_REQUESTED'}}
        try:summary['model']=model_probe()
        except Exception as e:summary['model']={'state':'UNAVAILABLE','error_type':type(e).__name__}
        try:summary['queue_before']=queue_summary(work)
        except Exception as e:summary['queue_before']={'state':'ERROR','error_type':type(e).__name__}
        if run_tests:
            summary['tests']['workforce']=run_test('workforce-tests',[str(python),'-m','unittest','discover','-s',str(work),'-p','test*.py','-v'],logs,300)
            summary['tests']['boz']=run_test('boz-tests',[str(python),'-m','unittest','discover','-s',str(boz/'tests'),'-p','test*.py','-v'],logs,600)
            summary['tests']['automation']=run_test('automation-tests',[str(python),'-m','unittest','discover','-s',str(control/'AUTO_TESTS'),'-p','test*.py','-v'],logs,90)
            if any(t['state']!='PASS' for t in summary['tests'].values()):summary['state']='TESTS_FAILED'
        if run_worker and summary['state']=='COMPLETED':
            try:summary['worker']=worker_tick(work,python,logs,summary['model']['state']=='READY')
            except Exception as e:summary['worker']={'state':'ERROR','error_type':type(e).__name__}
        summary['queue_after']=queue_summary(work)
        register=read_json(control/'MASTER_BLOCKER_REGISTER.json')
        summary['blocker_checks']=probe_blockers(register,summary['model'],summary['queue_after'],control,work)
        atomic(control/'MASTER_BLOCKER_REGISTER.json',json.dumps(register,ensure_ascii=False,indent=2))
        summary['finished_at']=now()
        # A per-run immutable filename precedes the mutable latest pointer.
        encoded=json.dumps(summary,ensure_ascii=False,indent=2);atomic(logs/'summary.json',encoded)
        summary['evidence_sha256']=hashlib.sha256((logs/'summary.json').read_bytes()).hexdigest()
        encoded=json.dumps(summary,ensure_ascii=False,indent=2);atomic(control/'AUTO_LATEST.json',encoded)
        with (control/'AUTO_LOGS'/'AUTO_HISTORY.jsonl').open('a',encoding='utf-8') as f:f.write(json.dumps(summary,ensure_ascii=False)+'\n')
        status='# BOZ AUTO STATUS\n\n'+f"Last run: {summary['finished_at']}\nHost: {summary['host']}\nRun: {summary['state']}\nModel: {summary['model']['state']}\nWorker: {summary['worker']['state']}\n\n"
        status+='\n'.join(f"- {name}: {test['state']}; tests={test.get('count')}; exit={test.get('exit_code')}" for name,test in summary['tests'].items())
        status+='\n\nWindows interactive-user schedule; computer must be on and user logged in. No cloud 24/7 guarantee. Blocker probes do not auto-close engineering work. No production deployment, payment, account login, customer import or remote messages.\n'
        atomic(control/'AUTO_STATUS.md',status)
        with (control/'EXECUTION_JOURNAL.md').open('a',encoding='utf-8') as f:f.write(f"\n{summary['finished_at']} AUTO-{summary['mode']}: {summary['state']}; model={summary['model']['state']}; worker={summary['worker']['state']}; evidence={logs/'summary.json'}; sha256={summary['evidence_sha256']}\n")
        atomic(control/'AUTO_DASHBOARD.html','<!doctype html><html lang="ms"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>BOZ Automation</title><style>body{background:#091510;color:#ceffdf;font:16px system-ui;margin:24px}pre{white-space:pre-wrap}a{color:#64efb0}</style><h1>BOZ — Automasi setempat</h1><a href="AUTO_STATUS.md">Status</a> · <a href="MASTER_BLOCKER_REGISTER.json">Blocker</a> · <a href="NEXT_RESUME.md">Resume</a> · <a href="MASTER_RECOVERY_AUTOMATION_PROMPT.md">Prompt penuh</a><p>Snapshot laporan terakhir. Income: belum disahkan. Tiada pelaksanaan satu klik dari halaman ini.</p><pre>'+html.escape(encoded)+'</pre></html>')
        print(json.dumps({'state':summary['state'],'model':summary['model'],'tests':summary['tests'],'worker':summary['worker'],'at':summary['finished_at']},ensure_ascii=False))
        return 0 if summary['state']=='COMPLETED' else 1
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--control',default=r'D:\TELCOHAUZ_BOS\00_CONTROL_CENTER');p.add_argument('--work',default=r'D:\TELCOHAUZ_BOZ_AI_WORKFORCE');p.add_argument('--boz',default=r'D:\BOZ');p.add_argument('--run-tests',action='store_true');p.add_argument('--run-worker',action='store_true');a=p.parse_args()
    try:sys.exit(execute(a.control,a.work,a.boz,a.run_tests,a.run_worker))
    except Exception as e:
        result={'state':'SKIPPED_CONCURRENT' if str(e)=='Another automation run holds the lock' else 'FAILED','error_type':type(e).__name__,'at':now()}
        failure=Path(a.control)/'AUTO_LOGS'/'AUTO_FAILURES.jsonl'
        failure.parent.mkdir(parents=True,exist_ok=True)
        with failure.open('a',encoding='utf-8') as f:f.write(json.dumps(result)+'\n')
        print(json.dumps(result));sys.exit(0 if result['state']=='SKIPPED_CONCURRENT' else 2)
