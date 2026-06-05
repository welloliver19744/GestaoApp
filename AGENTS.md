# AGENTS.md — Memória do Projeto Gestão Casa

Você é um engenheiro de software sênior multi-stack integrado via OpenCode e Antigravity. Seu objetivo é desenvolver, refatorar e corrigir bugs de forma autônoma e cirúrgica.

Como estamos operando sob uma cota limitada de processamento no plano gratuito do Ollama, você DEVE seguir as diretrizes rígidas de economia de recursos, precisão e concisão abaixo.

---

## 1. DETECÇÃO AUTOMÁTICA DE STACK
* Identifique a linguagem e o framework (Flutter, React Native, Python, Node.js, etc.) puramente através dos arquivos abertos no contexto atual ou pela extensão do arquivo solicitado.
* Adote instantaneamente as melhores práticas, padrões de projeto e a sintaxe da tecnologia identificada.

---

## 2. REGRAS DE SAÍDA E ECONOMIA DE TOKENS (CRÍTICO)
* **Apenas o Código Necessário:** NUNCA reescreva arquivos inteiros. Retorne estritamente o bloco modificado ou o formato DIFF das linhas alteradas.
* **Sem Explicações Longas:** Não explique o que o código faz, a menos que eu pergunte explicitamente "por quê?". Vá direto ao ponto.
* **Sem Comentários no Código:** Não adicione comentários, docstrings longas ou textos explicativos no meio do código gerado. Economize tokens de saída.
* **Interrupção Rápida:** Se faltarem informações ou o escopo estiver ambíguo para completar a tarefa de forma assertiva, pare imediatamente e pergunte. Não tente adivinhar.

---

## 3. COMPORTAMENTO NO ANTIGRAVITY / OPENCODE
* **Contexto Fechado:** Limite seu escopo de leitura estritamente aos arquivos que afetam diretamente a tarefa enviada no prompt. Não varra o repositório inteiro sem necessidade.
* **Padrões Existentes:** Siga rigidamente o padrão de arquitetura e estilização de código já existente no projeto atual. Não faça refatorações cosméticas ou não solicitadas.
* **Logs Enxutos:** Se precisar gerar logs para debugar, crie logs de uma única linha simples e direta.

---
CONFIRME QUE ENTENDEU ESTAS REGRAS RESPONDENDO APENAS: "Modo Econômico Multi-Stack Ativado."


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
# 🔴 OBRIGATORIO: fix permissions + restart container (arquivos novos herdam umask restrito)
ssh ... 'chmod -R 755 /home/ubuntu/gestaocasa/frontend/dist/ && docker restart gestaocasa-frontend'
# Nota: Sempre reiniciar o container para que o Docker remonte a pasta dist (evita 403 Forbidden por inodes stale/antigos)

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
- **Criação/edição direta no SQLite** para collections que o REST API não gerencia: parar container, copiar data.db, modificar com Python/sqlite3, copiar de volta, iniciar container
- **`$app.dao()` NÃO existe** — `$app.Dao()` também não existe em PB v0.39 Goja runtime
- **`$app`** expõe diretamente: `$app.findCollectionByNameOrId()`, `$app.findRecordsByFilter()`, `$app.findRecordById()`, `$app.save()`, `$app.delete()`
- **`new Record(collection)`** funciona para criar records em JS. **Sempre setar ID manual** (`record.set('id', id)`) antes de `$app.save(record)` — senão erro `GoError: empty primary key is not allowed`
- **`record.markAsNotNew()`** existe e permite `$app.delete()` em records criados via `new Record()` em vez de carregados do DB
- **Coleções criadas via SQL direto** (`INSERT INTO _collections`) têm CRUD REST quebrado (`data: {}`). **Workaround:** hooks customizados que usam `$app.save()` / `$app.delete()` com `new Record(collection)`
- **`id` não é lido pelo ORM** em coleções SQL — adicionar `id` como campo `text` no array `fields` da `_collections` resolve (Python com sqlite3 direto). Ex: `{'name': 'id', 'type': 'text', 'required': True, 'options': {}, 'system': True, 'pk': True}`
- **Campos armazenados como JSON** na coluna `fields` da tabela `_collections` (não existe tabela `_fields` separada)
- **`new Field()` + `importCollectionsByMarshaledJSON()`** rejeitam `_pb_users_auth_` como collectionId para campos relation. Workaround: Python script com sqlite3 direto
- **`crypto.randomUUID()`** não disponível em cron context — usar fallback Math.random
- **`c.requestInfo()`** existe em minúsculo (não `c.Request()`) no PocketBase v0.39 Goja runtime
- **`$http.send().body`** retorna array de bytes (não string) — converter com `String.fromCharCode`
- Para alterar schema: parar container, copiar data.db, rodar Python, copiar de volta, iniciar container

