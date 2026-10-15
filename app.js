import * as db from './db.js';
import { validateBackup, validatePlanFile, fatigueCode } from './data.js';
const $ = id => document.getElementById(id);
const states = ['pending', 'completed', 'skipped'];
const symbols = { pending: '□', completed: '✓', skipped: '×' };
const labels = { pending: 'da fare', completed: 'completato', skipped: 'saltato' };
let data, plan, session, sections = [], exercises = [], records = new Map();
let sectionIndex = 0, undo = null, writing = 0, blocked = false, ready = false, closing = false;
let writeQueue = Promise.resolve(), restoreData = null, preventiveDownloaded = false;
const unsaved = new Map(), unsavedFatigue = new Map(), viewStates = new Map();
let expanded = new Set(), previousNotesOpen = new Set(), renderedKey = null, lastHistoryHash = '#history', pendingSessionId = null;
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
const hasUnsaved = () => unsaved.size > 0 || unsavedFatigue.size > 0;
const view = () => location.hash.slice(1).split('/')[0] || 'plan';
const editable = () => view() === 'session' && session?.status === 'in_progress';
const sectionExercises = () => exercises.filter(e => e.sectionId === sections[sectionIndex]?.id);
const announce = text => { $('announcements').textContent = text; };
function error(error) {
  $('error-panel').hidden = false;
  $('error-message').textContent = `${error.message || error} I dati già salvati restano sul dispositivo.`;
  $('retry-save').hidden = !hasUnsaved() && !blocked;
}
function saveStatus() {
  $('save-status').textContent = blocked || hasUnsaved() && !writing ? 'Modifiche da salvare' : writing ? 'Salvataggio…' : 'Dati salvati sul dispositivo';
  $('retry-save').hidden = (!hasUnsaved() && !blocked) || writing > 0;
}
function setMenu(open) {
  $('main-menu').hidden = !open;
  $('menu-button').setAttribute('aria-expanded', String(open));
  $('menu-button').setAttribute('aria-label', open ? 'Chiudi menu' : 'Apri menu');
}
function secondsLabel(value) { return value % 60 === 0 && value > 0 ? `${value / 60}′` : `${value}″`; }
function prescriptionLabel(p) {
  return [p.sets != null ? `${p.sets} serie` : '', p.repsText || (p.durationSeconds != null ? secondsLabel(p.durationSeconds) : ''),
    p.restBetweenRepsSeconds != null ? `pausa rip. ${secondsLabel(p.restBetweenRepsSeconds)}` : '',
    p.restSeconds != null ? `pausa serie ${secondsLabel(p.restSeconds)}` : '', p.instructions].filter(Boolean).join(' · ');
}
function clearSaved(patches) {
  for (const patch of patches) {
    const pending = unsaved.get(patch.exerciseId);
    if (!pending) continue;
    for (const key of ['status', 'resultText']) if (patch[key] !== undefined && pending[key] === patch[key]) delete pending[key];
    if (pending.status === undefined && pending.resultText === undefined) unsaved.delete(patch.exerciseId);
  }
}
function persist(patches, sessionId = session.id) {
  pendingSessionId = sessionId;
  for (const patch of patches) unsaved.set(patch.exerciseId, { ...unsaved.get(patch.exerciseId), ...patch });
  return enqueueWrite(async () => { await db.updateRecords(sessionId, patches); clearSaved(patches); });
}
function persistFatigue(sectionId, value, sessionId = session.id) {
  pendingSessionId = sessionId;
  unsavedFatigue.set(sectionId, value);
  return enqueueWrite(async () => {
    await db.updateSectionFatigue(sessionId, sectionId, value);
    if (unsavedFatigue.get(sectionId) === value) unsavedFatigue.delete(sectionId);
  });
}
function enqueueWrite(work) {
  writing++; saveStatus();
  writeQueue = writeQueue.then(async () => {
    if (blocked) return;
    try { await work(); }
    catch (failure) { blocked = true; error(failure); }
  }).finally(() => { writing--; saveStatus(); });
  return writeQueue;
}
async function flush() {
  await writeQueue;
  if (hasUnsaved() || blocked) throw new Error('Ci sono modifiche non salvate. Premi «Riprova salvataggio» prima di continuare.');
}
async function action(work) {
  if (!ready || closing) return;
  closing = true;
  try { await flush(); $('error-panel').hidden = true; await work(); }
  catch (failure) { error(failure); }
  finally { closing = false; }
}
function rememberView() {
  if (!renderedKey) return;
  viewStates.set(renderedKey, { sectionId: sections[sectionIndex]?.id, expanded, previousNotesOpen, scrollY: window.scrollY });
}
async function refresh() {
  data = await db.readAll();
  const kind = view();
  session = kind === 'detail' ? data.sessions.find(s => s.id === location.hash.split('/')[1]) : data.sessions.find(s => s.status === 'in_progress');
  const planId = ['session', 'detail'].includes(kind) && session ? session.planId : data.settings.find(s => s.key === 'activePlanId')?.value;
  plan = data.plans.find(p => p.id === planId);
  sections = [...(plan?.sections || [])].sort((a, b) => a.order - b.order);
  exercises = data.exercises.filter(e => e.planId === plan?.id).sort((a, b) => a.order - b.order);
  renderedKey = ['session', 'detail'].includes(kind) ? `${kind}/${session?.id}` : kind === 'plan' ? `plan/${plan?.id}` : kind;
  const state = viewStates.get(renderedKey);
  const sectionId = state?.sectionId ?? (kind === 'session' ? session?.lastSectionId : null);
  sectionIndex = Math.max(0, sections.findIndex(s => s.id === sectionId));
  expanded = state?.expanded ?? new Set(); previousNotesOpen = state?.previousNotesOpen ?? new Set();
  if (kind === 'detail' && session) lastHistoryHash = `#detail/${session.id}`;
  records = new Map(exercises.map(e => {
    const record = data.records.find(r => r.sessionId === session?.id && r.exerciseId === e.id);
    return [e.id, { status: 'pending', resultText: '', ...record, ...(editable() ? unsaved.get(e.id) : {}) }];
  }));
  render();
  window.scrollTo({ top: state?.scrollY ?? 0, behavior: 'instant' });
}
function render() {
  const kind = view(), work = ['plan', 'session', 'detail'].includes(kind);
  const showResults = ['session', 'detail'].includes(kind) && !!session;
  $('workout-view').hidden = !work || !plan || (kind === 'detail' && !session);
  $('empty-view').hidden = !work || !!plan;
  $('history-view').hidden = kind !== 'history';
  $('manage-view').hidden = kind !== 'manage';
  $('all-sessions').hidden = kind !== 'detail';
  $('main-menu').querySelector('a[data-history]').href = lastHistoryHash;
  $('main-menu').querySelectorAll('a').forEach(link => {
    if ((link.hasAttribute('data-history') && ['history', 'detail'].includes(kind)) || link.hash === `#${kind}`) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  if (kind === 'history') renderHistory();
  if (kind === 'manage') renderPlans();
  if (!work || !plan) return;
  $('view-title').textContent = showResults ? (editable() ? 'Sessione in corso' : 'Sessione terminata') : plan.title;
  $('view-description').textContent = [showResults ? plan.title : '', plan.focus, plan.scheduleText].filter(Boolean).join(' · ');
  $('session-date').hidden = !showResults;
  $('session-date').textContent = showResults ? `${session.localDate} · ${new Date(session.startedAt).toLocaleTimeString('it-IT', {hour:'2-digit',minute:'2-digit'})}` : '';
  $('start-session').hidden = kind === 'detail' || editable();
  $('start-session').textContent = session?.status === 'in_progress' ? 'Riprendi sessione' : 'Avvia sessione';
  $('state-help').hidden = !editable();
  $('phase-actions').hidden = !editable();
  $('finish-session').hidden = !editable();
  $('finish-panel').hidden = true;
  const phase = sections[sectionIndex];
  $('phase-title').textContent = `${phase.code || ''} · ${phase.title}`;
  $('phase-navigation').replaceChildren();
  sections.forEach((section, index) => {
    const list = exercises.filter(e => e.sectionId === section.id);
    const done = list.filter(e => records.get(e.id).status === 'completed').length;
    const skipped = list.filter(e => records.get(e.id).status === 'skipped').length;
    const button = document.createElement('button'); button.type = 'button'; button.dataset.phase = index;
    button.setAttribute('aria-pressed', String(index === sectionIndex));
    button.setAttribute('aria-label', `${section.title}${showResults ? `, ${done} completati e ${skipped} saltati` : ''}`);
    button.append(document.createTextNode(section.code || section.title));
    const count = document.createElement('small');
    count.textContent = showResults ? `${done}/${list.length}${skipped ? ` · ${skipped} ×` : ''}` : `${list.length} esercizi`;
    button.append(count); $('phase-navigation').append(button);
  });
  $('exercises').replaceChildren();
  const previousSessions = editable() ? data.sessions.filter(s => s.planId === session.planId && s.status === 'completed' && s.startedAt < session.startedAt)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt) || b.id.localeCompare(a.id)) : [];
  for (const exercise of sectionExercises()) {
    const record = records.get(exercise.id), article = $('exercise-template').content.firstElementChild.cloneNode(true);
    const disclosure = article.querySelector('.expand-button'), body = article.querySelector('.exercise-content');
    const toggle = article.querySelector('.state-button'), notes = article.querySelector('.plan-notes');
    const textarea = article.querySelector('textarea'), indicator = article.querySelector('.text-indicator');
    const open = expanded.has(exercise.id) && (showResults || Boolean(exercise.notes));
    article.querySelector('h4').textContent = exercise.name;
    article.querySelector('.prescription').textContent = prescriptionLabel(exercise.prescription);
    body.id = `content-${exercise.id}`; body.hidden = !open;
    disclosure.dataset.expand = exercise.id; disclosure.disabled = !showResults && !exercise.notes;
    disclosure.setAttribute('aria-controls', body.id); disclosure.setAttribute('aria-expanded', String(open));
    disclosure.setAttribute('aria-label', `${open ? 'Richiudi' : 'Espandi'} ${exercise.name}`);
    disclosure.firstElementChild.textContent = open ? '−' : '+';
    indicator.hidden = !showResults || !record.resultText.trim();
    notes.hidden = !exercise.notes;
    notes.querySelector('p:last-child').textContent = exercise.notes;
    const previous = article.querySelector('.previous-notes');
    previous.hidden = !previousSessions.length;
    previous.open = previousNotesOpen.has(exercise.id);
    const source = previousSessions.map(s => ({ session: s, record: data.records.find(r => r.sessionId === s.id && r.exerciseId === exercise.id && r.resultText.trim()) })).find(item => item.record);
    previous.querySelector('.previous-date').textContent = source ? `Ultime note · ${source.session.localDate}` : '';
    previous.querySelector('.previous-text').textContent = source?.record.resultText ?? 'Nessuna nota precedente per questo esercizio con questa scheda.';
    previous.addEventListener('toggle', () => {
      if (!previous.isConnected) return;
      if (previous.open) previousNotesOpen.add(exercise.id); else previousNotesOpen.delete(exercise.id);
    });
    toggle.hidden = !showResults; toggle.disabled = !editable(); toggle.dataset.cycle = exercise.id;
    toggle.dataset.state = record.status; toggle.firstElementChild.textContent = symbols[record.status];
    toggle.setAttribute('aria-label', `${exercise.name}: ${labels[record.status]}${editable() ? `. Segna ${labels[states[(states.indexOf(record.status) + 1) % states.length]]}` : ''}`);
    article.querySelector('.result-field').hidden = !showResults;
    textarea.id = `text-${exercise.id}`; textarea.value = record.resultText; textarea.readOnly = !editable();
    article.querySelector('label').htmlFor = textarea.id;
    textarea.addEventListener('input', () => {
      record.resultText = textarea.value; indicator.hidden = !textarea.value.trim();
      persist([{ exerciseId: exercise.id, resultText: textarea.value }]);
    });
    $('exercises').append(article);
  }
  const done = [...records.values()].filter(r => r.status === 'completed').length;
  const skipped = [...records.values()].filter(r => r.status === 'skipped').length;
  const code = fatigueCode(phase);
  $('fatigue-field').hidden = !showResults || !code;
  $('fatigue-label').textContent = code ? `Stanchezza fine ${code.toLowerCase()}` : '';
  const fatigue = editable() && unsavedFatigue.has(phase.id) ? unsavedFatigue.get(phase.id) : session?.sectionFatigue?.find(r => r.sectionId === phase.id)?.value;
  $('section-fatigue').value = fatigue ?? '';
  $('section-fatigue').hidden = !editable();
  $('fatigue-value').hidden = editable();
  $('fatigue-value').textContent = fatigue == null ? '—' : `${fatigue}/10`;
  $('session-progress').hidden = !showResults;
  $('session-progress').textContent = `${done} ✓ · ${skipped} × · ${exercises.length} esercizi`;
  $('complete-phase').textContent = `Completa fase ${phase.code || phase.title}`;
  $('complete-phase').disabled = sectionExercises().every(e => records.get(e.id).status === 'completed');
  $('undo-phase').hidden = !undo || undo.sectionId !== phase.id;
  $('previous-phase').disabled = sectionIndex === 0; $('next-phase').disabled = sectionIndex === sections.length - 1;
}
function renderHistory() {
  const list = $('history-list'); list.replaceChildren();
  const sessions = [...data.sessions].sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  if (!sessions.length) { list.textContent = 'Non hai ancora registrato sessioni.'; return; }
  for (const item of sessions) {
    const link = document.createElement('a'); link.className = 'list-link';
    link.href = item.status === 'in_progress' ? '#session' : `#detail/${item.id}`;
    link.textContent = `${item.localDate} · ${data.plans.find(p => p.id === item.planId)?.title} · ${item.status === 'in_progress' ? 'In corso' : 'Terminata'}`;
    list.append(link);
  }
}
function renderPlans() {
  $('plan-list').replaceChildren();
  for (const item of data.plans) {
    const button = document.createElement('button'); button.type = 'button'; button.className = 'full-width';
    const active = data.settings.some(s => s.key === 'activePlanId' && s.value === item.id);
    button.textContent = `${item.title}${active ? ' · Attiva' : ' · Attiva questa scheda'}`; button.disabled = active;
    button.addEventListener('click', () => action(async () => { await db.activatePlan(item.id); sectionIndex = 0; await refresh(); }));
    $('plan-list').append(button);
  }
}
function selectPhase(index) {
  sectionIndex = index; render(); $('phase-navigation').querySelector(`[data-phase="${index}"]`).focus();
  if (editable()) { const id = session.id, phaseId = sections[index].id; writeQueue = writeQueue.then(() => db.selectSection(id, phaseId)).catch(error); }
}
$('menu-button').addEventListener('click', () => setMenu($('main-menu').hidden));
$('main-menu').querySelector('a[href="#history"]').setAttribute('data-history', '');
$('all-sessions').addEventListener('click', () => {
  lastHistoryHash = '#history'; location.hash = 'history';
});
$('main-menu').addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') { setMenu(false); $('menu-button').focus(); } });
$('start-session').addEventListener('click', () => action(async () => {
  session = await db.startSession(plan.id); undo = null;
  if (navigator.storage?.persist) navigator.storage.persist().catch(() => {});
  if (view() === 'session') await refresh(); else location.hash = 'session';
}));
$('phase-navigation').addEventListener('click', e => { const button = e.target.closest('[data-phase]'); if (button) selectPhase(Number(button.dataset.phase)); });
$('previous-phase').addEventListener('click', () => selectPhase(sectionIndex - 1));
$('next-phase').addEventListener('click', () => selectPhase(sectionIndex + 1));
$('section-fatigue').addEventListener('change', () => {
  if (!editable()) return;
  const sectionId = sections[sectionIndex].id, value = $('section-fatigue').value === '' ? null : Number($('section-fatigue').value);
  session.sectionFatigue = (session.sectionFatigue || []).filter(r => r.sectionId !== sectionId);
  if (value !== null) session.sectionFatigue.push({ sectionId, value });
  persistFatigue(sectionId, value);
});
$('exercises').addEventListener('click', e => {
  const disclosure = e.target.closest('[data-expand]');
  if (disclosure && !disclosure.disabled) {
    const id = disclosure.dataset.expand;
    if (expanded.has(id)) expanded.delete(id); else expanded.add(id);
    render(); $('exercises').querySelector(`[data-expand="${id}"]`).focus(); return;
  }
  const toggle = e.target.closest('[data-cycle]');
  if (toggle && editable() && !toggle.disabled) {
    const id = toggle.dataset.cycle, record = records.get(id);
    record.status = states[(states.indexOf(record.status) + 1) % states.length]; undo = null;
    persist([{ exerciseId: id, status: record.status }]); render();
    $('exercises').querySelector(`[data-cycle="${id}"]`).focus(); announce(labels[record.status]);
  }
});
$('complete-phase').addEventListener('click', () => {
  undo = { sectionId: sections[sectionIndex].id, states: sectionExercises().map(e => ({ exerciseId: e.id, status: records.get(e.id).status })) };
  const patches = sectionExercises().map(e => { records.get(e.id).status = 'completed'; return { exerciseId: e.id, status: 'completed' }; });
  persist(patches); render(); $('undo-phase').focus();
});
$('undo-phase').addEventListener('click', () => {
  const patches = undo.states; patches.forEach(p => { records.get(p.exerciseId).status = p.status; });
  undo = null; persist(patches); render(); $('complete-phase').focus();
});
$('retry-save').addEventListener('click', async () => {
  await writeQueue; blocked = false;
  if (unsaved.size) await persist([...unsaved.values()].map(p => ({ ...p })), pendingSessionId);
  for (const [sectionId, value] of [...unsavedFatigue]) await persistFatigue(sectionId, value, pendingSessionId);
  saveStatus();
  if (!blocked && !hasUnsaved()) $('error-panel').hidden = true;
});
$('finish-session').addEventListener('click', () => {
  const remaining = [...records.values()].filter(r => r.status === 'pending').length;
  $('finish-summary').textContent = `Terminare la sessione? ${remaining} esercizi ancora vuoti rimarranno tali. Risultati e stati saranno conservati nello storico.`;
  $('finish-panel').hidden = false; $('confirm-finish').focus();
});
$('cancel-finish').addEventListener('click', () => { $('finish-panel').hidden = true; $('finish-session').focus(); });
$('confirm-finish').addEventListener('click', () => action(async () => {
  const id = session.id; await db.finishSession(id); undo = null; location.hash = `detail/${id}`;
}));
function download(value, prefix) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], {type:'application/json'}));
  const link = document.createElement('a'); link.href = url; link.download = `${prefix}-${new Date().toISOString().replaceAll(':', '-')}.json`;
  document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 60000);
}
async function fileJSON(input) {
  const file = input.files[0];
  if (!file) return null;
  if (file.size > 10 * 1024 * 1024) throw new Error('File troppo grande (massimo 10 MB).');
  return JSON.parse(await file.text());
}
$('plan-file').addEventListener('change', () => action(async () => {
  const value = await fileJSON($('plan-file')); if (!value) return;
  validatePlanFile(value); await db.importPlan(value); $('plan-file').value = ''; sectionIndex = 0;
  await refresh(); location.hash = 'plan'; announce('Scheda importata e attivata.');
}));
$('export-backup').addEventListener('click', () => action(async () => { download(await db.backup(), 'climbing-log-backup'); announce('Backup pronto per il download.'); }));
$('backup-file').addEventListener('change', () => action(async () => {
  restoreData = null; preventiveDownloaded = false; $('restore-panel').hidden = true;
  const value = await fileJSON($('backup-file')); if (!value) return;
  restoreData = validateBackup(value); preventiveDownloaded = false; $('confirm-restore').disabled = true;
  $('restore-summary').textContent = `Il backup contiene ${value.plans.length} schede e ${value.sessions.length} sessioni. Sostituirà tutti i dati attuali. Prima scarica il backup attuale e verifica che il file sia disponibile.`;
  $('restore-panel').hidden = false;
}));
$('preventive-backup').addEventListener('click', () => action(async () => {
  download(await db.backup(), 'climbing-log-prima-del-ripristino'); preventiveDownloaded = true; $('confirm-restore').disabled = false;
}));
$('confirm-restore').addEventListener('click', () => action(async () => {
  if (!restoreData || !preventiveDownloaded) return;
  if (!confirm('Hai verificato che il backup attuale sia stato scaricato? Confermi la sostituzione di tutti i dati?')) return;
  await db.restore(restoreData); restoreData = null; preventiveDownloaded = false; undo = null;
  viewStates.clear(); expanded.clear(); previousNotesOpen.clear(); renderedKey = null; lastHistoryHash = '#history';
  $('restore-panel').hidden = true; $('backup-file').value = ''; sectionIndex = 0; await refresh(); announce('Backup ripristinato.');
}));
$('cancel-restore').addEventListener('click', () => { restoreData = null; $('restore-panel').hidden = true; $('backup-file').value = ''; });
window.addEventListener('beforeunload', e => { if (hasUnsaved() || writing) { e.preventDefault(); e.returnValue = ''; } });
window.addEventListener('hashchange', async () => {
  if (!ready) return;
  if (!['plan','session','history','manage','detail'].includes(view())) { location.replace('#plan'); return; }
  rememberView();
  setMenu(false);
  try { await writeQueue; await refresh(); } catch (failure) { error(failure); }
});
async function setupOffline() {
  if (!('serviceWorker' in navigator)) { $('offline-status').textContent = 'Offline non disponibile in questo browser.'; return; }
  try {
    await navigator.serviceWorker.register('./sw.js');
    await navigator.serviceWorker.ready;
    $('offline-status').textContent = 'App pronta per l’uso offline.';
  } catch { $('offline-status').textContent = 'Offline non pronto: mantieni la connessione e ricarica.'; }
}
(async () => {
  try {
    if (!['plan','session','history','manage','detail'].includes(view())) history.replaceState(null, '', '#plan');
    await db.openDatabase(); ready = true; await refresh(); saveStatus(); setupOffline();
  }
  catch (failure) { error(failure); $('save-status').textContent = 'Archivio non disponibile: nessun dato verrà registrato.'; }
})();
