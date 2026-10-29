/* =====================================================
   Mix & Match Calories – Sport
   =====================================================
   Drei Arten von Übungen:
   - kraft:     Sätze mit Wiederholungen × Gewicht (+ Video, wie die Übung geht)
   - ausdauer:  Laufen, Radfahren … Dauer, Strecke und Intervalle (4 min langsam, 1 min schnell …)
   - schwimmen: Strecke, Dauer und Abschnitte (4 × 50 m Kraul …)

   Gespeichert wird in daten.sport:
   - tage[datum]  = Liste der Übungen an diesem Tag
   - bloecke      = jede Übung, die man einmal angelegt hat (mit den letzten Werten)
   - pakete       = ganze Trainings mit Namen (z. B. "Beine"), übernehmbar mit einem Tipp
   Videos sind zu groß für den normalen Speicher → sie liegen in IndexedDB ("Video-Lager").

   Wohnhaus-Bild: Der Sport ist der Fitnessraum im Keller. Jede Übung ist ein Gerät mit
   Zettel dran (Block). Ein Paket ist ein Trainingsplan an der Wand: alles auf einmal.
*/

const SPORT_ARTEN = {
    kraft: { icon: "🏋️" },
    ausdauer: { icon: "🏃" },
    schwimmen: { icon: "🏊" }
};
const VIDEO_MAX_MB = 50; // so viel nimmt auch der Online-Speicher pro Video

let uebungEntwurf = null;   // die Übung, die gerade bearbeitet wird
let uebungBearbeiteId = null;
let uebungZiel = null;      // gesetzt, wenn ein Trainer für jemand anderen einträgt (statt im eigenen Plan)

// =====================================================
// Video-Lager (IndexedDB)
// =====================================================
let videoLagerOffen = null;

function videoLager() {
    if (videoLagerOffen) return videoLagerOffen;
    videoLagerOffen = new Promise(function (fertig, fehler) {
        if (!window.indexedDB) { fehler(new Error("kein IndexedDB")); return; }
        const anfrage = indexedDB.open("mmc_videos", 1);
        anfrage.onupgradeneeded = function () { anfrage.result.createObjectStore("videos"); };
        anfrage.onsuccess = function () { fertig(anfrage.result); };
        anfrage.onerror = function () { fehler(anfrage.error); };
    });
    videoLagerOffen.catch(function () { videoLagerOffen = null; });
    return videoLagerOffen;
}

function videoAktion(modus, arbeit) {
    return videoLager().then(function (db) {
        return new Promise(function (fertig, fehler) {
            const tx = db.transaction("videos", modus);
            const ergebnis = arbeit(tx.objectStore("videos"));
            tx.oncomplete = function () { fertig(ergebnis && ergebnis.result); };
            tx.onerror = function () { fehler(tx.error); };
            tx.onabort = function () { fehler(tx.error); };
        });
    });
}

function videoSpeichern(datei) {
    const id = "vid-" + neueId();
    return videoAktion("readwrite", function (lager) { lager.put(datei, id); }).then(function () { return id; });
}

function videoLaden(id) {
    return videoAktion("readonly", function (lager) { return lager.get(id); });
}

function videoLoeschen(id) {
    return videoAktion("readwrite", function (lager) { lager.delete(id); });
}

// Wird ein Video noch irgendwo gebraucht? Sonst darf es weg.
function videoNochGebraucht(id) {
    const sport = daten.sport;
    const inListe = function (liste) { return liste.some(function (u) { return u.videoId === id; }); };
    if (inListe(sport.bloecke)) return true;
    if (Object.keys(sport.tage).some(function (d) { return inListe(sport.tage[d]); })) return true;
    return sport.pakete.some(function (p) { return inListe(p.uebungen); });
}

function videoAufraeumen(id) {
    if (id && !videoNochGebraucht(id)) videoLoeschen(id).catch(function () { /* egal */ });
}

// =====================================================
// Rechnen & Texte
// =====================================================
function sportVon(datum) {
    return daten.sport.tage[datum] || [];
}

