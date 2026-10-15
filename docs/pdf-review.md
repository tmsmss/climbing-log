# Analisi della scheda e revisione dei mockup

Analisi dell'8 ottobre 2026: PDF locale di una pagina, letto tramite estrazione
del testo e controllo visivo completo. Nessun parser sviluppato e nessuna scheda
reale trascritta da importare o pubblicare.

## Struttura osservata

- Intestazione con titolo, date di validità, obiettivo, frequenza/durata e referente.
  Il referente non serve al funzionamento dell'MVP.
- Calendario settimanale: soltanto il giovedì contiene sezioni assegnate,
  nell'ordine RISC, MOB, RSPEC, VOL, CIRC, BLC.
- Legenda di otto sigle; soltanto sei sono sezioni utilizzate. Non creare sezioni vuote.
- 19 voci: 2 riscaldamento generale, 6 mobilità, 3 riscaldamento specifico,
  3 volume, 2 circuiti, 3 blocchi.
- Colonne: numero locale, esercizio, ripetizioni, serie, pausa tra ripetizioni,
  pausa tra serie, note. Il numero riparte per sezione e nei blocchi ha un salto:
  non usarlo come ID o indice di ordinamento.
- Celle unite: alcune note valgono per gruppi di esercizi. L'estrazione testuale
  da sola non basta per assegnarle correttamente.

## Conseguenze per il modello

1. Servono due pause distinte. Conservare `restSeconds` come pausa tra serie e
   aggiungere `restBetweenRepsSeconds` per la pausa tra ripetizioni/blocchi.
   Il controllo visivo ha rilevato una riga con entrambe valorizzate.
2. Le ripetizioni possono contenere conteggi, durata o testo composto.
   Conservare sempre `repsText`; compilare `durationSeconds` solo quando chiaro.
3. Il calendario prescrive sezioni, non sessioni svolte. Proporre `weeklySchedule`
   facoltativo nella scheda con giorno ISO e sequenza di ID di sezioni.
   Questa scheda non richiede un selettore di giornata.
4. Conservare obiettivo in `focus` e frequenza/durata originale in `scheduleText`,
   senza anticipare una normalizzazione non confermata.
5. Nell'MVP assegnare le note condivise a ciascun esercizio interessato,
   senza creare un'entità per gruppi. Prescrizioni e risultati restano separati.

## Ambiguità da chiarire

- Significato della notazione composta nelle ripetizioni: non confermabile dal solo PDF.
- La frequenza/durata sembra indicare una sessione settimanale di un'ora e mezza:
  interpretazione plausibile, da confermare.
- Pausa tra serie presente anche per serie singole: conservarla senza decidere
  se rappresenti la pausa prima dell'esercizio successivo.
- Il PDF prescrive attività, non un formato di diario per tentativi e riuscite.

## Prototipo per la revisione

Prime due versioni: tre viste di un unico flusso mobile con dati sintetici (scheda, sessione, storico)
con dettaglio. La prima versione ha sei esercizi (uno per sezione); la revisione
per fasi ne ha dodici (due per sezione). Numeri, testi e risultati
sono dimostrativi e non costituiscono una scheda di allenamento consigliata.

Simulazioni delle prime versioni: avvio; risultato e nota per esercizio; completato/saltato; interruzione
e ripresa nella stessa anteprima; chiusura e consultazione del dettaglio.
Lo stato resta solo in memoria. Ricaricare azzera la prova: nessuna persistenza,
PWA, backup o sessione reale è implementata.

Decisione confermata dall'utilizzatore: **risultato per esercizio nell'MVP**,
con completato/saltato e un unico campo facoltativo «Risultato e note»;
dettaglio per serie rinviato.
Il controllo di design permette di confrontare note espanse e consultazione compatta.

### Feedback sul primo prototipo

- Rendere la sessione più compatta, unendo risultato e nota per esercizio.
- Usare le fasi della scheda (RISC, MOB, RSPEC, VOL, CIRC, BLC) come blocchi
  di consultazione e avanzamento. Conservare lo scorrimento tra esercizi dentro
  il blocco; non passare a una schermata per esercizio.
- Confermata la possibilità di navigare liberamente tra fasi, anche per vedere
  cosa aspetta. Il nuovo prototipo mostra l'indice delle sei fasi e il contenuto
  della fase selezionata, con scorrimento degli esercizi al suo interno.
