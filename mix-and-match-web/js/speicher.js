// =====================================================
// Speicher (gebaut vom Datenbank-Agent)
// =====================================================
// Das ist die EINZIGE Datei, die mit localStorage spricht.
// Wohnhaus-Bild: localStorage ist der Keller des Hauses. Nur dieser
// Hausmeister hat den Kellerschlüssel – alle anderen fragen ihn.
//
// Seit Version 3 wird KOMPAKT gespeichert (siehe zuKompakt unten): Die Start-Lebensmittel
// stehen ja schon im Code, also landen im Keller nur die eigenen Änderungen.
// Vorher wurde bei jedem Tipp die ganze Datenbank (über 80 KB) neu geschrieben – das war
// zu viel: Chrome hat solche großen, schnellen Schreibvorgänge manchmal verloren.
//
// Aufbau der Daten IM ARBEITSSPEICHER der App (siehe docs/datenmodell.md):
// {
//   version: 3,
//   lebensmittel: [ { id, name, namen: { en, de }, emoji, foto, kcal100, protein100,
//                     kh100, fett100, favorit, eigenes, letzteGramm, eigeneWerte?,
//                     rezept?: { zutaten: [ { lebensmittelId, gramm } ], gewichtFertig, portionen } } ],
//   plan: { "2026-10-25": [ { id, mahlzeit, lebensmittelId, gramm } ] },
//   einstellungen: { zielKcal, zielProtein, zielKh, zielFett, sprache },
//   bekannteStartIds: [ "start-oats", ... ]   // welche Start-Lebensmittel schon einmal geliefert wurden
// }
// Start-Lebensmittel haben "namen" in beiden Sprachen. Eigene Lebensmittel
// (und umbenannte Start-Lebensmittel) haben nur "name".

const SPEICHER_SCHLUESSEL = "mmc_daten";
const SPEICHER_VERSION = 3;
const ALTER_SCHLUESSEL = "lebensmittel"; // so hieß der Speicher in Ivys erster Version

// Erzeugt eine eindeutige Nummer (wie eine Türnummer) für neue Einträge
function neueId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// Welche Sprache spricht der Browser? Deutsch → "de", sonst "en"
function browserSprache() {
    try {
        return (navigator.language || "en").toLowerCase().indexOf("de") === 0 ? "de" : "en";
    } catch (fehler) {
        return "en";
    }
}

// Gewicht einer Portion eines Rezepts (fertiges Gewicht oder Summe der Zutaten ÷ Portionen)
function portionAusRezept(rezept) {
    const summe = rezept.zutaten.reduce(function (s, z) { return s + z.gramm; }, 0);
    const gewicht = rezept.gewichtFertig > 0 ? rezept.gewichtFertig : summe;
    return Math.round(gewicht / (rezept.portionen > 0 ? rezept.portionen : 1)) || 100;
}

// Macht aus einem Eintrag in STARTDATEN ein Lebensmittel für die Liste
function startLebensmittel(start) {
    return {
        id: start.id,
        name: start.en,
        namen: { en: start.en, de: start.de },
        emoji: start.emoji,
        foto: start.foto || null,
        kcal100: start.kcal100,
        protein100: start.protein100,
        kh100: start.kh100,
        fett100: start.fett100,
        marke: start.marke || null,
        laden: start.laden || null,
        influencer: start.influencer || undefined,
        mahlzeit: start.mahlzeit || undefined,
        rezept: start.rezept ? JSON.parse(JSON.stringify(start.rezept)) : undefined,
        anleitung: start.anleitung ? Object.assign({}, start.anleitung) : undefined,
        favorit: Boolean(start.favorit),
        eigenes: false,
        letzteGramm: start.rezept ? portionAusRezept(start.rezept) : (start.portion || 100)
    };
}

