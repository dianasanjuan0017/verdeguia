-- VerdeGuía PMV v0.1.2 - Esquema de base de datos (Supabase / PostgreSQL)
-- Ejecutar completo en: Supabase > SQL Editor > New query

create table if not exists viveros (
  id        uuid primary key default gen_random_uuid(),
  nombre    text not null,
  contacto  text not null,
  es_demo   boolean not null default true
);

create table if not exists fichas (
  codigo    text primary key check (codigo ~ '^[A-Za-z0-9-]{3,32}$'),
  vivero_id uuid not null references viveros(id),
  planta    text not null,
  cuidados  text,
  imagen_path text,
  es_demo   boolean not null default true
);

-- Solo se guarda lo necesario para la métrica: código, fecha-hora y marca de prueba.
-- No se guarda IP, navegador ni datos del dispositivo.
create table if not exists accesos (
  id          bigint generated always as identity primary key,
  codigo      text not null,
  fecha_hora  timestamptz not null default now(),
  es_prueba   boolean not null default false
);
create index if not exists accesos_fecha_idx on accesos (fecha_hora desc);

-- Seguridad a nivel de fila: el público NO puede leer ni escribir tablas directamente.
alter table viveros enable row level security;
alter table fichas  enable row level security;
alter table accesos enable row level security;

drop policy if exists "equipo lee accesos" on accesos;
create policy "equipo lee accesos" on accesos
  for select to authenticated using (true);

-- Administración de viveros y fichas desde /admin (solo usuarios con sesión).
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

-- Única puerta pública: busca la ficha y, si existe, registra el acceso.
create or replace function registrar_acceso(p_codigo text, p_es_prueba boolean default false)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v record;
begin
  if p_codigo is null or p_codigo !~ '^[A-Za-z0-9-]{3,32}$' then
    return null;
  end if;

  select f.codigo, f.planta, f.cuidados, f.imagen_path, f.es_demo, vi.nombre as vivero, vi.contacto
    into v
    from fichas f
    join viveros vi on vi.id = f.vivero_id
   where f.codigo = p_codigo;

  if not found then
    return null;  -- código inexistente: no se registra nada
  end if;

  insert into accesos (codigo, es_prueba) values (v.codigo, coalesce(p_es_prueba, false));

  return jsonb_build_object(
    'codigo',   v.codigo,
    'planta',   v.planta,
    'cuidados', v.cuidados,
    'imagen',   v.imagen_path,
    'vivero',   v.vivero,
    'contacto', v.contacto,
    'es_demo',  v.es_demo
  );
end;
$$;

revoke all on function registrar_acceso(text, boolean) from public;
grant execute on function registrar_acceso(text, boolean) to anon, authenticated;

-- Fotos de las fichas (v0.1.2)
-- Bucket público de lectura: las fotos de las plantas se ven sin iniciar sesión.
-- Límite de 2 MB y solo JPG, PNG o WebP. La app reduce la foto antes de subirla.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fichas', 'fichas', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = true,
      file_size_limit = 2097152,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

-- Solo las cuentas del equipo (con sesión) pueden subir, cambiar o borrar fotos.
drop policy if exists "equipo lee imagenes"   on storage.objects;
drop policy if exists "equipo sube imagenes"  on storage.objects;
drop policy if exists "equipo edita imagenes" on storage.objects;
drop policy if exists "equipo borra imagenes" on storage.objects;
create policy "equipo lee imagenes"   on storage.objects for select to authenticated using (bucket_id = 'fichas');
create policy "equipo sube imagenes"  on storage.objects for insert to authenticated with check (bucket_id = 'fichas');
create policy "equipo edita imagenes" on storage.objects for update to authenticated using (bucket_id = 'fichas') with check (bucket_id = 'fichas');
create policy "equipo borra imagenes" on storage.objects for delete to authenticated using (bucket_id = 'fichas');