// "1 Satz" / "3 Sätze" – Einzahl hat einen eigenen Text mit der Endung 1
function anzahlText(schluessel, anzahl) {
    return t(anzahl === 1 ? schluessel + "1" : schluessel, { anzahl: anzahl });
}

// Kurze Zusammenfassung einer Übung, z. B. "3 Sätze · 10 × 40 kg, 10 × 40 kg, 8 × 45 kg"
function uebungKurztext(u) {
    const teile = [];
    if (u.art === "kraft") {
        const saetze = (u.saetze || []).filter(function (s) { return s.wdh || s.gewicht; });
        if (saetze.length) {
            teile.push(anzahlText("saetzeAnzahl", saetze.length));
            teile.push(saetze.map(function (s) {
                return (s.wdh || 0) + " × " + (s.gewicht ? format(s.gewicht, 1) + " kg" : t("ohneGewicht"));
            }).join(", "));
        }
    } else {
        if (u.dauer) teile.push(kurz(u.dauer) + " min");
        if (u.distanz) teile.push(u.art === "schwimmen" ? format(u.distanz) + " m" : kurz(u.distanz) + " km");
        const abschnitte = (u.abschnitte || []).filter(function (a) { return a.text || a.min; });
        if (abschnitte.length) {
            teile.push(anzahlText(u.art === "schwimmen" ? "abschnitteAnzahl" : "intervalleAnzahl", abschnitte.length));
        }
    }
    return teile.join(" · ") || t("nochLeer");
}

// Zusammenfassung des Tages: "3 Übungen · 45 min"
function sportTagText(liste) {
    const minuten = liste.reduce(function (s, u) { return s + (Number(u.dauer) || 0); }, 0);
    let text = anzahlText("uebungenAnzahl", liste.length);
    if (minuten) text += " · " + kurz(minuten) + " min";
    return text;
}

// Kopie einer Übung (ohne id), damit Tage/Pakete sich nicht gegenseitig verändern
function uebungKopie(u) {
    return {
        name: u.name,
        art: u.art,
        blockId: u.blockId || null,
        videoId: u.videoId || null,
        saetze: (u.saetze || []).map(function (s) { return { wdh: s.wdh, gewicht: s.gewicht }; }),
        dauer: u.dauer || 0,
        distanz: u.distanz || 0,
        abschnitte: (u.abschnitte || []).map(function (a) { return { min: a.min || 0, text: a.text || "" }; }),
        notiz: u.notiz || "",
        vomTrainer: !!u.vomTrainer
    };
}

function sportSpeichern() {
    if (!speichern()) { zeigeMeldung(t("fehlerVoll"), true); return false; }
    return true;
}

// =====================================================
// "Mein Tag": Sport-Karte unter dem Essen
// =====================================================
function zeichneSportTag() {
    const box = $("sportTag");
    if (!box) return;
    box.innerHTML = "";
    const liste = sportVon(aktuellesDatum);
    const karte = el("section", "mahlzeit sport-karte");
    const kopf = el("div", "mahlzeit-kopf");
    kopf.appendChild(el("h3", "", "🏋️ " + t("sport")));
    if (liste.length) kopf.appendChild(el("span", "", sportTagText(liste)));
    karte.appendChild(kopf);

    if (liste.length === 0) {
        karte.appendChild(el("p", "leer klein", t("sportLeer")));
    } else {
        liste.forEach(function (u) {
            const zeile = el("button", "sport-zeile");
            zeile.type = "button";
            zeile.appendChild(el("span", "sport-icon", SPORT_ARTEN[u.art] ? SPORT_ARTEN[u.art].icon : "🏅"));
            const info = el("span", "sport-info");
            info.appendChild(el("strong", "", u.name + (u.videoId ? " 🎬" : "") + (u.vomTrainer ? " 👤" : "")));
            info.appendChild(el("small", "", uebungKurztext(u)));
            zeile.appendChild(info);
            zeile.addEventListener("click", function () { oeffneUebung(u.id); });
            karte.appendChild(zeile);
        });
    }
    const mehr = el("button", "knopf-hinzu", liste.length ? t("sportOeffnen") : t("sportEintragen"));
    mehr.type = "button";
    mehr.addEventListener("click", oeffneSport);
    karte.appendChild(mehr);
    box.appendChild(karte);
}

