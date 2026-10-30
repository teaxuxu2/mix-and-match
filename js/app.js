// =====================================================
// Mix & Match Calories – App-Logik (Coder-Agent)
// =====================================================
// Wohnhaus-Bild: document ist das Haus. Jede Funktion hier ist ein
// Hausmeister mit genau einer Aufgabe (zeichnen, speichern, rechnen ...).
// Alle Daten liegen in der Variable "daten" – geladen vom Keller-Hausmeister
// in speicher.js. Alle Texte holt der Portier t() aus texte.js.

const MAHLZEITEN = ["fruehstueck", "mittag", "abend", "snack"]; // Text dazu: t("fruehstueck") ...


let daten = datenLaden();
sprache = daten.einstellungen.sprache; // "en" oder "de" – Variable kommt aus texte.js
let aktuellesDatum = heuteAlsText();
let suchtext = "";
let filter = "alle";
let auswahlMahlzeit = null;   // für welche Mahlzeit das Auswahl-Fenster offen ist
let aktionenId = null;        // welches Lebensmittel im Aktionen-Fenster offen ist
let bearbeiteId = null;       // null = neues Lebensmittel, sonst id des bearbeiteten
let formularFoto = null;      // verkleinertes Foto im Formular (Text/data-URL)
let auswahlModus = "plan";    // "plan" = für den Tagesplan, "rezept" = Zutat für ein Rezept
let rezeptEntwurf = null;     // das Rezept, das gerade im Rezept-Fenster bearbeitet wird
let nachFormularSpeichern = null; // was nach dem Speichern eines neuen Lebensmittels passieren soll


// =====================================================
// 1. Kleine Helfer
// =====================================================

// Kurzform für document.getElementById
function $(id) {
    return document.getElementById(id);
}

// Baut ein HTML-Element. Text wird mit textContent gesetzt –
// so kann ein Lebensmittelname nie versehentlich als Code ausgeführt werden.
function el(tag, klasse, text) {
    const element = document.createElement(tag);
    if (klasse) element.className = klasse;
    if (text !== undefined) element.textContent = text;
    return element;
}

// Macht aus einer Eingabe eine Zahl (erlaubt auch Komma: "2,5" → 2.5)
function zahl(text) {
    const wert = textZuZahl(text);
    return isFinite(wert) ? wert : NaN;
}

// Schöne Zahl für die Anzeige: EN 1,842 / 2.5 – DE 1.842 / 2,5
function format(wert, stellen) {
    return Number(wert).toLocaleString(gebietsschema(), { maximumFractionDigits: stellen || 0 });
}

// Zahl für ein Eingabefeld: ohne Tausenderpunkt, Komma auf Deutsch (2,5)
function feldWert(wert) {
    const text = String(Math.round(wert * 10) / 10);
    return sprache === "de" ? text.replace(".", ",") : text;
}

// Ab 10 ohne Kommastelle, darunter mit einer (z. B. 1.7 g) – so bleiben Zeilen kurz
function kurz(wert) {
    return format(wert, wert >= 10 ? 0 : 1);
}

// Der Name in der gewählten Sprache. Start-Lebensmittel haben zwei Namen,
// eigene Lebensmittel nur einen.
function anzeigeName(lm) {
    if (lm.namen && lm.namen[sprache]) return lm.namen[sprache];
    return lm.name;
}

// Anleitung in der gewählten Sprache: Start-Rezepte haben { en, de }, eigene Rezepte einen Text
function anzeigeAnleitung(lm) {
    if (!lm.anleitung) return "";
    if (typeof lm.anleitung === "string") return lm.anleitung;
    return lm.anleitung[sprache] || lm.anleitung.en || "";
}

function datumAlsText(datum) {
    const j = datum.getFullYear();
    const m = String(datum.getMonth() + 1).padStart(2, "0");
    const tag = String(datum.getDate()).padStart(2, "0");
    return j + "-" + m + "-" + tag;
}

function heuteAlsText() {
    return datumAlsText(new Date());
}

function textAlsDatum(text) {
    const teile = text.split("-").map(Number);
    return new Date(teile[0], teile[1] - 1, teile[2]);
}

function tageVerschieben(text, anzahl) {
    const datum = textAlsDatum(text);
    datum.setDate(datum.getDate() + anzahl);
    return datumAlsText(datum);
}

// "Today"/"Heute", "Yesterday"/"Gestern", "Tomorrow"/"Morgen" oder z. B. "Mon, Oct 26" / "Mo., 26. Okt."
function datumBeschriftung(text) {
    const heute = heuteAlsText();
    if (text === heute) return t("heute");
    if (text === tageVerschieben(heute, -1)) return t("gestern");
    if (text === tageVerschieben(heute, 1)) return t("morgen");
    return textAlsDatum(text).toLocaleDateString(gebietsschema(), { weekday: "short", month: "short", day: "numeric" });
}

function findeLebensmittel(id) {
    return daten.lebensmittel.find(function (lm) {
        return lm.id === id;
    });
}

// Speichert und meldet, falls der Speicher voll ist
function speichern() {
    const ok = datenSpeichern(daten);
    if (!ok) {
        zeigeMeldung(t("speicherVoll"), true);
    } else if (typeof wolkeMerken === "function") {
        wolkeMerken(); // angemeldet? → kurz danach eine Kopie in den Online-Speicher
    }
    return ok;
}

// Kurze Meldung unten am Bildschirm
let meldungTimer = null;
function zeigeMeldung(text, istFehler) {
    const box = $("meldung");
    box.textContent = text;
    box.classList.toggle("fehler-meldung", Boolean(istFehler));
    box.classList.add("sichtbar");
    clearTimeout(meldungTimer);
    meldungTimer = setTimeout(function () {
        box.classList.remove("sichtbar");
    }, 2600);
}


// =====================================================
// 2. Rechnen
// =====================================================

// Werte eines Lebensmittels für eine bestimmte Menge
// Beispiel: Haferflocken 372 kcal/100 g, 80 g → 297.6 kcal
function werteFuer(lm, gramm) {
    const faktor = gramm / 100;
    return {
        kcal: lm.kcal100 * faktor,
        protein: lm.protein100 * faktor,
        kh: lm.kh100 * faktor,
        fett: lm.fett100 * faktor
    };
}

function eintraegeVon(datum) {
    return daten.plan[datum] || [];
}

// Zählt alle Einträge eines Tages zusammen (optional nur eine Mahlzeit)
function summe(datum, mahlzeit) {
    const ergebnis = { kcal: 0, protein: 0, kh: 0, fett: 0 };
    eintraegeVon(datum).forEach(function (eintrag) {
        if (mahlzeit && eintrag.mahlzeit !== mahlzeit) return;
        const lm = findeLebensmittel(eintrag.lebensmittelId);
        if (!lm) return;
        const werte = werteFuer(lm, eintrag.gramm);
        ergebnis.kcal += werte.kcal;
        ergebnis.protein += werte.protein;
        ergebnis.kh += werte.kh;
        ergebnis.fett += werte.fett;
    });
    return ergebnis;
}


// =====================================================
// 3. Zeichnen (alles, was man sieht)
// =====================================================

function allesZeichnen() {
    texteAnwenden();
    document.querySelectorAll(".sprachwahl button").forEach(function (knopf) {
        knopf.classList.toggle("aktiv", knopf.dataset.sprache === sprache);
        knopf.setAttribute("aria-pressed", String(knopf.dataset.sprache === sprache));
    });
    zeichneStories();
    zeichneZusammenfassung();
    zeichnePlan();
    zeichneListe();
    if (typeof zeichneTraining === "function") zeichneTraining();
    zeichneProfil();
}

// Profil-Seite: kurze Infos unter den Einträgen
// ---------- Wisch-Leisten (Filter usw.) ----------
// Zeigt mit einer weichen Kante, dass man seitlich wischen kann, und rückt den gewählten Knopf ins Bild.
// Wohnhaus-Bild: ein langer Gang – das Licht am Ende zeigt, dass da noch Türen kommen.
function wischKantenSetzen(leiste) {
    const mehr = leiste.scrollWidth - leiste.clientWidth;
    leiste.classList.toggle("wisch-links", mehr > 2 && leiste.scrollLeft > 2);
    leiste.classList.toggle("wisch-rechts", mehr > 2 && leiste.scrollLeft < mehr - 2);
}
function insBildRuecken(knopf) {
    const leiste = knopf.parentElement;
    if (!leiste || leiste.scrollWidth <= leiste.clientWidth) return;
    const links = knopf.offsetLeft - leiste.offsetLeft;
    const ziel = Math.max(0, links - (leiste.clientWidth - knopf.offsetWidth) / 2); // Knopf in die Mitte
    if (leiste.scrollTo) leiste.scrollTo({ left: ziel, behavior: "smooth" }); else leiste.scrollLeft = ziel;
}
function wischLeistenEinrichten() {
    document.querySelectorAll(".filter, .kategorie-chips").forEach(function (leiste) {
        if (leiste.dataset.wisch) return;
        leiste.dataset.wisch = "1";
        leiste.addEventListener("scroll", function () { wischKantenSetzen(leiste); }, { passive: true });
        // Wird die Leiste sichtbar (Seitenwechsel) oder neu befüllt → Kanten + gewählten Knopf auffrischen
        const auffrischen = function () {
            wischKantenSetzen(leiste);
            const aktiv = leiste.querySelector(".aktiv");
            if (aktiv) insBildRuecken(aktiv);
        };
        if (window.ResizeObserver) new ResizeObserver(auffrischen).observe(leiste);
        if (window.MutationObserver) new MutationObserver(function (aenderungen) {
            if (aenderungen.some(function (m) { return m.type === "childList" || m.target !== leiste; })) auffrischen(); // eigene Kanten-Klassen ignorieren
        }).observe(leiste, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
        auffrischen();
    });
}
window.addEventListener("resize", function () { document.querySelectorAll(".filter, .kategorie-chips").forEach(wischKantenSetzen); });

// ---------- Als App speichern ----------
// Android/Chrome bietet ein echtes "Installieren" an – das merken wir uns für den Knopf.
// iPhone kann das nicht per Knopf: dort zeigt das Fenster die Schritte in Safari.
let appInstallAngebot = null;
window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    appInstallAngebot = e;
});
function appAnleitungVerbinden() {
    $("profilAppZeile").addEventListener("click", function () {
        $("appInstallierenJetzt").hidden = !appInstallAngebot;
        $("dialogApp").showModal();
    });
    $("appInstallierenJetzt").addEventListener("click", function () {
        if (!appInstallAngebot) return;
        appInstallAngebot.prompt();
        appInstallAngebot = null;
        $("dialogApp").close();
    });
}

// Sichtbare Versionsnummer (Profil ganz unten) – so sieht man, ob die neue Version da ist
const APP_VERSION = "3.11"; // muss gleich sein wie in js/version.json

function zeichneProfil() {
    $("appVersion").textContent = t("appVersion", { nr: APP_VERSION });
    const z = daten.einstellungen;
    $("profilZieleText").textContent = format(z.zielKcal) + " kcal · " + format(z.zielProtein) + " g " + t("protein");
    const angemeldet = typeof wolkeIch !== "undefined" && wolkeIch;
    $("profilKontoText").textContent = angemeldet ? t("kontoAngemeldet", { email: wolkeIch.email || "" }) : t("kontoNichtAngemeldet");
    $("navKontoPunkt").hidden = !angemeldet;
    // "Als App speichern" nur zeigen, wenn die Seite nicht schon als App geöffnet ist
    let alsApp = false;
    try { alsApp = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true; } catch (e) { alsApp = false; }
    $("profilAppZeile").hidden = alsApp;
}

// Bild eines Lebensmittels: echtes Foto oder Emoji-Platzhalter
function bildElement(lm, klasse) {
    const box = el("div", "lm-bild" + (klasse ? " " + klasse : ""));
    if (lm.foto) {
        const bild = el("img");
        bild.src = lm.foto;
        bild.alt = "";
        box.appendChild(bild);
    } else {
        box.textContent = lm.emoji || "🍽️";
    }
    return box;
}

// Werte-Zeile wie im Entwurf: "372 kcal | 14 g P | 59 g C | 7 g F"
function werteText(lm) {
    return format(lm.kcal100) + " kcal | " +
        kurz(lm.protein100) + " g " + t("kurzP") + " | " +
        kurz(lm.kh100) + " g " + t("kurzKh") + " | " +
        kurz(lm.fett100) + " g " + t("kurzF");
}

