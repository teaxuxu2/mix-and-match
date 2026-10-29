/* =====================================================
   Mix & Match Calories – Sport (Sessions)
   =====================================================
   Ein Trainingstag ist eine SESSION mit Namen (z. B. "HYROX Einheit").
   Darin stehen Übungen. Jede Übung misst, was sie braucht – frei wählbar:
     Wdh. · kg · Meter · Zeit · Notiz
   Beispiele: Kniebeugen = Wdh. + kg · SkiErg = Meter + Zeit · Schlitten = Meter + kg
              Intervall-Lauf = Zeit + Notiz ("4 min langsam", "1 min schnell")

   Gespeichert in daten.sport:
   - tage[datum]          Übungen an diesem Tag
   - sessionNamen[datum]  Name der Session an diesem Tag
   - bloecke              jede Übung, die man einmal angelegt hat (mit den letzten Werten)
   - pakete               gespeicherte Sessions (Name + Übungen), mit einem Tipp übernehmbar
   Videos liegen in IndexedDB ("Video-Lager"), weil sie zu groß für den normalen Speicher sind.

   Wohnhaus-Bild: Der Sport ist der Fitnessraum im Keller. Jede Übung ist ein Gerät mit
   Zettel dran (Block). Eine Session ist ein Trainingsplan an der Wand – alles auf einmal.
*/

const VIDEO_MAX_MB = 50; // so viel nimmt auch der Online-Speicher pro Video

let uebungEntwurf = null;      // die Übung, die gerade bearbeitet wird
let uebungBearbeiteId = null;
let uebungFelderGewaehlt = false; // hat die Person die Felder selbst gewählt? Dann nicht mehr automatisch ändern
let uebungZiel = null;         // gesetzt, wenn ein Trainer für jemand anderen einträgt (statt im eigenen Plan)
let blockModus = "einzeln";    // Auswahl-Fenster: "einzeln" (Übung) oder "session"

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
// Zeit: Eingabe "4:30" oder "4,5" (Minuten) ↔ Sekunden
// =====================================================
function zeitZuSek(text) {
    text = String(text || "").trim();
    if (!text) return "";
    if (text.indexOf(":") !== -1) {
        const teile = text.split(":").map(function (x) { return Number(x.replace(",", ".")); });
        if (teile.some(function (x) { return isNaN(x) || x < 0; })) return NaN;
        return Math.round(teile.reduce(function (s, x) { return s * 60 + x; }, 0));
    }
    const minuten = zahl(text);
    return minuten >= 0 ? Math.round(minuten * 60) : NaN;
}

// Für Eingabefelder: immer m:ss bzw. h:mm:ss
function sekZuFeld(sek) {
    if (sek === "" || sek === null || sek === undefined) return "";
    const h = Math.floor(sek / 3600), m = Math.floor((sek % 3600) / 60), s = sek % 60;
    const zwei = function (x) { return (x < 10 ? "0" : "") + x; };
    return h ? h + ":" + zwei(m) + ":" + zwei(s) : m + ":" + zwei(s);
}

// Für Anzeigen: "15 min" oder "4:30"
function sekZuText(sek) {
    if (!sek) return "";
    if (sek % 60 === 0) return format(sek / 60) + " min";
    return sekZuFeld(sek);
}

// =====================================================
// Felder & Texte
// =====================================================
// Welche Felder passen zum Namen? (nur ein Vorschlag – man kann frei umschalten)
function felderVorschlag(name) {
    const n = String(name || "").toLowerCase();
    if (/schlitten|sled|farmer|carry|ausfallschr|lunge|sandbag/.test(n)) return ["m", "kg"];
    if (/plank|unterarmstütz|halten|hold|hang/.test(n)) return ["zeit"];
    if (/lauf|run|jog|rudern|row|ski|erg|schwimm|swim|rad|bike|cycl|spinning|walk|geh|wander|stepper|crosstrainer/.test(n)) return ["m", "zeit"];
    return ["wdh", "kg"];
}

function uebungIcon(u) {
    const n = String(u.name || "").toLowerCase();
    if (/schwimm|swim|kraul|brust/.test(n)) return "🏊";
    if (/rudern|row/.test(n)) return "🚣";
    if (/rad|bike|cycl|spinning/.test(n)) return "🚴";
    if (/ski/.test(n)) return "⛷️";
    if (/lauf|run|jog|walk|geh|sprint/.test(n)) return "🏃";
    const f = u.felder || [];
    if (f.indexOf("m") !== -1 && f.indexOf("kg") === -1) return "🏃";
    if (f.length === 1 && f[0] === "zeit") return "⏱️";
    return "🏋️";
}

