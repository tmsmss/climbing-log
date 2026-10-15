// Uses existing Playwright and Python installations; installs nothing.
// node tests/browser-check.mjs <playwright-module-path> <python-executable> [browser-executable]
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { readFile } from 'node:fs/promises';
import { planFixture, backupFixture } from './fixture.mjs';
const { chromium } = await import(pathToFileURL(process.argv[2]).href);
const serverCode = `import http.server,os
os.chdir('web')
class Handler(http.server.SimpleHTTPRequestHandler):
 def do_GET(self):
  if self.path.startswith('/climbing-log/'): self.path=self.path[len('/climbing-log'):]
  super().do_GET()
 def log_message(self,*args): pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),Handler)
print(server.server_port,flush=True)
server.serve_forever()`;
const server = spawn(process.argv[3], ['-u', '-c', serverCode], { windowsHide: true });
let browser;
try {
  const port = await new Promise((resolve, reject) => { server.stdout.once('data', chunk => resolve(Number(chunk.toString().trim()))); server.once('error', reject); server.once('exit', () => reject(new Error('Server failed'))); });
  browser = await chromium.launch({...(process.argv[4] ? {executablePath:process.argv[4]} : {channel:'msedge'}),headless:true});
  const context = await browser.newContext({viewport:{width:390,height:844},acceptDownloads:true});
  context.setDefaultTimeout(10000);
  const page = await context.newPage(), errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const url = `http://127.0.0.1:${port}/climbing-log/`;
  const go = async hash => { await page.evaluate(hash => { location.hash = hash; }, hash); await page.waitForTimeout(150); };
  const saved = () => page.waitForFunction(() => document.getElementById('save-status').textContent === 'Dati salvati sul dispositivo');
  const dbCall = (method, args = []) => page.evaluate(async ({method,args}) => { const db = await import('./db.js'); return db[method](...args); }, {method,args});
  await page.goto(url); await page.locator('#empty-view').waitFor({state:'visible'});
  await go('manage');
  const fixture = planFixture();
  await page.locator('#plan-file').setInputFiles({name:'plan.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(fixture))});
  await page.locator('#view-title').filter({hasText:'Scheda di esempio'}).waitFor();
  await page.locator('#start-session').click(); await page.waitForFunction(() => location.hash === '#session');
  await page.locator('.state-button').first().waitFor({state:'visible'});
  await page.locator('.expand-button').first().click();
  assert.equal(await page.locator('.plan-notes p:last-child').first().isVisible(), true);
  assert.equal(await page.locator('.plan-notes summary').count(), 0);
  assert.equal(await page.locator('.previous-notes:not([hidden])').count(), 0);
  await page.locator('textarea').first().fill('3 serie da 8 <b>letterale</b>'); await saved();
  await page.locator('.state-button').first().click(); await saved();
  await page.reload(); await page.locator('.state-button[data-state="completed"]').waitFor();
  await page.locator('.expand-button').first().click();
  assert.equal(await page.locator('textarea').first().inputValue(), '3 serie da 8 <b>letterale</b>');
  assert.equal(await page.locator('#exercises b').count(), 0);
  await page.locator('.state-button').nth(1).click(); await page.locator('.state-button').nth(1).click(); await saved();
  await page.locator('#complete-phase').click(); await saved();
  await page.locator('#undo-phase').click(); await saved();
  assert.equal(await page.locator('.state-button').nth(1).getAttribute('data-state'), 'skipped');
  // Simulated write failure: input survives re-render, and retry really persists it.
  await page.evaluate(() => {
    const original = IDBDatabase.prototype.transaction;
    IDBDatabase.prototype.transaction = function(names, mode, ...args) {
      if (mode === 'readwrite') { IDBDatabase.prototype.transaction = original; throw new DOMException('Quota di prova', 'QuotaExceededError'); }
      return original.call(this,names,mode,...args);
    };
  });
  await page.locator('textarea').first().fill('Testo dopo errore');
  await page.locator('#error-panel').waitFor({state:'visible'});
  await page.locator('.expand-button').first().click(); await page.locator('.expand-button').first().click();
  assert.equal(await page.locator('textarea').first().inputValue(), 'Testo dopo errore');
  await page.locator('#retry-save').click(); await saved();
  await page.locator('[data-phase="3"]').click(); await page.waitForTimeout(200);
  await page.reload(); await page.waitForFunction(() => document.getElementById('phase-title').textContent.startsWith('VOL'));
  // Optional, compact phase ratings: no default, persisted separately from completion.
  assert.equal(await page.locator('#section-fatigue').inputValue(), '');
  assert.equal(await page.locator('#fatigue-label').textContent(), 'Stanchezza fine vol');
  await page.locator('#section-fatigue').selectOption('7'); await saved();
  await page.locator('#complete-phase').click(); await saved();
  assert.equal(await page.locator('#section-fatigue').inputValue(), '7');
  await page.locator('#undo-phase').click(); await saved();
  await page.reload(); await page.locator('#fatigue-field').waitFor({state:'visible'});
  assert.equal(await page.locator('#section-fatigue').inputValue(), '7');
  await page.locator('#section-fatigue').selectOption(''); await saved();
  assert.deepEqual((await dbCall('readAll')).sessions[0].sectionFatigue, []);
  // A failed fatigue write survives navigation and can be retried.
  await page.evaluate(() => {
    const original = IDBDatabase.prototype.transaction;
    IDBDatabase.prototype.transaction = function(names, mode, ...args) {
      if (mode === 'readwrite') { IDBDatabase.prototype.transaction = original; throw new Error('Errore stanchezza di prova'); }
      return original.call(this,names,mode,...args);
    };
  });
  await page.locator('#section-fatigue').selectOption('8');
  await page.locator('#error-panel').waitFor({state:'visible'});
  await go('history'); await page.locator('#retry-save').click(); await saved();
  await go('session');
  assert.equal(await page.locator('#section-fatigue').inputValue(), '8');
  await page.locator('[data-phase="4"]').click();
  await page.locator('#section-fatigue').selectOption('1'); await saved();
  await page.locator('[data-phase="5"]').click();
  await page.locator('#section-fatigue').selectOption('10'); await saved();
  const ratedSession = (await dbCall('readAll')).sessions[0];
  console.log('PASS optional fatigue, persistence and write retry');
  assert.deepEqual(ratedSession.sectionFatigue, [{sectionId:'vol',value:8},{sectionId:'circ',value:1},{sectionId:'blc',value:10}]);
  for (const [sectionId,value] of [['vol',0],['vol',11],['risc',5],['missing',null]]) {
    assert.equal(await page.evaluate(async args => {
      try { await (await import('./db.js')).updateSectionFatigue(...args); return false; } catch { return true; }
    }, [ratedSession.id,sectionId,value]), true);
  }
  // Concurrent browser tabs must converge to the single existing active session.
  const active = (await dbCall('readAll')).sessions[0];
  const other = await context.newPage(); await other.goto(url);
  const second = await other.evaluate(async planId => (await import('./db.js')).startSession(planId), fixture.plan.id);
  assert.equal(second.id, active.id);
  assert.equal((await dbCall('readAll')).sessions.length, 1);
  // Duplicate import aborts both plan and activation writes.
  const before = await dbCall('backup');
  assert.equal(await page.evaluate(async fixture => { try { await (await import('./db.js')).importPlan(fixture); return false; } catch { return true; } }, fixture), true);
  const after = await dbCall('backup'); delete before.exportedAt; delete after.exportedAt; assert.deepEqual(after,before);
  // Force an abort after clearing some stores: full restore must roll back.
  assert.equal(await page.evaluate(async () => {
    const db = await import('./db.js'), value = await db.backup(), original = IDBObjectStore.prototype.add;
    IDBObjectStore.prototype.add = function(...args) { if (this.name === 'records') throw new Error('Restore failure'); return original.apply(this,args); };
    try { await db.restore(value); return false; } catch { return true; } finally { IDBObjectStore.prototype.add = original; }
  }), true);
  const rollback = await dbCall('backup'); delete rollback.exportedAt; assert.deepEqual(rollback, before);
  await page.locator('#finish-session').click(); await page.locator('#confirm-finish').click();
  await page.waitForFunction(() => location.hash.startsWith('#detail/'));
  await page.locator('#view-title').filter({hasText:'Sessione terminata'}).waitFor();
  const completed = await dbCall('backup');
  assert.equal(completed.sessions[0].status,'completed');
  assert.equal(completed.schemaVersion,2);
  assert.deepEqual(completed.sessions[0].sectionFatigue,ratedSession.sectionFatigue);
  assert.ok(completed.sessions[0].endedAt);
  assert.equal(completed.records.find(r => r.exerciseId === fixture.exercises[0].id).resultText,'Testo dopo errore');
  assert.ok(!completed.records.some(r => r.exerciseId === fixture.exercises[2].id));
  assert.equal(await page.locator('.state-button:not([disabled])').count(),0);
  await page.locator('[data-phase="5"]').click();
  assert.equal(await page.locator('#fatigue-value').textContent(),'10/10');
  await go('history'); await page.locator('#history-list a').click();
  await page.locator('#view-title').filter({hasText:'Sessione terminata'}).waitFor();
  await go('manage');
  const downloading = page.waitForEvent('download'); await page.locator('#export-backup').click();
  const download = await downloading;
  const exported = JSON.parse(await readFile(await download.path(),'utf8'));
  assert.equal(exported.sessions[0].status,'completed');
  await page.locator('#backup-file').setInputFiles({name:'restore.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(exported))});
  await page.locator('#restore-panel').waitFor({state:'visible'});
  assert.equal(await page.locator('#confirm-restore').isDisabled(),true);
  const preventive = page.waitForEvent('download'); await page.locator('#preventive-backup').click(); await preventive;
  page.once('dialog', dialog => dialog.accept()); await page.locator('#confirm-restore').click();
  await page.locator('#restore-panel').waitFor({state:'hidden'});
  assert.equal((await dbCall('backup')).sessions[0].id,exported.sessions[0].id);
  // Synthetic history: skip newer empty notes, never cross plan versions.
  const history = structuredClone(exported), old = history.sessions[0], volExercise = fixture.exercises.find(e => e.sectionId === 'vol');
  old.startedAt = '2026-10-08T10:00:00Z'; old.endedAt = '2026-10-08T12:00:00Z'; old.localDate = '2026-10-08';
  history.sessions.push({...old,id:'newer-empty',startedAt:'2026-10-09T10:00:00Z',endedAt:'2026-10-09T12:00:00Z',localDate:'2026-10-09'});
  history.records = history.records.filter(r => !(r.sessionId === old.id && r.exerciseId === volExercise.id));
  history.records.push({id:'previous-vol',sessionId:old.id,exerciseId:volExercise.id,status:'completed',resultText:'6a e 6a+ <b>nota precedente</b>',sets:[],updatedAt:old.endedAt});
  const different = planFixture(); different.plan.id = 'different-plan'; different.plan.revision = 2; different.plan.previousPlanId = fixture.plan.id;
  different.exercises = different.exercises.map(e => ({...e,id:`different-${e.id}`,planId:different.plan.id}));
  history.plans.push(different.plan); history.exercises.push(...different.exercises);
  history.sessions.push({...old,id:'other-plan-session',planId:different.plan.id,sectionFatigue:[]});
  history.records.push({id:'other-plan-note',sessionId:'other-plan-session',exerciseId:`different-${volExercise.id}`,status:'completed',resultText:'Nota di altra scheda',sets:[],updatedAt:old.endedAt});
  await dbCall('restore',[history]);
  console.log('Synthetic history restored');
  await go('plan');
  console.log('PASS persistence, history, backup, restore; checking offline');
  await page.waitForFunction(() => document.getElementById('offline-status').textContent.includes('pronta'));
  await page.reload(); await page.locator('#view-title').filter({hasText:'Scheda di esempio'}).waitFor();
  await context.setOffline(true); await page.reload();
  console.log('Offline reload completed');
  await page.locator('#view-title').filter({hasText:'Scheda di esempio'}).waitFor();
  await page.locator('#start-session').click(); await page.locator('#view-title').filter({hasText:'Sessione in corso'}).waitFor();
  await page.locator('.expand-button').first().click(); await page.locator('textarea').first().fill('Salvato offline'); await saved();
  await page.reload(); await page.locator('.expand-button').first().click();
  assert.equal(await page.locator('textarea').first().inputValue(),'Salvato offline');
  await page.locator('[data-phase="3"]').click();
  await page.locator('.expand-button').first().click();
  await page.locator('.previous-notes summary').first().click();
  assert.equal(await page.locator('.previous-date').first().textContent(),'Ultime note · 2026-10-08');
  assert.equal(await page.locator('.previous-text').first().textContent(),'6a e 6a+ <b>nota precedente</b>');
  assert.equal(await page.locator('.previous-text b').count(),0);
  assert.equal(await page.locator('textarea').first().inputValue(),'');
  assert.equal(await page.locator('.previous-text').nth(1).textContent(),'Nessuna nota precedente per questo esercizio con questa scheda.');
  console.log('PASS previous notes with same-plan restriction and empty-note fallback');
  await page.locator('#section-fatigue').selectOption('6'); await saved();
  // Each detail and the active session retain their own phase, panels and scroll.
  await go(`detail/${old.id}`);
  await page.locator('[data-phase="1"]').click();
  for (const button of await page.locator('.expand-button').all()) await button.click();
  await page.evaluate(() => window.scrollTo(0,200));
  const detailScroll = await page.evaluate(() => scrollY);
  await go('session');
  assert.ok((await page.locator('#phase-title').textContent()).startsWith('VOL'));
  assert.equal(await page.locator('.expand-button').first().getAttribute('aria-expanded'),'true');
  assert.equal(await page.locator('.previous-notes').first().getAttribute('open'),'');
  assert.equal(await page.locator('#section-fatigue').inputValue(),'6');
  await go(`detail/${old.id}`);
  assert.ok((await page.locator('#phase-title').textContent()).startsWith('MOB'));
  assert.equal(await page.locator('.expand-button[aria-expanded="true"]').count(),6);
  assert.ok(Math.abs(await page.evaluate(() => scrollY) - detailScroll) < 2);
  await go('session'); await page.locator('#menu-button').click();
  await page.locator('#main-menu a[data-history]').click();
  assert.equal(await page.evaluate(() => location.hash),`#detail/${old.id}`);
  await page.locator('#all-sessions').click(); await page.locator('#history-view').waitFor({state:'visible'});
  await go('session');
  // Retry from a past detail still writes to the active session only.
  await page.locator('[data-phase="3"]').click();
  await page.evaluate(() => {
    const original = IDBDatabase.prototype.transaction;
    IDBDatabase.prototype.transaction = function(names, mode, ...args) {
      if (mode === 'readwrite') { IDBDatabase.prototype.transaction = original; throw new Error('Errore di prova'); }
      return original.call(this,names,mode,...args);
    };
  });
  await page.locator('#section-fatigue').selectOption('9'); await page.locator('#error-panel').waitFor({state:'visible'});
  await go(`detail/${old.id}`); await page.locator('#retry-save').click(); await saved();
  assert.deepEqual((await dbCall('readAll')).sessions.find(s=>s.id===old.id).sectionFatigue,ratedSession.sectionFatigue);
  await go('session'); assert.equal(await page.locator('#section-fatigue').inputValue(),'9');
  console.log('PASS independent history navigation and retry from historical detail');
  console.log('Offline save/resume completed; checking responsive layout');
  for (const colorScheme of ['light','dark']) {
    await page.emulateMedia({colorScheme});
    for (const width of [320,390,736]) {
      await page.setViewportSize({width,height:844});
      for (let phase = 0; phase < 6; phase++) {
        const layout = await page.evaluate(phase => {
          document.querySelector(`[data-phase="${phase}"]`).click();
          const expand = document.querySelector('.expand-button');
          if (expand.getAttribute('aria-expanded') === 'false') expand.click();
          const select = document.getElementById('section-fatigue');
          return {count:document.querySelectorAll('.exercise').length, fits:document.documentElement.scrollWidth <= innerWidth,
            touchTarget:select.hidden || select.closest('[hidden]') || select.getBoundingClientRect().height >= 44};
        },phase);
        assert.equal(layout.count,[2,6,3,3,2,3][phase]);
        assert.ok(layout.fits); assert.ok(layout.touchTarget);
      }
    }
  }
  await page.setViewportSize({width:390,height:844}); await page.locator('[data-phase="1"]').click();
  await page.screenshot({path:'local/session-check.png',fullPage:true});
  await page.locator('[data-phase="3"]').click();
  if (await page.locator('.expand-button').first().getAttribute('aria-expanded') === 'false') await page.locator('.expand-button').first().click();
  await page.screenshot({path:'local/training-ux-check.png',fullPage:true});
  await context.setOffline(false);
  // Existing IndexedDB v1 data has no fatigue field; loading must preserve it.
  const legacyContext = await browser.newContext({viewport:{width:390,height:844}}), legacyPage = await legacyContext.newPage();
  legacyPage.on('pageerror', e => errors.push(e.message));
  await legacyPage.goto(url); await legacyPage.locator('#empty-view').waitFor({state:'visible'});
  await legacyPage.evaluate(async legacy => {
    await (await import('./db.js')).restore(legacy);
    const db = await (await import('./db.js')).openDatabase();
    await new Promise((resolve,reject) => {
      const tx = db.transaction('sessions','readwrite'), store = tx.objectStore('sessions'), item = {...legacy.sessions[0]};
      store.put(item); tx.oncomplete = resolve; tx.onabort = () => reject(tx.error);
    });
  },backupFixture());
  await legacyPage.goto(`${url}#session`); await legacyPage.locator('.state-button').first().waitFor({state:'visible'});
  await legacyPage.locator('.expand-button').first().click();
  assert.equal(await legacyPage.locator('textarea').first().inputValue(),'<b>literal text</b>');
  await legacyPage.locator('[data-phase="3"]').click();
  assert.equal(await legacyPage.locator('#section-fatigue').inputValue(),'');
  assert.equal(await legacyPage.locator('.previous-notes:not([hidden])').count(),0);
  await legacyPage.locator('#section-fatigue').selectOption('5');
  await legacyPage.waitForFunction(() => document.getElementById('save-status').textContent === 'Dati salvati sul dispositivo');
  const legacyBackup = await legacyPage.evaluate(async () => (await import('./db.js')).backup());
  assert.equal(legacyBackup.schemaVersion,2);
  assert.equal(legacyBackup.records[0].resultText,'<b>literal text</b>');
  assert.deepEqual(legacyBackup.sessions[0].sectionFatigue,[{sectionId:'vol',value:5}]);
  await legacyContext.close();
  assert.deepEqual(errors,[]);
  console.log('PASS: immediate notes; optional fatigue, clear/reload/retry/history/export; previous notes restricted to same plan with literal text; independent navigation and scroll; existing v1 data and backups; original persistence/rollback/offline checks; six phases at 320/390/736 in light/dark. Android not tested.');
} catch (error) { console.error(error); throw error; }
finally { await browser?.close(); server.kill(); }
