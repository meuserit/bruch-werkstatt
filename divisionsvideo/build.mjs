// Erzeugt index.html (Hyperframes-Komposition „Schriftlich dividieren“: 13 : 4 = 3,25).
// Aufruf:  node build.mjs   → danach  npm run render
import { writeFileSync } from "node:fs";

const GAP = 0.6;
const HOLD = 3.0;

const clips = [
  { id: 1, audio: 5.8, caps: [[0, "Schriftlich dividieren – so geht’s."], [2.5, "Wir rechnen: dreizehn geteilt durch vier."]] },
  { id: 2, audio: 9.8, caps: [[0, "Wie oft passt die Vier in die Dreizehn? Dreimal."], [3.65, "Drei mal vier ist zwölf."], [5.8, "Dreizehn minus zwölf: Es bleibt der Rest eins."]] },
  { id: 3, audio: 8.99, caps: [[0, "Jetzt sind keine Ziffern mehr da."], [2.2, "Deshalb setzen wir im Ergebnis ein Komma und holen eine Null herunter."], [6.8, "Aus der Eins wird eine Zehn."]] },
  { id: 4, audio: 6.77, caps: [[0, "Die Vier passt zweimal in die Zehn."], [2.6, "Zwei mal vier ist acht."], [4.8, "Es bleibt der Rest zwei."]] },
  { id: 5, audio: 8.12, caps: [[0, "Wieder holen wir eine Null herunter."], [2.25, "Die Vier passt fünfmal in die Zwanzig."], [5.25, "Der Rest ist null – wir sind fertig."]] },
  { id: 6, audio: 9.25, caps: [[0, "Dreizehn geteilt durch vier ist drei Komma zwei fünf."], [3.65, "Merke dir: Teilen, malnehmen, abziehen, herunterholen."]] },
];

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

// Sprecher und Untertitel
let n = 0;
for (const c of clips) {
  html.push(`<audio id="a${c.id}" src="assets/d${c.id}.mp3" data-start="${r(c.at)}" data-duration="${c.audio}" data-track-index="5" data-volume="1"></audio>`);
  c.caps.forEach(([at, text], i) => {
    const st = c.at + at;
    const en = i + 1 < c.caps.length ? c.at + c.caps[i + 1][0] : c.at + c.audio + 0.4;
    const id = `cap${n++}`;
    html.push(`<div id="${id}" class="clip cap" data-start="${r(st)}" data-duration="${r(en - st)}" data-track-index="3"><span>${text}</span></div>`);
    anim.push(`tl.fromTo("#${id}", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }, ${r(st)});`);
    anim.push(`tl.to("#${id}", { opacity: 0, duration: 0.25, ease: "power1.in" }, ${r(en - 0.25)});`);
  });
}

const show = (id, cls, inner, at, style) => {
  html.push(`<div id="${id}" class="clip ${cls}" style="${style}" data-start="${r(at)}" data-duration="${r(total - at)}" data-track-index="1">${inner}</div>`);
};

show("head", "head", "Schriftlich dividieren", 0, "");
anim.push(`tl.fromTo("#head", { opacity: 0, y: -30 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, 0.2);`);
show("owl", "owl", `<img src="assets/eule.jpg" alt="" />`, 0, "");
anim.push(`tl.fromTo("#owl", { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.5, ease: "power3.out" }, 0.4);`);

// Rechen-Gitter: Spalte/Zeile → Position
const X0 = 420, Y0 = 185, W = 84, H = 92;
let k = 0;
const cell = (text, col, row, at, cls = "") => {
  const id = `z${k++}`;
  show(id, `cell ${cls}`, text, at, `left:${r(X0 + col * W)}px;top:${Y0 + row * H}px`);
  anim.push(`tl.fromTo("#${id}", { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(2)" }, ${r(at)});`);
  return id;
};
const rule = (col, row, cols, at) => {
  const id = `l${k++}`;
  show(id, "rule", "", at, `left:${X0 + col * W}px;top:${Y0 + (row + 1) * H - 4}px;width:${cols * W}px`);
  anim.push(`tl.fromTo("#${id}", { opacity: 0, scaleX: 0 }, { opacity: 1, scaleX: 1, duration: 0.35, ease: "power2.out" }, ${r(at)});`);
};
const drop = (text, col, fromRow, toRow, at) => {
  // heruntergeholte Null: gleitet von oben an ihren Platz
  const id = `z${k++}`;
  show(id, "cell drop", text, at, `left:${X0 + col * W}px;top:${Y0 + toRow * H}px`);
  anim.push(`tl.fromTo("#${id}", { opacity: 0, y: ${-(toRow - fromRow) * H} }, { opacity: 1, y: 0, duration: 0.7, ease: "power2.inOut" }, ${r(at)});`);
};

// Aufgabe: 13 : 4 =
const a1 = T(1, 3.0);
["1", "3", ":", "4", "="].forEach((ch, i) => cell(ch, i, 0, a1 + i * 0.12));

