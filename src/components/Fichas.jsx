import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient.js'
import QrFicha from './QrFicha.jsx'

const VALIDO = /^[A-Za-z0-9-]{3,32}$/
const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // sin letras ni números que se confundan
const PLANTILLA = 'Luz: \nRiego: \nSustrato: '

function codigoNuevo() {
  const bytes = crypto.getRandomValues(new Uint8Array(5))
  return 'VG-' + Array.from(bytes, (b) => ALFABETO[b % ALFABETO.length]).join('')
}

export default function Fichas() {
  const [viveros, setViveros] = useState([])
  const [fichas, setFichas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [formulario, setFormulario] = useState(null) // null | 'nueva' | objeto ficha
  const [qr, setQr] = useState('')

  async function cargar() {
    setCargando(true)
    setError('')
    const [v, f] = await Promise.all([
      supabase.from('viveros').select('id, nombre, contacto, es_demo').order('nombre'),
      supabase.from('fichas').select('codigo, planta, cuidados, vivero_id, es_demo').order('planta'),
    ])
    if (v.error || f.error) setError('No se pudieron leer los datos. Revisa que ejecutaste la migración v0.1.1 en Supabase.')
    else { setViveros(v.data); setFichas(f.data) }
    setCargando(false)
  }
  useEffect(() => { cargar() }, [])

  const nombreVivero = (id) => viveros.find((v) => v.id === id)?.nombre || 'Sin vivero'

  async function eliminar(f) {
    const ok = window.confirm(
      `¿Eliminar la ficha ${f.codigo} (${f.planta})?\nEl QR que ya esté impreso dejará de funcionar. Los accesos ya registrados se conservan.`
    )
    if (!ok) return
    const { error } = await supabase.from('fichas').delete().eq('codigo', f.codigo)
    if (error) setError('No se pudo eliminar la ficha.')
    if (qr === f.codigo) setQr('')
    cargar()
  }

  function guardada(codigo, esNueva) {
    setFormulario(null)
    if (esNueva) setQr(codigo)
    cargar()
  }

  return (
    <section className="panel">
      <h1>Fichas y viveros</h1>
      {error && <p className="aviso aviso-error" role="alert">{error}</p>}

      <Viveros viveros={viveros} onCambio={cargar} />

      <h2 className="subtitulo">Fichas</h2>
      {formulario ? (
        <FormFicha
          key={formulario === 'nueva' ? 'nueva' : formulario.codigo}
          viveros={viveros}
          ficha={formulario === 'nueva' ? null : formulario}
          onGuardada={guardada}
          onCancelar={() => setFormulario(null)}
        />
      ) : (
        <p><button onClick={() => setFormulario('nueva')} disabled={!viveros.length}>Nueva ficha</button></p>
      )}
      {!viveros.length && !cargando && <p className="aviso">Primero crea un vivero para poder agregar fichas.</p>}

      {qr && (
        <div className="tarjeta">
          <div className="fila-acciones">
            <strong>QR de la ficha {qr}</strong>
            <button className="secundario" onClick={() => setQr('')}>Cerrar</button>
          </div>
          <QrFicha codigo={qr} />
        </div>
      )}

      {cargando ? <p>Cargando…</p> : fichas.length === 0 ? (
        <p className="aviso">Todavía no hay fichas.</p>
      ) : (
        <div className="lista-tarjetas">
          {fichas.map((f) => (
            <div className="tarjeta" key={f.codigo}>
              <div>
                <strong>{f.planta}</strong>{f.es_demo && <span className="chip">demo</span>}
                <div className="nota">{f.codigo} · {nombreVivero(f.vivero_id)}</div>
              </div>
              <div className="fila-acciones">
                <button onClick={() => { setQr(f.codigo); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>QR</button>
                <button className="secundario" onClick={() => { setFormulario(f); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>Editar</button>
                <button className="secundario peligro" onClick={() => eliminar(f)}>Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function FormFicha({ viveros, ficha, onGuardada, onCancelar }) {
  const esNueva = !ficha
  const [codigo, setCodigo] = useState(ficha?.codigo ?? codigoNuevo())
  const [viveroId, setViveroId] = useState(ficha?.vivero_id ?? viveros[0]?.id ?? '')
  const [planta, setPlanta] = useState(ficha?.planta ?? '')
  const [cuidados, setCuidados] = useState(ficha?.cuidados ?? PLANTILLA)
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  async function guardar() {
    setError('')
    if (!VALIDO.test(codigo)) return setError('El código debe tener de 3 a 32 letras, números o guiones, sin espacios.')
    if (!viveroId) return setError('Elige un vivero.')
    if (!planta.trim()) return setError('Escribe el nombre de la planta.')
    setGuardando(true)
    const datos = {
      vivero_id: viveroId,
      planta: planta.trim(),
      cuidados: cuidados.split('\n').map((l) => l.trimEnd()).filter((l) => l.replace(/^[^:]*:/, '').trim()).join('\n') || null,
    }
    const { error } = esNueva
      ? await supabase.from('fichas').insert({ codigo, es_demo: false, ...datos })
      : await supabase.from('fichas').update(datos).eq('codigo', codigo)
    setGuardando(false)
    if (error) {
      return setError(error.code === '23505' ? 'Ese código ya existe. Genera otro.' : 'No se pudo guardar la ficha.')
    }
    onGuardada(codigo, esNueva)
  }

  return (
    <div className="tarjeta formulario formulario-ancho">
      <h3>{esNueva ? 'Nueva ficha' : `Editar ficha ${ficha.codigo}`}</h3>
      <label>Código (va dentro del QR)
        <input value={codigo} onChange={(e) => setCodigo(e.target.value.trim())} readOnly={!esNueva} maxLength={32} />
      </label>
      {!esNueva && <p className="nota">El código no se puede cambiar: ya puede estar impreso en un QR.</p>}
      <label>Vivero
        <select value={viveroId} onChange={(e) => setViveroId(e.target.value)}>
          {viveros.map((v) => <option key={v.id} value={v.id}>{v.nombre}</option>)}
        </select>
      </label>
      <label>Planta
        <input value={planta} onChange={(e) => setPlanta(e.target.value)} placeholder="Ej. Suculenta echeveria" maxLength={80} />
      </label>
      <label>Cuidados
        <textarea rows={6} value={cuidados} onChange={(e) => setCuidados(e.target.value)} />
      </label>
      <p className="nota">Una línea por cuidado, con el formato <code>Luz: texto</code>. Las líneas sin texto se omiten.</p>
      {error && <p className="aviso aviso-error" role="alert">{error}</p>}
      <div className="fila-acciones">
        <button onClick={guardar} disabled={guardando}>{esNueva ? 'Guardar y ver QR' : 'Guardar cambios'}</button>
        <button className="secundario" onClick={onCancelar}>Cancelar</button>
      </div>
    </div>
  )
}

function Viveros({ viveros, onCambio }) {
  const [edicion, setEdicion] = useState(null) // null | { id?, nombre, contacto }
  const [error, setError] = useState('')

  async function guardar() {
    setError('')
    const nombre = edicion.nombre.trim()
    const contacto = edicion.contacto.trim()
    if (!nombre || !contacto) return setError('Escribe el nombre y el contacto del vivero.')
    const { error } = edicion.id
      ? await supabase.from('viveros').update({ nombre, contacto }).eq('id', edicion.id)
      : await supabase.from('viveros').insert({ nombre, contacto, es_demo: false })
    if (error) return setError('No se pudo guardar el vivero.')
    setEdicion(null)
    onCambio()
  }

  async function eliminar(v) {
    if (!window.confirm(`¿Eliminar el vivero "${v.nombre}"?`)) return
    const { error } = await supabase.from('viveros').delete().eq('id', v.id)
    if (error) setError(error.code === '23503' ? 'Ese vivero todavía tiene fichas. Elimínalas o cámbialas de vivero primero.' : 'No se pudo eliminar el vivero.')
    else { setError(''); onCambio() }
  }

  return (
    <div>
      <h2 className="subtitulo">Viveros</h2>
      {error && <p className="aviso aviso-error" role="alert">{error}</p>}
      <div className="lista-tarjetas">
        {viveros.map((v) => (
          <div className="tarjeta" key={v.id}>
            <div>
              <strong>{v.nombre}</strong>{v.es_demo && <span className="chip">demo</span>}
              <div className="nota">{v.contacto}</div>
            </div>
            <div className="fila-acciones">
              <button className="secundario" onClick={() => setEdicion({ ...v })}>Editar</button>
              <button className="secundario peligro" onClick={() => eliminar(v)}>Eliminar</button>
            </div>
          </div>
        ))}
      </div>
      {edicion ? (
        <div className="tarjeta formulario formulario-ancho">
          <h3>{edicion.id ? 'Editar vivero' : 'Nuevo vivero'}</h3>
          <label>Nombre del vivero
            <input value={edicion.nombre} onChange={(e) => setEdicion({ ...edicion, nombre: e.target.value })} maxLength={80} />
          </label>
          <label>Contacto (se muestra en la ficha)
            <input value={edicion.contacto} onChange={(e) => setEdicion({ ...edicion, contacto: e.target.value })} placeholder="WhatsApp, teléfono o dirección" maxLength={120} />
          </label>
          <div className="fila-acciones">
            <button onClick={guardar}>Guardar</button>
            <button className="secundario" onClick={() => { setEdicion(null); setError('') }}>Cancelar</button>
          </div>
        </div>
      ) : (
        <p><button className="secundario" onClick={() => setEdicion({ nombre: '', contacto: '' })}>Nuevo vivero</button></p>
      )}
    </div>
  )
}
