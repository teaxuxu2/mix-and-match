/* =====================================================
   Mix & Match Calories – Übungs-Bibliothek (Vorschläge für alle)
   =====================================================
   Fertige Übungen aus HYROX, Triathlon, Gym (Geräte & freie Gewichte) und Home-Workout.
   Man tippt sie an → sie landen im Tag und können sofort angepasst werden.
   Eigene Übungen bleiben bei der Person (daten.sport.bloecke).

   Videos: Die Bibliothek kommt OHNE Videos. Ivy (Admin) kann zu jeder Übung ein Video
   "für alle" hochladen – das liegt dann online unter videos/alle/<id> und ein Eintrag
   "g-video-<id>" im Schwarzen Brett (Tabelle gemeinsam) sagt allen Apps, dass es eins gibt.

   Wohnhaus-Bild: das Geräte-Regal im Fitnessraum, das jeder benutzen darf. Ivy klebt
   nach und nach eine Anleitung (Video) an jedes Gerät.

   Felder: wdh = Wiederholungen · kg = Gewicht · m = Meter · zeit = Zeit · text = Notiz
*/

const UEBUNG_KATEGORIEN = ["hyrox", "triathlon", "gym", "geraete", "home", "mobility"];

// Kurzschreibweise: Satz-Vorlagen
function bibSaetze(anzahl, satz) {
    const liste = [];
    for (let i = 0; i < anzahl; i++) {
        liste.push({ wdh: satz.wdh === undefined ? "" : satz.wdh, gewicht: satz.kg === undefined ? "" : satz.kg,
            meter: satz.m === undefined ? "" : satz.m, sek: satz.sek === undefined ? "" : satz.sek, text: satz.text || "" });
    }
    return liste;
}