## Collections API Fields

### transactions
- description, category (text — mudado de relation pra bypassar bug PB v0.39), store, purchase_date, total_amount, payment_type (cash|installment)
- installment_count, installment_number, installment_value, due_date, paid, paid_at, paid_by
- group_id, notes, receipt (file), currency (required=true), original_amount, created_by (relation → _pb_users_auth_), shared_with (relation[]), group (relation → 803c7281-...)
- tags (json), payment_method (text), card_id (text)
- **listRule:** `@request.auth.id != '' && (created_by = @request.auth.id || shared_with ?= @request.auth.id || (group != '' && group.members ?= @request.auth.id))`

### groups
- name, description, members (relation[]), created_by (relation)

### recurring_transactions
- description, category, store, total_amount, currency, payment_type, installment_count, installment_value
- frequency (monthly|yearly), day_of_month, month, active, next_due, notes, owner

### goals
- name, target_amount, current_amount, deadline, color, icon, owner, goal_type (goal|investment), initial_amount

### push_subscriptions
- user (relation), subscription (json), enabled

### cards
- name, type (credit|debit), due_day, owner (text — relation quebra REST)

### stores
- name, owner (relation)

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
- **NFC-e QR Code:** Botão "NFCe" no TransactionForm. Escaneia QR code do cupom fiscal SAT/SP, extrai a URL bruta do QR e envia pro hook `nfce_consulta.pb.js`. O hook faz fetch direto na SEFAZ SP (`ConsultaQRCode.aspx?p=...|3|1`), parseia o HTML do DANFE (txtTopo, totalNumb, txtTit) e retorna loja, data, valor total e itens da nota. Usa `c.requestInfo().query.url` (GET), converte body byte array pra string com `String.fromCharCode`. Fallback: constroi URL via base64url da accessKey.
- **Bottom nav mobile com scroll horizontal:** Todos os 8 itens de navegação visíveis no celular sem sobreposição, com scroll horizontal e barra de rolagem oculta.
- **Tags/labels nas transações:** 11 tags predefinidas (essencial, moradia, alimentação, etc) com cores. Seletor no TransactionForm, badges no TransactionCard, filtro na página Transactions. Schema: campo `tags` (JSON) na collection transactions via SQLite direto.
- **Economia sugerida no Dashboard:** Card que analisa as 3 maiores categorias de gasto do mês e sugere 10% de redução, mostrando o valor economizado.
- **Escaneamento de contas/cupons via IA (resiliente):** Parse resiliente via `normalizeScannedJSON` + `parseAmount` + `normalizeDateStr`. Aceita chaves PT/EN, converte DD/MM/YYYY. Imagem enviada em 2600px/0.95q. max_tokens=600. **DEBUG ATIVO:** campo notes mostra rawResponse da IA. Prompt reescrito com exemplo concreto de saída e estrutura ENTRADA → SAIDA → REGRAS para forçar o modelo a ler SOMENTE o último valor (TOTAL GERAL) ignorando itens individuais. `cleanJSONResponse()` substituiu regex guloso por indexOf/lastIndexOf. Nova `scanReceiptWithAI()` para leitura detalhada de itens de varejo. Pendente: remover debug do notes após confirmar fix. `ai.ts` — `scanBillWithAI`, `scanReceiptWithAI`, `parseAmount`, `normalizeScannedJSON`, `normalizeDateStr`, `cleanJSONResponse`.
- **Métodos de Pagamento + Cartões + Estabelecimentos:** Seleção de forma de pagamento (Dinheiro, Pix, Crédito, Débito) nas transações, suporte para cadastrar cartões (sem dados confidenciais, apenas nome e dia do vencimento) associados às despesas e auto-salvamento automático de estabelecimentos na coleção de lojas.
- **Persistência de Modelos de IA e Ajustes Mobile:** Correção na lista de modelos de IA para garantir a presença do modelo atual e padrão do provedor mesmo que não retornados pela API (evitando sumir após reload). Botão de busca de modelos unificado e 100% responsivo para mobile (ocultando texto extenso em telas pequenas e deixando apenas o ícone). Formulário de cadastro de cartões com vencimento condicional ao tipo "Crédito" e labels explícitos de dia de vencimento.
- **NFC-e QR Code:** Botão "NFCe" no TransactionForm. Escaneia QR code do cupom fiscal SAT/SP, extrai a URL bruta do QR e envia pro hook `nfce_consulta.pb.js`. O hook faz fetch direto na SEFAZ SP (`ConsultaQRCode.aspx?p=...|3|1`), converte body (array de bytes) pra string com `String.fromCharCode`, parseia o HTML do DANFE (txtTopo → loja, Emissão → data, totalNumb txtMax → valor total, txtTit → itens) e retorna loja, data, valor total e itens da nota. Usa `c.requestInfo().query.url` (GET). Fallback: constroi URL via base64url da accessKey. Parser em `nfce.ts` — `parseNFCeQRCode()`, `lookupCNPJ()`. Descoberta importante: `c.requestInfo()` existe em minúsculo (não `c.Request()`) no PocketBase v0.39. `$http.send().body` retorna array de bytes, não string.
- **Correção vencimento cartão:** `due_day` mudou de `number` pra `string` no estado do formulário, permitindo limpar o campo e digitar novo valor. Antes `parseInt('') || 1` impedia o usuário de apagar o "1" padrão. Conversão pra número ocorre apenas ao salvar.
- **Cards CRUD via hooks:** REST API retorna `data: {}` para coleções criadas via SQL direto. Solução: hooks `cards_create.pb.js` com `POST /api/cards/create` (usa `new Record()` + `$app.save()` com ID manual) e `POST /api/cards/delete` (usa `new Record()` + `markAsNotNew()` + `$app.delete()`). Frontend em `useCards.ts` chama hooks via `window.fetch` em vez do SDK. Confirmação com `confirm()` antes de excluir.
- **Cards list via hook:** REST API não retorna `id` para coleções SQL. Solução hook `GET /api/cards/list` com `$app.findRecordsByFilter()` + `r.getId()` (funciona após adicionar `id` no array `fields` do `_collections`).
- **FIX category relation bug:** PocketBase v0.39 valida relations internamente com `dao.FindRecordById(collection.Id, recordId)` durante save, mas falha para coleções criadas via SQL direto (erro `validation_missing_rel_records`). Solução: mudar campo `category` de `relation` para `text`.
- **FIX Dashboard missing currency/created_by:** `Dashboard.tsx handleCreate` não enviava `currency` (campo required=true → `validation_required`) nem `created_by` (listRule filtra por `created_by = @request.auth.id` → transação invisível no UI). Solução: adicionar `created_by` no `useTransactions.ts create()` como fallback automático.
- **FIX empty relation collectionId:** Ao criar collections via SQL, campos `relation` ficam com `collectionId: ''`. Corrigir via Python no data.db setando `_pb_users_auth_` para users, ou UUID real para groups.
- **FIX empty select values:** Campos `select` (payment_type, currency) ficam com `values: []` em coleções SQL. Corrigir via Python no data.db.
- **Raw fetch bypass:** `useTransactions.ts pbCreate()` usa `window.fetch()` em vez de `pb.collection('transactions').create()` porque o SDK do PocketBase faz auto-detecção de tipo (multipart vs JSON) conflitante com o campo `receipt`.
- **Nginx DNS `pocketbase` funciona** no Docker (172.20.0.2). `nslookup` falha no container por ser BusyBox.

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

## Session Log 2026-06-05
- **Bug raíz:** Transações criadas do Dashboard nunca apareciam na lista. Causa: listRule `created_by = @request.auth.id` com `created_by` vazio (Dashboard não enviava o campo).
- **Fix 1:** `category` mudado de `relation` pra `text` — PB v0.39 falha validação de relations em coleções SQL durante save (`validation_missing_rel_records`).
- **Fix 2:** Todas relations com `collectionId` vazio populadas via script Python (`_pb_users_auth_`).
- **Fix 3:** Select fields (payment_type, currency) com values vazios populados via script Python.
- **Fix 4:** `useTransactions.ts create()` agora injeta `created_by` automaticamente se caller não enviar.
- **Fix 5:** 5 transações órfãs com `created_by=''` corrigidas no SQLite direto.
- **Deploy:** Build + scp + chmod + docker restart. Hard refresh necessário.
