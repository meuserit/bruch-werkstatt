# Bruch-Werkstatt

Interaktive Lern-WebApp für die **6. Klasse** (Mathematik, NRW, 1. Halbjahr) zum Thema **Brüche und Dezimalzahlen** – Version **1.1.0**

Die App führt in neun kurzen Stationen durch das Thema. Lehrer-Eule **Herr Uhu** erklärt, lobt und ermutigt.

| Station | Inhalt | Übung |
|---|---|---|
| 1 · Brüche verstehen | Anteil, Zähler, Nenner, Brüche lesen | Anteile in einem Streifen färben |
| 2 · Erweitern und Kürzen | Gleichwertige Brüche | 3 Auswahlaufgaben |
| 3 · Brüche vergleichen | Gleichnamig machen, Zahlenstrahl | <, > oder = einsetzen |
| 4 · Dezimalzahlen | Stellenwerttafel, Bruch ↔ Dezimalzahl, Runden | Brüche und Dezimalzahlen zuordnen, 2 Aufgaben |
| 5 · Dezimalzahlen vergleichen | Stelle für Stelle, typische Fallen (0,5 > 0,45; 0,3 = 0,30) | Zahlen der Größe nach ordnen, <, > oder = einsetzen |
| 6 · Plus und Minus | Addieren und Subtrahieren von Brüchen und Dezimalzahlen | **Erklärvideo** „Brüche addieren“ (49 s), 5 Aufgaben |
| 7 · Schriftlich dividieren | Teilen – Malnehmen – Abziehen – Herunterholen, Komma im Ergebnis, Bruch als Division | **Erklärvideo** „13 : 4 = 3,25“ (56 s), geführte Rechnung 87 : 4, 4 Aufgaben |
| 8 · Der Film | **„Die siebzehn Kamele“** – eine alte Rätselgeschichte (102 s) | Warum bleibt ein Kamel übrig? |
| 9 · Das Quiz | 14 Fragen in zufälliger Reihenfolge | Rückmeldung von Herrn Uhu, Ergebnis mit Sternen, zum Abschluss das Lied „Bruchstark“ mit Text zum Mitsingen |

Multiplizieren und Dividieren von Brüchen (meist 2. Halbjahr) sind bewusst nicht enthalten; dividiert wird durch natürliche Zahlen.

## Starten

Die App besteht nur aus statischen Dateien – kein Build, kein Server-Code, keine externen Abrufe.

- **Lokal:** `index.html` im Browser öffnen oder im Ordner `python3 -m http.server` starten.
- **GitHub Pages:** Settings → Pages → Branch `main`, Ordner `/ (root)`.

Der Lernfortschritt wird nur im Browser des Geräts gespeichert (`localStorage`); es werden keine Daten übertragen.

## Aufbau des Repos

```
index.html            Seite mit allen Stationen
css/style.css         Grundgestaltung (wie Fabel-Werkstatt)
css/mathe.css         Brüche, Streifen, Stellenwerttafel, Aufgaben
js/app.js             Übungen, Quiz, Fortschritt (Versionsnummer: VERSION)
assets/img            Illustrationen (Szenen, Herr Uhu)
assets/video          Fertig gerenderte Videos
assets/audio          Lied „Bruchstark“
assets/fonts          Schriften Fraunces und Nunito
film/                 Quelle des Films (Hyperframes-Komposition)
erklaervideo/         Quelle des Erklärvideos „Brüche addieren“ (Hyperframes)
divisionsvideo/       Quelle des Erklärvideos „Schriftlich dividieren“ (Hyperframes)
```

Brüche schreibt man in den Texten als `{3/4}`; die App macht daraus einen echten Bruch mit Bruchstrich.

## Die Videos ändern (Hyperframes)

Alle drei Videos sind [Hyperframes](https://hyperframes.heygen.com)-Kompositionen: HTML + GSAP, gerendert zu MP4.
Texte und Zeiten stehen jeweils in `build.mjs`; daraus entsteht `index.html`.

```bash
cd film            # oder: cd erklaervideo / cd divisionsvideo
npm run dev        # Vorschau im Browser
npm run render     # erzeugt out/video.mp4 (1920×1080)
# fürs Web verkleinern:
ffmpeg -i out/video.mp4 -vf scale=1280:720 -c:v libx264 -preset slow -crf 24 -pix_fmt yuv420p \
  -c:a aac -b:a 128k -movflags +faststart ../assets/video/die-siebzehn-kamele.mp4
```

Voraussetzungen: Node.js 22+, FFmpeg, Chrome.

## Quellen und Lizenzen

- „Die siebzehn Kamele“: frei nacherzählte, überlieferte Rätselgeschichte (gemeinfrei).
- Illustrationen und Sprecherstimme: KI-generiert mit Higgsfield (Bilder: GPT Image, Stimme: ElevenLabs).
- Lied „Bruchstark“: Text eigens für die App geschrieben, Musik und Gesang KI-generiert mit Suno.
- Schriften: Fraunces und Nunito (SIL Open Font License 1.1).
- Animation: GSAP (jeweils im Ordner `vendor` der drei Video-Projekte, Standard-Lizenz von GSAP).

## Versionen

- **1.1.0** – Lied „Bruchstark“ als Abschluss nach dem Quiz, mit Text zum Mitsingen.

- **1.0.0** – Erste Fassung: neun Stationen, Erklärvideos „Brüche addieren“ und „Schriftlich dividieren“, Film „Die siebzehn Kamele“, Abschlussquiz mit Herrn Uhu.
