import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','3030'], {stdio:['ignore','pipe','pipe']});
let log = ''; server.stdout.on('data',b=>log+=b); server.stderr.on('data',b=>log+=b);
let browser;
try {
  let ready = false;
  for (let i=0;i<60;i++) {
    try { if ((await fetch('http://127.0.0.1:3030/catalog')).ok) { ready=true; break; } } catch {}
    await new Promise(resolve=>setTimeout(resolve,500));
  }
  assert.ok(ready,'web server starts');
  browser = await chromium.launch({headless:true, ...(process.env.BROWSER_EXECUTABLE_PATH ? {executablePath:process.env.BROWSER_EXECUTABLE_PATH}:{}), args:['--no-sandbox']});
  const page = await browser.newPage(); const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:3030/catalog');
  await page.getByRole('heading',{name:'Pilihan produk, di satu tempat.'}).waitFor();
  await page.locator('main[data-ready="true"]').waitFor();
  await page.getByLabel('Cari produk').fill('unifi');
  await page.waitForTimeout(200);
  assert.ok((await page.locator('article').count())>0);
  assert.equal(await page.getByRole('button',{name:/Mohon/}).count(),0);
  await page.getByLabel('Saluran').selectOption('hero');
  assert.equal(await page.getByRole('button',{name:/Mohon/}).count(),0);
  await page.getByLabel('Cari produk').fill('no-such-product');
  await page.getByText(/Tiada produk sepadan/).waitFor();
  await page.goto('http://127.0.0.1:3030/master-products');
  await page.getByRole('button',{name:'Log masuk BOZ',exact:true}).waitFor();
  assert.equal(await page.locator('tbody tr').count(),0,'private master records absent before login');
  await page.goto('http://127.0.0.1:3030/workspace');
  await page.getByRole('link',{name:/Buka POS Kedai/}).waitFor();
  await page.getByRole('link',{name:/Buka Telcohauz Market/}).waitFor();
  await page.goto('http://127.0.0.1:3030/pos');
  await page.getByRole('heading',{name:'Point of Sale Kedai'}).waitFor();
  await page.getByRole('button',{name:'Log masuk POS'}).waitFor();
  assert.equal(await page.getByRole('button',{name:'Rekod jualan tunai'}).count(),0,'anonymous user cannot checkout');
  await page.goto('http://127.0.0.1:3030/market');
  await page.getByRole('heading',{name:'Marketplace Telcohauz'}).waitFor();
  await page.getByRole('link',{name:'Buka laman Market yang dipilih'}).waitFor();
  await page.setViewportSize({width:390,height:844});
  await page.goto('http://127.0.0.1:3030/catalog');
  await page.getByLabel('Cari produk').waitFor();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth),false,'mobile page fits viewport');
  assert.deepEqual(errors,[]);
  console.log('PASS: catalog, HERO hold, private login, unified workspace, anonymous POS checkout restriction, market route, mobile width and no page errors.');
} catch (error) { console.error(error); console.error(log.slice(-2500)); process.exitCode=1; }
finally { await browser?.close(); server.kill(); }
