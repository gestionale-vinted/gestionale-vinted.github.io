/**
 * Questionario per chi vende online – script che salva le risposte nel foglio.
 *
 * Va incollato in: Google Sheet > Estensioni > Apps Script.
 * Si pubblica come "App web" (vedi README.md).
 *
 * Controlla ogni risposta prima di salvarla e scrive l'email SOLO se c'è il consenso.
 * Le opzioni qui sotto devono restare identiche a quelle di index.html.
 */

var FUSO_ORARIO = "Europe/Rome";

/*
 * Una configurazione per ogni versione del questionario.
 * v2 = versione attuale (12 domande), scheda "Risposte v2".
 * v1 = versione precedente (11 domande), scheda "Risposte": resta solo per non perdere
 *      le risposte di chi aveva ancora la vecchia pagina aperta. Si può togliere tra qualche giorno.
 * "campi" sono le domande nell'ordine delle colonne (tra fonte ed email).
 * I campi "_altro" si salvano solo se nella domanda collegata è scelto "Altro".
 */
var VERSIONI = {
  v2: {
    scheda: "Risposte v2",
    colonne: [
      "data_ora", "fonte",
      "q1_vendi", "q2_articoli", "q3_dove", "q3_altro",
      "q4_piva", "q5_dac7", "q6_fisco",
      "q7_tempo_capo", "q8_perdi_tempo", "q8_altro",
      "q9_conti",
      "q10_utile", "q11_proveresti",
      "email", "consenso", "versione"
    ],
    campi: ["q1", "q2", "q3", "q3_altro", "q4", "q5", "q6", "q7", "q8", "q8_altro", "q9", "q10", "q11"],
    opzioni: {
      q1: ["Solo capi miei", "Compro per rivendere", "Entrambi"],
      q2: ["Meno di 10", "10–30", "30–100", "Oltre 100"],
      q3: ["Vinted", "Subito", "eBay", "Depop", "Altro"],
      q4: ["Sì", "No, ma ci sto pensando", "No"],
      q5: ["Sì, bene", "Più o meno", "No"],
      q6: ["Io", "Un commercialista", "Nessuno"],
      q7: ["Meno di 5 minuti", "5–10 minuti", "Più di 10 minuti"],
      q8: ["Scrivere gli annunci", "Foto", "Conto per dichiarazione dei redditi (commercialista)",
           "Tenere i conti", "Altro"],
      q9: ["Excel o Google Fogli", "Quaderno o note", "Un'app", "Non li tengo"],
      q10: ["Vedere i margini su ogni capo", "Avvisi sulle soglie fiscali",
            "Dati pronti per il commercialista", "Annunci scritti con l'AI"],
      q11: ["Sì", "Forse", "No"]
    },
    singole: ["q1", "q2", "q4", "q5", "q6", "q7", "q9", "q11"],
    multiple: ["q3", "q8", "q10"]
  },
  v1: {
    scheda: "Risposte",
    colonne: [
      "data_ora", "fonte",
      "q1_vendi", "q2_articoli",
      "q3_piva", "q4_dac7", "q5_fisco",
      "q6_tempo_capo", "q7_perdi_tempo", "q7_altro",
      "q8_conti",
      "q9_utile", "q10_interesse",
      "email", "consenso", "versione"
    ],
    campi: ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q7_altro", "q8", "q9", "q10"],
    opzioni: {
      q1: ["Solo capi miei", "Compro per rivendere", "Entrambi"],
      q2: ["Meno di 10", "10–30", "30–100", "Oltre 100"],
      q3: ["Sì", "No, ma ci sto pensando", "No"],
      q4: ["Sì, bene", "Più o meno", "No"],
      q5: ["Io", "Un commercialista", "Nessuno"],
      q6: ["Meno di 5 minuti", "5–10 minuti", "Più di 10 minuti"],
      q7: ["Scrivere gli annunci", "Foto", "Spedizioni", "Tenere i conti", "Altro"],
      q8: ["Excel o Google Fogli", "Quaderno o note", "Un'app", "Non li tengo"],
      q9: ["Vedere i margini su ogni capo", "Avvisi quando ti avvicini alle soglie fiscali",
            "Dati pronti per il commercialista", "Annunci scritti con l'AI"],
      q10: ["Lo proverei subito", "Vorrei saperne di più", "Non mi interessa"]
    },
    singole: ["q1", "q2", "q3", "q4", "q5", "q6", "q8", "q10"],
    multiple: ["q7", "q9"]
  }
};