// EINE Stelle, die bestimmt, wie eine Lebensmittel-Karte aussieht
function lebensmittelKarte(lm) {
    // div statt button, weil sich Buttons in manchen Browsern nicht ziehen lassen
    const karte = el("div", "lm-karte");
    karte.setAttribute("role", "button");
    karte.tabIndex = 0;
    karte.draggable = true;
    karte.dataset.id = lm.id;

    karte.appendChild(bildElement(lm));

    const info = el("div", "lm-info");
    const name = el("div", "lm-name", anzeigeName(lm));
    if (lm.favorit) name.appendChild(el("span", "stern", " ★"));
    info.appendChild(name);
    info.appendChild(el("div", "lm-werte", werteText(lm)));
    const creator = lm.influencer ? findeCreator(lm.influencer) : null;
    const bezug = creator
        ? t("pro100") + " · @" + creator.handle
        : lm.rezept
        ? t("pro100") + " · " + t("rezeptInfo", { anzahl: lm.rezept.zutaten.length })
        : t("pro100") + (lm.laden ? " · " + lm.laden : "");
    info.appendChild(el("div", "lm-bezug", bezug));
    karte.appendChild(info);

    const menu = el("span", "knopf-icon klein", "⋮");
    menu.setAttribute("aria-hidden", "true");
    karte.appendChild(menu);

    karte.setAttribute("aria-label", t("optionen", { name: anzeigeName(lm) }));
    // Rezepte öffnen sich wie im Kochbuch, alle anderen zeigen das Aktionen-Fenster
    function oeffnen() {
        if (lm.rezept) oeffneAnsicht(lm.id); else oeffneAktionen(lm.id);
    }
    karte.addEventListener("click", oeffnen);
    karte.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); oeffnen(); }
    });

    // Ziehen am Computer (Drag & Drop in eine Mahlzeit)
    karte.addEventListener("dragstart", function (ereignis) {
        ereignis.dataTransfer.setData("text/plain", lm.id);
        ereignis.dataTransfer.effectAllowed = "copy";
        karte.classList.add("zieht");
    });
    karte.addEventListener("dragend", function () {
        karte.classList.remove("zieht");
    });

    return karte;
}

// Welche Lebensmittel passen zu Suche + Filter? Favoriten zuerst, dann alphabetisch.
// Gesucht wird in beiden Sprachen: "oats" und "hafer" finden beide Haferflocken.
// ---------- Tolerante Suche ----------
// Findet auch bei Mehrzahl ("Eier" → Ei), Umlauten ("aepfel" → Äpfel) und kleinen Tippfehlern ("bananne").
// Wohnhaus-Bild: ein Portier, der Bewohner auch erkennt, wenn man den Namen nicht ganz richtig sagt.
function suchNormal(text) {
    return String(text || "").toLowerCase()
        .replace(/ä/g, "a").replace(/ö/g, "o").replace(/ü/g, "u").replace(/ß/g, "ss")
        .replace(/ae/g, "a").replace(/oe/g, "o").replace(/ue/g, "u")
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9%]+/g, " ").trim();
}

// Wortstamm: typische deutsche/englische Endungen weg ("eier" → "ei", "bananen" → "banan", "apples" → "appl")
function suchStamm(wort) {
    if (wort.length <= 3) return wort;
    const endungen = ["innen", "chen", "ern", "en", "er", "es", "e", "n", "s"];
    for (let i = 0; i < endungen.length; i++) {
        const e = endungen[i];
        if (wort.length - e.length >= 2 && wort.slice(-e.length) === e) return wort.slice(0, -e.length);
    }
    return wort;
}

// Wie viele Tippfehler zwischen zwei Wörtern? (Einfügen, Löschen, Ersetzen, Vertauschen)
function tippAbstand(a, b, grenze) {
    if (Math.abs(a.length - b.length) > grenze) return grenze + 1;
    const d = [];
    for (let i = 0; i <= a.length; i++) { d[i] = [i]; }
    for (let j = 0; j <= b.length; j++) { d[0][j] = j; }
    for (let i = 1; i <= a.length; i++) {
        let zeilenMin = Infinity;
        for (let j = 1; j <= b.length; j++) {
            const kosten = a[i - 1] === b[j - 1] ? 0 : 1;
            d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + kosten);
            if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
            zeilenMin = Math.min(zeilenMin, d[i][j]);
        }
        if (zeilenMin > grenze) return grenze + 1;
    }
    return d[a.length][b.length];
}

// Punkte für ein Suchwort gegen einen Namen: 5 = genau, 4 = Wortanfang, 3 = enthalten, 2 = Wortstamm, 1 = Tippfehler, 0 = nein
function wortPunkte(suchwort, name, nameWoerter) {
    if (nameWoerter.indexOf(suchwort) !== -1) return 5;
    if (nameWoerter.some(function (w) { return w.indexOf(suchwort) === 0; })) return 4;
    if (name.indexOf(suchwort) !== -1 || name.replace(/ /g, "").indexOf(suchwort) !== -1) return 3;
    const stamm = suchStamm(suchwort);
    if (stamm.length >= 2 && nameWoerter.some(function (w) { return w.indexOf(stamm) === 0 || suchStamm(w) === stamm; })) return 2;
    if (suchwort.length >= 4) {
        const grenze = suchwort.length >= 8 ? 2 : 1;
        if (nameWoerter.some(function (w) {
            return w.length >= 3 && (tippAbstand(suchwort, w, grenze) <= grenze ||
                (w.length > suchwort.length && tippAbstand(suchwort, w.slice(0, suchwort.length), grenze) <= grenze));
        })) return 1;
    }
    return 0;
}

// Gesamtpunkte eines Lebensmittels für einen Suchtext (alle Wörter müssen passen)
function suchPunkte(lm, suchWoerter, suchGanz) {
    const creator = lm.influencer ? findeCreator(lm.influencer) : null;
    const namen = [lm.name, lm.marke, lm.laden, creator && creator.handle, creator && creator.name]
        .concat(lm.namen ? [lm.namen.en, lm.namen.de] : [])
        .concat(STARTDATEN_NACH_ID[lm.id] && STARTDATEN_NACH_ID[lm.id].stichworte ? [STARTDATEN_NACH_ID[lm.id].stichworte] : [])
        .filter(Boolean).map(suchNormal);
    const alle = namen.join(" ");
    const alleWoerter = alle.split(" ");
    // ganzer Suchtext ohne Leerzeichen ("mandeldrink" findet "Mandel Drink")
    if (suchGanz.length >= 3 && alle.replace(/ /g, "").indexOf(suchGanz.replace(/ /g, "")) !== -1 && suchWoerter.length > 1) return 3 * suchWoerter.length;
    let summe = 0;
    for (let i = 0; i < suchWoerter.length; i++) {
        const p = wortPunkte(suchWoerter[i], alle, alleWoerter);
        if (!p) return 0;
        summe += p;
    }
    return summe;
}

// Welche Lebensmittel passen zu Suche + Filter? Favoriten zuerst, beste Treffer oben, dann alphabetisch.
// Gesucht wird in beiden Sprachen: "oats" und "hafer" finden beide Haferflocken.
function gefilterteLebensmittel(text, mitFilter) {
    const such = suchNormal(text);
    const suchWoerter = such ? such.split(" ") : [];
    const punkte = {};
    return daten.lebensmittel
        .filter(function (lm) {
            if (mitFilter === "favoriten" && !lm.favorit) return false;
            if (mitFilter === "eigene" && !lm.eigenes) return false;
            if (mitFilter === "zuletzt" && !zuletztRang(lm)) return false;
            if (mitFilter === "rezepte" && !lm.rezept) return false;
            if (!such) return true;
            punkte[lm.id] = suchPunkte(lm, suchWoerter, such);
            return punkte[lm.id] > 0;
        })
        .sort(function (a, b) {
            if (mitFilter === "zuletzt" && !such) return zuletztRang(b) - zuletztRang(a);
            if (a.favorit !== b.favorit) return a.favorit ? -1 : 1;
            if (such) {
                // genauer Name zuerst, dann Name beginnt mit dem Suchwort, dann nach Punkten
                const rang = function (lm) {
                    const n = suchNormal(anzeigeName(lm));
                    return n === such ? 0 : n.indexOf(such) === 0 ? 1 : 2;
                };
                if (rang(a) !== rang(b)) return rang(a) - rang(b);
                if (punkte[a.id] !== punkte[b.id]) return punkte[b.id] - punkte[a.id];
            }
            return anzeigeName(a).localeCompare(anzeigeName(b), gebietsschema());
        });
}

function zeichneListe() {
    const liste = $("lebensmittelListe");
    liste.innerHTML = "";

    const treffer = gefilterteLebensmittel(suchtext, filter);
    treffer.forEach(function (lm) {
        liste.appendChild(lebensmittelKarte(lm));
    });

    if (treffer.length === 0) {
        let text = t("leer");
        if (filter === "favoriten" && !suchtext) text = t("leerFav");
        if (filter === "eigene" && !suchtext) text = t("leerEigene");
        if (filter === "zuletzt" && !suchtext) text = t("leerZuletzt");
        liste.appendChild(el("p", "leer", text));
    }

    // Nicht dabei? → online bei Open Food Facts suchen (ab 2 Zeichen)
    if (suchtext.trim().length >= 2) {
        liste.appendChild(onlineKasten(suchtext, function (lm) {
            zeigeMeldung(t("onlineUebernommen", { name: anzeigeName(lm) }));
            allesZeichnen();
        }, treffer.length < 3));
    }
}

// Eine Kennzahl oben: Wert, Ziel und dünner Balken (wie weit bin ich?)
function setzeKennzahl(id, ist, ziel, istText, zielText) {
    const kachel = $(id);
    const anteil = ziel > 0 ? ist / ziel : 0;
    kachel.querySelector(".kpi-spur i").style.width = Math.min(anteil * 100, 100) + "%";
    kachel.classList.toggle("ueber", anteil > 1.05);
    kachel.setAttribute("title", Math.round(anteil * 100) + "%");
    return { ist: istText, ziel: zielText };
}

function zeichneZusammenfassung() {
    const s = summe(aktuellesDatum);
    const z = daten.einstellungen;

    $("datumText").textContent = datumBeschriftung(aktuellesDatum);

    $("kcalIst").textContent = format(s.kcal);
    $("kcalZiel").textContent = "/ " + format(z.zielKcal) + " kcal";
    $("proteinIst").textContent = format(s.protein);
    $("proteinZiel").textContent = "/ " + format(z.zielProtein) + " g";
    $("fettIst").textContent = format(s.fett);
    $("fettZiel").textContent = "/ " + format(z.zielFett) + " g";
    $("khIst").textContent = format(s.kh);
    $("khZiel").textContent = "/ " + format(z.zielKh) + " g";
    setzeKennzahl("kpiKcal", s.kcal, z.zielKcal);
    setzeKennzahl("kpiProtein", s.protein, z.zielProtein);
    setzeKennzahl("kpiFett", s.fett, z.zielFett);
    setzeKennzahl("kpiKh", s.kh, z.zielKh);
}

