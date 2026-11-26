import { useState } from 'react'
import QrFicha from './QrFicha.jsx'

const VALIDO = /^[A-Za-z0-9-]{3,32}$/

// Generador libre: sirve para QR de demostración o de prueba del equipo.
export default function QrGenerador() {
  const [codigo, setCodigo] = useState('DEMO-001')
  const [prueba, setPrueba] = useState(false)
  const valido = VALIDO.test(codigo)

  return (
    <section className="panel">
      <h2>Generar código QR</h2>
      <p>Para las fichas de los viveros, usa la pestaña Fichas: ahí cada ficha tiene su botón de QR.</p>
      <div className="qr-layout">
        <div className="formulario">
          <label>Código de la ficha
            <input value={codigo} onChange={(e) => setCodigo(e.target.value.trim())} maxLength={32} />
          </label>
          {!valido && <p className="aviso aviso-error">Usa de 3 a 32 letras, números o guiones, sin espacios.</p>}
          <label className="check">
            <input type="checkbox" checked={prueba} onChange={(e) => setPrueba(e.target.checked)} />
            QR de prueba del equipo (el acceso no contará como comprador)
          </label>
        </div>
        <div>{valido && <QrFicha codigo={codigo} prueba={prueba} />}</div>
      </div>
    </section>
  )
}
