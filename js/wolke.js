/* =====================================================
   Mix & Match Calories – Wolke (Online-Speicher bei Supabase)
   =====================================================
   Diese Datei ist die EINZIGE, die mit dem Online-Speicher spricht.
   Wohnhaus-Bild: das Bürogebäude in der Stadt mit abgeschlossenen Fächern.
   Der Bote (diese Datei) bringt Kopien hin und holt Post (Einträge vom Trainer) ab.

   Alle Funktionen geben Promises zurück. In den Tests wird statt der echten Wolke
   eine nachgestellte benutzt (window.WOLKE_TEST) – die hat genau dieselben Funktionen.
*/

const SUPABASE_ADRESSE = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js";

function echteWolke() {
    let client = null;
    let laden = null;

    function konfiguriert() {
        return typeof WOLKE_KONFIG !== "undefined" && !!WOLKE_KONFIG.url && !!WOLKE_KONFIG.anonSchluessel;
    }

    function bereit() {
        if (client) return Promise.resolve(client);
        if (!konfiguriert()) return Promise.reject(new Error("nicht eingerichtet"));
        if (!laden) {
            laden = new Promise(function (fertig, fehler) {
                if (window.supabase) { fertig(); return; }
                const skript = document.createElement("script");
                skript.src = SUPABASE_ADRESSE;
                skript.onload = fertig;
                skript.onerror = function () { laden = null; fehler(new Error("offline")); };
                document.head.appendChild(skript);
            }).then(function () {
                client = window.supabase.createClient(WOLKE_KONFIG.url, WOLKE_KONFIG.anonSchluessel, {
                    auth: { persistSession: true, autoRefreshToken: true, storageKey: "mmc_wolke_sitzung" }
                });
                return client;
            });
        }
        return laden;
    }

    // Antwort von Supabase prüfen: Fehler → Promise wird abgelehnt
    function pruefen(antwort) {
        if (antwort.error) throw antwort.error;
        return antwort.data;
    }

    function ich() {
        return bereit().then(function (c) { return c.auth.getSession(); })
            .then(function (a) { return a.data && a.data.session ? a.data.session.user : null; });
    }

    function meineId() {
        return ich().then(function (u) { if (!u) throw new Error("nicht angemeldet"); return u.id; });
    }

    return {
        konfiguriert: konfiguriert,

        // ---------- Konto ----------
        sitzung: function () {
            if (!konfiguriert()) return Promise.resolve(null);
            // Noch nie angemeldet und kein Bestätigungs-Link geöffnet? Dann Supabase gar nicht erst laden.
            const ausLink = /access_token|refresh_token|type=signup/.test(location.hash) || /[?&]code=/.test(location.search);
            let gemerkt = null;
            try { gemerkt = localStorage.getItem("mmc_wolke_sitzung"); } catch (e) { gemerkt = null; }
            if (!client && !gemerkt && !ausLink) return Promise.resolve(null);
            return ich().catch(function () { return null; });
        },
        registrieren: function (email, passwort, name) {
            return bereit().then(function (c) {
                return c.auth.signUp({
                    email: email, password: passwort,
                    options: { data: { name: name }, emailRedirectTo: location.origin + location.pathname }
                });
            }).then(pruefen).then(function (d) { return { bestaetigen: !d.session }; });
        },
        anmelden: function (email, passwort) {
            return bereit().then(function (c) { return c.auth.signInWithPassword({ email: email, password: passwort }); })
                .then(pruefen);
        },
        abmelden: function () {
            return bereit().then(function (c) { return c.auth.signOut(); });
        },
        profil: function () {
            return Promise.all([bereit(), meineId()]).then(function (w) {
                return w[0].from("profil").select("*").eq("id", w[1]).maybeSingle();
            }).then(pruefen);
        },
        nameSpeichern: function (name) {
            return Promise.all([bereit(), meineId()]).then(function (w) {
                return w[0].from("profil").update({ name: name }).eq("id", w[1]);
            }).then(pruefen);
        },

        // ---------- Eigene Daten (Sportlerin) ----------
        hochladen: function (sport, essen) {
            return Promise.all([bereit(), meineId()]).then(function (w) {
                const jetzt = new Date().toISOString();
                return Promise.all([
                    w[0].from("sport_daten").upsert({ sportler_id: w[1], daten: sport, geaendert: jetzt }).then(pruefen),
                    w[0].from("essen_daten").upsert({ sportler_id: w[1], daten: essen, geaendert: jetzt }).then(pruefen)
                ]);
            });
        },
        eigeneLaden: function () {
            return Promise.all([bereit(), meineId()]).then(function (w) {
                return Promise.all([
                    w[0].from("sport_daten").select("daten").eq("sportler_id", w[1]).maybeSingle().then(pruefen),
                    w[0].from("essen_daten").select("daten").eq("sportler_id", w[1]).maybeSingle().then(pruefen)
                ]);
            }).then(function (r) { return { sport: r[0] ? r[0].daten : null, essen: r[1] ? r[1].daten : null }; });
        },

        // ---------- Verbindungen ----------
        einladungErstellen: function () {
            const zeichen = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
            let code = "";
            for (let i = 0; i < 6; i++) code += zeichen[Math.floor(Math.random() * zeichen.length)];
            return Promise.all([bereit(), meineId()]).then(function (w) {
                return w[0].from("verbindung").insert({ sportler_id: w[1], einladecode: code }).select().single();
            }).then(pruefen);
        },
        // Meine Verbindungen als Sportlerin (mit Namen der Trainer)
        meineTrainer: function () {
            return Promise.all([bereit(), meineId()]).then(function (w) {
                return w[0].from("verbindung").select("id, trainer_id, einladecode, essen_sichtbar").eq("sportler_id", w[1])
                    .order("erstellt").then(pruefen).then(function (liste) {
                        const ids = liste.map(function (v) { return v.trainer_id; }).filter(Boolean);
                        if (!ids.length) return liste;
                        return w[0].from("profil").select("id, name").in("id", ids).then(pruefen).then(function (profile) {
                            liste.forEach(function (v) {
                                const p = profile.find(function (x) { return x.id === v.trainer_id; });
                                v.trainer_name = p ? p.name : "";
                            });
                            return liste;
                        });
                    });
            });
        },
        essenFreigeben: function (verbindungId, sichtbar) {
            return bereit().then(function (c) {
                return c.from("verbindung").update({ essen_sichtbar: sichtbar }).eq("id", verbindungId);
            }).then(pruefen);
        },
        verbindungBeenden: function (verbindungId) {
            return bereit().then(function (c) { return c.from("verbindung").delete().eq("id", verbindungId); }).then(pruefen);
        },
        einladungAnnehmen: function (code) {
            return bereit().then(function (c) { return c.rpc("einladung_annehmen", { code: code }); }).then(pruefen);
        },

        // ---------- Trainer ----------
        meineSportler: function () {
            return Promise.all([bereit(), meineId()]).then(function (w) {
                return w[0].from("verbindung").select("id, sportler_id, essen_sichtbar").eq("trainer_id", w[1])
                    .then(pruefen).then(function (liste) {
                        if (!liste.length) return liste;
                        return w[0].from("profil").select("id, name").in("id", liste.map(function (v) { return v.sportler_id; }))
                            .then(pruefen).then(function (profile) {
                                liste.forEach(function (v) {
                                    const p = profile.find(function (x) { return x.id === v.sportler_id; });
                                    v.name = p ? p.name : "";
                                });
                                return liste;
                            });
                    });
            });
        },
        sportlerLaden: function (sportlerId) {
            return bereit().then(function (c) {
                return Promise.all([
                    c.from("sport_daten").select("daten").eq("sportler_id", sportlerId).maybeSingle().then(pruefen),
                    c.from("essen_daten").select("daten").eq("sportler_id", sportlerId).maybeSingle().then(pruefen),
                    c.from("trainer_eintrag").select("*").eq("sportler_id", sportlerId).order("erstellt").then(pruefen)
                ]);
            }).then(function (r) {
                return { sport: r[0] ? r[0].daten : null, essen: r[1] ? r[1].daten : null, eintraege: r[2] || [] };
            });
        },
        eintragSenden: function (sportlerId, bereich, datum, inhalt) {
            return Promise.all([bereit(), meineId()]).then(function (w) {
                return w[0].from("trainer_eintrag").insert({
                    sportler_id: sportlerId, trainer_id: w[1], bereich: bereich, datum: datum, inhalt: inhalt
                }).select().single();
            }).then(pruefen);
        },
        eintragZurueckziehen: function (id) {
            return bereit().then(function (c) { return c.from("trainer_eintrag").delete().eq("id", id); }).then(pruefen);
        },

        // ---------- Post vom Trainer (Sportlerin) ----------
        offeneEintraege: function () {
            return Promise.all([bereit(), meineId()]).then(function (w) {
                return w[0].from("trainer_eintrag").select("*").eq("sportler_id", w[1]).eq("status", "offen").order("erstellt");
            }).then(pruefen);
        },
        eintragStatus: function (id, status) {
            return bereit().then(function (c) { return c.from("trainer_eintrag").update({ status: status }).eq("id", id); })
                .then(pruefen);
        },

        // ---------- Gemeinsame Inhalte (für alle) ----------
        // Lesen geht ohne Anmeldung und ohne Bibliothek – ein einfacher Abruf
        gemeinsamLaden: function () {
            if (!konfiguriert()) return Promise.resolve([]);
            return fetch(WOLKE_KONFIG.url + "/rest/v1/gemeinsam?select=id,daten&geloescht=eq.false&order=geaendert", {
                headers: { apikey: WOLKE_KONFIG.anonSchluessel, Authorization: "Bearer " + WOLKE_KONFIG.anonSchluessel }
            }).then(function (antwort) {
                if (antwort.status === 404) return []; // Tabelle noch nicht angelegt
                if (!antwort.ok) throw new Error("HTTP " + antwort.status);
                return antwort.json();
            });
        },
        gemeinsamSpeichern: function (id, eintrag) {
            return Promise.all([bereit(), meineId()]).then(function (w) {
                return w[0].from("gemeinsam").upsert({ id: id, daten: eintrag, geloescht: false, geaendert: new Date().toISOString(), von: w[1] });
            }).then(pruefen);
        },
        gemeinsamLoeschen: function (id) {
            return bereit().then(function (c) {
                return c.from("gemeinsam").update({ geloescht: true, geaendert: new Date().toISOString() }).eq("id", id);
            }).then(pruefen);
        },

        // ---------- Videos ----------
        videoHochladen: function (pfad, blob) {
            return bereit().then(function (c) {
                return c.storage.from("videos").upload(pfad, blob, { upsert: true, contentType: blob.type || "video/mp4" });
            }).then(pruefen);
        },
        videoAdresse: function (pfad) {
            return bereit().then(function (c) { return c.storage.from("videos").createSignedUrl(pfad, 3600); })
                .then(pruefen).then(function (d) { return d.signedUrl; });
        }
    };
}

// In den Tests: nachgestellte Wolke statt der echten
const wolke = window.WOLKE_TEST || echteWolke();