// Wie die Daten aussehen, wenn jemand die App zum allerersten Mal öffnet
function leereDaten() {
    return {
        version: SPEICHER_VERSION,
        lebensmittel: STARTDATEN.map(startLebensmittel),
        plan: {},
        einstellungen: { zielKcal: 2200, zielProtein: 160, zielKh: 250, zielFett: 80, sprache: browserSprache() },
        bekannteStartIds: STARTDATEN.map(function (start) { return start.id; })
    };
}

// Liest sicher aus dem Keller (manche Browser verbieten localStorage, z. B. im Privatmodus)
function kellerLesen(schluessel) {
    try {
        return localStorage.getItem(schluessel);
    } catch (fehler) {
        return null;
    }
}

function kellerSchreiben(schluessel, text) {
    try {
        localStorage.setItem(schluessel, text);
        return true;
    } catch (fehler) {
        return false; // meistens: Speicher voll
    }
}

// Lädt alle Daten. Gibt es noch nichts, werden Startdaten angelegt
// und – falls vorhanden – Ivys alte Lebensmittel übernommen.
function datenLaden() {
    const roh = kellerLesen(SPEICHER_SCHLUESSEL);
    let daten = null;

    if (roh) {
        try {
            daten = JSON.parse(roh);
        } catch (fehler) {
            // Kaputte Daten NIE einfach überschreiben: erst eine Sicherheitskopie ablegen
            kellerSchreiben(SPEICHER_SCHLUESSEL + "_kaputt_" + Date.now(), roh);
            daten = null;
        }
    }

    if (daten && daten.format === "kompakt") daten = vonKompakt(daten);

    if (!daten) {
        daten = leereDaten();
        altesFormatUebernehmen(daten);
    }

    daten = migrieren(daten);

    // Hat sich durch Anlegen, Übernahme oder Umstellung etwas geändert? Dann gleich in den Keller damit.
    const neu = JSON.stringify(zuKompakt(daten));
    if (neu !== roh) kellerSchreiben(SPEICHER_SCHLUESSEL, neu);

    return daten;
}

// Übernimmt Lebensmittel aus Ivys erster Version:
// [{ name: "Kartoffel", menge: "250", kalorien: "193", protein: "5" }]
// Dort galten die Werte für die eingegebene Menge – wir rechnen auf 100 g um.
// Der alte Speicher bleibt unangetastet liegen (nichts wird gelöscht).
function altesFormatUebernehmen(daten) {
    const roh = kellerLesen(ALTER_SCHLUESSEL);
    if (!roh) return 0;

    let alteListe;
    try {
        alteListe = JSON.parse(roh);
    } catch (fehler) {
        return 0;
    }
    if (!Array.isArray(alteListe)) return 0;

    let anzahl = 0;
    alteListe.forEach(function (alt) {
        if (!alt || !alt.name) return;
        const menge = textZuZahl(alt.menge) > 0 ? textZuZahl(alt.menge) : 100;
        const faktor = 100 / menge;
        daten.lebensmittel.push({
            id: neueId(),
            name: String(alt.name).trim(),
            emoji: "🍽️",
            foto: null,
            kcal100: auf1Stelle((textZuZahl(alt.kalorien) || 0) * faktor),
            protein100: auf1Stelle((textZuZahl(alt.protein) || 0) * faktor),
            kh100: 0,
            fett100: 0,
            favorit: false,
            eigenes: true,
            letzteGramm: menge
        });
        anzahl++;
    });
    daten.alteUebernommen = anzahl;
    return anzahl;
}

