/* =====================================================
   Mix & Match Calories – Konto, Online-Sicherung & Trainer
   =====================================================
   - Konto: anmelden / registrieren (E-Mail + Passwort)
   - Sicherung: Die App speichert weiter zuerst auf dem Gerät. Ist man angemeldet,
     geht kurz danach eine Kopie in den Online-Speicher (auch auf andere Geräte).
   - Trainer: Die Sportlerin lädt ihn mit einem Code ein. Sport sieht er immer,
     Essen nur, wenn sie es freigibt. Er kann Übungen eintragen (landen direkt im Plan)
     und Essen vorschlagen (zählt erst, wenn sie es bestätigt).

   Wohnhaus-Bild: Das Konto ist der Schlüssel fürs Bürogebäude in der Stadt.
   Der Trainer bekommt einen Zweitschlüssel – fürs Sport-Fach immer,
   fürs Essen-Fach nur, wenn du ihn ihm gibst.
*/

let wolkeIch = null;            // angemeldete Person { id, email } oder null
let wolkeName = "";
let wolkeAdmin = false;          // darf Inhalte "für alle" speichern
let wolkeBeimEinspielen = false; // während Daten aus der Wolke übernommen werden: nicht gleich wieder hochladen
let wolkeTimer = null;
let wolkeModus = "anmelden";    // im Konto-Fenster: "anmelden" oder "registrieren"
let trainerVorschlaege = [];    // offene Essensvorschläge vom Trainer
let trainerAnsicht = null;      // { id, name, essen_sichtbar } – welche Sportlerin der Trainer gerade ansieht
let trainerDaten = null;        // deren geladene Daten
let trainerDatum = null;
const LOKAL_STAND = "mmc_lokal_stand";
const VIDEOS_OBEN = "mmc_videos_oben";

function lokalerStand() { return Number(kellerLesen(LOKAL_STAND)) || 0; }

// =====================================================
// Sicherung: nach jedem Speichern kurz warten, dann hochladen
// =====================================================
function wolkeMerken() {
    if (wolkeBeimEinspielen) return;
    kellerSchreiben(LOKAL_STAND, String(Date.now()));
    if (!wolkeIch) return;
    clearTimeout(wolkeTimer);
    wolkeTimer = setTimeout(wolkeHochladen, 2500);
}

function wolkePaket() {
    const stand = lokalerStand() || Date.now();
    const kompakt = zuKompakt(daten);
    delete kompakt.sport; // Sport bekommt ein eigenes Fach (Trainer darf es immer sehen)
    return {
        sport: Object.assign({ stand: stand }, daten.sport),
        essen: { stand: stand, kompakt: kompakt }
    };
}

function wolkeHochladen() {
    if (!wolkeIch) return Promise.resolve();
    const paket = wolkePaket();
    return wolke.hochladen(paket.sport, paket.essen).then(function () {
        kellerSchreiben("mmc_wolke_zuletzt", String(Date.now()));
        zeichneKontoStatus();
        return videosHochladen();
    }).catch(function () { /* offline – beim nächsten Speichern nochmal */ });
}

// Videos, die noch nicht oben sind, in den privaten Video-Speicher legen
function videosHochladen() {
    let oben = [];
    try { oben = JSON.parse(kellerLesen(VIDEOS_OBEN) || "[]"); } catch (e) { oben = []; }
    const ids = [];
    function sammeln(liste) { liste.forEach(function (u) { if (u.videoId && ids.indexOf(u.videoId) === -1) ids.push(u.videoId); }); }
    sammeln(daten.sport.bloecke);
    Object.keys(daten.sport.tage).forEach(function (d) { sammeln(daten.sport.tage[d]); });
    const fehlend = ids.filter(function (id) { return oben.indexOf(id) === -1; });
    return fehlend.reduce(function (kette, id) {
        return kette.then(function () {
            return videoLaden(id).then(function (blob) {
                if (!blob) return;
                return wolke.videoHochladen(wolkeIch.id + "/" + id, blob).then(function () {
                    oben.push(id);
                    kellerSchreiben(VIDEOS_OBEN, JSON.stringify(oben));
                });
            }).catch(function () { /* später nochmal */ });
        });
    }, Promise.resolve());
}

