// Erzeugt index.html (Hyperframes-Komposition „Die siebzehn Kamele“) aus der Szenenliste.
// Aufruf:  node build.mjs   → danach  npm run render
import { writeFileSync } from "node:fs";

const FADE = 0.6;
const TAIL = 0.7;
const F = (z, n) => `<span class="frac"><span>${z}</span><span>${n}</span></span>`;

// audio = Länge der Sprachaufnahme; caps/badges = Startzeit relativ zur Aufnahme
const scenes = [
  { id: 1, audio: 4.05, kb: { from: [1.0, 0, 0], to: [1.08, -30, 0] }, caps: [], badges: [] },
  {
    id: 2, audio: 11.96, kb: { from: [1.1, 30, 0], to: [1.0, 0, 0] },
    caps: [
      [0, "Vor langer Zeit lebte in der Wüste ein alter Kamelhändler."],
      [4.1, "Als er starb, hinterließ er seinen drei Kindern siebzehn Kamele – und ein rätselhaftes Testament."],
    ],
    badges: [[6.6, "17 Kamele", "right:70px;top:60px"]],
  },
  {
    id: 3, audio: 11.39, kb: { from: [1.0, 0, 0], to: [1.08, 0, -20] },
    caps: [
      [0, "Darin stand: Amira, die Älteste, bekommt die Hälfte der Kamele."],
      [5.65, "Karim bekommt ein Drittel."],
      [7.85, "Und Leila, die Jüngste, bekommt ein Neuntel."],
    ],
    badges: [
      [3.5, `Amira ${F(1, 2)}`, "left:60px;top:60px"],
      [6.4, `Karim ${F(1, 3)}`, "left:420px;top:60px"],
      [9.9, `Leila ${F(1, 9)}`, "left:780px;top:60px"],
    ],
  },
  {
    id: 4, audio: 13.0, kb: { from: [1.08, -20, 0], to: [1.0, 0, 0] },
    caps: [
      [0, "Die drei rechneten und rechneten."],
      [2.8, "Die Hälfte von siebzehn? Das wären achteinhalb Kamele!"],
      [7.4, "„Wir können doch kein Kamel zerteilen!“, rief Karim."],
      [11.05, "Bald stritten sie laut."],
    ],
    badges: [[4.9, "17 : 2 = 8,5 ?", "left:60px;top:60px"]],
  },
  {
    id: 5, audio: 12.28, kb: { from: [1.0, 0, 0], to: [1.1, -50, -10] },
    caps: [
      [0, "Da kam eine weise alte Frau auf ihrem Kamel vorbeigeritten."],
      [4.2, "Sie hörte sich alles an, lächelte und sagte:"],
      [8.1, "„Ich leihe euch mein Kamel. Dann sind es achtzehn.“"],
    ],
    badges: [[10.2, "17 + 1 = 18", "left:60px;top:60px"]],
  },
  {
    id: 6, audio: 13.0, kb: { from: [1.0, 0, 0], to: [1.05, 0, -10] },
    caps: [
      [0, "Nun ging alles auf:"],
      [1.75, "Amira bekam die Hälfte von achtzehn – neun Kamele."],
      [6.1, "Karim bekam ein Drittel – sechs Kamele."],
      [9.45, "Und Leila bekam ein Neuntel – zwei Kamele."],
    ],
    badges: [
      [4.5, `${F(1, 2)} von 18 = 9`, "left:60px;top:60px"],
      [8.0, `${F(1, 3)} von 18 = 6`, "left:700px;top:60px"],
      [11.6, `${F(1, 9)} von 18 = 2`, "left:1340px;top:60px"],
    ],
  },
  {
    id: 7, audio: 10.76, kb: { from: [1.08, 30, 0], to: [1.0, 0, 0] },
    caps: [
      [0, "Neun plus sechs plus zwei – das sind siebzehn."],
      [3.6, "Ein Kamel blieb übrig!"],
      [5.85, "Die weise Frau stieg wieder auf ihr Kamel, winkte und ritt davon."],
    ],
    badges: [[2.4, "9 + 6 + 2 = 17", "left:60px;top:60px"]],
  },
];
const moral = { audio: 11.96, hold: 4.0 };

