// Erzeugt index.html (Hyperframes-Komposition „Bruch oder Dezimalzahl – was ist größer?“).
// Aufruf:  node build.mjs   → danach  npm run render
import { writeFileSync } from "node:fs";

const GAP = 0.6;
const HOLD = 3.0;
const F = (z, n) => `<span class="frac"><span>${z}</span><span>${n}</span></span>`;

const clips = [
  { id: 1, audio: 6.84, caps: [[0, "Bruch oder Dezimalzahl – was ist größer?"], [3.5, "Der Trick: Wir schreiben beide Zahlen gleich."]] },
  { id: 2, audio: 12.12, caps: [[0, "Erstes Beispiel: drei Viertel oder null Komma sieben?"], [4.0, "Wir erweitern drei Viertel auf Hundertstel."], [7.05, "Das sind fünfundsiebzig Hundertstel, also null Komma sieben fünf."]] },
  { id: 3, audio: 9.87, caps: [[0, "Jetzt vergleichen wir Stelle für Stelle."], [2.7, "Null Komma sieben fünf ist größer als null Komma sieben null."], [7.2, "Also ist drei Viertel größer."]] },
  { id: 4, audio: 9.72, caps: [[0, "Zweites Beispiel: drei Achtel oder null Komma vier?"], [4.0, "Hier dividieren wir."], [5.7, "Drei geteilt durch acht ist null Komma drei sieben fünf."]] },
  { id: 5, audio: 9.25, caps: [[0, "Vorsicht, Falle!"], [1.45, "Null Komma drei sieben fünf sieht länger aus, ist aber kleiner als null Komma vier."], [6.75, "Also ist drei Achtel kleiner."]] },
  { id: 6, audio: 7.0, caps: [] }, // hier zeigen die beiden Merk-Schilder den Text
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

let n = 0;
for (const c of clips) {
  html.push(`<audio id="a${c.id}" src="assets/v${c.id}.mp3" data-start="${r(c.at)}" data-duration="${c.audio}" data-track-index="5" data-volume="1"></audio>`);
  c.caps.forEach(([at, text], i) => {
    const st = c.at + at;
    const en = i + 1 < c.caps.length ? c.at + c.caps[i + 1][0] : c.at + c.audio + 0.4;
    const id = `cap${n++}`;
    html.push(`<div id="${id}" class="clip cap" data-start="${r(st)}" data-duration="${r(en - st)}" data-track-index="3"><span>${text}</span></div>`);
    anim.push(`tl.fromTo("#${id}", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }, ${r(st)});`);
    anim.push(`tl.to("#${id}", { opacity: 0, duration: 0.25, ease: "power1.in" }, ${r(en - 0.25)});`);
  });
}

const clip = (id, cls, inner, from, to = total) =>
  html.push(`<div id="${id}" class="clip ${cls}" data-start="${r(from)}" data-duration="${r(to - from)}" data-track-index="1">${inner}</div>`);
const pop = (id, at) => anim.push(`tl.fromTo("#${id}", { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.45, ease: "back.out(1.8)" }, ${r(at)});`);
const fade = (id, at) => anim.push(`tl.fromTo("#${id}", { opacity: 0, x: -24 }, { opacity: 1, x: 0, duration: 0.45, ease: "power3.out" }, ${r(at)});`);
const hide = (id) => anim.push(`tl.set("#${id}", { opacity: 0 }, 0);`);

clip("head", "head", "Bruch oder Dezimalzahl?", 0);
anim.push(`tl.fromTo("#head", { opacity: 0, y: -30 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, 0.2);`);
clip("owl", "owl", `<img src="assets/eule.jpg" alt="" />`, 0);
anim.push(`tl.fromTo("#owl", { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.5, ease: "power3.out" }, 0.4);`);

// Ein Beispiel = Frage oben, Umwandlung in der Mitte, Stellen-Vergleich unten
function example(p, { from, to, frac, dec, sign, steps, rows, col, times }) {
  const digits = (text, rowCls) =>
    text.split("").map((ch, i) => {
      const cls = ch === "," ? "d comma" : `d${i === col ? " " + rowCls : ""}${text.endsWith("§") ? "" : ""}`;
      return `<span class="${cls}" ${i === col ? `id="${p}-${rowCls}"` : ""}>${ch}</span>`;
    }).join("");
  const inner = `
    <div class="q"><span id="${p}-l">${frac}</span><span class="sign"><b id="${p}-q">?</b><b id="${p}-s" class="res">${sign}</b></span><span id="${p}-r">${dec}</span></div>
    <div class="conv">${steps.map((s, i) => `<span id="${p}-c${i}">${s}</span>`).join("")}</div>
    <div class="stack" id="${p}-stack">
      <div class="row"><span class="lab">${rows[0][0]}</span>${digits(rows[0][1], "top")}</div>
      <div class="row"><span class="lab">${rows[1][0]}</span>${digits(rows[1][1], "bot")}</div>
    </div>`;
  clip(p, "ex", inner, from, to);
  pop(`${p}-l`, times.q);
  pop(`${p}-q`, times.q + 0.25);
  pop(`${p}-r`, times.q + 0.5);
  hide(`${p}-s`);
  steps.forEach((_, i) => { hide(`${p}-c${i}`); fade(`${p}-c${i}`, times.steps[i]); });
  hide(`${p}-stack`);
  anim.push(`tl.fromTo("#${p}-stack", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, ${r(times.stack)});`);
  // entscheidende Stelle hervorheben
  anim.push(`tl.to("#${p}-top", { scale: 1.25, duration: 0.3, ease: "power2.out" }, ${r(times.mark)});`);
  anim.push(`tl.to("#${p}-bot", { scale: 1.25, duration: 0.3, ease: "power2.out" }, ${r(times.mark + 0.15)});`);
  anim.push(`tl.to("#${p}-top", { scale: 1, duration: 0.3 }, ${r(times.mark + 0.9)});`);
  anim.push(`tl.to("#${p}-bot", { scale: 1, duration: 0.3 }, ${r(times.mark + 1.05)});`);
  // Fragezeichen wird zum Ergebnis
  anim.push(`tl.to("#${p}-q", { opacity: 0, scale: 0.4, duration: 0.25, ease: "power2.in" }, ${r(times.sign)});`);
  anim.push(`tl.fromTo("#${p}-s", { opacity: 0, scale: 0.3 }, { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(2.2)" }, ${r(times.sign + 0.2)});`);
  if (to < total) anim.push(`tl.to("#${p}", { opacity: 0, duration: 0.4, ease: "power1.in" }, ${r(to - 0.4)});`);
}

example("e1", {
  from: T(2, 1.2), to: T(4, 0.9),
  frac: F(3, 4), dec: "0,7", sign: "&gt;",
  steps: [F(3, 4), `= ${F(75, 100)}`, "= 0,75"],
  rows: [[F(3, 4), "0,75"], ["0,7", "0,70"]], col: 3,
  times: { q: T(2, 1.5), steps: [T(2, 4.6), T(2, 5.6), T(2, 10.2)], stack: T(3, 0.4), mark: T(3, 4.4), sign: T(3, 8.0) },
});
example("e2", {
  from: T(4, 1.3), to: total,
  frac: F(3, 8), dec: "0,4", sign: "&lt;",
  steps: [F(3, 8), "= 3 : 8", "= 0,375"],
  rows: [[F(3, 8), "0,375"], ["0,4", "0,400"]], col: 2,
  times: { q: T(4, 1.6), steps: [T(4, 4.6), T(4, 6.1), T(4, 8.3)], stack: T(5, 0.3), mark: T(5, 4.8), sign: T(5, 7.6) },
});

// Merkkasten
[["m1", "1", "Bruch in Dezimalzahl umwandeln", 1.4, 330], ["m2", "2", "Stelle für Stelle vergleichen", 4.7, 1080]].forEach(([id, no, text, at, left]) => {
  clip(id, "step", `<em>${no}</em>${text}`, T(6, at));
  anim.push(`tl.set("#${id}", { x: ${left} }, 0);`);
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
      .frac { display: inline-flex; flex-direction: column; align-items: center; vertical-align: middle; line-height: 1; margin: 0 0.1em; font-variant-numeric: tabular-nums; }
      .frac span:first-child { border-bottom: 0.08em solid currentColor; padding: 0 0.16em 0.05em; }
      .frac span:last-child { padding: 0.05em 0.16em 0; }
      .head { position: absolute; left: 0; right: 0; top: 40px; text-align: center; font-family: "Fraunces", serif; font-weight: 800; font-size: 80px; letter-spacing: -0.01em; }
      .owl { position: absolute; left: 50px; bottom: 44px; width: 210px; height: 210px; border-radius: 50%; overflow: hidden; border: 6px solid #fffdf6; box-shadow: 0 0 0 3px var(--line), 0 10px 0 rgba(58, 36, 18, 0.12); z-index: 5; }
      .owl img { width: 100%; height: 100%; object-fit: cover; }
      .ex { position: absolute; left: 0; right: 0; top: 160px; height: 640px; }
      .q { position: absolute; left: 0; right: 0; top: 0; height: 230px; display: flex; align-items: center; justify-content: center; gap: 50px; font-family: "Fraunces", serif; font-weight: 800; font-size: 130px; }
      .q > span { display: inline-block; }
      .q .frac { font-size: 0.78em; }
      .sign { position: relative; width: 150px; height: 170px; }
      .sign b { position: absolute; inset: 0; display: grid; place-items: center; border-radius: 30px; background: #fffdf6; border: 5px solid var(--line); color: var(--accent); }
      .sign b.res { background: var(--green); border-color: var(--green); color: #fff; }
      .conv { position: absolute; left: 0; right: 0; top: 250px; height: 150px; display: flex; align-items: center; justify-content: center; gap: 26px; font-family: "Fraunces", serif; font-weight: 700; font-size: 80px; color: var(--accent); }
      .conv > span { display: inline-block; white-space: nowrap; }
      .conv .frac { font-size: 0.78em; }
      .stack { position: absolute; left: 610px; top: 420px; width: 700px; padding: 16px 30px; border-radius: 30px; background: #fffdf6; border: 4px solid var(--line); box-shadow: 0 8px 0 rgba(58, 36, 18, 0.12); }
      .row { display: flex; align-items: center; height: 94px; }
      .lab { width: 190px; font-family: "Fraunces", serif; font-weight: 700; font-size: 50px; color: #8a6f55; text-align: center; }
      .lab .frac { font-size: 0.8em; }
      .d { width: 84px; height: 84px; display: grid; place-items: center; font-weight: 900; font-size: 80px; line-height: 1; border-radius: 16px; font-variant-numeric: tabular-nums; }
      .d.comma { width: 40px; color: var(--accent); }
      .d.top, .d.bot { color: #fff; }
      #e1-top, #e2-bot { background: var(--green); }
      #e1-bot, #e2-top { background: #b3372b; }
      .step { position: absolute; left: 0; top: 860px; width: 700px; height: 100px; display: flex; align-items: center; gap: 20px; padding: 0 26px; border-radius: 26px; background: #fffdf6; border: 4px solid var(--line); box-shadow: 0 8px 0 rgba(58, 36, 18, 0.12); font-size: 38px; font-weight: 900; white-space: nowrap; }
      .step em { flex: none; display: grid; place-items: center; width: 62px; height: 62px; border-radius: 50%; background: var(--accent); color: #fff; font-family: "Fraunces", serif; font-style: normal; font-size: 38px; }
      .cap { position: absolute; z-index: 40; left: 300px; right: 80px; bottom: 54px; display: flex; justify-content: center; }
      .cap span { display: block; background: var(--ink); color: var(--paper); font-family: "Fraunces", serif; font-weight: 600; font-size: 44px; line-height: 1.28; text-align: center; padding: 20px 44px; border-radius: 28px; }
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
