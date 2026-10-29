/* =====================================================
   Zugang zum Online-Speicher (Supabase)
   =====================================================
   Die Project URL und der "anon public"-Schlüssel dürfen öffentlich im Code stehen:
   Was jemand sehen oder ändern darf, entscheiden die Regeln in der Datenbank
   (supabase/einrichtung.sql). Den geheimen "service_role"-Schlüssel NIE hier eintragen.
   Leer = die App läuft wie bisher nur auf dem Gerät.
*/
const WOLKE_KONFIG = {
    url: "",
    anonSchluessel: ""
};