// =====================================================
// Sport-Fenster (Übersicht des Tages)
// =====================================================
function oeffneSport() {
    zeichneSport();
    oeffneFenster("dialogSport");
}

function zeichneSport() {
    $("sportTitel").textContent = aktuellesDatum === heuteAlsText()
        ? t("sportHeute")
        : t("sportAm", { datum: datumBeschriftung(aktuellesDatum) });
    const liste = $("sportListe");
    liste.innerHTML = "";
    const uebungen = sportVon(aktuellesDatum);
    if (uebungen.length === 0) liste.appendChild(el("p", "leer klein", t("sportLeerFenster")));

    uebungen.forEach(function (u, nummer) {
        const zeile = el("div", "sport-eintrag");
        const knopf = el("button", "sport-zeile");
        knopf.type = "button";
        knopf.appendChild(el("span", "sport-icon", SPORT_ARTEN[u.art] ? SPORT_ARTEN[u.art].icon : "🏅"));
        const info = el("span", "sport-info");
        info.appendChild(el("strong", "", u.name + (u.videoId ? " 🎬" : "") + (u.vomTrainer ? " 👤" : "")));
        info.appendChild(el("small", "", uebungKurztext(u)));
        knopf.appendChild(info);
        knopf.addEventListener("click", function () { oeffneUebung(u.id); });
        zeile.appendChild(knopf);

        const weg = el("button", "knopf-icon klein", "✕");
        weg.type = "button";
        weg.setAttribute("aria-label", t("entfernen") + ": " + u.name);
        weg.addEventListener("click", function () {
            daten.sport.tage[aktuellesDatum] = uebungen.filter(function (x, i) { return i !== nummer; });
            if (!daten.sport.tage[aktuellesDatum].length) delete daten.sport.tage[aktuellesDatum];
            sportSpeichern();
            videoAufraeumen(u.videoId);
            zeichneSport();
            zeichneSportTag();
        });
        zeile.appendChild(weg);
        liste.appendChild(zeile);
    });

    // "Als Paket speichern" nur, wenn es etwas zu speichern gibt
    $("sportPaketBox").hidden = uebungen.length === 0;
    $("sportPaketName").value = "";
}

// Ganzes Training des Tages als Paket mit Namen speichern
function paketSpeichern() {
    const uebungen = sportVon(aktuellesDatum);
    const name = $("sportPaketName").value.trim() || t("paketStandardname", { datum: datumBeschriftung(aktuellesDatum) });
    if (!uebungen.length) return;
    daten.sport.pakete.push({ id: neueId(), name: name.slice(0, 40), uebungen: uebungen.map(uebungKopie) });
    if (sportSpeichern()) zeigeMeldung(t("paketGespeichert", { name: name }));
    zeichneSport();
}

// Übungen in den aktuellen Tag kopieren
function uebungenUebernehmen(vorlagen) {
    if (!daten.sport.tage[aktuellesDatum]) daten.sport.tage[aktuellesDatum] = [];
    vorlagen.forEach(function (v) {
        const u = uebungKopie(v);
        u.id = neueId();
        daten.sport.tage[aktuellesDatum].push(u);
    });
    sportSpeichern();
    zeichneSport();
    zeichneSportTag();
}

// =====================================================
// Blöcke & Pakete auswählen
// =====================================================
function oeffneBloecke() {
    $("blockSuche").value = "";
    zeichneBloecke();
    oeffneFenster("dialogBloecke");
}

