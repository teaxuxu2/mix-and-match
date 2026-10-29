/* =====================================================
   Mix & Match Calories – Barcode-Scanner
   =====================================================
   Kamera auf den Strichcode halten → die App liest die Zahlen
   → schaut zuerst in der eigenen Liste nach, sonst bei Open Food Facts
   → ein Tippen übernimmt das Produkt.

   Wohnhaus-Bild: Der Scanner ist der Portier mit Lesegerät. Er liest das
   Etikett am Paket (den Strichcode). Kennt er das Paket schon (es liegt im
   Keller), gibt er es dir sofort. Sonst ruft er den Lieferdienst (Online-Suche).

   Wie liest der Browser den Code?
   - Chrome (Android, Mac, Windows): eingebauter "BarcodeDetector" – schnell, ohne Zusatz
   - Safari (iPhone/iPad): kennt den nicht → wir laden einmal die freie Bibliothek ZXing nach
   - Ohne Kamera: Zahlen einfach eintippen
*/

const ZXING_ADRESSE = "https://cdn.jsdelivr.net/npm/@zxing/library@0.21.3/umd/index.min.js";
const BARCODE_FORMATE = ["ean_13", "ean_8", "upc_a", "upc_e"];

let scanZiel = null;      // was passiert mit dem gefundenen Lebensmittel
let scanStrom = null;     // Kamera-Bild (MediaStream)
let scanSchleife = null;  // Timer für den eingebauten Detector
let scanZxing = null;     // ZXing-Leser (Safari)
let scanFertig = false;   // schon etwas erkannt? Dann nicht doppelt auslösen

// Öffnet den Scanner. beimUebernehmen(lm) bekommt das gewählte Lebensmittel.
function oeffneScanner(beimUebernehmen) {
    scanZiel = beimUebernehmen;
    scanFertig = false;
    $("scanEingabe").value = "";
    $("scanErgebnis").innerHTML = "";
    $("scanFehler").textContent = "";
    oeffneFenster("dialogScan");
    kameraStarten();
}

function schliesseScanner() {
    kameraStoppen();
    if ($("dialogScan").open) schliesseFenster("dialogScan");
}

// ---------- Kamera ----------
function kameraStarten() {
    const video = $("scanVideo");
    const box = $("scanKamera");
    box.classList.remove("aus");
    setzeScanStatus(t("scanStartet"));

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        kameraNichtMoeglich(t("scanKeineKamera"));
        return;
    }
    navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false })
        .then(function (strom) {
            if (!$("dialogScan").open) { strom.getTracks().forEach(function (s) { s.stop(); }); return; }
            scanStrom = strom;
            video.srcObject = strom;
            video.setAttribute("playsinline", "");
            video.muted = true;
            return video.play().then(function () {
                setzeScanStatus(t("scanHalten"));
                return erkennerStarten(video);
            });
        })
        .catch(function (fehler) {
            const verweigert = fehler && (fehler.name === "NotAllowedError" || fehler.name === "SecurityError");
            kameraNichtMoeglich(verweigert ? t("scanVerweigert") : t("scanKeineKamera"));
        });
}

function kameraNichtMoeglich(text) {
    kameraStoppen();
    $("scanKamera").classList.add("aus");
    setzeScanStatus(text);
    $("scanEingabe").focus();
}

function kameraStoppen() {
    if (scanSchleife) { clearTimeout(scanSchleife); scanSchleife = null; }
    if (scanZxing) { try { scanZxing.reset(); } catch (e) { /* egal */ } scanZxing = null; }
    if (scanStrom) { scanStrom.getTracks().forEach(function (spur) { spur.stop(); }); scanStrom = null; }
    const video = $("scanVideo");
    if (video) video.srcObject = null;
}

function setzeScanStatus(text) {
    $("scanStatus").textContent = text;
}

// ---------- Strichcode erkennen ----------
function erkennerStarten(video) {
    if ("BarcodeDetector" in window) {
        let detector;
        try { detector = new window.BarcodeDetector({ formats: BARCODE_FORMATE }); }
        catch (e) { detector = null; }
        if (detector) {
            const pruefen = function () {
                if (!scanStrom || scanFertig) return;
                detector.detect(video).then(function (codes) {
                    if (codes.length && codes[0].rawValue) codeErkannt(codes[0].rawValue);
                    else scanSchleife = setTimeout(pruefen, 250);
                }).catch(function () { scanSchleife = setTimeout(pruefen, 500); });
            };
            pruefen();
            return;
        }
    }
    // Kein eingebauter Detector (z. B. iPhone) → ZXing nachladen
    return zxingLaden().then(function () {
        if (!scanStrom || !window.ZXing) throw new Error("kein ZXing");
        const hinweise = new Map();
        hinweise.set(ZXing.DecodeHintType.POSSIBLE_FORMATS, [
            ZXing.BarcodeFormat.EAN_13, ZXing.BarcodeFormat.EAN_8, ZXing.BarcodeFormat.UPC_A, ZXing.BarcodeFormat.UPC_E]);
        scanZxing = new ZXing.BrowserMultiFormatReader(hinweise);
        // Der Leser nimmt das laufende Kamerabild und meldet jeden erkannten Code
        scanZxing.decodeFromStream(scanStrom, video, function (ergebnis) {
            if (ergebnis && !scanFertig) codeErkannt(ergebnis.getText());
        });
    }).catch(function () {
        kameraNichtMoeglich(t("scanNichtUnterstuetzt"));
    });
}

