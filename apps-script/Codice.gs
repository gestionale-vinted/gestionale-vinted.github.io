/**
 * Questionario per chi vende online – script che salva le risposte nel foglio.
 *
 * Va incollato in: Google Sheet > Estensioni > Apps Script.
 * Si pubblica come "App web" (vedi README.md).
 *
 * Controlla ogni risposta prima di salvarla e scrive l'email SOLO se c'è il consenso.
 * Le opzioni qui sotto devono restare identiche a quelle di index.html.
 */

var NOME_SCHEDA = "Risposte";
var FUSO_ORARIO = "Europe/Rome";

var COLONNE = [
  "data_ora", "fonte",
  "q1_vendi", "q2_articoli",
  "q3_piva", "q4_dac7", "q5_fisco",
  "q6_tempo_capo", "q7_perdi_tempo", "q7_altro",
  "q8_conti",
  "q9_utile", "q10_interesse",
  "email", "consenso", "versione"
];

var OPZIONI = {
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
};

var SINGOLE = ["q1", "q2", "q3", "q4", "q5", "q6", "q8", "q10"];
var MULTIPLE = ["q7", "q9"];

function doPost(e) {
  try {
    var d = JSON.parse((e && e.postData && e.postData.contents) || "{}");

    // Campo trappola compilato = bot: rispondiamo "ok" ma non salviamo nulla.
    if (d.sito) return risposta_({ ok: true });

    var errore = controlla_(d);
    if (errore) return risposta_({ ok: false, error: errore });

    var consenso = d.consenso === true;
    var email = consenso ? pulisci_(d.email, 120) : "";
    if (consenso && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return risposta_({ ok: false, error: "email non valida" });
    }

    var riga = [
      Utilities.formatDate(new Date(), FUSO_ORARIO, "yyyy-MM-dd HH:mm:ss"),
      pulisciFonte_(d.fonte),
      d.q1, d.q2,
      d.q3, d.q4, d.q5,
      d.q6, d.q7, d.q7.indexOf("Altro") !== -1 ? pulisci_(d.q7_altro, 100) : "",
      d.q8,
      d.q9, d.q10,
      email, consenso ? "sì" : "no",
      pulisci_(d.versione, 10)
    ];

    var lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      var foglio = scheda_();
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

function controlla_(d) {
  var i, k;
  for (i = 0; i < SINGOLE.length; i++) {
    k = SINGOLE[i];
    if (OPZIONI[k].indexOf(d[k]) === -1) return "risposta mancante o non valida: " + k;
  }
  for (i = 0; i < MULTIPLE.length; i++) {
    k = MULTIPLE[i];
    if (typeof d[k] !== "string" || d[k] === "") return "risposta mancante: " + k;
    var scelte = d[k].split("; ");
    for (var j = 0; j < scelte.length; j++) {
      if (OPZIONI[k].indexOf(scelte[j]) === -1) return "risposta non valida: " + k;
    }
  }
  if (d.q7.indexOf("Altro") !== -1 && !pulisci_(d.q7_altro, 100)) return "manca il testo di Altro (q7)";
  return "";
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

function scheda_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var foglio = ss.getSheetByName(NOME_SCHEDA) || ss.insertSheet(NOME_SCHEDA);
  if (foglio.getLastRow() === 0) {
    foglio.appendRow(COLONNE);
    foglio.setFrozenRows(1);
    foglio.getRange(1, 1, 1, COLONNE.length).setFontWeight("bold");
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
      q3: "No, ma ci sto pensando", q4: "Più o meno", q5: "Io", q6: "5–10 minuti",
      q7: "Foto; Tenere i conti", q7_altro: "", q8: "Excel o Google Fogli",
      q9: "Vedere i margini su ogni capo", q10: "Vorrei saperne di più",
      email: "", consenso: false, sito: "", versione: "v1"
    }) }
  };
  Logger.log(doPost(finto).getContent());
}
