import { Link } from 'react-router-dom'
import EtiquetaDemo from '../components/EtiquetaDemo.jsx'

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="hero-texto">
          <h1>Escanea la etiqueta y cuida tu planta</h1>
          <p>
            VerdeGuía te muestra cómo regar, dónde poner y cómo cuidar la planta que compraste
            en tu vivero, directo desde el código QR de su etiqueta.
          </p>
          <Link to="/f/DEMO-001?prueba=1" className="boton">Ver una ficha de ejemplo</Link>
        </div>
        <EtiquetaDemo />
      </section>

      <section className="pasos">
        <h2>Así funciona</h2>
        <ol>
          <li><strong>Escanea</strong><span>el QR pegado en la maceta o la etiqueta.</span></li>
          <li><strong>Lee</strong><span>la ficha con luz, riego y sustrato de tu planta.</span></li>
          <li><strong>Pregunta</strong><span>al vivero si tienes dudas: su contacto está en la ficha.</span></li>
        </ol>
      </section>

      <section className="demo">
        <h2>Probar el PMV</h2>
        <p>Fichas ficticias para la demostración. Los enlaces llevan <code>?prueba=1</code>, así el acceso queda marcado como prueba.</p>
        <ul className="lista-demo">
          <li><Link to="/f/DEMO-001?prueba=1">DEMO-001 · suculenta</Link></li>
          <li><Link to="/f/DEMO-002?prueba=1">DEMO-002 · helecho</Link></li>
          <li><Link to="/f/DEMO-VACIA?prueba=1">DEMO-VACIA · ficha sin contenido</Link></li>
          <li><Link to="/f/NO-EXISTE?prueba=1">Código que no existe</Link></li>
        </ul>
        <p><Link to="/admin">Entrar al registro del equipo</Link></p>
      </section>
    </>
  )
}