// Nach dem Anmelden / beim Start: neuere Daten aus der Wolke übernehmen, sonst eigene hochladen
function wolkeAbgleichen() {
    if (!wolkeIch) return Promise.resolve();
    return wolke.eigeneLaden().then(function (oben) {
        const obenStand = Math.max(oben.sport && oben.sport.stand || 0, oben.essen && oben.essen.stand || 0);
        // Neues Gerät ohne eigene Einträge? Dann immer die Daten aus der Wolke nehmen.
        const lokalLeer = !Object.keys(daten.plan).some(function (d) { return daten.plan[d].length; }) &&
            !daten.lebensmittel.some(function (lm) { return lm.eigenes; }) &&
            !Object.keys(daten.sport.tage).length && !daten.sport.pakete.length;
        if ((obenStand > lokalerStand() || lokalLeer) && oben.essen && oben.essen.kompakt) {
            wolkeBeimEinspielen = true;
            const neu = migrieren(vonKompakt(oben.essen.kompakt));
            const sport = Object.assign({}, oben.sport || {});
            delete sport.stand;
            neu.sport = sport;
            daten = migrieren(neu);
            sprache = daten.einstellungen.sprache;
            speichern();
            kellerSchreiben(LOKAL_STAND, String(obenStand));
            wolkeBeimEinspielen = false;
            allesZeichnen();
            zeigeMeldung(t("wolkeGeladen"));
        } else if (lokalerStand() > obenStand || !oben.essen) {
            if (!lokalerStand()) kellerSchreiben(LOKAL_STAND, String(Date.now()));
            return wolkeHochladen();
        }
    }).catch(function () { wolkeBeimEinspielen = false; });
}

// =====================================================
// Post vom Trainer abholen
// =====================================================
function trainerPostHolen() {
    if (!wolkeIch) return Promise.resolve();
    return wolke.offeneEintraege().then(function (eintraege) {
        let neueUebungen = 0;
        const arbeit = [];
        trainerVorschlaege = [];
        eintraege.forEach(function (e) {
            if (e.bereich === "sport") {
                // Übungen vom Trainer landen direkt im Trainingsplan des Tages
                const u = uebungKopie(e.inhalt || {});
                u.id = neueId();
                u.vomTrainer = true;
                if (!u.name) { arbeit.push(wolke.eintragStatus(e.id, "abgelehnt")); return; }
                if (!daten.sport.tage[e.datum]) daten.sport.tage[e.datum] = [];
                daten.sport.tage[e.datum].push(u);
                const schonBlock = daten.sport.bloecke.some(function (b) {
                    return b.art === u.art && b.name.toLowerCase() === u.name.toLowerCase();
                });
                if (!schonBlock) daten.sport.bloecke.push(Object.assign(uebungKopie(u), { id: neueId(), blockId: null }));
                neueUebungen++;
                arbeit.push(wolke.eintragStatus(e.id, "angenommen"));
            } else {
                trainerVorschlaege.push(e);
            }
        });
        if (neueUebungen) {
            speichern();
            zeigeMeldung(t(neueUebungen === 1 ? "trainerUebung1" : "trainerUebungen", { anzahl: neueUebungen }));
        }
        zeichnePlan();
        return Promise.all(arbeit);
    }).catch(function () { /* offline */ });
}