// Ein Eintrag im Tagesplan: Bild, Name, Werte, − Menge +, ✕
function eintragKarte(eintrag) {
    const lm = findeLebensmittel(eintrag.lebensmittelId);
    if (!lm) return null;
    const werte = werteFuer(lm, eintrag.gramm);
    const name = anzeigeName(lm);

    const karte = el("div", "eintrag");
    karte.appendChild(bildElement(lm, "klein"));

    const info = el("div", "eintrag-info");
    info.appendChild(el("div", "eintrag-name", name));
    info.appendChild(el("div", "eintrag-werte",
        "🔥 " + format(werte.kcal) + " kcal · 💪 " + format(werte.protein, 1) + " g"));

    // − Menge +
    const steuerung = el("div", "menge-steuerung");
    const minus = el("button", "rund minus", "−");
    minus.type = "button";
    minus.setAttribute("aria-label", t("weniger") + " " + name);
    const feld = el("div", "menge-wert"); // kein <label>: sonst springt beim Tippen daneben die Tastatur auf
    const eingabe = el("input");
    eingabe.type = "text";
    eingabe.inputMode = "decimal";
    // Stück statt Gramm? (z. B. 2 Stk. Ei) – gespeichert wird immer in Gramm
    const stueck = lm.stueck && eintrag.einheit === "stueck" ? lm.stueck : null;
    const schritt = stueck ? stueck.g : 10;
    eingabe.value = stueck ? feldWert(Math.round(eintrag.gramm / stueck.g * 2) / 2) : feldWert(eintrag.gramm);
    eingabe.setAttribute("aria-label", t("grammVon", { name: name }));
    feld.appendChild(eingabe);
    if (!lm.stueck) feld.appendChild(el("span", "", "g"));
    const plus = el("button", "rund plus", "+");
    plus.type = "button";
    plus.setAttribute("aria-label", t("mehr") + " " + name);
    steuerung.appendChild(minus);
    steuerung.appendChild(feld);
    steuerung.appendChild(plus);
    const zeileMenge = el("div", "menge-zeile");
    zeileMenge.appendChild(steuerung);
    if (lm.stueck) zeileMenge.appendChild(einheitUmschalter(eintrag, lm));
    info.appendChild(zeileMenge);
    karte.appendChild(info);

    const entfernen = el("button", "eintrag-entfernen", "✕");
    entfernen.type = "button";
    entfernen.setAttribute("aria-label", t("entfernen", { name: name }));
    karte.appendChild(entfernen);

    minus.addEventListener("click", function () { mengeAendern(eintrag.id, eintrag.gramm - schritt); });
    plus.addEventListener("click", function () { mengeAendern(eintrag.id, eintrag.gramm + schritt); });
    eingabe.addEventListener("change", function () { mengeAendern(eintrag.id, zahl(eingabe.value) * (stueck ? stueck.g : 1)); });
    if (stueck) info.appendChild(el("div", "eintrag-gramm", t("ungefaehrGramm", { g: format(eintrag.gramm) })));
    eingabe.addEventListener("keydown", function (e) { if (e.key === "Enter") eingabe.blur(); });
    entfernen.addEventListener("click", function () { eintragEntfernen(eintrag.id); });

    return karte;
}

// Umschalter "g | Stk." (bzw. Scheibe/Portion) – beide Möglichkeiten immer sichtbar, ein Tipp wechselt
function einheitText(stueck) {
    return t(stueck.art === "scheibe" ? "scheibeKurz" : stueck.art === "portion" ? "portionKurz" : "stueckKurz");
}
function einheitUmschalter(eintrag, lm) {
    const gruppe = el("div", "einheit-wahl");
    gruppe.setAttribute("role", "group");
    gruppe.setAttribute("aria-label", t("einheitWechseln"));
    [["g", "g"], ["stueck", einheitText(lm.stueck)]].forEach(function (paar) {
        const aktiv = (eintrag.einheit === "stueck") === (paar[0] === "stueck");
        const k = el("button", "einheit-option" + (aktiv ? " aktiv" : ""), paar[1]);
        k.type = "button";
        k.setAttribute("aria-pressed", aktiv ? "true" : "false");
        k.addEventListener("click", function () { if (!aktiv) einheitWechseln(eintrag.id); });
        gruppe.appendChild(k);
    });
    return gruppe;
}

function zeichnePlan() {
    const bereich = $("mahlzeiten");
    bereich.innerHTML = "";

    // Eine einzige Liste für den ganzen Tag (keine Frühstück/Mittag/... mehr)
    const box = el("section", "mahlzeit tagesliste");
    box.dataset.mahlzeit = "tag";

    const kopf = el("div", "mahlzeit-kopf");
    kopf.appendChild(el("h3", "", t("heuteGegessen")));
    kopf.appendChild(el("span", "", format(summe(aktuellesDatum).kcal) + " kcal"));
    box.appendChild(kopf);

    const liste = el("div", "eintraege");
    const eintraege = eintraegeVon(aktuellesDatum);
    eintraege.forEach(function (eintrag) {
        const karte = eintragKarte(eintrag);
        if (karte) liste.appendChild(karte);
    });
    if (eintraege.length === 0) liste.appendChild(el("p", "leer klein", t("tagLeer")));
    box.appendChild(liste);

    // Ablegen beim Ziehen (Computer)
    box.addEventListener("dragover", function (ereignis) {
        ereignis.preventDefault();
        ereignis.dataTransfer.dropEffect = "copy";
        box.classList.add("ziel");
    });
    box.addEventListener("dragleave", function (ereignis) {
        if (!box.contains(ereignis.relatedTarget)) box.classList.remove("ziel");
    });
    box.addEventListener("drop", function (ereignis) {
        ereignis.preventDefault();
        box.classList.remove("ziel");
        const id = ereignis.dataTransfer.getData("text/plain");
        if (id) eintragHinzufuegen(id);
    });

    bereich.appendChild(box);
    zeichneSchnellwahl();
    zeichneTagTreffer();
    if (typeof zeichneSportTag === "function") zeichneSportTag();
    if (typeof zeichneVorschlaege === "function") zeichneVorschlaege();
}

// Diktieren (🎤) steckt jetzt in js/sprache-eingabe.js – für alle Suchfelder.

// ---------- Zuletzt ----------
// Wann wurde ein Lebensmittel zuletzt benutzt? (angelegt, übernommen, gegessen) – 0 = nie
let zuletztGegessenCache = null;
function zuletztGegessen() {
    if (zuletztGegessenCache) return zuletztGegessenCache;
    const zeit = {};
    Object.keys(daten.plan).sort().slice(-60).forEach(function (datum) {
        const ms = new Date(datum + "T12:00:00").getTime();
        daten.plan[datum].forEach(function (e) { if (!(zeit[e.lebensmittelId] >= ms)) zeit[e.lebensmittelId] = ms; });
    });
    zuletztGegessenCache = zeit;
    setTimeout(function () { zuletztGegessenCache = null; }, 0);
    return zeit;
}
function zuletztRang(lm) {
    const r = Math.max(lm.zuletzt || 0, zuletztGegessen()[lm.id] || 0);
    if (r) return r;
    return lm.eigenes ? 1 : 0; // selbst angelegt, aber noch nie benutzt → ganz unten, aber dabei
}
function zuletztListe() {
    return daten.lebensmittel.filter(function (lm) { return zuletztRang(lm) > 0; })
        .sort(function (a, b) { return zuletztRang(b) - zuletztRang(a); })
        .slice(0, 40);
}

// ---------- Schnell-Panel unter der Suche: ⭐ Favoriten / 🕘 Zuletzt ----------
let schnellAnsicht = null; // null | "favoriten" | "zuletzt"

function schnellUmschalten(ansicht) {
    schnellAnsicht = schnellAnsicht === ansicht ? null : ansicht;
    zeichneSchnellwahl();
}

// Eine Zeile: Tippen = eintragen (Panel bleibt offen), ☆ = Favorit an/aus
function schnellZeile(lm, beimEintragen) {
    const zeile = el("div", "lm-karte schnell-zeile");
    const knopf = el("button", "schnell-dazu");
    knopf.type = "button";
    knopf.appendChild(bildElement(lm, "klein"));
    const info = el("div", "lm-info");
    info.appendChild(el("div", "lm-name", anzeigeName(lm)));
    info.appendChild(el("div", "lm-werte", werteText(lm)));
    knopf.appendChild(info);
    knopf.setAttribute("aria-label", t("schnellDazu", { name: anzeigeName(lm) }));
    function blitz() {
        zeile.classList.add("eben-dazu");
        setTimeout(function () { zeile.classList.remove("eben-dazu"); }, 900);
    }
    // Antippen → "Wie viel?" darunter; ＋ → sofort mit der gewohnten Menge
    knopf.addEventListener("click", function () {
        const offen = zeile.nextSibling && zeile.nextSibling.classList && zeile.nextSibling.classList.contains("menge-frage");
        document.querySelectorAll(".menge-frage").forEach(function (x) { x.remove(); });
        if (offen) return;
        const frage = mengeFrage(lm, null, function (gramm, einheit) {
            frage.remove();
            beimEintragen(lm, gramm, einheit);
            blitz();
        });
        zeile.after(frage);
    });
    const stern = el("button", "stern-knopf" + (lm.favorit ? " an" : ""), lm.favorit ? "★" : "☆");
    stern.type = "button";
    stern.setAttribute("aria-pressed", lm.favorit ? "true" : "false");
    stern.setAttribute("aria-label", lm.favorit ? t("favRemove") : t("favAdd"));
    stern.addEventListener("click", function () {
        lm.favorit = !lm.favorit;
        speichern();
        stern.classList.toggle("an", lm.favorit);
        stern.textContent = lm.favorit ? "★" : "☆";
        stern.setAttribute("aria-pressed", lm.favorit ? "true" : "false");
        zeigeMeldung(lm.favorit ? t("favJa") : t("favNein"));
        if (schnellAnsicht === "favoriten" && !lm.favorit) zeile.remove();
    });
    const plus = el("button", "knopf-icon klein schnell-plus", "＋");
    plus.type = "button";
    plus.setAttribute("aria-label", t("schnellDazu", { name: anzeigeName(lm) }));
    plus.addEventListener("click", function () { beimEintragen(lm); blitz(); });
    zeile.appendChild(knopf);
    zeile.appendChild(stern);
    zeile.appendChild(plus);
    return zeile;
}

function zeichneSchnellwahl() {
    const panel = $("schnellPanel");
    if (!panel) return;
    $("iconFavoriten").classList.toggle("aktiv", schnellAnsicht === "favoriten");
    $("iconFavoriten").setAttribute("aria-pressed", schnellAnsicht === "favoriten" ? "true" : "false");
    $("iconZuletzt").classList.toggle("aktiv", schnellAnsicht === "zuletzt");
    $("iconZuletzt").setAttribute("aria-pressed", schnellAnsicht === "zuletzt" ? "true" : "false");
    panel.innerHTML = "";
    if (!schnellAnsicht || $("tagSuche").value.trim()) { panel.hidden = true; return; }
    panel.hidden = false;
    const liste = schnellAnsicht === "favoriten"
        ? daten.lebensmittel.filter(function (lm) { return lm.favorit; })
            .sort(function (a, b) { return zuletztRang(b) - zuletztRang(a); })
        : zuletztListe();
    const kopf = el("div", "schnell-kopf");
    kopf.appendChild(el("strong", "", schnellAnsicht === "favoriten" ? "⭐ " + t("filterFav") : "🕘 " + t("zuletztTitel")));
    const zu = el("button", "knopf-icon klein", "✕");
    zu.type = "button";
    zu.setAttribute("aria-label", t("schliessen"));
    zu.addEventListener("click", function () { schnellAnsicht = null; zeichneSchnellwahl(); });
    kopf.appendChild(zu);
    panel.appendChild(kopf);
    if (!liste.length) {
        panel.appendChild(el("p", "leer klein", t(schnellAnsicht === "favoriten" ? "leerFavSchnell" : "leerZuletzt")));
        return;
    }
    liste.forEach(function (lm) {
        panel.appendChild(schnellZeile(lm, function (x, gramm, einheit) { eintragHinzufuegen(x.id, null, gramm, einheit); }));
    });
}

// Treffer der Suchleiste oben in "Mein Tag": ein Tipp = eingetragen
// "Skyr 200", "200 g Skyr", "2 Stk Ei", "3 Scheiben Gouda" → Suchtext + Menge
function mengeAusText(text) {
    const einheiten = "(g|gr|gramm|grams?|stk\\.?|stück|stueck|st|pcs?|pieces?|scheiben?|slices?|portionen?|scoops?|x)?";
    const zahl = "(\\d+(?:[.,]\\d+)?)";
    let m = String(text).match(new RegExp("^\\s*" + zahl + "\\s*" + einheiten + "\\s+(.+)$", "i"));
    let such, wert, einheit;
    if (m) { wert = m[1]; einheit = m[2]; such = m[3]; }
    else {
        m = String(text).match(new RegExp("^(.+?)\\s+" + zahl + "\\s*" + einheiten + "\\s*$", "i"));
        if (m) { such = m[1]; wert = m[2]; einheit = m[3]; }
    }
    if (!m || /^\d+$/.test(text.trim())) return { such: text, menge: null, stueck: false };
    const istStueck = /^(stk|stück|stueck|st|pc|piece|scheibe|slice|portion|scoop|x)/i.test(einheit || "");
    return { such: such.trim(), menge: Number(String(wert).replace(",", ".")), stueck: istStueck };
}

