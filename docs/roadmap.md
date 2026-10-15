# Roadmap incrementale

Ogni incremento produce un risultato piccolo da verificare insieme. Seguire
l'incarico corrente: la roadmap non autorizza da sola la fase successiva.

## Stato e metodo di avanzamento

Aggiornamento: 15 ottobre 2026.

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
  Primo allenamento da telefono svolto dall'utilizzatore; installazione e
  modalità aereo su Android non confermate separatamente.
- Pubblicazione: `local/pages/` è un repository su `gh-pages`, con commit
  `c135d92` e upstream `origin/gh-pages`. Sorgenti su `main`, app preesistente
  ancora senza commit nella radice. Istruzioni aggiornate in `docs/first-test.md`.
- Incremento del 15 ottobre: note immediate, stanchezza per fase, note precedenti
  della stessa scheda e memoria della navigazione implementate localmente;
  verifiche locali completate, pubblicazione e prova Android dell'incremento
  da completare.

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

Pubblicare l'incremento locale con la [procedura Git/Pages](first-test.md) e
provarlo sul telefono usando lo stesso indirizzo/profilo, senza cancellare dati
o reimportare la scheda. Confermare compattezza del selettore, consultazione
delle note durante l'allenamento e aggiornamento/offline della PWA.
Gli altri sviluppi elencati sotto restano fermi per decisione dell'utilizzatore.

### Incremento autorizzato il 15 ottobre

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
Non eseguiti: test fisici Android dell'incremento, aggiornamento da una cache
v1 già installata sul telefono e verifica online dopo pubblicazione.

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
| 5. PWA e rilascio | PWA implementata; prima copia Pages su gh-pages, primo uso da telefono riferito | Offline browser verificato; aggiornamento corrente e installazione/offline Android da verificare |

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

### Semplificazione futura dei formati

Preferenza confermata dall'utilizzatore il 15 ottobre 2026: privilegiare una
base codice pulita e semplice, con un unico formato corrente dei dati, evitando
di accumulare nell'app riconoscimenti, percorsi alternativi e migrazioni per
più formati precedenti. In un futuro incremento dedicato, rivedere e rimuovere
la compatibilità storica diventata superflua, compresi fallback e test dedicati
ai formati ritirati.

Quando necessario, convertire i backup delle sessioni precedenti al formato
corrente con un passaggio assistito fuori dall'app, anche con l'aiuto di Codex.
Verificare la conversione conservando sessioni, risultati, note e riferimenti;
le revisioni storiche delle schede mantengono prescrizioni e identità distinte.
La compatibilità v1/v2 appena implementata resta per ora invariata: questa è
una direzione di manutenzione futura, senza avviare ora la pulizia.

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
