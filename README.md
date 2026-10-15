# Climbing Log

Web app personale per consultare da Android le schede di arrampicata e registrare
allenamenti, conservando le versioni delle schede e lo storico.

## Stato attuale

Prima versione funzionante: consultazione per fasi, importazione di schede JSON,
IndexedDB, sessioni con salvataggio progressivo e ripresa, termine con conferma,
storico in sola lettura, backup/ripristino JSON e cache offline PWA.
Primo allenamento da telefono effettuato dall'utilizzatore. La copia di rilascio
ha già un commit su `gh-pages` in `local/pages`; installazione e modalità aereo
su Android non sono state confermate separatamente.
L'incremento del 15 ottobre aggiunge note subito visibili, stanchezza facoltativa
per VOL/CIRC/BLC, note precedenti della stessa scheda e memoria della navigazione.

Per uso Android e aggiornamenti Pages seguire [le istruzioni](docs/first-test.md). La scheda del
PDF è stata trascritta manualmente in `local/scheda-2026-10-08.json`, ignorata da
Git: importarla nell'app sul telefono. Il sito contiene solo il programma.

## Architettura

HTML semantico, CSS e JavaScript con moduli ES nativi. Nessun framework, build,
backend, account, sincronizzazione o dipendenza runtime. Una pagina, navigazione
hash: scheda, sessione, storico/dettaglio e schede/backup. URL relativi per Pages
sotto `/climbing-log/`. Asset locali, senza CDN o font remoti.

| Opzione | Valutazione |
| --- | --- |
| HTML/CSS/JS nativi | Scelti: dimensioni contenute, pubblicazione diretta e pochi strumenti |
| Framework leggero, ad esempio Preact | Rivalutare solo per duplicazioni o stato UI difficile; ora aggiungerebbe dipendenze e convenzioni |

- `app.js`: viste, memoria della navigazione e coda di salvataggio; testi resi come testo semplice.
- `db.js`: IndexedDB v1, transazioni e operazioni atomiche, senza reset automatici.
- `data.js`: schede JSON v1, backup v2 con migrazione esplicita da v1,
  validazione di JSON, relazioni e integrità storica.
- `sw.js`: cache dei soli asset dell'app; non gestisce i dati di allenamento.

Schede, esercizi, sessioni e registrazioni sono separati. Una scheda usata non
viene modificata: una revisione richiede nuovi ID. Dati e formati sono descritti
nel [modello](docs/data-model.md); [roadmap](docs/roadmap.md) e
[revisione PDF](docs/pdf-review.md) conservano decisioni e avanzamento.

## Interazione mobile

Sei fasi liberamente navigabili; scorrimento dentro la fase. Ogni esercizio mostra
nome e riga di serie/ripetizioni/pause, omettendo i valori mancanti. «+» a sinistra
apre il pannello; aperture indipendenti, senza richiusura automatica. Dentro:
note prescritte subito visibili e un solo campo facoltativo «Risultato e note».
Toggle a destra: vuoto → spunta → croce → vuoto, con bersaglio di 44 px.
«Completa fase» include gli esercizi saltati, conserva il testo e permette di
annullare fino alla prossima modifica degli stati. Menu normalmente nascosto.

Sotto gli esercizi di VOL/CIRC/BLC, «Stanchezza fine vol/circ/blc» usa un
selettore nativo compatto da 1 a 10: inizialmente «—», facoltativo, modificabile
e cancellabile scegliendo «—». Nessun vincolo al completamento. Lo storico
mostra il valore in sola lettura; assenza significa non registrato, non zero.

Durante la sessione, se esistono sessioni terminate precedenti con lo stesso
`planId`, «Note precedenti» è disponibile dentro ciascun esercizio. Mostra
l'ultima nota non vuota per lo stesso `exerciseId`, con data, oppure l'assenza
di note. Non copia il testo nel risultato attuale e non confronta schede diverse.
Fase, esercizi aperti e scroll sono separati per schermata e sessione, in memoria
fino alla ricarica/chiusura. Il menu Storico riapre l'ultimo dettaglio consultato;
«Tutte le sessioni» torna all'elenco. La fase della sessione attiva continua
anche a essere salvata su dispositivo per la ripresa dopo ricarica.

Le scritture sono immediate; «Dati salvati sul dispositivo» compare soltanto
dopo la transazione. In caso di errore l'input resta nella pagina e si può
riprovare. Termine e backup attendono i salvataggi. «Termina sessione» conserva
anche esercizi vuoti o saltati; lo storico non permette modifiche.

## Protezione dei dati e offline

Dati legati a origine, browser e profilo: il computer non sincronizza il telefono.
Non cancellare i dati del sito. La richiesta `navigator.storage.persist()` è
solo una possibilità, non sostituisce i backup. Esportare dopo l'allenamento.
Nessuna cifratura locale o dei file di backup.

L'importazione aggiunge e attiva una scheda senza sovrascrivere il passato.
Il ripristino completo valida prima, richiede un backup preventivo e conferma,
poi sostituisce in un'unica transazione. In caso di errore restano i dati precedenti.
Il browser avvia il download: verificare che il file sia stato conservato.