// Menge in Gramm aus Eingabe (bei Stück: Anzahl × Stückgewicht)
function mengeInGramm(lm, wert, stueck) {
    return stueck && lm.stueck ? wert * lm.stueck.g : wert;
}

// Kleines Feld "Wie viel?" direkt unter dem Treffer – Enter oder ✓ trägt ein
function mengeFrage(lm, vorgabe, beimFertig) {
    const box = el("div", "menge-frage");
    box.appendChild(el("div", "menge-frage-titel", t("wieViel", { name: anzeigeName(lm) })));
    let stueck = vorgabe && vorgabe.menge ? (vorgabe.stueck && !!lm.stueck) : (!!lm.stueck && lm.letzteEinheit === "stueck");
    const feld = el("input");
    feld.type = "text";
    feld.inputMode = "decimal";
    feld.enterKeyHint = "done";
    feld.setAttribute("aria-label", t("grammVon", { name: anzeigeName(lm) }));
    function vorschlag() {
        if (vorgabe && vorgabe.menge) return vorgabe.menge;
        const g = lm.letzteGramm || 100;
        return stueck ? Math.max(1, Math.round(g / lm.stueck.g * 2) / 2) : g;
    }
    feld.value = feldWert(vorschlag());
    box.appendChild(feld);
    if (lm.stueck) {
        const wahl = el("div", "einheit-wahl");
        [false, true].forEach(function (alsStueck) {
            const k = el("button", "einheit-option" + (stueck === alsStueck ? " aktiv" : ""), alsStueck ? einheitText(lm.stueck) : "g");
            k.type = "button";
            k.addEventListener("click", function () {
                if (stueck === alsStueck) return;
                const alt = zahl(feld.value) || 0;
                stueck = alsStueck;
                feld.value = feldWert(stueck ? Math.max(1, Math.round(alt / lm.stueck.g * 2) / 2) : Math.round(alt * lm.stueck.g));
                wahl.querySelectorAll(".einheit-option").forEach(function (x) { x.classList.toggle("aktiv", x === k); });
                feld.focus();
            });
            wahl.appendChild(k);
        });
        box.appendChild(wahl);
    } else {
        box.appendChild(el("span", "", "g"));
    }
    const ok = el("button", "knopf-primaer", t("eintragen"));
    ok.type = "button";
    function fertig() {
        const wert = zahl(feld.value);
        if (!(wert > 0)) { feld.focus(); return; }
        beimFertig(mengeInGramm(lm, wert, stueck), stueck ? "stueck" : "g");
    }
    ok.addEventListener("click", fertig);
    feld.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); fertig(); } });
    box.appendChild(ok);
    setTimeout(function () { feld.focus(); feld.select(); }, 30);
    return box;
}

// Eine Trefferzeile: antippen → "Wie viel?" · ＋ → sofort mit der gewohnten (oder getippten) Menge
function trefferZeile(lm, vorgabe, beimEintragen) {
    const wrap = el("div", "treffer-block");
    const zeile = el("div", "treffer-zeile");
    const knopf = el("button", "lm-karte");
    knopf.type = "button";
    knopf.appendChild(bildElement(lm, "klein"));
    const info = el("div", "lm-info");
    const name = el("div", "lm-name", anzeigeName(lm));
    if (lm.favorit) name.appendChild(el("span", "stern", " ★"));
    info.appendChild(name);
    info.appendChild(el("div", "lm-werte", werteText(lm)));
    knopf.appendChild(info);
    knopf.addEventListener("click", function () {
        const offen = wrap.querySelector(".menge-frage");
        document.querySelectorAll(".menge-frage").forEach(function (x) { x.remove(); });
        if (offen) return;
        wrap.appendChild(mengeFrage(lm, vorgabe, function (gramm, einheit) { beimEintragen(lm, gramm, einheit); }));
    });
    const plus = el("button", "schnell-plus-direkt", "＋");
    plus.type = "button";
    plus.setAttribute("aria-label", t("schnellDazu", { name: anzeigeName(lm) }));
    plus.addEventListener("click", function () {
        if (vorgabe && vorgabe.menge) beimEintragen(lm, mengeInGramm(lm, vorgabe.menge, vorgabe.stueck), vorgabe.stueck ? "stueck" : "g");
        else beimEintragen(lm);
    });
    zeile.appendChild(knopf);
    zeile.appendChild(plus);
    wrap.appendChild(zeile);
    return wrap;
}

function zeichneTagTreffer() {
    const box = $("tagTreffer");
    const roh = $("tagSuche").value;
    box.innerHTML = "";
    if (!roh.trim()) { box.hidden = true; return; }
    box.hidden = false;
    const vorgabe = mengeAusText(roh);
    const text = vorgabe.such;

    const treffer = gefilterteLebensmittel(text, "alle");
    if (vorgabe.menge) box.appendChild(el("p", "leer klein", t("mengeErkannt", { menge: format(vorgabe.menge, 1) + (vorgabe.stueck ? " " + t("stueckKurz") : " g") })));
    treffer.slice(0, 8).forEach(function (lm) {
        box.appendChild(trefferZeile(lm, vorgabe, function (x, gramm, einheit) { tagSucheFertig(x, gramm, einheit); }));
    });
    if (treffer.length > 8) box.appendChild(el("p", "leer klein", t("mehrTreffer", { anzahl: treffer.length - 8 })));

    if (treffer.length === 0) {
        const neu = el("button", "knopf-zweit", t("anlegen", { name: text.trim() }));
        neu.type = "button";
        neu.addEventListener("click", function () {
            nachFormularSpeichern = function (neuesLm) { tagSucheFertig(neuesLm); };
            oeffneFormular(null, text.trim());
        });
        box.appendChild(neu);
    }
    if (text.trim().length >= 2) {
        // Wenig oder nichts gefunden → gleich selbst online weitersuchen
        box.appendChild(onlineKasten(text, function (lm) {
            allesZeichnen();
            if (vorgabe.menge) tagSucheFertig(lm, mengeInGramm(lm, vorgabe.menge, vorgabe.stueck), vorgabe.stueck ? "stueck" : "g");
            else tagSucheFertig(lm);
        }, treffer.length < 3));
    }
}

// Gewählt → eintragen, Suche leeren
function tagSucheFertig(lm, gramm, einheit) {
    const feld = $("tagSuche");
    feld.value = "";
    eintragHinzufuegen(lm.id, null, gramm, einheit);
    // Gleich weitermachen: Suchfeld bleibt aktiv (Tastatur bleibt offen) für das nächste Lebensmittel
    feld.focus();
    zeichneTagTreffer();
}


// =====================================================
// 4. Tagesplan ändern
// =====================================================

function eintragHinzufuegen(lebensmittelId, mahlzeit, gramm, einheit) {
    mahlzeit = mahlzeit || "tag"; // seit Version 2.0 gibt es nur noch "Mein Tag"
    const lm = findeLebensmittel(lebensmittelId);
    if (!lm) return;
    if (!daten.plan[aktuellesDatum]) daten.plan[aktuellesDatum] = [];
    lm.zuletzt = Date.now(); // für "Zuletzt"

    daten.plan[aktuellesDatum].push({
        id: neueId(),
        mahlzeit: mahlzeit,
        lebensmittelId: lebensmittelId,
        gramm: gramm > 0 ? Math.min(Math.round(gramm * 10) / 10, 5000) : (lm.letzteGramm || 100),
        einheit: einheit ? (einheit === "stueck" && lm.stueck ? "stueck" : undefined)
            : (lm.stueck && lm.letzteEinheit === "stueck" ? "stueck" : undefined)
    });
    if (gramm > 0) { lm.letzteGramm = gramm; if (lm.stueck) lm.letzteEinheit = einheit === "stueck" ? "stueck" : "g"; }
    speichern();
    zeichneZusammenfassung();
    zeichnePlan();
    zeigeMeldung(t("hinzugefuegtTag", { name: anzeigeName(lm) }));
}

function findeEintrag(id) {
    return eintraegeVon(aktuellesDatum).find(function (e) { return e.id === id; });
}

function mengeAendern(eintragId, neueGramm) {
    const eintrag = findeEintrag(eintragId);
    if (!eintrag) return;
    const lmStueck = findeLebensmittel(eintrag.lebensmittelId);
    const minimum = lmStueck && lmStueck.stueck && eintrag.einheit === "stueck" ? lmStueck.stueck.g / 2 : 10;
    if (!(neueGramm > 0) || neueGramm < minimum) neueGramm = eintrag.gramm > minimum ? eintrag.gramm : minimum; // nie 0 oder negativ
    neueGramm = Math.min(Math.round(neueGramm * 10) / 10, 5000);

    eintrag.gramm = neueGramm;
    const lm = findeLebensmittel(eintrag.lebensmittelId);
    if (lm) lm.letzteGramm = neueGramm; // nächstes Mal diese Menge vorschlagen
    speichern();
    zeichneZusammenfassung();
    zeichnePlan();
}

// Zwischen Gramm und Stück umschalten (die App merkt sich die Wahl für dieses Lebensmittel)
function einheitWechseln(eintragId) {
    const eintrag = findeEintrag(eintragId);
    const lm = eintrag ? findeLebensmittel(eintrag.lebensmittelId) : null;
    if (!lm || !lm.stueck) return;
    eintrag.einheit = eintrag.einheit === "stueck" ? "g" : "stueck";
    if (eintrag.einheit === "stueck") {
        // auf ganze Stück runden (mindestens 1)
        eintrag.gramm = Math.max(1, Math.round(eintrag.gramm / lm.stueck.g)) * lm.stueck.g;
    }
    lm.letzteEinheit = eintrag.einheit;
    lm.letzteGramm = eintrag.gramm;
    speichern();
    zeichneZusammenfassung();
    zeichnePlan();
}

function eintragEntfernen(eintragId) {
    const liste = eintraegeVon(aktuellesDatum);
    daten.plan[aktuellesDatum] = liste.filter(function (e) { return e.id !== eintragId; });
    if (daten.plan[aktuellesDatum].length === 0) delete daten.plan[aktuellesDatum];
    speichern();
    zeichneZusammenfassung();
    zeichnePlan();
}

function tagWechseln(anzahl) {
    aktuellesDatum = anzahl === 0 ? heuteAlsText() : tageVerschieben(aktuellesDatum, anzahl);
    zeichneZusammenfassung();
    zeichnePlan();
}


// =====================================================
// 5. Sprache wechseln
// =====================================================

function spracheWechseln(neueSprache) {
    if (neueSprache !== "en" && neueSprache !== "de") return;
    sprache = neueSprache;
    daten.einstellungen.sprache = neueSprache;
    speichern();
    allesZeichnen();
}


// =====================================================
// 6. Fenster (Dialoge) öffnen & schließen
// =====================================================

function oeffneFenster(id) {
    const fenster = $(id);
    if (!fenster.open) fenster.showModal();
}

function schliesseFenster(id) {
    const fenster = $(id);
    if (fenster.open) fenster.close();
}

// Auswahl-Fenster: Lebensmittel für eine Mahlzeit suchen und antippen
function oeffneAuswahl(mahlzeit) {
    auswahlModus = "plan";
    auswahlMahlzeit = mahlzeit;
    $("auswahlTitel").textContent = t("auswahlTitel", { mahlzeit: t(mahlzeit) });
    $("auswahlSuche").value = "";
    zeichneAuswahl();
    oeffneFenster("dialogAuswahl");
}

// Ein Lebensmittel wurde im Auswahl-Fenster gewählt → in die Mahlzeit bzw. ins Rezept
function auswahlWaehlen(lm) {
    if (auswahlModus === "rezept") {
        zutatHinzufuegen(lm.id);
    } else {
        eintragHinzufuegen(lm.id, auswahlMahlzeit);
    }
    schliesseFenster("dialogAuswahl");
}

// Gescanntes Produkt aus der Lebensmittel-Liste: gleich fragen, wohin damit
function nachScanImListe(lm) {
    zeigeMeldung(t("scanBereit", { name: anzeigeName(lm) }));
    oeffneAktionen(lm.id);
}

