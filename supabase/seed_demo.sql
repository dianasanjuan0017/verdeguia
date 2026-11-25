-- DATOS DE DEMOSTRACIÓN FICTICIOS (es_demo = true). No son datos reales de viveros ni participantes.
with v as (
  insert into viveros (nombre, contacto, es_demo)
  values ('Vivero de ejemplo (DEMO)', 'WhatsApp 000 000 0000 - dato ficticio', true)
  returning id
)
insert into fichas (codigo, vivero_id, planta, cuidados, es_demo)
select 'DEMO-001', id, 'Suculenta echeveria (DEMO)',
       E'Luz: mucha luz indirecta o sol de la mañana.\nRiego: cada 10 a 14 días; deja secar la tierra entre riegos.\nSustrato: tierra con arena o tezontle para buen drenaje.', true
  from v
union all
select 'DEMO-002', id, 'Helecho (DEMO)',
       E'Luz: sombra o luz filtrada.\nRiego: mantén la tierra húmeda, sin encharcar.\nExtra: rocía las hojas en días calurosos.', true
  from v
union all
select 'DEMO-VACIA', id, 'Ficha sin contenido (DEMO)', null, true
  from v;
