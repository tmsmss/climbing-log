import { stores, validatePlanFile, validateBackup, migrateBackup, validateSectionFatigue, localDate } from './data.js';
let connection;
const request = req => new Promise((resolve, reject) => { req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error); });
export function openDatabase() {
  if (connection) return Promise.resolve(connection);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('climbing-log', 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      for (const name of stores) db.createObjectStore(name, { keyPath: name === 'settings' ? 'key' : 'id' });
      req.transaction.objectStore('exercises').createIndex('planId', 'planId');
      const sessions = req.transaction.objectStore('sessions');
      sessions.createIndex('planId', 'planId'); sessions.createIndex('startedAt', 'startedAt');
      const records = req.transaction.objectStore('records');
      records.createIndex('sessionId', 'sessionId'); records.createIndex('sessionExercise', ['sessionId', 'exerciseId'], { unique: true });
    };
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error('Chiudi le altre finestre di Climbing Log e riprova.'));
    req.onsuccess = () => {
      connection = req.result;
      connection.onversionchange = () => { connection.close(); connection = null; };
      resolve(connection);
    };
  });
}
async function transaction(names, mode, work) {
  const db = await openDatabase();
  const tx = db.transaction(names, mode);
  const completed = new Promise((resolve, reject) => {
    tx.oncomplete = resolve;
    tx.onabort = () => reject(tx.error || new Error('Operazione annullata; dati precedenti conservati.'));
    tx.onerror = () => {}; // abort is the definitive failure signal
  });
  try { const result = await work(tx); await completed; return result; }
  catch (error) { try { tx.abort(); } catch {} await completed.catch(() => {}); throw error; }
}
export function readAll() {
  return transaction(stores, 'readonly', async tx => Object.fromEntries(await Promise.all(stores.map(async name => [name, await request(tx.objectStore(name).getAll())]))));
}
export async function backup() {
  const data = { format: 'climbing-log-backup', schemaVersion: 2, exportedAt: new Date().toISOString(), ...await readAll() };
  return validateBackup(data);
}
export function importPlan(value) {
  const { plan, exercises } = validatePlanFile(value);
  return transaction(['plans', 'exercises', 'settings'], 'readwrite', async tx => {
    if (plan.previousPlanId !== null && !await request(tx.objectStore('plans').get(plan.previousPlanId))) throw new Error('Versione precedente assente.');
    tx.objectStore('plans').add(plan);
    exercises.forEach(e => tx.objectStore('exercises').add(e));
    // Import and activation are one explicit action in the interface.
    tx.objectStore('settings').put({ key: 'activePlanId', value: plan.id });
  });
}
export function activatePlan(planId) {
  return transaction(['plans', 'settings'], 'readwrite', async tx => {
    if (!await request(tx.objectStore('plans').get(planId))) throw new Error('Scheda inesistente.');
    tx.objectStore('settings').put({ key: 'activePlanId', value: planId });
  });
}
export function restore(value) {
  const migrated = migrateBackup(value);
  return transaction(stores, 'readwrite', tx => {
    for (const name of stores) { const store = tx.objectStore(name); store.clear(); migrated[name].forEach(item => store.add(item)); }
  });
}
export function startSession(planId) {
  return transaction(['plans', 'sessions'], 'readwrite', async tx => {
    const sessions = await request(tx.objectStore('sessions').getAll());
    const active = sessions.find(s => s.status === 'in_progress');
    if (active) return active;
    const plan = await request(tx.objectStore('plans').get(planId));
    if (!plan) throw new Error('Importa prima una scheda.');
    const now = new Date().toISOString();
    const session = { id: crypto.randomUUID(), planId, startedAt: now, localDate: localDate(), endedAt: null, status: 'in_progress', notes: '', updatedAt: now, lastSectionId: [...plan.sections].sort((a, b) => a.order - b.order)[0].id, sectionFatigue: [] };
    tx.objectStore('sessions').add(session); return session;
  });
}
// Patch only fields changed by the user; a note must not overwrite a newer status.
export function updateRecords(sessionId, patches) {
  return transaction(['sessions', 'exercises', 'records'], 'readwrite', async tx => {
    const session = await request(tx.objectStore('sessions').get(sessionId));
    if (!session || session.status !== 'in_progress') throw new Error('La sessione è già terminata. Ricarica per vedere lo storico.');
    const now = new Date().toISOString();
    for (const patch of patches) {
      const exercise = await request(tx.objectStore('exercises').get(patch.exerciseId));
      if (!exercise || exercise.planId !== session.planId) throw new Error('Esercizio estraneo alla sessione.');
      const previous = await request(tx.objectStore('records').index('sessionExercise').get([sessionId, patch.exerciseId]));
      const record = previous || { id: crypto.randomUUID(), sessionId, exerciseId: patch.exerciseId, status: 'pending', resultText: '', sets: [] };
      if (patch.status !== undefined) {
        if (!['pending', 'completed', 'skipped'].includes(patch.status)) throw new Error('Stato non valido.');
        record.status = patch.status;
      }
      if (patch.resultText !== undefined) { if (typeof patch.resultText !== 'string') throw new Error('Testo non valido.'); record.resultText = patch.resultText; }
      record.updatedAt = now; tx.objectStore('records').put(record);
    }
    session.updatedAt = now; tx.objectStore('sessions').put(session);
  });
}
export function updateSectionFatigue(sessionId, sectionId, value) {
  return transaction(['sessions', 'plans'], 'readwrite', async tx => {
    const session = await request(tx.objectStore('sessions').get(sessionId));
    if (!session || session.status !== 'in_progress') throw new Error('La sessione è già terminata. Ricarica per vedere lo storico.');
    const plan = await request(tx.objectStore('plans').get(session.planId));
    // Validate the target even when clearing a rating.
    validateSectionFatigue([{ sectionId, value: value === null ? 1 : value }], plan.sections);
    const ratings = (session.sectionFatigue || []).filter(r => r.sectionId !== sectionId);
    if (value !== null) ratings.push({ sectionId, value });
    validateSectionFatigue(ratings, plan.sections);
    session.sectionFatigue = ratings; session.updatedAt = new Date().toISOString();
    tx.objectStore('sessions').put(session);
  });
}
export function selectSection(sessionId, sectionId) {
  return transaction(['sessions', 'plans'], 'readwrite', async tx => {
    const session = await request(tx.objectStore('sessions').get(sessionId));
    if (!session || session.status !== 'in_progress') return;
    const plan = await request(tx.objectStore('plans').get(session.planId));
    if (!plan.sections.some(s => s.id === sectionId)) throw new Error('Fase inesistente.');
    session.lastSectionId = sectionId; tx.objectStore('sessions').put(session);
  });
}
export function finishSession(sessionId) {
  return transaction(['sessions'], 'readwrite', async tx => {
    const session = await request(tx.objectStore('sessions').get(sessionId));
    if (!session || session.status !== 'in_progress') throw new Error('Sessione già terminata.');
    session.status = 'completed'; session.endedAt = new Date().toISOString(); session.updatedAt = session.endedAt;
    tx.objectStore('sessions').put(session);
  });
}