function zeichneAuswahl() {
    const liste = $("auswahlListe");
    liste.innerHTML = "";
    const waehle = auswahlWaehlen;
    let treffer = gefilterteLebensmittel($("auswahlSuche").value, "alle");
    if (auswahlModus === "rezept") {
        // Rezepte nicht als Zutat anbieten (sonst könnte ein Rezept sich selbst enthalten)
        treffer = treffer.filter(function (lm) { return !lm.rezept; });
    }

    treffer.forEach(function (lm) {
        const zeile = el("button", "lm-karte");
        zeile.type = "button";
        zeile.appendChild(bildElement(lm, "klein"));
        const info = el("div", "lm-info");
        const name = el("div", "lm-name", anzeigeName(lm));
        if (lm.favorit) name.appendChild(el("span", "stern", " ★"));
        info.appendChild(name);
        info.appendChild(el("div", "lm-werte", werteText(lm)));
        zeile.appendChild(info);
        zeile.appendChild(el("span", "knopf-icon klein", "＋"));
        zeile.addEventListener("click", function () { waehle(lm); });
        liste.appendChild(zeile);
    });

    if (treffer.length === 0) {
        const leer = el("div", "leer");
        leer.appendChild(el("p", "", t("nichtsGefunden")));
        const gesucht = $("auswahlSuche").value.trim();
        if (gesucht) {
            const neu = el("button", "knopf-primaer", t("anlegen", { name: gesucht }));
            neu.type = "button";
            neu.addEventListener("click", function () {
                schliesseFenster("dialogAuswahl");
                // Fehlende Zutat: neu anlegen und danach direkt ins Rezept übernehmen
                if (auswahlModus === "rezept") {
                    nachFormularSpeichern = function (neuesLm) { zutatHinzufuegen(neuesLm.id); };
                }
                oeffneFormular(null, gesucht);
            });
            leer.appendChild(neu);
        }
        liste.appendChild(leer);
    }

    const gesuchtOnline = $("auswahlSuche").value;
    if (gesuchtOnline.trim().length >= 2) {
        liste.appendChild(onlineKasten(gesuchtOnline, function (lm) {
            allesZeichnen();
            waehle(lm);
        }, treffer.length < 3));
    }
}

// Aktionen-Fenster: zum Tag hinzufügen, Favorit, bearbeiten, löschen
function oeffneAktionen(id) {
    const lm = findeLebensmittel(id);
    if (!lm) return;
    aktionenId = id;
    $("aktionenTitel").textContent = anzeigeName(lm);
    $("aktionFavorit").textContent = lm.favorit ? t("favRemove") : t("favAdd");

    const loeschen = $("aktionLoeschen");
    loeschen.textContent = t("loeschen");
    loeschen.classList.remove("sicher");

    $("aktionenPlanText").textContent = aktuellesDatum === heuteAlsText()
        ? t("planHeute")
        : t("planDatum", { datum: datumBeschriftung(aktuellesDatum) });

    const knoepfe = $("aktionenMahlzeiten");
    knoepfe.innerHTML = "";
    const knopf = el("button", "knopf-primaer", t("zuMeinemTag"));
    knopf.type = "button";
    knopf.addEventListener("click", function () {
        eintragHinzufuegen(id);
        schliesseFenster("dialogAktionen");
    });
    knoepfe.appendChild(knopf);

    oeffneFenster("dialogAktionen");
}

function favoritUmschalten() {
    const lm = findeLebensmittel(aktionenId);
    if (!lm) return;
    lm.favorit = !lm.favorit;
    speichern();
    zeichneListe();
    schliesseFenster("dialogAktionen");
    zeigeMeldung(lm.favorit ? t("favJa") : t("favNein"));
}

// Löschen braucht zwei Tipps – so passiert es nicht aus Versehen
function lebensmittelLoeschen() {
    const knopf = $("aktionLoeschen");
    const lm = findeLebensmittel(aktionenId);
    if (!lm) return;
    const name = anzeigeName(lm);

    // Zutaten, die in einem Rezept stecken, nicht löschen – sonst stimmt das Rezept nicht mehr
    const rezept = daten.lebensmittel.find(function (x) {
        return x.rezept && x.rezept.zutaten.some(function (z) { return z.lebensmittelId === lm.id; });
    });
    if (rezept) {
        zeigeMeldung(t("loeschenRezept", { name: name, rezept: anzeigeName(rezept) }), true);
        return;
    }

    if (!knopf.classList.contains("sicher")) {
        knopf.classList.add("sicher");
        knopf.textContent = t("loeschenSicher", { name: name });
        return;
    }

    // Auch aus allen Tagesplänen entfernen
    let entfernt = 0;
    Object.keys(daten.plan).forEach(function (datum) {
        const vorher = daten.plan[datum].length;
        daten.plan[datum] = daten.plan[datum].filter(function (e) { return e.lebensmittelId !== lm.id; });
        entfernt += vorher - daten.plan[datum].length;
        if (daten.plan[datum].length === 0) delete daten.plan[datum];
    });
    daten.lebensmittel = daten.lebensmittel.filter(function (x) { return x.id !== lm.id; });
    if (istAdmin() && lm.id.indexOf("g-") === 0) gemeinsamEntfernen(lm.id); // Admin: für alle löschen

    speichern();
    schliesseFenster("dialogAktionen");
    allesZeichnen();
    zeigeMeldung(entfernt
        ? t("geloeschtPlan", { name: name, anzahl: entfernt })
        : t("geloescht", { name: name }));
}


// =====================================================
// 7. Formular: Lebensmittel anlegen & bearbeiten
// =====================================================

function oeffneFormular(id, vorgabeName) {
    bearbeiteId = id || null;
    const lm = id ? findeLebensmittel(id) : null;

    $("formularTitel").textContent = lm ? t("formBearbeiten") : t("formNeu");
    $("formularSpeichern").textContent = lm ? t("speichernAend") : t("speichernNeu");
    $("formularFehler").textContent = "";

    $("eingabeName").value = lm ? anzeigeName(lm) : (vorgabeName || "");
    $("eingabeMenge").value = "100";
    $("eingabeKcal").value = lm && lm.kcal100 ? feldWert(lm.kcal100) : "";
    $("eingabeProtein").value = lm && lm.protein100 ? feldWert(lm.protein100) : "";
    $("eingabeKh").value = lm && lm.kh100 ? feldWert(lm.kh100) : "";
    $("eingabeFett").value = lm && lm.fett100 ? feldWert(lm.fett100) : "";

    setzeFormularFoto(lm ? lm.foto : null);
    $("fotoInput").value = "";
    gemeinsamSchalterSetzen("formGemeinsamBox", "formGemeinsam", lm);

    oeffneFenster("dialogFormular");
    if (!lm && window.matchMedia("(min-width: 900px)").matches) $("eingabeName").focus();
}

function setzeFormularFoto(foto) {
    formularFoto = foto || null;
    const feld = $("formFotoFeld");
    if (formularFoto) {
        $("fotoVorschau").src = formularFoto;
        feld.classList.add("hat-foto");
    } else {
        $("fotoVorschau").removeAttribute("src");
        feld.classList.remove("hat-foto");
    }
    $("fotoEntfernen").hidden = !formularFoto;
}

// Verkleinert ein Foto auf 320 × 320 px (quadratisch zugeschnitten),
// damit es wenig Speicherplatz braucht
function fotoVerkleinern(datei) {
    return new Promise(function (fertig, fehler) {
        const adresse = URL.createObjectURL(datei);
        const bild = new Image();
        bild.onload = function () {
            const seite = Math.min(bild.width, bild.height);
            const ziel = Math.min(320, seite);
            const leinwand = document.createElement("canvas");
            leinwand.width = ziel;
            leinwand.height = ziel;
            leinwand.getContext("2d").drawImage(
                bild,
                (bild.width - seite) / 2, (bild.height - seite) / 2, seite, seite,
                0, 0, ziel, ziel
            );
            URL.revokeObjectURL(adresse);
            fertig(leinwand.toDataURL("image/jpeg", 0.8));
        };
        bild.onerror = function () {
            URL.revokeObjectURL(adresse);
            fehler(new Error("Bild konnte nicht gelesen werden"));
        };
        bild.src = adresse;
    });
}

function formularMengeAendern(schritt) {
    const aktuell = zahl($("eingabeMenge").value);
    const neu = Math.max(10, (aktuell > 0 ? aktuell : 100) + schritt);
    $("eingabeMenge").value = feldWert(neu);
}

function formularSpeichern() {
    const fehler = $("formularFehler");
    const name = $("eingabeName").value.trim();
    const menge = zahl($("eingabeMenge").value);
    // Alle Werte sind freiwillig: leeres Feld = 0
    function wert(id) {
        const text = $(id).value.trim();
        return text === "" ? 0 : zahl(text);
    }
    const kcal = wert("eingabeKcal");
    const protein = wert("eingabeProtein");
    const kh = wert("eingabeKh");
    const fett = wert("eingabeFett");

    // Prüfen, bevor gespeichert wird (nur der Name ist Pflicht)
    if (!name) { fehler.textContent = t("fehlerName"); $("eingabeName").focus(); return; }
    if (!(menge > 0)) { fehler.textContent = t("fehlerMenge"); return; }
    if (!(kcal >= 0) || !(protein >= 0) || !(kh >= 0) || !(fett >= 0)) {
        fehler.textContent = t("fehlerZahlen");
        return;
    }

    // Auf 100 g umrechnen
    const faktor = 100 / menge;
    const werte = {
        kcal100: auf1Stelle(kcal * faktor),
        protein100: auf1Stelle(protein * faktor),
        kh100: auf1Stelle(kh * faktor),
        fett100: auf1Stelle(fett * faktor),
        foto: formularFoto
    };

    if (werte.protein100 > 100 || werte.kh100 > 100 || werte.fett100 > 100) {
        fehler.textContent = t("fehlerUnmoeglich");
        return;
    }

    let lm;
    if (bearbeiteId) {
        lm = findeLebensmittel(bearbeiteId);
        // Hat jemand die Werte eines Start-Lebensmittels selbst geändert? Dann nie mehr überschreiben.
        if (lm.kcal100 !== werte.kcal100 || lm.protein100 !== werte.protein100 ||
            lm.kh100 !== werte.kh100 || lm.fett100 !== werte.fett100) {
            lm.eigeneWerte = true;
        }
        Object.assign(lm, werte);
        // Wurde ein Start-Lebensmittel umbenannt? Dann gilt ab jetzt nur noch der eigene Name.
        if (name !== anzeigeName(lm)) {
            lm.name = name;
            delete lm.namen;
            lm.eigenerName = true;
        }
    } else {
        lm = Object.assign({
            id: neueId(),
            name: name,
            emoji: "🍽️",
            favorit: false,
            eigenes: true,
            zuletzt: Date.now(),
            letzteGramm: menge
        }, werte);
        daten.lebensmittel.push(lm);
    }

    rezepteNeuBerechnen(); // geänderte Zutat → Rezepte rechnen neu

    if (!speichern()) {
        // Speicher voll: Änderung rückgängig, damit nichts Halbes zurückbleibt
        daten = datenLaden();
        fehler.textContent = t("fehlerVoll");
        return;
    }

    schliesseFenster("dialogFormular");
    allesZeichnen();
    zeigeMeldung(bearbeiteId ? t("aenderungen") : t("gespeichert", { name: name }));

    if (!bearbeiteId && nachFormularSpeichern) nachFormularSpeichern(lm);
    nachFormularSpeichern = null;
    // Admin: auch für alle in der App speichern
    if (istAdmin() && $("formGemeinsam").checked) gemeinsamTeilen(lm);
}


// =====================================================
// 7b. Rezepte
// =====================================================
// Ein Rezept ist ein Lebensmittel mit einer Zutatenliste:
// rezept: { zutaten: [ { lebensmittelId, gramm } ], gewichtFertig, portionen }
// Die Werte pro 100 g rechnet die App aus den Zutaten aus.
// Wohnhaus-Bild: Ein Rezept ist eine WG – mehrere Mieter (Zutaten) teilen sich eine Wohnung.

