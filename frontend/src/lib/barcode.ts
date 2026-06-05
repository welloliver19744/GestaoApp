export async function scanBarcode(): Promise<string> {
  if (!('BarcodeDetector' in window)) {
    throw new Error('Scanner de código de barras não suportado neste navegador. Use Chrome ou Edge.')
  }

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error('Câmera não disponível. Certifique-se de usar HTTPS ou localhost.')
  }

  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: 'environment',
      width: { min: 640, ideal: 1920 },
      height: { min: 480, ideal: 1080 },
    },
  })

  // Build overlay UI
  const overlay = document.createElement('div')
  overlay.style.cssText = [
    'position:fixed', 'inset:0', 'z-index:99999', 'background:rgba(0,0,0,0.92)',
    'display:flex', 'flex-direction:column', 'align-items:center', 'justify-content:center', 'gap:16px',
  ].join(';')

  const label = document.createElement('p')
  label.textContent = 'Aponte para o código de barras'
  label.style.cssText = 'color:#e2e8f0;font-size:14px;font-family:system-ui,sans-serif;margin:0;'

  const viewBox = document.createElement('div')
  viewBox.style.cssText = 'position:relative;width:min(90vw,400px);aspect-ratio:4/3;border-radius:12px;overflow:hidden;border:2px solid #22d3ee;box-shadow:0 0 20px rgba(34,211,238,0.3);'

  const video = document.createElement('video')
  video.srcObject = stream
  video.setAttribute('playsinline', '')
  video.muted = true
  video.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;'
  video.play()

  const scanLine = document.createElement('div')
  scanLine.style.cssText = [
    'position:absolute', 'left:0', 'right:0', 'height:2px',
    'background:linear-gradient(90deg,transparent,#22d3ee,transparent)',
    'box-shadow:0 0 8px #22d3ee', 'animation:scanMove 2s ease-in-out infinite',
  ].join(';')
  const style = document.createElement('style')
  style.textContent = '@keyframes scanMove{0%{top:10%}50%{top:85%}100%{top:10%}}'
  document.head.appendChild(style)

  const cancelBtn = document.createElement('button')
  cancelBtn.textContent = 'Cancelar'
  cancelBtn.style.cssText = [
    'padding:10px 28px', 'border-radius:8px', 'border:1px solid #475569',
    'background:transparent', 'color:#94a3b8', 'font-size:14px',
    'cursor:pointer', 'font-family:system-ui,sans-serif', 'transition:all .2s',
  ].join(';')
  cancelBtn.onmouseover = () => { cancelBtn.style.background = '#1e293b'; cancelBtn.style.color = '#e2e8f0' }
  cancelBtn.onmouseout = () => { cancelBtn.style.background = 'transparent'; cancelBtn.style.color = '#94a3b8' }

  viewBox.appendChild(video)
  viewBox.appendChild(scanLine)
  overlay.appendChild(label)
  overlay.appendChild(viewBox)
  overlay.appendChild(cancelBtn)
  document.body.appendChild(overlay)

  await new Promise<void>(resolve => {
    if (video.readyState >= 2) { resolve(); return }
    video.onloadedmetadata = () => resolve()
  })

  const detector = new BarcodeDetector({
    formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'code_93', 'codabar', 'itf', 'qr_code', 'data_matrix', 'aztec', 'pdf417'],
  })

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!

  return new Promise<string>((resolve, reject) => {
    let running = true
    let rafId: number
    let timeoutId: ReturnType<typeof setTimeout>

    const cleanup = () => {
      running = false
      cancelAnimationFrame(rafId)
      clearTimeout(timeoutId)
      stream.getTracks().forEach(t => t.stop())
      overlay.remove()
      style.remove()
    }

    const tick = async () => {
      if (!running) return
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        ctx.drawImage(video, 0, 0)
        try {
          const barcodes = await detector.detect(canvas)
          if (barcodes.length > 0) {
            cleanup()
            resolve(barcodes[0].rawValue)
            return
          }
        } catch {}
      }
      rafId = requestAnimationFrame(() => setTimeout(tick, 200))
    }

    cancelBtn.onclick = () => {
      cleanup()
      reject(new Error('cancelled'))
    }

    timeoutId = setTimeout(() => {
      cleanup()
      reject(new Error('Tempo limite excedido. Nenhum código encontrado.'))
    }, 30000)

    tick()
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