- Confermate entrambe le azioni: completamento singolo e completamento della fase.
  «Completa fase» significa tutti gli esercizi del blocco completati, compresi
  quelli saltati; i testi restano. Navigare non completa niente e non fa avanzare
  automaticamente. Si può annullare l'azione collettiva fino a un'altra modifica
  degli stati; l'annullamento non modifica il testo.
- Il nuovo prototipo contiene campo unico e due esercizi per fase; nello storico
  usa lo stesso raggruppamento. Tornare alla scheda permette di consultare altre
  fasi senza cambiare la fase ripresa dalla sessione.

### Ultima iterazione concordata

- Trascritte manualmente tutte le 19 voci del PDF nell'anteprima locale fuori dal
  repository, senza parser. Testi conservati, unendo solo le interruzioni di riga
  e usando simboli tipografici per minuti/secondi. Nessun nome del referente copiato.
- Note condivise verificate visivamente: generale per entrambe le voci RISC,
  anche per MOB 1–3 e spalle per MOB 4–6. Nessuna nota inventata nelle celle vuote.
- Riga unica per serie, ripetizioni e pause; distingue le due pause. Va a capo
  quando lo schermo è stretto. Nessuna dicitura «non indicato» per valori assenti.
- Espandibile soltanto il contenuto della colonna note; le istruzioni già presenti
  nel nome dell'esercizio rimangono lì, anche se il nome è lungo.
- Un controllo vicino al nome cicla vuoto → spunta → croce → vuoto. Nessuna
  etichetta di stato per esercizio e nessun pulsante separato completato/salta.
  Il bersaglio tattile resta di 44 px, pur con un simbolo visivo piccolo.
- Eliminato «Interrompi e torna alla scheda»; la sessione si naviga come la scheda.
  Menu scheda/sessione/storico nascosto e richiamabile da un'icona con nome accessibile.
- Unico campo risultato/note, facoltativo; completamento fase e annullamento restano.

La prima implementazione della consultazione è ora in `web/`, con fixture
sintetiche e queste scelte UI. Aggiunto il «+» prima del nome per aprire
il pannello dell'esercizio, lasciando il toggle a destra. Aperture indipendenti,
senza richiusura automatica; note prescritte e campo personale nel pannello.
La prima prova sessione era solo in memoria. Nell'incremento successivo sono
stati aggiunti IndexedDB e una trascrizione JSON privata delle 19 voci,
confrontata con la pagina renderizzata e validata. Il file si trova in
`local/scheda-2026-10-08.json`, ignorato da Git e assente dal sito pubblico;
il referente non viene copiato. Pause e notazioni composte sono conservate,
senza parser. Parser rinviato a dopo un periodo d'uso e all'arrivo
di una nuova scheda; nessuna interpretazione delle notazioni ambigue necessaria ora.
Questa è l'ultima iterazione di mockup pianificata. La persistenza è ora implementata;
istruzioni e limiti del primo uso in [primo test](first-test.md).

Verifiche dell'ultima anteprima: 19 voci e distribuzione 2/6/3/3/2/3; toggle a tre
stati, testo conservato, completamento fase e annullamento, menu/Escape, navigazione,
ripresa e storico. Sei fasi a 320/390/736 px in tema chiaro/scuro, note aperte incluse,
senza overflow orizzontale o errori JavaScript. Controllati visivamente MOB e BLC.
Queste prove non verificano IndexedDB, PWA né uso su Android.

Prova dell'ultima anteprima: leggere le due pause, avviare, scrivere un risultato,
provare il ciclo degli stati, completare una fase, navigare e chiudere.
Verificare nello storico che prescrizione e risultato siano separati.
Osservare leggibilità, tocchi e utilità del campo risultato sul telefono.

Le scelte emerse dalla revisione condivisa sono applicate al primo incremento.
Verifica su Android ancora da svolgere. Le prove del codice applicativo sono
documentate nella [roadmap](roadmap.md).

Verifiche eseguite: Edge, tre viste a 320/390/736 px senza overflow orizzontale;
avvio, input, completato/saltato, interruzione/ripresa e storico. Anteprime
controllate visivamente; nessun errore JavaScript osservato. Nessuna prova della
persistenza reale o dell'installazione PWA.
