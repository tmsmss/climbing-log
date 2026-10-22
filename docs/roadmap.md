# Roadmap incrementale

Ogni incremento produce un risultato piccolo da verificare insieme. Seguire
l'incarico corrente: la roadmap non autorizza da sola la fase successiva.

## Stato e metodo di avanzamento

Aggiornamento: 22 ottobre 2026.

- Fondamenta documentali e analisi visiva del PDF: completate.
- Mockup: tre viste esplorate; ultima anteprima con trascrizione manuale delle
  19 voci del PDF fuori dal repository. Nessun parser sviluppato.
- Scelte condivise: fasi navigabili, campo unico risultato/note, toggle ciclico,
  completamento fase, menu nascosto; «+» a sinistra apre ciascun esercizio,
  toggle a destra, aperture indipendenti senza richiusura automatica.
- Incrementi 1–4: implementati (consultazione, archivio schede, sessioni,
  storico e backup). Termine sessione confermato, dettagli in sola lettura.
- Prima scheda reale: JSON privato trascritto manualmente dal PDF e validato,
  19 esercizi, sei fasi e due pause distinte; ignorato da Git.
- Incremento 5: manifest, icone e offline implementati e provati nel browser.
  Primo allenamento da telefono svolto dall'utilizzatore; installazione da Chrome
  confermata il 22 ottobre. Modalità aereo Android ancora da verificare.
- Pubblicazione: `local/pages/` è un repository su `gh-pages`, con aggiornamento
  pubblicato al commit `5b2a891` e upstream `origin/gh-pages`. L'utilizzatore ha
  eseguito commit e push; sorgenti su `main`. Istruzioni in `docs/first-test.md`.
- Incremento del 15 ottobre: note immediate, stanchezza per fase, note precedenti
  della stessa scheda e memoria della navigazione implementate localmente;
  verifiche locali completate. Il 22 ottobre l'utilizzatore conferma l'esito
  positivo in allenamento e l'installazione da Chrome Android. Offline Android
  ancora da verificare separatamente.

Verifiche del primo incremento: Edge, sei fasi a 320/390/736 px nei temi
chiaro/scuro, pannelli e note aperti inclusi. Provati tastiera, menu/Escape,
aperture indipendenti, ciclo degli stati, testo conservato nella navigazione,
completamento fase e annullamento senza cambiare il testo. Verificati ricarica
con azzeramento e caricamento alla radice e sotto `/climbing-log/`. Nessun errore
JavaScript, richiesta fallita o overflow orizzontale; controllo visivo della fase
MOB compatta ed espansa. Queste prove non verificano Android, IndexedDB o offline.

Verifiche del secondo incremento: 15 test automatici di validazione; prove Edge
di IndexedDB, ripresa dopo ricarica, conservazione del testo dopo errore e riprova,
singola sessione fra due finestre, import duplicato senza scritture parziali,
rollback del ripristino dopo errore simulato, termine/storico, export scaricato,
backup preventivo e restore confermato. Riapertura e scritture offline sotto
`/climbing-log/` passate. Sei fasi a 320/390/736 px nei temi chiaro/scuro,
nessun errore JavaScript o overflow. Dati sintetici e profilo separato.

Per ogni incremento definire risultato, vincoli e criterio osservabile di
completamento. Alla chiusura rivedere diff e interfaccia, documentare esiti e
limiti qui, conservando decisioni tecniche nel README o nel modello dati.

## Prossimo passo

Provare l'incremento del 22 ottobre in allenamento dopo la pubblicazione e
il ripristino del backup convertito v3. Il 22 ottobre l'utilizzatore conferma
l'esito positivo dell'incremento precedente e l'installazione da Chrome Android;
la modalità aereo resta da verificare separatamente. Dopo la prova valutare
un eventuale ultimo passaggio grafico, senza avviarlo automaticamente.
La [procedura Git/Pages](first-test.md) prevede prima commit/push dei sorgenti
su `main`, poi commit/push della copia statica `local/pages` su `gh-pages`.

### Incremento autorizzato il 22 ottobre

Risultato: eliminazione delle sessioni terminate, pannelli essenziali e ripristino
ridotto a scelta file, riepilogo, conferma/annullamento. Un solo backup corrente v3,
senza migrazioni dei file, campi di risultati per serie o stato `abandoned`.
Vincoli: nessuna nuova dipendenza, nessun reset, schede storiche e riferimenti
conservati; `weeklySchedule` resta un metadato, senza nuovi flussi per più giorni.

