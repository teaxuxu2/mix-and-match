// =====================================================
// Creator / Influencer (Datenbank-Agent)
// =====================================================
// Jeder Creator bekommt einen Story-Kreis oben in der App und ein Profil.
// Seine Rezepte stehen in startdaten.js mit  influencer: "<id>".
//
// Felder:  fixiert      = steht immer ganz vorne (für Ivy, die Gründerin)
//          foto         = Pfad zum Porträt; fehlt es, zeigt die App die Initialen
//          stand        = wird bei jedem neuen Rezept um 1 erhöht → Kreis leuchtet wieder
//                         und rückt nach vorne, bis man das Profil öffnet
//          aktualisiert = Datum der letzten Änderung (Sortierung: neueste zuerst)
// Wichtig: Nur mit ausdrücklicher Zustimmung des Creators eintragen (Name, Foto, Inhalte).

const INFLUENCER = [
    {
        id: "teaxuxu",
        name: "Tea Xuxu",
        handle: "teaxuxu",
        instagram: "https://www.instagram.com/teaxuxu/",
        foto: "bilder/influencer/teaxuxu.jpg",
        fixiert: true,
        titel: { de: "Gründerin von Mix & Match", en: "Founder of Mix & Match" },
        bio: { de: [], en: [] },
        codes: [],
        stand: 2,                   // 2 = Carnivore-Brot dazugekommen
        aktualisiert: "2026-10-26",
        zustimmung: "Eigenes Profil (Ivy)"
    },
    {
        id: "fitfabi",
        name: "Fabian",
        handle: "fitfabi_graz",
        instagram: "https://www.instagram.com/fitfabi_graz/",
        foto: "bilder/influencer/fitfabi.jpg",
        titel: { de: "Hybrid-Athlet & Coach", en: "Hybrid athlete & coach" },
        bio: {
            de: ["🎯 Road to Ironman 70.3 + HYROX", "🏊 Training • Wettkämpfe • Ernährung"],
            en: ["🎯 Road to Ironman 70.3 + HYROX", "🏊 Training • Races • Nutrition"]
        },
        codes: [
            { marke: "TEVEO", code: "FITFABI10" },
            { marke: "PROZIS", code: "FABIANFIT10" }
        ],
        stand: 1,
        aktualisiert: "2026-10-26",
        zustimmung: "Über Ivy, 26.10.2026"
    }
];