PWA: manifest e icone locali, primo caricamento online; aspettare «App pronta
per l’uso offline» e provare modalità aereo. Nuovi service worker attendono la
chiusura delle finestre dell'app, evitando reload durante un allenamento.
Per aggiornamenti futuri incrementare il nome della cache in `sw.js`; eliminare
solo cache Climbing Log obsolete, mai IndexedDB.

PDF e file in `local/` sono ignorati da Git. Pubblicare soltanto `web/`, senza
schede personali o backup. [Procedura del primo rilascio](docs/first-test.md).

## Struttura

```text
climbing-log/
├── README.md
├── AGENTS.md
├── main.py                  # esempio PyCharm preesistente, non avvia l'app
├── docs/                    # modello, roadmap, revisione PDF, primo test
├── local/                   # ignorata: scheda personale e copia di rilascio
├── tests/                   # validazione e prove browser, dati sintetici
└── web/
    ├── index.html
    ├── styles.css
    ├── app.js
    ├── db.js
    ├── data.js
    ├── example-plan.js      # fixture sintetica usata dai test
    ├── manifest.webmanifest
    ├── sw.js
    └── icons/
```

## Sviluppo locale

Aprire il progetto in PyCharm. Dalla radice, con un interprete Python disponibile:

```powershell
python -m http.server 8000 --bind 127.0.0.1 --directory web
```

Aprire `http://localhost:8000`, non `file://`. Fermare il server con Ctrl+C.
Su questo computer `python` puntava all'alias WindowsApps: usare l'interprete
configurato in PyCharm, oppure il percorso dell'eseguibile preceduto da `&`.
Il server è stato verificato con il Python già incluso nel runtime Codex, senza
installazioni. Non cambiare porta o indirizzo se si vogliono ritrovare gli stessi dati.
Per Android/PWA usare HTTPS: localhost sul telefono indica il telefono.

## Verifiche

Con Node già disponibile, nessun pacchetto necessario per la validazione:

```powershell
node --test tests/data.test.mjs
```

Prova browser con Playwright e Python già disponibili, senza installare nulla:

```powershell
node tests/browser-check.mjs '<percorso di playwright/index.mjs>' '<eseguibile Python>'
```

È possibile aggiungere un quarto argomento con il percorso dell'eseguibile
browser se Edge non viene individuato tramite il canale `msedge`. Sul computer
corrente i percorsi disponibili sono:

```powershell
node tests/browser-check.mjs 'C:/Users/messi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs' 'C:/Users/messi/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe' 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
```

Questa prova usa un server temporaneo e un profilo browser separato, con Edge e
fixture sintetiche; non accede all'archivio personale. Il 15 ottobre sono passati
28 test di validazione/migrazione e la prova browser completa: ricarica/ripresa, testo letterale, stato e
annullamento, errore di scrittura/riprova, singola sessione fra due finestre,
import duplicato, rollback ripristino, termine/storico, download e restore,
riapertura/salvataggio offline sotto `/climbing-log/`, sei fasi a 320/390/736 px
in tema chiaro/scuro. Nessun errore JavaScript; controllo visivo mobile nel browser.
Comprende inoltre note immediate, stanchezza (vuoto, cancellazione, riprova,
storico e backup), note precedenti limitate alla stessa scheda, navigazione
separata con ripristino dello scroll e dati IndexedDB v1 già presenti.
Gli esiti dell'ultima esecuzione e i limiti sono nella [roadmap](docs/roadmap.md).
L'incremento deve ancora essere provato sul telefono e pubblicato.

## Collaborazione e prossimi passi

Modifiche piccole e verificabili, con risultato, vincoli e criterio di completamento.
Regole concise in `AGENTS.md`; decisioni nei documenti esistenti. Seguono le
[best practices](https://learn.chatgpt.com/guides/best-practices) e il principio di
[iterazione con Codex](https://developers.openai.com/cookbook/examples/codex/iterating-development-workflows-with-codex),
senza aggiungere infrastrutture finché non servono.

Pubblicare e provare su Android l'incremento del 15 ottobre. Gli altri sviluppi
restano fermi per decisione dell'utilizzatore: gestione strutturata di gradi e
risultati, visualizzazione dei progressi nell'app o
attraverso analisi esterne dei backup. Indicatori di affidabilità e abbandono delle
sessioni non sono richiesti. Per le nuove schede preferire inizialmente conversione
assistita PDF/Excel → JSON, validata e revisionata: un parser dedicato è opzionale,
da giustificare con frequenza, fatica e stabilità del template.
L'utilizzatore chiederà se è disponibile l'Excel originale; il PDF resta sufficiente.
Per schede future con giorni
diversi, chiarire quali sezioni compongono una sessione: la versione corrente
usa tutte le sezioni della scheda. Sei settimane è un'indicazione, non una
scadenza che elimina dati o impedisce l'uso.
