/* =====================================================
   Mix & Match Calories – Spracheingabe (🎤) für ALLE Suchfelder
   =====================================================
   Tippen auf 🎤 → sprechen ("200 Gramm Skyr") → "200 g Skyr" steht in der Suche,
   die Treffer erscheinen wie beim Tippen. Nochmal tippen = Stopp.

   Das iPhone ist hier zickig:
   - Safari meldet das Ende des Zuhörens oft nicht → die App räumt selbst auf
     (fertiger Satz, zweiter Tipp, spätestens nach 12 Sekunden).
   - Als Home-Bildschirm-App gibt Safari das Mikrofon nach dem ersten Mal oft
     nicht mehr frei → der Start bleibt stumm. Dann merkt die App das nach 2,5 s
     und schaltet auf Plan B: 🎤 öffnet die Tastatur, dort das 🎤 (Diktieren)
     von Apple benutzen – das geht immer.
   - Auf dem iPhone wird EIN Zuhörer wiederverwendet (so mag es Safari),
     sonst wird jedes Mal ein neuer gebaut.

   Wohnhaus-Bild: die Gegensprechanlage an jeder Tür. Funktioniert sie mal nicht,
   gibt es die Klingel daneben (Tastatur-Diktat).
*/

const SPRACHE_HOECHSTENS_MS = 12000; // Sicherheitsnetz: nach 12 s wird immer aufgeräumt
const SPRACHE_START_MS = 2500;       // so lange darf der Start dauern, sonst Plan B
let spracheAktiv = null;             // { erkennung, knopf, feld, uhr, waechter }
let spracheIosZuhoerer = null;       // iPhone: ein Zuhörer für alles
let spracheFehlstarts = 0;           // zweimal stumm → nur noch Plan B (Tastatur)

function spracheMoeglich() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