// [id, kategorie, Deutsch, Englisch, Felder, Anzahl Sätze, Satz-Vorlage, Suchwörter]
const UEBUNG_BIBLIOTHEK_ROH = [
    // ===== HYROX: die 8 Stationen + Laufen =====
    ["hx-run-1k", "hyrox", "HYROX Lauf 1 km", "HYROX Run 1 km", "m zeit", 1, { m: 1000 }, "laufen running"],
    ["hx-skierg", "hyrox", "SkiErg 1000 m", "SkiErg 1000 m", "m zeit", 1, { m: 1000 }, "ski erg"],
    ["hx-sled-push", "hyrox", "Sled Push (Schlitten schieben)", "Sled Push", "m kg", 1, { m: 50 }, "schlitten push"],
    ["hx-sled-pull", "hyrox", "Sled Pull (Schlitten ziehen)", "Sled Pull", "m kg", 1, { m: 50 }, "schlitten pull seil"],
    ["hx-burpee-broad", "hyrox", "Burpee Broad Jumps", "Burpee Broad Jumps", "m zeit", 1, { m: 80 }, "burpee weitsprung"],
    ["hx-row", "hyrox", "Rudern 1000 m (RowErg)", "Rowing 1000 m (RowErg)", "m zeit", 1, { m: 1000 }, "rower ruderergometer concept2"],
    ["hx-farmers", "hyrox", "Farmers Carry", "Farmers Carry", "m kg", 1, { m: 200 }, "kettlebell tragen"],
    ["hx-sandbag-lunges", "hyrox", "Sandbag Lunges", "Sandbag Lunges", "m kg", 1, { m: 100 }, "ausfallschritte sandsack"],
    ["hx-wall-balls", "hyrox", "Wall Balls", "Wall Balls", "wdh kg", 1, { wdh: 100 }, "medizinball wallball"],
    ["hx-roxzone", "hyrox", "Roxzone-Übergänge üben", "Roxzone Transitions", "zeit text", 1, {}, "transition wechsel"],
    ["hx-compromised-run", "hyrox", "Compromised Running (Lauf nach Station)", "Compromised Running", "m zeit text", 4, { m: 1000 }, "laufen nach station"],
    ["hx-sled-push-heavy", "hyrox", "Sled Push schwer (Kraft)", "Heavy Sled Push", "m kg", 5, { m: 10 }, "schlitten"],
    ["hx-wall-balls-emom", "hyrox", "Wall Balls EMOM", "Wall Balls EMOM", "wdh kg zeit", 10, { wdh: 15, sek: 60 }, "emom"],
    ["hx-burpees", "hyrox", "Burpees", "Burpees", "wdh zeit", 3, { wdh: 15 }, ""],
    ["hx-kb-swing", "hyrox", "Kettlebell Swings", "Kettlebell Swings", "wdh kg", 4, { wdh: 20 }, "kb swing"],
    ["hx-lunges-walk", "hyrox", "Walking Lunges", "Walking Lunges", "m kg", 3, { m: 50 }, "ausfallschritte gehend"],

    // ===== Triathlon & Ausdauer =====
    ["tri-swim-easy", "triathlon", "Schwimmen locker (Kraul)", "Easy Swim (freestyle)", "m zeit", 1, { m: 1000 }, "kraulen freistil swim"],
    ["tri-swim-intervals", "triathlon", "Schwimm-Intervalle 100 m", "Swim Intervals 100 m", "m zeit text", 8, { m: 100, text: "20 s Pause" }, "intervall schwimmen"],
    ["tri-swim-pull", "triathlon", "Pull Buoy (nur Arme)", "Pull Buoy Swim", "m zeit", 4, { m: 200 }, "pullbuoy arme"],
    ["tri-swim-kick", "triathlon", "Beinschlag mit Brett", "Kick Set with Board", "m zeit", 4, { m: 100 }, "brett beine kick"],
    ["tri-swim-open", "triathlon", "Freiwasser-Schwimmen", "Open Water Swim", "m zeit", 1, { m: 1500 }, "see freiwasser neopren"],
    ["tri-bike-ga1", "triathlon", "Radfahren Grundlage (GA1)", "Endurance Ride (Z2)", "m zeit text", 1, { sek: 3600 }, "rad bike zone 2"],
    ["tri-bike-intervals", "triathlon", "Rad-Intervalle", "Bike Intervals", "zeit text", 5, { sek: 240, text: "hart, 2 min locker" }, "rad bike intervall schwelle"],
    ["tri-bike-indoor", "triathlon", "Rollentraining / Indoor-Cycling", "Indoor Trainer Ride", "zeit text", 1, { sek: 2700 }, "rolle zwift spinning"],
    ["tri-run-easy", "triathlon", "Lauf locker", "Easy Run", "m zeit", 1, { m: 8000 }, "laufen joggen"],
    ["tri-run-long", "triathlon", "Langer Lauf", "Long Run", "m zeit", 1, { m: 15000 }, "laufen long run"],
    ["tri-run-intervals", "triathlon", "Lauf-Intervalle 400 m", "Run Intervals 400 m", "m zeit text", 8, { m: 400, text: "200 m Trabpause" }, "bahn intervall"],
    ["tri-run-tempo", "triathlon", "Tempolauf", "Tempo Run", "m zeit", 1, { m: 5000 }, "schwelle tempo"],
    ["tri-brick", "triathlon", "Koppeltraining Rad → Lauf", "Brick Run (bike → run)", "m zeit text", 2, {}, "koppel brick wechsel"],
    ["tri-t1", "triathlon", "Wechsel üben (T1/T2)", "Transition Practice (T1/T2)", "zeit text", 3, {}, "wechselzone"],

    // ===== Gym: freie Gewichte & Grundübungen =====
    ["gym-squat", "gym", "Kniebeugen (Langhantel)", "Barbell Back Squat", "wdh kg", 4, { wdh: 8 }, "squat beine"],
    ["gym-front-squat", "gym", "Front Squat", "Front Squat", "wdh kg", 4, { wdh: 6 }, "frontkniebeuge"],
    ["gym-deadlift", "gym", "Kreuzheben", "Deadlift", "wdh kg", 4, { wdh: 5 }, "deadlift rücken"],
    ["gym-rdl", "gym", "Rumänisches Kreuzheben", "Romanian Deadlift", "wdh kg", 3, { wdh: 10 }, "rdl beinbeuger"],
    ["gym-bench", "gym", "Bankdrücken", "Bench Press", "wdh kg", 4, { wdh: 8 }, "brust bench"],
    ["gym-incline-db", "gym", "Schrägbankdrücken Kurzhantel", "Incline Dumbbell Press", "wdh kg", 3, { wdh: 10 }, "brust schrägbank"],
    ["gym-ohp", "gym", "Schulterdrücken (Langhantel)", "Overhead Press", "wdh kg", 4, { wdh: 8 }, "military press schulter"],
    ["gym-db-shoulder", "gym", "Schulterdrücken Kurzhantel", "Dumbbell Shoulder Press", "wdh kg", 3, { wdh: 10 }, "schulter"],
    ["gym-lateral", "gym", "Seitheben", "Lateral Raises", "wdh kg", 3, { wdh: 15 }, "schulter seitlich"],
    ["gym-row-bb", "gym", "Langhantelrudern", "Barbell Row", "wdh kg", 4, { wdh: 8 }, "rücken rudern vorgebeugt"],
    ["gym-row-db", "gym", "Kurzhantelrudern einarmig", "One-Arm Dumbbell Row", "wdh kg", 3, { wdh: 10 }, "rücken"],
    ["gym-pullup", "gym", "Klimmzüge", "Pull-ups", "wdh kg", 4, { wdh: 6 }, "pullup rücken"],
    ["gym-chinup", "gym", "Chin-ups (Untergriff)", "Chin-ups", "wdh kg", 3, { wdh: 6 }, "klimmzug untergriff"],
    ["gym-dips", "gym", "Dips", "Dips", "wdh kg", 3, { wdh: 10 }, "trizeps barren"],
    ["gym-hip-thrust", "gym", "Hip Thrust", "Hip Thrust", "wdh kg", 4, { wdh: 10 }, "po glute"],
    ["gym-bulgarian", "gym", "Bulgarian Split Squats", "Bulgarian Split Squats", "wdh kg", 3, { wdh: 10 }, "beine einbeinig"],
    ["gym-lunges-db", "gym", "Ausfallschritte Kurzhantel", "Dumbbell Lunges", "wdh kg", 3, { wdh: 12 }, "lunges"],
    ["gym-goblet", "gym", "Goblet Squat", "Goblet Squat", "wdh kg", 3, { wdh: 12 }, "kniebeuge kettlebell"],
    ["gym-curl", "gym", "Bizepscurls", "Biceps Curls", "wdh kg", 3, { wdh: 12 }, "bizeps curl"],
    ["gym-hammer", "gym", "Hammercurls", "Hammer Curls", "wdh kg", 3, { wdh: 12 }, "bizeps"],
    ["gym-skull", "gym", "French Press / Skull Crusher", "Skull Crushers", "wdh kg", 3, { wdh: 12 }, "trizeps"],
    ["gym-calf", "gym", "Wadenheben", "Calf Raises", "wdh kg", 3, { wdh: 15 }, "waden"],
    ["gym-farmers-db", "gym", "Farmers Walk Kurzhantel", "Dumbbell Farmers Walk", "m kg", 3, { m: 40 }, "tragen"],
    ["gym-kb-clean-press", "gym", "Kettlebell Clean & Press", "Kettlebell Clean & Press", "wdh kg", 3, { wdh: 8 }, "kb"],
    ["gym-thruster", "gym", "Thruster", "Thrusters", "wdh kg", 3, { wdh: 10 }, "crossfit"],
    ["gym-box-jump", "gym", "Box Jumps", "Box Jumps", "wdh", 3, { wdh: 10 }, "sprung kasten"],
    ["gym-hanging-leg", "gym", "Beinheben hängend", "Hanging Leg Raises", "wdh", 3, { wdh: 12 }, "bauch core"],
    ["gym-ab-wheel", "gym", "Ab Wheel / Bauchroller", "Ab Wheel Rollout", "wdh", 3, { wdh: 10 }, "bauch core"],

    // ===== Gym: Geräte =====
    ["ger-leg-press", "geraete", "Beinpresse", "Leg Press", "wdh kg", 4, { wdh: 10 }, "beine maschine"],
    ["ger-leg-ext", "geraete", "Beinstrecker", "Leg Extension", "wdh kg", 3, { wdh: 12 }, "quadrizeps maschine"],
    ["ger-leg-curl", "geraete", "Beinbeuger (liegend/sitzend)", "Leg Curl", "wdh kg", 3, { wdh: 12 }, "hamstrings maschine"],
    ["ger-abductor", "geraete", "Abduktoren-Maschine", "Hip Abduction Machine", "wdh kg", 3, { wdh: 15 }, "abduktor po"],
    ["ger-adductor", "geraete", "Adduktoren-Maschine", "Hip Adduction Machine", "wdh kg", 3, { wdh: 15 }, "adduktor innenschenkel"],
    ["ger-hack-squat", "geraete", "Hackenschmidt / Hack Squat", "Hack Squat", "wdh kg", 4, { wdh: 10 }, "beine maschine"],
    ["ger-smith-squat", "geraete", "Kniebeugen an der Multipresse", "Smith Machine Squat", "wdh kg", 3, { wdh: 10 }, "smith multipresse"],
    ["ger-glute-machine", "geraete", "Glute-Kickback-Maschine", "Glute Kickback Machine", "wdh kg", 3, { wdh: 12 }, "po"],
    ["ger-calf-machine", "geraete", "Wadenmaschine", "Calf Raise Machine", "wdh kg", 3, { wdh: 15 }, "waden"],
    ["ger-lat-pulldown", "geraete", "Latzug", "Lat Pulldown", "wdh kg", 4, { wdh: 10 }, "rücken latziehen"],
    ["ger-seated-row", "geraete", "Rudern am Kabel (sitzend)", "Seated Cable Row", "wdh kg", 4, { wdh: 10 }, "rücken kabelrudern"],
    ["ger-row-machine", "geraete", "Rudermaschine (Brustgestützt)", "Chest-Supported Row Machine", "wdh kg", 3, { wdh: 10 }, "rücken"],
    ["ger-chest-press", "geraete", "Brustpresse", "Chest Press Machine", "wdh kg", 3, { wdh: 10 }, "brust maschine"],
    ["ger-butterfly", "geraete", "Butterfly / Pec Deck", "Pec Deck / Fly Machine", "wdh kg", 3, { wdh: 12 }, "brust fly"],
    ["ger-reverse-fly", "geraete", "Reverse Butterfly", "Reverse Fly Machine", "wdh kg", 3, { wdh: 15 }, "hintere schulter"],
    ["ger-shoulder-press", "geraete", "Schulterpresse", "Shoulder Press Machine", "wdh kg", 3, { wdh: 10 }, "schulter maschine"],
    ["ger-cable-fly", "geraete", "Kabelzug Flys", "Cable Fly", "wdh kg", 3, { wdh: 12 }, "brust kabel"],
    ["ger-triceps-push", "geraete", "Trizepsdrücken am Kabel", "Triceps Pushdown", "wdh kg", 3, { wdh: 12 }, "trizeps kabel"],
    ["ger-cable-curl", "geraete", "Bizepscurl am Kabel", "Cable Curl", "wdh kg", 3, { wdh: 12 }, "bizeps kabel"],
    ["ger-face-pull", "geraete", "Face Pulls", "Face Pulls", "wdh kg", 3, { wdh: 15 }, "schulter kabel"],
    ["ger-cable-kickback", "geraete", "Kickbacks am Kabel (Po)", "Cable Glute Kickback", "wdh kg", 3, { wdh: 12 }, "po kabel"],
    ["ger-crunch-machine", "geraete", "Bauchmaschine / Crunch am Kabel", "Ab Crunch Machine", "wdh kg", 3, { wdh: 15 }, "bauch"],
    ["ger-back-ext", "geraete", "Rückenstrecker (Hyperextension)", "Back Extension", "wdh kg", 3, { wdh: 12 }, "rücken unterer"],
    ["ger-assisted-pullup", "geraete", "Klimmzug-Maschine (unterstützt)", "Assisted Pull-up Machine", "wdh kg", 3, { wdh: 8 }, "klimmzug"],
    ["ger-treadmill", "geraete", "Laufband", "Treadmill", "m zeit", 1, { sek: 1800 }, "laufen indoor"],
    ["ger-incline-walk", "geraete", "Laufband bergauf gehen", "Incline Treadmill Walk", "zeit text", 1, { sek: 1800, text: "12 % · 5 km/h" }, "12 3 30 gehen steigung"],
    ["ger-crosstrainer", "geraete", "Crosstrainer", "Elliptical", "zeit text", 1, { sek: 1800 }, "ellipse"],
    ["ger-stairmaster", "geraete", "Stepper / Stairmaster", "Stairmaster", "zeit text", 1, { sek: 1200 }, "treppen stepper"],
    ["ger-bike", "geraete", "Ergometer / Fahrrad", "Stationary Bike", "zeit text", 1, { sek: 1800 }, "rad indoor"],
    ["ger-assault-bike", "geraete", "Assault Bike / Air Bike", "Assault Bike", "zeit text", 5, { sek: 30, text: "Vollgas" }, "airbike echo bike"],

    // ===== Home-Workout (ohne/mit wenig Equipment) =====
    ["home-pushups", "home", "Liegestütze", "Push-ups", "wdh", 3, { wdh: 12 }, "pushup brust"],
    ["home-knee-pushups", "home", "Liegestütze auf Knien", "Knee Push-ups", "wdh", 3, { wdh: 12 }, "pushup"],
    ["home-air-squat", "home", "Kniebeugen (Körpergewicht)", "Air Squats", "wdh", 3, { wdh: 20 }, "squat"],
    ["home-jump-squat", "home", "Sprungkniebeugen", "Jump Squats", "wdh", 3, { wdh: 12 }, "sprung"],
    ["home-lunges", "home", "Ausfallschritte", "Lunges", "wdh", 3, { wdh: 12 }, "lunges"],
    ["home-glute-bridge", "home", "Glute Bridge / Beckenheben", "Glute Bridge", "wdh", 3, { wdh: 15 }, "po brücke"],
    ["home-plank", "home", "Unterarmstütz / Plank", "Plank", "zeit", 3, { sek: 45 }, "plank core"],
    ["home-side-plank", "home", "Seitstütz", "Side Plank", "zeit text", 2, { sek: 30 }, "core seite"],
    ["home-mountain", "home", "Mountain Climbers", "Mountain Climbers", "zeit", 3, { sek: 40 }, "bergsteiger"],
    ["home-jumping-jacks", "home", "Hampelmann", "Jumping Jacks", "zeit", 3, { sek: 45 }, "jumping jacks"],
    ["home-high-knees", "home", "Kniehebelauf am Platz", "High Knees", "zeit", 3, { sek: 30 }, "skipping"],
    ["home-crunches", "home", "Crunches", "Crunches", "wdh", 3, { wdh: 20 }, "bauch"],
    ["home-leg-raises", "home", "Beinheben liegend", "Lying Leg Raises", "wdh", 3, { wdh: 15 }, "bauch"],
    ["home-russian-twist", "home", "Russian Twists", "Russian Twists", "wdh kg", 3, { wdh: 20 }, "bauch seitlich"],
    ["home-superman", "home", "Superman", "Superman", "wdh", 3, { wdh: 12 }, "rücken"],
    ["home-chair-dips", "home", "Dips am Stuhl", "Chair Dips", "wdh", 3, { wdh: 12 }, "trizeps"],
    ["home-wall-sit", "home", "Wandsitzen", "Wall Sit", "zeit", 3, { sek: 45 }, "beine"],
    ["home-step-ups", "home", "Step-ups (Stuhl/Stufe)", "Step-ups", "wdh kg", 3, { wdh: 12 }, "beine stufe"],
    ["home-band-row", "home", "Rudern mit Widerstandsband", "Resistance Band Row", "wdh", 3, { wdh: 15 }, "band theraband"],
    ["home-band-pull-apart", "home", "Band Pull-Aparts", "Band Pull-Aparts", "wdh", 3, { wdh: 20 }, "band schulter"],
    ["home-db-curl", "home", "Bizepscurls mit Kurzhanteln", "Dumbbell Curls", "wdh kg", 3, { wdh: 12 }, "hanteln bizeps"],
    ["home-kb-swing", "home", "Kettlebell Swings (zuhause)", "Kettlebell Swings (home)", "wdh kg", 3, { wdh: 20 }, "kb"],
    ["home-skipping", "home", "Seilspringen", "Jump Rope", "zeit", 5, { sek: 60 }, "springseil"],
    ["home-hiit", "home", "HIIT-Runde (Tabata)", "HIIT Round (Tabata)", "zeit text", 8, { sek: 20, text: "10 s Pause" }, "tabata intervall"],
    ["home-walk", "home", "Spaziergang", "Walk", "m zeit", 1, { m: 5000 }, "gehen schritte"],

    // ===== Mobility & Dehnen =====
    ["mob-yoga", "mobility", "Yoga", "Yoga", "zeit text", 1, { sek: 1800 }, "flow"],
    ["mob-stretch", "mobility", "Dehnen Ganzkörper", "Full-Body Stretch", "zeit", 1, { sek: 900 }, "stretching"],
    ["mob-foam", "mobility", "Faszienrolle", "Foam Rolling", "zeit text", 1, { sek: 600 }, "blackroll foam roller"],
    ["mob-hip", "mobility", "Hüftmobilität", "Hip Mobility", "zeit text", 1, { sek: 600 }, "hüfte"],
    ["mob-shoulder", "mobility", "Schultermobilität", "Shoulder Mobility", "zeit text", 1, { sek: 600 }, "schulter"]
];

