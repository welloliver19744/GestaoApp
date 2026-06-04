# AGENTS.md — Memória do Projeto Gestão Casa

## Stack
- **Frontend:** React 19, Vite, TypeScript, Tailwind CSS v4, Recharts, Lucide Icons
- **Backend:** PocketBase v0.39 (SQLite, auto-hosted)
- **Infra:** Docker (PocketBase + Nginx), GitHub Actions CI/CD
- **Server:** Ubuntu, UFW, fail2ban, cron, systemd timers
- **PWA:** vite-plugin-pwa (injectManifest), workbox

## Repositório
`https://github.com/welloliver19744/GestaoApp.git` (branch `master`)

## Servidor
- **Host:** 137.131.187.156
- **User:** ubuntu
- **SSH Key:** `C:\Users\welld\Downloads\ssh-key-2026-05-26 (1).key`
- **Project Dir:** `/home/ubuntu/gestaocasa`
- **Nginx Container:** `gestaocasa-frontend` (port 3001 → 80)
- **PocketBase Container:** `gestaocasa-pocketbase` (port 8091 → 8090)
- **Kong:** `supabase-kong` (port 8090)

## Arquitetura de Rede
```
Browser → Nginx (3001) → /api/ → Kong (8090) → PocketBase (8091 → 8090)
                                       → Supabase services
```

## Comandos Essenciais
```bash
# Deploy frontend (local)
cd frontend && npm run build
scp -r dist/* ubuntu@137.131.187.156:/home/ubuntu/gestaocasa/frontend/dist/
# Nota: Sempre reiniciar o container para que o Docker remonte a pasta dist (evita 403 Forbidden por inodes stale/antigos)
ssh ... 'chmod -R o+rX /home/ubuntu/gestaocasa/frontend/dist/ && docker restart gestaocasa-frontend'

# Backup manual
ssh ... 'bash /home/ubuntu/gestaocasa/scripts/backup.sh'

# Ver logs push
ssh ... 'tail -f /home/ubuntu/gestaocasa/scripts/push.log'

# Reload nginx
ssh ... 'docker exec gestaocasa-frontend nginx -s reload'

# Fix schema (SQLite direto)
scp scripts/fix_pb_schema.py ubuntu@...:/tmp/
ssh ... 'docker stop gestaocasa-pocketbase && docker cp gestaocasa-pocketbase:/pb_data/data.db /tmp/pb_data.db && python3 /tmp/fix_pb_schema.py /tmp/pb_data.db && docker cp /tmp/pb_data.db gestaocasa-pocketbase:/pb_data/data.db && docker start gestaocasa-pocketbase'

# Ver logs do PocketBase
ssh ... 'docker logs gestaocasa-pocketbase --tail 50'
```

## Cron Ativo
```
0 3 * * * backup.sh              # Backup diário
0 8 * * * send-push.js           # Push notifications (morning)
0 18 * * * send-push.js          # Push notifications (evening)
5 8 * * * send-email-notifications.js  # Email notifications
8 8 * * * node /home/ubuntu/gestaocasa/scripts/send-discord.js >> /home/ubuntu/gestaocasa/scripts/push.log 2>&1  # Discord
```

## PocketBase (v0.39)
- Admin: `http://137.131.187.156:8091/_/`
- Collections: transactions, categories, recurring_transactions, goals, push_subscriptions, users, groups
- Auth: POST `/api/collections/users/auth-with-password`
- Superuser: POST `/api/collections/_superusers/auth-with-password`
- Hooks: `pocketbase/pb_hooks/*.pb.js` (reload automático)
- **`$app.dao()` NÃO existe** — métodos DAO estão diretamente em `$app` (ex: `$app.findCollectionByNameOrId()`, `$app.findRecordsByFilter()`, `$app.save()`)
- **Campos armazenados como JSON** na coluna `fields` da tabela `_collections` (não existe tabela `_fields` separada)
- **`new Field()` + `importCollectionsByMarshaledJSON()`** rejeitam `_pb_users_auth_` como collectionId para campos relation. Workaround: Python script com sqlite3 direto
- **`crypto.randomUUID()`** não disponível em cron context — usar fallback Math.random
- Para alterar schema: parar container, copiar data.db, rodar Python, copiar de volta, iniciar container

## Collections API Fields

### transactions
- description, category (relation), store, purchase_date, total_amount, payment_type (cash|installment)
- installment_count, installment_number, installment_value, due_date, paid, paid_at, paid_by
- group_id, notes, receipt (file), currency, original_amount, created_by (relation), shared_with (relation[]), group (relation)

### groups
- name, description, members (relation[]), created_by (relation)

### recurring_transactions
- description, category, store, total_amount, currency, payment_type, installment_count, installment_value
- frequency (monthly|yearly), day_of_month, month, active, next_due, notes, owner

### goals
- name, target_amount, current_amount, deadline, color, icon, owner, goal_type (goal|investment), initial_amount

### push_subscriptions
- user (relation), subscription (json), enabled

## Features Implementadas (22 itens originais + extras)