// 1. Runde: 13 : 4 = 3 Rest 1
const q3 = cell("3", 5, 0, T(2, 2.9), "quot");
cell("−", -1, 1, T(2, 4.6), "minus");
cell("1", 0, 1, T(2, 4.6));
cell("2", 1, 1, T(2, 4.75));
rule(0, 1, 2, T(2, 6.3));
cell("1", 1, 2, T(2, 8.6), "rest");

// Komma und erste Null
cell(",", 5.62, 0, T(3, 4.0), "quot comma");
drop("0", 2, 0, 2, T(3, 5.6));

// 2. Runde: 10 : 4 = 2 Rest 2
const q2 = cell("2", 6.25, 0, T(4, 1.5), "quot");
cell("−", 1, 3, T(4, 3.9), "minus");
cell("8", 2, 3, T(4, 3.9));
rule(1, 3, 2, T(4, 5.2));
cell("2", 2, 4, T(4, 6.0), "rest");

// 3. Runde: 20 : 4 = 5 Rest 0
drop("0", 3, 0, 4, T(5, 1.4));
const q5 = cell("5", 7.25, 0, T(5, 3.8), "quot");
cell("−", 1, 5, T(5, 4.8), "minus");
cell("2", 2, 5, T(5, 4.8));
cell("0", 3, 5, T(5, 4.95));
rule(2, 5, 2, T(5, 5.7));
cell("0", 3, 6, T(5, 6.3), "rest");

// Ergebnis betonen
[q3, q2, q5].forEach((id, i) => {
  anim.push(`tl.to("#${id}", { scale: 1.3, duration: 0.25, ease: "power2.out" }, ${r(T(6, 1.7) + i * 0.45)});`);
  anim.push(`tl.to("#${id}", { scale: 1, duration: 0.3, ease: "power2.inOut" }, ${r(T(6, 1.95) + i * 0.45)});`);
});

// Die vier Schritte rechts: leuchten auf, wenn sie dran sind
const steps = ["Teilen", "Malnehmen", "Abziehen", "Herunterholen"];
steps.forEach((text, i) => {
  show(`st${i}`, "step", `<em>${i + 1}</em>${text}`, T(1, 4.6), `left:1310px;top:${250 + i * 132}px`);
  anim.push(`tl.fromTo("#st${i}", { opacity: 0, x: 40 }, { opacity: 0.35, x: 0, duration: 0.4, ease: "power2.out" }, ${r(T(1, 4.6) + i * 0.1)});`);
});
const light = (i, from, to) => {
  anim.push(`tl.to("#st${i}", { opacity: 1, scale: 1.06, duration: 0.25, ease: "power2.out" }, ${r(from)});`);
  if (to != null) anim.push(`tl.to("#st${i}", { opacity: 0.35, scale: 1, duration: 0.3, ease: "power2.in" }, ${r(to)});`);
};
light(0, T(2, 0.2), T(2, 3.6));
light(1, T(2, 3.9), T(2, 5.7));
light(2, T(2, 6.1), T(2, 9.6));
light(3, T(3, 4.9), T(3, 8.8));
light(0, T(4, 0.2), T(4, 2.5));
light(1, T(4, 2.9), T(4, 4.6));
light(2, T(4, 5.0), T(4, 6.7));
light(3, T(5, 0.2), T(5, 2.1));
light(0, T(5, 2.5), T(5, 4.5));
light(1, T(5, 4.7), T(5, 5.5));
light(2, T(5, 5.7), T(5, 7.9));
light(0, T(6, 5.0), null);
light(1, T(6, 5.9), null);
light(2, T(6, 7.0), null);
light(3, T(6, 8.1), null);

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
      .head { position: absolute; left: 0; right: 0; top: 44px; text-align: center; font-family: "Fraunces", serif; font-weight: 800; font-size: 84px; letter-spacing: -0.01em; }
      .owl { position: absolute; left: 50px; bottom: 44px; width: 210px; height: 210px; border-radius: 50%; overflow: hidden; border: 6px solid #fffdf6; box-shadow: 0 0 0 3px var(--line), 0 10px 0 rgba(58, 36, 18, 0.12); z-index: 5; }
      .owl img { width: 100%; height: 100%; object-fit: cover; }
      .cell { position: absolute; width: 84px; height: 92px; display: grid; place-items: center; font-family: "Nunito", sans-serif; font-weight: 900; font-size: 84px; line-height: 1; font-variant-numeric: tabular-nums; }
      .quot { color: var(--green); }
      .comma { width: 40px; color: var(--accent); }
      .minus { color: var(--ink); opacity: 0.8; }
      .rest { color: var(--accent); }
      .drop { color: var(--accent); }
      .rule { position: absolute; height: 7px; border-radius: 4px; background: var(--ink); transform-origin: left center; }
      .step { position: absolute; width: 500px; height: 108px; display: flex; align-items: center; gap: 22px; padding: 0 28px; border-radius: 26px; background: #fffdf6; border: 4px solid var(--line); box-shadow: 0 8px 0 rgba(58, 36, 18, 0.12); font-size: 44px; font-weight: 900; white-space: nowrap; }
      .step em { flex: none; display: grid; place-items: center; width: 64px; height: 64px; border-radius: 50%; background: var(--accent); color: #fff; font-family: "Fraunces", serif; font-style: normal; font-size: 40px; }
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
