# Uso Android e pubblicazione

La versione implementa schede JSON, sessioni salvate in IndexedDB, ripresa,
termine sessione, storico, backup/ripristino e cache offline. Non serve un parser
PDF: la prima scheda è stata trascritta manualmente e confrontata con il PDF.

## Aggiornamento del 15 ottobre 2026

L'utilizzatore ha svolto un primo allenamento da telefono. La copia in
`local/pages` è ora un repository separato, sul ramo `gh-pages`, con primo commit
`c135d92` e upstream `origin/gh-pages`. I sorgenti nella radice sono su `main`:
prima di questo incremento l'app, i test e la documentazione non erano ancora
stati inclusi in un commit. Non serve cambiare ramo per questo incremento:
`main` conserva i sorgenti e `gh-pages` serve solo i file statici dalla propria
radice. Non cambiare la sorgente Pages in `main` o `/docs`.

Le modifiche locali comprendono:

- note della scheda subito visibili aprendo l'esercizio;
- selettore compatto facoltativo «Stanchezza fine vol/circ/blc», inizialmente «—»;
- «Note precedenti» nella sessione, limitato alla stessa scheda;
- fase, aperture e scroll separati per sessione/dettaglio durante l'uso dell'app.

La cartella `web/` è la fonte del rilascio. La copia `local/pages/` viene
aggiornata da questi sorgenti; lo ZIP del primo rilascio resta una copia storica
e non va usato per pubblicare questa versione. Nessun commit o push è stato
eseguito automaticamente per l'incremento.

### Salvare i sorgenti con Git

Nel terminale, dalla radice `C:\Users\messi\dev\climbing-log`:

```powershell
git status --short
git add .gitignore AGENTS.md README.md docs/*.md tests/ web/
git diff --cached --stat
git diff --cached --check
git commit -m "Track app and improve training notes and fatigue logging"
git push origin main
```

Il commit includerà anche l'app preesistente finora non tracciata. I percorsi
espliciti escludono `local/`, PDF, schede reali e backup, già ignorati. Controllare
il riepilogo prima del commit. Questo push dei sorgenti non aggiorna Pages.

### Pubblicare l'aggiornamento Pages

Prima confrontare la copia preparata con la versione pubblicata:

```powershell
git -C local/pages status --short
git -C local/pages diff --stat
git -C local/pages diff --check
git -C local/pages add app.js data.js db.js index.html styles.css sw.js
git -C local/pages diff --cached --stat
git -C local/pages commit -m "Show training notes, previous results and phase fatigue"
git -C local/pages pull --ff-only origin gh-pages
git -C local/pages push origin gh-pages
```

La copia contiene solo gli asset dell'app. Se pull o push vengono rifiutati,
fermarsi ed esaminare le differenze; non usare `--force` o reset. Se si fanno
altre modifiche in `web/` prima del commit, aggiornare di nuovo la copia:

```powershell
Get-ChildItem .\web -Exclude example-plan.js | Copy-Item -Destination .\local\pages\ -Recurse -Force
```

Attendere il rilascio GitHub Pages e aprire lo stesso indirizzo già usato sul
telefono: `https://tmsmss.github.io/climbing-log/`. La cache passa da
`climbing-log-v1` a `climbing-log-v2`, senza modificare IndexedDB. Il nuovo worker
attende la chiusura di tutte le finestre dell'app: nessun reload forzato durante
una sessione.

### Controllare la nuova versione sul telefono

1. Esportare un backup dall'app già in uso e verificarne il download.
2. Dopo il rilascio aprire l'app online, attendere il caricamento, poi chiudere
   tutte le finestre dell'app e le relative schede Chrome. Riaprire online;
   se si vede ancora la vecchia interfaccia, ripetere chiusura e riapertura.
   Non cancellare dati del sito e non reimportare la scheda per aggiornare l'app.
3. Riprendere la sessione o avviarne una: aprendo un esercizio, controllare note
   della scheda e campo personale visibili insieme. Se ci sono sessioni terminate
   della stessa scheda, provare «Note precedenti» e verificarne la data.
4. In VOL/CIRC/BLC verificare «—» iniziale, scegliere un voto, cambiare fase e
   ricaricare per controllarlo, poi provare a cancellarlo con «—». Il voto non
   deve cambiare gli stati degli esercizi o impedire il termine della sessione.
5. Consultare un dettaglio storico, aprire una fase e un esercizio, tornare alla
   sessione e poi nel menu Storico: deve riaprire il dettaglio consultato.
   «Tutte le sessioni» riapre l'elenco. Dopo ricarica questa memoria si azzera.
6. Attendere «App pronta per l'uso offline» e riprovare apertura/salvataggio in
   modalità aereo. Esportare infine il nuovo backup v2.