Criteri osservabili:

- cancellare solo dal dettaglio terminato, con data e conferma; sessione e risultati
  spariscono insieme, senza toccare scheda, esercizi o altre sessioni;
- dopo cancellazione tornare allo storico, senza link al dettaglio eliminato;
  note precedenti aggiornate; rifiuto della cancellazione di una sessione attiva;
- testata senza messaggi di successo o legenda degli stati; errori e riprova visibili;
  note prescritte senza titolino, note precedenti con sola data e testo;
- pulsanti export/restore coerenti, avviso di backup preventivo, nessun download
  imposto o integrato nel ripristino; validazione completa e rollback conservati;
- rifiuto dei vecchi file v1/v2; nuovi risultati senza `sets`, backup v3 valido;
  convertire il file privato mantenendo tutte le informazioni effettive.

Backup privato esaminato: due sessioni terminate (8/15 ottobre), una in corso del
22 ottobre senza risultati, 19 esercizi e 38 registrazioni. Conversione separata
v3 validata; rimossi solo gli array `sets` vuoti e rinominato il titolo in
«Corso soft ottobre 26». Confronto inverso dell'intero oggetto identico all'originale.
Nessun dato reale incluso nei sorgenti o nelle fixture pubblicabili.

Verifiche del 22 ottobre completate: 29 test Node passati; prova Edge completa
con fixture sintetiche e profilo separato passata. Verificati eliminazione e
annullamento, rollback dopo cancellazioni già accodate, rifiuto di sessioni attive,
conservazione di altre sessioni e schede, storico vuoto e collegamenti eliminati,
ricalcolo delle note precedenti, restore v3 e rifiuto v1/v2 senza scritture.
Ripassati salvataggio/ripresa, concorrenza, errore/riprova, note letterali,
stanchezza, navigazione/scroll, export e rollback ripristino, riapertura e
scritture offline sotto /climbing-log/. Sei fasi a 320/390/736 px nei temi
chiaro/scuro, nessun overflow; controllo visivo MOB/VOL e gestione backup.
Prova separata di aggiornamento cache v2 → v3 passata: il vecchio worker attende
la chiusura, poi nuova UI e dati IndexedDB invariati; menu/Escape e scelta file
con tastiera verificati. Il backup reale convertito è stato importato, riesportato
e ricaricato in un profilo isolato, senza modificare l'archivio sul telefono:
tutti i dati identici e sessione in corso riprendibile. Nessun errore JavaScript.
Diff e link documentali controllati; i sei asset modificati in local/pages
corrispondono ai sorgenti. Nessun commit/push o pubblicazione automatica.
Limiti: prova fisica Android del nuovo incremento, modalità aereo sul telefono
e verifica online dopo pubblicazione da completare.

### Cronologia: incremento autorizzato il 15 ottobre

Risultato: ridurre i tocchi per le note e la consultazione del lavoro precedente;
aggiungere una sola valutazione facoltativa della stanchezza per VOL/CIRC/BLC.
Vincoli: HTML/CSS/JS nativi, stessa scheda (`planId`) per le note precedenti,
nessuna equivalenza tra schede, storico in sola lettura, nessun reset dei dati,
memoria della navigazione limitata all'uso corrente dell'app.

Criteri osservabili:

- aprire l'esercizio mostra subito note della scheda e campo personale;
- il selettore «Stanchezza fine vol/circ/blc» occupa una sola riga, parte vuoto,
  accetta 1–10 e consente cancellazione; non vincola completamento o termine;
- «Note precedenti» compare solo con sessioni precedenti terminate della stessa
  scheda, mostra l'ultima nota non vuota dello stesso esercizio e la sua data;
- sessione corrente e dettagli storici conservano separatamente fase, aperture
  e scroll; Storico riapre l'ultimo dettaglio, «Tutte le sessioni» torna all'elenco;
- salvataggio, ripresa, riprova, storico e backup conservano anche i voti;
  il ripristino dei vecchi backup v1 resta disponibile con migrazione esplicita.

