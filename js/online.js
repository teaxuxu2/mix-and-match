/* =====================================================
   Mix & Match Calories – Online-Suche (Open Food Facts)
   =====================================================
   Findet die App ein Produkt nicht in der eigenen Liste, kann man es
   online in der freien Datenbank Open Food Facts suchen (Millionen Produkte).
   Ein Tippen übernimmt das Produkt als eigenes Lebensmittel.

   Wohnhaus-Bild: Die eigene Liste ist der Keller im Haus. Die Online-Suche
   ist der Lieferdienst – er bringt fehlende Sachen aus dem großen Lager
   der Stadt (Open Food Facts) und stellt sie in deinen Keller.

   Zwei Wege:
   - Nur Ziffern (8–14 Stellen) = Strichcode → genau dieses Produkt holen
   - Sonst Text → Produktsuche; klappt der erste Dienst nicht, wird ein zweiter versucht
*/

const OFF_FELDER = "code,product_name,product_name_de,product_name_en,brands,nutriments,countries_tags";
const OFF_WARTEZEIT = 12000; // nach 12 Sekunden aufgeben

// Holt eine Adresse als JSON, bricht nach OFF_WARTEZEIT ab
function offHolen(adresse) {
    const abbruch = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timer = setTimeout(function () { if (abbruch) abbruch.abort(); }, OFF_WARTEZEIT);
    return fetch(adresse, abbruch ? { signal: abbruch.signal } : {})
        .then(function (antwort) {
            if (!antwort.ok) throw new Error("HTTP " + antwort.status);
            return antwort.json();
        })
        .finally(function () { clearTimeout(timer); });
}

// Suche über die Funktion off_suche in Supabase (siehe supabase/gemeinsam.sql)
function wolkeOffSuche(text, sprache) {
    if (typeof WOLKE_KONFIG === "undefined" || !WOLKE_KONFIG.url) return Promise.reject(new Error("keine Wolke"));
    const abbruch = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timer = setTimeout(function () { if (abbruch) abbruch.abort(); }, OFF_WARTEZEIT);
    return fetch(WOLKE_KONFIG.url + "/rest/v1/rpc/off_suche", {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: WOLKE_KONFIG.anonSchluessel, Authorization: "Bearer " + WOLKE_KONFIG.anonSchluessel },
        body: JSON.stringify({ suchtext: text, sprache: sprache }),
        signal: abbruch ? abbruch.signal : undefined
    }).then(function (antwort) {
        if (!antwort.ok) throw new Error("HTTP " + antwort.status);
        return antwort.json();
    }).then(function (treffer) {
        if (!Array.isArray(treffer) || !treffer.length) throw new Error("leer"); // nichts → anderen Weg probieren
        return treffer;
    }).finally(function () { clearTimeout(timer); });
}

// Macht aus einem Open-Food-Facts-Produkt ein einfaches Objekt – oder null, wenn Werte fehlen
function offProduktLesen(p) {
    if (!p) return null;
    const n = p.nutriments || {};
    let kcal = n["energy-kcal_100g"];
    if (typeof kcal !== "number" && typeof n.energy_100g === "number") kcal = n.energy_100g / 4.184; // kJ → kcal
    if (typeof kcal !== "number" || !(kcal >= 0) || kcal > 950) return null;

    const sprache = daten.einstellungen.sprache;
    const name = String((sprache === "de" ? p.product_name_de : p.product_name_en) || p.product_name ||
        p.product_name_de || p.product_name_en || "").trim();
    if (!name || !p.code) return null;

    const marken = (Array.isArray(p.brands) ? p.brands : String(p.brands || "").split(","))
        .map(function (m) { return String(m || "").trim(); }).filter(Boolean);
    function wert(v) { return typeof v === "number" && v >= 0 && v <= 100 ? auf1Stelle(v) : 0; }
    return {
        code: String(p.code),
        name: name.slice(0, 80),
        marke: (marken[0] || "").slice(0, 40),
        alleMarken: marken.join(" "),
        kcal100: Math.round(kcal),
        protein100: wert(n.proteins_100g),
        kh100: wert(n.carbohydrates_100g),
        fett100: wert(n.fat_100g),
        inOesterreich: (p.countries_tags || []).indexOf("en:austria") !== -1
    };
}