// Essensvorschläge des Trainers in "Mein Tag" (zählen erst nach Bestätigung)
function zeichneVorschlaege() {
    const box = $("trainerVorschlaege");
    if (!box) return;
    box.innerHTML = "";
    const heute = trainerVorschlaege.filter(function (v) { return v.datum === aktuellesDatum; });
    box.hidden = heute.length === 0;
    if (!heute.length) return;
    const karte = el("section", "mahlzeit vorschlag-karte");
    const kopf = el("div", "mahlzeit-kopf");
    kopf.appendChild(el("h3", "", "💬 " + t("vorschlaegeTitel")));
    kopf.appendChild(el("span", "", t("vorschlaegeHinweis")));
    karte.appendChild(kopf);
    heute.forEach(function (v) {
        const i = v.inhalt || {};
        const gramm = Number(i.gramm) || 100;
        const zeile = el("div", "vorschlag-zeile");
        zeile.appendChild(el("span", "sport-icon", i.emoji || "🍽️"));
        const info = el("span", "sport-info");
        info.appendChild(el("strong", "", (i.name || "?") + " · " + format(gramm) + " g"));
        info.appendChild(el("small", "", format((Number(i.kcal100) || 0) * gramm / 100) + " kcal · " +
            format((Number(i.protein100) || 0) * gramm / 100) + " g " + t("kurzP") + (i.notiz ? " · " + i.notiz : "")));
        zeile.appendChild(info);
        const ja = el("button", "knopf-icon klein vorschlag-ja", "✓");
        ja.type = "button";
        ja.setAttribute("aria-label", t("vorschlagAnnehmen") + ": " + (i.name || ""));
        ja.addEventListener("click", function () { vorschlagAnnehmen(v); });
        const nein = el("button", "knopf-icon klein", "✕");
        nein.type = "button";
        nein.setAttribute("aria-label", t("vorschlagAblehnen") + ": " + (i.name || ""));
        nein.addEventListener("click", function () { vorschlagErledigt(v, "abgelehnt"); });
        zeile.appendChild(ja);
        zeile.appendChild(nein);
        karte.appendChild(zeile);
    });
    box.appendChild(karte);
}

function vorschlagAnnehmen(v) {
    const i = v.inhalt || {};
    let lm = findeLebensmittel(i.lebensmittelId);
    if (!lm) {
        // Lebensmittel kennt die App noch nicht (z. B. eigenes vom Trainer) → als eigenes anlegen
        lm = {
            id: neueId(), name: String(i.name || "?").slice(0, 60), emoji: i.emoji || "🍽️", favorit: false, eigenes: true,
            letzteGramm: Number(i.gramm) || 100,
            kcal100: Number(i.kcal100) || 0, protein100: Number(i.protein100) || 0,
            kh100: Number(i.kh100) || 0, fett100: Number(i.fett100) || 0
        };
        daten.lebensmittel.push(lm);
    }
    if (!daten.plan[v.datum]) daten.plan[v.datum] = [];
    daten.plan[v.datum].push({ id: neueId(), mahlzeit: "tag", lebensmittelId: lm.id, gramm: Number(i.gramm) || 100 });
    speichern();
    zeigeMeldung(t("hinzugefuegtTag", { name: anzeigeName(lm) }));
    vorschlagErledigt(v, "angenommen");
    allesZeichnen();
}

function vorschlagErledigt(v, status) {
    trainerVorschlaege = trainerVorschlaege.filter(function (x) { return x !== v; });
    zeichneVorschlaege();
    wolke.eintragStatus(v.id, status).catch(function () { /* egal */ });
}

// Video einer Übung aus dem Online-Speicher (wenn es nicht auf diesem Gerät liegt)
function wolkeVideoAdresse(videoId) {
    const besitzer = trainerAnsicht ? trainerAnsicht.id : (wolkeIch && wolkeIch.id);
    if (!besitzer || !videoId) return Promise.reject(new Error("kein Video"));
    return wolke.videoAdresse(besitzer + "/" + videoId);
}

// =====================================================
// Konto-Fenster
// =====================================================
function oeffneKonto() {
    zeichneKonto();
    oeffneFenster("dialogKonto");
}

function zeichneKontoStatus() {
    const s = $("kontoSync");
    if (!s) return;
    const zuletzt = Number(kellerLesen("mmc_wolke_zuletzt")) || 0;
    s.textContent = zuletzt
        ? t("wolkeZuletzt", { zeit: new Date(zuletzt).toLocaleString(gebietsschema(), { dateStyle: "short", timeStyle: "short" }) })
        : t("wolkeNochNicht");
}