function zeichneBloecke() {
    const such = $("blockSuche").value.trim().toLowerCase();

    // 1. Ganze Trainings: Pakete + frühere Trainingstage
    const ganze = $("blockGanze");
    ganze.innerHTML = "";
    const angebote = [];
    daten.sport.pakete.forEach(function (p) {
        angebote.push({ titel: "📦 " + p.name, text: sportTagText(p.uebungen), uebungen: p.uebungen, paket: p });
    });
    Object.keys(daten.sport.tage).filter(function (d) { return d !== aktuellesDatum && daten.sport.tage[d].length; })
        .sort().reverse().slice(0, 6).forEach(function (d) {
            const liste = daten.sport.tage[d];
            angebote.push({
                titel: "📅 " + datumBeschriftung(d),
                text: liste.map(function (u) { return u.name; }).join(", "),
                uebungen: liste
            });
        });
    const gefiltert = angebote.filter(function (a) {
        return !such || a.titel.toLowerCase().includes(such) || a.text.toLowerCase().includes(such);
    });
    $("blockGanzeTitel").hidden = gefiltert.length === 0;
    gefiltert.forEach(function (a) {
        const zeile = el("div", "sport-eintrag");
        const knopf = el("button", "sport-zeile");
        knopf.type = "button";
        const info = el("span", "sport-info");
        info.appendChild(el("strong", "", a.titel));
        info.appendChild(el("small", "", a.text));
        knopf.appendChild(info);
        knopf.appendChild(el("span", "knopf-icon klein", "＋"));
        knopf.addEventListener("click", function () {
            uebungenUebernehmen(a.uebungen);
            schliesseFenster("dialogBloecke");
            zeigeMeldung(anzahlText("trainingUebernommen", a.uebungen.length));
        });
        zeile.appendChild(knopf);
        if (a.paket) zeile.appendChild(loeschKnopf(function () {
            daten.sport.pakete = daten.sport.pakete.filter(function (p) { return p !== a.paket; });
            sportSpeichern();
            a.paket.uebungen.forEach(function (u) { videoAufraeumen(u.videoId); });
            zeichneBloecke();
        }, a.paket.name));
        ganze.appendChild(zeile);
    });

    // 2. Einzelne Übungen (Blöcke)
    const einzeln = $("blockEinzeln");
    einzeln.innerHTML = "";
    const bloecke = daten.sport.bloecke
        .filter(function (b) { return !such || b.name.toLowerCase().includes(such); })
        .sort(function (a, b) { return a.name.localeCompare(b.name, gebietsschema()); });
    if (bloecke.length === 0) einzeln.appendChild(el("p", "leer klein", t(such ? "nichtsGefunden" : "bloeckeLeer")));
    bloecke.forEach(function (b) {
        const zeile = el("div", "sport-eintrag");
        const knopf = el("button", "sport-zeile");
        knopf.type = "button";
        knopf.appendChild(el("span", "sport-icon", SPORT_ARTEN[b.art] ? SPORT_ARTEN[b.art].icon : "🏅"));
        const info = el("span", "sport-info");
        info.appendChild(el("strong", "", b.name + (b.videoId ? " 🎬" : "")));
        info.appendChild(el("small", "", uebungKurztext(b)));
        knopf.appendChild(info);
        knopf.appendChild(el("span", "knopf-icon klein", "＋"));
        knopf.addEventListener("click", function () {
            const vorlage = uebungKopie(b);
            vorlage.blockId = b.id;
            uebungenUebernehmen([vorlage]);
            schliesseFenster("dialogBloecke");
            zeigeMeldung(t("uebungUebernommen", { name: b.name }));
        });
        zeile.appendChild(knopf);
        zeile.appendChild(loeschKnopf(function () {
            daten.sport.bloecke = daten.sport.bloecke.filter(function (x) { return x !== b; });
            sportSpeichern();
            videoAufraeumen(b.videoId);
            zeichneBloecke();
        }, b.name));
        einzeln.appendChild(zeile);
    });
}