Decisione UX: selettore nativo compatto invece di dieci pulsanti. Decisione dati:
array facoltativo `sessions.sectionFatigue`, backup v2; store/indici IndexedDB
invariati (v1). Dettagli e migrazione nel [modello dati](data-model.md).
Nessun commit/push automatico: mantenuti `main` per i sorgenti e il repository
separato `local/pages` su `gh-pages` per la pubblicazione.

Verifiche del 15 ottobre: 28 test Node di validazione/migrazione passati. Prova
browser Edge con fixture sintetiche e profili separati passata: note immediate;
voto inizialmente vuoto, modifica/cancellazione, ripresa dopo ricarica,
indipendenza dal completamento fase, valori distinti per VOL/CIRC/BLC,
rifiuto di valori/fasi non validi, errore e riprova anche da un dettaglio storico;
valori nello storico e nel backup/ripristino v2. Verificati backup v1 e dati
IndexedDB v1 preesistenti senza campo stanchezza, senza perdita delle note.
Note precedenti: stessa scheda/esercizio, salto delle note vuote con data della
nota trovata, nessuna copia nell'input, testo HTML mostrato letteralmente.
Navigazione: fasi e aperture indipendenti, scroll ripristinato, menu Storico e
ritorno all'elenco. Ripassate le prove preesistenti su concorrenza, importazione,
rollback, termine, download, restore e riapertura/salvataggio offline sotto
`/climbing-log/`. Sei fasi a 320/390/736 px nei temi chiaro/scuro, nessun overflow;
selettore alto almeno 44 px. Controllo visivo di MOB e VOL, nessun errore JavaScript.
La shell limitata non avviava Edge; prova completata nel runtime Node disponibile
con percorso esplicito del browser, senza installare dipendenze.
Limiti al termine delle prove locali: non erano ancora eseguiti test fisici
Android dell'incremento, aggiornamento da una cache v1 già installata sul telefono
e verifica online dopo pubblicazione. Segue l'aggiornamento successivo.

Aggiornamento successivo del 15 ottobre: push `gh-pages` a `5b2a891` confermato;
pagina pubblicata con il nuovo selettore e worker `climbing-log-v2` verificati
online. Dopo una nuova chiusura delle schede e riapertura, l'utilizzatore conferma
che le modifiche funzionano sul telefono. Il test completo durante l'allenamento
e la verifica offline Android restano da svolgere.

### Appunti UX da approfondire dopo il test in allenamento

Raccolti il 15 ottobre 2026; discussi e autorizzati il 22 ottobre. Le formulazioni
seguenti conservano i problemi iniziali; la soluzione concordata è descritta sopra.

1. **Eliminazione di una sessione dallo storico.** Valutare il comando e quali
   sessioni rendere eliminabili; definire conferma/eventuale annullamento e
   gestione coerente delle registrazioni collegate.
2. **Data della scheda distinta dalla data della sessione.** La data oggi inclusa
   nel titolo della scheda genera ambiguità anche nelle viste che lo riutilizzano.
   Rivedere la presentazione in scheda, sessione, storico e altre viste collegate;
   valutare come separare titolo e data/periodo della scheda dalla data effettiva
   dell'allenamento.
3. **Pulizia e gerarchia visiva delle schermate.** Individuare testi ed elementi
   da ridurre, accorpare o distinguere meglio per una navigazione più chiara e
   compatta; scegliere gli interventi a partire dalle schermate usate realmente.
4. **Coerenza dei comandi e flusso di backup/ripristino.** Rendere omogenei
   l'aspetto e l'accessibilità di esportazione e ripristino: attualmente esporta
   è un pulsante grande, mentre ripristina appare come testo/selettore file.
   Conservare l'utile riepilogo del contenuto e l'avviso sulla sostituzione dei
   dati. Rivedere insieme passi, etichette e abilitazione dei comandi: oggi
   «Conferma sostituzione» resta disabilitato finché si usa «Scarica backup
   attuale», obbligando a scaricarlo nuovamente anche se già disponibile.
   Valutare un percorso per chi possiede già un backup adeguato, senza decidere
   ora se o come rimuovere il vincolo. «Annulla ripristino» deve restare chiaro.

Priorità concordate dopo il primo uso:

1. Gestione dei risultati: capire quali informazioni servono davvero durante
   l'allenamento, prima di introdurre campi o registrazioni per serie.
