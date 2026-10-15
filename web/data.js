// Validation is shared by plan import, database checks and full backup restore.
export const stores = ['plans', 'exercises', 'sessions', 'records', 'settings'];
const fail = message => { throw new Error(`JSON non valido: ${message}`); };
const object = value => value && typeof value === 'object' && !Array.isArray(value);
const string = value => typeof value === 'string';
const id = value => string(value) && /^[A-Za-z0-9_-]{1,100}$/.test(value);
const integer = value => Number.isSafeInteger(value) && value >= 0;
const timestamp = value => string(value) && /^\d{4}-\d{2}-\d{2}T.*Z$/.test(value) && Number.isFinite(Date.parse(value));
const date = value => string(value) && /^\d{4}-\d{2}-\d{2}$/.test(value) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
function unique(list, key) {
  const map = new Map();
  for (const item of list) {
    if (!object(item) || !id(item[key]) || map.has(item[key])) fail(`ID ${key} assente o duplicato`);
    map.set(item[key], item);
  }
  return map;
}
export function fatigueCode(section) {
  const code = section?.code?.trim().toUpperCase();
  return code === 'BLOC' ? 'BLC' : ['VOL', 'CIRC', 'BLC'].includes(code) ? code : null;
}
export function validateSectionFatigue(ratings, sections) {
  if (!Array.isArray(ratings)) fail('stanchezza per fase');
  const seen = new Set();
  for (const rating of ratings) {
    const section = object(rating) && sections.find(s => s.id === rating.sectionId);
    if (!section || !fatigueCode(section) || seen.has(rating.sectionId) ||
        !Number.isInteger(rating.value) || rating.value < 1 || rating.value > 10) fail('stanchezza per fase');
    seen.add(rating.sectionId);
  }
}
function checkPlan(plan, exercises) {
  if (!string(plan.title) || !plan.title.trim() || !Number.isSafeInteger(plan.revision) || plan.revision < 1 ||
      !timestamp(plan.createdAt) || !string(plan.notes) || !Array.isArray(plan.sections) || !plan.sections.length ||
      !(plan.previousPlanId === null || id(plan.previousPlanId)) ||
      ![plan.validFrom, plan.validTo].every(v => v === null || date(v))) fail('campi della scheda');
  for (const key of ['focus', 'scheduleText']) if (plan[key] !== undefined && !string(plan[key])) fail(key);
  const sections = unique(plan.sections, 'id');
  const orders = new Set();
  for (const section of sections.values()) {
    if (!string(section.title) || !section.title.trim() || !integer(section.order) || orders.has(section.order) ||
        (section.code !== undefined && !string(section.code))) fail('sezioni');
    orders.add(section.order);
  }
  if (plan.weeklySchedule !== undefined) {
    if (!Array.isArray(plan.weeklySchedule)) fail('calendario');
    const days = new Set();
    for (const day of plan.weeklySchedule) {
      if (!object(day) || !integer(day.dayOfWeek) || day.dayOfWeek < 1 || day.dayOfWeek > 7 || days.has(day.dayOfWeek) ||
          !Array.isArray(day.sectionIds) || new Set(day.sectionIds).size !== day.sectionIds.length ||
          day.sectionIds.some(key => !sections.has(key))) fail('calendario');
      days.add(day.dayOfWeek);
    }
  }
  if (!exercises.length) fail('scheda senza esercizi');
  const positions = new Set();
  for (const exercise of exercises) {
    const p = exercise.prescription;
    const position = `${exercise.sectionId}:${exercise.order}`;
    if (exercise.planId !== plan.id || !sections.has(exercise.sectionId) || !integer(exercise.order) || positions.has(position) ||
        !string(exercise.name) || !exercise.name.trim() || !string(exercise.notes) || !object(p) || !string(p.repsText) ||
        !string(p.instructions) || ![p.sets, p.durationSeconds, p.restSeconds, p.restBetweenRepsSeconds].every(v => v === null || integer(v))) fail('esercizi o prescrizioni');
    positions.add(position);
  }
  for (const key of sections.keys()) if (!exercises.some(e => e.sectionId === key)) fail('sezione senza esercizi');
}
export function validatePlanFile(value) {
  if (!object(value) || value.format !== 'climbing-log-plan' || value.schemaVersion !== 1 || !object(value.plan) || !Array.isArray(value.exercises)) fail('formato scheda o versione');
  unique([value.plan], 'id'); unique(value.exercises, 'id');
  checkPlan(value.plan, value.exercises);
  return { plan: value.plan, exercises: value.exercises };
}
export function validateBackup(value) {
  if (!object(value) || value.format !== 'climbing-log-backup' || ![1, 2].includes(value.schemaVersion) || !timestamp(value.exportedAt) || stores.some(s => !Array.isArray(value[s]))) fail('formato backup o versione');
  const plans = unique(value.plans, 'id'), exercises = unique(value.exercises, 'id');
  const sessions = unique(value.sessions, 'id'); unique(value.records, 'id'); unique(value.settings, 'key');
  for (const p of plans.values()) {
    checkPlan(p, value.exercises.filter(e => e.planId === p.id));
    const visited = new Set([p.id]); let previous = p.previousPlanId;
    while (previous !== null) {
      if (!plans.has(previous) || visited.has(previous)) fail('versioni della scheda');
      visited.add(previous); previous = plans.get(previous).previousPlanId;
    }
  }
  if (value.exercises.some(e => !plans.has(e.planId))) fail('scheda esercizio inesistente');
  let active = 0;
  for (const session of sessions.values()) {
    if (!plans.has(session.planId) || !timestamp(session.startedAt) || !timestamp(session.updatedAt) || !date(session.localDate) ||
        !['in_progress', 'completed', 'abandoned'].includes(session.status) || !string(session.notes) ||
        (session.status === 'in_progress' ? session.endedAt !== null : !timestamp(session.endedAt)) ||
        (session.endedAt && session.endedAt < session.startedAt) ||
        (session.lastSectionId !== undefined && !plans.get(session.planId).sections.some(s => s.id === session.lastSectionId))) fail('sessioni');
    if (session.status === 'in_progress') active++;
    if (session.sectionFatigue !== undefined) {
      if (value.schemaVersion === 1) fail('la stanchezza richiede backup versione 2');
      validateSectionFatigue(session.sectionFatigue, plans.get(session.planId).sections);
    }
  }
  if (active > 1) fail('più sessioni in corso');
  const pairs = new Set();
  for (const record of value.records) {
    const session = sessions.get(record.sessionId), exercise = exercises.get(record.exerciseId);
    const pair = `${record.sessionId}:${record.exerciseId}`;
    if (!session || !exercise || exercise.planId !== session.planId || pairs.has(pair) ||
        !['pending', 'completed', 'skipped'].includes(record.status) || !string(record.resultText) ||
        !timestamp(record.updatedAt) || !Array.isArray(record.sets) || record.sets.length) fail('registrazioni (serie dettagliate non supportate)');
    pairs.add(pair);
  }
  for (const setting of value.settings) if (setting.key !== 'activePlanId' || !(setting.value === null || plans.has(setting.value))) fail('impostazioni');
  return value;
}
// Explicit format migration; never alter the caller's backup or reset IndexedDB.
export function migrateBackup(value) {
  validateBackup(value);
  return { ...value, schemaVersion: 2, sessions: value.sessions.map(s => ({ ...s, sectionFatigue: s.sectionFatigue ?? [] })) };
}
export function localDate(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}
