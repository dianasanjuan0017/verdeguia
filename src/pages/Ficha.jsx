import { useEffect, useState } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient.js'
import { AYUDA_CONTACTO } from '../config.js'

const CODIGO_VALIDO = /^[A-Za-z0-9-]{3,32}$/
const ICONOS = { luz: '☀️', riego: '💧', sustrato: '🌱', tierra: '🌱', temperatura: '🌡️', extra: '✨' }

function parseLinea(linea) {
  const m = linea.match(/^([^:]{2,20}):\s*(.+)$/)
  if (!m) return { etiqueta: '', texto: linea }
  return { etiqueta: m[1], texto: m[2], icono: ICONOS[m[1].trim().toLowerCase()] || '🌿' }
}

export default function Ficha() {
  const { codigo } = useParams()
  const [params] = useSearchParams()
  const esPrueba = params.get('prueba') === '1'
  const [estado, setEstado] = useState('cargando') // cargando | ok | noexiste | error
  const [ficha, setFicha] = useState(null)

  useEffect(() => {
    let activo = true
    async function cargar() {
      setEstado('cargando')
      if (!CODIGO_VALIDO.test(codigo || '')) {
        setEstado('noexiste')
        return
      }
      if (!supabase) {
        setEstado('error')
        return
      }
      const { data, error } = await supabase.rpc('registrar_acceso', {
        p_codigo: codigo,
        p_es_prueba: esPrueba,
      })
      if (!activo) return
      if (error) return setEstado('error')
      if (!data) return setEstado('noexiste')
      setFicha(data)
      setEstado('ok')
    }
    cargar()
    return () => { activo = false }
  }, [codigo, esPrueba])

  if (estado === 'cargando') return <p className="cargando">Cargando la ficha…</p>

  if (estado === 'noexiste') {
    return (
      <section className="mensaje">
        <h1>No encontramos esa ficha</h1>
        <p>El código del QR no corresponde a ninguna ficha. Puede que la etiqueta esté dañada o incompleta.</p>
        <p className="ayuda"><strong>Pide ayuda al vivero</strong>{AYUDA_CONTACTO}</p>
        <p><Link to="/">Ir al inicio</Link></p>
      </section>
    )
  }

  if (estado === 'error') {
    return (
      <section className="mensaje">
        <h1>No pudimos abrir la ficha</h1>
        <p>Revisa tu conexión e inténtalo de nuevo en un momento. Si sigue igual, contacta al vivero:</p>
        <p className="ayuda">{AYUDA_CONTACTO}</p>
      </section>
    )
  }

  const lineas = (ficha.cuidados || '').split('\n').map((l) => l.trim()).filter(Boolean).map(parseLinea)
  return (
    <article className="etiqueta">
      <div className="etiqueta-agujero" aria-hidden="true" />
      {ficha.es_demo && <p className="sello-demo">Datos de demostración</p>}
      <p className="etiqueta-codigo">Ficha {ficha.codigo}</p>
      <h1>{ficha.planta}</h1>
      {lineas.length ? (
        <dl className="cuidados">
          {lineas.map((l, i) => (
            <div className="cuidado" key={i}>
              {l.etiqueta && (
                <dt><span aria-hidden="true">{l.icono}</span> {l.etiqueta}</dt>
              )}
              <dd>{l.texto}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="aviso">
          Esta ficha todavía no tiene cuidados registrados. Consulta al vivero para más información.
        </p>
      )}
      <div className="vivero">
        <span className="vivero-nombre">{ficha.vivero}</span>
        <span>{ficha.contacto}</span>
      </div>
      {esPrueba && <p className="nota nota-prueba">Acceso marcado como prueba.</p>}
    </article>
  )
}
