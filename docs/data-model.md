# Modello dati

Schede v1 confrontate con il PDF locale; backup corrente v3 dal 22 ottobre 2026.
Vedere [analisi della scheda](pdf-review.md).
Nomi tecnici in inglese, interfaccia in italiano. Separare la prescrizione
dell'allenamento dai risultati effettivamente registrati.

## Entità e relazioni

| Entità / store IndexedDB | Campi principali | Significato |
| --- | --- | --- |
| `plans` | `id`, `title`, `revision`, `previousPlanId`, `createdAt`, `validFrom`, `validTo`, `notes`, `sections` | Una versione di una scheda; le sezioni sono oggetti incorporati con `id`, `title`, `order` |
| `exercises` | `id`, `planId`, `sectionId`, `order`, `name`, `prescription`, `notes` | Una voce prescritta in una precisa scheda/sezione |
| `sessions` | `id`, `planId`, `startedAt`, `localDate`, `endedAt`, `status`, `notes`, `updatedAt`, `lastSectionId`, `sectionFatigue` | Un allenamento riferito a una scheda; stanchezza facoltativa per fase |
| `records` | `id`, `sessionId`, `exerciseId`, `status`, `resultText`, `updatedAt` | Risultato e osservazioni in un testo unico per esercizio |
| `settings` | `key`, `value` | Solo impostazioni necessarie, inizialmente `activePlanId` |

Relazioni: una scheda contiene sezioni e molti esercizi; una scheda può avere
molte sessioni; una sessione può avere molte registrazioni. Ogni registrazione
riguarda un esercizio della stessa scheda della sessione.

`exercises` non è un catalogo globale: lo stesso esercizio in due schede ha due
ID distinti. Anche due occorrenze nella stessa scheda hanno ID distinti.
Un eventuale catalogo per confronti trasversali verrà introdotto soltanto in futuro,
senza dedurre equivalenze dai nomi.

## Convenzioni

- ID stringa univoci, generati come UUID nell'app; sezioni univoche nella scheda.
- Timestamp ISO 8601 in UTC con `Z`; `localDate` e date di validità in `YYYY-MM-DD`.
  La data locale della sessione viene memorizzata all'avvio per evitare che il giorno
  storico cambi con il fuso orario. `endedAt` è `null` fino alla chiusura.
- `previousPlanId`: ID della versione precedente, oppure `null`; `revision` è un
  intero positivo. `validFrom` e `validTo` sono facoltativi (`null` se ignoti).
- `status` sessione: `in_progress`, `completed`. MVP: al massimo una
  sessione in corso, riprendibile. Completarla non implica aver svolto tutti gli esercizi.
- `status` registrazione: `pending`, `completed`, `skipped`. Assenza di una
  registrazione significa esercizio non ancora registrato. `pending` permette
  di salvare risultati parziali senza marcare l'esercizio come completato.
- Una sola registrazione per coppia `(sessionId, exerciseId)`; i salvataggi successivi
  aggiornano quella registrazione. Nessuna registrazione distinta per serie.
- `prescription`: `sets` (numero intero o `null`), `repsText` (stringa),
  `durationSeconds` e `restSeconds` (numeri non negativi o `null`), `instructions`
  (testo libero). Il testo conserva range, circuiti, progressioni e indicazioni
  che non si possono ancora rappresentare con campi numerici.
- Aggiungere `prescription.restBetweenRepsSeconds` (numero non negativo o `null`):
  il PDF distingue pausa tra ripetizioni e pausa tra serie (`restSeconds`).
  Mostrare etichette distinte; un valore mancante non significa zero.
- Metadati facoltativi della scheda: `focus`, `scheduleText` (stringhe) e
  `weeklySchedule` (array di `{dayOfWeek, sectionIds}`). Giorno ISO da 1 (lunedì)
  a 7 (domenica), un solo elemento per giorno, ID di sezioni esistenti non ripetuti
  nello stesso giorno. L'array conserva l'ordine delle sezioni prescritte.
  Usare array vuoto per schede senza calendario. Registrare sempre la data effettiva
  della sessione. L'MVP corrente usa tutte le sezioni; prima di supportare giorni
  con programmi diversi definire il sottoinsieme associato alla sessione.
- Note condivise tra righe del PDF: conservarle su ciascun esercizio interessato.
  Non convertire notazioni ambigue: mantenere il testo originale e segnalarle.
