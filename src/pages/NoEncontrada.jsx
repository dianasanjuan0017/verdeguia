import { Link } from 'react-router-dom'
import { AYUDA_CONTACTO } from '../config.js'

export default function NoEncontrada() {
  return (
    <section className="mensaje">
      <h1>Esta página no existe</h1>
      <p>Revisa el enlace o escanea de nuevo el código QR de tu planta.</p>
      <p className="ayuda"><strong>Pide ayuda al vivero</strong>{AYUDA_CONTACTO}</p>
      <p><Link to="/">Ir al inicio</Link></p>
    </section>
  )
}
