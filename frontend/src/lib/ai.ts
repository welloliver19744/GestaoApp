import { parseAmount, normalizeDateStr } from './utils'

export interface AIConfig {
  provider: string
  apiKey: string
  model: string
  endpoint: string
}

const STORAGE_KEY = 'gestaocasa_ai_config'

export const DEFAULT_ENDPOINTS: Record<string, string> = {
  openai: 'https://api.openai.com/v1',
  anthropic: 'https://api.anthropic.com/v1',
  ollama: 'http://localhost:11434/v1',
  openrouter: 'https://openrouter.ai/api/v1',
  groq: 'https://api.groq.com/openai/v1',
  deepseek: 'https://api.deepseek.com/v1',
  together: 'https://api.together.xyz/v1',
  perplexity: 'https://api.perplexity.ai',
  nvidia: 'https://integrate.api.nvidia.com/v1',
  mistral: 'https://api.mistral.ai/v1',
  google: 'https://generativelanguage.googleapis.com/v1beta/openai',
}

export function getAIConfig(): AIConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return { provider: 'openai', apiKey: '', model: 'gpt-4o-mini', endpoint: DEFAULT_ENDPOINTS.openai }
}

export function saveAIConfig(config: AIConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
}

export function getAIEndpoint(provider: string, customEndpoint: string): string {
  if (customEndpoint) return customEndpoint
  return DEFAULT_ENDPOINTS[provider] || DEFAULT_ENDPOINTS.openai
}

async function callAI(messages: unknown[], maxTokens = 500, temperature = 0.3) {
  const config = getAIConfig()
  const endpoint = getAIEndpoint(config.provider, config.endpoint)

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const openaiCompat = ['openai', 'ollama', 'openrouter', 'groq', 'deepseek', 'together', 'perplexity', 'nvidia', 'mistral', 'google']
  if (openaiCompat.includes(config.provider)) {
    headers['Authorization'] = `Bearer ${config.apiKey}`
  } else if (config.provider === 'anthropic') {
    headers['x-api-key'] = config.apiKey
    headers['anthropic-version'] = '2023-06-01'
  }

  let url = `${endpoint}/chat/completions`
  if (config.provider === 'google') {
    url += `?key=${config.apiKey}`
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ model: config.model, messages, max_tokens: maxTokens, temperature }),
  })

  if (!res.ok) {
    const text = await res.text()
    let msg = `AI API error (${res.status}): ${text}`
    if (text.includes('content') && text.includes('string')) {
      msg = `O modelo "${config.model}" não suporta visão/imagens. Escolha um provedor/modelo com suporte a visão (ex: gemini-1.5-flash no Google Gemini ou gpt-4o-mini no OpenRouter/OpenAI).`
    }
    throw new Error(msg)
  }

  const data = await res.json()
  const raw = data.choices?.[0]?.message?.content || data.content?.[0]?.text || data.candidates?.[0]?.content?.parts?.[0]?.text || JSON.stringify(data)
  console.log('[callAI raw]', raw.slice(0, 500))
  return raw
}

function extractJSON(text: string) {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end === -1 || end < start) throw new Error('Resposta da IA não contém JSON válido')
  return JSON.parse(text.slice(start, end + 1))
}

function normalizeScannedJSON(raw: Record<string, unknown>) {
  const rawDate = (raw.purchase_date ?? raw.data_compra ?? raw.data ?? raw.due_date ?? raw.vencimento ?? raw.date ?? '') as string
  return {
    description: (raw.description ?? raw.descricao ?? raw.desc ?? '') as string,
    amount: parseAmount(raw.amount ?? raw.total_amount ?? raw.valor ?? raw.total_pagar ?? raw.total ?? raw.value ?? 0),
    due_date: normalizeDateStr(rawDate),
    category: (raw.category ?? raw.categoria ?? 'Outros') as string,
    store: (raw.store ?? raw.estabelecimento ?? raw.empresa ?? raw.loja ?? '') as string,
  }
}

function cleanJSONResponse(text: string): string {
  // Reusa extractJSON para achar os boundaries, retorna a string limpa
  const parsed = extractJSON(text)
  return JSON.stringify(parsed)
}

