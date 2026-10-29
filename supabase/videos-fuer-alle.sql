-- =====================================================
-- Mix & Match Calories – Übungs-Videos "für alle"
-- =====================================================
-- EINMAL im Supabase-Dashboard ausführen: SQL Editor → New query → einfügen → Run.
--
-- Was es macht:
--   Im Video-Speicher ("videos") gibt es einen Ordner "alle/".
--   - ANSEHEN darf jede/r (auch ohne Konto) – das sind die Anleitungs-Videos der Vorschläge.
--   - HOCHLADEN / ERSETZEN / LÖSCHEN darf nur, wer im Profil admin = true hat (Ivy).
--   Die eigenen Videos der Leute (Ordner mit ihrer Konto-ID) bleiben privat wie bisher.

drop policy if exists "videos_alle_lesen" on storage.objects;
create policy "videos_alle_lesen" on storage.objects
    for select to anon, authenticated
    using (bucket_id = 'videos' and (storage.foldername(name))[1] = 'alle');

drop policy if exists "videos_alle_hochladen" on storage.objects;
create policy "videos_alle_hochladen" on storage.objects
    for insert to authenticated
    with check (bucket_id = 'videos' and (storage.foldername(name))[1] = 'alle'
                and exists (select 1 from public.profil p where p.id = auth.uid() and p.admin));

drop policy if exists "videos_alle_aendern" on storage.objects;
create policy "videos_alle_aendern" on storage.objects
    for update to authenticated
    using (bucket_id = 'videos' and (storage.foldername(name))[1] = 'alle'
           and exists (select 1 from public.profil p where p.id = auth.uid() and p.admin));

drop policy if exists "videos_alle_loeschen" on storage.objects;
create policy "videos_alle_loeschen" on storage.objects
    for delete to authenticated
    using (bucket_id = 'videos' and (storage.foldername(name))[1] = 'alle'
           and exists (select 1 from public.profil p where p.id = auth.uid() and p.admin));