- `resultText` è una stringa, anche vuota: unico campo facoltativo «Risultato e note»
  per esercizio nell'MVP (scelta confermata). Non aggiungere `records.notes`;
  le note della scheda, dell'esercizio prescritto e dell'intera sessione restano
  distinte. Il campo `records.sets` è stato rimosso: non esiste un formato per
  risultati per serie. Le serie prescritte in `prescription.sets` rimangono:
  descrivono la scheda e sono mostrate nell'interfaccia. Nessun grado numerico
  o calcolo dei progressi viene imposto ora.
- La sessione raggruppa gli esercizi per `sectionId`, nell'ordine delle sezioni
  della scheda. L'avanzamento per fase è derivato dagli stati delle registrazioni,
  senza nuovi store o contatori persistiti. Distinguere completati, saltati e
  ancora da fare; «tutti registrati» non significa «tutti completati».
  Scorrimento dentro la fase, senza schermate separate per singolo esercizio.
  Fasi liberamente selezionabili per vedere anche il lavoro successivo.
  Completamento individuale oppure «Completa fase»: quest'ultimo imposta tutti
  gli esercizi del blocco a `completed`, inclusi quelli precedentemente saltati,
  conservando il testo. La futura implementazione dovrà usare un'unica transazione.
  La fase è completa solo quando tutti i suoi esercizi sono completati;
  la navigazione non cambia gli stati. Nel prototipo si può annullare l'ultima
  azione collettiva fino a un'altra modifica degli stati, ripristinando gli stati
  precedenti senza toccare il testo.
- Controllo individuale unico: `pending` (vuoto) → `completed` (spunta) →
  `skipped` (croce) → `pending`, senza modificare `resultText`. Stato e azione
  successiva devono avere un nome accessibile, senza etichette visive ripetute.
- Serie, ripetizioni e pause si mostrano nella stessa riga sotto il nome,
  con ritorno a capo naturale quando necessario. Omettere i valori mancanti
  dalla vista, mantenendo `null` nei dati: assenza non equivale a zero.
  Le note prescritte non vuote sono subito visibili aprendo l'esercizio,
  insieme al campo personale, senza una seconda apertura delle note.
  Istruzioni nel nome restano nel nome; non spostarle automaticamente nelle note.
- Nessuno stato «in pausa» o comando di interruzione: cambiare vista o fase
  non chiude la sessione. Nell'app il salvataggio progressivo e la ripresa restano
  necessari. Menu principale richiamabile dal pulsante, normalmente nascosto.

## Implementazione corrente

L'app usa ora i cinque store IndexedDB descritti sopra. Le schede vengono
importate da JSON validato, aggiunte senza sovrascrittura e attivate nello stesso
passaggio esplicito «Importa e attiva». Si possono riattivare schede precedenti;
la sessione in corso conserva sempre il proprio `planId`.

La sessione conserva anche `lastSectionId` (ID di una sua sezione) per riprendere
la fase dopo una ricarica. `resultText` viene scritto a ogni input, in una coda;
gli stati si aggiornano senza sovrascrivere il testo. «Completa fase» e annullamento
usano un'unica transazione. Testi non salvati restano in memoria con un comando
di riprova; termine, import e backup attendono le scritture e si fermano in caso
di errore. Chiusura con conferma e storico in sola lettura, senza trasformare
esercizi vuoti in completati. Nessuna modifica/eliminazione di schede già usate.

Backup e ripristino sono implementati. Il ripristino valida tutto prima di
scrivere e sostituisce i cinque store in transazione. Un avviso invita a
conservare un backup preventivo tramite il comando separato di esportazione;
non ci sono download o attestazioni obbligatorie nel percorso di ripristino.
Riepilogo, conferma esplicita e annullamento rimangono nell'app.

«+» prima del nome apre il pannello dell'esercizio; toggle a destra indipendente.
Più pannelli possono restare aperti: scelta semplice, da valutare nell'uso.
Nel pannello le note prescritte sono subito visibili e il risultato personale
resta un campo unico. Fase, aperture degli esercizi, apertura di «Note precedenti»
e posizione di scroll sono stato UI separato per vista/scheda/sessione, in memoria
fino alla ricarica o chiusura. Il menu Storico conserva l'ultimo dettaglio visitato;
«Tutte le sessioni» riapre l'elenco. Solo `lastSectionId` della sessione attiva
continua a essere persistito. Un indicatore segnala testo a pannello chiuso.
Consultare la scheda o lo storico non modifica gli stati di allenamento.

### Stanchezza per fase

