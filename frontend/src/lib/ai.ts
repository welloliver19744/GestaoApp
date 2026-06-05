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
  const openaiCompat = ['openai', 'ollama', 'openrouter', 'groq', 'deepseek', 'together', 'perplexity', 'nvidia', 'mistral']
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
  return data.choices?.[0]?.message?.content || data.content?.[0]?.text || ''
}

function extractJSON(text: string) {
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('Resposta da IA não contém JSON válido')
  return JSON.parse(match[0])
}

export async function scanBillWithAI(imageBase64: string): Promise<{
  description: string
  amount: number
  due_date: string
  category: string
  store: string
}> {
  const prompt = `Você é um assistente especializado em ler documentos financeiros (notas fiscais, faturas, contas, recibos, comprovantes).
Analise a imagem e extraia APENAS estas informações em JSON:
{
  "description": "descrição curta do item ou serviço (ex: Supermercado - compra mensal, Conta de Luz - junho, Boleto Netflix)",
  "amount": valor total (número, sem R$, usar . como decimal),
  "due_date": data de vencimento no formato YYYY-MM-DD (ou a data da compra se não tiver vencimento),
  "category": "categoria mais adequada entre (Alimentação, Transporte, Moradia, Saúde, Educação, Lazer, Assinaturas, Serviços, Salário, Outros)",
  "store": "nome do estabelecimento, empresa ou emissor"
}
Responda APENAS o JSON, sem formatação ou texto extra.`;

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
  ], 300, 0.1);

  const parsed = extractJSON(content);
  return {
    description: parsed.description || 'Conta',
    amount: parsed.amount || 0,
    due_date: parsed.due_date || new Date().toISOString().slice(0, 10),
    category: parsed.category || 'Outros',
    store: parsed.store || '',
  };
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
