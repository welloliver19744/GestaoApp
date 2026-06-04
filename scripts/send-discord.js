const fs = require('fs')
const path = require('path')

const PB_URL = process.env.PB_URL || 'http://localhost:8091'
const PUSH_SECRET = process.env.PUSH_SECRET || 'changeme-push-secret-2026'

let config
try {
  config = JSON.parse(fs.readFileSync(path.join(__dirname, 'discord-config.json'), 'utf-8'))
} catch {
  console.error('discord-config.json not found or invalid. Create it with {"webhook":"https://discord.com/api/webhooks/..."}')
  process.exit(1)
}

if (!config.webhook) {
  console.error('Discord webhook URL not configured in discord-config.json')
  process.exit(0)
}

async function api(path, headers) {
  const url = `${PB_URL}${path}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'X-Secret': PUSH_SECRET, ...headers },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`API ${res.status}: ${text}`)
  }
  return res.json()
}

async function main() {
  const data = await api('/api/push/check')

  const messages = []
  if (data.dueTomorrow > 0) {
    messages.push(`📋 **${data.dueTomorrow} conta(s) vence(m) amanhã**`)
  }
  if (data.overdue > 0) {
    messages.push(`⚠️ **${data.overdue} conta(s) estão vencidas e não pagas**`)
  }

  if (!messages.length) {
    console.log('Nenhuma notificação necessária hoje.')
    return
  }

  const content = [
    '**📊 Gestão Casa — Lembretes Diários**',
    ...messages,
    '',
    'Acesse o app para mais detalhes.',
  ].join('\n')

  const res = await fetch(config.webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Discord webhook ${res.status}: ${text}`)
  }

  console.log(`Discord notification sent: ${messages.length} alertas`)
}

main().catch(e => {
  console.error('send-discord.js error:', e.message)
  process.exit(1)
})