function doPost(e) {
  try {
    var d = JSON.parse((e && e.postData && e.postData.contents) || "{}");

    // Campo trappola compilato = bot: rispondiamo "ok" ma non salviamo nulla.
    if (d.sito) return risposta_({ ok: true });

    var conf = VERSIONI[d.versione];
    if (!conf) return risposta_({ ok: false, error: "versione sconosciuta" });

    var errore = controlla_(d, conf);
    if (errore) return risposta_({ ok: false, error: errore });

    var consenso = d.consenso === true;
    var email = consenso ? pulisci_(d.email, 120) : "";
    if (consenso && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return risposta_({ ok: false, error: "email non valida" });
    }

    var riga = [
      Utilities.formatDate(new Date(), FUSO_ORARIO, "yyyy-MM-dd HH:mm:ss"),
      pulisciFonte_(d.fonte)
    ];
    conf.campi.forEach(function (k) {
      if (/_altro$/.test(k)) {
        var madre = k.replace(/_altro$/, "");
        riga.push(sceltoAltro_(d[madre]) ? pulisci_(d[k], 100) : "");
      } else {
        riga.push(d[k]); // già controllato: è una delle opzioni previste
      }
    });
    riga.push(email, consenso ? "sì" : "no", d.versione);

    var lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      var foglio = scheda_(conf);
      foglio.appendRow(riga);
    } finally {
      lock.releaseLock();
    }
    return risposta_({ ok: true });
  } catch (err) {
    return risposta_({ ok: false, error: "errore interno" });
  }
}

// Aprendo l'indirizzo dello script nel browser si vede solo questo: serve per controllare che sia online.
function doGet() {
  return ContentService.createTextOutput("Lo script del questionario è attivo.");
}

function controlla_(d, conf) {
  var i, k;
  for (i = 0; i < conf.singole.length; i++) {
    k = conf.singole[i];
    if (conf.opzioni[k].indexOf(d[k]) === -1) return "risposta mancante o non valida: " + k;
  }
  for (i = 0; i < conf.multiple.length; i++) {
    k = conf.multiple[i];
    if (typeof d[k] !== "string" || d[k] === "") return "risposta mancante: " + k;
    var scelte = d[k].split("; ");
    for (var j = 0; j < scelte.length; j++) {
      if (conf.opzioni[k].indexOf(scelte[j]) === -1) return "risposta non valida: " + k;
    }
    if (sceltoAltro_(d[k]) && !pulisci_(d[k + "_altro"], 100)) return "manca il testo di Altro (" + k + ")";
  }
  return "";
}

function sceltoAltro_(v) {
  return typeof v === "string" && v.split("; ").indexOf("Altro") !== -1;
}

// Toglie spazi, taglia la lunghezza e impedisce che il testo diventi una formula nel foglio.
function pulisci_(v, max) {
  var s = String(v == null ? "" : v).replace(/[\r\n\t]+/g, " ").trim().slice(0, max);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function pulisciFonte_(v) {
  var s = String(v == null ? "" : v).toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 30);
  return s || "diretto";
}

function scheda_(conf) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var foglio = ss.getSheetByName(conf.scheda) || ss.insertSheet(conf.scheda);
  if (foglio.getLastRow() === 0) {
    foglio.appendRow(conf.colonne);
    foglio.setFrozenRows(1);
    foglio.getRange(1, 1, 1, conf.colonne.length).setFontWeight("bold");
  }
  return foglio;
}

function risposta_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Prova manuale dall'editor: seleziona "provaSalvataggio" e premi Esegui.
 * Aggiunge una riga di prova (fonte = "prova-editor") che poi puoi cancellare.
 */
function provaSalvataggio() {
  var finto = {
    postData: { contents: JSON.stringify({
      fonte: "prova-editor", q1: "Entrambi", q2: "10–30",
      q3: "Vinted; Altro", q3_altro: "Wallapop",
      q4: "No, ma ci sto pensando", q5: "Più o meno", q6: "Io",
      q7: "5–10 minuti", q8: "Foto; Tenere i conti", q8_altro: "",
      q9: "Excel o Google Fogli",
      q10: "Vedere i margini su ogni capo; Avvisi sulle soglie fiscali", q11: "Forse",
      email: "", consenso: false, sito: "", versione: "v2"
    }) }
  };
  Logger.log(doPost(finto).getContent());
}