function zeichneKonto() {
    const box = $("kontoInhalt");
    box.innerHTML = "";
    $("kontoFehler").textContent = "";

    if (!wolke.konfiguriert()) {
        box.appendChild(el("p", "unterzeile", t("wolkeNichtEingerichtet")));
        return;
    }

    if (!wolkeIch) {
        box.appendChild(el("p", "unterzeile", t("kontoErklaerung")));
        const tabs = el("div", "konto-tabs");
        ["anmelden", "registrieren"].forEach(function (modus) {
            const knopf = el("button", "chip" + (wolkeModus === modus ? " aktiv" : ""), t(modus === "anmelden" ? "kontoAnmelden" : "kontoRegistrieren"));
            knopf.type = "button";
            knopf.dataset.modus = modus;
            knopf.addEventListener("click", function () { wolkeModus = modus; zeichneKonto(); });
            tabs.appendChild(knopf);
        });
        box.appendChild(tabs);
        const form = el("form", "konto-form");
        form.noValidate = true;
        if (wolkeModus === "registrieren") form.appendChild(kontoFeld("kontoName", "text", t("kontoNamePh"), "name"));
        form.appendChild(kontoFeld("kontoEmail", "email", t("kontoEmailPh"), "email"));
        form.appendChild(kontoFeld("kontoPasswort", "password", t("kontoPasswortPh"),
            wolkeModus === "registrieren" ? "new-password" : "current-password"));
        const los = el("button", "knopf-primaer breit", t(wolkeModus === "anmelden" ? "kontoAnmelden" : "kontoRegistrieren"));
        los.type = "submit";
        los.id = "kontoLos";
        form.appendChild(los);
        form.addEventListener("submit", function (e) { e.preventDefault(); kontoAbschicken(); });
        box.appendChild(form);
        return;
    }

    // ---------- angemeldet ----------
    box.appendChild(el("p", "unterzeile", t("kontoAngemeldet", { email: wolkeIch.email || "" }) + (wolkeAdmin ? " · 🌍 Admin" : "")));
    const sync = el("p", "konto-sync");
    sync.id = "kontoSync";
    box.appendChild(sync);
    zeichneKontoStatus();

    const nameZeile = el("div", "scan-zeile");
    const name = kontoFeld("kontoNameAendern", "text", t("kontoNamePh"), "name");
    name.value = wolkeName;
    nameZeile.appendChild(name);
    const nameSpeichern = el("button", "knopf-zweit", t("speichernKurz"));
    nameSpeichern.type = "button";
    nameSpeichern.addEventListener("click", function () {
        const neu = name.value.trim();
        wolke.nameSpeichern(neu).then(function () { wolkeName = neu; zeigeMeldung(t("aenderungen")); })
            .catch(function () { $("kontoFehler").textContent = t("wolkeFehler"); });
    });
    nameZeile.appendChild(nameSpeichern);
    box.appendChild(nameZeile);

    // Mein Trainer
    box.appendChild(el("h3", "block-titel", "🏋️ " + t("meinTrainer")));
    box.appendChild(el("p", "unterzeile", t("meinTrainerText")));
    const trainerListe = el("div", "sport-liste");
    trainerListe.id = "kontoTrainer";
    trainerListe.appendChild(el("p", "leer klein", t("laedt")));
    box.appendChild(trainerListe);
    const einladen = el("button", "knopf-zweit breit", t("trainerEinladen"));
    einladen.type = "button";
    einladen.id = "kontoEinladen";
    einladen.addEventListener("click", function () {
        wolke.einladungErstellen().then(function () { zeichneMeineTrainer(); })
            .catch(function () { $("kontoFehler").textContent = t("wolkeFehler"); });
    });
    box.appendChild(einladen);

    // Ich bin Trainer
    box.appendChild(el("h3", "block-titel", "📋 " + t("ichBinTrainer")));
    const codeZeile = el("div", "scan-zeile");
    const code = kontoFeld("kontoCode", "text", t("codePh"), "off");
    code.maxLength = 6;
    code.style.textTransform = "uppercase";
    codeZeile.appendChild(code);
    const verbinden = el("button", "knopf-primaer", t("codeVerbinden"));
    verbinden.type = "button";
    verbinden.id = "kontoCodeLos";
    verbinden.addEventListener("click", function () {
        if (!code.value.trim()) return;
        wolke.einladungAnnehmen(code.value.trim()).then(function () {
            zeigeMeldung(t("codeVerbunden"));
            zeichneMeineSportler();
            code.value = "";
        }).catch(function () { $("kontoFehler").textContent = t("codeFalsch"); });
    });
    codeZeile.appendChild(verbinden);
    box.appendChild(codeZeile);
    const sportlerListe = el("div", "sport-liste");
    sportlerListe.id = "kontoSportler";
    box.appendChild(sportlerListe);

    const ab = el("button", "aktion", t("kontoAbmelden"));
    ab.type = "button";
    ab.id = "kontoAbmelden";
    ab.addEventListener("click", function () {
        wolke.abmelden().then(function () {
            wolkeIch = null; wolkeAdmin = false; trainerVorschlaege = [];
            zeichneKonto(); zeichnePlan(); zeichneKontoKnopf();
        });
    });
    box.appendChild(ab);

    zeichneMeineTrainer();
    zeichneMeineSportler();
}