const UEBUNG_BIBLIOTHEK = UEBUNG_BIBLIOTHEK_ROH.map(function (z) {
    return { id: z[0], kat: z[1], de: z[2], en: z[3], felder: z[4].split(" "), saetze: bibSaetze(z[5], z[6]), stichworte: z[7] || "" };
});
const UEBUNG_BIBLIOTHEK_NACH_ID = {};
UEBUNG_BIBLIOTHEK.forEach(function (u) { UEBUNG_BIBLIOTHEK_NACH_ID[u.id] = u; });

// Fertige Sessions zum Übernehmen
const SESSION_VORLAGEN = [
    { id: "ses-hyrox-sim", de: "HYROX Simulation (komplett)", en: "HYROX Simulation (full)",
      uebungen: ["hx-run-1k", "hx-skierg", "hx-run-1k", "hx-sled-push", "hx-run-1k", "hx-sled-pull", "hx-run-1k", "hx-burpee-broad",
                 "hx-run-1k", "hx-row", "hx-run-1k", "hx-farmers", "hx-run-1k", "hx-sandbag-lunges", "hx-run-1k", "hx-wall-balls"] },
    { id: "ses-hyrox-half", de: "HYROX halbe Simulation", en: "HYROX Half Simulation",
      uebungen: ["hx-run-1k", "hx-skierg", "hx-run-1k", "hx-sled-push", "hx-run-1k", "hx-row", "hx-run-1k", "hx-wall-balls"] },
    { id: "ses-hyrox-kraft", de: "HYROX Kraft-Stationen", en: "HYROX Strength Stations",
      uebungen: ["hx-sled-push-heavy", "hx-sled-pull", "hx-sandbag-lunges", "hx-farmers", "hx-wall-balls-emom"] },
    { id: "ses-tri-brick", de: "Triathlon Koppeltraining", en: "Triathlon Brick Session",
      uebungen: ["tri-bike-ga1", "tri-brick", "tri-run-easy"] },
    { id: "ses-tri-swim", de: "Schwimm-Technik & Intervalle", en: "Swim Technique & Intervals",
      uebungen: ["tri-swim-easy", "tri-swim-kick", "tri-swim-pull", "tri-swim-intervals"] },
    { id: "ses-gym-unterkoerper", de: "Gym Unterkörper", en: "Gym Lower Body",
      uebungen: ["gym-squat", "gym-rdl", "ger-leg-press", "ger-leg-curl", "gym-hip-thrust", "gym-calf"] },
    { id: "ses-gym-oberkoerper", de: "Gym Oberkörper", en: "Gym Upper Body",
      uebungen: ["gym-bench", "ger-lat-pulldown", "gym-ohp", "ger-seated-row", "gym-lateral", "ger-triceps-push", "gym-curl"] },
    { id: "ses-gym-ganz", de: "Gym Ganzkörper", en: "Gym Full Body",
      uebungen: ["gym-squat", "gym-bench", "gym-row-bb", "gym-ohp", "gym-rdl", "home-plank"] },
    { id: "ses-home-20", de: "Home-Workout 20 Minuten", en: "20-Minute Home Workout",
      uebungen: ["home-jumping-jacks", "home-air-squat", "home-pushups", "home-lunges", "home-mountain", "home-plank", "home-glute-bridge"] },
    { id: "ses-home-core", de: "Core zuhause", en: "Core at Home",
      uebungen: ["home-plank", "home-side-plank", "home-crunches", "home-leg-raises", "home-russian-twist", "home-superman"] }
];

