/* =====================================================
   Mix & Match Calories – Gemeinsame Inhalte (für ALLE in der App)
   =====================================================
   Lebensmittel und Rezepte, die ein Admin (Ivy) "für alle" speichert, liegen online
   in der Tabelle "gemeinsam". Jede App lädt sie und behandelt sie wie Start-Lebensmittel
   (id beginnt mit "g-", seit: 0). Damit es auch ohne Internet klappt, gibt es eine Kopie
   im Gerät (localStorage "mmc_gemeinsam").

   Wohnhaus-Bild: das Schwarze Brett im Eingang. Alle Bewohner sehen es,
   aushängen darf nur die Hausverwaltung.
*/

const GEMEINSAM_KELLER = "mmc_gemeinsam";
let gemeinsamListe = [];

// Gemeinsame Einträge in die Start-Lebensmittel einbauen (alte gemeinsame vorher entfernen)
function gemeinsamEinbauen(liste) {
    for (let i = STARTDATEN.length - 1; i >= 0; i--) {
        if (STARTDATEN[i].quelle === "gemeinsam") {
            delete STARTDATEN_NACH_ID[STARTDATEN[i].id];
            STARTDATEN.splice(i, 1);
        }
    }
    gemeinsamListe = (liste || []).filter(function (e) {
        return e && typeof e.id === "string" && e.id.indexOf("g-") === 0 && (e.de || e.en);
    }).map(function (e) {
        const eintrag = Object.assign({}, e, { seit: 0, quelle: "gemeinsam" });
        eintrag.de = eintrag.de || eintrag.en;
        eintrag.en = eintrag.en || eintrag.de;
        eintrag.kcal100 = Number(eintrag.kcal100) || 0;
        eintrag.protein100 = Number(eintrag.protein100) || 0;
        eintrag.kh100 = Number(eintrag.kh100) || 0;
        eintrag.fett100 = Number(eintrag.fett100) || 0;
        return eintrag;
    });
    gemeinsamListe.forEach(function (e) {
        if (STARTDATEN_NACH_ID[e.id]) return;
        STARTDATEN.push(e);
        STARTDATEN_NACH_ID[e.id] = e;
    });
}

// Gleich beim Laden: die Kopie aus dem Gerät einbauen (damit es offline klappt)
(function () {
    let gemerkt = [];
    try { gemerkt = JSON.parse(localStorage.getItem(GEMEINSAM_KELLER) || "[]"); } catch (e) { gemerkt = []; }
    gemeinsamEinbauen(Array.isArray(gemerkt) ? gemerkt : []);
})();

// Neueste gemeinsame Einträge holen; hat sich etwas geändert → neu aufbauen
function gemeinsamAktualisieren() {
    if (typeof wolke === "undefined" || !wolke.konfiguriert() || !wolke.gemeinsamLaden) return Promise.resolve();
    return wolke.gemeinsamLaden().then(function (zeilen) {
        const neu = (zeilen || []).map(function (z) { return Object.assign({}, z.daten, { id: z.id }); });
        const alt = JSON.stringify(gemeinsamListe.map(function (e) { const k = Object.assign({}, e); delete k.seit; delete k.quelle; return k; }));
        const vergleich = JSON.stringify(neu.map(function (e) { const k = Object.assign({}, e); delete k.seit; delete k.quelle; return k; }));
        if (alt === vergleich) return;
        try { localStorage.setItem(GEMEINSAM_KELLER, JSON.stringify(neu)); } catch (e) { /* Speicher voll – egal */ }
        datenSpeichern(daten);     // aktuellen Stand sichern (ohne "geändert"-Zeitstempel) …
        gemeinsamEinbauen(neu);
        daten = datenLaden();      // … und mit den neuen gemeinsamen Einträgen neu aufbauen
        rezepteNeuBerechnen();
        allesZeichnen();
    }).catch(function () { /* offline – die Kopie im Gerät reicht */ });
}

// =====================================================
// Admin: "Für alle in der App speichern"
// =====================================================
function istAdmin() {
    return typeof wolkeAdmin !== "undefined" && !!wolkeAdmin;
}

// Lebensmittel → Eintrag fürs Schwarze Brett (wie ein Start-Lebensmittel)
function gemeinsamEintragAus(lm, gid, idTausch) {
    const name = anzeigeName(lm);
    const eintrag = {
        id: gid,
        emoji: lm.emoji || "🍽️",
        de: lm.namen && !lm.eigenerName ? lm.namen.de : name,
        en: lm.namen && !lm.eigenerName ? lm.namen.en : name,
        kcal100: lm.kcal100 || 0, protein100: lm.protein100 || 0, kh100: lm.kh100 || 0, fett100: lm.fett100 || 0
    };
    if (lm.marke) eintrag.marke = lm.marke;
    if (lm.laden) eintrag.laden = lm.laden;
    if (lm.foto) eintrag.foto = lm.foto;
    if (lm.influencer) eintrag.influencer = lm.influencer;
    if (lm.mahlzeit && lm.mahlzeit !== "tag") eintrag.mahlzeit = lm.mahlzeit;
    if (lm.anleitung) eintrag.anleitung = typeof lm.anleitung === "string" ? { de: lm.anleitung, en: lm.anleitung } : lm.anleitung;
    if (lm.rezept) {
        eintrag.rezept = {
            zutaten: lm.rezept.zutaten.map(function (z) { return { lebensmittelId: idTausch[z.lebensmittelId] || z.lebensmittelId, gramm: z.gramm }; }),
            gewichtFertig: lm.rezept.gewichtFertig || 0,
            portionen: lm.rezept.portionen || 1
        };
    }
    return eintrag;
}