function kontoFeld(id, typ, platzhalter, autocomplete) {
    const feld = el("input", "eingabe-name");
    feld.id = id; feld.type = typ; feld.placeholder = platzhalter; feld.autocomplete = autocomplete;
    feld.setAttribute("aria-label", platzhalter);
    return feld;
}

function kontoAbschicken() {
    const fehler = $("kontoFehler");
    const email = $("kontoEmail").value.trim();
    const passwort = $("kontoPasswort").value;
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { fehler.textContent = t("kontoEmailFalsch"); return; }
    if (passwort.length < 8) { fehler.textContent = t("kontoPasswortKurz"); return; }
    fehler.textContent = "";
    $("kontoLos").disabled = true;
    const anfrage = wolkeModus === "registrieren"
        ? wolke.registrieren(email, passwort, ($("kontoName").value || "").trim())
        : wolke.anmelden(email, passwort);
    anfrage.then(function (antwort) {
        if (wolkeModus === "registrieren" && antwort && antwort.bestaetigen) {
            $("kontoInhalt").innerHTML = "";
            $("kontoInhalt").appendChild(el("p", "unterzeile", t("kontoBestaetigen", { email: email })));
            wolkeModus = "anmelden";
            return;
        }
        return wolkeStarten().then(function () { zeichneKonto(); zeigeMeldung(t("kontoWillkommen")); });
    }).catch(function (e) {
        const text = String(e && e.message || "");
        fehler.textContent = /invalid|credentials/i.test(text) ? t("kontoFalsch")
            : /already|registered/i.test(text) ? t("kontoGibtEs")
            : /confirm/i.test(text) ? t("kontoNichtBestaetigt") : t("wolkeFehler");
        if ($("kontoLos")) $("kontoLos").disabled = false;
    });
}

// Liste meiner Trainer-Verbindungen (als Sportlerin)
function zeichneMeineTrainer() {
    const liste = $("kontoTrainer");
    if (!liste) return;
    wolke.meineTrainer().then(function (verbindungen) {
        liste.innerHTML = "";
        if (!verbindungen.length) liste.appendChild(el("p", "leer klein", t("nochKeinTrainer")));
        verbindungen.forEach(function (v) {
            const zeile = el("div", "trainer-zeile");
            const info = el("div", "sport-info");
            if (v.trainer_id) {
                info.appendChild(el("strong", "", "👤 " + (v.trainer_name || t("trainer"))));
                const schalter = el("label", "schalter");
                const kasten = el("input");
                kasten.type = "checkbox";
                kasten.checked = !!v.essen_sichtbar;
                kasten.className = "essen-freigabe";
                kasten.addEventListener("change", function () {
                    wolke.essenFreigeben(v.id, kasten.checked).then(function () {
                        zeigeMeldung(t(kasten.checked ? "essenFreigegeben" : "essenVersteckt"));
                    }).catch(function () { kasten.checked = !kasten.checked; $("kontoFehler").textContent = t("wolkeFehler"); });
                });
                schalter.appendChild(kasten);
                schalter.appendChild(el("span", "", t("essenSichtbar")));
                info.appendChild(schalter);
            } else {
                info.appendChild(el("strong", "", t("einladungOffen")));
                const codeText = el("span", "einladecode", v.einladecode);
                info.appendChild(codeText);
                info.appendChild(el("small", "", t("einladungText")));
            }
            zeile.appendChild(info);
            if (!v.trainer_id && navigator.clipboard) {
                const kopieren = el("button", "knopf-zweit", t("kopieren"));
                kopieren.type = "button";
                kopieren.addEventListener("click", function () {
                    navigator.clipboard.writeText(v.einladecode).then(function () { zeigeMeldung(t("kopiert")); }).catch(function () {});
                });
                zeile.appendChild(kopieren);
            }
            zeile.appendChild(loeschKnopf(function () {
                wolke.verbindungBeenden(v.id).then(zeichneMeineTrainer);
            }, v.trainer_name || v.einladecode));
            liste.appendChild(zeile);
        });
    }).catch(function () { liste.innerHTML = ""; liste.appendChild(el("p", "leer klein", t("wolkeFehler"))); });
}