// "1 Satz" / "3 Sätze" – Einzahl hat einen eigenen Text mit der Endung 1
function anzahlText(schluessel, anzahl) {
    return t(anzahl === 1 ? schluessel + "1" : schluessel, { anzahl: anzahl });
}

function satzHatWerte(s) {
    return s.wdh !== "" || s.gewicht !== "" || s.meter !== "" || s.sek !== "" || (s.text || "").trim() !== "";
}

// Ein Satz als Text: "10 × 40 kg" · "1.000 m · 4:30" · "4 min · langsam"
function satzText(s, felder) {
    const teile = [];
    const hat = function (f) { return felder.indexOf(f) !== -1; };
    if (hat("wdh") && s.wdh !== "" && hat("kg") && s.gewicht !== "") teile.push(format(s.wdh) + " × " + format(s.gewicht, 1) + " kg");
    else {
        if (hat("wdh") && s.wdh !== "") teile.push(format(s.wdh) + " " + t("wdhKurz"));
        if (hat("kg") && s.gewicht !== "") teile.push(s.gewicht ? format(s.gewicht, 1) + " kg" : t("ohneGewicht"));
    }
    if (hat("m") && s.meter !== "") teile.push(format(s.meter) + " m");
    if (hat("zeit") && s.sek !== "") teile.push(sekZuText(s.sek));
    if (hat("text") && (s.text || "").trim()) teile.push(s.text.trim());
    return teile.join(" · ");
}

// Kurze Zusammenfassung einer Übung, z. B. "3 Sätze · 10 × 40 kg, 10 × 40 kg, 8 × 42,5 kg"
function uebungKurztext(u) {
    u = uebungNormalisieren(u);
    const saetze = u.saetze.filter(satzHatWerte);
    if (!saetze.length) return t("nochLeer");
    return anzahlText("saetzeAnzahl", saetze.length) + " · " +
        saetze.map(function (s) { return satzText(s, u.felder); }).filter(Boolean).join(", ");
}

// Gesamtzeit (Sekunden) einer Liste von Übungen
function sportSekunden(liste) {
    return liste.reduce(function (summe, u) {
        return summe + (u.saetze || []).reduce(function (s, z) { return s + (Number(z.sek) || 0); }, 0);
    }, 0);
}

// Zusammenfassung: "3 Übungen · 45 min"
function sportTagText(liste) {
    let text = anzahlText("uebungenAnzahl", liste.length);
    const sek = sportSekunden(liste);
    if (sek) text += " · " + format(Math.round(sek / 60)) + " min";
    return text;
}

// Kopie einer Übung (ohne id), damit Tage/Sessions sich nicht gegenseitig verändern
function uebungKopie(u) {
    return uebungNormalisieren(JSON.parse(JSON.stringify(u || {})));
}

function sportVon(datum) {
    return daten.sport.tage[datum] || [];
}

function sessionNameVon(datum) {
    return daten.sport.sessionNamen[datum] || "";
}

function sportSpeichern() {
    if (!speichern()) { zeigeMeldung(t("fehlerVoll"), true); return false; }
    return true;
}

// Eine Zeile für Listen (Mein Tag, Sport-Fenster, Auswahl)
function uebungZeile(u, beimTippen, rechts) {
    const knopf = el("button", "sport-zeile");
    knopf.type = "button";
    knopf.appendChild(el("span", "sport-icon", uebungIcon(u)));
    const info = el("span", "sport-info");
    info.appendChild(el("strong", "", u.name + (u.videoId ? " 🎬" : "") + (u.vomTrainer ? " 👤" : "")));
    info.appendChild(el("small", "", uebungKurztext(u)));
    knopf.appendChild(info);
    if (rechts) knopf.appendChild(el("span", "knopf-icon klein", rechts));
    knopf.addEventListener("click", beimTippen);
    return knopf;
}