// Andere Wörter, unter denen Open Food Facts dasselbe kennt
// (z. B. heißt die Marke "More" dort "More Nutrition", Proteinpulver oft "Whey Protein")
const ONLINE_SYNONYME = [
    [/\bmore ?fit\b/, "more nutrition"],
    [/\bmore\b(?! nutrition)/, "more nutrition"],
    [/\b(protein ?pulver|eiweiss ?pulver|eiweiß ?pulver)\b/, "whey protein"],
    [/\bcevap\w*|\bcevape\b|\bćevap\w*/, "cevapcici"],
    [/\bdoner\b|\bdöner\b|\bdoener\b/, "kebab"]
];

// Ein Promise, das mit dem ersten NICHT-leeren Ergebnis fertig wird (sonst Fehler)
function erstesMitTreffern(versuche) {
    return new Promise(function (fertig, fehler) {
        let offen = versuche.length;
        let letzterFehler = null;
        if (!offen) { fehler(new Error("leer")); return; }
        versuche.forEach(function (v) {
            v.then(function (liste) {
                if (Array.isArray(liste) && liste.length) fertig(liste);
                else if (--offen === 0) letzterFehler ? fehler(letzterFehler) : fertig([]);
            }, function (f) {
                letzterFehler = f;
                if (--offen === 0) fehler(f);
            });
        });
    });
}