function zxingLaden() {
    if (window.ZXing) return Promise.resolve();
    return new Promise(function (fertig, fehler) {
        const skript = document.createElement("script");
        skript.src = ZXING_ADRESSE;
        skript.onload = fertig;
        skript.onerror = fehler;
        document.head.appendChild(skript);
    });
}

// ---------- Code gefunden (gescannt oder eingetippt) ----------
function codeErkannt(code) {
    code = String(code).replace(/\D/g, "");
    if (!/^\d{8,14}$/.test(code)) {
        $("scanFehler").textContent = t("scanFalscheZahl");
        return;
    }
    scanFertig = true;
    if (navigator.vibrate) { try { navigator.vibrate(60); } catch (e) { /* egal */ } }
    kameraStoppen();
    $("scanKamera").classList.add("aus");
    $("scanEingabe").value = code;
    $("scanFehler").textContent = "";
    const ergebnis = $("scanErgebnis");
    ergebnis.innerHTML = "";

    // 1. Schon in der eigenen Liste? (klappt auch ohne Internet)
    const vorhanden = daten.lebensmittel.find(function (lm) {
        return lm.id === "off-" + code || lm.quelle === "openfoodfacts:" + code;
    });
    if (vorhanden) {
        setzeScanStatus(t("scanGefunden"));
        ergebnis.appendChild(scanVorhandenZeile(vorhanden));
        return;
    }

    // 2. Online bei Open Food Facts nachschauen
    setzeScanStatus(t("scanSucht", { code: code }));
    onlineSuchen(code).then(function (produkte) {
        ergebnis.innerHTML = "";
        if (produkte.length === 0) {
            setzeScanStatus(t("scanUnbekannt", { code: code }));
            ergebnis.appendChild(scanSelbstAnlegenKnopf());
            return;
        }
        setzeScanStatus(t("scanGefunden"));
        ergebnis.appendChild(el("p", "online-quelle", t("onlineQuelle")));
        ergebnis.appendChild(onlineTrefferZeile(produkte[0], scanUebernehmen));
    }).catch(function () {
        setzeScanStatus(t(navigator.onLine === false ? "onlineOffline" : "onlineFehler"));
        ergebnis.appendChild(scanSelbstAnlegenKnopf());
    });
}

function scanVorhandenZeile(lm) {
    const zeile = el("button", "lm-karte online-treffer");
    zeile.type = "button";
    zeile.appendChild(bildElement(lm, "klein"));
    const info = el("div", "lm-info");
    info.appendChild(el("div", "lm-name", anzeigeName(lm)));
    if (lm.marke) info.appendChild(el("div", "lm-bezug", lm.marke));
    info.appendChild(el("div", "lm-werte", werteText(lm)));
    zeile.appendChild(info);
    zeile.appendChild(el("span", "knopf-icon klein", "＋"));
    zeile.addEventListener("click", function () { scanUebernehmen(lm); });
    return zeile;
}

function scanSelbstAnlegenKnopf() {
    const knopf = el("button", "knopf-primaer", t("scanSelbstAnlegen"));
    knopf.type = "button";
    knopf.addEventListener("click", function () {
        const ziel = scanZiel;
        schliesseScanner();
        // Nach dem Anlegen geht es genauso weiter wie nach einem Scan
        nachFormularSpeichern = function (neuesLm) { if (ziel) ziel(neuesLm); };
        oeffneFormular(null);
    });
    return knopf;
}

function scanUebernehmen(lm) {
    const ziel = scanZiel;
    schliesseScanner();
    allesZeichnen();
    if (ziel) ziel(lm);
}

// ---------- Knöpfe verbinden (wird beim Start aufgerufen) ----------
function scannerVerbinden() {
    $("scanSuchen").addEventListener("click", function () { codeErkannt($("scanEingabe").value); });
    $("scanEingabe").addEventListener("keydown", function (e) {
        if (e.key === "Enter") { e.preventDefault(); codeErkannt($("scanEingabe").value); }
    });
    $("scanNochmal").addEventListener("click", function () {
        scanFertig = false;
        $("scanErgebnis").innerHTML = "";
        $("scanFehler").textContent = "";
        kameraStarten();
    });
    // Fenster zu (✕, Hintergrund, Esc) → Kamera sicher aus
    $("dialogScan").addEventListener("close", kameraStoppen);
}