// Liste meiner Sportler (als Trainer)
function zeichneMeineSportler() {
    const liste = $("kontoSportler");
    if (!liste) return;
    wolke.meineSportler().then(function (sportler) {
        liste.innerHTML = "";
        sportler.forEach(function (s) {
            const knopf = el("button", "sport-zeile");
            knopf.type = "button";
            knopf.appendChild(el("span", "sport-icon", "🏃"));
            const info = el("span", "sport-info");
            info.appendChild(el("strong", "", s.name || t("sportlerin")));
            info.appendChild(el("small", "", t(s.essen_sichtbar ? "sportUndEssen" : "nurSport")));
            knopf.appendChild(info);
            knopf.appendChild(el("span", "knopf-icon klein", "›"));
            knopf.addEventListener("click", function () { oeffneTrainerAnsicht(s); });
            liste.appendChild(knopf);
        });
        zeichneKontoKnopf(sportler.length);
    }).catch(function () { /* offline */ });
}

// Kopf-Knopf zeigt, ob man angemeldet ist
function zeichneKontoKnopf() {
    if (typeof zeichneProfil === "function" && $("profilKontoText")) zeichneProfil();
}

// =====================================================
// Trainer-Ansicht: Tag einer Sportlerin ansehen, Übungen eintragen, Essen vorschlagen
// =====================================================
function oeffneTrainerAnsicht(s) {
    // s kommt aus meineSportler(): id = Verbindung, sportler_id = die Sportlerin
    trainerAnsicht = { id: s.sportler_id, name: s.name, essen_sichtbar: !!s.essen_sichtbar };
    trainerDatum = heuteAlsText();
    $("trainerTitel").textContent = s.name || t("sportlerin");
    $("trainerEssenSuche").value = "";
    oeffneFenster("dialogTrainer");
    trainerNeuLaden();
}

function trainerNeuLaden() {
    $("trainerInhalt").innerHTML = "";
    $("trainerInhalt").appendChild(el("p", "leer klein", t("laedt")));
    return wolke.sportlerLaden(trainerAnsicht.id).then(function (d) {
        trainerDaten = d;
        zeichneTrainerAnsicht();
    }).catch(function () {
        $("trainerInhalt").innerHTML = "";
        $("trainerInhalt").appendChild(el("p", "leer klein", t("wolkeFehler")));
    });
}

