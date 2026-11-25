// Ilustración decorativa: una etiqueta de vivero con un patrón tipo QR.
export default function EtiquetaDemo() {
  const celdas = []
  const patron = [
    '1110110111', '1010011101', '1110101001', '0001110110', '1101001011',
    '0110111100', '1011010111', '0100101001', '1111011010', '1001110011',
  ]
  patron.forEach((fila, y) => [...fila].forEach((c, x) => {
    if (c === '1') celdas.push(<rect key={`${x}-${y}`} x={x * 8} y={y * 8} width="7" height="7" rx="1.500" />)
  }))
  return (
    <svg className="etiqueta-demo" viewBox="0 0 160 210" role="img" aria-label="Etiqueta de planta con código QR">
      <rect x="4" y="4" width="152" height="202" rx="16" fill="#e8d5a8" stroke="#173a2a" strokeWidth="3" />
      <circle cx="80" cy="24" r="8" fill="#f2f7ef" stroke="#173a2a" strokeWidth="3" />
      <g transform="translate(40 52)" fill="#173a2a">{celdas}</g>
      <rect x="28" y="152" width="104" height="8" rx="4" fill="#173a2a" opacity="0.85" />
      <rect x="44" y="170" width="72" height="8" rx="4" fill="#173a2a" opacity="0.45" />
    </svg>
  )
}
