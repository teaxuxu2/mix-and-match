/* Mix & Match Calories – Service Worker
   Sorgt dafür, dass die App auch ohne Internet startet (z. B. im Fitnessstudio-Keller).
   Regel: immer zuerst das Neueste aus dem Netz holen; nur wenn das nicht klappt, die gespeicherte Kopie.
   "no-cache" heißt: beim Server nachfragen, ob es Neues gibt (nicht die alte Browser-Kopie nehmen).
   Wohnhaus-Bild: ein Notvorrat im Keller – benutzt wird er nur, wenn der Laden zu hat. */
const VORRAT = "mmc-vorrat-v14";
const DATEIEN = [
    "./", "./index.html", "./manifest.webmanifest", "./css/style.css",
    "./js/texte.js", "./js/startdaten.js", "./js/gemeinsam.js", "./js/influencer.js", "./js/speicher.js",
    "./js/online.js", "./js/scanner.js", "./js/uebungen.js", "./js/sport.js", "./js/wolke-konfig.js", "./js/wolke.js",
    "./js/konto.js", "./js/sprache-eingabe.js", "./js/app.js",
    "./bilder/icon/icon-192.png", "./bilder/icon/icon-512.png", "./bilder/icon/apple-touch-icon.png", "./bilder/icon/apple-touch-icon-167.png", "./bilder/icon/apple-touch-icon-152.png",
    "./bilder/influencer/teaxuxu.jpg", "./bilder/influencer/fitfabi.jpg"
];

self.addEventListener("install", function (e) {
    e.waitUntil(caches.open(VORRAT).then(function (c) {
        return c.addAll(DATEIEN.map(function (d) { return new Request(d, { cache: "reload" }); }));
    }).catch(function () {}));
    self.skipWaiting();
});

self.addEventListener("activate", function (e) {
    e.waitUntil(caches.keys().then(function (namen) {
        return Promise.all(namen.filter(function (n) { return n !== VORRAT; }).map(function (n) { return caches.delete(n); }));
    }).then(function () { return self.clients.claim(); }));
});

self.addEventListener("fetch", function (e) {
    const anfrage = e.request;
    if (anfrage.method !== "GET" || new URL(anfrage.url).origin !== self.location.origin) return; // Online-Speicher etc. nicht anfassen
    e.respondWith(fetch(anfrage, { cache: "no-cache" }).then(function (antwort) {
        if (antwort.ok && anfrage.url.indexOf("version.json") === -1) {
            const kopie = antwort.clone();
            caches.open(VORRAT).then(function (c) { c.put(anfrage, kopie); });
        }
        return antwort;
    }).catch(function () {
        return caches.match(anfrage).then(function (gespeichert) {
            return gespeichert || (anfrage.mode === "navigate" ? caches.match("./index.html") : Response.error());
        });
    }));
});
