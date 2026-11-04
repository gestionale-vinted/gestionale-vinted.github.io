# Questionario per chi vende su Vinted

Nov 4, 2026 · @Marco Gargiulo

Una pagina con 11 domande in 5 schermate. Le risposte finiscono in un Google Sheet. Costo zero.

**Come funziona:** la pagina sta su GitHub Pages (repository `gestionale.vinted`). Alla fine manda le risposte a uno script Google (Apps Script), che le controlla e aggiunge una riga al foglio. Nessun cookie, nessun analytics, nessun collegamento a Vinted.

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
https://gargiu999.github.io/gestionale.vinted/?fonte=fb-sneakersitalia
https://gargiu999.github.io/gestionale.vinted/?fonte=tg-vinteddit
https://gargiu999.github.io/gestionale.vinted/?fonte=amici
```

Chi apre il link senza `?fonte=` viene salvato come `diretto`. Tenete l'elenco dei link usati nel foglio dei gruppi (task 17).

## Le colonne del foglio

`data_ora, fonte, q1_vendi, q2_articoli, q3_piva, q4_dac7, q5_fisco, q6_tempo_capo, q7_perdi_tempo, q7_altro, q8_conti, q9_utile, q10_interesse, email, consenso, versione`

Le risposte multiple sono in una sola cella, separate da `; `.

## Se modificate lo script

Salvare non basta. Bisogna fare **Esegui il deployment → Gestisci deployment → matita → Versione: Nuova versione → Esegui il deployment**. L'URL resta lo stesso.

Se cambiate un'opzione di risposta, va cambiata **sia in `index.html` sia in `Codice.gs`**, scritta esattamente uguale. Cambiate anche `VERSIONE` in `app.js`.

## Privacy

- Il foglio si condivide solo tra voi tre.
- L'email si salva solo con la casella del consenso spuntata: lo controllano sia la pagina sia lo script.
- Se qualcuno chiede la cancellazione: cercate la sua email nel foglio e cancellate la riga, entro un mese.
- Dopo 12 mesi, o a fine progetto, cancellate la colonna email.
- Il contatto per la privacy nell'informativa è gstvinted@gmail.com: controllate quella casella, perché le richieste di cancellazione arrivano lì.

## Leggere le risposte

- **Dati → Crea un filtro** per filtrare, per esempio, solo chi "Compro per rivendere".
- **Inserisci → Tabella pivot** con righe `fonte`: si vede quale gruppo porta più risposte.
- Il dato più affidabile non è la domanda 10: è **quante persone lasciano l'email**. Sono anche i primi candidati per le interviste (vedi "Task 19 – Guida alle interviste").

Progetto indipendente, non affiliato a Vinted.
