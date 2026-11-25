import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

const VALIDO = /^[A-Za-z0-9-]{3,32}$/

export default function QrGenerador() {
  const [codigo, setCodigo] = useState('DEMO-001')
  const [prueba, setPrueba] = useState(false)
  const [img, setImg] = useState('')

  const valido = VALIDO.test(codigo)
  const esLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname)
  const url = `${window.location.origin}/f/${codigo}${prueba ? '?prueba=1' : ''}`

  useEffect(() => {
    if (!valido) { setImg(''); return }
    QRCode.toDataURL(url, { width: 640, margin: 2, color: { dark: '#173a2a', light: '#ffffff' } })
      .then(setImg)
      .catch(() => setImg(''))
  }, [url, valido])

  function descargar() {
    const a = document.createElement('a')
    a.href = img
    a.download = `qr-${codigo}${prueba ? '-prueba' : ''}.png`
    a.click()
  }

  return (
    <section className="panel">
      <h2>Generar código QR</h2>
      <p>Cada ficha tiene su propio código. El QR solo guarda el enlace a esa ficha.</p>
      {esLocal && (
        <p className="aviso aviso-error" role="alert">
          Estás en localhost: este QR apuntaría a tu computadora y nadie más podría abrirlo.
          Genera los QR definitivos desde la dirección publicada (https).
        </p>
      )}
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
          <p className="nota">Enlace: <code>{url}</code></p>
          <button onClick={descargar} disabled={!img}>Descargar PNG</button>
        </div>
        <div className="qr-vista">
          {img ? <img src={img} alt={`Código QR de la ficha ${codigo}`} /> : <p className="nota">Escribe un código válido.</p>}
        </div>
      </div>
    </section>
  )
}
