import { useState } from 'react'
import { PiggyBank, ArrowLeftRight, Target, Repeat, Image, BarChart3 } from 'lucide-react'

const steps = [
  {
    icon: PiggyBank,
    title: 'Bem-vindo ao Gestão Casa',
    description: 'Seu app de finanças domésticas. Acompanhe contas, controle gastos e organize suas metas financeiras.',
  },
  {
    icon: ArrowLeftRight,
    title: 'Registre Transações',
    description: 'Adicione contas a pagar com descrição, valor, categoria e comprovante. Use a IA para escanear contas com a câmera.',
  },
  {
    icon: BarChart3,
    title: 'Acompanhe no Dashboard',
    description: 'Veja gráficos de evolução mensal, orçamento por categoria e próximos vencimentos em um só lugar.',
  },
  {
    icon: Repeat,
    title: 'Configure Recorrências',
    description: 'Contas mensais ou anuais? Cadastre uma vez e deixe o app gerar automaticamente os vencimentos.',
  },
  {
    icon: Target,
    title: 'Defina Metas Financeiras',
    description: 'Crie metas de economia, viagem, reserva de emergência e acompanhe o progresso.',
  },
  {
    icon: Image,
    title: 'Comprovantes e Offline',
    description: 'Tire foto dos comprovantes ao registrar. O app funciona offline e sincroniza quando voltar.',
  },
]

export function Onboarding() {
  const [open, setOpen] = useState(() => {
    try { return !localStorage.getItem('gestaocasa-onboarding-done') } catch { return false }
  })
  const [step, setStep] = useState(0)
  if (!open) return null

  const current = steps[step]
  const isLast = step === steps.length - 1

  const next = () => {
    if (isLast) {
      try { localStorage.setItem('gestaocasa-onboarding-done', '1') } catch {}
      setOpen(false)
    } else {
      setStep(s => s + 1)
    }
  }

  const skip = () => {
    try { localStorage.setItem('gestaocasa-onboarding-done', '1') } catch {}
    setOpen(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-surface-900 rounded-2xl border border-surface-800 shadow-2xl w-full max-w-sm mx-4 p-6">
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-neon-cyan/10 flex items-center justify-center mb-4">
            <current.icon size={28} className="text-neon-cyan" />
          </div>
          <h2 className="text-lg font-semibold text-surface-100 mb-2">{current.title}</h2>
          <p className="text-sm text-surface-400 leading-relaxed">{current.description}</p>

          <div className="flex items-center gap-1.5 mt-6 mb-5">
            {steps.map((_, i) => (
              <span
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  i === step ? 'bg-neon-cyan w-3' : 'bg-surface-600'
                }`}
              />
            ))}
          </div>

          <div className="flex gap-2 w-full">
            <button
              onClick={skip}
              className="flex-1 h-9 rounded-lg text-xs text-surface-400 hover:text-surface-200 transition-colors"
            >
              Pular
            </button>
            <button
              onClick={next}
              className="flex-1 h-9 rounded-lg bg-neon-cyan text-surface-950 text-xs font-semibold hover:bg-neon-cyan/90 transition-colors"
            >
              {isLast ? 'Começar' : 'Próximo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
