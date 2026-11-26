import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient.js'
import QrFicha from './QrFicha.jsx'
import { prepararImagen, urlImagen } from '../utils/imagen.js'

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
      supabase.from('fichas').select('codigo, planta, cuidados, imagen_path, vivero_id, es_demo').order('planta'),
    ])
    if (v.error || f.error) setError('No se pudieron leer los datos. Revisa que ejecutaste las migraciones en Supabase.')
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
    else if (f.imagen_path) await supabase.storage.from('fichas').remove([f.imagen_path])
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
              <div className="fila-ficha">
                {f.imagen_path && (
                  <img className="miniatura" src={urlImagen(supabase, f.imagen_path)} alt="" loading="lazy" />
                )}
                <div>
                  <strong>{f.planta}</strong>{f.es_demo && <span className="chip">demo</span>}
                  <div className="nota">{f.codigo} · {nombreVivero(f.vivero_id)}{f.imagen_path ? ' · con foto' : ''}</div>
                </div>
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
  const [archivo, setArchivo] = useState(null)
  const [previa, setPrevia] = useState('')
  const [quitarFoto, setQuitarFoto] = useState(false)
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  useEffect(() => () => { if (previa) URL.revokeObjectURL(previa) }, [previa])

  function elegirArchivo(e) {
    const f = e.target.files?.[0]
    if (!f) return
    if (!f.type.startsWith('image/')) {
      setError('Elige un archivo de imagen (JPG, PNG o WebP).')
      e.target.value = ''
      return
    }
    setError('')
    setArchivo(f)
    setQuitarFoto(false)
    setPrevia(URL.createObjectURL(f))
  }

  function quitarSeleccion() {
    setArchivo(null)
    setPrevia('')
    if (ficha?.imagen_path) setQuitarFoto(true)
  }

  const fotoActual = !quitarFoto && ficha?.imagen_path ? urlImagen(supabase, ficha.imagen_path) : ''
  const fotoMostrada = previa || fotoActual

  async function guardar() {
    setError('')
    if (!VALIDO.test(codigo)) return setError('El código debe tener de 3 a 32 letras, números o guiones, sin espacios.')
    if (!viveroId) return setError('Elige un vivero.')
    if (!planta.trim()) return setError('Escribe el nombre de la planta.')
    setGuardando(true)

    // 1) Subir la foto nueva (si hay), ya reducida
    let nuevaRuta = null
    if (archivo) {
      try {
        const blob = await prepararImagen(archivo)
        nuevaRuta = `${codigo}/${Date.now()}.jpg`
        const { error: errSubida } = await supabase.storage
          .from('fichas')
          .upload(nuevaRuta, blob, { contentType: 'image/jpeg', cacheControl: '31536000' })
        if (errSubida) throw new Error('No se pudo subir la imagen. Revisa que ejecutaste la migración v0.1.2.')
      } catch (err) {
        setGuardando(false)
        return setError(err.message)
      }
    }

    // 2) Guardar la ficha
    const imagenPath = nuevaRuta ?? (quitarFoto ? null : ficha?.imagen_path ?? null)
    const datos = {
      vivero_id: viveroId,
      planta: planta.trim(),
      cuidados: cuidados.split('\n').map((l) => l.trimEnd()).filter((l) => l.replace(/^[^:]*:/, '').trim()).join('\n') || null,
      imagen_path: imagenPath,
    }
    const { error: errGuardar } = esNueva
      ? await supabase.from('fichas').insert({ codigo, es_demo: false, ...datos })
      : await supabase.from('fichas').update(datos).eq('codigo', codigo)

    if (errGuardar) {
      if (nuevaRuta) await supabase.storage.from('fichas').remove([nuevaRuta]) // no dejar fotos huérfanas
      setGuardando(false)
      return setError(errGuardar.code === '23505' ? 'Ese código ya existe. Genera otro.' : 'No se pudo guardar la ficha. Si agregaste foto, revisa la migración v0.1.2.')
    }

    // 3) Borrar la foto anterior si se reemplazó o se quitó
    if (ficha?.imagen_path && (nuevaRuta || quitarFoto)) {
      await supabase.storage.from('fichas').remove([ficha.imagen_path])
    }
    setGuardando(false)
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

      <div className="campo-foto">
        <span className="etiqueta-campo">Foto de la planta (opcional)</span>
        {fotoMostrada && <img className="previa-foto" src={fotoMostrada} alt="Vista previa de la foto de la planta" />}
        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={elegirArchivo} />
        {fotoMostrada && <button type="button" className="secundario peligro" onClick={quitarSeleccion}>Quitar foto</button>}
        <p className="nota">Solo fotos de la planta, sin personas. Se reduce sola antes de subirse. Si no agregas foto, la ficha se ve igual sin ella.</p>
      </div>

      {error && <p className="aviso aviso-error" role="alert">{error}</p>}
      <div className="fila-acciones">
        <button onClick={guardar} disabled={guardando}>{guardando ? 'Guardando…' : esNueva ? 'Guardar y ver QR' : 'Guardar cambios'}</button>
        <button className="secundario" onClick={onCancelar} disabled={guardando}>Cancelar</button>
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
