import importlib.util, json, os, sqlite3, sys, tempfile, unittest
from pathlib import Path
from unittest.mock import patch
from urllib.error import HTTPError, URLError
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
import boz_automation as a
wp=Path(r'D:\TELCOHAUZ_BOZ_AI_WORKFORCE\workforce.py') if os.name=='nt' and Path(r'D:\TELCOHAUZ_BOZ_AI_WORKFORCE\workforce.py').exists() else Path(__file__).resolve().parents[1]/'workforce.py'
spec=importlib.util.spec_from_file_location('autotest_worker',wp);w=importlib.util.module_from_spec(spec);spec.loader.exec_module(w)
class AutomationTests(unittest.TestCase):
 def test_retries_transient_but_not_403(self):
  with patch.object(a.time,'sleep'),patch('builtins.print'):
   fn=unittest.mock.Mock(side_effect=[URLError('offline'),'ok']);self.assertEqual(a.transient_retry(fn),'ok');self.assertEqual(fn.call_count,2)
   fn=unittest.mock.Mock(side_effect=HTTPError('https://example.test',403,'denied',None,None))
   with self.assertRaises(HTTPError):a.transient_retry(fn)
   self.assertEqual(fn.call_count,1)
 def test_retry_limit(self):
  fn=unittest.mock.Mock(side_effect=URLError('offline'))
  with patch.object(a.time,'sleep'):
   with self.assertRaises(URLError):a.transient_retry(fn)
  self.assertEqual(fn.call_count,3)
 def test_single_instance_lock(self):
  with tempfile.TemporaryDirectory() as d:
   p=Path(d)/'lock'
   with a.exclusive(p):
    with self.assertRaises(RuntimeError):
     with a.exclusive(p):pass
   with a.exclusive(p):pass
 def test_model_thinking_not_accepted(self):
  with patch.object(a,'local_json',side_effect=[{'models':[{'name':a.MODEL}]},{'response':'','thinking':'not an answer'}]):
   self.assertEqual(a.model_probe()['state'],'EMPTY_RESPONSE')
 def test_model_answer_is_hashed(self):
  with patch.object(a,'local_json',side_effect=[{'models':[{'name':a.MODEL,'size':123}]},{'response':'READY'}]):
   result=a.model_probe();self.assertEqual(result['state'],'READY');self.assertNotIn('READY',result['response_sha256'])
 def test_probes_preserve_blocker_status_and_independent_work(self):
  register={'blockers':[{'id':'AUTH-001','priority':'P1','status':'OPEN'},{'id':'OUTPUT-001','priority':'P1','status':'OPEN'},{'id':'WF-001','priority':'P1','status':'OPEN'}]}
  checks=a.probe_blockers(register,{'state':'UNAVAILABLE'},{},Path('.'),Path('.'))
  self.assertEqual(len(checks),3);self.assertTrue(all(b['status']=='OPEN' for b in register['blockers']));self.assertEqual(checks[0]['depends_on'],['SEC-002','SEC-003'])
 def test_missing_model_still_records_audit_and_checkpoint(self):
  with tempfile.TemporaryDirectory() as d:
   root=Path(d);(root/'MASTER_BLOCKER_REGISTER.json').write_text('{"blockers":[]}')
   with patch.object(a,'model_probe',side_effect=URLError('offline')),patch('builtins.print'):
    self.assertEqual(a.execute(root,root/'work',root/'boz'),0)
   latest=a.read_json(root/'AUTO_LATEST.json');self.assertEqual(latest['model']['state'],'UNAVAILABLE');self.assertTrue((root/'AUTO_DASHBOARD.html').exists())
class WorkerGates(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();w.ROOT=Path(self.tmp.name);w.DB=w.ROOT/'queue.sqlite3';w.init()
 def tearDown(self):self.tmp.cleanup()
 def job(self,id,kind='inventory',**kw):
  j={'id':id,'role':'operations','kind':kind,'classification':'public'};j.update(kw);w.enqueue(j)
 def status(self,id):
  with w.conn() as c:return c.execute('select status from jobs where id=?',(id,)).fetchone()[0]
 def test_model_outage_does_not_block_inventory_behind_draft(self):
  self.job('draft',kind='draft',role='hr');self.job('inventory');self.assertTrue(w.tick(allow_drafts=False));self.assertEqual(self.status('draft'),'queued');self.assertEqual(self.status('inventory'),'done')
 def test_paid_sensitive_encrypted_production_require_approval(self):
  for field in ['paid','sensitive','encrypted','production','requires_approval']:
   self.job(field,**{field:True});self.assertEqual(self.status(field),'approval_required')
 def test_tampered_queued_job_is_rechecked(self):
  self.job('tampered')
  with w.conn() as c:
   payload=json.loads(c.execute('select payload from jobs where id=?',('tampered',)).fetchone()[0]);payload['paid']=True;c.execute('update jobs set payload=? where id=?',(json.dumps(payload),'tampered'))
  w.tick();self.assertEqual(self.status('tampered'),'blocked')

class LockPermissionTests(unittest.TestCase):
 def test_process_query_error_does_not_archive_lock(self):
  from types import SimpleNamespace
  with tempfile.TemporaryDirectory() as d:
   work=Path(d);(work/'worker.lock').write_text('123');python=work/'python.exe'
   with patch.object(a.os,'name','nt'),patch.object(a.subprocess,'run',return_value=SimpleNamespace(returncode=0,stdout='',stderr='Access denied')):
    self.assertEqual(a.worker_lock_status(work,python),'UNVERIFIED_LOCK')
   self.assertTrue((work/'worker.lock').exists())

class RunDirectoryTests(unittest.TestCase):
 def test_same_wall_clock_does_not_reuse_existing_log_folder(self):
  with tempfile.TemporaryDirectory() as d,patch.object(a.dt,'datetime') as clock:
   clock.now.return_value.strftime.return_value='frozen-'
   first=a.new_run_logs(Path(d));(first/'evidence.txt').write_text('preserved')
   second=a.new_run_logs(Path(d))
   self.assertNotEqual(first,second);self.assertEqual((first/'evidence.txt').read_text(),'preserved')
 def test_parallel_runs_with_same_timestamp_get_distinct_folders(self):
  from concurrent.futures import ThreadPoolExecutor
  with tempfile.TemporaryDirectory() as d,patch.object(a.dt,'datetime') as clock:
   clock.now.return_value.strftime.return_value='frozen-';root=Path(d)
   with ThreadPoolExecutor(max_workers=4) as pool:folders=list(pool.map(lambda _:a.new_run_logs(root),range(8)))
   self.assertEqual(len(set(folders)),8);self.assertTrue(all(p.is_dir() for p in folders))
