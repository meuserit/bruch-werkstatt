// Erzeugt index.html (Hyperframes-Komposition „Brüche addieren“).
// Aufruf:  node build.mjs   → danach  npm run render
import { writeFileSync } from "node:fs";

const GAP = 0.6; // Pause zwischen den Sprecher-Abschnitten
const F = (z, n) => `<span class="frac"><span>${z}</span><span>${n}</span></span>`;

// Sprecher-Abschnitte: Länge der Aufnahme und Untertitel (Startzeit relativ zur Aufnahme)
const clips = [
  { id: 1, audio: 3.24, caps: [[0, "Wie addiert man Brüche? Schau genau hin!"]] },
  { id: 2, audio: 8.28, caps: [[0, "Wir rechnen: ein Halb plus ein Drittel."], [3.4, "Die Stücke sind verschieden groß. So können wir sie nicht einfach zusammenzählen."]] },
  { id: 3, audio: 9.95, caps: [[0, "Deshalb machen wir die Brüche gleichnamig."], [2.65, "Wir suchen einen gemeinsamen Nenner."], [5.15, "Die Sechs passt: Sie ist ein Vielfaches von zwei und von drei."]] },
  { id: 4, audio: 7.0, caps: [[0, "Jetzt erweitern wir."], [1.6, "Ein Halb sind drei Sechstel."], [4.25, "Und ein Drittel sind zwei Sechstel."]] },
  { id: 5, audio: 6.53, caps: [[0, "Nun sind alle Stücke gleich groß."], [2.4, "Drei Sechstel plus zwei Sechstel sind fünf Sechstel."]] },
  { id: 6, audio: 6.61, caps: [[0, "Merke dir: Erst gleichnamig machen, dann die Zähler addieren. Der Nenner bleibt gleich."]] },
];
const HOLD = 3.0;

const r = (n) => Math.round(n * 100) / 100;
let t = 0.8;
for (const c of clips) {
  c.at = t;
  t += c.audio + GAP;
}
const total = r(t + HOLD);
const T = (clip, offset) => r(clips[clip - 1].at + offset);

const html = [];
const anim = [];
const el = (id, cls, inner, start, style = "") =>
  html.push(`<div id="${id}" class="clip ${cls}" style="${style}" data-start="${r(start)}" data-duration="${r(total - start)}" data-track-index="1">${inner}</div>`);
const fadeIn = (id, at, extra = "y: 20") => anim.push(`tl.fromTo("#${id}", { opacity: 0, ${extra} }, { opacity: 1, x: 0, y: 0, scale: 1, scaleX: 1, duration: 0.5, ease: "power3.out" }, ${at});`);
const fadeOut = (id, at) => anim.push(`tl.to("#${id}", { opacity: 0, duration: 0.4, ease: "power1.in" }, ${at});`);

// Sprecher und Untertitel
let n = 0;
for (const c of clips) {
  html.push(`<audio id="a${c.id}" src="assets/e${c.id}.mp3" data-start="${r(c.at)}" data-duration="${c.audio}" data-track-index="5" data-volume="1"></audio>`);
  c.caps.forEach(([at, text], i) => {
    const st = c.at + at;
    const en = i + 1 < c.caps.length ? c.at + c.caps[i + 1][0] : c.at + c.audio + 0.4;
    const id = `cap${n++}`;
    html.push(`<div id="${id}" class="clip cap" data-start="${r(st)}" data-duration="${r(en - st)}" data-track-index="3"><span>${text}</span></div>`);
    anim.push(`tl.fromTo("#${id}", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }, ${r(st)});`);
    anim.push(`tl.to("#${id}", { opacity: 0, duration: 0.25, ease: "power1.in" }, ${r(en - 0.25)});`);
  });
}

// Bühne: Titel, Eule, Streifen
el("head", "head", "Brüche addieren", 0);
fadeIn("head", 0.2, "y: -30");
el("owl", "owl", `<img src="assets/eule.jpg" alt="" />`, 0);
fadeIn("owl", 0.4, "scale: 0.6");

const dividers = (count, cls) => Array.from({ length: count - 1 }, (_, i) => `<i class="${cls}" style="left:${((i + 1) / count) * 100}%"></i>`).join("");
const fine = (skip) => [1, 2, 3, 4, 5].filter((k) => !skip.includes(k)).map((k) => `<i class="fine" style="left:${(k / 6) * 100}%"></i>`).join("");