export async function scanBillWithAI(imageBase64: string): Promise<{
  description: string
  amount: number
  due_date: string
  category: string
  store: string
  rawResponse: string
}> {
  const prompt = `Você é um especialista em OCR de notas fiscais e cupons brasileiros. Leia TODOS os campos da imagem com atenção.

Extraia APENAS o JSON abaixo, sem texto extra, sem markdown.

{
  "description": "nome curto (ex: Supermercado Assai, Conta Luz, Fatura Netflix)",
  "amount": 0.00,
  "purchase_date": "YYYY-MM-DD",
  "category": "Alimentacao | Transporte | Moradia | Saude | Educacao | Lazer | Assinaturas | Servicos | Salario | Outros",
  "store": "nome do estabelecimento"
}

INSTRUCOES OBRIGATORIAS:
- "amount" eh o ULTIMO valor numerico do cupom, SEMPRE apos as palavras TOTAL, TOTAL R$, TOTAL A PAGAR, VALOR TOTAL ou TOTAL GERAL. NUNCA use preco de item individual.
- "store" eh o nome do estabelecimento — geralmente na primeira linha do cupom.
- "purchase_date" eh a data de emissao no formato YYYY-MM-DD.
- "description" eh um resumo curto (ex: "Supermercado Extra", "Farmacia Sao Joao").
- "category" escolha UMA baseada no tipo de compra.
- Se tiver duvida, de seu MELHOR PALPITE. NAO deixe campos vazios.`

  const cfg = getAIConfig()
  const isAnthropic = cfg.provider === 'anthropic'
  const imageBlock = isAnthropic
    ? { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 } }
    : { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }

  const content = await callAI([
    { role: 'user', content: [
      { type: 'text', text: prompt },
      imageBlock,
    ]},
  ], 600, 0.1);

  let parsed: Record<string, unknown> = {}
  try {
    const cleaned = cleanJSONResponse(content)
    parsed = JSON.parse(cleaned)
  } catch {
    return { description: 'Conta', amount: 0, due_date: new Date().toISOString().slice(0, 10), category: 'Outros', store: '', rawResponse: content }
  }

  const normalized = normalizeScannedJSON(parsed);

  return {
    description: normalized.description || 'Conta',
    amount: normalized.amount || 0,
    due_date: normalized.due_date || new Date().toISOString().slice(0, 10),
    category: normalized.category || 'Outros',
    store: normalized.store || '',
    rawResponse: content,
  };
}

export async function scanReceiptWithAI(imageBase64: string): Promise<{
  total_amount: number
  store: string
  items: Array<{
    description: string
    amount: number
    suggested_category: string
  }>
  rawResponse: string
}> {
  const prompt = `Analise a imagem de cupom fiscal de varejo (supermercado, farmacia, loja) e extraia APENAS o JSON com todos os itens.

SAIDA (exemplo):
{
  "total_amount": 848.45,
  "store": "ASSAI ATACADISTA",
  "items": [
    { "description": "ARROZ TIO JOAO 5KG", "amount": 28.90, "suggested_category": "Alimentacao" },
    { "description": "LEITE INTEGRAL 1L", "amount": 6.50, "suggested_category": "Alimentacao" }
  ]
}

REGRAS:
- "total_amount": SOMENTE o ultimo valor do cupom apos "TOTAL", "TOTAL R$", "VALOR TOTAL". NUNCA use valor de item individual.
- "items": lista de TODOS os produtos comprados com seus precos individuais
- "suggested_category" para cada item: Alimentacao, Bebidas, Higiene, Limpeza, Pet, Bebe, Outros
- Se for conta unica (agua, luz, internet), retorne items com 1 elemento apenas
- Responda SOMENTE o JSON, sem markdown, sem texto extra`

  const cfg = getAIConfig()
  const isAnthropic = cfg.provider === 'anthropic'
  const imageBlock = isAnthropic
    ? { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 } }
    : { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }

  const content = await callAI([
    { role: 'user', content: [
      { type: 'text', text: prompt },
      imageBlock,
    ]},
  ], 800, 0.1);

  let parsed: Record<string, unknown> = {}
  try {
    const cleaned = cleanJSONResponse(content)
    parsed = JSON.parse(cleaned)
  } catch {
    return { total_amount: 0, store: '', items: [], rawResponse: content }
  }

  return {
    total_amount: parseAmount(parsed.total_amount ?? 0),
    store: (parsed.store ?? '') as string,
    items: Array.isArray(parsed.items) ? parsed.items.map((i: unknown) => {
      const item = i as Record<string, unknown>
      return {
        description: (item.description ?? item.descricao ?? '') as string,
        amount: parseAmount(item.amount ?? item.valor ?? item.price ?? 0),
        suggested_category: (item.suggested_category ?? item.suggestedCategory ?? item.categoria ?? 'Outros') as string,
      }
    }) : [],
    rawResponse: content,
  }
}