// Name einer Bibliotheks-Übung in der aktuellen Sprache
function bibName(b) {
    return (typeof daten !== "undefined" && daten.einstellungen.sprache === "en") ? b.en : b.de;
}

// Aus einer Bibliotheks-Übung eine echte Übung machen (zum Eintragen)
function bibZuUebung(b) {
    return uebungNormalisieren({ name: bibName(b), felder: b.felder.slice(), saetze: JSON.parse(JSON.stringify(b.saetze)), bibId: b.id });
}

// =====================================================
// Videos für alle (von Ivy hochgeladen)
// =====================================================
// bibId → Pfad im Online-Speicher (kommt aus der Tabelle "gemeinsam", Einträge "g-video-…")
let bibVideos = {};
const BIB_VIDEOS_KELLER = "mmc_bib_videos";
(function () {
    try { bibVideos = JSON.parse(localStorage.getItem(BIB_VIDEOS_KELLER) || "{}") || {}; } catch (e) { bibVideos = {}; }
})();

// Wird von gemeinsam.js mit allen Zeilen aufgerufen
function bibVideosEinbauen(zeilen) {
    const neu = {};
    (zeilen || []).forEach(function (z) {
        const d = z && z.daten;
        if (z && typeof z.id === "string" && z.id.indexOf("g-video-") === 0 && d && d.bibId && d.pfad) neu[d.bibId] = d.pfad;
    });
    bibVideos = neu;
    try { localStorage.setItem(BIB_VIDEOS_KELLER, JSON.stringify(neu)); } catch (e) { /* egal */ }
}

function bibHatVideo(bibId) {
    return !!(bibId && bibVideos[bibId]);
}

// Admin: Video für alle hochladen (Datei/Blob) → Speicher "videos/alle/<bibId>-<zeit>" + Eintrag im Schwarzen Brett
function bibVideoFuerAlle(bibId, blob) {
    if (!istAdmin() || !bibId || !blob) return Promise.reject(new Error("nicht erlaubt"));
    const pfad = "alle/" + bibId + "-" + Date.now();
    return wolke.videoHochladen(pfad, blob).then(function () {
        return wolke.gemeinsamSpeichern("g-video-" + bibId, { typ: "video", bibId: bibId, pfad: pfad });
    }).then(function () {
        bibVideos[bibId] = pfad;
        try { localStorage.setItem(BIB_VIDEOS_KELLER, JSON.stringify(bibVideos)); } catch (e) { /* egal */ }
    });
}

function bibVideoAdresse(bibId) {
    if (!bibHatVideo(bibId) || typeof wolke === "undefined") return Promise.reject(new Error("kein Video"));
    return wolke.videoAdresse(bibVideos[bibId]);
}
