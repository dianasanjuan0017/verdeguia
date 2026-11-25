-- VerdeGuía PMV v0.1.0 - Esquema de base de datos (Supabase / PostgreSQL)
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

  select f.codigo, f.planta, f.cuidados, f.es_demo, vi.nombre as vivero, vi.contacto
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
    'vivero',   v.vivero,
    'contacto', v.contacto,
    'es_demo',  v.es_demo
  );
end;
$$;

revoke all on function registrar_acceso(text, boolean) from public;
grant execute on function registrar_acceso(text, boolean) to anon, authenticated;
