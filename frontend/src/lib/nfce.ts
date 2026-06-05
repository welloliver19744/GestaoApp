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
      for (const [k, v] of Object.entries(obj)) flat[k.toLowerCase()] = String(v ?? '')
      return flat
    }
  } catch {}
  return null
}

function tryParsePipe(text: string): Record<string, string> {
  const pairs: Record<string, string> = {}
  for (const part of text.split('|')) {
    const eq = part.indexOf('=')
    if (eq === -1) { pairs[`_${pairs.length}`] = part; continue }
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

function extractCNPJFromAccessKey(chave: string): string {
  if (!chave || chave.length < 20) return ''
  return chave.slice(6, 20)
}

export async function lookupCNPJ(cnpj: string): Promise<string> {
  try {
    const res = await fetch(`https://minhareceita.org/${cnpj}`)
    if (!res.ok) return ''
    const data = await res.json()
    return data.nome_fantasia || data.razao_social || ''
  } catch {
    return ''
  }
}

function extractFields(pairs: Record<string, string>, isDirectAccessKey: boolean): NFCeData {
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
    const cnpj = chave.slice(6, 20)
    store = cnpj
  }
  if (isDirectAccessKey && !store && chave && chave.length >= 8) {
    const cnpj = chave.slice(6, 20)
    store = cnpj
  }

  return {
    total_amount,
    purchase_date,
    description: store ? (total_amount ? `Compra ${store}` : `NFC-e ${store}`) : 'Compra NFC-e',
    store,
    accessKey: chave,
  }
}

function isAccessKey(s: string): boolean {
  return /^\d{44}$/.test(s.trim())
}

export function parseNFCeQRCode(qrData: string): { data: NFCeData | null; debug: string } {
  if (!qrData) return { data: null, debug: 'QR vazio' }

  let rawP = ''
  let decoded = ''

  try {
    const url = new URL(qrData)
    rawP = url.searchParams.get('p') || url.searchParams.get('chave') || url.searchParams.get('chaveDeAcesso') || url.searchParams.get('id') || url.searchParams.get('token') || ''

    if (!rawP) {
      const paramsStr = url.searchParams.toString()
      const pairs = tryParseAmpersand(paramsStr)
      const result = extractFields(pairs, false)
      if (result.total_amount || result.purchase_date || result.accessKey) {
        return { data: result, debug: `QR sem p, params: ${paramsStr}` }
      }
      return { data: null, debug: `QR URL sem parametro p. URL: ${qrData}` }
    }
  } catch {
    decoded = qrData.trim()
    if (isAccessKey(decoded)) {
      const cnpj = extractCNPJFromAccessKey(decoded)
      return {
        data: { total_amount: 0, purchase_date: '', description: `NFC-e ${cnpj}`, store: cnpj, accessKey: decoded },
        debug: `QR texto direto (chave acesso): ${decoded}`,
      }
    }
    return { data: null, debug: `QR nao eh URL. Texto: ${qrData}` }
  }

  if (isAccessKey(rawP)) {
    const cnpj = extractCNPJFromAccessKey(rawP)
    return {
      data: { total_amount: 0, purchase_date: '', description: `NFC-e ${cnpj}`, store: cnpj, accessKey: rawP },
      debug: `p contem chave acesso direta: ${rawP}`,
    }
  }

  const rawParts = rawP.split('|')
  if (rawParts.length >= 1 && isAccessKey(rawParts[0])) {
    const chave = rawParts[0].trim()
    const cnpj = extractCNPJFromAccessKey(chave)
    return {
      data: { total_amount: 0, purchase_date: '', description: `NFC-e ${cnpj}`, store: cnpj, accessKey: chave },
      debug: `p formato SP/SAT: chave=${chave}`,
    }
  }

  decoded = base64URLDecode(rawP)
  if (!decoded) {
    const pairs = tryParsePipe(rawP)
    const result = extractFields(pairs, true)
    if (result.accessKey) {
      return { data: result, debug: `p nao-base64, parse direto: ${rawP}` }
    }
    return { data: null, debug: `p encontrado mas base64 vazio e parse falhou. rawP: ${rawP}` }
  }

  let pairs = tryParseJSON(decoded)
  if (pairs && Object.keys(pairs).length) {
    const result = extractFields(pairs, false)
    return { data: result, debug: `JSON. decoded: ${decoded}` }
  }

  pairs = tryParsePipe(decoded)
  if (pairs && Object.keys(pairs).length > 0) {
    const result = extractFields(pairs, false)
    if (result.total_amount || result.accessKey) {
      return { data: result, debug: `Pipe. decoded: ${decoded}` }
    }
  }

  pairs = tryParseAmpersand(decoded)
  if (pairs && Object.keys(pairs).length > 0) {
    const result = extractFields(pairs, false)
    if (result.total_amount || result.accessKey) {
      return { data: result, debug: `Ampersand. decoded: ${decoded}` }
    }
  }

  return { data: null, debug: `Formato desconhecido. rawP: ${rawP} decoded: ${decoded}` }
}