const r = (n) => Math.round(n * 100) / 100;
let t = 0;
const html = [];
const anim = [];

for (const s of scenes) {
  s.start = t;
  s.voice = t + FADE;
  s.len = FADE + s.audio + TAIL;
  t += s.len;
}
const moralStart = t;
const total = r(moralStart + FADE + moral.audio + moral.hold);

scenes.forEach((s, i) => {
  const last = i === scenes.length - 1;
  const dur = last ? total - s.start : s.len + FADE;
  html.push(`<div id="s${s.id}" class="clip scene" style="z-index:${i + 1}" data-start="${r(s.start)}" data-duration="${r(dur)}" data-track-index="0"><img id="bg${s.id}" class="bg" src="assets/szene${s.id}.jpg" alt="" /></div>`);
  if (i > 0) anim.push(`tl.fromTo("#s${s.id}", { opacity: 0 }, { opacity: 1, duration: ${FADE}, ease: "power1.inOut" }, ${r(s.start)});`);
  const [fs, fx, fy] = s.kb.from;
  const [ts, tx, ty] = s.kb.to;
  anim.push(`tl.fromTo("#bg${s.id}", { scale: ${fs}, x: ${fx}, y: ${fy} }, { scale: ${ts}, x: ${tx}, y: ${ty}, duration: ${r(dur)}, ease: "none" }, ${r(s.start)});`);
  html.push(`<audio id="a${s.id}" src="assets/szene${s.id}.mp3" data-start="${r(s.voice)}" data-duration="${s.audio}" data-track-index="5" data-volume="1"></audio>`);
});

// Titel
const s1 = scenes[0];
html.push(`<div id="title" class="clip title" data-start="0" data-duration="${r(s1.len)}" data-track-index="1"><div id="title-main" class="title-main">Die siebzehn Kamele</div><div id="title-sub" class="title-sub">Eine Geschichte über Brüche</div></div>`);
anim.push(`tl.fromTo("#title-main", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.9, ease: "power3.out" }, 0.3);`);
anim.push(`tl.fromTo("#title-sub", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" }, 1.4);`);
anim.push(`tl.to("#title", { opacity: 0, duration: 0.5, ease: "power1.in" }, ${r(s1.len - 0.5)});`);

// Rechen-Schildchen und Untertitel
let c = 0;
let b = 0;
for (const s of scenes) {
  const sceneEnd = s.start + s.len;
  s.badges.forEach(([at, text, pos]) => {
    const st = s.voice + at;
    const id = `badge${b++}`;
    html.push(`<div id="${id}" class="clip badge" style="${pos}" data-start="${r(st)}" data-duration="${r(sceneEnd - st)}" data-track-index="2">${text}</div>`);
    anim.push(`tl.fromTo("#${id}", { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.45, ease: "back.out(1.8)" }, ${r(st)});`);
    anim.push(`tl.to("#${id}", { opacity: 0, duration: 0.4, ease: "power1.in" }, ${r(sceneEnd - 0.4)});`);
  });
  s.caps.forEach(([at, text], i) => {
    const st = s.voice + at;
    const en = i + 1 < s.caps.length ? s.voice + s.caps[i + 1][0] : s.voice + s.audio + 0.35;
    const id = `cap${c++}`;
    html.push(`<div id="${id}" class="clip cap" data-start="${r(st)}" data-duration="${r(en - st)}" data-track-index="3"><span>${text}</span></div>`);
    anim.push(`tl.fromTo("#${id}", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" }, ${r(st)});`);
    anim.push(`tl.to("#${id}", { opacity: 0, duration: 0.25, ease: "power1.in" }, ${r(en - 0.25)});`);
  });
}