// Löschen erst beim zweiten Tippen (wie bei Lebensmitteln)
function loeschKnopf(beimLoeschen, name) {
    const knopf = el("button", "knopf-icon klein", "🗑");
    knopf.type = "button";
    knopf.setAttribute("aria-label", t("loeschen") + ": " + name);
    knopf.addEventListener("click", function () {
        if (knopf.classList.contains("sicher")) { beimLoeschen(); return; }
        knopf.classList.add("sicher");
        knopf.textContent = t("wirklich");
        setTimeout(function () { knopf.classList.remove("sicher"); knopf.textContent = "🗑"; }, 3000);
    });
    return knopf;
}

// =====================================================
// Eine Übung anlegen / bearbeiten
// =====================================================
function neueUebung(art) {
    uebungBearbeiteId = null;
    uebungEntwurf = {
        name: "", art: art, blockId: null, videoId: null,
        saetze: art === "kraft" ? [{ wdh: "", gewicht: "" }] : [],
        dauer: 0, distanz: 0,
        abschnitte: [],
        notiz: ""
    };
    zeichneUebung();
    oeffneFenster("dialogUebung");
    $("uebungName").focus(); // direkt den Namen eintippen
}

function oeffneUebung(id) {
    const u = sportVon(aktuellesDatum).find(function (x) { return x.id === id; });
    if (!u) return;
    uebungBearbeiteId = id;
    uebungEntwurf = uebungKopie(u);
    zeichneUebung();
    oeffneFenster("dialogUebung");
}

function zeichneUebung() {
    const u = uebungEntwurf;
    $("uebungTitel").textContent = (SPORT_ARTEN[u.art].icon) + " " + t("art_" + u.art);
    $("uebungName").value = u.name;
    $("uebungName").placeholder = t("namePh_" + u.art);
    $("uebungNotiz").value = u.notiz || "";
    $("uebungFehler").textContent = "";
    $("uebungLoeschen").hidden = !uebungBearbeiteId;

    // Bereiche je nach Art
    $("uebungKraft").hidden = u.art !== "kraft";
    $("uebungAusdauer").hidden = u.art === "kraft";
    $("uebungDistanzEinheit").textContent = u.art === "schwimmen" ? "m" : "km";
    $("uebungAbschnitteTitel").textContent = t(u.art === "schwimmen" ? "abschnitte" : "intervalle");
    $("uebungAbschnittPlus").textContent = t(u.art === "schwimmen" ? "abschnittPlus" : "intervallPlus");
    $("uebungDauer").value = u.dauer ? feldWert(u.dauer) : "";
    $("uebungDistanz").value = u.distanz ? feldWert(u.distanz) : "";

    zeichneSaetze();
    zeichneAbschnitte();
    zeichneUebungVideo();
}

function zeichneSaetze() {
    const liste = $("uebungSaetze");
    liste.innerHTML = "";
    uebungEntwurf.saetze.forEach(function (satz, nummer) {
        const zeile = el("div", "satz-zeile");
        zeile.appendChild(el("span", "satz-nr", t("satzNr", { nr: nummer + 1 })));
        const wdh = el("input", "satz-feld");
        wdh.type = "text"; wdh.inputMode = "numeric"; wdh.placeholder = "10";
        wdh.value = satz.wdh === "" || satz.wdh === undefined ? "" : feldWert(satz.wdh);
        wdh.setAttribute("aria-label", t("satzNr", { nr: nummer + 1 }) + " – " + t("wdh"));
        wdh.addEventListener("input", function () { satz.wdh = wdh.value.trim() === "" ? "" : zahl(wdh.value); });
        zeile.appendChild(wdh);
        zeile.appendChild(el("span", "satz-einheit", t("wdhKurz") + " ×"));
        const kg = el("input", "satz-feld");
        kg.type = "text"; kg.inputMode = "decimal"; kg.placeholder = "40";
        kg.value = satz.gewicht === "" || satz.gewicht === undefined ? "" : feldWert(satz.gewicht);
        kg.setAttribute("aria-label", t("satzNr", { nr: nummer + 1 }) + " – kg");
        kg.addEventListener("input", function () { satz.gewicht = kg.value.trim() === "" ? "" : zahl(kg.value); });
        zeile.appendChild(kg);
        zeile.appendChild(el("span", "satz-einheit", "kg"));
        const weg = el("button", "knopf-icon klein", "✕");
        weg.type = "button";
        weg.setAttribute("aria-label", t("entfernen"));
        weg.addEventListener("click", function () {
            uebungEntwurf.saetze.splice(nummer, 1);
            zeichneSaetze();
        });
        zeile.appendChild(weg);
        liste.appendChild(zeile);
    });
}