export async function autoCategorize(description: string, categories: { id: string, name: string }[]): Promise<string> {
  const catList = categories.map(c => c.name).join(', ')
  const prompt = `Com base na descrição "${description}", qual categoria é mais adequada entre: ${catList}?
Responda APENAS com o nome da categoria, sem pontuação ou texto extra.`

  const content = await callAI([
    { role: 'system', content: 'Você classifica despesas domésticas em categorias. Responda só o nome da categoria.' },
    { role: 'user', content: prompt },
  ], 50, 0.2)

  const matched = categories.find(c => c.name.toLowerCase().trim() === content.toLowerCase().trim())
  return matched?.id || ''
}


export async function generateInsights(
  currentMonth: { name: string, total: number, byCategory: { name: string, value: number }[] },
  previousMonth: { name: string, total: number } | null,
  last6MonthsAvg: number,
  anomalies: { description: string, value: number, category: string, avg: number }[],
): Promise<{ summary: string, prediction: string }> {
  const prompt = `Com base nos dados financeiros do mês:

Mês atual: ${currentMonth.name}
Total gasto: R$ ${currentMonth.total.toFixed(2)}
Gastos por categoria:
${currentMonth.byCategory.map(c => `- ${c.name}: R$ ${c.value.toFixed(2)}`).join('\n')}

${previousMonth ? `Mês anterior: ${previousMonth.name} - Total: R$ ${previousMonth.total.toFixed(2)}` : 'Mês anterior: sem dados'}
Média dos últimos 6 meses: R$ ${last6MonthsAvg.toFixed(2)}

${anomalies.length ? 'Anomalias detectadas:\n' + anomalies.map(a => `- ${a.description}: R$ ${a.value.toFixed(2)} (média: R$ ${a.avg.toFixed(2)})`).join('\n') : 'Nenhuma anomalia detectada.'}

Gere um JSON com:
{
  "summary": "resumo curto (1-2 frases) comparando com mês anterior e destacando maiores gastos",
  "prediction": "previsão para o próximo mês baseada na média e tendências (1 frase)"
}`

  const content = await callAI([
    { role: 'system', content: 'Você é um assistente financeiro. Gera análises curtas em português.' },
    { role: 'user', content: prompt },
  ], 300, 0.3)

  const parsed = extractJSON(content)
  return { summary: parsed.summary || '', prediction: parsed.prediction || '' }
}

export async function chatWithAI(
  query: string,
  context: { totalMonth: number, byCategory: { name: string, value: number }[], recentTransactions: string[] },
): Promise<string> {
  const prompt = `Contexto financeiro do mês atual:
Total gasto: R$ ${context.totalMonth.toFixed(2)}
Gastos por categoria:
${context.byCategory.map(c => `- ${c.name}: R$ ${c.value.toFixed(2)}`).join('\n')}
Últimas transações:
${context.recentTransactions.map(t => `- ${t}`).join('\n')}

Pergunta do usuário: "${query}"

Responda de forma clara e direta em português, baseada apenas nos dados fornecidos. Se não souber, diga que não tem dados suficientes.`

  const content = await callAI([
    { role: 'system', content: 'Você é um assistente financeiro pessoal. Responda em português com base nos dados fornecidos.' },
    { role: 'user', content: prompt },
  ], 400, 0.3)

  return content
}
