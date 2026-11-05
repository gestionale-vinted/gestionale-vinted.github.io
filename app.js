/*
 * Questionario per chi vende online – logica della pagina.
 * Nessun cookie, nessun analytics, nessuna chiamata a Vinted.
 * L'unica richiesta esterna è l'invio finale allo script Google (SCRIPT_URL).
 */
(function () {
  "use strict";

  // 1) Incolla qui l'indirizzo della web app di Google Apps Script (finisce con /exec).
  //    Finché resta così, la pagina funziona in "modalità prova" e non salva nulla.
  var SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxrBAl6KkCbOZ0l8G9fCk-yoTm-FG6KioUZ4HYmFNlwl-BhRmtzpPfq3IAHhN7pitKGsQ/exec";
  var VERSIONE = "v2";

  var TEST_MODE = SCRIPT_URL.indexOf("https://script.google.com/") !== 0;
  var TOTAL = 5;

  var form = document.getElementById("form");
  var steps = Array.prototype.slice.call(document.querySelectorAll(".step[data-step]"));
  var nextBtn = document.getElementById("next");
  var backBtn = document.getElementById("back");
  var nav = document.getElementById("nav");
  var progress = document.getElementById("progress");
  var progressLabel = document.getElementById("progress-label");
  var progressBar = document.getElementById("progress-bar");
  var sendErr = document.getElementById("send-err");
  var current = 1;
  var sending = false;

  if (TEST_MODE) document.getElementById("test-banner").hidden = false;

  // "fonte" letta dal link (es. ?fonte=facebook). Solo lettere, numeri, - e _.
  function readFonte() {
    var raw = "";
    try { raw = new URLSearchParams(window.location.search).get("fonte") || ""; } catch (e) { raw = ""; }
    var clean = raw.toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 30);
    return clean || "diretto";
  }
  var FONTE = readFonte();

  function stepEl(n) {
    return steps.filter(function (s) { return s.getAttribute("data-step") === String(n); })[0];
  }

  function show(n) {
    steps.forEach(function (s) { s.hidden = true; });
    var el = stepEl(n);
    el.hidden = false;
    current = n;

    if (n === "done") {
      progress.hidden = true;
      nav.hidden = true;
    } else {
      progressLabel.textContent = "Sezione " + n + " di " + TOTAL + " · " + el.getAttribute("data-title");
      progressBar.style.width = (n / TOTAL * 100) + "%";
      backBtn.hidden = n === 1;
      nextBtn.textContent = n === TOTAL ? "Invia" : "Avanti";
    }
    sendErr.hidden = true;
    window.scrollTo(0, 0);
    var h = el.querySelector("h2");
    if (h) h.focus({ preventScroll: true });
  }

  // Mostra/nasconde il campo "Altro"
  form.addEventListener("change", function (ev) {
    var t = ev.target;
    var otherId = t.getAttribute && t.getAttribute("data-other");
    if (otherId) {
      var other = document.getElementById(otherId);
      other.hidden = !t.checked;
      if (t.checked) other.focus(); else other.value = "";
    }
    var q = t.closest && t.closest(".q");
    if (q) clearError(q);
  });

  function setError(q, msg) {
    q.classList.add("invalid");
    q.querySelector(".err").textContent = msg;
  }
  function clearError(q) {
    q.classList.remove("invalid");
    q.querySelector(".err").textContent = "";
  }

  function checkedValues(name) {
    return Array.prototype.slice
      .call(form.querySelectorAll('input[name="' + name + '"]:checked'))
      .map(function (i) { return i.value; });
  }

  // Controlla le domande della sezione n. Ritorna true se è tutto a posto.
  function validate(n) {
    var ok = true;
    var first = null;
    var qs = stepEl(n).querySelectorAll(".q");
    Array.prototype.forEach.call(qs, function (q) {
      var name = q.getAttribute("data-name");
      var type = q.getAttribute("data-type");
      var msg = "";

      if (type === "single" && checkedValues(name).length === 0) {
        msg = "Scegli una risposta.";
      } else if (type === "multi") {
        var vals = checkedValues(name);
        if (vals.length === 0) {
          msg = "Scegli almeno una risposta.";
        } else if (vals.indexOf("Altro") !== -1) {
          var other = document.getElementById(name + "_altro");
          if (other && other.value.trim() === "") msg = "Scrivi cosa intendi con \"Altro\".";
        }
      } else if (type === "email") {
        var email = document.getElementById("email");
        var consent = document.getElementById("consenso").checked;
        var val = email.value.trim();
        if (val !== "" && !email.checkValidity()) {
          msg = "Controlla l'email: sembra scritta male.";
        } else if (val !== "" && !consent) {
          msg = "Per lasciarci l'email spunta la casella del consenso, oppure cancella l'email.";
        } else if (val === "" && consent) {
          msg = "Hai spuntato la casella ma manca l'email: scrivila oppure togli la spunta.";
        }
      }

      if (msg) {
        setError(q, msg);
        ok = false;
        if (!first) first = q;
      } else {
        clearError(q);
      }
    });
    if (first) first.scrollIntoView({ behavior: "smooth", block: "center" });
    return ok;
  }

  function joinMulti(name) {
    return checkedValues(name).join("; ");
  }
  function single(name) {
    return checkedValues(name)[0] || "";
  }
  function text(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim().slice(0, 100) : "";
  }

  function collect() {
    var consent = document.getElementById("consenso").checked;
    return {
      fonte: FONTE,
      q1: single("q1"),
      q2: single("q2"),
      q3: joinMulti("q3"),
      q3_altro: text("q3_altro"),
      q4: single("q4"),
      q5: single("q5"),
      q6: single("q6"),
      q7: single("q7"),
      q8: joinMulti("q8"),
      q8_altro: text("q8_altro"),
      q9: single("q9"),
      q10: joinMulti("q10"),
      q11: single("q11"),
      // L'email parte solo se c'è il consenso.
      email: consent ? document.getElementById("email").value.trim().slice(0, 120) : "",
      consenso: consent,
      sito: document.getElementById("sito").value, // campo trappola
      versione: VERSIONE
    };
  }

  function finish(payload) {
    document.getElementById("thanks-email").hidden = !payload.email;
    show("done");
  }

  function submit() {
    if (sending) return;
    sending = true;
    nextBtn.disabled = true;
    backBtn.disabled = true;
    nextBtn.textContent = "Invio in corso…";
    sendErr.hidden = true;

    var payload = collect();

    if (TEST_MODE) {
      console.log("[modalità prova] Dati che verrebbero inviati:", payload);
      setTimeout(function () { finish(payload); }, 400);
      return;
    }

    fetch(SCRIPT_URL, {
      method: "POST",
      // text/plain evita il controllo CORS preliminare, che Apps Script non gestisce.
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
      credentials: "omit", // non manda i cookie Google della persona
      redirect: "follow",
      referrerPolicy: "no-referrer"
    })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (res && res.ok) {
          finish(payload);
        } else {
          throw new Error((res && res.error) || "risposta non valida");
        }
      })
      .catch(function (err) {
        console.error("Invio non riuscito:", err);
        sending = false;
        nextBtn.disabled = false;
        backBtn.disabled = false;
        nextBtn.textContent = "Riprova a inviare";
        sendErr.textContent = "Non siamo riusciti a inviare le risposte. Controlla la connessione e riprova: quello che hai scritto non è andato perso.";
        sendErr.hidden = false;
      });
  }

  nextBtn.addEventListener("click", function () {
    if (!validate(current)) return;
    if (current < TOTAL) show(current + 1);
    else submit();
  });

  backBtn.addEventListener("click", function () {
    if (current > 1) show(current - 1);
  });

  // Invio con il tasto Enter nei campi di testo: passa alla schermata successiva invece di ricaricare.
  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    nextBtn.click();
  });

  show(1);
})();
