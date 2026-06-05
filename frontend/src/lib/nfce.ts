export interface NFCeData {
  total_amount: number
  purchase_date: string
  description: string
  store: string
  accessKey: string
}

function base64URLDecode(str: string): string {
  str = str.replace(/-/g, '+').replace(/_/g, '/')
  while (str.length % 4) str += '='
  try {
    return decodeURIComponent(escape(atob(str)))
  } catch {
    try { return atob(str) } catch { return '' }
  }
}

function tryParseJSON(text: string): Record<string, string> | null {
  try {
    const obj = JSON.parse(text)
    if (obj && typeof obj === 'object') {
      const flat: Record<string, string> = {}
      for (const [k, v] of Object.entries(obj)) {
        flat[k.toLowerCase()] = String(v ?? '')
      }
      return flat
    }
  } catch {}
  return null
}

function tryParsePipe(text: string): Record<string, string> {
  const pairs: Record<string, string> = {}
  for (const part of text.split('|')) {
    const eq = part.indexOf('=')
    if (eq === -1) continue
    pairs[part.slice(0, eq).trim().toLowerCase()] = part.slice(eq + 1).trim()
  }
  return pairs
}

function tryParseAmpersand(text: string): Record<string, string> {
  const pairs: Record<string, string> = {}
  for (const part of text.split('&')) {
    const eq = part.indexOf('=')
    if (eq === -1) continue
    pairs[part.slice(0, eq).trim().toLowerCase()] = decodeURIComponent(part.slice(eq + 1).trim())
  }
  return pairs
}

function extractFields(pairs: Record<string, string>): NFCeData {
  const chave = pairs['chavedacesso'] || pairs['chaveacesso'] || pairs['chave_de_acesso'] || pairs['chave'] || pairs['acesskey'] || pairs['accesskey'] || ''
  const rawTotal = pairs['valortotal'] || pairs['valor_total'] || pairs['valor'] || pairs['total'] || pairs['total_amount'] || pairs['vnf'] || ''
  const rawDate = pairs['dataemissao'] || pairs['data_emissao'] || pairs['data'] || pairs['datahora'] || pairs['demissao'] || pairs['date'] || ''
  const rawStore = pairs['nome'] || pairs['nome_fantasia'] || pairs['nomefantasia'] || pairs['razao_social'] || pairs['razaosocial'] || pairs['emitente'] || pairs['xfan'] || pairs['xnome'] || ''

  let total_amount = 0
  if (rawTotal) {
    const cleaned = rawTotal.replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.')
    total_amount = parseFloat(cleaned) || 0
  }

  let purchase_date = ''
  if (rawDate) {
    const d = rawDate.split(' ')[0]
    const m = d.match(/^(\d{2})[\/-](\d{2})[\/-](\d{4})/)
    if (m) purchase_date = `${m[3]}-${m[2]}-${m[1]}`
    else if (/^\d{4}-\d{2}-\d{2}$/.test(d)) purchase_date = d
  }

  let store = rawStore
  if (!store && chave && chave.length >= 8) {
    store = chave.slice(6, 20)
  }

  return {
    total_amount,
    purchase_date,
    description: store ? `Compra ${store}` : 'Compra NFC-e',
    store,
    accessKey: chave,
  }
}

export function parseNFCeQRCode(qrData: string): { data: NFCeData | null; debug: string } {
  if (!qrData) return { data: null, debug: 'QR vazio' }

  let decoded = ''
  let rawP = qrData

  try {
    const url = new URL(qrData)
    rawP = url.searchParams.get('p') || url.searchParams.get('chave') || url.searchParams.get('chaveDeAcesso') || url.searchParams.get('id') || url.searchParams.get('token') || ''
    if (!rawP) {
      decoded = url.searchParams.toString()
      const pairs = tryParseAmpersand(decoded)
      const result = extractFields(pairs)
      if (result.total_amount || result.purchase_date) {
        return { data: result, debug: `QR URL sem p, params: ${decoded}` }
      }
      return { data: null, debug: `QR URL sem parametro p. URL: ${qrData}` }
    }
  } catch {
    decoded = qrData
    const pairs = tryParsePipe(decoded) || tryParseAmpersand(decoded) || {}
    const result = extractFields(pairs)
    if (result.total_amount || result.purchase_date) {
      return { data: result, debug: `QR texto direto: ${qrData}` }
    }
    return { data: null, debug: `QR nao eh URL valida. Texto: ${qrData}` }
  }

  decoded = base64URLDecode(rawP)

  if (!decoded) {
    return { data: null, debug: `p encontrado mas base64 vazio. rawP: ${rawP}` }
  }

  let pairs = tryParseJSON(decoded)
  if (pairs && Object.keys(pairs).length) {
    const result = extractFields(pairs)
    return { data: result, debug: `Formato JSON. decoded: ${decoded}` }
  }

  pairs = tryParsePipe(decoded)
  if (pairs && Object.keys(pairs).length > 1) {
    const result = extractFields(pairs)
    return { data: result, debug: `Formato pipe. decoded: ${decoded}` }
  }

  pairs = tryParseAmpersand(decoded)
  if (pairs && Object.keys(pairs).length > 1) {
    const result = extractFields(pairs)
    return { data: result, debug: `Formato ampersand. decoded: ${decoded}` }
  }

  const result = extractFields({})
  return { data: result, debug: `Formato desconhecido. rawP: ${rawP} decoded: ${decoded}` }
}