function spracheIstIphone() {
    return /iP(hone|ad|od)/.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function spracheNurTastatur() {
    return spracheFehlstarts >= 2;
}

// Zuhören beenden und ALLES zurücksetzen – ohne auf den Browser zu warten
function spracheStoppen() {
    const aktiv = spracheAktiv;
    if (!aktiv) return;
    spracheAktiv = null;
    clearTimeout(aktiv.uhr);
    clearTimeout(aktiv.waechter);
    const e = aktiv.erkennung;
    e.onstart = e.onaudiostart = e.onresult = e.onerror = e.onend = null;
    try { e.abort(); } catch (f) { /* schon zu – egal */ }
    aktiv.knopf.classList.remove("hoert");
    aktiv.knopf.setAttribute("aria-pressed", "false");
}

// Plan B: Tastatur öffnen, dort das 🎤 von Apple/Google nehmen
function spracheTastatur(feld) {
    try { feld.focus(); } catch (e) { /* egal */ }
    zeigeMeldung(t("mikroTastatur"));
}

// Gesprochenes für die Suche aufbereiten: "200 Gramm Skyr." → "200 g Skyr"
function spracheText(text) {
    return text
        .replace(/\b(gramm|grams?)\b/gi, "g")
        .replace(/\bstück\b/gi, "Stk")
        .replace(/[.!?]+$/, "")
        .trim();
}

function spracheZuhoererHolen(Erkennung) {
    if (!spracheIstIphone()) return new Erkennung();
    if (!spracheIosZuhoerer) spracheIosZuhoerer = new Erkennung();
    return spracheIosZuhoerer;
}

// Startet die Spracheingabe für ein Eingabefeld
function spracheStarten(feld, knopf) {
    if (spracheAktiv) {
        // Schon fertig gesprochen (wartet nur aufs Aufräumen)? Dann ist der Tipp ein neuer Start.
        const warGleich = spracheAktiv.knopf === knopf && !spracheAktiv.fertig;
        spracheStoppen();
        if (warGleich) return; // zweiter Tipp auf dasselbe 🎤 = Stopp
    }
    const Erkennung = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Erkennung || spracheNurTastatur()) { spracheTastatur(feld); return; }

    const erkennung = spracheZuhoererHolen(Erkennung);
    const englisch = typeof daten !== "undefined" && daten.einstellungen && daten.einstellungen.sprache === "en";
    erkennung.lang = englisch ? "en-US" : "de-AT";
    erkennung.interimResults = true;
    erkennung.continuous = false;
    erkennung.maxAlternatives = 1;

    const vorher = feld.value;
    let gehoert = false;
    let laeuft = false; // hat der Browser wirklich angefangen zuzuhören?
    const aktiv = { erkennung: erkennung, knopf: knopf, feld: feld };
    aktiv.uhr = setTimeout(spracheStoppen, SPRACHE_HOECHSTENS_MS);
    aktiv.waechter = setTimeout(function () {
        if (spracheAktiv !== aktiv || laeuft) return;
        // Stummer Start (typisch iPhone-App beim 2. Mal) → Plan B
        spracheFehlstarts++;
        spracheStoppen();
        spracheTastatur(feld);
    }, SPRACHE_START_MS);
    spracheAktiv = aktiv;
    knopf.classList.add("hoert");
    knopf.setAttribute("aria-pressed", "true");

    function istMeins() { return spracheAktiv === aktiv; }

    erkennung.onstart = erkennung.onaudiostart = function () {
        laeuft = true;
        spracheFehlstarts = 0; // klappt wieder
    };
    erkennung.onresult = function (ereignis) {
        if (!istMeins()) return;
        laeuft = true;
        let text = "";
        let fertig = false;
        for (let i = 0; i < ereignis.results.length; i++) {
            text += ereignis.results[i][0].transcript;
            if (ereignis.results[i].isFinal) fertig = true;
        }
        gehoert = true;
        feld.value = spracheText(text);
        feld.dispatchEvent(new Event("input", { bubbles: true }));
        if (fertig) {
            aktiv.fertig = true;
            // Fertiger Satz: höflich beenden (stop gibt das Mikro sauber frei) …
            try { erkennung.stop(); } catch (f) { /* egal */ }
            knopf.classList.remove("hoert");
            knopf.setAttribute("aria-pressed", "false");
            // … und falls Safari kein Ende meldet, nach 1,5 s selbst aufräumen
            clearTimeout(aktiv.uhr);
            aktiv.uhr = setTimeout(function () { if (istMeins()) spracheStoppen(); }, 1500);
        }
    };
    erkennung.onerror = function (ereignis) {
        if (!istMeins()) return;
        const fehler = ereignis && ereignis.error;
        if (!gehoert) feld.value = vorher;
        spracheStoppen();
        if (fehler === "not-allowed") zeigeMeldung(t("mikroVerboten"), true);
        else if (fehler === "no-speech") zeigeMeldung(t("mikroNichtsGehoert"));
        else if (fehler === "service-not-allowed" || fehler === "audio-capture") {
            spracheFehlstarts = 2; // iPhone-App lässt nicht mehr zuhören → Plan B
            spracheTastatur(feld);
        }
        else if (fehler !== "aborted") zeigeMeldung(t("diktierenFehler"), true);
    };
    erkennung.onend = function () {
        if (istMeins() && laeuft) spracheStoppen(); // ohne echten Start räumt der Wächter auf
    };
    try {
        erkennung.start();
    } catch (e) {
        // Wiederverwendeter Zuhörer hängt noch → wegwerfen, beim nächsten Tipp neu
        spracheIosZuhoerer = null;
        spracheFehlstarts++;
        spracheStoppen();
        spracheTastatur(feld); // passiert noch im Tipp → Tastatur geht auf
    }
}

// 🎤-Knopf in jedes Suchfeld (label.suche mit input[type=search]) einbauen
function spracheKnoepfeEinbauen() {
    if (!spracheMoeglich()) return; // Browser ohne Spracherkennung: das 🎤 der Tastatur bleibt
    document.querySelectorAll("label.suche").forEach(function (label) {
        const feld = label.querySelector('input[type="search"]');
        if (!feld) return;
        let knopf = label.querySelector(".suche-mikro");
        if (!knopf) {
            knopf = document.createElement("button");
            knopf.type = "button";
            knopf.className = "suche-mikro";
            knopf.setAttribute("data-t-aria", "diktieren");
            knopf.setAttribute("data-t-title", "diktieren");
            knopf.setAttribute("aria-label", t("diktieren"));
            knopf.title = t("diktieren");
            knopf.textContent = "🎤";
            // vor den Scan-Knopf, sonst ans Ende
            const scan = label.querySelector(".suche-scan");
            if (scan) label.insertBefore(knopf, scan); else label.appendChild(knopf);
        }
        if (knopf.dataset.verbunden) return;
        knopf.dataset.verbunden = "1";
        knopf.hidden = false;
        knopf.setAttribute("aria-pressed", "false");
        knopf.addEventListener("click", function (e) {
            e.preventDefault(); // Knopf sitzt im Label – sonst springt nur der Cursor ins Feld
            spracheStarten(feld, knopf);
        });
    });
    // Fenster zu oder App im Hintergrund → Zuhören beenden
    document.querySelectorAll("dialog").forEach(function (fenster) {
        fenster.addEventListener("close", spracheStoppen);
    });
    document.addEventListener("visibilitychange", function () { if (document.hidden) spracheStoppen(); });
}