L'aggiornamento legge i dati esistenti senza reset. I backup v1 restano
ripristinabili nella nuova app; i nuovi backup v2 richiedono questa versione
o una successiva. Non fare un ripristino soltanto per aggiornare l'app.

## Primo rilascio (procedura storica dell'8 ottobre)

Il rilascio statico è copiato in `local/pages/`, ignorato da Git, e disponibile
anche in `local/climbing-log-pages.zip`. Contiene
soltanto l'app, senza PDF, schede personali, sessioni o backup. Per il test mobile
serve completare GitHub Pages: l'accesso browser a GitHub da Codex è stato
rifiutato, quindi configurazione e pubblicazione vanno eseguite dall'utilizzatore.
Queste erano le istruzioni del primo rilascio, ora già eseguito; per gli
aggiornamenti usare la procedura sopra, senza ripetere `git init`.

Dalla radice del progetto, nel terminale di PyCharm, pubblicare la copia preparata
su un nuovo ramo `gh-pages` (nessun comando forza o sovrascrive un ramo remoto):

```powershell
git -C local/pages init -b gh-pages
git -C local/pages add .
git -C local/pages commit -m "Publish Climbing Log first test"
git -C local/pages remote add origin git@github.com:tmsmss/climbing-log.git
git -C local/pages push -u origin gh-pages
```

Se `gh-pages` esiste già, il push può essere rifiutato: fermarsi e valutare il
ramo esistente, senza aggiungere `--force`. Questa procedura riguarda il primo
rilascio; non riutilizzare la copia senza aggiornarla da `web/` per futuri rilasci.

In GitHub aprire **Settings → Pages → Build and deployment**, scegliere
**Deploy from a branch**, ramo **gh-pages**, cartella **/(root)**, quindi **Save**.
Attendere il completamento del rilascio; aprire il collegamento mostrato da GitHub.
Indirizzo previsto: `https://tmsmss.github.io/climbing-log/`.
Procedura verificata sulla [documentazione ufficiale GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).
Non è necessario cambiare la visibilità del repository per questa procedura:
se GitHub richiede un piano diverso o un repository pubblico, fermarsi e valutare
prima di rendere pubblico il repository, che contiene documentazione personale.

## Preparazione del telefono

1. Trasferire sul telefono `local/scheda-2026-10-08.json`, per esempio tramite
   USB. Il file è ignorato da Git e non incluso nel sito. Non trasferire il PDF
   attraverso il repository pubblico.
2. Aprire il sito in Chrome Android, sul profilo che verrà usato per allenarsi.
3. Menu → **Schede e backup** → **Importa e attiva una scheda JSON**, selezionare
   il file trasferito. Verificare titolo, sei fasi e note prima di iniziare.
4. Aspettare **App pronta per l’uso offline**. Installare tramite il menu di
   Chrome (**Aggiungi a schermata Home / Installa app**, secondo la versione).
5. Avviare una sessione, scrivere una nota breve, aspettare **Dati salvati sul
   dispositivo**, ricaricare e verificare la ripresa. Provare anche riapertura
   in modalità aereo prima di uscire di casa; riattivare poi la connessione.

`localhost:8000` sul telefono indica il telefono, non il computer: per questo
test usare l'indirizzo HTTPS di GitHub Pages.

## Durante e dopo l'allenamento

- «+» apre ciascun esercizio; note della scheda e risultato personale restano
  separati e subito visibili. Il controllo a destra cicla vuoto → spunta → croce → vuoto.
- Navigare tra le fasi non cambia stati o testi. Le scritture sono immediate;
  attendere il messaggio di salvataggio prima di chiudere l'app.
- «Completa fase» include anche gli esercizi saltati e conserva il testo;
  annullamento disponibile fino alla prossima modifica degli stati.
- **Termina sessione → Conferma termine** archivia la sessione. Esercizi vuoti
  e saltati conservano il proprio stato; il dettaglio storico è in sola lettura.
- Menu → **Schede e backup → Esporta backup JSON**, verificare il download e
  conservare il file. Fare il backup anche dopo il primo test.
- Se compare un errore, il testo digitato resta nella pagina: usare **Riprova
  salvataggio**. Non ricaricare mentre ci sono modifiche non salvate.

## Limiti e osservazioni da raccogliere

Verificato nel browser Edge, inclusi offline e ripristino con rollback. Primo uso
da telefono riferito dall'utilizzatore; l'incremento del 15 ottobre deve essere
pubblicato e provato sul dispositivo. Installazione e offline Android non sono
stati confermati separatamente.
Nessuna sincronizzazione: dati del computer e dati del telefono sono distinti.
Cambiare browser, profilo o indirizzo del sito non trasferisce lo storico.

Osservare tocchi con una mano, tastiera, testo leggibile, scorrimento e facilità
di trovare la fase. Alla prossima revisione indicare dispositivo/versione Chrome,
problema incontrato e passaggi per riprodurlo. Il parser PDF resta successivo.