// Zählt alle Zutaten zusammen: Gewicht und Nährwerte
function rezeptSumme(zutaten) {
    const summe = { gramm: 0, kcal: 0, protein: 0, kh: 0, fett: 0 };
    zutaten.forEach(function (zutat) {
        const lm = findeLebensmittel(zutat.lebensmittelId);
        if (!lm) return;
        const werte = werteFuer(lm, zutat.gramm);
        summe.gramm += zutat.gramm;
        summe.kcal += werte.kcal;
        summe.protein += werte.protein;
        summe.kh += werte.kh;
        summe.fett += werte.fett;
    });
    return summe;
}

// Werte pro 100 g des fertigen Gerichts.
// Beispiel: Brot mit 1.000 g Zutaten (2.400 kcal), fertig gebacken 850 g → 282 kcal pro 100 g
function rezeptWerte100(rezept) {
    const summe = rezeptSumme(rezept.zutaten);
    const gewicht = rezept.gewichtFertig > 0 ? rezept.gewichtFertig : summe.gramm;
    if (!(gewicht > 0)) return null;
    const faktor = 100 / gewicht;
    return {
        kcal100: auf1Stelle(summe.kcal * faktor),
        protein100: auf1Stelle(summe.protein * faktor),
        kh100: auf1Stelle(summe.kh * faktor),
        fett100: auf1Stelle(summe.fett * faktor),
        gewicht: gewicht
    };
}

// Rechnet alle Rezepte neu (z. B. wenn eine Zutat bearbeitet wurde)
function rezepteNeuBerechnen() {
    daten.lebensmittel.forEach(function (lm) {
        if (!lm.rezept) return;
        const werte = rezeptWerte100(lm.rezept);
        if (!werte) return;
        lm.kcal100 = werte.kcal100;
        lm.protein100 = werte.protein100;
        lm.kh100 = werte.kh100;
        lm.fett100 = werte.fett100;
    });
}

function oeffneRezept(id) {
    const lm = id ? findeLebensmittel(id) : null;
    rezeptEntwurf = {
        id: lm ? lm.id : null,
        zutaten: lm ? lm.rezept.zutaten.map(function (z) { return { lebensmittelId: z.lebensmittelId, gramm: z.gramm }; }) : []
    };
    $("rezeptTitel").textContent = lm ? t("rezeptBearbeiten") : t("rezeptNeu");
    $("rezeptName").value = lm ? anzeigeName(lm) : "";
    $("rezeptGewicht").value = lm && lm.rezept.gewichtFertig ? feldWert(lm.rezept.gewichtFertig) : "";
    $("rezeptPortionen").value = lm && lm.rezept.portionen ? String(lm.rezept.portionen) : "";
    $("rezeptAnleitung").value = lm ? anzeigeAnleitung(lm) : "";
    $("rezeptFehler").textContent = "";
    setzeRezeptFoto(lm ? lm.foto : null);
    $("rezeptFotoInput").value = "";
    gemeinsamSchalterSetzen("rezeptGemeinsamBox", "rezeptGemeinsam", lm);
    zeichneRezept();
    oeffneFenster("dialogRezept");
}

function setzeRezeptFoto(foto) {
    rezeptEntwurf.foto = foto || null;
    const feld = $("rezeptFotoFeld");
    if (rezeptEntwurf.foto) {
        $("rezeptFotoVorschau").src = rezeptEntwurf.foto;
        feld.classList.add("hat-foto");
    } else {
        $("rezeptFotoVorschau").removeAttribute("src");
        feld.classList.remove("hat-foto");
    }
}

// Zeichnet die Zutatenliste und die Summen im Rezept-Fenster
function zeichneRezept() {
    const liste = $("rezeptZutaten");
    liste.innerHTML = "";
    liste.dataset.leer = t("keineZutaten");

    rezeptEntwurf.zutaten.forEach(function (zutat, nummer) {
        const lm = findeLebensmittel(zutat.lebensmittelId);
        if (!lm) return;
        const name = anzeigeName(lm);
        const werte = werteFuer(lm, zutat.gramm);

        const zeile = el("div", "eintrag");
        zeile.appendChild(bildElement(lm, "klein"));
        const info = el("div", "eintrag-info");
        info.appendChild(el("div", "eintrag-name", name));
        info.appendChild(el("div", "eintrag-werte",
            "🔥 " + format(werte.kcal) + " kcal · 💪 " + format(werte.protein, 1) + " g"));

        const steuerung = el("div", "menge-steuerung");
        const minus = el("button", "rund minus", "−");
        minus.type = "button";
        minus.setAttribute("aria-label", t("weniger") + " " + name);
        const feld = el("label", "menge-wert");
        const eingabe = el("input");
        eingabe.type = "text";
        eingabe.inputMode = "decimal";
        eingabe.value = feldWert(zutat.gramm);
        eingabe.setAttribute("aria-label", t("grammVon", { name: name }));
        feld.appendChild(eingabe);
        feld.appendChild(el("span", "", "g"));
        const plus = el("button", "rund plus", "+");
        plus.type = "button";
        plus.setAttribute("aria-label", t("mehr") + " " + name);
        steuerung.appendChild(minus);
        steuerung.appendChild(feld);
        steuerung.appendChild(plus);
        info.appendChild(steuerung);
        zeile.appendChild(info);

        const entfernen = el("button", "eintrag-entfernen", "✕");
        entfernen.type = "button";
        entfernen.setAttribute("aria-label", t("entfernen", { name: name }));
        zeile.appendChild(entfernen);

        function setzeGramm(neu) {
            if (!(neu > 0)) neu = zutat.gramm > 10 ? zutat.gramm : 10;
            zutat.gramm = Math.min(Math.round(neu * 10) / 10, 10000);
            zeichneRezept();
        }
        minus.addEventListener("click", function () { setzeGramm(zutat.gramm - 10); });
        plus.addEventListener("click", function () { setzeGramm(zutat.gramm + 10); });
        eingabe.addEventListener("change", function () { setzeGramm(zahl(eingabe.value)); });
        eingabe.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); eingabe.blur(); } });
        entfernen.addEventListener("click", function () {
            rezeptEntwurf.zutaten.splice(nummer, 1);
            zeichneRezept();
        });

        liste.appendChild(zeile);
    });

    zeichneRezeptSumme();
}

function zeichneRezeptSumme() {
    const box = $("rezeptSumme");
    box.innerHTML = "";
    if (rezeptEntwurf.zutaten.length === 0) return;

    const summe = rezeptSumme(rezeptEntwurf.zutaten);
    $("rezeptGewicht").placeholder = feldWert(summe.gramm);

    const rezept = {
        zutaten: rezeptEntwurf.zutaten,
        gewichtFertig: zahl($("rezeptGewicht").value) > 0 ? zahl($("rezeptGewicht").value) : 0
    };
    const pro100 = rezeptWerte100(rezept);

    box.appendChild(el("div", "", t("rezeptGesamt", {
        gramm: format(summe.gramm), kcal: format(summe.kcal), protein: format(summe.protein)
    })));
    if (pro100) {
        const zeile = el("b", "", t("rezeptPro100", {
            kcal: format(pro100.kcal100), protein: kurz(pro100.protein100),
            kh: kurz(pro100.kh100), fett: kurz(pro100.fett100)
        }));
        box.appendChild(zeile);

        const portionen = Math.round(zahl($("rezeptPortionen").value));
        if (portionen > 1) {
            const portion = pro100.gewicht / portionen;
            box.appendChild(el("div", "", t("rezeptProPortion", {
                gramm: format(portion), kcal: format(pro100.kcal100 * portion / 100),
                protein: format(pro100.protein100 * portion / 100, 1)
            })));
        }
    }
}

// ---------- Kochbuch-Ansicht ----------
let ansichtId = null;

function oeffneAnsicht(id) {
    const lm = findeLebensmittel(id);
    if (!lm || !lm.rezept) return;
    ansichtId = id;
    const rezept = lm.rezept;
    const summe = rezeptSumme(rezept.zutaten);
    const gewicht = rezept.gewichtFertig > 0 ? rezept.gewichtFertig : summe.gramm;
    const portionen = rezept.portionen > 0 ? rezept.portionen : 1;
    const portion = gewicht / portionen;
    const w = werteFuer(lm, portion);

    $("ansichtTitel").textContent = anzeigeName(lm);
    const bild = $("ansichtBild");
    bild.innerHTML = "";
    bild.appendChild(bildElement(lm, "gross"));

    $("ansichtPortion").textContent = t("portionInfo", { portionen: portionen, gramm: format(portion) });
    const werteBox = $("ansichtWerte");
    werteBox.innerHTML = "";
    ["🔥 " + format(w.kcal) + " kcal", "💪 " + format(w.protein, 1) + " g", "🌾 " + format(w.kh, 1) + " g", "💧 " + format(w.fett, 1) + " g"]
        .forEach(function (text) { werteBox.appendChild(el("span", "", text)); });
    $("ansicht100").textContent = t("pro100Kurz", { kcal: format(lm.kcal100), protein: kurz(lm.protein100) });

    const liste = $("ansichtZutaten");
    liste.innerHTML = "";
    rezept.zutaten.forEach(function (zutat) {
        const zutatLm = findeLebensmittel(zutat.lebensmittelId);
        const zeile = el("li");
        zeile.appendChild(el("span", "", zutatLm ? (zutatLm.emoji || "🍽️") : "❔"));
        zeile.appendChild(el("span", "menge", format(zutat.gramm, 1) + " g"));
        if (zutatLm) {
            zeile.appendChild(el("span", "", anzeigeName(zutatLm)));
        } else {
            zeile.appendChild(el("span", "fehlt", t("fehlendeZutat")));
        }
        liste.appendChild(zeile);
    });

    // Rezept von einem Creator? Dann Link zu seinem Profil
    const creatorLink = $("ansichtCreator");
    const creator = lm.influencer ? findeCreator(lm.influencer) : null;
    creatorLink.hidden = !creator;
    if (creator) {
        creatorLink.textContent = t("vonCreator", { handle: creator.handle }) + " →";
        creatorLink.onclick = function () {
            schliesseFenster("dialogAnsicht");
            oeffneCreator(creator.id);
        };
    }

    const anleitung = anzeigeAnleitung(lm);
    const anleitungBox = $("ansichtAnleitung");
    anleitungBox.textContent = anleitung || t("keineAnleitung");
    anleitungBox.classList.toggle("leer-text", !anleitung);

    $("ansichtPlanText").textContent = aktuellesDatum === heuteAlsText()
        ? t("planHeute")
        : t("planDatum", { datum: datumBeschriftung(aktuellesDatum) });
    const knoepfe = $("ansichtMahlzeiten");
    knoepfe.innerHTML = "";
    const knopf = el("button", "knopf-primaer", t("zuMeinemTag"));
    knopf.type = "button";
    knopf.addEventListener("click", function () {
        eintragHinzufuegen(id);
        schliesseFenster("dialogAnsicht");
    });
    knoepfe.appendChild(knopf);

    oeffneFenster("dialogAnsicht");
    $("dialogAnsicht").scrollTop = 0;
}

// =====================================================
// 7c. Creators (Influencer)
// =====================================================
// Die Creator stehen in influencer.js, ihre Rezepte in startdaten.js (influencer: "<id>").
// Wohnhaus-Bild: Creators sind die Promi-Mieter mit eigenem Schaufenster ganz oben im Haus.

function findeCreator(id) {
    return INFLUENCER.find(function (c) { return c.id === id; }) || null;
}

function creatorGesehen() {
    if (!daten.einstellungen.creatorGesehen) daten.einstellungen.creatorGesehen = {};
    return daten.einstellungen.creatorGesehen;
}

// Hat der Creator etwas Neues, das man noch nicht angeschaut hat?
function creatorIstNeu(creator) {
    return creatorGesehen()[creator.id] !== creator.stand;
}

// Rezepte eines Creators, sortiert nach Mahlzeit (Frühstück zuerst)
function creatorRezepte(id) {
    return daten.lebensmittel
        .filter(function (lm) { return lm.influencer === id && lm.rezept; })
        .sort(function (a, b) { return MAHLZEITEN.indexOf(a.mahlzeit) - MAHLZEITEN.indexOf(b.mahlzeit); });
}

