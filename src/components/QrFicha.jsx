import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

// Muestra y permite descargar el QR de una ficha.
export default function QrFicha({ codigo, prueba = false }) {
  const [img, setImg] = useState('')
  const esLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname)
  const url = `${window.location.origin}/f/${codigo}${prueba ? '?prueba=1' : ''}`

  useEffect(() => {
    QRCode.toDataURL(url, { width: 640, margin: 2, color: { dark: '#173a2a', light: '#ffffff' } })
      .then(setImg)
      .catch(() => setImg(''))
  }, [url])

  function descargar() {
    const a = document.createElement('a')
    a.href = img
    a.download = `qr-${codigo}${prueba ? '-prueba' : ''}.png`
    a.click()
  }

  return (
    <div className="qr-ficha">
      {esLocal && (
        <p className="aviso aviso-error" role="alert">
          Estás en localhost: este QR solo funcionaría en tu computadora. Genera los QR definitivos desde la dirección publicada (https).
        </p>
      )}
      <div className="qr-vista">
        {img ? <img src={img} alt={`Código QR de la ficha ${codigo}`} /> : <p className="nota">Generando…</p>}
      </div>
      <p className="nota">Enlace: <code>{url}</code></p>
      <button onClick={descargar} disabled={!img}>Descargar PNG</button>
    </div>
  )
}
