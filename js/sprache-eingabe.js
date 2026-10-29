/* =====================================================
   Mix & Match Calories – Spracheingabe (🎤) für ALLE Suchfelder
   =====================================================
   Tippen auf 🎤 → sprechen ("200 Gramm Skyr") → "200 g Skyr" steht in der Suche,
   die Treffer erscheinen wie beim Tippen. Nochmal tippen = Stopp.

   Warum es früher nur beim ersten Mal ging: Safari am iPhone meldet das Ende des
   Zuhörens oft gar nicht. Die App dachte dann, es läuft noch, und der nächste Tipp
   hat nur "gestoppt" statt neu gestartet. Jetzt räumt die App selbst auf:
   - sobald ein fertiger Satz da ist,
   - beim zweiten Tipp,
   - spätestens nach 12 Sekunden.
   Und jedes Mal wird ein NEUER Zuhörer gebaut.

   Wohnhaus-Bild: die Gegensprechanlage an jeder Tür. Knopf drücken, sprechen,
   und danach legt die Anlage selbst wieder auf – auch wenn draußen keiner "Tschüss" sagt.
*/

const SPRACHE_HOECHSTENS_MS = 12000; // Sicherheitsnetz: nach 12 s wird immer aufgeräumt
let spracheAktiv = null;             // { erkennung, knopf, uhr } – höchstens ein Zuhörer

function spracheMoeglich() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

// Zuhören beenden und ALLES zurücksetzen – ohne auf den Browser zu warten
function spracheStoppen() {
    const aktiv = spracheAktiv;
    if (!aktiv) return;
    spracheAktiv = null;
    clearTimeout(aktiv.uhr);
    aktiv.erkennung.onresult = aktiv.erkennung.onerror = aktiv.erkennung.onend = null;
    try { aktiv.erkennung.abort(); } catch (e) { /* schon zu – egal */ }
    aktiv.knopf.classList.remove("hoert");
    aktiv.knopf.setAttribute("aria-pressed", "false");
}

// Gesprochenes für die Suche aufbereiten: "200 Gramm Skyr." → "200 g Skyr"
function spracheText(text) {
    return text
        .replace(/\b(gramm|grams?)\b/gi, "g")
        .replace(/\bstück\b/gi, "Stk")
        .replace(/[.!?]+$/, "")
        .trim();
}

// Startet die Spracheingabe für ein Eingabefeld
function spracheStarten(feld, knopf) {
    if (spracheAktiv) {
        const warGleich = spracheAktiv.knopf === knopf;
        spracheStoppen();
        if (warGleich) return; // zweiter Tipp auf dasselbe 🎤 = Stopp
    }
    const Erkennung = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Erkennung) return;

    const erkennung = new Erkennung(); // immer frisch – nie wiederverwenden
    const englisch = typeof daten !== "undefined" && daten.einstellungen && daten.einstellungen.sprache === "en";
    erkennung.lang = englisch ? "en-US" : "de-AT";
    erkennung.interimResults = true;
    erkennung.continuous = false;
    erkennung.maxAlternatives = 1;

    const vorher = feld.value;
    let gehoert = false;
    spracheAktiv = { erkennung: erkennung, knopf: knopf, uhr: setTimeout(spracheStoppen, SPRACHE_HOECHSTENS_MS) };
    knopf.classList.add("hoert");
    knopf.setAttribute("aria-pressed", "true");

    erkennung.onresult = function (ereignis) {
        let text = "";
        let fertig = false;
        for (let i = 0; i < ereignis.results.length; i++) {
            text += ereignis.results[i][0].transcript;
            if (ereignis.results[i].isFinal) fertig = true;
        }
        gehoert = true;
        feld.value = spracheText(text);
        feld.dispatchEvent(new Event("input", { bubbles: true }));
        // Fertiger Satz → selbst aufräumen (Safari sagt oft nicht Bescheid)
        if (fertig && spracheAktiv && spracheAktiv.erkennung === erkennung) spracheStoppen();
    };
    erkennung.onerror = function (ereignis) {
        const fehler = ereignis && ereignis.error;
        if (fehler === "not-allowed" || fehler === "service-not-allowed") zeigeMeldung(t("mikroVerboten"), true);
        else if (fehler === "no-speech") zeigeMeldung(t("mikroNichtsGehoert"));
        else if (fehler !== "aborted") zeigeMeldung(t("diktierenFehler"), true);
        if (!gehoert) feld.value = vorher;
        if (spracheAktiv && spracheAktiv.erkennung === erkennung) spracheStoppen();
    };
    erkennung.onend = function () {
        if (spracheAktiv && spracheAktiv.erkennung === erkennung) spracheStoppen();
    };
    try {
        erkennung.start();
    } catch (e) {
        spracheStoppen();
        zeigeMeldung(t("diktierenFehler"), true);
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
