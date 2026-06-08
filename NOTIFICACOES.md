# Manual de Notificações — Gestão Casa

## Sumário

1. [Push Notifications (Browser)](#1-push-notifications-browser)
2. [Notificações por E-mail](#2-notificações-por-e-mail)
3. [Notificações Discord](#3-notificações-discord)
4. [Cron Jobs (Servidor)](#4-cron-jobs-servidor)
5. [Testando Tudo](#5-testando-tudo)
6. [Solução de Problemas](#6-solução-de-problemas)

---

## 1. Push Notifications (Browser)

### O que faz
Envia notificações nativas do navegador (ou do sistema operacional) para o usuário sobre:
- Contas vencendo amanhã
- Contas vencidas não pagas
- Transações compartilhadas por outro usuário

### Frequência
- Automático: 08:00 e 18:00 (cron)
- Reativo: ao compartilhar uma transação

### Configuração

#### No app (Settings → Notificações Push)
1. Abra **Configurações**
2. Na seção **Notificações Push**, clique em **"Ativar"**
3. O navegador vai pedir permissão — autorize
4. Pronto. O ícone muda pra "Desativar" e o app começa a receber notificações

> **Requer Service Worker ativo** — o PWA precisa estar registrado. Se desinstalou o PWA, reinstale.

#### No servidor (VAPID keys)

As chaves VAPID já estão configuradas. Só precisam ser geradas se for recriar o servidor do zero:

```bash
# Gerar novas chaves VAPID
npx web-push generate-vapid-keys --json > scripts/vapid-keys.json
```

**Arquivos envolvidos:**
- `scripts/vapid-keys.json` — chave pública + privada para criptografia push
- `scripts/send-push.js` — script cron que dispara as notificações
- `frontend/src/sw.ts` — Service Worker que escuta o evento `push`
- `frontend/src/hooks/usePushNotifications.ts` — hook de registro do push

---

## 2. Notificações por E-mail

### O que faz
Envia um e-mail consolidado para cada usuário cadastrado sobre:
- Contas vencendo amanhã
- Contas vencidas não pagas

### Frequência
- 1x/dia às 08:05 (cron)

### Configuração

#### 1. Criar o arquivo de configuração SMTP

Conecte no servidor via SSH:

```bash
ssh -i "C:\Users\welld\Downloads\ssh-key-2026-05-26 (1).key" ubuntu@137.131.187.156
cd /home/ubuntu/gestaocasa/scripts
cp email-config.example.json email-config.json
nano email-config.json
```

#### 2. Preencher com dados do seu SMTP

```json
{
  "host": "smtp.gmail.com",
  "port": 587,
  "secure": false,
  "user": "seu-email@gmail.com",
  "pass": "sua-senha-de-app",
  "from": "noreply@gestaocasa.app"
}
```

**Gmail:**
- Host: `smtp.gmail.com`
- Porta: `587`
- Secure: `false`
- Senha: **não é a senha da sua conta!** Crie uma "Senha de App" em:  
  [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)

**Outros provedores** (Outlook, Yahoo, etc):
| Provedor | Host | Porta | Secure |
|----------|------|-------|--------|
| Outlook | smtp.office365.com | 587 | false |
| Yahoo | smtp.mail.yahoo.com | 465 | true |
| Gmail | smtp.gmail.com | 587 | false |
| Amazon SES | email-smtp.us-east-1.amazonaws.com | 587 | false |

#### 3. Testar a configuração

O cron vai executar automaticamente amanhã às 08:05. Para testar agora:

```bash
node /home/ubuntu/gestaocasa/scripts/send-email-notifications.js
```

> Se não configurado, o script sai sem erro (`process.exit(0)`) — não trava nada.

---

## 3. Notificações Discord

### O que faz
Envia uma mensagem num canal do Discord sobre:
- Contas vencendo amanhã
- Contas vencidas não pagas

### Frequência
- 1x/dia às 08:08 (cron)

### Configuração

#### 1. Criar Webhook no Discord

1. Abra seu servidor no Discord
2. Vá no canal desejado (ex: #financeiro)
3. Clique no ⚙️ **Editar Canal** (ao lado do nome)
4. Vá em **Integrações** → **Webhooks**
5. Clique em **"Criar Webhook"**
6. Dê um nome (ex: "Gestão Casa")
7. Copie a URL do webhook

#### 2. Configurar no servidor

```bash
ssh -i "C:\Users\welld\Downloads\ssh-key-2026-05-26 (1).key" ubuntu@137.131.187.156
cd /home/ubuntu/gestaocasa/scripts
cp discord-config.example.json discord-config.json
nano discord-config.json
```

Cole a URL copiada:

```json
{
  "webhook": "https://discord.com/api/webhooks/123456789/abc-def-ghi"
}
```

#### 3. Testar

**Via servidor (cron):**
```bash
node /home/ubuntu/gestaocasa/scripts/send-discord.js
```

**Via app (Settings):**
1. Abra **Configurações** → **Notificações Discord**
2. Cole a mesma URL do webhook
3. Clique em **Salvar**
4. Clique em **Testar** — uma mensagem de teste aparece no Discord
5. O webhook salvo no `localStorage` do navegador é usado apenas para o botão "Testar". O cron do servidor usa o arquivo `discord-config.json`.

#### 4. (Opcional) Limpar webhook

No app:
- Clique em **Limpar** para remover do navegador

No servidor:
```bash
echo '{"webhook": ""}' > /home/ubuntu/gestaocasa/scripts/discord-config.json
```

---

## 4. Cron Jobs (Servidor)

Os cron já estão ativos. Verifique com:

```bash
crontab -l
```

Saída esperada:
```
0 8 * * * /usr/bin/node /home/ubuntu/gestaocasa/scripts/send-push.js >> /home/ubuntu/gestaocasa/scripts/push.log 2>&1
0 18 * * * /usr/bin/node /home/ubuntu/gestaocasa/scripts/send-push.js >> /home/ubuntu/gestaocasa/scripts/push.log 2>&1
5 8 * * * /usr/bin/node /home/ubuntu/gestaocasa/scripts/send-email-notifications.js >> /home/ubuntu/gestaocasa/scripts/push.log 2>&1
8 8 * * * /usr/bin/node /home/ubuntu/gestaocasa/scripts/send-discord.js >> /home/ubuntu/gestaocasa/scripts/push.log 2>&1
```

### Horários
| Horário | Ação | Script |
|---------|------|--------|
| 08:00 | Push manhã | `send-push.js` |
| 08:05 | E-mail | `send-email-notifications.js` |
| 08:08 | Discord | `send-discord.js` |
| 18:00 | Push tarde | `send-push.js` |

### Logs
```bash
# Ver logs de todas as notificações
tail -f /home/ubuntu/gestaocasa/scripts/push.log
```

---

## 5. Testando Tudo

### Push Notification
1. No app: Settings → Notificações Push → Ativar
2. No servidor: rode o script manualmente:
   ```bash
   node /home/ubuntu/gestaocasa/scripts/send-push.js
   ```
3. Verifique se a notificação aparece no browser

### E-mail
1. Configure o SMTP (seção 2)
2. Rode manualmente:
   ```bash
   node /home/ubuntu/gestaocasa/scripts/send-email-notifications.js
   ```
3. Verifique a caixa de entrada

### Discord
1. Configure o webhook (seção 3)
2. Teste pelo app: Settings → Notificações Discord → Testar
3. Ou pelo servidor:
   ```bash
   node /home/ubuntu/gestaocasa/scripts/send-discord.js
   ```
4. Verifique o canal do Discord

### Endpoint de diagnóstico
Para verificar subscriptions e dados sem enviar notificações:

```bash
curl -X POST http://localhost:8091/api/push/check -H 'X-Secret: changeme-push-secret-2026'
```

Retorna:
```json
{
  "subscriptions": [...],
  "users": [...],
  "dueTomorrow": 2,
  "overdue": 1
}
```

---

## 6. Solução de Problemas

### Push não aparece

| Problema | Causa | Solução |
|----------|-------|---------|
| "Não suportado" no app | Navegador não tem Push API | Use Chrome/Edge/FF. Safari iOS só com PWA instalado |
| Notificação não chega | SW desativado | Reinstale o PWA ou faça hard refresh |
| Erro 410 no log | Subscription expirada | O script remove automaticamente |
| Permissão negada | Usuário bloqueou | Resetar permissão nas Configurações do navegador |

### E-mail não envia

| Problema | Causa | Solução |
|----------|-------|---------|
| `email-config.json not found` | Arquivo não criado | Criar com `cp email-config.example.json email-config.json` |
| SMTP connection failed | Credenciais erradas | Verificar host/user/pass |
| Gmail rejeita | Senha de app não gerada | Criar senha de app em myaccount.google.com/apppasswords |
| Nenhum e-mail enviado | Nenhum user com e-mail | Verificar collection `users` no PocketBase |

### Discord não envia

| Problema | Causa | Solução |
|----------|-------|---------|
| `discord-config.json not found` | Arquivo não criado | Criar com `cp discord-config.example.json discord-config.json` |
| Webhook 404 | URL do webhook apagada/excluída | Recriar webhook no Discord |
| Mensagem não aparece | Canal errado | Verificar se o webhook está no canal correto |

### Webhook secret

Todas as chamadas internas da API usam o header `X-Secret`. Isso já está configurado no servidor. Se precisar alterar:

```bash
# No crontab, adicione a variável
PUSH_SECRET=seu-novo-secret node /home/ubuntu/gestaocasa/scripts/send-push.js
```

---

## Arquivos Relevantes

| Arquivo | Função |
|---------|--------|
| `scripts/send-push.js` | Script cron de push (web-push) |
| `scripts/send-email-notifications.js` | Script cron de e-mail (nodemailer) |
| `scripts/send-discord.js` | Script cron de Discord (webhook) |
| `scripts/vapid-keys.json` | Chaves VAPID do push |
| `scripts/email-config.json` | Config SMTP (criar manualmente) |
| `scripts/email-config.example.json` | Template da config SMTP |
| `scripts/discord-config.json` | URL do webhook Discord (criar manualmente) |
| `scripts/discord-config.example.json` | Template da config Discord |
| `frontend/src/sw.ts` | Service Worker (escuta push) |
| `frontend/src/hooks/usePushNotifications.ts` | Hook de registro push no frontend |
| `frontend/src/pages/Settings.tsx` | UI de configurações (push, discord) |
| `pocketbase/pb_hooks/push_endpoint.pb.js` | Hooks REST de push no PocketBase |