// =====================================================
// "Mein Tag": Sport-Karte unter dem Essen
// =====================================================
function zeichneSportTag() {
    const box = $("sportTag");
    if (!box) return;
    box.innerHTML = "";
    const liste = sportVon(aktuellesDatum);
    const name = sessionNameVon(aktuellesDatum);
    const karte = el("section", "mahlzeit sport-karte");
    const kopf = el("div", "mahlzeit-kopf");
    kopf.appendChild(el("h3", "", "🏋️ " + (name || t("sport"))));
    if (liste.length) kopf.appendChild(el("span", "", sportTagText(liste)));
    karte.appendChild(kopf);

    if (liste.length === 0) karte.appendChild(el("p", "leer klein", t("sportLeer")));
    liste.forEach(function (u) {
        karte.appendChild(uebungZeile(u, function () { oeffneUebung(u.id); }));
    });
    const mehr = el("button", "knopf-hinzu", liste.length ? t("sportOeffnen") : t("sportEintragen"));
    mehr.type = "button";
    mehr.addEventListener("click", oeffneSport);
    karte.appendChild(mehr);
    box.appendChild(karte);
}

// =====================================================
// Sport-Fenster: die Session des Tages
// =====================================================
function oeffneSport() {
    zeichneSport();
    oeffneFenster("dialogSport");
}

