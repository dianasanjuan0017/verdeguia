const LADO_MAXIMO = 1200
const PESO_MAXIMO_ENTRADA = 15 * 1024 * 1024

// Reduce la foto en el navegador (máx. 1200 px, JPEG) para que pese poco y cargue rápido en el celular.
export async function prepararImagen(archivo) {
  if (!archivo.type.startsWith('image/')) throw new Error('Elige un archivo de imagen (JPG, PNG o WebP).')
  if (archivo.size > PESO_MAXIMO_ENTRADA) throw new Error('La imagen pesa más de 15 MB. Elige otra.')

  let mapa
  try {
    mapa = await createImageBitmap(archivo, { imageOrientation: 'from-image' })
  } catch {
    try { mapa = await createImageBitmap(archivo) } catch {
      throw new Error('No se pudo leer la imagen. Usa un archivo JPG, PNG o WebP.')
    }
  }
  const escala = Math.min(1, LADO_MAXIMO / Math.max(mapa.width, mapa.height))
  const ancho = Math.round(mapa.width * escala)
  const alto = Math.round(mapa.height * escala)
  const lienzo = document.createElement('canvas')
  lienzo.width = ancho
  lienzo.height = alto
  const ctx = lienzo.getContext('2d')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, ancho, alto)
  ctx.drawImage(mapa, 0, 0, ancho, alto)
  if (mapa.close) mapa.close()

  const blob = await new Promise((resolver) => lienzo.toBlob(resolver, 'image/jpeg', 0.82))
  if (!blob) throw new Error('No se pudo preparar la imagen.')
  return blob
}

export function urlImagen(supabase, ruta) {
  if (!supabase || !ruta) return ''
  return supabase.storage.from('fichas').getPublicUrl(ruta).data.publicUrl
}
