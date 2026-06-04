import { useState, useEffect } from 'react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { pb } from '../api/client'
import { Server, Save, Brain, Eye, EyeOff, RefreshCw, Bell, BellOff, Loader2, Sun, Moon } from 'lucide-react'
import { getAIConfig, saveAIConfig, type AIConfig } from '../lib/ai'
import { usePushNotifications } from '../hooks/usePushNotifications'
import { useTheme } from '../hooks/useTheme'
import { Mail } from 'lucide-react'

const PROVIDERS = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic (Claude)' },
  { value: 'ollama', label: 'Ollama (local)' },
  { value: 'custom', label: 'Custom (OpenAI-compatível)' },
]

export function Settings() {
  const user = pb.authStore.record
  const [name, setName] = useState(user?.name || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [aiConfig, setAiConfig] = useState<AIConfig>(getAIConfig)
  const [showKey, setShowKey] = useState(false)
  const [aiSaved, setAiSaved] = useState(false)

  useEffect(() => { setAiConfig(getAIConfig()) }, [])

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

  const handleSaveAI = () => {
    saveAIConfig(aiConfig)
    setAiSaved(true)
    setTimeout(() => setAiSaved(false), 2000)
  }

  const updateAI = <K extends keyof AIConfig>(key: K, value: AIConfig[K]) => {
    setAiConfig(prev => ({ ...prev, [key]: value }))
  }

  const selectedProvider = PROVIDERS.find(p => p.value === aiConfig.provider)

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
              onChange={e => {
                const provider = e.target.value
                updateAI('provider', provider)
                if (provider !== 'custom') {
                  const endpoints: Record<string, string> = {
                    openai: 'https://api.openai.com/v1',
                    anthropic: 'https://api.anthropic.com/v1',
                    ollama: 'http://localhost:11434/v1',
                  }
                  updateAI('endpoint', endpoints[provider] || '')
                  const models: Record<string, string> = {
                    openai: 'gpt-4o-mini',
                    anthropic: 'claude-3-haiku-20240307',
                    ollama: 'llama3.2-vision',
                  }
                  updateAI('model', models[provider] || '')
                }
              }}
              className="w-full h-10 px-3 rounded-lg bg-surface-800 border border-surface-700 text-surface-100 focus:outline-none focus:ring-2 focus:ring-neon-cyan/50 text-sm"
            >
              {PROVIDERS.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
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
            <input
              value={aiConfig.model}
              onChange={e => updateAI('model', e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-surface-800 border border-surface-700 text-surface-100 placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-neon-cyan/50 text-sm"
              placeholder="gpt-4o-mini"
            />
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