// Bringt Daten aus älteren App-Versionen auf den neuesten Stand.
// Fehlende Felder werden ergänzt, damit der Rest der App sich darauf verlassen kann.
function migrieren(daten) {
    if (!Array.isArray(daten.lebensmittel)) daten.lebensmittel = [];
    if (!daten.plan || typeof daten.plan !== "object") daten.plan = {};
    const standard = leereDaten().einstellungen;
    daten.einstellungen = Object.assign({}, standard, daten.einstellungen || {});

    daten.lebensmittel.forEach(function (lm) {
        if (!lm.id) lm.id = neueId();
        lm.kcal100 = Number(lm.kcal100) || 0;
        lm.protein100 = Number(lm.protein100) || 0;
        lm.kh100 = Number(lm.kh100) || 0;
        lm.fett100 = Number(lm.fett100) || 0;
        if (!lm.letzteGramm) lm.letzteGramm = 100;
    });

    if (daten.einstellungen.sprache !== "en" && daten.einstellungen.sprache !== "de") {
        daten.einstellungen.sprache = browserSprache();
    }

    // --- Version 1 → 2: Start-Lebensmittel bekommen Namen in zwei Sprachen ---
    // In Version 1 gab es noch keine Liste der gelieferten Start-Lebensmittel:
    // alles mit "seit: 1" wurde damals schon geliefert.
    if (!daten.version || daten.version < 2 || !Array.isArray(daten.bekannteStartIds)) {
        daten.bekannteStartIds = STARTDATEN
            .filter(function (start) { return start.seit === 1; })
            .map(function (start) { return start.id; });
    }

    daten.lebensmittel.forEach(function (lm) {
        const start = STARTDATEN_NACH_ID[lm.id];
        // Nur wenn die Person den Namen nicht selbst geändert hat
        if (start && !lm.eigenerName) {
            lm.namen = { en: start.en, de: start.de };
            lm.name = start.en;
        }
        if (start) {
            lm.marke = start.marke || null;
            lm.laden = start.laden || null;
            // Korrigierte Werte aus der Datenbank übernehmen – außer die Person hat sie selbst geändert
            if (!lm.eigeneWerte) {
                lm.kcal100 = start.kcal100;
                lm.protein100 = start.protein100;
                lm.kh100 = start.kh100;
                lm.fett100 = start.fett100;
                if (start.rezept) lm.rezept = JSON.parse(JSON.stringify(start.rezept));
            }
            if (start.anleitung && !lm.eigeneAnleitung) lm.anleitung = Object.assign({}, start.anleitung);
        }
    });

    // --- Neue Start-Lebensmittel nachliefern ---
    // Was die Person schon einmal bekommen (und vielleicht gelöscht) hat,
    // kommt nicht zurück. Nur wirklich neue Einträge werden ergänzt.
    STARTDATEN.forEach(function (start) {
        if (daten.bekannteStartIds.indexOf(start.id) !== -1) return;
        const schonDa = daten.lebensmittel.some(function (lm) { return lm.id === start.id; });
        if (!schonDa) daten.lebensmittel.push(startLebensmittel(start));
        daten.bekannteStartIds.push(start.id);
    });

    daten.version = SPEICHER_VERSION;
    return daten;
}

// Speichert alles (kompakt). Gibt false zurück, wenn der Speicher voll ist.
function datenSpeichern(daten) {
    return kellerSchreiben(SPEICHER_SCHLUESSEL, JSON.stringify(zuKompakt(daten)));
}

// ---------- Kompaktes Speicherformat ----------
// Wohnhaus-Bild: Statt jeden Abend das ganze Haus abzufotografieren, schreibt der
// Hausmeister nur auf, was sich gegenüber dem Bauplan (STARTDATEN) verändert hat.
//
// {
//   format: "kompakt", version: 3,
//   startVersion: 5,                       // alle Start-Lebensmittel bis "seit: 5" wurden geliefert
//   geloeschteStartIds: [ "start-banana" ],// selbst gelöschte Start-Lebensmittel
//   startAenderungen: { "start-oats": { favorit: true, letzteGramm: 80 } },
//   eigene: [ ...selbst angelegte Lebensmittel und Rezepte... ],
//   plan: { ... }, einstellungen: { ... }
// }

function istGleich(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
}