// Story-Kreise oben: Neues zuerst (leuchtender Ring), dann die zuletzt aktualisierten
function zeichneStories() {
    const leiste = $("storyLeiste");
    leiste.innerHTML = "";
    INFLUENCER.slice()
        .sort(function (a, b) {
            if (Boolean(a.fixiert) !== Boolean(b.fixiert)) return a.fixiert ? -1 : 1; // Ivy immer zuerst
            const neuA = creatorIstNeu(a), neuB = creatorIstNeu(b);
            if (neuA !== neuB) return neuA ? -1 : 1;
            return b.aktualisiert.localeCompare(a.aktualisiert);
        })
        .forEach(function (creator) {
            const knopf = el("button", "story" + (creatorIstNeu(creator) ? " neu" : ""));
            knopf.type = "button";
            knopf.dataset.creator = creator.id;
            knopf.setAttribute("aria-label", t("storyOeffnen", { name: creator.name }));
            const ring = el("span", "story-ring");
            ring.appendChild(creatorBild(creator));
            knopf.appendChild(ring);
            if (creatorIstNeu(creator)) knopf.appendChild(el("span", "story-neu", t("creatorNeu")));
            knopf.appendChild(el("span", "story-name", creator.handle));
            knopf.addEventListener("click", function () { oeffneCreator(creator.id); });
            leiste.appendChild(knopf);
        });

    // Platzhalter: hier kommen weitere Creator hin
    const bald = el("div", "story bald");
    const ring = el("span", "story-ring", "＋");
    bald.appendChild(ring);
    bald.appendChild(el("span", "story-name", t("baldMehr")));
    leiste.appendChild(bald);
}

// Porträt – oder Initialen, solange noch kein Foto da ist
function creatorBild(creator) {
    if (creator.foto) {
        const bild = el("img");
        bild.src = creator.foto;
        bild.alt = "";
        return bild;
    }
    const initialen = creator.name.split(" ").map(function (teil) { return teil.charAt(0); }).join("").slice(0, 2).toUpperCase();
    return el("span", "creator-initialen", initialen);
}

function oeffneCreator(id) {
    const creator = findeCreator(id);
    if (!creator) return;

    $("creatorName").textContent = creator.name;
    const fotoBox = $("creatorFoto");
    fotoBox.innerHTML = "";
    fotoBox.appendChild(creatorBild(creator));
    fotoBox.setAttribute("aria-label", creator.name);
    $("creatorTitel").textContent = creator.titel[sprache] || creator.titel.en;
    $("creatorHandle").textContent = "@" + creator.handle;
    $("creatorInstagram").href = creator.instagram;
    $("creatorInstagram").setAttribute("aria-label", t("instagram") + ": @" + creator.handle);

    const bio = $("creatorBio");
    bio.innerHTML = "";
    (creator.bio[sprache] || creator.bio.en).forEach(function (zeile) { bio.appendChild(el("li", "", zeile)); });

    const codes = $("creatorCodes");
    codes.innerHTML = "";
    (creator.codes || []).forEach(function (eintrag) {
        const knopf = el("button");
        knopf.type = "button";
        knopf.appendChild(document.createTextNode(eintrag.marke + " · "));
        knopf.appendChild(el("b", "", eintrag.code));
        knopf.addEventListener("click", function () {
            // Kopieren klappt nicht in jedem Browser – dann bleibt der Code einfach sichtbar
            try {
                navigator.clipboard.writeText(eintrag.code).then(function () {
                    zeigeMeldung(t("codeKopiert", { code: eintrag.code }));
                }).catch(function () {});
            } catch (fehler) { /* nichts tun */ }
        });
        codes.appendChild(knopf);
    });
    $("creatorCodesBox").hidden = !(creator.codes && creator.codes.length);

    $("creatorRezepteTitel").textContent = t("creatorRezepte", { name: creator.name });
    const liste = $("creatorRezepte");
    liste.innerHTML = "";
    const rezepte = creatorRezepte(id);
    if (rezepte.length === 0) liste.appendChild(el("p", "leer", t("rezepteFolgen")));
    rezepte.forEach(function (lm) {
        const portion = lm.letzteGramm || 100;
        const karte = el("button", "lm-karte");
        karte.type = "button";
        karte.appendChild(bildElement(lm));
        const info = el("div", "lm-info");
        info.appendChild(el("div", "lm-name", anzeigeName(lm)));
        info.appendChild(el("div", "lm-werte umbruch", t("creatorKarte", {
            mahlzeit: t(lm.mahlzeit || "snack"),
            kcal: format(lm.kcal100 * portion / 100),
            protein: format(lm.protein100 * portion / 100)
        })));
        karte.appendChild(info);
        karte.appendChild(el("span", "knopf-icon klein", "›"));
        karte.addEventListener("click", function () {
            schliesseFenster("dialogCreator");
            oeffneAnsicht(lm.id);
        });
        liste.appendChild(karte);
    });

    // Profil angeschaut → Kreis leuchtet nicht mehr, bis etwas Neues kommt
    if (creatorIstNeu(creator)) {
        creatorGesehen()[creator.id] = creator.stand;
        speichern();
        zeichneStories();
    }
    oeffneFenster("dialogCreator");
    $("dialogCreator").scrollTop = 0;
}

// Zutat-Auswahl öffnen (dasselbe Fenster wie beim Tagesplan, nur im Rezept-Modus)
function oeffneZutatAuswahl() {
    auswahlModus = "rezept";
    $("auswahlTitel").textContent = t("zutatTitel");
    $("auswahlSuche").value = "";
    zeichneAuswahl();
    oeffneFenster("dialogAuswahl");
}

function zutatHinzufuegen(lebensmittelId) {
    if (!rezeptEntwurf) return;
    const lm = findeLebensmittel(lebensmittelId);
    if (!lm) return;
    const schonDa = rezeptEntwurf.zutaten.find(function (z) { return z.lebensmittelId === lebensmittelId; });
    if (schonDa) {
        schonDa.gramm += 100;
    } else {
        rezeptEntwurf.zutaten.push({ lebensmittelId: lebensmittelId, gramm: 100 });
    }
    zeichneRezept();
    zeigeMeldung(t("zutatHinzugefuegt", { name: anzeigeName(lm) }));
}

function rezeptSpeichern() {
    const fehler = $("rezeptFehler");
    const name = $("rezeptName").value.trim();
    const gewichtText = $("rezeptGewicht").value.trim();
    const gewicht = gewichtText === "" ? 0 : zahl(gewichtText);
    const portionen = Math.max(1, Math.round(zahl($("rezeptPortionen").value)) || 1);

    if (!name) { fehler.textContent = t("fehlerRezeptName"); $("rezeptName").focus(); return; }
    if (rezeptEntwurf.zutaten.length === 0) { fehler.textContent = t("fehlerZutaten"); return; }
    if (gewichtText !== "" && !(gewicht > 0)) { fehler.textContent = t("fehlerGewicht"); return; }

    const rezept = {
        zutaten: rezeptEntwurf.zutaten,
        gewichtFertig: gewicht > 0 ? Math.round(gewicht * 10) / 10 : 0,
        portionen: portionen
    };
    const werte = rezeptWerte100(rezept);
    if (!werte) { fehler.textContent = t("fehlerZutaten"); return; }

    // Vorgeschlagene Menge im Tagesplan = eine Portion
    const portionGramm = Math.round(werte.gewicht / portionen);

    let lm = rezeptEntwurf.id ? findeLebensmittel(rezeptEntwurf.id) : null;
    if (!lm) {
        lm = { id: neueId(), emoji: "🍳", favorit: false, eigenes: true };
        daten.lebensmittel.push(lm);
    }
    // Name nur ersetzen, wenn er geändert wurde (Start-Rezepte behalten sonst beide Sprachen)
    if (!lm.namen || name !== anzeigeName(lm)) {
        lm.name = name;
        if (lm.namen) lm.eigenerName = true;
        delete lm.namen;
    }
    const anleitungNeu = $("rezeptAnleitung").value.trim();
    if (anleitungNeu !== anzeigeAnleitung(lm)) {
        lm.anleitung = anleitungNeu;
        if (STARTDATEN_NACH_ID[lm.id]) lm.eigeneAnleitung = true;
    }
    // Ein bearbeitetes Start-Rezept wird von Datenbank-Updates nicht mehr überschrieben
    if (STARTDATEN_NACH_ID[lm.id]) lm.eigeneWerte = true;
    lm.foto = rezeptEntwurf.foto;
    lm.rezept = rezept;
    lm.kcal100 = werte.kcal100;
    lm.protein100 = werte.protein100;
    lm.kh100 = werte.kh100;
    lm.fett100 = werte.fett100;
    lm.letzteGramm = portionGramm;

    if (!speichern()) {
        daten = datenLaden();
        fehler.textContent = t("fehlerVoll");
        return;
    }

    schliesseFenster("dialogRezept");
    rezeptEntwurf = null;
    allesZeichnen();
    zeigeMeldung(t("rezeptGespeichert", { name: name }));
    if (istAdmin() && $("rezeptGemeinsam").checked) gemeinsamTeilen(lm);
}


// =====================================================
// 8. Einstellungen: Ziele, Sicherung
// =====================================================

function oeffneEinstellungen() {
    const z = daten.einstellungen;
    $("zielKcal").value = z.zielKcal;
    $("zielProtein").value = z.zielProtein;
    $("zielKh").value = z.zielKh;
    $("zielFett").value = z.zielFett;
    oeffneFenster("dialogEinstellungen");
}

function zieleSpeichern() {
    ["zielKcal", "zielProtein", "zielKh", "zielFett"].forEach(function (schluessel) {
        const wert = zahl($(schluessel).value);
        if (wert > 0) daten.einstellungen[schluessel] = Math.round(wert);
    });
    speichern();
    schliesseFenster("dialogEinstellungen");
    zeichneZusammenfassung();
    zeigeMeldung(t("zieleOk"));
}

