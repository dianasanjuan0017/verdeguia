-- VerdeGuía PMV v0.1.1 - Permite al equipo (usuarios con sesión) administrar viveros y fichas desde /admin.
-- Para proyectos que YA ejecutaron schema.sql v0.1.0: ejecutar este archivo completo en el SQL Editor.
-- (schema.sql ya incluye estas políticas para instalaciones nuevas.)

drop policy if exists "equipo lee viveros" on viveros;
drop policy if exists "equipo crea viveros" on viveros;
drop policy if exists "equipo edita viveros" on viveros;
drop policy if exists "equipo borra viveros" on viveros;
create policy "equipo lee viveros"   on viveros for select to authenticated using (true);
create policy "equipo crea viveros"  on viveros for insert to authenticated with check (true);
create policy "equipo edita viveros" on viveros for update to authenticated using (true) with check (true);
create policy "equipo borra viveros" on viveros for delete to authenticated using (true);

drop policy if exists "equipo lee fichas" on fichas;
drop policy if exists "equipo crea fichas" on fichas;
drop policy if exists "equipo edita fichas" on fichas;
drop policy if exists "equipo borra fichas" on fichas;
create policy "equipo lee fichas"   on fichas for select to authenticated using (true);
create policy "equipo crea fichas"  on fichas for insert to authenticated with check (true);
create policy "equipo edita fichas" on fichas for update to authenticated using (true) with check (true);
create policy "equipo borra fichas" on fichas for delete to authenticated using (true);
