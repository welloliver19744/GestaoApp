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
    try { return atob(str) } catch { return str }
  }
}

export function parseNFCeQRCode(qrData: string): NFCeData | null {
  if (!qrData) return null

  let url: URL
  try { url = new URL(qrData) } catch { return null }

  const rawP = url.searchParams.get('p')
  if (!rawP) return null

  const decoded = base64URLDecode(rawP)

  const pairs: Record<string, string> = {}
  const parts = decoded.split('|')
  for (const part of parts) {
    const eq = part.indexOf('=')
    if (eq === -1) continue
    const k = part.slice(0, eq).trim().toLowerCase()
    const v = part.slice(eq + 1).trim()
    pairs[k] = v
  }

  const chave = pairs['chavedacesso'] || pairs['chaveacesso'] || pairs['chave_de_acesso'] || pairs['chave'] || ''
  const rawTotal = pairs['valortotal'] || pairs['valor_total'] || pairs['valor'] || pairs['total'] || ''
  const rawDate = pairs['dataemissao'] || pairs['data_emissao'] || pairs['data'] || pairs['datahora'] || ''

  let total_amount = 0
  if (rawTotal) {
    const cleaned = rawTotal.replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.')
    total_amount = parseFloat(cleaned) || 0
  }

  let purchase_date = ''
  if (rawDate) {
    const parts = rawDate.split(' ')
    const dateOnly = parts[0]
    const m = dateOnly.match(/^(\d{2})[\/-](\d{2})[\/-](\d{4})/)
    if (m) purchase_date = `${m[3]}-${m[2]}-${m[1]}`
    else if (/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) purchase_date = dateOnly
  }

  let store = ''
  if (chave && chave.length >= 8) {
    const cnpj = chave.slice(6, 20)
    store = cnpj
  }

  store = pairs['nome'] || pairs['nome_fantasia'] || pairs['nomefantasia'] || pairs['razao_social'] || pairs['razaosocial'] || pairs['emitente'] || store

  return {
    total_amount,
    purchase_date,
    description: store ? `Compra ${store}` : 'Compra NFC-e',
    store,
    accessKey: chave,
  }
}
