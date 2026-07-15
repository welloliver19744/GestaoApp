const webpush = require('web-push')

const PB_URL = process.env.PB_URL || 'http://localhost:8091'
const PUSH_SECRET = process.env.PUSH_SECRET
if (!PUSH_SECRET) {
  console.error('PUSH_SECRET environment variable is required.')
  process.exit(1)
}

let VAPID_KEYS
try {
  VAPID_KEYS = require('./vapid-keys.json')
} catch {
  console.error('vapid-keys.json not found. Generate with: npx web-push generate-vapid-keys --json > scripts/vapid-keys.json')
  process.exit(1)
}

webpush.setVapidDetails(
  'mailto:welloliver@gmail.com',
  VAPID_KEYS.publicKey,
  VAPID_KEYS.privateKey,
)

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

  // Also get pending notifications
  const pendingData = await api('/api/push/pending')

  if (!data.subscriptions?.length) {
    console.log('Nenhuma subscription ativa.')
    return
  }

  const messages = []

  // Add scheduled reminders (due tomorrow/overdue)
  if (data.dueTomorrow > 0) {
    messages.push({
      title: 'Contas a vencer amanhã',
      body: `${data.dueTomorrow} conta(s) vence(m) amanhã.`,
      url: '/transactions',
    })
  }

  if (data.overdue > 0) {
    messages.push({
      title: 'Contas vencidas',
      body: `${data.overdue} conta(s) estão vencidas e não pagas.`,
      url: '/transactions',
    })
  }

  // Add pending notifications (from shares, etc.)
  if (pendingData.notifications?.length) {
    for (const notif of pendingData.notifications) {
      messages.push({
        title: notif.title,
        body: notif.body,
        url: notif.url || '/transactions',
      })
    }
  }

  if (!messages.length) {
    console.log('Nenhuma notificação necessária hoje.')
    return
  }

  for (const sub of data.subscriptions) {
    const subscription = typeof sub.subscription === 'string'
      ? JSON.parse(sub.subscription)
      : sub.subscription

    for (const msg of messages) {
      try {
        await webpush.sendNotification(subscription, JSON.stringify(msg))
        console.log(`Push enviado para ${sub.id}: ${msg.title}`)
      } catch (e) {
        if (e.statusCode === 410) {
          console.log(`Removendo subscription expirada: ${sub.id}`)
          await api('/api/push/delete-subscription', { 'X-Subscription-Id': sub.id })
        } else {
          console.error(`Erro ao enviar push para ${sub.id}:`, e.message)
        }
      }
    }
  }

  console.log(`Notificações enviadas: ${messages.length} tipo(s) para ${data.subscriptions.length} dispositivo(s)`)
  
  // Delete processed pending notifications
  if (pendingData.notifications?.length) {
    const ids = pendingData.notifications.map(n => n.id).join(',')
    await api('/api/push/pending/delete', { ids })
    console.log(`Removidas ${pendingData.notifications.length} notificações pendentes processadas`)
  }
}

main().catch(console.error)