el("barA", "bar", `<b class="fill fa" style="width:50%"></b>${dividers(2, "div")}<span id="fineA">${fine([3])}</span>`, T(1, 0.6), "top:190px");
el("barB", "bar", `<b class="fill fb" style="width:33.333%"></b>${dividers(3, "div")}<span id="fineB">${fine([2, 4])}</span>`, T(1, 1.0), "top:370px");
fadeIn("barA", T(1, 0.6), "x: -60");
fadeIn("barB", T(1, 1.0), "x: -60");
anim.push(`tl.set("#fineA", { opacity: 0 }, 0);`, `tl.set("#fineB", { opacity: 0 }, 0);`);

// Beschriftungen rechts neben den Streifen
el("lblA", "lbl", F(1, 2), T(2, 1.5), "top:185px");
el("plus", "lbl plus", "+", T(2, 2.2), "top:370px");
el("lblB", "lbl", F(1, 3), T(2, 2.6), "top:365px");
fadeIn("lblA", T(2, 1.5), "scale: 0.5");
fadeIn("plus", T(2, 2.2), "scale: 0.5");
fadeIn("lblB", T(2, 2.6), "scale: 0.5");

// „verschieden groß“
el("neq", "chip chip-warn", "≠ verschieden große Stücke", T(2, 4.0), "top:555px");
fadeIn("neq", T(2, 4.0), "scale: 0.7");
fadeOut("neq", T(3, 0.2));

// gemeinsamer Nenner
el("nenner", "chip", "Gemeinsamer Nenner: <b>6</b> &nbsp;·&nbsp; 2 · 3 = 6 &nbsp;und&nbsp; 3 · 2 = 6", T(3, 5.3), "top:555px");
fadeIn("nenner", T(3, 5.3), "scale: 0.7");
fadeOut("nenner", T(5, 0.0));

// Erweitern: feine Teilstriche und neue Brüche
anim.push(`tl.to("#fineA", { opacity: 1, duration: 0.6, ease: "power2.out" }, ${T(4, 1.8)});`);
el("lblA2", "lbl lbl2", `= ${F(3, 6)}`, T(4, 2.6), "top:185px");
fadeIn("lblA2", T(4, 2.6), "x: -30");
anim.push(`tl.to("#fineB", { opacity: 1, duration: 0.6, ease: "power2.out" }, ${T(4, 4.4)});`);
el("lblB2", "lbl lbl2", `= ${F(2, 6)}`, T(4, 5.3), "top:365px");
fadeIn("lblB2", T(4, 5.3), "x: -30");

// Ergebnis-Streifen
el("line", "line", "", T(5, 0.2), "top:522px");
fadeIn("line", T(5, 0.2), "scaleX: 0.2");
el("barC", "bar", `<b id="fillC1" class="fill fa" style="width:50%"></b><b id="fillC2" class="fill fb" style="left:50%;width:33.333%"></b>${dividers(6, "div")}`, T(5, 0.3), "top:570px");
fadeIn("barC", T(5, 0.3), "y: 30");
anim.push(`tl.set("#fillC1", { scaleX: 0 }, 0);`, `tl.set("#fillC2", { scaleX: 0 }, 0);`);
anim.push(`tl.to("#fillC1", { scaleX: 1, duration: 0.7, ease: "power2.inOut" }, ${T(5, 2.5)});`);
anim.push(`tl.to("#fillC2", { scaleX: 1, duration: 0.7, ease: "power2.inOut" }, ${T(5, 3.5)});`);
el("lblC", "lbl lblC", `= ${F(5, 6)}`, T(5, 4.6), "top:565px");
anim.push(`tl.fromTo("#lblC", { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1, duration: 0.6, ease: "back.out(1.8)" }, ${T(5, 4.6)});`);

// Merkkasten
const steps = [
  ["m1", "1", "Gleichnamig machen", 1.2],
  ["m2", "2", "Zähler addieren", 2.9],
  ["m3", "3", "Nenner bleibt gleich", 5.0],
];
steps.forEach(([id, no, text, at], i) => {
  el(id, "step", `<em>${no}</em>${text}`, T(6, at), `left:${330 + i * 480}px;top:735px`);
  anim.push(`tl.fromTo("#${id}", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.5, ease: "back.out(1.6)" }, ${T(6, at)});`);
});