`sessions.sectionFatigue` è un array facoltativo di `{sectionId, value}`:
un solo valore intero da 1 a 10 per fase della stessa scheda. Le fasi ammesse
hanno codice `VOL`, `CIRC`, `BLC` (accettato anche `BLOC`), senza distinguere
maiuscole/minuscole. I codici della scheda storica non vengono modificati.
Campo assente o array vuoto significa non registrato; cancellare un voto rimuove
la voce, non salva zero o `null`. Le nuove sessioni partono con array vuoto.

Scrittura e aggiornamento del timestamp avvengono in una transazione sullo store
`sessions`, solo per sessioni in corso, validando fase e valore. La coda gestisce
anche errori/riprova dei voti, mantenendo il riferimento alla sessione attiva
anche se nel frattempo si consulta un dettaglio storico. Termine e backup
attendono entrambe le code logiche (testi/stati e stanchezza).
Il voto resta indipendente dagli stati degli esercizi e da «Completa fase».

Il selettore nativo mostra «Stanchezza fine vol/circ/blc» e «—» iniziale;
non richiede compilazione. Lo storico mostra `valore/10`, oppure «—».

### Note precedenti

Durante la sessione in corso il comando appare solo se esiste almeno una sessione
`completed` con identico `planId` e `startedAt` precedente. Per ciascun esercizio
si cerca il primo `resultText` non vuoto (dopo trim) con identico `exerciseId`,
ordinando queste sessioni dalla più recente. Le sessioni con note vuote vengono
saltate; si mostra sempre la data della nota trovata, oppure un messaggio di
assenza. Il contenuto resta testo semplice, separato dall'input corrente.
Non si usano nomi, `previousPlanId` o equivalenze per collegare schede diverse.

## Storico e integrità

La prima sessione blocca la versione della scheda e le sue prescrizioni.
Qualsiasi modifica successiva crea una nuova scheda con nuovi ID per gli esercizi,
`revision` incrementata e `previousPlanId` valorizzato. Non occorre duplicare la
scheda nella sessione: l'immutabilità della versione referenziata conserva la
prescrizione originale. Anche i nomi degli esercizi usati nello storico restano fissi.

La scheda attiva è soltanto `settings.activePlanId`, con valore `null` quando non
ce ne sono. Cambiarla non modifica le sessioni in corso o precedenti.
L'MVP conserva tutte le schede e non offre cancellazioni di schede referenziate.

Prima di scrivere o importare verificare unicità degli ID, tipi, stati ammessi,
date, ordini e valori numerici. Verificare anche tutti i riferimenti: `planId`,
`sectionId`, `exerciseId`, `sessionId`, `previousPlanId` e `activePlanId`;
impedire cicli nella catena di versioni e registrazioni associate a schede diverse.
I testi importati vengono mostrati come testo semplice.

Database proposto: `climbing-log`, versione iniziale `1`. Chiavi primarie `id`,
eccetto `settings` che usa `key`. Indici iniziali: `exercises.planId`,
`sessions.planId`, `sessions.startedAt`, `records.sessionId` e indice univoco
`records[sessionId, exerciseId]`. Aggiungere altri indici solo per query reali.
La regola della singola sessione in corso va verificata in transazione, anche
con due schede del browser aperte. Le modifiche di più store sono atomiche.

## Backup JSON completo

Contenitore con `format: "climbing-log-backup"`, `schemaVersion: 3`, `exportedAt`,
`plans`, `exercises`, `sessions`, `records`, `settings`. Esportare una lettura
coerente degli store nella stessa transazione, inclusa la sessione in corso.
Il ripristino accetta soltanto v3; non ci sono riconoscimenti o migrazioni v1/v2.
I vecchi file vengono convertiti fuori dall'app e l'originale viene conservato.
I campi sconosciuti non vengono interpretati; il codice valida i campi usati.

La struttura IndexedDB rimane v1: store e indici non cambiano, nessun reset o
riscrittura automatica. `schemaVersion` del backup è distinto dalla versione
IndexedDB. Nuove registrazioni senza `sets`; nessuna conversione automatica dei
file. Il backup convertito del 22 ottobre conserva tutti gli ID e riferimenti,
note, stati, stanchezza e date; cambia soltanto versione, titolo concordato della
scheda e rimozione degli array `sets` vuoti. Originale e conversione sono privati.

### Eliminazione di una sessione terminata