function zeichneSport() {
    $("sportTitel").textContent = aktuellesDatum === heuteAlsText()
        ? t("sportHeute")
        : t("sportAm", { datum: datumBeschriftung(aktuellesDatum) });
    $("sessionName").value = sessionNameVon(aktuellesDatum);
    const liste = $("sportListe");
    liste.innerHTML = "";
    const uebungen = sportVon(aktuellesDatum);
    if (uebungen.length === 0) liste.appendChild(el("p", "leer klein", t("sportLeerFenster")));

    uebungen.forEach(function (u, nummer) {
        const zeile = el("div", "sport-eintrag");
        zeile.appendChild(uebungZeile(u, function () { oeffneUebung(u.id); }));
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

    $("sportSessionSpeichern").hidden = uebungen.length === 0;
}

// Name der Session merken (z. B. "HYROX Einheit")
function sessionNameGeaendert() {
    const name = $("sessionName").value.trim().slice(0, 40);
    if (name) daten.sport.sessionNamen[aktuellesDatum] = name;
    else delete daten.sport.sessionNamen[aktuellesDatum];
    sportSpeichern();
    zeichneSportTag();
}

// Session für später speichern – gleicher Name = alte Fassung wird ersetzt
function sessionSpeichern() {
    sessionNameGeaendert();
    const uebungen = sportVon(aktuellesDatum);
    if (!uebungen.length) return;
    const name = sessionNameVon(aktuellesDatum) || t("sessionStandardname", { datum: datumBeschriftung(aktuellesDatum) });
    const vorhanden = daten.sport.pakete.find(function (p) { return p.name.toLowerCase() === name.toLowerCase(); });
    const alteVideos = vorhanden ? vorhanden.uebungen.map(function (u) { return u.videoId; }) : [];
    if (vorhanden) vorhanden.uebungen = uebungen.map(uebungKopie);
    else daten.sport.pakete.push({ id: neueId(), name: name.slice(0, 40), uebungen: uebungen.map(uebungKopie) });
    if (sportSpeichern()) zeigeMeldung(t(vorhanden ? "sessionAktualisiert" : "sessionGespeichert", { name: name }));
    alteVideos.forEach(videoAufraeumen);
}

// Übungen in den aktuellen Tag kopieren (optional mit Session-Name)
function uebungenUebernehmen(vorlagen, name) {
    if (!daten.sport.tage[aktuellesDatum]) daten.sport.tage[aktuellesDatum] = [];
    vorlagen.forEach(function (v) {
        const u = uebungKopie(v);
        u.id = neueId();
        daten.sport.tage[aktuellesDatum].push(u);
    });
    if (name && !sessionNameVon(aktuellesDatum)) daten.sport.sessionNamen[aktuellesDatum] = name;
    sportSpeichern();
    zeichneSport();
    zeichneSportTag();
}

// =====================================================
// Gespeicherte Übungen & Sessions auswählen
// =====================================================
function oeffneBloecke(modus) {
    blockModus = modus;
    $("blockSuche").value = "";
    $("bloeckeTitel").textContent = t(modus === "session" ? "sessionsTitel" : "bloeckeTitel");
    zeichneBloecke();
    oeffneFenster("dialogBloecke");
}

function zeichneBloecke() {
    const such = $("blockSuche").value.trim().toLowerCase();
    const zeigeSessions = blockModus === "session";
    $("blockGanzeTitel").hidden = true;
    $("blockEinzelnTitel").hidden = true;

    // 1. Ganze Sessions: gespeicherte + frühere Trainingstage
    const ganze = $("blockGanze");
    ganze.innerHTML = "";
    if (zeigeSessions) {
        const angebote = [];
        daten.sport.pakete.forEach(function (p) {
            angebote.push({ titel: "📦 " + p.name, name: p.name, text: sportTagText(p.uebungen), uebungen: p.uebungen, paket: p });
        });
        Object.keys(daten.sport.tage).filter(function (d) { return d !== aktuellesDatum && daten.sport.tage[d].length; })
            .sort().reverse().slice(0, 8).forEach(function (d) {
                const liste = daten.sport.tage[d];
                const name = sessionNameVon(d);
                angebote.push({
                    titel: "📅 " + datumBeschriftung(d) + (name ? " · " + name : ""),
                    name: name,
                    text: liste.map(function (u) { return u.name; }).join(", "),
                    uebungen: liste
                });
            });
        const gefiltert = angebote.filter(function (a) {
            return !such || a.titel.toLowerCase().includes(such) || a.text.toLowerCase().includes(such);
        });
        if (!gefiltert.length) ganze.appendChild(el("p", "leer klein", t(such ? "nichtsGefunden" : "sessionsLeer")));
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
                uebungenUebernehmen(a.uebungen, a.name);
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
    }

    // 2. Einzelne Übungen (Blöcke)
    const einzeln = $("blockEinzeln");
    einzeln.innerHTML = "";
    if (zeigeSessions) return;
    const bloecke = daten.sport.bloecke
        .filter(function (b) { return !such || b.name.toLowerCase().includes(such); })
        .sort(function (a, b) { return a.name.localeCompare(b.name, gebietsschema()); });
    if (bloecke.length === 0) einzeln.appendChild(el("p", "leer klein", t(such ? "nichtsGefunden" : "bloeckeLeer")));
    bloecke.forEach(function (b) {
        const zeile = el("div", "sport-eintrag");
        zeile.appendChild(uebungZeile(b, function () {
            // Übernehmen und gleich zum Anpassen öffnen
            const vorlage = uebungKopie(b);
            vorlage.blockId = b.id;
            vorlage.id = neueId();
            if (!daten.sport.tage[aktuellesDatum]) daten.sport.tage[aktuellesDatum] = [];
            daten.sport.tage[aktuellesDatum].push(vorlage);
            sportSpeichern();
            schliesseFenster("dialogBloecke");
            zeichneSport();
            zeichneSportTag();
            zeigeMeldung(t("uebungUebernommen", { name: b.name }));
            oeffneUebung(vorlage.id);
        }, "＋"));
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
function leererSatz() {
    return { wdh: "", gewicht: "", meter: "", sek: "", text: "" };
}

function neueUebung() {
    uebungBearbeiteId = null;
    uebungFelderGewaehlt = false;
    uebungEntwurf = uebungNormalisieren({ name: "", felder: ["wdh", "kg"], saetze: [leererSatz()] });
    zeichneUebung();
    oeffneFenster("dialogUebung");
    $("uebungName").focus(); // direkt den Namen eintippen
}

function oeffneUebung(id) {
    const u = sportVon(aktuellesDatum).find(function (x) { return x.id === id; });
    if (!u) return;
    uebungBearbeiteId = id;
    uebungFelderGewaehlt = true;
    uebungEntwurf = uebungKopie(u);
    if (!uebungEntwurf.saetze.length) uebungEntwurf.saetze.push(leererSatz());
    zeichneUebung();
    oeffneFenster("dialogUebung");
}

function zeichneUebung() {
    const u = uebungEntwurf;
    $("uebungTitel").textContent = uebungIcon(u) + " " + t(uebungBearbeiteId ? "uebungBearbeiten" : "uebungNeuTitel");
    $("uebungName").value = u.name;
    $("uebungNotiz").value = u.notiz || "";
    $("uebungFehler").textContent = "";
    $("uebungLoeschen").hidden = !uebungBearbeiteId;
    zeichneFelderWahl();
    zeichneSaetze();
    zeichneUebungVideo();
}

// Schalter: Wdh. · kg · Meter · Zeit · Notiz
function zeichneFelderWahl() {
    const box = $("uebungFelder");
    box.innerHTML = "";
    UEBUNG_FELDER.forEach(function (feld) {
        const an = uebungEntwurf.felder.indexOf(feld) !== -1;
        const knopf = el("button", "chip" + (an ? " aktiv" : ""), t("feld_" + feld));
        knopf.type = "button";
        knopf.dataset.feld = feld;
        knopf.setAttribute("aria-pressed", an ? "true" : "false");
        knopf.addEventListener("click", function () {
            const liste = uebungEntwurf.felder;
            if (an && liste.length === 1) return; // mindestens ein Feld
            uebungEntwurf.felder = an ? liste.filter(function (f) { return f !== feld; })
                : UEBUNG_FELDER.filter(function (f) { return f === feld || liste.indexOf(f) !== -1; });
            uebungFelderGewaehlt = true;
            zeichneFelderWahl();
            zeichneSaetze();
        });
        box.appendChild(knopf);
    });
}

function zeichneSaetze() {
    const liste = $("uebungSaetze");
    liste.innerHTML = "";
    const felder = uebungEntwurf.felder;
    uebungEntwurf.saetze.forEach(function (satz, nummer) {
        const zeile = el("div", "satz-zeile");
        zeile.appendChild(el("span", "satz-nr", (nummer + 1) + "."));
        const beschriftung = t("satzNr", { nr: nummer + 1 });
        function zahlFeld(schluessel, einheit, platzhalter, dezimal) {
            const feld = el("input", "satz-feld");
            feld.type = "text";
            feld.inputMode = dezimal ? "decimal" : "numeric";
            feld.placeholder = platzhalter;
            feld.dataset.feld = schluessel;
            feld.value = satz[schluessel] === "" ? "" : feldWert(satz[schluessel]);
            feld.setAttribute("aria-label", beschriftung + " – " + einheit);
            feld.addEventListener("input", function () {
                satz[schluessel] = feld.value.trim() === "" ? "" : zahl(feld.value);
                $("uebungFehler").textContent = "";
            });
            zeile.appendChild(feld);
            zeile.appendChild(el("span", "satz-einheit", einheit));
        }
        if (felder.indexOf("wdh") !== -1) zahlFeld("wdh", t("wdhKurz") + (felder.indexOf("kg") !== -1 ? " ×" : ""), "10", false);
        if (felder.indexOf("kg") !== -1) zahlFeld("gewicht", "kg", "40", true);
        if (felder.indexOf("m") !== -1) zahlFeld("meter", "m", "1000", false);
        if (felder.indexOf("zeit") !== -1) {
            const feld = el("input", "satz-feld zeit");
            feld.type = "text";
            feld.inputMode = "numeric";
            feld.placeholder = "4:30";
            feld.dataset.feld = "zeit";
            feld.value = sekZuFeld(satz.sek);
            feld.setAttribute("aria-label", beschriftung + " – " + t("feld_zeit"));
            feld.addEventListener("input", function () { satz.sek = zeitZuSek(feld.value); $("uebungFehler").textContent = ""; });
            zeile.appendChild(feld);
        }
        if (felder.indexOf("text") !== -1) {
            const text = el("input", "satz-text");
            text.type = "text";
            text.maxLength = 60;
            text.placeholder = t("satzTextPh");
            text.dataset.feld = "text";
            text.value = satz.text || "";
            text.setAttribute("aria-label", beschriftung + " – " + t("feld_text"));
            text.addEventListener("input", function () { satz.text = text.value; });
            zeile.appendChild(text);
        }
        const weg = el("button", "knopf-icon klein", "✕");
        weg.type = "button";
        weg.setAttribute("aria-label", t("entfernen") + ": " + beschriftung);
        weg.addEventListener("click", function () {
            uebungEntwurf.saetze.splice(nummer, 1);
            zeichneSaetze();
        });
        zeile.appendChild(weg);
        liste.appendChild(zeile);
    });
    $("uebungWiederholen").hidden = uebungEntwurf.saetze.length < 2;
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
    const ok = function (v) { return v === "" || (typeof v === "number" && v >= 0 && isFinite(v)); };
    if (!u.saetze.every(function (s) { return ok(s.wdh) && ok(s.gewicht) && ok(s.meter) && ok(s.sek); })) {
        $("uebungFehler").textContent = t("fehlerZahlenZeit");
        return;
    }
    // Nur die gewählten Felder behalten, leere Sätze weglassen
    u.saetze = u.saetze.map(function (s) {
        return {
            wdh: u.felder.indexOf("wdh") !== -1 ? s.wdh : "",
            gewicht: u.felder.indexOf("kg") !== -1 ? s.gewicht : "",
            meter: u.felder.indexOf("m") !== -1 ? s.meter : "",
            sek: u.felder.indexOf("zeit") !== -1 ? s.sek : "",
            text: u.felder.indexOf("text") !== -1 ? (s.text || "").trim() : ""
        };
    }).filter(satzHatWerte);

    // Trainer trägt für eine Sportlerin ein → nicht im eigenen Plan speichern, sondern schicken
    if (uebungZiel) {
        const ziel = uebungZiel;
        uebungZiel = null;
        ziel(uebungKopie(u));
        schliesseFenster("dialogUebung");
        return;
    }

    // Block (Bibliothek) anlegen oder auffrischen: gleicher Name = gleiche Übung
    let block = u.blockId ? daten.sport.bloecke.find(function (b) { return b.id === u.blockId; }) : null;
    if (!block) block = daten.sport.bloecke.find(function (b) { return b.name.toLowerCase() === u.name.toLowerCase(); });
    if (!block) { block = { id: neueId() }; daten.sport.bloecke.push(block); }
    const altesBlockVideo = block.videoId;
    Object.assign(block, uebungKopie(u), { blockId: null, vomTrainer: false });
    u.blockId = block.id;

    // In den Tag eintragen bzw. dort ersetzen
    if (!daten.sport.tage[aktuellesDatum]) daten.sport.tage[aktuellesDatum] = [];
    const tag = daten.sport.tage[aktuellesDatum];
    let altesVideo = null;
    if (uebungBearbeiteId) {
        const stelle = tag.findIndex(function (x) { return x.id === uebungBearbeiteId; });
        if (stelle !== -1) { altesVideo = tag[stelle].videoId; tag[stelle] = Object.assign(uebungKopie(u), { id: uebungBearbeiteId }); }
    } else {
        tag.push(Object.assign(uebungKopie(u), { id: neueId() }));
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
    $("sportNeu").addEventListener("click", function () { neueUebung(); });
    $("sportBloecke").addEventListener("click", function () { oeffneBloecke("einzeln"); });
    $("sportSessions").addEventListener("click", function () { oeffneBloecke("session"); });
    $("sportSessionSpeichern").addEventListener("click", sessionSpeichern);
    $("sessionName").addEventListener("change", sessionNameGeaendert);
    $("sessionName").addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); $("sessionName").blur(); } });
    $("blockSuche").addEventListener("input", zeichneBloecke);

    // Name getippt → passende Felder vorschlagen (solange man sie nicht selbst gewählt hat)
    $("uebungName").addEventListener("input", function () {
        if (uebungFelderGewaehlt || !uebungEntwurf) return;
        const vorschlag = felderVorschlag($("uebungName").value);
        if (vorschlag.join() !== uebungEntwurf.felder.join()) {
            uebungEntwurf.felder = vorschlag;
            zeichneFelderWahl();
            zeichneSaetze();
        }
        $("uebungTitel").textContent = uebungIcon({ name: $("uebungName").value, felder: uebungEntwurf.felder }) + " " + t("uebungNeuTitel");
    });

    $("uebungSatzPlus").addEventListener("click", function () {
        const letzter = uebungEntwurf.saetze[uebungEntwurf.saetze.length - 1];
        uebungEntwurf.saetze.push(letzter ? Object.assign({}, letzter) : leererSatz());
        zeichneSaetze();
        const zeilen = $("uebungSaetze").querySelectorAll(".satz-zeile");
        const erstes = zeilen.length ? zeilen[zeilen.length - 1].querySelector("input") : null;
        if (erstes) erstes.focus();
    });
    // Alle Sätze nochmal anhängen (z. B. 4 min langsam + 1 min schnell → noch eine Runde)
    $("uebungWiederholen").addEventListener("click", function () {
        uebungEntwurf.saetze = uebungEntwurf.saetze.concat(uebungEntwurf.saetze.map(function (s) { return Object.assign({}, s); }));
        zeichneSaetze();
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