// Auflösung
const mv = moralStart + FADE;
html.push(`<div id="moral" class="clip moral" data-start="${r(moralStart)}" data-duration="${r(total - moralStart)}" data-track-index="4"><div class="moral-card"><div id="m-kicker" class="moral-kicker">Das Geheimnis</div><div class="moral-eq"><span id="m-1">${F(1, 2)} + ${F(1, 3)} + ${F(1, 9)}</span><span id="m-2"> = ${F(9, 18)} + ${F(6, 18)} + ${F(2, 18)}</span><span id="m-3" class="moral-strong"> = ${F(17, 18)}</span></div><div id="m-4" class="moral-note">Ein Achtzehntel fehlt zum Ganzen – genau das geliehene Kamel!</div></div></div>`);
html.push(`<audio id="a8" src="assets/szene8.mp3" data-start="${r(mv)}" data-duration="${moral.audio}" data-track-index="5" data-volume="1"></audio>`);
anim.push(`tl.fromTo("#moral", { opacity: 0 }, { opacity: 1, duration: ${FADE}, ease: "power1.inOut" }, ${r(moralStart)});`);
anim.push(`tl.fromTo("#m-kicker", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, ${r(mv + 0.2)});`);
anim.push(`tl.fromTo("#m-1", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }, ${r(mv + 4.5)});`);
anim.push(`tl.fromTo("#m-2", { opacity: 0 }, { opacity: 1, duration: 0.6, ease: "power3.out" }, ${r(mv + 7.6)});`);
anim.push(`tl.fromTo("#m-3", { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: 0.7, ease: "back.out(1.6)" }, ${r(mv + 9.6)});`);
anim.push(`tl.fromTo("#m-4", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" }, ${r(mv + moral.audio + 0.3)});`);

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
      :root { --paper: #fff6e0; --ink: #3a2412; --accent: #c2541b; }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: 1920px; height: 1080px; overflow: hidden; background: #1c120a; }
      #root { position: relative; width: 1920px; height: 1080px; overflow: hidden; font-family: "Nunito", sans-serif; }
      .scene { position: absolute; inset: 0; overflow: hidden; }
      .bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
      .frac { display: inline-flex; flex-direction: column; align-items: center; vertical-align: middle; line-height: 1; margin: 0 0.12em; font-variant-numeric: tabular-nums; }
      .frac span:first-child { border-bottom: 0.08em solid currentColor; padding: 0 0.14em 0.06em; }
      .frac span:last-child { padding: 0.06em 0.14em 0; }
      .title { position: absolute; z-index: 20; left: 0; right: 0; top: 90px; text-align: center; color: var(--ink); }
      .title-main { font-family: "Fraunces", serif; font-weight: 800; font-size: 150px; line-height: 1.04; letter-spacing: -0.02em; color: var(--paper); text-shadow: 0 6px 0 rgba(58, 36, 18, 0.55), 0 14px 40px rgba(58, 36, 18, 0.5); }
      .title-sub { margin-top: 34px; display: inline-block; font-size: 46px; font-weight: 800; color: var(--ink); background: var(--paper); padding: 12px 36px; border-radius: 999px; }
      .badge { position: absolute; z-index: 30; display: flex; align-items: center; font-size: 56px; font-weight: 900; color: var(--paper); background: var(--accent); padding: 16px 40px; border-radius: 28px; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35); white-space: nowrap; }
      .badge .frac { font-size: 0.8em; margin: 0 0.3em; }
      .cap { position: absolute; z-index: 40; left: 160px; right: 160px; bottom: 64px; display: flex; justify-content: center; }
      .cap span { display: block; max-width: 1600px; background: rgba(255, 246, 224, 0.95); color: var(--ink); font-family: "Fraunces", serif; font-weight: 600; font-size: 52px; line-height: 1.28; text-align: center; padding: 26px 52px; border-radius: 32px; box-shadow: 0 12px 40px rgba(0, 0, 0, 0.35); }
      .moral { position: absolute; z-index: 50; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(40, 20, 8, 0.62); }
      .moral-card { width: 1640px; background: var(--paper); border-radius: 48px; padding: 70px 70px 80px; text-align: center; box-shadow: 0 30px 90px rgba(0, 0, 0, 0.5); color: var(--ink); }
      .moral-kicker { display: inline-block; font-size: 40px; font-weight: 900; color: var(--paper); background: var(--accent); padding: 12px 36px; border-radius: 999px; margin-bottom: 60px; }
      .moral-eq { font-family: "Fraunces", serif; font-weight: 700; font-size: 92px; white-space: nowrap; }
      .moral-eq > span { display: inline-block; }
      .moral-strong { color: var(--accent); font-weight: 900; }
      .moral-note { margin-top: 60px; font-size: 50px; font-weight: 800; }
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
