// Dati sintetici: riproducono la struttura della scheda, non il PDF personale.
export const examplePlan = {
  id: 'example-plan',
  title: 'Scheda di esempio',
  focus: 'Movimento e continuità',
  sections: [
    { id: 'risc', code: 'RISC', title: 'Riscaldamento', order: 0 },
    { id: 'mob', code: 'MOB', title: 'Mobilità', order: 1 },
    { id: 'rspec', code: 'RSPEC', title: 'Riscaldamento specifico', order: 2 },
    { id: 'vol', code: 'VOL', title: 'Volume', order: 3 },
    { id: 'circ', code: 'CIRC', title: 'Circuiti', order: 4 },
    { id: 'blc', code: 'BLC', title: 'Blocchi', order: 5 },
  ],
};

const rows = [
  ['risc', 'Attivazione generale', 1, '4 minuti', null, null, 'Inizia con un ritmo tranquillo.'],
  ['risc', 'Attivazione con elastico', 1, '12 movimenti', null, null, 'Mantieni il movimento controllato.'],
  ['mob', 'Mobilità delle anche', 1, '45 secondi', null, null, 'Cerca un movimento fluido.'],
  ['mob', 'Rotazioni del busto', 1, '8 per lato', null, null, ''],
  ['mob', 'Mobilità delle caviglie', 1, '45 secondi', null, null, ''],
  ['mob', 'Mobilità delle spalle', 1, '45 secondi', null, null, ''],
  ['mob', 'Allungamento controllato delle braccia sopra la testa e ritorno alla posizione iniziale', 1, '8 movimenti', null, null, 'Esempio di nome lungo: deve restare leggibile anche sul telefono.'],
  ['mob', 'Rotazioni con bastone', 1, '10 movimenti', null, null, ''],
  ['rspec', 'Tirate agli anelli', 2, '12 ripetizioni', null, 45, ''],
  ['rspec', 'Attivazione dita in appoggio', 2, '15 movimenti', null, 30, ''],
  ['rspec', 'Tirate controllate', 2, '8 ripetizioni', null, 60, 'Esegui senza slanci.'],
  ['vol', 'Sequenze su percorsi facili', 1, '6 percorsi', null, 120, ''],
  ['vol', 'Circuito continuo', 1, '2 giri', null, 150, ''],
  ['vol', 'Sequenze su blocchi medi', 1, '8 blocchi', 20, 180, 'Alterna i percorsi e annota ciò che trovi interessante.'],
  ['circ', 'Circuito con appoggi precisi', 2, '1 giro', null, 120, 'Cura il posizionamento del piede.'],
  ['circ', 'Circuito con movimento lento prima di raggiungere la presa successiva', 2, '1 giro', null, 180, 'Privilegia la qualità del movimento.'],
  ['blc', 'Blocco di coordinazione', 4, '1 tentativo', null, 60, ''],
  ['blc', 'Blocco con spostamenti controllati e posizione stabile dei piedi', 4, '1 tentativo', null, 120, 'Esempio di nota lunga. Puoi aprirla separatamente senza perdere il risultato che hai scritto nel campo personale.'],
  ['blc', 'Tentativi su un blocco impegnativo', 3, '3 minuti', null, 180, ''],
];

export const exampleExercises = rows.map((row, order) => ({
  id: `example-exercise-${order + 1}`,
  planId: examplePlan.id,
  sectionId: row[0],
  order,
  name: row[1],
  prescription: { sets: row[2], repsText: row[3], restBetweenRepsSeconds: row[4], restSeconds: row[5] },
  notes: row[6],
}));
