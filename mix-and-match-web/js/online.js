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

    const marken = Array.isArray(p.brands) ? p.brands : String(p.brands || "").split(",");
    function wert(v) { return typeof v === "number" && v >= 0 && v <= 100 ? auf1Stelle(v) : 0; }
    return {
        code: String(p.code),
        name: name.slice(0, 80),
        marke: String(marken[0] || "").trim().slice(0, 40),
        kcal100: Math.round(kcal),
        protein100: wert(n.proteins_100g),
        kh100: wert(n.carbohydrates_100g),
        fett100: wert(n.fat_100g),
        inOesterreich: (p.countries_tags || []).indexOf("en:austria") !== -1
    };
}

// Sucht online. Ergebnis: Promise mit einer Liste einfacher Produkte (Österreich zuerst)
function onlineSuchen(text) {
    const such = text.trim();
    let anfrage;

    if (/^\d{8,14}$/.test(such)) {
        // Strichcode: direkt das eine Produkt holen
        anfrage = offHolen("https://world.openfoodfacts.org/api/v2/product/" + such + ".json?fields=" + OFF_FELDER)
            .then(function (j) { return j && j.product ? [Object.assign({ code: such }, j.product)] : []; });
    } else {
        // Alle Wörter müssen vorkommen ("nöm AND joghurt")
        const woerter = such.split(/\s+/).map(function (w) { return w.replace(/[^\p{L}\p{N}%.,'-]/gu, ""); })
            .filter(Boolean);
        const q = woerter.join(" AND ");
        const sprache = daten.einstellungen.sprache === "de" ? "de,en" : "en,de";
        anfrage = offHolen("https://search.openfoodfacts.org/search?q=" + encodeURIComponent(q) +
                "&langs=" + sprache + "&page_size=30&fields=" + OFF_FELDER)
            .then(function (j) { return j.hits || []; })
            .catch(function () {
                // Plan B: die klassische Suche von Open Food Facts
                return offHolen("https://world.openfoodfacts.org/cgi/search.pl?search_terms=" + encodeURIComponent(such) +
                        "&search_simple=1&action=process&json=1&page_size=30&fields=" + OFF_FELDER)
                    .then(function (j) { return j.products || []; });
            });
    }

    return anfrage.then(function (roh) {
        const gesehen = {};
        return roh.map(offProduktLesen)
            .filter(function (p) {
                if (!p || gesehen[p.code]) return false;
                gesehen[p.code] = true;
                return true;
            })
            .sort(function (a, b) { return (b.inOesterreich ? 1 : 0) - (a.inOesterreich ? 1 : 0); })
            .slice(0, 20);
    });
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
function onlineKasten(text, beimUebernehmen) {
    const kasten = el("div", "online");
    const knopf = el("button", "online-knopf");
    knopf.type = "button";
    knopf.appendChild(el("span", "online-icon", "🌐"));
    const beschriftung = el("span", "online-text");
    beschriftung.appendChild(el("strong", "", t("onlineSuchen", { text: text.trim() })));
    beschriftung.appendChild(el("small", "", t("onlineHinweis")));
    knopf.appendChild(beschriftung);
    kasten.appendChild(knopf);

    knopf.addEventListener("click", function () {
        kasten.innerHTML = "";
        kasten.appendChild(el("p", "online-status", t("onlineLaedt")));
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
            kasten.appendChild(el("p", "online-status fehler", t("onlineFehler")));
        });
    });
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