2. Visualizzazione dello storico e dei progressi, dentro l'app oppure fuori
   usando un backup esportato. Scegliere confronti concreti insieme all'utilizzatore.
3. Inserimento delle nuove schede quando arriveranno: inizialmente conversione
   assistita PDF/Excel → JSON, con revisione e validazione, senza parser dedicato.

Indicatori di spazio/persistenza/ultimo backup e abbandono delle sessioni non
sono bisogni sentiti e non fanno parte dei prossimi sviluppi. Restano necessarie
le protezioni dei dati già implementate. Timer, editor, filtri e altri comandi
saranno valutati soltanto se emergono dall'uso.

## MVP

| Incremento | Contenuto | Criterio di completamento |
| --- | --- | --- |
| 1. Consultazione | Pagina mobile, fasi ed esercizi sintetici; prova UI in memoria | Implementato e verificato nel browser; leggibilità e tocchi da provare sul telefono |
| 2. Archivio locale e schede | Implementato: IndexedDB v1, JSON, selezione attiva, schede precedenti | Verificati ricarica, validazione e import non distruttivo |
| 3. Sessione | Implementato: avvio, risultato/note, fasi, salvataggio/ripresa, termine | Verificati ripresa ed errori/riprova; abbandono non richiesto |
| 4. Storico e backup | Implementato: dettaglio, versioni conservate, export e restore con conferma/backup | Verificati conservazione, round trip, download e rollback |
| 5. PWA e rilascio | Incremento del 15 ottobre pubblicato e installato; versione del 22 ottobre preparata localmente | Offline browser verificato; pubblicazione e prova Android del nuovo incremento da completare |

Il primo MVP utilizzabile comprende tutti e cinque gli incrementi. Fino alla
verifica del backup usare soltanto dati di prova. Le nuove schede useranno un
JSON dedicato; verificarne l'usabilità.

### Verifiche essenziali

- Validazione e import/export: round trip, versioni non supportate, ID duplicati,
  riferimenti mancanti e file malformati; errori e rollback lasciano intatti i dati.
- IndexedDB: ricarica, ripresa, due schede del browser, errore di scrittura,
  creazione di una nuova versione della scheda.
- Android: tocchi, tastiera, scroll, ritorno dallo sfondo, installazione e offline.
- PWA: cache completa, aggiornamento senza perdere sessioni, sottopercorso Pages.
  Documentare dispositivo/browser verificati.

Aggiungere test mirati insieme alla logica interessata, senza infrastrutture
pesanti. Usare dati sintetici e un ambiente separato; non cancellare lo storico
reale per fare un test. Nessuna dipendenza aggiunta nel primo incremento.

## Dopo l'MVP

### Semplificazione dei formati

Direzione del 15 ottobre attuata nell'incremento del 22 ottobre: un solo formato
backup v3, senza `migrateBackup` o percorsi v1/v2 nell'app. Rimossi campo vuoto
`records.sets`, stato inutilizzato `abandoned` e test delle migrazioni ritirate.
Conservati validazione, protezioni IndexedDB e revisioni delle schede. Conversioni
di vecchi backup fuori dall'app, confrontando integralmente i dati e conservando
l'originale. Non aggiungere nuovi fallback per questo incremento.

### Altri sviluppi da approfondire

Risultati e storico sono le principali aree da esplorare, senza anticipare un
formato strutturato che il test non abbia ancora giustificato. Per confrontare
schede diverse definire equivalenze fra esercizi e risultati confrontabili.

Per schede che cambiano circa ogni mese/sei settimane, il passaggio assistito
con Codex può essere sufficiente: leggere il documento, produrre il JSON
privato conforme al modello, verificare prescrizioni e note, validare e importare.
Chiedere all'allenatrice se è disponibile l'Excel originale; un file tabellare
può rendere più chiari righe, colonne e celle unite. Il PDF rimane utilizzabile.
Parser PDF o Excel dedicato soltanto se la conversione diventa onerosa e il
template è abbastanza stabile. Non serve un editor di schede ora.

Backend, account e sincronizzazione restano fuori dal progetto previsto.

Contesto del 22 ottobre: quest'anno una sessione settimanale; non serve ora il
supporto a giornate con combinazioni diverse di fasi. Manca una scheda di esempio:
valutare il caso e il relativo parser solo per una futura esigenza concreta.