function zeichneAbschnitte() {
    const liste = $("uebungAbschnitte");
    liste.innerHTML = "";
    const schwimmen = uebungEntwurf.art === "schwimmen";
    uebungEntwurf.abschnitte.forEach(function (abschnitt, nummer) {
        const zeile = el("div", "satz-zeile");
        zeile.appendChild(el("span", "satz-nr", (nummer + 1) + "."));
        if (!schwimmen) {
            const min = el("input", "satz-feld");
            min.type = "text"; min.inputMode = "decimal"; min.placeholder = "4";
            min.value = abschnitt.min ? feldWert(abschnitt.min) : "";
            min.setAttribute("aria-label", t("intervalle") + " " + (nummer + 1) + " – min");
            min.addEventListener("input", function () { abschnitt.min = zahl(min.value) || 0; });
            zeile.appendChild(min);
            zeile.appendChild(el("span", "satz-einheit", "min"));
        }
        const text = el("input", "satz-text");
        text.type = "text"; text.maxLength = 60;
        text.placeholder = t(schwimmen ? "abschnittPh" : "intervallPh");
        text.value = abschnitt.text || "";
        text.setAttribute("aria-label", (schwimmen ? t("abschnitte") : t("intervalle")) + " " + (nummer + 1));
        text.addEventListener("input", function () { abschnitt.text = text.value; });
        zeile.appendChild(text);
        const weg = el("button", "knopf-icon klein", "✕");
        weg.type = "button";
        weg.setAttribute("aria-label", t("entfernen"));
        weg.addEventListener("click", function () {
            uebungEntwurf.abschnitte.splice(nummer, 1);
            zeichneAbschnitte();
        });
        zeile.appendChild(weg);
        liste.appendChild(zeile);
    });
    $("uebungWiederholen").hidden = uebungEntwurf.abschnitte.length < 1 || schwimmen;
}

// Video anzeigen (Hochformat), falls vorhanden
let videoAdresse = null;
function zeichneUebungVideo() {
    const box = $("uebungVideoBox");
    const video = $("uebungVideo");
    if (videoAdresse) { URL.revokeObjectURL(videoAdresse); videoAdresse = null; }
    video.removeAttribute("src");
    $("uebungVideoWeg").hidden = !uebungEntwurf.videoId;
    $("uebungVideoKnopf").textContent = t(uebungEntwurf.videoId ? "videoErsetzen" : "videoHochladen");
    if (!uebungEntwurf.videoId) { box.hidden = true; return; }
    box.hidden = false;
    const id = uebungEntwurf.videoId;
    // Liegt das Video nicht auf diesem Gerät (z. B. vom Trainer), aus dem Online-Speicher holen
    const ausWolke = function () {
        if (typeof wolkeVideoAdresse !== "function") { box.hidden = true; return; }
        wolkeVideoAdresse(id).then(function (adresse) { video.src = adresse; }).catch(function () { box.hidden = true; });
    };
    videoLaden(id).then(function (blob) {
        if (!blob) { ausWolke(); return; }
        videoAdresse = URL.createObjectURL(blob);
        video.src = videoAdresse;
    }).catch(ausWolke);
}