function zeichneTrainerAnsicht() {
    const box = $("trainerInhalt");
    box.innerHTML = "";
    $("trainerDatum").textContent = datumBeschriftung(trainerDatum);
    const d = trainerDaten || {};

    // --- Sport ---
    box.appendChild(el("h3", "block-titel", "🏋️ " + t("sport")));
    const sportTag = (d.sport && d.sport.tage && d.sport.tage[trainerDatum]) || [];
    if (!sportTag.length) box.appendChild(el("p", "leer klein", t("sportLeer")));
    sportTag.forEach(function (u) { box.appendChild(trainerUebungZeile(u)); });

    // Von mir eingetragen (offen = noch nicht in ihrer App angekommen)
    const meine = (d.eintraege || []).filter(function (e) { return e.datum === trainerDatum && e.status === "offen"; });
    meine.forEach(function (e) {
        const zeile = el("div", "trainer-zeile offen");
        const info = el("div", "sport-info");
        const i = e.inhalt || {};
        info.appendChild(el("strong", "", (e.bereich === "sport" ? uebungIcon(uebungNormalisieren(i)) : "🍽️") + " " + (i.name || "")));
        info.appendChild(el("small", "", t(e.bereich === "sport" ? "wartetSport" : "wartetEssen") +
            (e.bereich === "sport" ? " · " + uebungKurztext(i) : " · " + format(i.gramm || 100) + " g")));
        zeile.appendChild(info);
        zeile.appendChild(loeschKnopf(function () {
            wolke.eintragZurueckziehen(e.id).then(trainerNeuLaden);
        }, i.name || ""));
        box.appendChild(zeile);
    });

    const neu = el("button", "knopf-primaer breit", t("trainerUebungEintragen"));
    neu.type = "button";
    neu.id = "trainerUebungNeu";
    neu.addEventListener("click", trainerUebungNeu);
    box.appendChild(neu);

    // --- Essen ---
    box.appendChild(el("h3", "block-titel", "🍽️ " + t("essen")));
    const essenBox = $("trainerEssenBox");
    if (!trainerAnsicht.essen_sichtbar || !d.essen || !d.essen.kompakt) {
        box.appendChild(el("p", "leer klein", t("essenNichtFreigegeben")));
        essenBox.hidden = true;
        return;
    }
    essenBox.hidden = false;
    const ihre = migrieren(vonKompakt(d.essen.kompakt));
    const eintraege = (ihre.plan[trainerDatum] || []);
    let kcal = 0, protein = 0;
    if (!eintraege.length) box.appendChild(el("p", "leer klein", t("tagLeerTrainer")));
    eintraege.forEach(function (e) {
        const lm = ihre.lebensmittel.find(function (x) { return x.id === e.lebensmittelId; });
        if (!lm) return;
        const w = werteFuer(lm, e.gramm);
        kcal += w.kcal; protein += w.protein;
        const zeile = el("div", "trainer-zeile");
        zeile.appendChild(el("span", "sport-icon", lm.emoji || "🍽️"));
        const info = el("div", "sport-info");
        info.appendChild(el("strong", "", anzeigeName(lm) + " · " + format(e.gramm) + " g"));
        info.appendChild(el("small", "", format(w.kcal) + " kcal · " + format(w.protein) + " g " + t("kurzP")));
        zeile.appendChild(info);
        box.appendChild(zeile);
    });
    if (eintraege.length) {
        const z = ihre.einstellungen;
        box.appendChild(el("p", "trainer-summe", t("trainerSumme", {
            kcal: format(kcal), zielKcal: format(z.zielKcal), protein: format(protein), zielProtein: format(z.zielProtein)
        })));
    }
    zeichneTrainerEssenTreffer();
}

function trainerUebungZeile(u) {
    const zeile = el("div", "trainer-uebung");
    const knopf = el("button", "sport-zeile");
    knopf.type = "button";
    knopf.appendChild(el("span", "sport-icon", uebungIcon(u)));
    const info = el("span", "sport-info");
    info.appendChild(el("strong", "", u.name + (u.videoId ? " 🎬" : "") + (u.vomTrainer ? " 👤" : "")));
    info.appendChild(el("small", "", uebungKurztext(u)));
    knopf.appendChild(info);
    zeile.appendChild(knopf);
    if (u.videoId) {
        knopf.addEventListener("click", function () {
            if (zeile.querySelector("video")) { zeile.querySelector(".video-hoch").remove(); return; }
            const rahmen = el("div", "video-hoch");
            const video = el("video");
            video.controls = true; video.playsInline = true; video.loop = true; video.muted = true;
            rahmen.appendChild(video);
            zeile.appendChild(rahmen);
            wolkeVideoAdresse(u.videoId).then(function (adresse) { video.src = adresse; })
                .catch(function () { rahmen.replaceWith(el("p", "leer klein", t("videoNichtDa"))); });
        });
    }
    return zeile;
}