### Completos
1. Backup automático (cron, 14d retention)
2. OCR + upload comprovantes (compressImage, scanBillWithAI)
3. Transações recorrentes (cron hook + UI)
4. Push notifications (VAPID, SW, cron)
5. Export CSV/PDF
6. Dashboard avançado (cards, line, donut, budgets, goals)
7. UX/UI (toasts, skeletons, search, filters)
8. Metas financeiras (CRUD, progress bars)
9. Multi-moeda (currency field, formatCurrency)
10. Compartilhamento (shared_with, ShareModal)
11. Segurança (fail2ban, UFW, healthcheck, CI/CD)
12. Testes (24 unit + component tests)
13. Error handling (console.error + toast em todos .catch)
14. Tema claro/escuro (useTheme, localStorage, .light CSS class)
15. Autocomplete lojas (TransactionForm)
16. Responsividade mobile (headers empilham, grid colapsa, hover → visible on mobile)
17. Editar recorrências (preserva active/next_due)
18. Galeria de comprovantes (/receipts, grid month filter)
19. Suporte offline (StaleWhileRevalidate API cache, OfflineBanner)
20. Rate limiting (Nginx 10r/s API, 3r/m login, fail2ban nginx-limit-req)
21. Notificações e-mail (nodemailer, cron, config template)
22. Contas familiares (groups collection, GroupSelector, Dashboard/Transactions filtrados, ShareModal integrado, schema corrigido)

### Extras pós-plano
- Auto-categorização AI onBlur
- PWA install prompt (beforeinstallprompt)
- Onboarding tutorial (6 steps, localStorage)
- Comparativo mensal (tabela categoria vs mês anterior no Dashboard)
- Bulk edit (checkboxes, selecionar todos, pagar/pendente/categoria/excluir)
- Metas investimento (goal_type, appreciation %)
- Relatórios anuais (/reports, bar/line charts, top categorias, export)
- Auto-fetch modelos AI ao trocar provedor, salvar chave e carregar página
- Notificações Discord (webhook, Settings UI, test button, cron 08:08)
- Scanner código de barras (BarcodeDetector API + Open Food Facts)
- Bottom nav mobile com scroll horizontal (todos os 8 itens, sem sobreposição)
- Modo Viagem (Settings toggle + datas, isola despesas de viagem do Dashboard, widget exclusivo com detalhes expansíveis)
- Comparativo de Lojas (ranking top 5 estabelecimentos no Dashboard, barras de progresso, ticket médio, visitas)

## Configurações Importantes
- **AI:** Config em Settings (provedor, modelo, API key) — salvo no localStorage. Provedores: OpenAI, Anthropic, OpenRouter, Groq, DeepSeek, Together, Perplexity, NVIDIA, Mistral, Google Gemini, Ollama, Custom. Botão "Buscar modelos" popula o select com modelos da API.
- **Push:** Toggle em Settings, requer service worker + VAPID keys
- **Email:** Preencher `scripts/email-config.json` no servidor com SMTP
- **Tema:** localStorage key `gestaocasa-theme`
- **Onboarding:** localStorage key `gestaocasa-onboarding-done`
- **Modo Viagem:** localStorage key `gestaocasa_travel_config` (JSON: active, name, startDate, endDate)

## Decisões Técnicas
- **window.location.origin** como PB_URL runtime (Nginx proxy funciona sempre)
- **SQLite direto** quando PocketBase v0.39 migration API falha
- **Relação compartilhada:** `shared_with ?= @request.auth.id` na list rule
- **Tema claro:** classe `.light` no HTML com paleta invertida (sem mudar componentes)
- **SW caching:** StaleWhileRevalidate para GET, NetworkOnly para mutations
- **Rate limit:** Nginx level (não PocketBase) para simplicidade
- **Auto-fetch modelos AI:** Ao trocar de provedor nas Configurações, `fetchModels()` é chamado automaticamente (com overrides de provider/endpoint para evitar stale closure). Também dispara ao carregar página (se já tiver API key) e ao salvar a chave.

## Implementado Recentemente
- **Scanner de código de barras:** Botão "Código" no TransactionForm. Usa `BarcodeDetector` API (Chrome/Edge, Android). Abre a câmera, detecta código de barras e busca dados do produto na Open Food Facts (grátis, sem chave). Preenche descrição, marca e preço automaticamente. Fallback: mostra o código como descrição. Não funciona no iPhone Safari.
- **Bottom nav mobile com scroll horizontal:** Todos os 8 itens de navegação visíveis no celular sem sobreposição, com scroll horizontal e barra de rolagem oculta.
- **Tags/labels nas transações:** 11 tags predefinidas (essencial, moradia, alimentação, etc) com cores. Seletor no TransactionForm, badges no TransactionCard, filtro na página Transactions. Schema: campo `tags` (JSON) na collection transactions via SQLite direto.
- **Economia sugerida no Dashboard:** Card que analisa as 3 maiores categorias de gasto do mês e sugere 10% de redução, mostrando o valor economizado.
- **Escaneamento de contas/cupons via IA:** Leitura e processamento de documentos (faturas, contas e recibos) via IA para extração do valor total, estabelecimento, data e categoria, sem separação de itens individuais.

## Ideias para Próximas Features
- Gráfico de projeção futura (saldo previsto 6 meses baseado em recorrências)
- Notificações WhatsApp/Telegram
- Tags/labels nas transações (emergência, lazer, essencial)
- Importação de CSV (extrato bancário)
- App mobile nativo (Capacitor/Tauri)
- Dashboard customizável (usuário escolhe cards)
- Metas compartilhadas (grupo contribui para mesma meta)
- Modo escuro automático (follow system)
- Suporte a mais idiomas (inglês, espanhol)
