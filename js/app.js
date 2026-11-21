/* Bruch-Werkstatt – Lern-App zu Brüchen und Dezimalzahlen (Klasse 6) */
(function () {
  "use strict";

  var VERSION = "1.2.0";
  var STORE_KEY = "bruchwerkstatt.v1";
  var LAST = 10; // Nummer der letzten Station (Quiz)
  var QUIZ_SIZE = 12; // so viele Fragen werden pro Quiz-Runde zufällig ausgewählt

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* ---------- Brüche schön darstellen: aus {3/4} wird ein echter Bruch ---------- */
  var FRAC = /\{([^{}\/]+)\/([^{}\/]+)\}/g;

  function fracHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(FRAC, function (m, z, n) {
        return '<span class="frac" role="img" aria-label="' + z.trim() + " durch " + n.trim() + '"><span>' + z.trim() + "</span><span>" + n.trim() + "</span></span>";
      });
  }

  function fracifyNode(root) {
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    var nodes = [];
    while (walker.nextNode()) {
      if (walker.currentNode.nodeValue.indexOf("{") !== -1) nodes.push(walker.currentNode);
    }
    nodes.forEach(function (node) {
      var span = document.createElement("span");
      span.innerHTML = fracHtml(node.nodeValue);
      var frag = document.createDocumentFragment();
      while (span.firstChild) frag.appendChild(span.firstChild);
      node.parentNode.replaceChild(frag, node);
    });
  }

  /* ---------- Fortschritt (bleibt im Browser gespeichert) ---------- */
  // mode: "mit" = mit Bruchaddition, "ohne" = ohne Bruchaddition
  var state = { done: {}, best: null, mode: "mit" };
  try {
    var saved = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
    if (saved && typeof saved === "object") {
      state.done = saved.done || {};
      state.best = typeof saved.best === "number" ? saved.best : null;
      if (saved.mode === "ohne") state.mode = "ohne";
    }
  } catch (e) { /* ohne Speicher läuft die App trotzdem */ }

  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* egal */ }
  }

  /* ---------- Modus: mit oder ohne Bruchaddition ---------- */
  // Elemente mit der Klasse "only-mit" bzw. "only-ohne" sind nur im passenden Modus sichtbar (siehe mathe.css).
  // Der Modus lässt sich auch über den Link voreinstellen:  …/index.html?modus=ohne
  function setMode(mode) {
    state.mode = mode === "ohne" ? "ohne" : "mit";
    document.body.classList.toggle("mode-ohne", state.mode === "ohne");
    document.body.classList.toggle("mode-mit", state.mode === "mit");
    $$(".mode-option").forEach(function (b) {
      b.setAttribute("aria-pressed", b.dataset.mode === state.mode ? "true" : "false");
    });
    $$("video").forEach(function (v) { v.pause(); });
    quiz = null; // ein laufendes Quiz beginnt mit den passenden Fragen neu
    save();
  }

  function shuffle(list) {
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.innerHTML = fracHtml(text);
    return n;
  }

  /* ---------- Navigation ---------- */
  function show(n) {
    $$(".view").forEach(function (v) { v.hidden = v.id !== "view-" + n; });
    $$(".step").forEach(function (s) {
      var no = Number(s.dataset.go);
      s.classList.toggle("is-current", no === n);
      s.classList.toggle("is-done", !!state.done[no]);
      if (no === n) {
        s.setAttribute("aria-current", "step");
        if (s.scrollIntoView) s.scrollIntoView({ block: "nearest", inline: "center" });
      } else {
        s.removeAttribute("aria-current");
      }
    });
    $$("video").forEach(function (v) { if (!v.closest("#view-" + n)) v.pause(); });
    if (n === LAST) startQuiz();
    window.scrollTo(0, 0);
    if (location.hash !== "#" + n) history.replaceState(null, "", n ? "#" + n : location.pathname);
  }

  // Manche Stationen haben mehrere Übungen: erst wenn alle Teile gelöst sind, gilt die Station als erledigt.
  var PARTS = { 4: 2, 5: 2, 7: 2, 8: 2 };
  var partsDone = {};

  function markDone(n) {
    partsDone[n] = (partsDone[n] || 0) + 1;
    if (partsDone[n] < (PARTS[n] || 1)) return;
    state.done[n] = true;
    save();
    var next = $("#next" + n);
    if (next) next.disabled = false;
    $$(".step").forEach(function (s) {
      if (Number(s.dataset.go) === n) s.classList.add("is-done");
    });
  }

  document.addEventListener("click", function (ev) {
    var t = ev.target.closest("[data-go]");
    if (t && !t.disabled) show(Number(t.dataset.go));
  });

  /* ---------- Station 1: Anteil färben ---------- */
  (function setupShade() {
    var TASKS = [
      { z: 3, n: 4, thing: "der Schokolade" },
      { z: 5, n: 8, thing: "der Pizza" },
      { z: 2, n: 6, thing: "des Kuchens" }
    ];
    var box = $("#shade");
    var fb = $("#shade-fb");
    var check = $("#shade-check");
    var pos = 0;

    function render() {
      var t = TASKS[pos];
      box.textContent = "";
      box.appendChild(el("p", "task-count", "Aufgabe " + (pos + 1) + " von " + TASKS.length));
      box.appendChild(el("p", "task-q", "Färbe {" + t.z + "/" + t.n + "} " + t.thing + "."));
      var bar = el("div", "shadebar");
      for (var i = 0; i < t.n; i++) {
        var cell = el("button", "shadecell");
        cell.setAttribute("aria-pressed", "false");
        cell.setAttribute("aria-label", "Feld " + (i + 1));
        bar.appendChild(cell);
      }
      box.appendChild(bar);
      fb.textContent = "";
      fb.className = "feedback";
    }

    box.addEventListener("click", function (ev) {
      var cell = ev.target.closest(".shadecell");
      if (!cell || cell.disabled) return;
      var on = cell.classList.toggle("is-on");
      cell.setAttribute("aria-pressed", on ? "true" : "false");
    });

    check.addEventListener("click", function () {
      var t = TASKS[pos];
      var count = $$(".shadecell.is-on", box).length;
      if (count === t.z) {
        $$(".shadecell", box).forEach(function (c) { c.disabled = true; });
        if (pos === TASKS.length - 1) {
          fb.innerHTML = fracHtml("✔ Richtig! " + t.z + " von " + t.n + " Feldern sind {" + t.z + "/" + t.n + "}. Alle drei Aufgaben geschafft!");
          fb.className = "feedback is-right";
          check.disabled = true;
          markDone(1);
        } else {
          fb.innerHTML = fracHtml("✔ Richtig! " + t.z + " von " + t.n + " Feldern sind {" + t.z + "/" + t.n + "}.");
          fb.className = "feedback is-right";
          check.disabled = true;
          setTimeout(function () { pos++; check.disabled = false; render(); }, 1400);
        }
      } else {
        fb.innerHTML = fracHtml("✘ Du hast " + count + " von " + t.n + " Feldern gefärbt, das sind {" + count + "/" + t.n + "}. Der Zähler sagt dir, wie viele Felder es sein sollen.");
        fb.className = "feedback is-wrong";
      }
    });

    render();
  })();

  /* ---------- Aufgabenreihen mit Auswahl (Stationen 2 bis 5) ---------- */
  // Jede Aufgabe: q = Frage, a = Antworten (die erste ist richtig), why = Erklärung
  function taskSet(id, tasks, station) {
    var box = $("#" + id);
    var pos = 0;

    function render() {
      var t = tasks[pos];
      box.textContent = "";
      box.appendChild(el("p", "task-count", "Aufgabe " + (pos + 1) + " von " + tasks.length));
      box.appendChild(el("p", "task-q", t.q));
      var list = el("div", "choices" + (t.inline ? " choices-inline" : ""));
      var fb = el("p", "feedback");
      fb.setAttribute("role", "status");
      fb.setAttribute("aria-live", "polite");
      var right = t.a[0];
      (t.inline ? t.a.slice().sort() : shuffle(t.a)).forEach(function (text) {
        var b = el("button", "choice", text);
        b.addEventListener("click", function () {
          if (text === right) {
            b.classList.add("is-right");
            $$(".choice", list).forEach(function (x) { x.disabled = true; });
            fb.innerHTML = fracHtml("✔ " + t.why);
            fb.className = "feedback is-right";
            var last = pos === tasks.length - 1;
            if (last) {
              markDone(station);
            } else {
              var next = el("button", "btn", "Nächste Aufgabe");
              next.addEventListener("click", function () { pos++; render(); });
              var actions = el("div", "actions actions-tight");
              actions.appendChild(next);
              box.appendChild(actions);
              next.focus();
            }
          } else {
            b.classList.add("is-wrong");
            b.disabled = true;
            fb.innerHTML = fracHtml("✘ " + (t.hint || "Noch nicht ganz. Schau dir die Regel oben noch einmal an und probiere es erneut."));
            fb.className = "feedback is-wrong";
          }
        });
        list.appendChild(b);
      });
      box.appendChild(list);
      box.appendChild(fb);
    }

    render();
  }

  taskSet("tasks2", [
    { q: "Erweitere {2/3} mit 4.", a: ["{8/12}", "{6/7}", "{8/3}", "{2/12}"], why: "Zähler und Nenner mal 4: 2 · 4 = 8 und 3 · 4 = 12.", hint: "Beim Erweitern multiplizierst du Zähler UND Nenner mit derselben Zahl." },
    { q: "Kürze {12/18} so weit wie möglich.", a: ["{2/3}", "{6/9}", "{4/6}", "{1/2}"], why: "12 und 18 lassen sich beide durch 6 teilen: 12 : 6 = 2 und 18 : 6 = 3.", hint: "Prüfe: Haben Zähler und Nenner noch einen gemeinsamen Teiler? Dann kannst du weiter kürzen." },
    { q: "Welcher Bruch hat denselben Wert wie {3/4}?", a: ["{9/12}", "{6/9}", "{4/5}", "{3/8}"], why: "{3/4} mit 3 erweitert ergibt {9/12}.", hint: "Erweitere {3/4} der Reihe nach mit 2, 3 und 4 und vergleiche." }
  ], 2);

  taskSet("tasks3", [
    { q: "{3/8} ▢ {5/8}", inline: true, a: ["<", ">", "="], why: "Gleicher Nenner: 3 Achtel sind weniger als 5 Achtel.", hint: "Die Nenner sind gleich. Vergleiche die Zähler." },
    { q: "{3/4} ▢ {2/3}", inline: true, a: [">", "<", "="], why: "Gleichnamig: {9/12} > {8/12}.", hint: "Mache beide Brüche gleichnamig. Ein gemeinsamer Nenner ist 12." },
    { q: "{2/5} ▢ {4/10}", inline: true, a: ["=", "<", ">"], why: "{2/5} mit 2 erweitert ergibt {4/10}. Beide Brüche sind gleich groß.", hint: "Erweitere {2/5} mit 2." },
    { q: "{5/6} ▢ {7/9}", inline: true, a: [">", "<", "="], why: "Gleichnamig mit dem Nenner 18: {15/18} > {14/18}.", hint: "Ein gemeinsamer Nenner von 6 und 9 ist 18." }
  ], 3);

  taskSet("tasks4", [
    { q: "Welche Zahl ist größer: 0,6 oder 0,58?", a: ["0,6", "0,58", "Beide sind gleich groß."], why: "0,6 = 0,60 – und 60 Hundertstel sind mehr als 58 Hundertstel.", hint: "Hänge eine Null an: 0,6 = 0,60. Vergleiche jetzt Stelle für Stelle." },
    { q: "Runde 3,476 auf Hundertstel.", a: ["3,48", "3,47", "3,5", "3,476"], why: "Die Tausendstel-Stelle ist 6, also wird aufgerundet: 3,48.", hint: "Schau auf die Stelle rechts neben den Hundertsteln. Bei 5 bis 9 wird aufgerundet." }
  ], 4);

  taskSet("tasks5", [
    { q: "0,8 ▢ 0,75", inline: true, a: [">", "<", "="], why: "0,8 = 0,80 – und 80 Hundertstel sind mehr als 75 Hundertstel.", hint: "Vergleiche die Zehntel: 8 und 7." },
    { q: "2,05 ▢ 2,5", inline: true, a: ["<", ">", "="], why: "Vor dem Komma gleich. Zehntel: 0 ist kleiner als 5.", hint: "Die Einer sind gleich. Schau auf die erste Stelle hinter dem Komma." },
    { q: "0,40 ▢ 0,4", inline: true, a: ["=", "<", ">"], why: "Endnullen ändern den Wert nicht: 0,40 = 0,4.", hint: "Was passiert, wenn du die Null ganz hinten weglässt?" },
    { q: "3,099 ▢ 3,1", inline: true, a: ["<", ">", "="], why: "Zehntel: 0 ist kleiner als 1. Die vielen Neunen dahinter helfen nicht.", hint: "Länger ist nicht größer! Vergleiche die Zehntel." }
  ], 5);

  taskSet("tasks7a", [
    { q: "Wir beginnen vorn: Wie oft passt die 4 in die 8?", a: ["2-mal", "4-mal", "1-mal", "8-mal"], why: "2 · 4 = 8, Rest 0. Die erste Ziffer im Ergebnis ist 2.", hint: "Welche Zahl mal 4 ergibt 8?" },
    { q: "Die 7 wird heruntergeholt. Wie oft passt die 4 in die 7 – und was bleibt übrig?", a: ["1-mal, Rest 3", "2-mal, Rest 1", "1-mal, Rest 4", "3-mal, Rest 0"], why: "1 · 4 = 4 und 7 − 4 = 3. Im Ergebnis steht jetzt 21.", hint: "2 · 4 = 8 wäre schon zu viel." },
    { q: "Es sind keine Ziffern mehr da, aber der Rest ist 3. Was tust du?", a: ["Komma ins Ergebnis setzen und eine 0 herunterholen", "Aufhören und den Rest weglassen", "Die 3 ans Ergebnis anhängen", "Noch einmal von vorn anfangen"], why: "Aus dem Rest 3 wird 30. Im Ergebnis steht jetzt „21,“.", hint: "So kannst du hinter dem Komma weiterrechnen." },
    { q: "30 : 4 = 7, Rest 2. Du holst wieder eine 0 herunter. Wie oft passt die 4 in die 20?", a: ["5-mal", "4-mal", "6-mal", "2-mal"], why: "5 · 4 = 20, Rest 0 – fertig!", hint: "Welche Zahl mal 4 ergibt 20?" },
    { q: "Wie lautet also das Ergebnis von 87 : 4?", a: ["21,75", "2175", "21,57", "217,5"], why: "Die Ziffern der Reihe nach: 2, 1, Komma, 7, 5. Probe: 21,75 · 4 = 87.", hint: "Die Ergebnis-Ziffern waren: 2, dann 1, dann das Komma, dann 7 und 5." }
  ], 7);

  taskSet("tasks7b", [
    { q: "96 : 8 = ?", a: ["12", "11", "13", "1,2"], why: "9 : 8 = 1 Rest 1, die 6 herunter: 16 : 8 = 2. Ergebnis 12.", hint: "Beginne mit der 9: Wie oft passt die 8 hinein?" },
    { q: "9 : 4 = ?", a: ["2,25", "2,5", "2,1", "2,4"], why: "9 : 4 = 2 Rest 1. Komma, 0 herunter: 10 : 4 = 2 Rest 2. Wieder 0: 20 : 4 = 5.", hint: "Nach dem Rest 1 setzt du das Komma und holst eine 0 herunter." },
    { q: "Schreibe {3/4} als Dezimalzahl. Rechne dazu 3 : 4.", a: ["0,75", "0,34", "1,33", "0,43"], why: "3 : 4 = 0 Rest 3. Komma, 0 herunter: 30 : 4 = 7 Rest 2, dann 20 : 4 = 5.", hint: "Die 4 passt 0-mal in die 3. Schreibe „0,“ und hole eine 0 herunter." },
    { q: "4,8 : 4 = ?", a: ["1,2", "12", "0,12", "1,02"], why: "4 : 4 = 1. Jetzt überschreitest du das Komma: Komma ins Ergebnis. 8 : 4 = 2.", hint: "Sobald du über das Komma gehst, setzt du auch im Ergebnis das Komma." }
  ], 7);

  /* ---------- Zahlen der Größe nach ordnen (Stationen 5 und 8) ---------- */
  // ROUNDS: je Runde die Zahlen in der richtigen Reihenfolge (kleinste zuerst)
  function sortGame(id, ROUNDS, station, doneText, hintText) {
    var box = $("#" + id);
    var fb = $("#" + id + "-fb");
    var round = 0;
    var next = 0;

    function render() {
      next = 0;
      box.textContent = "";
      box.appendChild(el("p", "task-count", "Runde " + (round + 1) + " von " + ROUNDS.length));
      var pool = el("div", "sort-pool");
      shuffle(ROUNDS[round]).forEach(function (text) {
        var b = el("button", "sort-chip", text);
        b.dataset.v = text;
        pool.appendChild(b);
      });
      box.appendChild(pool);
      var line = el("div", "sort-line");
      line.setAttribute("aria-label", "Deine Reihenfolge");
      box.appendChild(line);
    }

    box.addEventListener("click", function (ev) {
      var b = ev.target.closest(".sort-chip");
      if (!b || b.disabled) return;
      var order = ROUNDS[round];
      if (b.dataset.v === order[next]) {
        b.disabled = true;
        b.classList.add("is-used");
        var line = $(".sort-line", box);
        if (next > 0) line.appendChild(el("span", "sort-lt", "<"));
        line.appendChild(el("span", "sort-done", b.dataset.v));
        next++;
        fb.textContent = "";
        fb.className = "feedback";
        if (next === order.length) {
          fb.className = "feedback is-right";
          if (round === ROUNDS.length - 1) {
            fb.textContent = doneText;
            markDone(station);
          } else {
            fb.textContent = "✔ Richtig geordnet! Gleich kommt die zweite Runde.";
            setTimeout(function () { round++; fb.textContent = ""; render(); }, 1600);
          }
        }
      } else {
        b.classList.add("shake");
        setTimeout(function () { b.classList.remove("shake"); }, 450);
        fb.textContent = hintText;
        fb.className = "feedback is-wrong";
      }
    });

    render();
  }

  sortGame("sort", [
    ["0,07", "0,605", "0,65", "0,7"],
    ["1,02", "1,121", "1,19", "1,2"]
  ], 5, "✔ Perfekt geordnet! Du lässt dich von langen Zahlen nicht täuschen.",
  "✘ Es gibt noch eine kleinere Zahl. Vergleiche Stelle für Stelle – hänge in Gedanken Nullen an.");

  sortGame("sort8", [
    ["0,2", "{1/4}", "0,3", "{1/2}"],
    ["{3/5}", "0,65", "{3/4}", "0,8"]
  ], 8, "✔ Perfekt geordnet! Brüche und Dezimalzahlen bringst du sicher in eine Reihe.",
  "✘ Es gibt noch eine kleinere Zahl. Wandle die Brüche in Dezimalzahlen um: zum Beispiel {1/4} = 0,25 und {3/5} = 0,6.".replace(/\{(\d+)\/(\d+)\}/g, "$1/$2"));

  /* ---------- Station 8: Bruch gegen Dezimalzahl ---------- */
  taskSet("tasks8", [
    { q: "{3/4} ▢ 0,7", inline: true, a: [">", "<", "="], why: "{3/4} = 0,75 – und 0,75 ist größer als 0,70.", hint: "Wandle {3/4} in eine Dezimalzahl um: Erweitere auf Hundertstel." },
    { q: "0,5 ▢ {1/2}", inline: true, a: ["=", "<", ">"], why: "{1/2} = {5/10} = 0,5. Beide Zahlen sind gleich groß.", hint: "Erweitere {1/2} auf Zehntel." },
    { q: "{2/5} ▢ 0,45", inline: true, a: ["<", ">", "="], why: "{2/5} = {4/10} = 0,40 – und das ist kleiner als 0,45.", hint: "Erweitere {2/5} auf Zehntel und hänge eine Null an." },
    { q: "{3/8} ▢ 0,4", inline: true, a: ["<", ">", "="], why: "3 : 8 = 0,375. Länger ist nicht größer: 0,375 < 0,400.", hint: "Rechne 3 : 8 schriftlich. Vergleiche dann die Zehntel." },
    { q: "0,3 ▢ {1/3}", inline: true, a: ["<", ">", "="], why: "1 : 3 = 0,333… Das ist ein kleines bisschen mehr als 0,3.", hint: "Rechne 1 : 3 schriftlich. Die Division hört nie auf: 0,333…" }
  ], 8);

  /* ---------- Station 6 im Modus „ohne Bruchaddition“: nur Dezimalzahlen ---------- */
  taskSet("tasks6o", [
    { q: "2,5 + 0,75 = ?", a: ["3,25", "1,00", "2,80", "3,20"], why: "Komma unter Komma: 2,50 + 0,75 = 3,25.", hint: "Schreibe 2,5 als 2,50 und rechne stellengerecht: Komma unter Komma." },
    { q: "0,6 + 0,45 = ?", a: ["1,05", "0,51", "0,105", "1,5"], why: "0,60 + 0,45 = 1,05. Die Zehntel ergeben zusammen mehr als ein Ganzes.", hint: "Schreibe 0,6 als 0,60. Achte auf den Übertrag zu den Einern." },
    { q: "3,2 − 1,45 = ?", a: ["1,75", "2,25", "1,85", "1,65"], why: "Komma unter Komma: 3,20 − 1,45 = 1,75.", hint: "Schreibe 3,2 als 3,20. Dann kannst du Stelle für Stelle subtrahieren." },
    { q: "5 − 0,8 = ?", a: ["4,2", "4,8", "5,8", "0,42"], why: "5 = 5,0 – und 5,0 − 0,8 = 4,2.", hint: "Schreibe 5 als 5,0. Dann steht Komma unter Komma." }
  ], 6);

  taskSet("tasks6", [
    { q: "{1/5} + {2/5} = ?", a: ["{3/5}", "{3/10}", "{2/25}", "{1/5}"], why: "Gleicher Nenner: Zähler addieren, 1 + 2 = 3. Der Nenner bleibt 5.", hint: "Die Nenner sind schon gleich. Addiere nur die Zähler." },
    { q: "{1/2} + {1/4} = ?", a: ["{3/4}", "{2/6}", "{1/3}", "{2/4}"], why: "Gleichnamig: {2/4} + {1/4} = {3/4}.", hint: "Erweitere {1/2} auf Viertel. Die Nenner darfst du nicht addieren!" },
    { q: "{3/4} − {1/6} = ?", a: ["{7/12}", "{2/2}", "{4/10}", "{1/2}"], why: "Gleichnamig mit dem Nenner 12: {9/12} − {2/12} = {7/12}.", hint: "Ein gemeinsamer Nenner von 4 und 6 ist 12." },
    { q: "2,5 + 0,75 = ?", a: ["3,25", "1,00", "2,80", "3,20"], why: "Komma unter Komma: 2,50 + 0,75 = 3,25.", hint: "Schreibe 2,5 als 2,50 und rechne stellengerecht: Komma unter Komma." },
    { q: "3,2 − 1,45 = ?", a: ["1,75", "2,25", "1,85", "1,65"], why: "Komma unter Komma: 3,20 − 1,45 = 1,75.", hint: "Schreibe 3,2 als 3,20. Dann kannst du Stelle für Stelle subtrahieren." }
  ], 6);

  /* ---------- Auswahlfrage zum Film (Station 8) ---------- */
  (function setupCheck() {
    var box = $("#check9");
    var fb = $("#check9-fb");
    $$(".choice", box).forEach(function (btn) {
      var why = btn.dataset.why;
      btn.addEventListener("click", function () {
        var ok = btn.dataset.ok === "1";
        btn.classList.add(ok ? "is-right" : "is-wrong");
        fb.innerHTML = fracHtml((ok ? "✔ " : "✘ ") + why);
        fb.className = "feedback " + (ok ? "is-right" : "is-wrong");
        if (ok) {
          $$(".choice", box).forEach(function (b) { b.disabled = true; });
          markDone(9);
        } else {
          btn.disabled = true;
        }
      });
    });
  })();

  /* ---------- Station 4: Bruch und Dezimalzahl zuordnen ---------- */
  (function setupMatch() {
    var PAIRS = [
      ["{1/2}", "0,5"], ["{1/4}", "0,25"], ["{3/4}", "0,75"],
      ["{1/5}", "0,2"], ["{1/10}", "0,1"], ["{1/8}", "0,125"]
    ];
    var colA = $("#match-a");
    var colB = $("#match-b");
    var fb = $("#match-fb");
    var picked = null;
    var solved = 0;

    PAIRS.forEach(function (p, i) {
      var b = el("button", "match-item match-left", p[0]);
      b.dataset.i = i;
      colA.appendChild(b);
    });
    shuffle(PAIRS.map(function (p, i) { return i; })).forEach(function (i) {
      var b = el("button", "match-item match-right", PAIRS[i][1]);
      b.dataset.i = i;
      colB.appendChild(b);
    });

    colA.addEventListener("click", function (ev) {
      var b = ev.target.closest(".match-left");
      if (!b || b.disabled) return;
      $$(".match-left", colA).forEach(function (x) { x.classList.remove("is-picked"); });
      b.classList.add("is-picked");
      picked = b;
      fb.textContent = "Und welche Dezimalzahl ist genauso groß?";
      fb.className = "feedback";
    });

    colB.addEventListener("click", function (ev) {
      var b = ev.target.closest(".match-right");
      if (!b || b.disabled) return;
      if (!picked) {
        fb.textContent = "Tippe zuerst einen Bruch an.";
        fb.className = "feedback";
        return;
      }
      if (b.dataset.i === picked.dataset.i) {
        var p = PAIRS[b.dataset.i];
        picked.classList.remove("is-picked");
        picked.classList.add("is-right");
        b.classList.add("is-right");
        picked.disabled = true;
        b.disabled = true;
        picked = null;
        solved++;
        fb.className = "feedback is-right";
        if (solved === PAIRS.length) {
          fb.textContent = "✔ Super! Alle Paare gefunden. Diese sechs solltest du auswendig kennen.";
          markDone(4);
        } else {
          fb.innerHTML = fracHtml("✔ Richtig! " + p[0] + " = " + p[1]);
        }
      } else {
        b.classList.add("shake");
        setTimeout(function () { b.classList.remove("shake"); }, 450);
        fb.textContent = "✘ Das passt noch nicht. Tipp: Erweitere den Bruch auf den Nenner 10, 100 oder 1000.";
        fb.className = "feedback is-wrong";
      }
    });
  })();

  /* ---------- Station 10: Quiz mit Herrn Uhu ---------- */
  // only: "mit" / "ohne" = Frage erscheint nur in diesem Modus
  var QUESTIONS = [
    { q: "Wie heißt die Zahl unter dem Bruchstrich?", a: ["Nenner", "Zähler", "Quotient", "Summe"], why: "Der Nenner steht unten. Er sagt, in wie viele gleiche Teile das Ganze geteilt ist." },
    { q: "Wie lautet {4/6} vollständig gekürzt?", a: ["{2/3}", "{1/2}", "{4/3}", "{2/6}"], why: "Zähler und Nenner durch 2 teilen: 4 : 2 = 2 und 6 : 2 = 3." },
    { q: "Welcher Bruch ist am größten?", a: ["{3/4}", "{1/2}", "{2/3}", "{3/5}"], why: "Als Dezimalzahlen: 0,75 ist größer als 0,5, 0,666… und 0,6." },
    { q: "Wie schreibt man {3/4} als Dezimalzahl?", a: ["0,75", "0,34", "3,4", "0,43"], why: "{3/4} = {75/100} = 0,75." },
    { q: "Welche Zahl ist größer: 0,6 oder 0,58?", a: ["0,6", "0,58", "Beide sind gleich groß.", "Das kann man nicht sagen."], why: "0,6 = 0,60, und das ist mehr als 0,58." },
    { only: "mit", q: "{1/2} + {1/3} = ?", a: ["{5/6}", "{2/5}", "{1/5}", "{2/6}"], why: "Gleichnamig machen: {3/6} + {2/6} = {5/6}." },
    { only: "mit", q: "{5/8} − {1/4} = ?", a: ["{3/8}", "{4/4}", "{4/8}", "{6/12}"], why: "{1/4} = {2/8}, also {5/8} − {2/8} = {3/8}." },
    { q: "Was ist größer: {3/4} oder 0,7?", a: ["{3/4}", "0,7", "Beide sind gleich groß."], why: "{3/4} = 0,75 – und 0,75 ist größer als 0,70." },
    { q: "Welches Zeichen passt? {2/5} ▢ 0,45", a: ["<", ">", "="], why: "{2/5} = {4/10} = 0,40. Das ist kleiner als 0,45." },
    { q: "Welche Zahl ist am kleinsten?", a: ["0,2", "{1/4}", "0,3", "{1/2}"], why: "Als Dezimalzahlen: 0,2 – 0,25 – 0,3 – 0,5. Die kleinste ist 0,2." },
    { q: "Welche Dezimalzahl ist genauso groß wie {3/8}? Rechne 3 : 8.", a: ["0,375", "0,38", "3,8", "0,83"], why: "3 : 8 = 0,375. Der Bruchstrich bedeutet „geteilt durch“." },
    { q: "Du willst {3/5} mit 0,65 vergleichen. Was tust du zuerst?", a: ["{3/5} in eine Dezimalzahl umwandeln", "Zähler und Nenner vertauschen", "Das Komma bei 0,65 weglassen", "Beide Zahlen runden"], why: "{3/5} = {6/10} = 0,6. Jetzt siehst du: 0,6 < 0,65." },
    { q: "1,5 + 0,25 = ?", a: ["1,75", "1,30", "0,40", "4,0"], why: "Komma unter Komma: 1,50 + 0,25 = 1,75." },
    { q: "Runde 2,347 auf Zehntel.", a: ["2,3", "2,4", "2,35", "2,0"], why: "Die Hundertstel-Stelle ist 4, also wird abgerundet: 2,3." },
    { q: "Welche Zahl ist am größten?", a: ["0,7", "0,65", "0,605", "0,07"], why: "Zehntel vergleichen: 7 Zehntel sind mehr als 6 oder 0 Zehntel. Länger ist nicht größer!" },
    { q: "Welches Zeichen passt? 2,05 ▢ 2,5", a: ["<", ">", "="], why: "Vor dem Komma gleich. Zehntel: 0 ist kleiner als 5, also 2,05 < 2,50." },
    { q: "Rechne schriftlich: 9 : 4 = ?", a: ["2,25", "2,5", "2,1", "2,4"], why: "9 : 4 = 2 Rest 1. Komma, 0 herunter: 10 : 4 = 2 Rest 2. Wieder 0: 20 : 4 = 5." },
    { q: "Beim schriftlichen Dividieren bleibt ein Rest, aber alle Ziffern sind verbraucht. Was tust du?", a: ["Komma ins Ergebnis setzen und eine 0 herunterholen", "Den Rest einfach weglassen", "Den Rest ans Ergebnis anhängen", "Von vorn anfangen"], why: "So rechnest du hinter dem Komma weiter, bis der Rest 0 ist." },
    { only: "mit", q: "Warum blieb bei den siebzehn Kamelen eines übrig?", a: ["Weil {1/2} + {1/3} + {1/9} nur {17/18} ergeben.", "Weil die weise Frau zaubern konnte.", "Weil ein Kamel weggelaufen ist.", "Weil sich alle verzählt haben."], why: "Im Testament war ein Achtzehntel gar nicht verteilt – bei 18 Kamelen genau ein Kamel." },
    { only: "ohne", q: "Warum blieb bei den siebzehn Kamelen eines übrig?", a: ["Weil die drei Anteile zusammen nur 17 von 18 Kamelen ergeben.", "Weil die weise Frau zaubern konnte.", "Weil ein Kamel weggelaufen ist.", "Weil sich alle verzählt haben."], why: "{1/2} von 18 sind 9, {1/3} von 18 sind 6, {1/9} von 18 sind 2 – zusammen nur 17. Ein Kamel war im Testament gar nicht verteilt." }
  ];

  var PRAISE = ["Bravo! Genau richtig!", "Stark gerechnet!", "Hervorragend – weiter so!", "Volltreffer! Ich bin stolz auf dich.", "Klasse gemacht!", "Wunderbar! Das sitzt."];
  var COMFORT = ["Fast! Beim nächsten Mal klappt es.", "Nicht schlimm – aus Fehlern lernt man am meisten.", "Kopf hoch! Lies dir die Erklärung durch.", "Guter Versuch! Jetzt weißt du es.", "Macht nichts – auch die drei Geschwister mussten lange rechnen."];

  var quiz = null;

  function startQuiz(force) {
    if (quiz && !force && !quiz.finished) return;
    quiz = {
      // nur Fragen, die zum Modus passen; daraus eine zufällige Auswahl
      items: shuffle(QUESTIONS.filter(function (q) { return !q.only || q.only === state.mode; }))
        .slice(0, QUIZ_SIZE)
        .map(function (q) {
          return { q: q.q, why: q.why, right: q.a[0], answers: shuffle(q.a) };
        }),
      pos: 0, score: 0, streak: 0, finished: false
    };
    renderIntro();
  }

  function owlRow(img, name, lines) {
    var row = el("div", "owl-row");
    var pic = el("img", "owl owl-small");
    pic.src = "assets/img/" + img + ".jpg";
    pic.alt = "";
    var bubble = el("div", "bubble");
    if (name) bubble.appendChild(el("p", "bubble-name", name));
    lines.forEach(function (l) { bubble.appendChild(el("p", null, l)); });
    row.appendChild(pic);
    row.appendChild(bubble);
    return row;
  }

  function renderIntro() {
    var box = $("#quiz");
    box.textContent = "";
    var lines = ["Jetzt bist du dran! Ich habe " + QUIZ_SIZE + " Fragen für dich. Lass dir ruhig Zeit – es gibt keine Uhr. Papier und Stift für Nebenrechnungen sind erlaubt.", "Nach jeder Antwort erkläre ich dir kurz den Rechenweg. Du schaffst das!"];
    if (state.best != null) lines.push("Dein bisher bestes Ergebnis: " + state.best + " von " + QUIZ_SIZE + " Punkten.");
    box.appendChild(owlRow("eule-hallo", "Herr Uhu", lines));
    var actions = el("div", "actions");
    var go = el("button", "btn btn-primary btn-big", "Quiz starten");
    go.addEventListener("click", renderQuestion);
    actions.appendChild(go);
    box.appendChild(actions);
  }

  function renderQuestion() {
    var box = $("#quiz");
    var item = quiz.items[quiz.pos];
    var total = quiz.items.length;
    box.textContent = "";

    var head = el("div", "quiz-head");
    head.appendChild(el("span", "quiz-count", "Frage " + (quiz.pos + 1) + " von " + total));
    head.appendChild(el("span", "quiz-score", "★ " + quiz.score));
    box.appendChild(head);
    var bar = el("div", "bar");
    var fill = el("div", "bar-fill");
    fill.style.width = (quiz.pos / total) * 100 + "%";
    bar.appendChild(fill);
    box.appendChild(bar);

    box.appendChild(el("h3", "quiz-q", item.q));
    var list = el("div", "choices");
    var teacher = el("div", "teacher");
    teacher.setAttribute("role", "status");
    teacher.setAttribute("aria-live", "polite");

    item.answers.forEach(function (text) {
      var b = el("button", "choice", text);
      b.dataset.answer = text;
      b.addEventListener("click", function () {
        var ok = text === item.right;
        $$(".choice", list).forEach(function (x) {
          x.disabled = true;
          if (x.dataset.answer === item.right) x.classList.add("is-right");
        });
        if (ok) { quiz.score++; quiz.streak++; } else { b.classList.add("is-wrong"); quiz.streak = 0; }
        $(".quiz-score", box).textContent = "★ " + quiz.score;
        var say = ok ? PRAISE[Math.floor(Math.random() * PRAISE.length)] : COMFORT[Math.floor(Math.random() * COMFORT.length)];
        if (ok && quiz.streak >= 3) say = quiz.streak + " richtige Antworten hintereinander – du bist in Bestform!";
        teacher.textContent = "";
        var row = owlRow(ok ? "eule-jubel" : "eule-mut", "Herr Uhu", [say, item.why]);
        row.classList.add(ok ? "is-right" : "is-wrong");
        teacher.appendChild(row);
        var actions = el("div", "actions");
        var last = quiz.pos === total - 1;
        var next = el("button", "btn btn-primary", last ? "Zum Ergebnis" : "Nächste Frage");
        next.addEventListener("click", function () {
          quiz.pos++;
          if (last) renderResult(); else renderQuestion();
        });
        actions.appendChild(next);
        teacher.appendChild(actions);
        next.focus();
      });
      list.appendChild(b);
    });
    box.appendChild(list);
    box.appendChild(teacher);
  }

  function renderResult() {
    var box = $("#quiz");
    var total = quiz.items.length;
    var s = quiz.score;
    quiz.finished = true;
    if (state.best == null || s > state.best) state.best = s;
    markDone(LAST);
    box.textContent = "";

    var rank, lines, img;
    if (s === total) {
      rank = "Bruch-Meister"; img = "eule-jubel";
      lines = ["Alle Fragen richtig – das ist meisterhaft!", "Brüche und Dezimalzahlen hast du jetzt fest im Griff. Ich bin sehr stolz auf dich!"];
    } else if (s >= total - 2) {
      rank = "Bruch-Profi"; img = "eule-jubel";
      lines = ["Ein ganz starkes Ergebnis!", "Du hast fast alles gewusst. Schaffst du beim nächsten Mal die volle Punktzahl?"];
    } else if (s >= total / 2) {
      rank = "Bruch-Kenner"; img = "eule-mut";
      lines = ["Gut gemacht – das Wichtigste hast du verstanden!", "Schau dir die Stationen noch einmal an, bei denen du unsicher warst, und versuche es erneut. Es wird jedes Mal besser."];
    } else {
      rank = "Bruch-Entdecker"; img = "eule-mut";
      lines = ["Aller Anfang ist schwer – und du hast angefangen. Das zählt!", "Brüche brauchen Übung. Geh die Stationen in Ruhe noch einmal durch und probiere es dann erneut. Ich glaube an dich!"];
    }

    var card = el("div", "result");
    if (s >= total - 2) card.appendChild(confetti());
    card.appendChild(el("p", "kicker", "Dein Ergebnis"));
    card.appendChild(el("p", "result-score", s + " von " + total));
    var stars = el("p", "result-stars");
    var full = Math.round((s / total) * 5);
    stars.textContent = "★★★★★".slice(0, full) + "☆☆☆☆☆".slice(0, 5 - full);
    stars.setAttribute("aria-label", full + " von 5 Sternen");
    card.appendChild(stars);
    card.appendChild(el("p", "result-rank", rank));
    box.appendChild(card);
    box.appendChild(owlRow(img, "Herr Uhu", lines));

    box.appendChild(songCard());

    var actions = el("div", "actions");
    var again = el("button", "btn btn-primary", "Quiz noch einmal spielen");
    again.addEventListener("click", function () { startQuiz(true); });
    var home = el("button", "btn", "Zurück zum Start");
    home.dataset.go = "0";
    actions.appendChild(again);
    actions.appendChild(home);
    box.appendChild(actions);
  }

  /* ---------- Abschluss: das Bruch-Lied ---------- */
  var REFRAIN = ["Oben der Zähler, unten der Nenner,", "wir sind die Bruch- und Komma-Kenner!", "Erweitern, kürzen, gleichnamig machen –", "so lassen wir die Brüche krachen!"];
  var SONG = [
    ["Strophe 1", ["Ein Bruch, der hat zwei Zahlen, das ist doch gar nicht schwer:", "Der Nenner zählt die Teile, der Zähler: Wie viel nehm ich her?", "Drei Viertel von der Pizza, ein Halbes vom Kakao –", "wer Brüche lesen kann, der teilt gerecht und schlau."]],
    ["Refrain", REFRAIN],
    ["Strophe 2", ["Willst du zwei Brüche addieren, dann schau die Nenner an:", "Sind sie verschieden, mach sie gleich, erst dann sind die Zähler dran.", "Ein Halb ist null Komma fünf, ein Viertel null Komma zwei fünf,", "ob Bruch, ob Komma, ganz egal – es bleibt dieselbe Zahl."]],
    ["Refrain", null],
    ["Bridge", ["Siebzehn Kamele im Wüstensand,", "ein Halb, ein Drittel, ein Neuntel – wer hätt’s erkannt?", "Zusammen ist das gar kein Ganzes, nein:", "Siebzehn Achtzehntel – so muss es sein!"]],
    ["Refrain", null],
    ["Schluss", ["Oben der Zähler, unten der Nenner!"]]
  ];

  function songCard() {
    var card = el("section", "song");
    card.appendChild(el("p", "kicker", "Zum Abschluss"));
    card.appendChild(el("h3", "song-title", "Das Bruch-Lied: „Bruchstark“"));
    card.appendChild(el("p", "hint", "Geschafft! Zur Belohnung gibt es ein Lied zum Mitsingen – mit Zähler, Nenner und den siebzehn Kamelen."));
    var audio = el("audio", "song-player");
    audio.controls = true;
    audio.preload = "none";
    audio.src = "assets/audio/bruchstark.mp3";
    card.appendChild(audio);
    var det = el("details", "readalong");
    det.appendChild(el("summary", null, "Text zum Mitsingen"));
    var body = el("div", "lyrics");
    SONG.forEach(function (part) {
      body.appendChild(el("p", "lyrics-part", part[0]));
      var p = el("p", "lyrics-lines");
      if (part[1]) {
        part[1].forEach(function (line, i) {
          if (i) p.appendChild(document.createElement("br"));
          p.appendChild(document.createTextNode(line));
        });
      } else {
        p.textContent = REFRAIN[0] + " …";
        p.classList.add("is-repeat");
      }
      body.appendChild(p);
    });
    det.appendChild(body);
    card.appendChild(det);
    return card;
  }

  function confetti() {
    var wrap = el("div", "confetti");
    wrap.setAttribute("aria-hidden", "true");
    var colors = ["#c2541b", "#2f6b4f", "#e0a526", "#3d7fb5", "#b8336a"];
    for (var i = 0; i < 36; i++) {
      var p = el("i");
      p.style.left = Math.random() * 100 + "%";
      p.style.background = colors[i % colors.length];
      p.style.animationDelay = Math.random() * 1.2 + "s";
      p.style.animationDuration = 2.2 + Math.random() * 1.8 + "s";
      wrap.appendChild(p);
    }
    return wrap;
  }

  /* ---------- Start ---------- */
  fracifyNode($("main"));

  var wanted = /[?&]modus=(mit|ohne)\b/.exec(location.search);
  setMode(wanted ? wanted[1] : state.mode);
  $$(".mode-option").forEach(function (b) {
    b.addEventListener("click", function () { setMode(b.dataset.mode); });
  });
  $("#version").textContent = "v" + VERSION;

  $("#reset").addEventListener("click", function () {
    if (!window.confirm("Möchtest du deinen Fortschritt wirklich löschen?")) return;
    try { localStorage.removeItem(STORE_KEY); } catch (e) { /* egal */ }
    location.hash = "";
    location.reload();
  });

  for (var n = 1; n < LAST; n++) {
    if (state.done[n]) $("#next" + n).disabled = false;
  }

  var start = Number((location.hash || "").slice(1));
  show(start >= 0 && start <= LAST ? start : 0);
})();
