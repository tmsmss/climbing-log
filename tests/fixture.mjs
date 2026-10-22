import { examplePlan, exampleExercises } from '../web/example-plan.js';
export function planFixture() {
  return structuredClone({
    format: 'climbing-log-plan', schemaVersion: 1,
    plan: { ...examplePlan, revision: 1, previousPlanId: null, createdAt: '2026-10-08T10:00:00Z', validFrom: null, validTo: null, notes: '' },
    exercises: exampleExercises.map(e => ({ ...e, prescription: { ...e.prescription, durationSeconds: null, instructions: '' } })),
  });
}
export function backupFixture() {
  const value = planFixture();
  return { format: 'climbing-log-backup', schemaVersion: 3, exportedAt: '2026-10-08T10:00:00Z',
    plans: [value.plan], exercises: value.exercises, sessions: [{ id: 'session-one', planId: value.plan.id, startedAt: '2026-10-08T10:00:00Z', localDate: '2026-10-08', endedAt: null, status: 'in_progress', sectionFatigue: [], notes: '', updatedAt: '2026-10-08T10:00:00Z' }],
    records: [{ id: 'record-one', sessionId: 'session-one', exerciseId: value.exercises[0].id, status: 'pending', resultText: '<b>literal text</b>', updatedAt: '2026-10-08T10:00:00Z' }],
    settings: [{ key: 'activePlanId', value: value.plan.id }] };
}