Il comando compare nel dettaglio di una sessione `completed`. Dopo la conferma
con data, si verifica di nuovo lo stato nel database e si eliminano sessione e
registrazioni associate tramite l'indice `records.sessionId`, nella stessa
transazione. Errore o annullamento non lasciano cancellazioni parziali. Le altre
sessioni, la scheda e gli esercizi restano identici. Nessun cestino o annullamento
dopo il completamento. La UI torna allo storico e dimentica il dettaglio eliminato; anche un vecchio
collegamento a un dettaglio assente riapre lo storico;
le note precedenti sono ricalcolate dall'archivio rimasto. Rifiutare una sessione
ancora in corso o un ID inesistente, anche da un'altra finestra.

Esempio sintetico ridotto ma completo nelle relazioni (non tratto dal PDF):

```json
{
  "format": "climbing-log-backup",
  "schemaVersion": 3,
  "exportedAt": "2026-10-08T18:00:00Z",
  "plans": [{
    "id": "plan-demo-1", "title": "Scheda esempio", "revision": 1,
    "previousPlanId": null, "createdAt": "2026-10-08T09:00:00Z",
    "validFrom": "2026-10-08", "validTo": null, "notes": "",
    "sections": [{"id": "section-demo-1", "title": "Preparazione", "order": 0}]
  }],
  "exercises": [{
    "id": "exercise-demo-1", "planId": "plan-demo-1",
    "sectionId": "section-demo-1", "order": 0, "name": "Esercizio dimostrativo",
    "prescription": {
      "sets": 3, "repsText": "8–10", "durationSeconds": null,
      "restSeconds": 60, "restBetweenRepsSeconds": null,
      "instructions": "Indicazione di esempio"
    },
    "notes": ""
  }],
  "sessions": [{
    "id": "session-demo-1", "planId": "plan-demo-1",
    "startedAt": "2026-10-08T16:00:00Z", "localDate": "2026-10-08",
    "endedAt": null, "status": "in_progress", "notes": "",
    "updatedAt": "2026-10-08T16:10:00Z"
  }],
  "records": [{
    "id": "record-demo-1", "sessionId": "session-demo-1",
    "exerciseId": "exercise-demo-1", "status": "completed",
    "resultText": "3 serie da 8, ultima serie impegnativa",
    "updatedAt": "2026-10-08T16:10:00Z"
  }],
  "settings": [{"key": "activePlanId", "value": "plan-demo-1"}]
}
```

Gli ID leggibili dell'esempio sostituiscono UUID solo per rendere chiari i legami.
Il ripristino è una sostituzione completa: leggere e validare tutto prima
delle scritture, rifiutare formati diversi da v3, mostrare quantità e conseguenze
e richiedere conferma. Il backup preventivo è ricordato nell'avviso, senza
verifiche automatiche. Cancellazione e inserimento nei cinque store avvengono
nella stessa transazione; un errore annulla tutto. Non eliminare e ricreare il
database per fare il ripristino.

## Inserimento di nuove schede

Proposta MVP: importazione di un JSON dedicato, con
`format: "climbing-log-plan"`, `schemaVersion: 1`, `plan` ed `exercises`.
L'app valida e aggiunge una scheda con le sue prescrizioni in transazione,
senza sostituire sessioni o schede precedenti. ID già presenti causano un rifiuto
esplicito, senza sovrascrittura; l'interfaccia attuale rende esplicita l'attivazione
nel comando «Importa e attiva», nella stessa transazione.
Se contiene `previousPlanId`, la versione precedente deve già esistere.

La prima scheda è stata trascritta manualmente in questo formato e validata.
Per le successive è previsto inizialmente un passaggio assistito con Codex:
lettura del PDF oppure dell'Excel originale, produzione del JSON privato,
confronto con la fonte e validazione prima dell'importazione. Conservare note
condivise, distinzioni tra pause e notazioni ambigue senza interpretazioni arbitrarie.
Una nuova versione deve usare nuovi ID per scheda ed esercizi, senza riscrivere
il passato; collegare `previousPlanId` solo quando la scheda precedente è presente.

Non serve un editor o un parser nell'MVP. Un eventuale parser Python produrrà
lo stesso formato, con revisione umana, solo se il volume e la ripetitività del
lavoro lo giustificano; non farà parte del runtime dell'app.

Contesto confermato il 22 ottobre: una sola sessione settimanale per l'anno in
corso. Conservare `weeklySchedule` come metadato; non implementare la selezione
di combinazioni di fasi senza un esempio reale e una nuova decisione. Per altri
utilizzatori, un futuro supporto multi-giorno richiederà anche di definire il parser.
