# Questionario per chi vende su Vinted

Nov 4, 2026 · @Marco Gargiulo

Una pagina con 12 domande in 5 schermate (versione v2, dal 5 novembre 2026). Le risposte finiscono in un Google Sheet. Costo zero.

**Come funziona:** la pagina sta su GitHub Pages (repository `gestionale-vinted/gestionale-vinted.github.io`). Alla fine manda le risposte a uno script Google (Apps Script), che le controlla e aggiunge una riga al foglio. Nessun cookie, nessun analytics, nessun collegamento a Vinted.

## I file

| File | Cosa fa |
| --- | --- |
| `index.html` | Le domande e le schermate |
| `style.css` | La grafica |
| `app.js` | Avanzamento, controlli, invio. Contiene `SCRIPT_URL`, l'indirizzo dello script Google |
| `apps-script/Codice.gs` | Lo script che salva le risposte: si incolla in Google, non gira su GitHub |

## L'unica parte da fare a mano: lo script Google (5 minuti)

Va fatta con l'account Google del progetto, perché il foglio deve essere vostro.

1. Vai su [sheets.new](https://sheets.new) e chiama il file **Questionario – risposte**.
2. Menu **Estensioni → Apps Script**. Cancella tutto e incolla il contenuto di `apps-script/Codice.gs`. Premi **Salva**.
3. **Esegui il deployment → Nuovo deployment** → ingranaggio → **App web**:
   - Esegui come: **Io**
   - Chi ha accesso: **Chiunque**
   - poi **Esegui il deployment**.
4. Google chiede le autorizzazioni e mostra "Google non ha verificato questa app": è normale, perché lo script è vostro. Premi **Avanzate → Vai a … (non sicuro) → Consenti**.
5. Copia l'**URL dell'app web** (finisce con `/exec`) e incollalo in `app.js` al posto di `INCOLLA_QUI_URL_WEB_APP`. Poi carica di nuovo `app.js` sul repository (oppure manda l'URL a Claude, che lo aggiorna).

Le intestazioni del foglio le scrive lo script alla prima risposta. Finché l'URL non c'è, la pagina mostra una striscia gialla "Modalità prova" e non salva nulla.

## Un link per ogni gruppo

Si aggiunge `?fonte=` con un nome breve, solo lettere minuscole, numeri e trattini:

```
https://gestionale-vinted.github.io/?fonte=fb-sneakersitalia
https://gestionale-vinted.github.io/?fonte=tg-vinteddit
https://gestionale-vinted.github.io/?fonte=amici
```

Chi apre il link senza `?fonte=` viene salvato come `diretto`. Tenete l'elenco dei link usati nel foglio dei gruppi (task 17).

## Le colonne del foglio

Le risposte v2 vanno nella scheda **Risposte v2** (lo script la crea da solo alla prima risposta):

`data_ora, fonte, q1_vendi, q2_articoli, q3_dove, q3_altro, q4_piva, q5_dac7, q6_fisco, q7_tempo_capo, q8_perdi_tempo, q8_altro, q9_conti, q10_utile, q11_proveresti, email, consenso, versione`

Le risposte della prima versione (11 domande) restano nella scheda **Risposte**, con le vecchie colonne. Non vanno mescolate: le domande e alcune opzioni sono cambiate.

Le risposte multiple sono in una sola cella, separate da `; `.

## Passare dalla v1 alla v2 (una volta sola, in quest'ordine)

1. **Prima lo script.** Apri il foglio → **Estensioni → Apps Script** → sostituisci tutto con il nuovo `apps-script/Codice.gs` → **Salva**. Poi **Esegui il deployment → Gestisci deployment → matita → Versione: Nuova versione → Esegui il deployment**. L'URL resta lo stesso, quindi `app.js` non va toccato.
2. **Prova lo script:** nell'editor scegli `provaSalvataggio` e premi **Esegui**. Nel foglio compare la scheda **Risposte v2** con una riga `prova-editor`: cancella quella riga (non le intestazioni).
3. **Poi la pagina.** Carica sul repository i tre file aggiornati: `index.html`, `style.css`, `app.js`. Dal sito di GitHub: apri il repository → **Add file → Upload files** → trascina i tre file → **Commit changes**. Dopo 1–2 minuti la pagina è aggiornata.
4. **Controllo finale:** apri `https://gestionale-vinted.github.io/?fonte=prova-v2` dal telefono, compila, invia e verifica la riga nella scheda **Risposte v2**. Poi cancellala.

Lo script accetta ancora anche le risposte v1, per chi aveva la vecchia pagina aperta durante l'aggiornamento. Dopo qualche giorno si può togliere il blocco `v1` da `Codice.gs` (facoltativo).

## Se modificate lo script

Salvare non basta. Bisogna fare **Esegui il deployment → Gestisci deployment → matita → Versione: Nuova versione → Esegui il deployment**. L'URL resta lo stesso.

Se cambiate un'opzione di risposta, va cambiata **sia in `index.html` sia in `Codice.gs`** (blocco `v2`), scritta esattamente uguale. Se cambiano le domande, conviene creare una nuova versione (`v3`) con una sua scheda, come fatto per la v2, e aggiornare `VERSIONE` in `app.js`.

## Privacy

- Il foglio si condivide solo tra voi tre.
- L'email si salva solo con la casella del consenso spuntata: lo controllano sia la pagina sia lo script.
- Se qualcuno chiede la cancellazione: cercate la sua email nel foglio e cancellate la riga, entro un mese.
- Dopo 12 mesi, o a fine progetto, cancellate la colonna email.
- Il contatto per la privacy nell'informativa è gstvinted@gmail.com: controllate quella casella, perché le richieste di cancellazione arrivano lì.

## Leggere le risposte

- **Dati → Crea un filtro** per filtrare, per esempio, solo chi "Compro per rivendere".
- **Inserisci → Tabella pivot** con righe `fonte`: si vede quale gruppo porta più risposte.
- Il dato più affidabile non è la domanda 11: è **quante persone lasciano l'email**. Sono anche i primi candidati per le interviste (vedi "Task 19 – Guida alle interviste").

Progetto indipendente, non affiliato a Vinted.