// Teilt ein Lebensmittel/Rezept mit allen. Eigene Zutaten eines Rezepts werden mitgeteilt.
function gemeinsamTeilen(lm) {
    if (!istAdmin() || !lm) return Promise.resolve();
    const idTausch = {};
    const reihe = [];
    function sammeln(x) {
        if (!x || reihe.indexOf(x) !== -1) return;
        if (x.rezept) x.rezept.zutaten.forEach(function (z) {
            const zutat = findeLebensmittel(z.lebensmittelId);
            if (zutat && !STARTDATEN_NACH_ID[zutat.id]) sammeln(zutat);
        });
        reihe.push(x);
    }
    sammeln(lm);
    reihe.forEach(function (x) { idTausch[x.id] = x.id.indexOf("g-") === 0 ? x.id : "g-" + x.id; });
    const eintraege = reihe.map(function (x) { return gemeinsamEintragAus(x, idTausch[x.id], idTausch); });

    return eintraege.reduce(function (kette, e) {
        return kette.then(function () { return wolke.gemeinsamSpeichern(e.id, e); });
    }, Promise.resolve()).then(function () {
        // Kopie im Gerät + Start-Lebensmittel auffrischen
        const liste = gemeinsamListe.map(function (g) { const k = Object.assign({}, g); delete k.seit; delete k.quelle; return k; })
            .filter(function (g) { return !eintraege.some(function (e) { return e.id === g.id; }); }).concat(eintraege);
        try { localStorage.setItem(GEMEINSAM_KELLER, JSON.stringify(liste)); } catch (e) { /* egal */ }
        gemeinsamEinbauen(liste);
        // Eigene Einträge in gemeinsame umwandeln (Plan und Rezepte zeigen dann auf die neue id)
        reihe.forEach(function (x) {
            const gid = idTausch[x.id];
            const start = STARTDATEN_NACH_ID[gid];
            const neu = Object.assign(startLebensmittel(start), { favorit: !!x.favorit, letzteGramm: x.letzteGramm || 100 });
            daten.lebensmittel = daten.lebensmittel.filter(function (y) { return y.id !== x.id && y.id !== gid; });
            daten.lebensmittel.push(neu);
            if (daten.bekannteStartIds.indexOf(gid) === -1) daten.bekannteStartIds.push(gid);
            if (gid !== x.id) {
                Object.keys(daten.plan).forEach(function (d) {
                    daten.plan[d].forEach(function (e) { if (e.lebensmittelId === x.id) e.lebensmittelId = gid; });
                });
                daten.lebensmittel.forEach(function (y) {
                    if (y.rezept) y.rezept.zutaten.forEach(function (z) { if (z.lebensmittelId === x.id) z.lebensmittelId = gid; });
                });
            }
        });
        rezepteNeuBerechnen();
        speichern();
        allesZeichnen();
        zeigeMeldung(t("gemeinsamGespeichert", { name: anzeigeName(lm) }));
    }).catch(function () {
        zeigeMeldung(t("gemeinsamFehler"), true);
    });
}

// Admin löscht einen gemeinsamen Eintrag → für alle weg
function gemeinsamEntfernen(id) {
    if (!istAdmin() || id.indexOf("g-") !== 0) return Promise.resolve();
    return wolke.gemeinsamLoeschen(id).then(function () {
        const liste = gemeinsamListe.filter(function (g) { return g.id !== id; })
            .map(function (g) { const k = Object.assign({}, g); delete k.seit; delete k.quelle; return k; });
        try { localStorage.setItem(GEMEINSAM_KELLER, JSON.stringify(liste)); } catch (e) { /* egal */ }
        gemeinsamEinbauen(liste);
    }).catch(function () { zeigeMeldung(t("gemeinsamFehler"), true); });
}

// Schalter "🌍 Für alle" in den Fenstern zeigen / setzen
function gemeinsamSchalterSetzen(boxId, kastenId, lm) {
    const box = $(boxId);
    if (!box) return;
    box.hidden = !istAdmin();
    const kasten = $(kastenId);
    const schonGemeinsam = !!(lm && lm.id.indexOf("g-") === 0);
    kasten.checked = schonGemeinsam || !lm;   // neue Einträge: standardmäßig für alle
    kasten.disabled = schonGemeinsam;
}
