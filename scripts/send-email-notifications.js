const nodemailer = require('nodemailer')
const fs = require('fs')
const path = require('path')

const PB_URL = process.env.PB_URL || 'http://localhost:8091'
const PUSH_SECRET = process.env.PUSH_SECRET
if (!PUSH_SECRET) {
  console.error('PUSH_SECRET environment variable is required.')
  process.exit(1)
}

let config
try {
  config = JSON.parse(fs.readFileSync(path.join(__dirname, 'email-config.json'), 'utf-8'))
} catch {
  console.error('email-config.json not found or invalid. Copy email-config.example.json and fill SMTP credentials.')
  process.exit(1)
}

if (!config.host || !config.user || !config.pass) {
  console.error('SMTP not configured. Fill host, user and pass in email-config.json')
  process.exit(1)
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

  if (!data.users?.length) {
    console.log('Nenhum usuário para notificar.')
    return
  }

  const messages = []
  if (data.dueTomorrow > 0) {
    messages.push(`📋 ${data.dueTomorrow} conta(s) vence(m) amanhã. Acesse https://gestaocasa.app/transactions para pagar.`)
  }
  if (data.overdue > 0) {
    messages.push(`⚠️ ${data.overdue} conta(s) estão vencidas e não pagas. Regularize em https://gestaocasa.app/transactions`)
  }

  if (!messages.length) {
    console.log('Nenhuma notificação necessária hoje.')
    return
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.pass },
  })

  await transporter.verify()
  console.log('SMTP connection OK')

  let sent = 0
  for (const user of data.users) {
    if (!user.email) continue
    try {
      await transporter.sendMail({
        from: config.from,
        to: user.email,
        subject: '📅 Lembretes de Contas - Gestão Casa',
        text: `Olá${user.name ? ' ' + user.name : ''},\n\n${messages.join('\n\n')}\n\n---\nGestão Casa`,
      })
      console.log(`Email enviado para ${user.email}`)
      sent++
    } catch (e) {
      console.error(`Erro ao enviar email para ${user.email}:`, e.message)
    }
  }

  console.log(`Notificações enviadas: ${messages.length} tipo(s) para ${sent} usuário(s)`)
}

main().catch(console.error)
