export async function scanBarcode(): Promise<string> {
  if (!('BarcodeDetector' in window)) {
    throw new Error('Scanner de código de barras não suportado neste navegador. Use Chrome ou Edge.')
  }

  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'environment', width: 640, height: 480 },
  })

  const video = document.createElement('video')
  video.srcObject = stream
  video.setAttribute('playsinline', '')
  video.play()

  await new Promise<void>(resolve => {
    video.onloadedmetadata = () => {
      video.width = video.videoWidth
      video.height = video.videoHeight
      resolve()
    }
  })

  const detector = new BarcodeDetector({
    formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'code_93', 'codabar', 'itf', 'qr_code', 'data_matrix', 'aztec', 'pdf417'],
  })

  const canvas = document.createElement('canvas')
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  const ctx = canvas.getContext('2d')!

  return new Promise<string>((resolve, reject) => {
    const interval = setInterval(async () => {
      ctx.drawImage(video, 0, 0)
      try {
        const barcodes = await detector.detect(canvas)
        if (barcodes.length > 0) {
          cleanup()
          resolve(barcodes[0].rawValue)
        }
      } catch {}
    }, 300)

    const cleanup = () => {
      clearInterval(interval)
      stream.getTracks().forEach(t => t.stop())
      video.remove()
    }

    setTimeout(() => {
      cleanup()
      reject(new Error('Tempo limite excedido. Nenhum código encontrado.'))
    }, 30000)
  })
}

export async function lookupBarcode(barcode: string): Promise<{ name: string; price?: number; brand?: string } | null> {
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`)
    if (!res.ok) return null
    const data = await res.json()
    if (data.status !== 1) return null
    const p = data.product
    return {
      name: p.product_name || p.generic_name || p.product_name_en || 'Produto',
      price: p.price_kw ? parseFloat(p.price_kw) / 100 : undefined,
      brand: p.brands,
    }
  } catch {
    return null
  }
}