function videoGewaehlt(datei) {
    if (!datei) return;
    if (!/^video\//.test(datei.type || "") && !/\.(mp4|mov|m4v|webm)$/i.test(datei.name || "")) {
        $("uebungFehler").textContent = t("videoFalsch");
        return;
    }
    if (datei.size > VIDEO_MAX_MB * 1024 * 1024) {
        $("uebungFehler").textContent = t("videoZuGross", { mb: VIDEO_MAX_MB });
        return;
    }
    $("uebungFehler").textContent = "";
    $("uebungVideoKnopf").textContent = t("videoLaedt");
    videoSpeichern(datei).then(function (id) {
        uebungEntwurf.videoId = id;
        zeichneUebungVideo();
    }).catch(function () {
        $("uebungFehler").textContent = t("videoFehler");
        zeichneUebungVideo();
    });
}

function uebungSpeichern() {
    const u = uebungEntwurf;
    u.name = $("uebungName").value.trim();
    u.notiz = $("uebungNotiz").value.trim();
    if (!u.name) { $("uebungFehler").textContent = t("fehlerName"); $("uebungName").focus(); return; }
    const dauer = $("uebungDauer").value.trim() === "" ? 0 : zahl($("uebungDauer").value);
    const distanz = $("uebungDistanz").value.trim() === "" ? 0 : zahl($("uebungDistanz").value);
    const zahlOk = function (v) { return v === "" || (typeof v === "number" && v >= 0); };
    if (u.art !== "kraft" && (!(dauer >= 0) || !(distanz >= 0))) { $("uebungFehler").textContent = t("fehlerZahlen"); return; }
    if (!u.saetze.every(function (s) { return zahlOk(s.wdh) && zahlOk(s.gewicht); })) { $("uebungFehler").textContent = t("fehlerZahlen"); return; }
    u.dauer = u.art === "kraft" ? 0 : dauer;
    u.distanz = u.art === "kraft" ? 0 : distanz;
    u.saetze = u.saetze.filter(function (s) { return s.wdh !== "" || s.gewicht !== ""; })
        .map(function (s) { return { wdh: s.wdh === "" ? 0 : s.wdh, gewicht: s.gewicht === "" ? 0 : s.gewicht }; });
    u.abschnitte = u.abschnitte.filter(function (a) { return (a.text || "").trim() || a.min; })
        .map(function (a) { return { min: a.min || 0, text: (a.text || "").trim() }; });

    // Trainer trägt für eine Sportlerin ein → nicht im eigenen Plan speichern, sondern schicken
    if (uebungZiel) {
        const ziel = uebungZiel;
        uebungZiel = null;
        ziel(uebungKopie(u));
        schliesseFenster("dialogUebung");
        return;
    }

    // Block (Bibliothek) anlegen oder auffrischen: gleicher Name + Art = gleiche Übung
    let block = u.blockId ? daten.sport.bloecke.find(function (b) { return b.id === u.blockId; }) : null;
    if (!block) block = daten.sport.bloecke.find(function (b) { return b.art === u.art && b.name.toLowerCase() === u.name.toLowerCase(); });
    if (!block) { block = { id: neueId() }; daten.sport.bloecke.push(block); }
    const altesBlockVideo = block.videoId;
    Object.assign(block, uebungKopie(u));
    block.blockId = null;
    u.blockId = block.id;

    // In den Tag eintragen bzw. dort ersetzen
    if (!daten.sport.tage[aktuellesDatum]) daten.sport.tage[aktuellesDatum] = [];
    const tag = daten.sport.tage[aktuellesDatum];
    let altesVideo = null;
    if (uebungBearbeiteId) {
        const stelle = tag.findIndex(function (x) { return x.id === uebungBearbeiteId; });
        if (stelle !== -1) { altesVideo = tag[stelle].videoId; tag[stelle] = Object.assign({ id: uebungBearbeiteId }, uebungKopie(u)); }
    } else {
        tag.push(Object.assign({ id: neueId() }, uebungKopie(u)));
    }
    if (!sportSpeichern()) return;
    if (altesVideo && altesVideo !== u.videoId) videoAufraeumen(altesVideo);
    if (altesBlockVideo && altesBlockVideo !== u.videoId) videoAufraeumen(altesBlockVideo);

    schliesseFenster("dialogUebung");
    zeigeMeldung(t("uebungGespeichert", { name: u.name }));
    if ($("dialogSport").open) zeichneSport();
    zeichneSportTag();
}

