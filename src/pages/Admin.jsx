import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabaseClient.js'
import { VERSION } from '../version.js'
import QrGenerador from '../components/QrGenerador.jsx'

function aCSV(filas) {
  const esc = (v) => `"${String(v).replace(/"/g, '""')}"`
  const encabezado = ['codigo', 'fecha_hora', 'es_prueba']
  const cuerpo = filas.map((f) => [f.codigo, f.fecha_hora, f.es_prueba ? 'prueba' : 'real'].map(esc).join(','))
  return '\uFEFF' + [encabezado.join(','), ...cuerpo].join('\n')
}

export default function Admin() {
  const [sesion, setSesion] = useState(null)
  const [cargandoSesion, setCargandoSesion] = useState(true)

  useEffect(() => {
    if (!supabase) return setCargandoSesion(false)
    supabase.auth.getSession().then(({ data }) => {
      setSesion(data.session)
      setCargandoSesion(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSesion(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  if (!supabase) return <p>Supabase no está configurado.</p>
  if (cargandoSesion) return <p>Cargando…</p>
  return sesion ? <Panel /> : <Login />
}

function Panel() {
  const [vista, setVista] = useState('registro')
  return (
    <div>
      <div className="pestanas" role="tablist">
        <button role="tab" aria-selected={vista === 'registro'} className={vista === 'registro' ? 'activa' : ''} onClick={() => setVista('registro')}>Accesos</button>
        <button role="tab" aria-selected={vista === 'qr'} className={vista === 'qr' ? 'activa' : ''} onClick={() => setVista('qr')}>Códigos QR</button>
      </div>
      {vista === 'registro' ? <Registro /> : <QrGenerador />}
    </div>
  )
}

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function entrar() {
    setEnviando(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError('Correo o contraseña incorrectos.')
    setEnviando(false)
  }

  return (
    <section className="panel panel-estrecho">
      <h1>Registro del equipo</h1>
      <p>Entra con la cuenta de prueba que se entregó por el canal privado de revisión.</p>
      <div className="formulario">
        <label>Correo
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
        </label>
        <label>Contraseña
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password"
            onKeyDown={(e) => e.key === 'Enter' && entrar()} />
        </label>
        {error && <p className="aviso aviso-error" role="alert">{error}</p>}
        <button onClick={entrar} disabled={enviando || !email || !password}>Entrar</button>
      </div>
    </section>
  )
}

function Registro() {
  const [filas, setFilas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [ocultarPruebas, setOcultarPruebas] = useState(false)

  async function cargar() {
    setCargando(true)
    setError('')
    const { data, error } = await supabase
      .from('accesos')
      .select('id, codigo, fecha_hora, es_prueba')
      .order('fecha_hora', { ascending: false })
      .limit(5000)
    if (error) setError('No se pudo leer el registro.')
    else setFilas(data)
    setCargando(false)
  }
  useEffect(() => { cargar() }, [])

  const visibles = useMemo(() => (ocultarPruebas ? filas.filter((f) => !f.es_prueba) : filas), [filas, ocultarPruebas])
  const reales = filas.filter((f) => !f.es_prueba).length

  function exportar() {
    const blob = new Blob([aCSV(visibles)], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `accesos-verdeguia-${VERSION}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section className="panel">
      <h1>Registro de accesos</h1>
      <p className="resumen">
        <strong>{filas.length}</strong> accesos en total · <strong>{reales}</strong> reales ·{' '}
        <strong>{filas.length - reales}</strong> de prueba
      </p>
      <div className="barra">
        <label className="check">
          <input type="checkbox" checked={ocultarPruebas} onChange={(e) => setOcultarPruebas(e.target.checked)} />
          Ocultar pruebas
        </label>
        <button onClick={cargar} className="secundario">Actualizar</button>
        <button onClick={exportar} disabled={!visibles.length}>Exportar CSV</button>
        <button onClick={() => supabase.auth.signOut()} className="secundario">Salir</button>
      </div>
      {error && <p className="aviso aviso-error" role="alert">{error}</p>}
      {cargando ? <p>Cargando…</p> : visibles.length === 0 ? (
        <p className="aviso">Todavía no hay accesos. Abre una ficha desde la página de inicio para generar uno.</p>
      ) : (
        <div className="tabla-envoltura">
          <table>
            <thead><tr><th>Código</th><th>Fecha y hora</th><th>Tipo</th></tr></thead>
            <tbody>
              {visibles.map((f) => (
                <tr key={f.id}>
                  <td>{f.codigo}</td>
                  <td>{new Date(f.fecha_hora).toLocaleString('es-MX')}</td>
                  <td>{f.es_prueba ? 'prueba' : 'real'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