// Eine einzelne Textsuche über alle Wege (schnellster mit Treffern gewinnt)
function onlineTextSuche(such) {
    const woerter = such.split(/\s+/).map(function (w) { return w.replace(/[^\p{L}\p{N}%.,'-]/gu, ""); })
        .filter(Boolean);
    const q = woerter.join(" AND ");
    const sprache = daten.einstellungen.sprache === "de" ? "de,en" : "en,de";
    // 1. + 2. Weg gleichzeitig: unser Online-Speicher und die neue Suche von Open Food Facts
    return erstesMitTreffern([
        wolkeOffSuche(such, sprache),
        offHolen("https://search.openfoodfacts.org/search?q=" + encodeURIComponent(q) +
                "&langs=" + sprache + "&page_size=40&fields=" + OFF_FELDER)
            .then(function (j) { return j.hits || []; })
    ]).then(function (liste) {
        if (liste.length) return liste;
        throw new Error("leer");
    }).catch(function () {
        // Plan B: die klassische Suche von Open Food Facts
        return offHolen("https://world.openfoodfacts.org/cgi/search.pl?search_terms=" + encodeURIComponent(such) +
                "&search_simple=1&action=process&json=1&page_size=40&fields=" + OFF_FELDER)
            .then(function (j) { return j.products || []; });
    });
}

// Gemerkte Ergebnisse (10 Minuten) – spart Zeit und schont Open Food Facts (die sperren bei zu vielen Anfragen kurz)
const ONLINE_GEDAECHTNIS = {};
const ONLINE_MERKZEIT = 10 * 60 * 1000;

// Sucht online. Ergebnis: Promise mit einer Liste einfacher Produkte (Marken & Österreich zuerst)
function onlineSuchen(text) {
    const such = text.trim();
    const schluessel = such.toLowerCase();
    const gemerkt = ONLINE_GEDAECHTNIS[schluessel];
    if (gemerkt && Date.now() - gemerkt.zeit < ONLINE_MERKZEIT) return Promise.resolve(gemerkt.liste);

    let anfrage;
    const istCode = /^\d{8,14}$/.test(such);
    if (istCode) {
        // Strichcode: direkt das eine Produkt holen
        anfrage = offHolen("https://world.openfoodfacts.org/api/v2/product/" + such + ".json?fields=" + OFF_FELDER)
            .then(function (j) { return j && j.product ? [Object.assign({ code: such }, j.product)] : []; });
    } else {
        // Zusätzlich mit anderen Wörtern suchen (Morefit → More Nutrition, Proteinpulver → Whey Protein …)
        const klein = such.toLowerCase();
        let anders = klein;
        ONLINE_SYNONYME.forEach(function (paar) { anders = anders.replace(paar[0], paar[1]); });
        const suchen = [onlineTextSuche(such)];
        if (anders !== klein) suchen.push(onlineTextSuche(anders).catch(function () { return []; }));
        anfrage = Promise.all(suchen.map(function (s, i) {
            // die Hauptsuche darf scheitern, wenn die zweite etwas findet
            return i === 0 ? s.catch(function (f) { return { fehler: f }; }) : s;
        })).then(function (ergebnisse) {
            const haupt = ergebnisse[0];
            const zusatz = ergebnisse[1] || [];
            if (haupt && haupt.fehler) {
                if (zusatz.length) return zusatz;
                throw haupt.fehler;
            }
            return haupt.concat(zusatz);
        });
    }

    // klappt es nicht, nach kurzer Pause genau einmal nochmal (Server sind manchmal kurz überlastet)
    const mitWiederholung = anfrage.catch(function () {
        return new Promise(function (r) { setTimeout(r, 1500); }).then(function () {
            return istCode
                ? offHolen("https://world.openfoodfacts.org/api/v2/product/" + such + ".json?fields=" + OFF_FELDER)
                    .then(function (j) { return j && j.product ? [Object.assign({ code: such }, j.product)] : []; })
                : onlineTextSuche(such);
        });
    });

    return mitWiederholung.then(function (roh) {
        const liste = onlineSortieren(roh, such, istCode);
        ONLINE_GEDAECHTNIS[schluessel] = { zeit: Date.now(), liste: liste };
        return liste;
    });
}

// Passgenauigkeit bewerten, Doppelte & namenlose "No-Name"-Treffer aussortieren
function onlineSortieren(roh, such, istCode) {
    const gesehen = {};
    const suchWoerter = typeof suchNormal === "function" ? suchNormal(such).split(" ").filter(Boolean) : [];
    // auch die Synonyme zählen als Treffer ("morefit" passt zu "More Nutrition")
    let anders = such.toLowerCase();
    ONLINE_SYNONYME.forEach(function (paar) { anders = anders.replace(paar[0], paar[1]); });
    const andereWoerter = typeof suchNormal === "function" ? suchNormal(anders).split(" ").filter(Boolean) : [];

    function bewerten(woerter, text, textWoerter) {
        let punkte = 0, alle = true;
        woerter.forEach(function (w) { const x = wortPunkte(w, text, textWoerter); if (!x) alle = false; punkte += x; });
        return (alle ? 100 : 0) + punkte;
    }

    const liste = roh.map(offProduktLesen)
        .filter(function (p) {
            if (!p || gesehen[p.code]) return false;
            gesehen[p.code] = true;
            // gleiches Produkt unter anderer Nummer (gleicher Name, gleiche Marke, gleiche kcal) nur einmal
            const doppelt = (p.name + "|" + p.marke + "|" + p.kcal100).toLowerCase();
            if (gesehen[doppelt]) return false;
            gesehen[doppelt] = true;
            return true;
        })
        .map(function (p) {
            if (suchWoerter.length && !istCode) {
                const text = suchNormal(p.name + " " + p.alleMarken);
                const textWoerter = text.split(" ");
                p.punkte = Math.max(bewerten(suchWoerter, text, textWoerter),
                    andereWoerter.length ? bewerten(andereWoerter, text, textWoerter) : 0);
                // gesuchtes Wort steckt in der Marke (z. B. "more") → ganz nach oben
                if (p.alleMarken && suchWoerter.concat(andereWoerter).some(function (w) {
                    return w.length >= 3 && suchNormal(p.alleMarken).indexOf(w) !== -1;
                })) p.punkte += 30;
            } else {
                p.punkte = 0;
            }
            if (p.marke) p.punkte += 15;          // Produkte mit Marke sind fast immer brauchbarer
            if (p.inOesterreich) p.punkte += 5;   // in Österreich erhältlich
            return p;
        })
        .sort(function (a, b) { return b.punkte - a.punkte; });

    // Passen genug Produkte zu ALLEN Wörtern, die unpassenden weglassen
    const gute = liste.filter(function (x) { return x.punkte >= 100; });
    let ergebnis = gute.length >= 3 ? gute : liste;
    // Gibt es genug Markenprodukte, die ohne Marke ("Proteinpulver", sonst nichts) weglassen
    const mitMarke = ergebnis.filter(function (x) { return x.marke; });
    if (mitMarke.length >= 4) ergebnis = mitMarke;
    return ergebnis.slice(0, 25);
}

// Übernimmt ein Online-Produkt als Lebensmittel. Gibt es das schon (z. B. als Start-Produkt), wird das genommen.
function onlineUebernehmen(produkt) {
    const vorhanden = daten.lebensmittel.find(function (lm) {
        return lm.id === "off-" + produkt.code || lm.quelle === "openfoodfacts:" + produkt.code;
    });
    if (vorhanden) return vorhanden;

    const lm = {
        id: neueId(),
        name: produkt.name,
        emoji: "🛒",
        favorit: false,
        eigenes: true,
        letzteGramm: 100,
        kcal100: produkt.kcal100,
        protein100: produkt.protein100,
        kh100: produkt.kh100,
        fett100: produkt.fett100,
        quelle: "openfoodfacts:" + produkt.code
    };
    if (produkt.marke) lm.marke = produkt.marke;
    daten.lebensmittel.push(lm);
    if (!speichern()) {
        daten.lebensmittel.pop();
        zeigeMeldung(t("fehlerVoll"), true);
        return null;
    }
    return lm;
}

// Baut den Kasten "Nicht dabei? Online suchen" unter einer Trefferliste.
// beimUebernehmen(lm) wird aufgerufen, wenn jemand ein Produkt antippt.
// automatisch = true → gleich (nach kurzem Warten aufs Fertigtippen) selbst online suchen
let onlineWarteTimer = null;
function onlineKasten(text, beimUebernehmen, automatisch) {
    const kasten = el("div", "online");

    function knopfZeigen() {
        kasten.innerHTML = "";
        const knopf = el("button", "online-knopf");
        knopf.type = "button";
        knopf.appendChild(el("span", "online-icon", "🌐"));
        const beschriftung = el("span", "online-text");
        beschriftung.appendChild(el("strong", "", t("onlineSuchen", { text: text.trim() })));
        beschriftung.appendChild(el("small", "", t("onlineHinweis")));
        knopf.appendChild(beschriftung);
        kasten.appendChild(knopf);
        knopf.addEventListener("click", suchen);
    }

    function suchen() {
        clearTimeout(onlineWarteTimer);
        kasten.innerHTML = "";
        kasten.appendChild(el("p", "online-status laedt", t("onlineLaedt")));
        onlineSuchen(text).then(function (produkte) {
            kasten.innerHTML = "";
            if (produkte.length === 0) {
                kasten.appendChild(el("p", "online-status", t("onlineNichts")));
                return;
            }
            kasten.appendChild(el("p", "online-quelle", t("onlineQuelle")));
            produkte.forEach(function (p) {
                kasten.appendChild(onlineTrefferZeile(p, beimUebernehmen));
            });
        }).catch(function () {
            kasten.innerHTML = "";
            // Nur "offline" sagen, wenn das Handy wirklich kein Internet hat
            const offline = typeof navigator !== "undefined" && navigator.onLine === false;
            kasten.appendChild(el("p", "online-status fehler", t(offline ? "onlineOffline" : "onlineBesetzt")));
            const nochmal = el("button", "knopf-zweit online-nochmal", t("nochmalVersuchen"));
            nochmal.type = "button";
            nochmal.addEventListener("click", suchen);
            kasten.appendChild(nochmal);
        });
    }

    clearTimeout(onlineWarteTimer);
    const gemerkt = ONLINE_GEDAECHTNIS[text.trim().toLowerCase()];
    if (automatisch && gemerkt && Date.now() - gemerkt.zeit < ONLINE_MERKZEIT) {
        suchen(); // schon bekannt → sofort zeigen
    } else if (automatisch) {
        kasten.appendChild(el("p", "online-status laedt", t("onlineLaedt")));
        onlineWarteTimer = setTimeout(function () { if (kasten.isConnected) suchen(); }, 700);
    } else {
        knopfZeigen();
    }
    return kasten;
}

// Eine Trefferzeile (Online-Produkt) – Tippen übernimmt es
function onlineTrefferZeile(p, beimUebernehmen) {
    const zeile = el("button", "lm-karte online-treffer");
    zeile.type = "button";
    zeile.appendChild(el("span", "lm-bild klein", "🛒"));
    const info = el("div", "lm-info");
    info.appendChild(el("div", "lm-name", p.name));
    if (p.marke) info.appendChild(el("div", "lm-bezug", p.marke));
    info.appendChild(el("div", "lm-werte", werteText(p)));
    zeile.appendChild(info);
    zeile.appendChild(el("span", "knopf-icon klein", "＋"));
    zeile.setAttribute("aria-label", t("onlineUebernehmen") + ": " + p.name);
    zeile.addEventListener("click", function () {
        const lm = onlineUebernehmen(p);
        if (lm) beimUebernehmen(lm);
    });
    return zeile;
}