function uebungLoeschen() {
    const knopf = $("uebungLoeschen");
    if (!knopf.classList.contains("sicher")) {
        knopf.classList.add("sicher");
        knopf.textContent = t("wirklichLoeschen");
        return;
    }
    const tag = sportVon(aktuellesDatum);
    const weg = tag.find(function (x) { return x.id === uebungBearbeiteId; });
    daten.sport.tage[aktuellesDatum] = tag.filter(function (x) { return x.id !== uebungBearbeiteId; });
    if (!daten.sport.tage[aktuellesDatum].length) delete daten.sport.tage[aktuellesDatum];
    sportSpeichern();
    if (weg) videoAufraeumen(weg.videoId);
    schliesseFenster("dialogUebung");
    if ($("dialogSport").open) zeichneSport();
    zeichneSportTag();
}

// =====================================================
// Knöpfe verbinden
// =====================================================
function sportVerbinden() {
    document.querySelectorAll("[data-sport-neu]").forEach(function (knopf) {
        knopf.addEventListener("click", function () { neueUebung(knopf.dataset.sportNeu); });
    });
    $("sportBloecke").addEventListener("click", oeffneBloecke);
    $("sportPaketSpeichern").addEventListener("click", paketSpeichern);
    $("blockSuche").addEventListener("input", zeichneBloecke);

    $("uebungSatzPlus").addEventListener("click", function () {
        const letzter = uebungEntwurf.saetze[uebungEntwurf.saetze.length - 1];
        uebungEntwurf.saetze.push(letzter ? { wdh: letzter.wdh, gewicht: letzter.gewicht } : { wdh: "", gewicht: "" });
        zeichneSaetze();
        const felder = $("uebungSaetze").querySelectorAll("input");
        if (felder.length) felder[felder.length - 2].focus();
    });
    $("uebungAbschnittPlus").addEventListener("click", function () {
        uebungEntwurf.abschnitte.push({ min: 0, text: "" });
        zeichneAbschnitte();
        const felder = $("uebungAbschnitte").querySelectorAll("input");
        if (felder.length) felder[felder.length - (uebungEntwurf.art === "schwimmen" ? 1 : 2)].focus();
    });
    // Intervalle nochmal anhängen (z. B. 4 min langsam + 1 min schnell → noch eine Runde)
    $("uebungWiederholen").addEventListener("click", function () {
        const runde = uebungEntwurf.abschnitte.map(function (a) { return { min: a.min, text: a.text }; });
        uebungEntwurf.abschnitte = uebungEntwurf.abschnitte.concat(runde);
        zeichneAbschnitte();
    });
    $("uebungVideoKnopf").addEventListener("click", function () { $("uebungVideoInput").click(); });
    $("uebungVideoInput").addEventListener("change", function () {
        videoGewaehlt($("uebungVideoInput").files[0]);
        $("uebungVideoInput").value = "";
    });
    $("uebungVideoWeg").addEventListener("click", function () {
        uebungEntwurf.videoId = null; // das Video selbst räumt uebungSpeichern auf
        zeichneUebungVideo();
    });
    $("uebungSpeichern").addEventListener("click", uebungSpeichern);
    $("uebungLoeschen").addEventListener("click", uebungLoeschen);
    $("dialogUebung").addEventListener("close", function () {
        $("uebungVideo").pause();
        uebungZiel = null;
        // Neu hochgeladen, aber nicht gespeichert? Dann Video wieder wegräumen.
        if (uebungEntwurf) videoAufraeumen(uebungEntwurf.videoId);
        const knopf = $("uebungLoeschen");
        knopf.classList.remove("sicher");
        knopf.textContent = t("loeschen");
    });
}
