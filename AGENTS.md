# Istruzioni per Codex

- Usare `README.md` per architettura e avvio, `docs/roadmap.md` per ambito e
  avanzamento, `docs/data-model.md` per dati e import/export. Leggere i documenti
  pertinenti all'incarico, senza imporre l'intera documentazione a ogni modifica.
  Seguire l'incarico corrente; un piano non autorizza da solo l'implementazione.
- Preferire HTML/CSS/JavaScript nativi e moduli ES. Non aggiungere framework,
  dipendenze, backend, account, servizi cloud o database remoti senza una richiesta
  o una decisione concordata. Creare file e astrazioni soltanto quando servono.
- Fare modifiche incrementali, limitate al flusso richiesto. Conservare il lavoro
  esistente; non eliminare o riscrivere PDF, dati o file estranei all'incarico.
- Per ciascun incremento definire risultato, vincoli e criterio osservabile di
  completamento. Pianificare prima le modifiche ambigue o estese; completare
  modifiche locali e verifiche già richieste senza conferme intermedie inutili.
  Se un requisito resta incerto, dichiarare l'ipotesi e chiarire solo ciò che
  influisce sul risultato. Non estendere autonomamente il lavoro alla fase successiva.
- Progettare prima per smartphone Android: HTML semantico, etichette chiare,
  contrasto leggibile, comandi tattili comodi, nessuna dipendenza dall'hover.
  Verificare schermate strette, tastiera, scroll e uso con una mano.
- Proteggere IndexedDB: transazioni, errori visibili, migrazioni versionate e
  nessun reset automatico. Non cambiare schede già usate o eliminare riferimenti
  storici. Non dichiarare salvato un dato prima del completamento della transazione.
- Validare tutto il JSON prima di importarlo; verificare versioni e riferimenti.
  Per ripristini distruttivi prevedere backup preventivo e conferma nell'app.
  Non pubblicare dati personali, backup o schede reali; usare fixture sintetiche.
  Visualizzare note e dati importati come testo, senza eseguire HTML o script.
- Mantenere asset locali, URL relativi e scope PWA compatibile con `/climbing-log/`.
  Gli aggiornamenti della cache non devono cancellare dati o interrompere sessioni.
- Eseguire verifiche proporzionate: test mirati per dati, import/export e migrazioni;
  prove browser per salvataggio, ripresa e offline; Android per uso e installazione.
  Per sola documentazione controllare coerenza e link. Riferire verifiche svolte
  e limiti; non dire che test non eseguiti sono passati.
- Aggiornare la documentazione quando cambiano comportamento, schema o modalità
  di sviluppo. Annotare decisione e motivazione nei documenti esistenti; evitare
  nuovi registri o documenti se bastano quelli presenti.
- Prima di chiudere un incremento rivedere il diff per errori e modifiche fuori
  ambito. Riepilogare file modificati, verifiche osservate e questioni aperte;
  aggiornare lo stato in `docs/roadmap.md`. Quando esisteranno build/test/lint,
  documentare i comandi realmente disponibili nel README, senza inventarli.
