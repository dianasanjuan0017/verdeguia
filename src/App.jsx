import { Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Ficha from './pages/Ficha.jsx'
import Admin from './pages/Admin.jsx'
import NoEncontrada from './pages/NoEncontrada.jsx'
import Hoja from './components/Hoja.jsx'
import { VERSION, FECHA_VERSION } from './version.js'
import { configurado } from './supabaseClient.js'

export default function App() {
  return (
    <div className="app">
      <header className="cabecera">
        <Link to="/" className="marca">
          <span className="marca-icono"><Hoja size={22} /></span>
          VerdeGuía
        </Link>
      </header>
      <main className="contenido">
        {!configurado && (
          <p className="aviso aviso-error" role="alert">
            Falta configurar Supabase. Copia .env.example a .env.local y completa las variables.
          </p>
        )}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/f/:codigo" element={<Ficha />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<NoEncontrada />} />
        </Routes>
      </main>
      <footer className="pie">
        VerdeGuía PMV {VERSION} · {FECHA_VERSION}
      </footer>
    </div>
  )
}