// Trainer trägt eine Übung ein → wird an die Sportlerin geschickt (landet direkt in ihrem Plan)
function trainerUebungNeu() {
    const sportlerId = trainerAnsicht.id;
    const datum = trainerDatum;
    uebungZiel = function (u) {
        const senden = function () {
            return wolke.eintragSenden(sportlerId, "sport", datum, u).then(function () {
                zeigeMeldung(t("trainerGesendet", { name: u.name }));
                trainerNeuLaden();
            }).catch(function () { zeigeMeldung(t("wolkeFehler"), true); });
        };
        if (!u.videoId) return senden();
        // Video in den Ordner der Sportlerin hochladen, damit sie es sehen kann
        return videoLaden(u.videoId).then(function (blob) {
            return blob ? wolke.videoHochladen(sportlerId + "/" + u.videoId, blob) : null;
        }).then(senden).catch(function () { zeigeMeldung(t("videoFehler"), true); });
    };
    neueUebung();
}

// Essensvorschlag: suchen → Gramm → vorschlagen
function zeichneTrainerEssenTreffer() {
    const box = $("trainerEssenTreffer");
    const text = $("trainerEssenSuche").value;
    box.innerHTML = "";
    if (!text.trim()) return;
    gefilterteLebensmittel(text, "alle").filter(function (lm) { return !lm.rezept || true; }).slice(0, 6).forEach(function (lm) {
        const zeile = el("div", "trainer-zeile");
        zeile.appendChild(bildElement(lm, "klein"));
        const info = el("div", "sport-info");
        info.appendChild(el("strong", "", anzeigeName(lm)));
        info.appendChild(el("small", "", werteText(lm)));
        zeile.appendChild(info);
        const gramm = el("input", "satz-feld");
        gramm.type = "text"; gramm.inputMode = "decimal";
        gramm.value = feldWert(lm.letzteGramm || 100);
        gramm.setAttribute("aria-label", t("gramm"));
        zeile.appendChild(gramm);
        zeile.appendChild(el("span", "satz-einheit", "g"));
        const los = el("button", "knopf-primaer", t("vorschlagen"));
        los.type = "button";
        los.addEventListener("click", function () {
            const g = zahl(gramm.value);
            if (!(g > 0)) { gramm.focus(); return; }
            wolke.eintragSenden(trainerAnsicht.id, "essen", trainerDatum, {
                lebensmittelId: lm.id, name: anzeigeName(lm), emoji: lm.emoji || "🍽️", gramm: g,
                kcal100: lm.kcal100, protein100: lm.protein100, kh100: lm.kh100, fett100: lm.fett100
            }).then(function () {
                zeigeMeldung(t("vorschlagGesendet", { name: anzeigeName(lm) }));
                $("trainerEssenSuche").value = "";
                trainerNeuLaden();
            }).catch(function () { zeigeMeldung(t("wolkeFehler"), true); });
        });
        zeile.appendChild(los);
        box.appendChild(zeile);
    });
}

// =====================================================
// Start
// =====================================================
function wolkeStarten() {
    if (!wolke.konfiguriert()) return Promise.resolve();
    return wolke.sitzung().then(function (u) {
        wolkeIch = u ? { id: u.id, email: u.email } : null;
        zeichneKontoKnopf();
        if (!wolkeIch) return;
        return wolke.profil().then(function (p) { wolkeName = p ? p.name : ""; wolkeAdmin = !!(p && p.admin); }).catch(function () {})
            .then(wolkeAbgleichen)
            .then(trainerPostHolen);
    }).catch(function () { /* offline */ });
}

function kontoVerbinden() {
    $("knopfKonto").addEventListener("click", oeffneKonto);
    $("trainerZurueck").addEventListener("click", function () { trainerDatum = tageVerschieben(trainerDatum, -1); zeichneTrainerAnsicht(); });
    $("trainerVor").addEventListener("click", function () { trainerDatum = tageVerschieben(trainerDatum, 1); zeichneTrainerAnsicht(); });
    $("trainerEssenSuche").addEventListener("input", zeichneTrainerEssenTreffer);
    $("dialogTrainer").addEventListener("close", function () { trainerAnsicht = null; trainerDaten = null; });
    // Wenn man zur App zurückkommt: Post vom Trainer abholen
    document.addEventListener("visibilitychange", function () { if (!document.hidden && wolkeIch) trainerPostHolen(); });
    zeichneKontoKnopf();
    wolkeStarten();
}
