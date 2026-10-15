import test from 'node:test';
import assert from 'node:assert/strict';
import { validatePlanFile, validateBackup, migrateBackup, localDate } from '../web/data.js';
import { planFixture, backupFixture } from './fixture.mjs';
test('valid plans and backups survive JSON round trip with literal text', () => {
  assert.equal(validatePlanFile(planFixture()).exercises.length, 19);
  const original = backupFixture();
  assert.deepEqual(validateBackup(JSON.parse(JSON.stringify(original))), original);
  assert.equal(localDate(new Date(2026, 0, 2, 23, 59)), '2026-01-02');
});
const mutations = {
  'future version': d => { d.schemaVersion = 3; },
  'duplicate IDs': d => { d.records.push({ ...d.records[0] }); },
  'duplicate session exercise': d => { d.records.push({ ...d.records[0], id: 'another' }); },
  'missing plan': d => { d.exercises[0].planId = 'absent'; },
  'missing section': d => { d.exercises[0].sectionId = 'absent'; },
  'missing session': d => { d.records[0].sessionId = 'absent'; },
  'wrong plan for record': d => { const second = structuredClone(d.plans[0]); second.id = 'second'; d.plans.push(second); d.exercises.push(...d.exercises.map(e => ({ ...e, id: `second-${e.id}`, planId: 'second' }))); d.sessions[0].planId = 'second'; },
  'second active session': d => { d.sessions.push({ ...d.sessions[0], id: 'second' }); },
  'cycle of revisions': d => { d.plans[0].previousPlanId = d.plans[0].id; },
  'negative pause': d => { d.exercises[0].prescription.restSeconds = -1; },
  'invalid status': d => { d.records[0].status = 'done'; },
  'invalid calendar date': d => { d.sessions[0].localDate = '2026-02-31'; },
  'unfinished completed session': d => { d.sessions[0].status = 'completed'; },
  'missing active plan': d => { d.settings[0].value = 'absent'; },
};
for (const [name, mutate] of Object.entries(mutations)) test(`reject ${name}`, () => { const data = backupFixture(); mutate(data); assert.throws(() => validateBackup(data)); });

test('v1 backup migrates without mutating or losing historical data', () => {
  const old = backupFixture(), before = structuredClone(old), migrated = migrateBackup(old);
  assert.deepEqual(old, before);
  assert.equal(migrated.schemaVersion, 2);
  assert.deepEqual(migrated.sessions[0].sectionFatigue, []);
  assert.deepEqual(migrated.records, old.records);
  assert.deepEqual(migrateBackup(migrated), migrated);
});
test('v2 fatigue survives round trip; absence means unrecorded', () => {
  const value = migrateBackup(backupFixture());
  value.sessions[0].sectionFatigue = [{ sectionId: 'vol', value: 1 }, { sectionId: 'circ', value: 10 }, { sectionId: 'blc', value: 7 }];
  assert.deepEqual(validateBackup(JSON.parse(JSON.stringify(value))), value);
  delete value.sessions[0].sectionFatigue;
  assert.equal(validateBackup(value).sessions[0].sectionFatigue, undefined);
});
for (const [name, ratings] of Object.entries({
  'zero': [{ sectionId: 'vol', value: 0 }], 'over ten': [{ sectionId: 'vol', value: 11 }],
  'decimal': [{ sectionId: 'vol', value: 1.5 }], 'text': [{ sectionId: 'vol', value: '7' }],
  'null value': [{ sectionId: 'vol', value: null }], 'null entry': [null], 'not array': {},
  'unknown phase': [{ sectionId: 'missing', value: 7 }], 'unsupported phase': [{ sectionId: 'risc', value: 7 }],
  'duplicate phase': [{ sectionId: 'vol', value: 7 }, { sectionId: 'vol', value: 8 }],
})) test(`reject fatigue ${name}`, () => {
  const value = migrateBackup(backupFixture()); value.sessions[0].sectionFatigue = ratings;
  assert.throws(() => validateBackup(value));
});
test('v1 cannot mislabel fatigue data as an old format', () => {
  const value = backupFixture(); value.sessions[0].sectionFatigue = [{ sectionId: 'vol', value: 7 }];
  assert.throws(() => validateBackup(value));
});