function sicherungHerunterladen() {
    const text = JSON.stringify(zuKompakt(daten), null, 2); // kompakt = kleine Datei
    const datei = new Blob([text], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(datei);
    link.download = "mix-and-match-backup-" + heuteAlsText() + ".json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(link.href); }, 1000);
    zeigeMeldung(t("backupOk"));
}

function sicherungEinlesen(datei) {
    const leser = new FileReader();
    leser.onload = function () {
        const neu = datenAusImport(leser.result);
        if (!neu) {
            zeigeMeldung(t("backupFalsch"), true);
            return;
        }
        sicherheitskopieAnlegen();
        daten = neu;
        sprache = daten.einstellungen.sprache;
        speichern();
        schliesseFenster("dialogEinstellungen");
        allesZeichnen();
        zeigeMeldung(t("backupWieder", { anzahl: daten.lebensmittel.length }));
    };
    leser.readAsText(datei);
}


// =====================================================
// 9. Alles verbinden: Klicks, Eingaben, Start
// =====================================================

function tabWechseln(tab) {
    document.body.dataset.tab = tab;
    if (tab === "training" && typeof zeichneTraining === "function") zeichneTraining();
    if (tab === "profil") zeichneProfil();
    window.scrollTo(0, 0);
}

// Lebensmittel-Seite mit einem bestimmten Filter öffnen (Favoriten, Rezeptbuch)
function lebensmittelMitFilter(neuerFilter) {
    filter = neuerFilter;
    document.querySelectorAll(".chip[data-filter]").forEach(function (c) {
        c.classList.toggle("aktiv", c.dataset.filter === neuerFilter);
    });
    zeichneListe();
    tabWechseln("foods");
}

function verbinden() {
    // Tabs (Handy)
    document.querySelectorAll(".tab").forEach(function (knopf) {
        knopf.addEventListener("click", function () { tabWechseln(knopf.dataset.tab); });
    });

    $("iconFavoriten").addEventListener("click", function () { schnellUmschalten("favoriten"); });
    $("iconZuletzt").addEventListener("click", function () { schnellUmschalten("zuletzt"); });
    $("iconRezepte").addEventListener("click", function () { lebensmittelMitFilter("rezepte"); });

    // Sprache
    document.querySelectorAll(".sprachwahl button").forEach(function (knopf) {
        knopf.addEventListener("click", function () { spracheWechseln(knopf.dataset.sprache); });
    });

    // Suche & Filter
    $("suche").addEventListener("input", function () {
        suchtext = $("suche").value;
        zeichneListe();
    });
    document.querySelectorAll(".chip[data-filter]").forEach(function (chip) {
        chip.addEventListener("click", function () {
            filter = chip.dataset.filter;
            document.querySelectorAll(".chip[data-filter]").forEach(function (c) {
                c.classList.toggle("aktiv", c === chip);
            });
            insBildRuecken(chip);
            zeichneListe();
        });
    });

    // Neues Lebensmittel
    $("knopfNeu").addEventListener("click", function () { oeffneFenster("dialogNeu"); });
    $("knopfNeuKlein").addEventListener("click", function () { oeffneFenster("dialogNeu"); });
    $("neuLebensmittel").addEventListener("click", function () {
        schliesseFenster("dialogNeu");
        oeffneFormular(null);
    });
    $("neuUebung").addEventListener("click", function () {
        schliesseFenster("dialogNeu");
        oeffneSport();
        oeffneBloecke("einzeln");
    });
    $("neuSession").addEventListener("click", function () {
        schliesseFenster("dialogNeu");
        oeffneSport();
        oeffneBloecke("session");
    });
    $("neuRezept").addEventListener("click", function () {
        schliesseFenster("dialogNeu");
        oeffneRezept(null);
    });

    // Barcode-Scanner
    $("neuScan").addEventListener("click", function () {
        schliesseFenster("dialogNeu");
        oeffneScanner(nachScanImListe);
    });
    $("knopfScan").addEventListener("click", function (e) {
        e.preventDefault(); // Knopf sitzt im Such-Label
        oeffneScanner(nachScanImListe);
    });
    $("auswahlScan").addEventListener("click", function (e) {
        e.preventDefault();
        oeffneScanner(function (lm) { allesZeichnen(); auswahlWaehlen(lm); });
    });
    scannerVerbinden();

    // Suchleiste oben in "Mein Tag"
    $("tagSuche").addEventListener("input", function () {
        zeichneTagTreffer();
        zeichneSchnellwahl();
    });
    $("tagSuche").addEventListener("keydown", function (e) {
        // Enter = ersten Treffer eintragen
        if (e.key === "Enter") {
            e.preventDefault();
            const vorgabe = mengeAusText($("tagSuche").value);
            const erster = gefilterteLebensmittel(vorgabe.such, "alle")[0];
            if (erster && vorgabe.such.trim()) {
                if (vorgabe.menge) tagSucheFertig(erster, mengeInGramm(erster, vorgabe.menge, vorgabe.stueck), vorgabe.stueck ? "stueck" : "g");
                else tagSucheFertig(erster);
            }
        }
        if (e.key === "Escape") { $("tagSuche").value = ""; zeichneTagTreffer(); zeichneSchnellwahl(); }
    });
    $("tagScan").addEventListener("click", function (e) {
        e.preventDefault();
        oeffneScanner(function (lm) { allesZeichnen(); eintragHinzufuegen(lm.id); });
    });
    $("knopfSport").addEventListener("click", function () { oeffneSport(); });
    wischLeistenEinrichten(); // Filter-Leisten: weiche Kante + gewählter Knopf ins Bild
    appAnleitungVerbinden(); // 📲 "Als App speichern"
    spracheKnoepfeEinbauen(); // 🎤 in allen Suchfeldern (js/sprache-eingabe.js)
    sportVerbinden();
    kontoVerbinden();

    // Kochbuch-Ansicht
    $("ansichtBearbeiten").addEventListener("click", function () {
        schliesseFenster("dialogAnsicht");
        oeffneRezept(ansichtId);
    });
    $("ansichtMehr").addEventListener("click", function () {
        schliesseFenster("dialogAnsicht");
        oeffneAktionen(ansichtId);
    });

    // Rezept-Fenster
    $("formRezept").addEventListener("submit", function (ereignis) {
        ereignis.preventDefault();
        rezeptSpeichern();
    });
    $("formRezept").addEventListener("input", function () { $("rezeptFehler").textContent = ""; });
    $("rezeptZutatHinzu").addEventListener("click", oeffneZutatAuswahl);
    $("rezeptGewicht").addEventListener("input", zeichneRezeptSumme);
    $("rezeptPortionen").addEventListener("input", zeichneRezeptSumme);
    $("rezeptFotoInput").addEventListener("change", function () {
        const datei = $("rezeptFotoInput").files[0];
        if (!datei) return;
        fotoVerkleinern(datei)
            .then(setzeRezeptFoto)
            .catch(function () { zeigeMeldung(t("fotoFehler"), true); });
    });

    // Datum
    $("tagZurueck").addEventListener("click", function () { tagWechseln(-1); });
    $("tagVor").addEventListener("click", function () { tagWechseln(1); });
    $("datumText").addEventListener("click", function () { tagWechseln(0); });

    // Formular
    $("formular").addEventListener("submit", function (ereignis) {
        ereignis.preventDefault();
        formularSpeichern();
    });
    $("formular").addEventListener("input", function () { $("formularFehler").textContent = ""; });
    $("formMinus").addEventListener("click", function () { formularMengeAendern(-10); });
    $("formPlus").addEventListener("click", function () { formularMengeAendern(10); });
    $("fotoEntfernen").addEventListener("click", function () { setzeFormularFoto(null); });
    $("fotoInput").addEventListener("change", function () {
        const datei = $("fotoInput").files[0];
        if (!datei) return;
        fotoVerkleinern(datei)
            .then(setzeFormularFoto)
            .catch(function () { zeigeMeldung(t("fotoFehler"), true); });
    });

    // Auswahl
    $("auswahlSuche").addEventListener("input", zeichneAuswahl);

    // Aktionen
    $("aktionFavorit").addEventListener("click", favoritUmschalten);
    $("aktionBearbeiten").addEventListener("click", function () {
        const id = aktionenId;
        const lm = findeLebensmittel(id);
        schliesseFenster("dialogAktionen");
        if (lm && lm.rezept) {
            oeffneRezept(id);
        } else {
            oeffneFormular(id);
        }
    });
    $("aktionLoeschen").addEventListener("click", lebensmittelLoeschen);

    // Einstellungen
    $("knopfEinstellungen").addEventListener("click", oeffneEinstellungen);
    $("formEinstellungen").addEventListener("submit", function (ereignis) {
        ereignis.preventDefault();
        zieleSpeichern();
    });
    $("knopfExport").addEventListener("click", sicherungHerunterladen);
    $("knopfImport").addEventListener("click", function () { $("importInput").click(); });
    $("importInput").addEventListener("change", function () {
        const datei = $("importInput").files[0];
        if (datei) sicherungEinlesen(datei);
        $("importInput").value = "";
    });

    // Alle Fenster: ✕-Knopf und Tippen auf den dunklen Hintergrund schließt
    document.querySelectorAll("dialog").forEach(function (fenster) {
        fenster.querySelectorAll("[data-schliessen]").forEach(function (knopf) {
            knopf.addEventListener("click", function () { fenster.close(); });
        });
        fenster.addEventListener("click", function (ereignis) {
            if (ereignis.target === fenster) fenster.close();
        });
    });

    // Um Mitternacht oder nach langer Pause: "Today" aktuell halten
    document.addEventListener("visibilitychange", function () {
        if (!document.hidden) zeichneZusammenfassung();
    });
}

// ---------- Start ----------
rezepteNeuBerechnen(); // falls sich Werte von Zutaten geändert haben (z. B. Datenbank-Korrektur)
verbinden();
gemeinsamAktualisieren(); // neue Lebensmittel/Rezepte "für alle" holen

// iPhone: Höhe des wirklich sichtbaren Bereichs merken (Tastatur offen → kleiner),
// damit Fenster nicht oben aus dem Bild rutschen
(function () {
    const vv = window.visualViewport;
    if (!vv) return;
    const setzen = function () {
        const wurzel = document.documentElement.style;
        wurzel.setProperty("--sichtbar", Math.round(vv.height) + "px");
        // Wie viel verdeckt die Tastatur unten? Fenster werden genau darüber gesetzt
        const verdeckt = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
        wurzel.setProperty("--tastatur", verdeckt + "px");
    };
    vv.addEventListener("resize", setzen);
    vv.addEventListener("scroll", setzen);
    setzen();
})();

// In Fenstern: Tippen oder Wischen außerhalb eines Eingabefelds klappt die Tastatur ein,
// damit man wieder scrollen und alles sehen kann
document.addEventListener("touchstart", function (e) {
    const aktiv = document.activeElement;
    if (!aktiv || !/^(INPUT|TEXTAREA|SELECT)$/.test(aktiv.tagName)) return;
    const ziel = e.target;
    if (ziel.closest && ziel.closest("input, textarea, select, label, .menge-steuerung")) return;
    if (!ziel.closest || !ziel.closest("dialog")) return;
    aktiv.blur();
}, { passive: true });

// Kein Zoomen mit zwei Fingern (iPhone-Safari ignoriert "user-scalable=no" sonst)
["gesturestart", "gesturechange", "gestureend"].forEach(function (art) {
    document.addEventListener(art, function (e) { e.preventDefault(); }, { passive: false });
});
// Kein Doppeltipp-Zoom (z. B. wenn man knapp neben − tippt)
(function () {
    let letzterTipp = 0;
    document.addEventListener("touchend", function (e) {
        const jetzt = Date.now();
        const ziel = e.target;
        // Knöpfe (+ / −) dürfen schnell hintereinander gedrückt werden – nur "leere" Flächen sind gesperrt
        const istEingabe = ziel && (ziel.tagName === "INPUT" || ziel.tagName === "TEXTAREA" || ziel.isContentEditable ||
            (ziel.closest && ziel.closest("button, a, label, select")));
        if (!istEingabe && jetzt - letzterTipp < 350) e.preventDefault();
        letzterTipp = jetzt;
    }, { passive: false });
})();

// Als Web-App: Notvorrat anlegen, damit sie auch offline startet (nicht in automatischen Tests)
if ("serviceWorker" in navigator && location.protocol === "https:" && !navigator.webdriver) {
    navigator.serviceWorker.register("sw.js", { updateViaCache: "none" }).then(function (reg) {
        // Beim Zurückkommen in die App auch den Service Worker auf Neues prüfen
        document.addEventListener("visibilitychange", function () { if (!document.hidden) reg.update().catch(function () {}); });
    }).catch(function () { /* egal */ });
}

// ---------- Automatisch aktualisieren ----------
// Das iPhone hält die App oft im Speicher und zeigt die alte Version.
// Darum fragt die App beim Start und bei jedem Zurückkommen: "Gibt es eine neuere Version?"
// (kleine Datei js/version.json). Wenn ja → neu laden – aber nur, wenn gerade nichts offen ist.
// Wohnhaus-Bild: der Blick in den Briefkasten beim Heimkommen.
let updateWartet = false;
function updateSicherMoeglich() {
    const offen = document.querySelector("dialog[open]");
    const tippt = document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
    return !offen && !tippt;
}
function updatePruefen() {
    if (!/^https?:$/.test(location.protocol)) return;
    fetch("js/version.json?t=" + Date.now(), { cache: "no-store" }).then(function (antwort) {
        return antwort.ok ? antwort.json() : null;
    }).then(function (info) {
        if (!info || !info.version || info.version === APP_VERSION) { updateWartet = false; return; }
        // Schutz vor Endlos-Neuladen: pro neuer Version höchstens 2 Versuche
        let versuche = 0;
        try { versuche = Number(sessionStorage.getItem("mmc_update_" + info.version)) || 0; } catch (e) { versuche = 0; }
        if (versuche >= 2) return;
        if (!updateSicherMoeglich()) { updateWartet = true; return; }
        try { sessionStorage.setItem("mmc_update_" + info.version, String(versuche + 1)); } catch (e) { /* egal */ }
        location.reload();
    }).catch(function () { /* offline – später nochmal */ });
}
updatePruefen();
document.addEventListener("visibilitychange", function () { if (!document.hidden) updatePruefen(); });
document.addEventListener("focusout", function () { if (updateWartet) setTimeout(updatePruefen, 500); });
document.querySelectorAll("dialog").forEach(function (d) { d.addEventListener("close", function () { if (updateWartet) updatePruefen(); }); });
allesZeichnen();

if (daten.alteUebernommen) {
    zeigeMeldung(t("alteDaten", { anzahl: daten.alteUebernommen }));
    delete daten.alteUebernommen;
    speichern();
}