const page = `<!doctype html>
<!-- Automatisch erzeugt von build.mjs – bitte dort ändern, nicht hier. -->
<html lang="de">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1920, height=1080" />
    <script src="vendor/gsap.min.js"></script>
    <style>
      @font-face { font-family: "Fraunces"; src: url("assets/fonts/fraunces-latin-wght-normal.woff2") format("woff2"); font-weight: 100 900; }
      @font-face { font-family: "Nunito"; src: url("assets/fonts/nunito-latin-wght-normal.woff2") format("woff2"); font-weight: 200 1000; }
      :root { --paper: #fff6e0; --ink: #3a2412; --accent: #c2541b; --green: #2f6b4f; --line: #e3cf9f; }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: 1920px; height: 1080px; overflow: hidden; background: var(--paper); }
      #root { position: relative; width: 1920px; height: 1080px; overflow: hidden; font-family: "Nunito", sans-serif; color: var(--ink); background: radial-gradient(circle at 20% 0%, #fffaf0 0, transparent 50%), radial-gradient(circle at 100% 100%, #f6e7c3 0, transparent 55%), var(--paper); }
      .frac { display: inline-flex; flex-direction: column; align-items: center; vertical-align: middle; line-height: 1; margin: 0 0.12em; font-variant-numeric: tabular-nums; }
      .frac span:first-child { border-bottom: 0.08em solid currentColor; padding: 0 0.16em 0.06em; }
      .frac span:last-child { padding: 0.06em 0.16em 0; }
      .head { position: absolute; left: 0; right: 0; top: 44px; text-align: center; font-family: "Fraunces", serif; font-weight: 800; font-size: 84px; letter-spacing: -0.01em; }
      .owl { position: absolute; left: 50px; bottom: 44px; width: 210px; height: 210px; border-radius: 50%; overflow: hidden; border: 6px solid #fffdf6; box-shadow: 0 0 0 3px var(--line), 0 10px 0 rgba(58, 36, 18, 0.12); z-index: 5; }
      .owl img { width: 100%; height: 100%; object-fit: cover; }
      .bar { position: absolute; left: 330px; width: 900px; height: 130px; background: #fffdf6; border: 6px solid var(--ink); border-radius: 18px; overflow: hidden; }
      .fill { position: absolute; top: 0; bottom: 0; left: 0; transform-origin: left center; }
      .fa { background: #e8873f; }
      .fb { background: #5fa57f; }
      .bar i { position: absolute; top: 0; bottom: 0; width: 6px; margin-left: -3px; background: var(--ink); }
      .bar i.fine { width: 4px; margin-left: -2px; background: rgba(58, 36, 18, 0.55); }
      .lbl { position: absolute; left: 1290px; height: 140px; display: flex; align-items: center; font-family: "Fraunces", serif; font-weight: 800; font-size: 58px; white-space: nowrap; }
      .lbl2 { left: 1400px; color: var(--accent); }
      .plus { left: 240px; height: 130px; font-size: 90px; }
      .lblC { left: 1290px; color: var(--green); font-size: 76px; }
      .line { position: absolute; left: 330px; width: 1300px; height: 8px; border-radius: 4px; background: var(--ink); }
      .chip { position: absolute; left: 330px; height: 96px; display: flex; align-items: center; padding: 0 44px; border-radius: 999px; background: var(--green); color: #fff; font-size: 46px; font-weight: 800; white-space: nowrap; }
      .chip b { font-size: 60px; margin-left: 0.25em; }
      .chip-warn { background: var(--accent); }
      .step { position: absolute; width: 450px; height: 110px; display: flex; align-items: center; gap: 18px; padding: 0 26px; border-radius: 26px; background: #fffdf6; border: 4px solid var(--line); box-shadow: 0 8px 0 rgba(58, 36, 18, 0.12); font-size: 31px; font-weight: 900; white-space: nowrap; }
      .step em { flex: none; display: grid; place-items: center; width: 62px; height: 62px; border-radius: 50%; background: var(--accent); color: #fff; font-family: "Fraunces", serif; font-style: normal; font-size: 38px; }
      .cap { position: absolute; z-index: 40; left: 300px; right: 80px; bottom: 54px; display: flex; justify-content: center; }
      .cap span { display: block; background: var(--ink); color: var(--paper); font-family: "Fraunces", serif; font-weight: 600; font-size: 46px; line-height: 1.28; text-align: center; padding: 22px 46px; border-radius: 28px; }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${total}" data-width="1920" data-height="1080">
      ${html.join("\n      ")}
    </div>
    <script>
      window.__timelines = window.__timelines || {};
      const tl = gsap.timeline({ paused: true });
      ${anim.join("\n      ")}
      window.__timelines["main"] = tl;
      tl.seek(0);
    </script>
  </body>
</html>
`;
writeFileSync(new URL("./index.html", import.meta.url), page);
console.log(`index.html geschrieben – Gesamtlänge ${total} s`);