function zuKompakt(daten) {
    const vorhanden = {};
    const startAenderungen = {};
    const eigene = [];

    daten.lebensmittel.forEach(function (lm) {
        const start = STARTDATEN_NACH_ID[lm.id];
        if (!start) {
            eigene.push(lm);
            return;
        }
        vorhanden[lm.id] = true;
        // Nur speichern, was sich vom Bauplan unterscheidet
        const basis = startLebensmittel(start);
        const unterschied = {};
        Object.keys(lm).forEach(function (feld) {
            if (lm[feld] !== undefined && !istGleich(lm[feld], basis[feld])) unterschied[feld] = lm[feld];
        });
        Object.keys(basis).forEach(function (feld) {
            if (basis[feld] !== undefined && lm[feld] === undefined) unterschied[feld] = null; // Feld wurde entfernt
        });
        if (Object.keys(unterschied).length > 0) startAenderungen[lm.id] = unterschied;
    });

    const bekannte = daten.bekannteStartIds || [];
    let startVersion = 0;
    const geloeschteStartIds = [];
    bekannte.forEach(function (id) {
        const start = STARTDATEN_NACH_ID[id];
        if (!start) return;
        startVersion = Math.max(startVersion, start.seit);
        if (!vorhanden[id]) geloeschteStartIds.push(id);
    });

    const kompakt = {
        format: "kompakt",
        version: SPEICHER_VERSION,
        startVersion: startVersion,
        geloeschteStartIds: geloeschteStartIds,
        startAenderungen: startAenderungen,
        eigene: eigene,
        plan: daten.plan,
        einstellungen: daten.einstellungen
    };
    if (daten.alteUebernommen) kompakt.alteUebernommen = daten.alteUebernommen;
    return kompakt;
}

// Baut aus dem kompakten Format wieder die vollständigen Daten für die App
function vonKompakt(kompakt) {
    const geloescht = {};
    (kompakt.geloeschteStartIds || []).forEach(function (id) { geloescht[id] = true; });
    const aenderungen = kompakt.startAenderungen || {};
    const startVersion = kompakt.startVersion || 0;
    const lebensmittel = [];
    const bekannteStartIds = [];

    STARTDATEN.forEach(function (start) {
        if (start.seit > startVersion) return; // ganz neu → liefert migrieren() nach
        bekannteStartIds.push(start.id);
        if (geloescht[start.id]) return;
        const lm = startLebensmittel(start);
        const unterschied = aenderungen[start.id];
        if (unterschied) {
            Object.keys(unterschied).forEach(function (feld) {
                if (unterschied[feld] === null) delete lm[feld];
                else lm[feld] = unterschied[feld];
            });
        }
        lebensmittel.push(lm);
    });

    return {
        version: kompakt.version,
        lebensmittel: lebensmittel.concat(kompakt.eigene || []),
        plan: kompakt.plan || {},
        einstellungen: kompakt.einstellungen || {},
        bekannteStartIds: bekannteStartIds,
        alteUebernommen: kompakt.alteUebernommen
    };
}

// Legt vor einem Import eine Sicherheitskopie an
function sicherheitskopieAnlegen() {
    const roh = kellerLesen(SPEICHER_SCHLUESSEL);
    if (roh) kellerSchreiben(SPEICHER_SCHLUESSEL + "_sicherung", roh);
}

// Prüft eine importierte Datei und macht daraus gültige Daten (oder null)
function datenAusImport(text) {
    let objekt;
    try {
        objekt = JSON.parse(text);
    } catch (fehler) {
        return null;
    }
    if (objekt && objekt.format === "kompakt") objekt = vonKompakt(objekt);
    if (!objekt || !Array.isArray(objekt.lebensmittel)) return null;
    return migrieren(objekt);
}

// ---------- kleine Rechenhilfen ----------
function textZuZahl(text) {
    if (text === null || text === undefined) return NaN;
    return Number(String(text).replace(",", ".").trim());
}

function auf1Stelle(zahl) {
    return Math.round(zahl * 10) / 10;
}
