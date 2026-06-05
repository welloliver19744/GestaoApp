import { useState, useEffect } from 'react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { pb } from '../api/client'
import { Server, Save, Brain, Eye, EyeOff, RefreshCw, Bell, BellOff, Loader2, Sun, Moon, MessageCircle, Plane, CreditCard, Plus, Trash2 } from 'lucide-react'
import { getAIConfig, saveAIConfig, DEFAULT_ENDPOINTS, type AIConfig } from '../lib/ai'
import { usePushNotifications } from '../hooks/usePushNotifications'
import { useTheme } from '../hooks/useTheme'
import { useCards } from '../hooks/useCards'
import { Mail } from 'lucide-react'

const PROVIDERS = [
  { value: 'openai', label: 'OpenAI', endpoint: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
  { value: 'anthropic', label: 'Anthropic (Claude)', endpoint: 'https://api.anthropic.com/v1', model: 'claude-3-haiku-20240307' },
  { value: 'openrouter', label: 'OpenRouter (vários modelos)', endpoint: 'https://openrouter.ai/api/v1', model: 'openai/gpt-4o-mini' },
  { value: 'groq', label: 'Groq (rápido)', endpoint: 'https://api.groq.com/openai/v1', model: 'llama-3.2-11b-vision-preview' },
  { value: 'deepseek', label: 'DeepSeek (barato)', endpoint: 'https://api.deepseek.com/v1', model: 'deepseek-chat' },
  { value: 'together', label: 'Together AI', endpoint: 'https://api.together.xyz/v1', model: 'mistralai/Mixtral-8x7B-Instruct-v0.1' },
  { value: 'perplexity', label: 'Perplexity', endpoint: 'https://api.perplexity.ai', model: 'sonar-pro' },
  { value: 'nvidia', label: 'NVIDIA NIM', endpoint: 'https://integrate.api.nvidia.com/v1', model: 'meta/llama3-70b-instruct' },
  { value: 'mistral', label: 'Mistral AI', endpoint: 'https://api.mistral.ai/v1', model: 'mistral-small-latest' },
  { value: 'google', label: 'Google Gemini', endpoint: 'https://generativelanguage.googleapis.com/v1beta/openai', model: 'gemini-1.5-flash' },
  { value: 'ollama', label: 'Ollama (local)', endpoint: 'http://localhost:11434/v1', model: 'llama3.2-vision' },
  { value: 'custom', label: 'Custom (OpenAI-compatível)', endpoint: '', model: '' },
]

export function Settings() {
  const user = pb.authStore.record
  const [name, setName] = useState(user?.name || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [discordWebhook, setDiscordWebhook] = useState(() => localStorage.getItem('gestaocasa_discord_webhook') || '')
  const [discordSaved, setDiscordSaved] = useState(false)

  const { data: cardList, create: createCard, remove: removeCard } = useCards()
  const [newCard, setNewCard] = useState({ name: '', type: 'credit' as 'credit' | 'debit', due_day: 1 })
  const [addingCard, setAddingCard] = useState(false)

  const [travelConfig, setTravelConfig] = useState(() => {
    try {
      const raw = localStorage.getItem('gestaocasa_travel_config')
      return raw ? JSON.parse(raw) : { active: false, name: '', startDate: '', endDate: '' }
    } catch { return { active: false, name: '', startDate: '', endDate: '' } }
  })
  const [travelSaved, setTravelSaved] = useState(false)

  const handleSaveTravel = () => {
    localStorage.setItem('gestaocasa_travel_config', JSON.stringify(travelConfig))
    setTravelSaved(true)
    setTimeout(() => setTravelSaved(false), 2000)
  }

  const updateTravel = <K extends keyof typeof travelConfig>(key: K, value: (typeof travelConfig)[K]) => {
    setTravelConfig((prev: typeof travelConfig) => ({ ...prev, [key]: value }))
  }

  const [aiConfig, setAiConfig] = useState<AIConfig>(getAIConfig)
  const [showKey, setShowKey] = useState(false)
  const [aiSaved, setAiSaved] = useState(false)

  useEffect(() => {
    const config = getAIConfig()
    setAiConfig(config)
    if (config.apiKey && config.provider !== 'custom') {
      fetchModels({ provider: config.provider, endpoint: config.endpoint, apiKey: config.apiKey })
    }
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await pb.collection('users').update(user!.id, { name })
      pb.authStore.record!.name = name
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveDiscord = () => {
    localStorage.setItem('gestaocasa_discord_webhook', discordWebhook)
    setDiscordSaved(true)
    setTimeout(() => setDiscordSaved(false), 2000)
  }

  const handleTestDiscord = async () => {
    if (!discordWebhook) return
    try {
      const res = await fetch(discordWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: '🔔 **Teste de notificação**\nSe você recebeu esta mensagem, as notificações Discord estão funcionando!',
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      alert('✅ Notificação de teste enviada com sucesso!')
    } catch (e) {
      alert('❌ Erro ao enviar: ' + (e instanceof Error ? e.message : 'erro desconhecido'))
    }
  }

  const handleSaveAI = () => {
    saveAIConfig(aiConfig)
    setAiSaved(true)
    setTimeout(() => setAiSaved(false), 2000)
    if (aiConfig.apiKey && aiConfig.provider !== 'custom') {
      fetchModels()
    }
  }

  const updateAI = <K extends keyof AIConfig>(key: K, value: AIConfig[K]) => {
    setAiConfig(prev => ({ ...prev, [key]: value }))
  }

  const selectedProvider = PROVIDERS.find(p => p.value === aiConfig.provider)

  const [models, setModels] = useState<string[] | null>(null)
  const [loadingModels, setLoadingModels] = useState(false)
  const [modelsError, setModelsError] = useState('')

  const fetchModels = async (overrides?: { provider?: string; endpoint?: string; apiKey?: string }) => {
    const apiKey = overrides?.apiKey || aiConfig.apiKey
    const provider = overrides?.provider || aiConfig.provider
    if (!apiKey) return
    setLoadingModels(true)
    setModelsError('')
    try {
      let url: string
      let options: RequestInit = { headers: {} }

      if (provider === 'anthropic') {
        url = 'https://api.anthropic.com/v1/models'
        options.headers = { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' }
      } else if (provider === 'google') {
        url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
      } else {
        const baseUrl = overrides?.endpoint || aiConfig.endpoint || DEFAULT_ENDPOINTS[provider]
        url = `${baseUrl}/models`
        options.headers = { Authorization: `Bearer ${apiKey}` }
      }

      const res = await fetch(url, options)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      let list: string[] = []
      if (data.data) {
        list = data.data.map((m: any) => m.id)
      } else if (data.models) {
        list = data.models.map((m: any) => m.id || m.name)
      }
      list = list.filter(Boolean).sort()
      if (list.length === 0) throw new Error('Nenhum modelo encontrado')
      setModels(list)
    } catch (e: any) {
      setModelsError(e.message || 'Erro ao buscar modelos')
      setModels(null)
    } finally {
      setLoadingModels(false)
    }
  }

  const handleProviderChange = (provider: string) => {
    const p = PROVIDERS.find(p => p.value === provider)
    setModels(null)
    setModelsError('')
    if (p && provider !== 'custom') {
      updateAI('provider', provider)
      updateAI('endpoint', p.endpoint)
      updateAI('model', p.model)
      fetchModels({ provider, endpoint: p.endpoint })
    } else {
      updateAI('provider', provider)
    }
  }

  const push = usePushNotifications()
  const { theme, toggle } = useTheme()

  const handleTogglePush = async () => {
    if (push.subscribed) {
      await push.unsubscribe()
    } else {
      await push.subscribe()
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-surface-100">Configurações</h1>
        <p className="text-sm text-surface-400">Preferências da conta</p>
      </div>

      <Card>
        <h2 className="text-sm font-semibold text-surface-200 mb-4">Perfil</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Nome</label>
            <div className="flex gap-2">
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                className="flex-1 h-10 px-3 rounded-lg bg-surface-800 border border-surface-700 text-surface-100 placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-neon-cyan/50 text-sm"
                placeholder="Seu nome"
              />
              <Button onClick={handleSave} disabled={saving}>
                <Save size={16} />{saving ? 'Salvando...' : saved ? 'Salvo ✓' : 'Salvar'}
              </Button>
            </div>
          </div>
          <div>
            <span className="text-xs text-surface-500 block mb-1">Email</span>
            <p className="text-surface-200 text-sm">{user?.email}</p>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Brain size={18} className="text-neon-cyan" />
          <h2 className="text-sm font-semibold text-surface-200">Inteligência Artificial</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Provedor</label>
              <select
                value={aiConfig.provider}
                onChange={e => handleProviderChange(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-surface-800 border border-surface-700 text-surface-100 focus:outline-none focus:ring-2 focus:ring-neon-cyan/50 text-sm"
              >
                {PROVIDERS.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
              {aiConfig.provider !== 'custom' && (
                <p className="text-xs text-surface-500 mt-1">Endpoint: {aiConfig.endpoint}</p>
              )}
          </div>
          {aiConfig.provider === 'custom' && (
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Endpoint (URL base)</label>
              <input
                value={aiConfig.endpoint}
                onChange={e => updateAI('endpoint', e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-surface-800 border border-surface-700 text-surface-100 placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-neon-cyan/50 text-sm"
                placeholder="https://sua-api.com/v1"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">
              {selectedProvider?.label || 'Custom'} - Modelo
            </label>
            <div className="flex gap-2">
              {models ? (
                <select
                  value={aiConfig.model}
                  onChange={e => updateAI('model', e.target.value)}
                  className="flex-1 h-10 px-3 rounded-lg bg-surface-800 border border-surface-700 text-surface-100 focus:outline-none focus:ring-2 focus:ring-neon-cyan/50 text-sm"
                >
                  {models.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              ) : (
                <input
                  value={aiConfig.model}
                  onChange={e => updateAI('model', e.target.value)}
                  className="flex-1 h-10 px-3 rounded-lg bg-surface-800 border border-surface-700 text-surface-100 placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-neon-cyan/50 text-sm"
                  placeholder="gpt-4o-mini"
                />
              )}
              {aiConfig.apiKey && (models ? (
                <Button onClick={() => fetchModels()} disabled={loadingModels} variant="secondary">
                  <RefreshCw size={16} className={loadingModels ? 'animate-spin' : ''} />
                </Button>
              ) : (
                <Button onClick={() => fetchModels()} disabled={loadingModels}>
                  {loadingModels ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    'Buscar modelos'
                  )}
                </Button>
              ))}
            </div>
            {modelsError && (
              <p className="text-xs text-neon-red mt-1">{modelsError}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">API Key</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={aiConfig.apiKey}
                  onChange={e => updateAI('apiKey', e.target.value)}
                  className="w-full h-10 pl-3 pr-10 rounded-lg bg-surface-800 border border-surface-700 text-surface-100 placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-neon-cyan/50 text-sm"
                  placeholder="sk-..."
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-200"
                >
                  {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <Button onClick={handleSaveAI} disabled={!aiConfig.apiKey}>
                {aiSaved ? 'Salvo ✓' : 'Salvar'}
              </Button>
            </div>
          </div>
          <p className="text-xs text-surface-500">
            A chave fica salva apenas no seu navegador. Usamos a API para ler contas com OCR.
          </p>
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Bell size={18} className="text-neon-cyan" />
          <h2 className="text-sm font-semibold text-surface-200">Notificações</h2>
        </div>
        <div className="space-y-4">
          {push.supported ? (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-surface-200">Notificações Push</p>
                  <p className="text-xs text-surface-500">
                    {push.subscribed
                      ? 'Você receberá lembretes de contas a vencer'
                      : 'Ative para receber lembretes no celular'}
                  </p>
                </div>
                <Button
                  onClick={handleTogglePush}
                  disabled={push.loading}
                  variant={push.subscribed ? 'primary' : 'secondary'}
                >
                  {push.loading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : push.subscribed ? (
                    <BellOff size={16} />
                  ) : (
                    <Bell size={16} />
                  )}
                  {push.subscribed ? 'Desativar' : 'Ativar'}
                </Button>
              </div>
              {push.permission === 'denied' && (
                <p className="text-xs text-neon-red">
                  As notificações estão bloqueadas no navegador. Permita nas configurações do site.
                </p>
              )}
              <p className="text-xs text-surface-500">
                Você receberá notificações diárias sobre contas a vencer e vencidas.
              </p>
            </>
          ) : (
            <p className="text-sm text-surface-500">
              Notificações push não são suportadas neste navegador.
            </p>
          )}
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Mail size={18} className="text-neon-cyan" />
          <h2 className="text-sm font-semibold text-surface-200">Notificações por E-mail</h2>
        </div>
        <div className="space-y-3">
          <p className="text-sm text-surface-400">
            Lembretes de contas a vencer também podem ser enviados por e-mail.
          </p>
          <p className="text-xs text-surface-500">
            Para ativar, configure um servidor SMTP no arquivo{' '}
            <code className="text-neon-cyan">scripts/email-config.json</code> do servidor.
            Use o modelo em <code className="text-neon-cyan">email-config.example.json</code>.
          </p>
          <p className="text-xs text-surface-500">
            Os e-mails são enviados automaticamente todos os dias às 08:05 para o e-mail cadastrado na sua conta.
          </p>
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-2 mb-4">
          <MessageCircle size={18} className="text-neon-cyan" />
          <h2 className="text-sm font-semibold text-surface-200">Notificações Discord</h2>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Webhook URL</label>
            <div className="flex gap-2">
              <input
                value={discordWebhook}
                onChange={e => setDiscordWebhook(e.target.value)}
                className="flex-1 h-10 px-3 rounded-lg bg-surface-800 border border-surface-700 text-surface-100 placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-neon-cyan/50 text-sm"
                placeholder="https://discord.com/api/webhooks/..."
              />
              <Button onClick={handleSaveDiscord}>
                {discordSaved ? 'Salvo ✓' : 'Salvar'}
              </Button>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleTestDiscord} disabled={!discordWebhook} variant="secondary" className="flex-1">
              Enviar teste
            </Button>
            <Button
              onClick={() => { setDiscordWebhook(''); localStorage.removeItem('gestaocasa_discord_webhook') }}
              variant="secondary"
              disabled={!discordWebhook}
            >
              Limpar
            </Button>
          </div>
          <p className="text-xs text-surface-500">
            Crie um webhook no Discord: Configurações do canal → Integrações → Webhooks → Copiar URL.
            As notificações de contas a vencer serão enviadas automaticamente às 08:00.
          </p>
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Plane size={18} className="text-sky-400" />
          <h2 className="text-sm font-semibold text-surface-200">Modo Viagem</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-surface-200">Ativar modo viagem</p>
              <p className="text-xs text-surface-500">
                {travelConfig.active
                  ? 'Despesas de viagem serão isoladas do Dashboard'
                  : 'Ative para separar os gastos da viagem'}
              </p>
            </div>
            <button
              onClick={() => updateTravel('active', !travelConfig.active)}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                travelConfig.active ? 'bg-sky-500' : 'bg-surface-700'
              }`}
              aria-label="Alternar modo viagem"
            >
              <span
                className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center transition-transform ${
                  travelConfig.active ? 'translate-x-7.5' : 'translate-x-0.5'
                }`}
              >
                <Plane size={12} className={travelConfig.active ? 'text-sky-500' : 'text-surface-500'} />
              </span>
            </button>
          </div>
          {travelConfig.active && (
            <>
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-1.5">Nome da viagem</label>
                <input
                  value={travelConfig.name}
                  onChange={e => updateTravel('name', e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-surface-800 border border-surface-700 text-surface-100 placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-sky-400/50 text-sm"
                  placeholder="Ex: Férias no litoral"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-1.5">Data início</label>
                  <input
                    type="date"
                    value={travelConfig.startDate}
                    onChange={e => updateTravel('startDate', e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-surface-800 border border-surface-700 text-surface-100 focus:outline-none focus:ring-2 focus:ring-sky-400/50 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-1.5">Data fim</label>
                  <input
                    type="date"
                    value={travelConfig.endDate}
                    onChange={e => updateTravel('endDate', e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-surface-800 border border-surface-700 text-surface-100 focus:outline-none focus:ring-2 focus:ring-sky-400/50 text-sm"
                  />
                </div>
              </div>
              <Button onClick={handleSaveTravel}>
                <Save size={16} />{travelSaved ? 'Salvo ✓' : 'Salvar Viagem'}
              </Button>
              <p className="text-xs text-surface-500">
                Transações com a tag "Viagem" ou dentro do período configurado serão separadas do Dashboard principal e exibidas em um widget exclusivo.
              </p>
            </>
          )}
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-2 mb-4">
          <CreditCard size={18} className="text-neon-purple" />
          <h2 className="text-sm font-semibold text-surface-200">Meus Cartões</h2>
        </div>
        <div className="space-y-3">
          {cardList.length === 0 && <p className="text-sm text-surface-500">Nenhum cartão cadastrado.</p>}
          {cardList.map(c => (
            <div key={c.id} className="flex items-center justify-between py-2 border-b border-surface-800">
              <div>
                <p className="text-sm text-surface-100">{c.name}</p>
                <p className="text-xs text-surface-500">{c.type === 'credit' ? 'Crédito' : 'Débito'}{c.due_day ? ` • venc. dia ${c.due_day}` : ''}</p>
              </div>
              <button onClick={() => removeCard(c.id)} className="text-surface-500 hover:text-neon-red transition-colors"><Trash2 size={14} /></button>
            </div>
          ))}
          {addingCard ? (
            <div className="space-y-2 pt-2">
              <input
                value={newCard.name}
                onChange={e => setNewCard(p => ({ ...p, name: e.target.value }))}
                placeholder="Nome do cartão (ex: Nubank, Inter)"
                className="w-full h-9 px-3 rounded-lg bg-surface-800 border border-surface-700 text-surface-100 placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-neon-purple/50 text-sm"
              />
              <div className="flex gap-2">
                <select
                  value={newCard.type}
                  onChange={e => setNewCard(p => ({ ...p, type: e.target.value as 'credit' | 'debit' }))}
                  className="flex-1 h-9 px-3 rounded-lg bg-surface-800 border border-surface-700 text-surface-100 focus:outline-none focus:ring-2 focus:ring-neon-purple/50 text-sm"
                >
                  <option value="credit">Crédito</option>
                  <option value="debit">Débito</option>
                </select>
                <input
                  type="number" min={1} max={31}
                  value={newCard.due_day}
                  onChange={e => setNewCard(p => ({ ...p, due_day: parseInt(e.target.value) || 1 }))}
                  placeholder="Dia venc."
                  className="w-24 h-9 px-3 rounded-lg bg-surface-800 border border-surface-700 text-surface-100 focus:outline-none focus:ring-2 focus:ring-neon-purple/50 text-sm"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={async () => { if (!newCard.name.trim()) return; await createCard(newCard); setNewCard({ name: '', type: 'credit', due_day: 1 }); setAddingCard(false) }}
                  className="flex-1"
                >
                  Salvar Cartão
                </Button>
                <Button variant="secondary" onClick={() => setAddingCard(false)}>Cancelar</Button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAddingCard(true)}
              className="flex items-center gap-2 text-sm text-neon-purple hover:text-neon-purple/80 transition-colors"
            >
              <Plus size={14} /> Adicionar cartão
            </button>
          )}
        </div>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-surface-200 mb-4">Aparência</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-surface-200">Tema {theme === 'dark' ? 'escuro' : 'claro'}</p>
            <p className="text-xs text-surface-500">Alternar entre modo escuro e claro</p>
          </div>
          <button
            onClick={toggle}
            className={`relative w-14 h-7 rounded-full transition-colors ${
              theme === 'dark' ? 'bg-surface-700' : 'bg-neon-cyan'
            }`}
            aria-label="Alternar tema"
          >
            <span
              className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center transition-transform ${
                theme === 'dark' ? 'translate-x-0.5' : 'translate-x-7.5'
              }`}
            >
              {theme === 'dark' ? <Moon size={12} className="text-surface-700" /> : <Sun size={12} className="text-amber-500" />}
            </span>
          </button>
        </div>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-surface-200 mb-4">Servidor</h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Server size={18} className="text-surface-400" />
            <div>
              <p className="text-sm text-surface-200">PocketBase</p>
              <p className="text-xs text-surface-500">{import.meta.env.VITE_POCKETBASE_URL || 'http://localhost:8090'}</p>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-surface-200 mb-4">App</h2>
        <div className="space-y-3">
          <p className="text-xs text-surface-500">
            Se o app não atualizar após um deploy, use o botão abaixo para forçar o recarregamento.
          </p>
          <Button
            onClick={async () => {
              const caches = await window.caches?.keys() || []
              await Promise.all(caches.map(c => window.caches.delete(c)))
              window.location.reload()
            }}
            variant="secondary"
          >
            <RefreshCw size={16} />Recarregar App
          </Button>
        </div>
      </Card>
    </div>
  )
}
