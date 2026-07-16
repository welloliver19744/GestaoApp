# Gestão Casa — Documento do Projeto para Agentes de IA

Este documento é a fonte única da verdade sobre o projeto Gestão Casa. Consulte-o antes de qualquer modificação significativa.

---

## 1. Project Overview

**Gestão Casa** é um Progressive Web App (PWA) de controle financeiro doméstico. Permite que usuários registrem despesas, acompanhem contas a pagar/pagas, visualizem dashboards, estabeleçam metas financeiras, compartilhem contas com familiares e recebam notificações de lembretes.

- **Público:** Indivíduos e famílias que querem organizar finanças pessoais
- **Estado:** Funcionalmente completo, com manutenção contínua
- **Repositório:** `https://github.com/welloliver19744/GestaoApp.git` (branch `master`)

---

## 2. Tech Stack

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| **Frontend** | React + Vite + TypeScript | React 19 |
| **Estilização** | Tailwind CSS | v4 |
| **Gráficos** | Recharts | — |
| **Ícones** | Lucide Icons | — |
| **Backend** | PocketBase (SQLite embutido) | v0.39 |
| **PWA** | vite-plugin-pwa (injectManifest) + Workbox | — |
| **Infra** | Docker (Nginx + PocketBase) | — |
| **Proxy API** | Kong (Supabase Kong) | — |
| **Servidor** | Ubuntu, UFW, fail2ban, systemd, cron | — |
| **CI/CD** | GitHub Actions | — |

### Dependências Críticas do Frontend
- `date-fns` — manipulação de datas (parseISO, format, formatDistanceToNow)
- `recharts` — gráficos (LineChart, PieChart, BarChart, AreaChart)
- `lucide-react` — ícones
- `jspdf` + `jspdf-autotable` — exportação PDF
- `workbox-core`, `workbox-routing`, `workbox-strategies` — service worker caching

---

## 3. Architecture

### Diagrama de Rede (Produção — Servidor)
```
Browser → Nginx (porta 3001) → /api/ → PocketBase (8090)
```

### Diagrama de Rede (Vercel + Cloudflare)
```
Browser (HTTPS) → Vercel (gestao-app-three.vercel.app)
                → Cloudflare (api-gestao.housecloud.tec.br)
                → PocketBase (137.131.187.156:8091)
```

### Portas do Servidor
| Porta | Serviço | Acesso |
|-------|---------|--------|
| 3001 | Nginx (frontend React) | http://137.131.187.156:3001 |
| 8091 | PocketBase API + Admin | http://137.131.187.156:8091, https://api-gestao.housecloud.tec.br |
| 8090 | Kong (NÃO usado pelo Gestão Casa) | — |

### Containers Docker
- **gestaocasa-frontend** — Nginx servindo o build React (porta 3001 → 80)
- **gestaocasa-pocketbase** — PocketBase (porta 8091 → 8090)

### Fluxo de Dados
1. Usuário acessa `http://137.131.187.156:3001` (ou domínio `contas.housecloud.tec.br`)
2. Nginx serve os arquivos estáticos do `dist/`
3. Requisições `/api/*` são proxy-pass para o Kong (porta 8090)
4. Kong roteia para PocketBase (porta 8091)
5. PocketBase lê/escreve em SQLite (`/pb_data/data.db`)
6. Service Worker (Workbox) faz cache StaleWhileRevalidate para GETs

### Servidor
- **Host:** 137.131.187.156
- **Usuário SSH:** ubuntu
- **Chave SSH:** `C:\Users\welld\Downloads\ssh-key-2026-05-26 (1).key`
- **Diretório do projeto:** `/home/ubuntu/gestaocasa`

---

## 4. Features Implementadas

### 4.1 Core

#### Transações (CRUD)
- Coleção `transactions` no PocketBase
- Criação com descrição, categoria (text), estabelecimento, data, valor, moeda
- Pagamento à vista ou parcelado (com número de parcelas)
- Anexo de comprovante (imagem)
- Tags/labels (11 predefinidas: essencial, moradia, alimentação, etc.) — campo JSON
- Métodos de pagamento: Dinheiro, Pix, Crédito, Débito
- Cartões associados (collection `cards`: nome, tipo crédito/débito, dia vencimento)
- Auto-salvamento de estabelecimentos (collection `stores`)
- Marcar como pago/pendente (toggle no círculo)
- Editar / Excluir (single e em grupo)
- Compartilhar transação com outros usuários (ShareModal)
- Busca textual, filtros por categoria/tags/status/mês

#### Dashboard
- Cards de resumo: A Pagar, Pago no Mês, Saldo Projetado, vs Mês Anterior
- Gráfico de evolução mensal (linha, 6 meses: total vs pago)
- Gráfico de rosca (gastos por categoria no mês)
- Orçamento por categoria (barras de progresso)
- Lista de próximos vencimentos (agrupados por compra)
- Metas financeiras (top 3 com progresso)
- Comparativo mensal (tabela: categoria vs mês anterior, % diferença)
- Economia sugerida (análise das 3 maiores categorias, sugere 10% de redução)
- IA Insights (botão "Gerar" — resumo inteligente, previsão, alertas)
- Navegação por mês (< >, seletor, botão "Hoje")

#### Multi-moeda
- BRL, USD, EUR, GBP, ARS, CLP
- Campo `currency` (required) e `original_amount`
- `formatCurrency(value, currency?)` — formata com símbolo correto

#### Bulk Edit
- Checkboxes + "Selecionar todos"
- Ações em massa: pagar, pendente, alterar categoria, excluir

#### Relatórios Anuais
- Página `/reports` com seletor de ano
- Gráficos: barras (gastos mensais) + linha (tendência)
- Top 10 categorias com percentual
- Exportação CSV e PDF

#### Contas Familiares (Grupos)
- Coleção `groups`: name, description, members (relation[]), created_by
- CRUD de grupos, gerenciamento de membros
- GroupSelector no Dashboard e Transactions
- Filtro por grupo via URL param
- ShareModal integrado (filtra membros do grupo ativo)

### 4.2 IA & Automação

#### Escaneamento de Contas com IA (OCR)
- `scanBillWithAI()` em `ai.ts` — lê conta/foto e extrai valor, data, estabelecimento, categoria
- Formato de imagem: base64 (compatível com Anthropic, OpenAI, Gemini)
- Parsing resiliente: `normalizeScannedJSON()` + `parseAmount()` + `normalizeDateStr()`
- Aceita chaves PT/EN e formato `R$ 1.234,56`
- Provedores com visão: OpenAI (`gpt-4o-mini`), Anthropic (`claude-3-haiku`), Gemini (`gemini-1.5-flash`), OpenRouter (modelos vision)
- ⚠️ Groq descontinuou suporte a visão — não funciona para scan

#### Auto-categorização IA
- OnBlur no campo descrição com debounce de 400ms
- Só sugere se ainda não há categoria selecionada

#### Provedores de IA (12)
OpenAI, Anthropic, OpenRouter, Groq, DeepSeek, Together, Perplexity, NVIDIA NIM, Mistral, Google Gemini, Ollama, Custom
- Endpoint e modelo auto-preenchidos ao selecionar
- Botão "Buscar modelos" — fetch da lista de modelos da API
- Persistência: modelo atual e padrão sempre aparecem no select mesmo se não retornados pela API

#### Transações Recorrentes
- Coleção `recurring_transactions`
- Frequência: mensal ou anual, dia do mês
- Hook PocketBase gera transações automaticamente
- UI: criar, editar (preserva active/next_due), ativar/desativar, excluir

#### Scanner de Código de Barras
- Botão "Código" no TransactionForm
- Usa `BarcodeDetector` API (Chrome/Edge Android, desktop)
- Busca produto na Open Food Facts (gratuito, sem chave)
- Não funciona no iPhone Safari

#### NFC-e QR Code
- Escaneia QR code do cupom fiscal SAT/SP
- Envia pro hook `nfce_consulta.pb.js` que consulta SEFAZ SP
- Retorna: loja, data, valor total e itens da nota

### 4.3 Notificações

#### Push Notifications
- VAPID keys, Service Worker (evento `push`)
- Toggle no Settings
- Lembretes: contas vencendo amanhã, contas vencidas não pagas
- Push reativo: ao compartilhar transação
- Cron: 08:00 e 18:00
- Script: `scripts/send-push.js`

#### E-mail
- Nodemailer, config SMTP em `scripts/email-config.json`
- Template: `email-config.example.json`
- Lembretes de contas a vencer e vencidas
- Cron: 08:05
- Script: `scripts/send-email-notifications.js`

#### Discord
- Webhook, config em `scripts/discord-config.json`
- Botão "Testar" no Settings
- Cron: 08:08
- Script: `scripts/send-discord.js`

### 4.4 UX

#### Temas
- Dark mode (padrão) + tema claro (classe `.light` no HTML)
- `useTheme` hook, localStorage key `gestaocasa-theme`
- Paleta invertida no CSS — sem mudar componentes

#### PWA
- Instalável: `beforeinstallprompt`, banner "Instalar App"
- Service Worker: autoUpdate (sem prompt)
- Cache: StaleWhileRevalidate para GET `/api/*`, NetworkOnly para mutations
- Cache API de até 7 dias
- `swCache.ts` — invalidação manual de cache via mensagem `INVALIDATE_CACHE`

#### Offline
- OfflineBanner (faixa âmbar "Sem conexão")
- Dados em cache disponíveis para leitura offline
- Escrita (criar/editar/excluir) requer conexão

#### Onboarding
- Tutorial de 6 passos na primeira visita
- localStorage key `gestaocasa-onboarding-done`

#### Responsividade Mobile
- Headers empilham (flex-col), grids colapsam (1 coluna)
- Hover sempre visível em mobile (md:opacity-0 md:group-hover)
- Bottom nav com scroll horizontal (8 itens, sem sobreposição)
- Botão "Buscar modelos" compactado (apenas ícone em telas pequenas)

### 4.5 Infra & Segurança

| Item | Detalhe |
|------|---------|
| **Backup** | `scripts/backup.sh`, cron 03:00, 14 dias retenção |
| **Fail2Ban** | 2 jails: sshd (5 tentativas → 1h ban), nginx-limit-req (3 excessos em 10min → 1h ban) |
| **UFW** | Portas liberadas: 22, 80, 443, 3001, 8091 |
| **Healthcheck** | systemd timer a cada 5min, script `scripts/healthcheck.sh` |
| **Rate Limiting** | Nginx: 10r/s API (burst 20), 3r/m login (burst 2) |
| **CI/CD** | GitHub Actions: lint, build, 24 testes, TruffleHog |
| **Cloudflare** | Domínio `contas.housecloud.tec.br` passa por tunnel Cloudflare |

### 4.6 Testes (24)
- `tests/utils.test.ts` (12) — formatCurrency, formatDate, cn
- `tests/export.test.ts` (2) — exportCSV
- `tests/toast.test.tsx` (3) — ToastProvider
- `tests/share-modal.test.tsx` (7) — ShareModal (render, seleção, save, cancel, empty state)
- Framework: Vitest + Testing Library
- CI: `npm test --if-present` no GitHub Actions

---

## 5. PocketBase v0.39 — Coleções, Bugs e Workarounds

### 5.1 Coleções

| Collection | Campos Principais |
|-----------|------------------|
| `transactions` | description, category (text), store, purchase_date, total_amount, payment_type (cash\|installment), installment_count, installment_number, installment_value, due_date, paid, paid_at, paid_by (text), group_id, notes, receipt (file), currency, original_amount, created_by (relation→users), shared_with (relation[]), group (relation→groups), tags (json), payment_method (text), card_id (text) |
| `groups` | name, description, members (relation[]), created_by |
| `recurring_transactions` | description, category, store, total_amount, currency, payment_type, installment_count, installment_value, frequency, day_of_month, month, active, next_due, notes, owner |
| `goals` | name, target_amount, current_amount, deadline, color, icon, owner, goal_type (goal\|investment), initial_amount |
| `push_subscriptions` | user (relation), subscription (json), enabled |
| `cards` | name, type (credit\|debit), due_day, owner (text) |
| `stores` | name, owner (relation) |
| `categories` | name, color, icon, type, budget |

### 5.2 Regras de Listagem (transactions)
```
@request.auth.id != '' && (created_by = @request.auth.id || shared_with ?= @request.auth.id)
```
Filtro por group é feito no frontend (`activeGroup`). ⚠️ Não usar `group.members ?=` no listRule — PocketBreak v0.39 retorna HTTP 400 em TODAS as queries.

### 5.3 Bugs Conhecidos e Workarounds (CRÍTICO)

#### Bug #1: Collections criadas via SQL direto têm REST API quebrado
- **Sintoma:** `data: {}` em toda requisição CRUD via REST
- **Causa:** PocketBase v0.39 não reconhece collections inseridas diretamente no SQLite como "completas"
- **Workaround:** Hooks customizados com `new Record(collection)` + `$app.save()` / `$app.delete()`
- **Collections afetadas:** cards, stores, groups (parcialmente)

#### Bug #2: Campos `relation` em collections SQL falham no save
- **Sintoma:** `validation_missing_rel_records` ao criar/atualizar transações
- **Causa:** PB v0.39 valida relations com `dao.FindRecordById()` que falha para coleções SQL
- **Workaround:** Todo campo `relation` para coleção SQL deve ser `text`
- **Campos já convertidos:** `category` (text), `paid_by` (text), `owner` (text em cards)

#### Bug #3: `$app.dao()` NÃO existe
- `$app.Dao()` também não existe no Goja runtime do PB v0.39
- Use diretamente: `$app.findCollectionByNameOrId()`, `$app.findRecordsByFilter()`, `$app.findRecordById()`, `$app.save()`, `$app.delete()`

#### Bug #4: CollectionId `_pb_users_auth_` é rejeitada
- `new Field()` + `importCollectionsByMarshaledJSON()` rejeitam
- Workaround: Python script com sqlite3 direto no data.db

#### Bug #5: `crypto.randomUUID()` não existe em cron context
- Usar fallback: `Math.random().toString(36).slice(2)` ou `safeUUID()`

#### Bug #6: `c.requestInfo()` (minúsculo) — `c.Request()` não existe
- Válido no PB v0.39 Goja runtime

#### Bug #7: `$http.send().body` retorna array de bytes
- Converter com `String.fromCharCode(...)` — não é string direta

### 5.4 Schema Alterações via SQLite Direto

Sempre que precisar modificar schema que o REST API não gerencia:

```bash
docker stop gestaocasa-pocketbase
docker cp gestaocasa-pocketbase:/pb_data/data.db /tmp/pb_data.db
python3 scripts/fix_pb_schema.py /tmp/pb_data.db
docker cp /tmp/pb_data.db gestaocasa-pocketbase:/pb_data/data.db
docker start gestaocasa-pocketbase
```

**⚠️ Container precisa estar PARADO** antes de modificar o data.db — senão o PB sobrescreve as mudanças em memória.

### 5.5 Padrões para Criação de Records em Hooks

```javascript
// SEMPRE setar ID manual antes de $app.save()
let rec = new Record(collection);
rec.set('id', id); // crypto.randomUUID() ou Math.random fallback
// ... setar campos ...
$app.save(rec);

// Para deletar records criados via new Record():
rec.markAsNotNew();
$app.delete(rec);
```

### 5.6 Hooks Ativos
- `cards_create.pb.js` — `POST /api/cards/create`
- `cards_delete.pb.js` — `POST /api/cards/delete`
- `cards_list.pb.js` — `GET /api/cards/list`
- `groups_crud.pb.js` — CRUD groups
- `stores_crud.pb.js` — CRUD stores
- `nfce_consulta.pb.js` — consulta NFC-e na SEFAZ SP
- `push_endpoint.pb.js` — endpoint de diagnóstico push

### 5.7 Collection `created` e `updated`
Todas as coleções SQL-direct precisam das colunas `created` e `updated` (datetime) + system fields correspondentes no JSON `fields` de `_collections`. Sem isso, `sort: '-created'` retorna HTTP 400.

---

## 6. Deploy & Manutenção

### Workflow Padrão (IMPORTANTE — seguir SEMPRE)

1. **Fazer alterações no código**
2. **Atualizar os docs .md** (AGENTS.md, AUDITORIA.md, etc.) com o que mudou
3. **Commitar tudo** no git
4. **Push para o GitHub** (`git push`)
5. **Deploy no Vercel** (automático via GitHub OU manual via CLI)

> ⚠️ **Regra de ouro:** Nunca fazer só código sem documentar. Os .md são a fonte da verdade para agentes de IA e para o próprio desenvolvedor.

### Deploy Frontend — Vercel (PRODUÇÃO)

O frontend está hospedado na Vercel: **https://gestao-app-three.vercel.app**

#### Automático (preferido)
```bash
git add .
git commit -m "descrição"
git push
# Vercel detecta o push e faz o build automaticamente
```

#### Manual (via CLI)
```bash
cd frontend
npx vercel --prod --yes --scope wellington-s-projects1
```

#### Configurações do Projeto Vercel
- **Projeto:** `gestao-app` (org: `wellington-s-projects1`)
- **Root Directory:** `frontend` (configurado via `vercel.json` na raiz do repo)
- **Framework:** Vite (configurado via `frontend/vercel.json`)
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **URL Produção:** https://gestao-app-three.vercel.app
#### Variáveis de Ambiente do Vercel
- `VITE_POCKETBASE_URL=https://api-gestao.housecloud.tec.br` (Production)
  - Aponta pro PocketBase via Cloudflare tunnel (porta 8091, direto sem Kong)
  - Configurada via: `vercel env add VITE_POCKETBASE_URL production`

#### CORS no PocketBase (obrigatório para Vercel)
O PocketBase precisa aceitar requisições do domínio do Vercel:
1. Admin em http://137.131.187.156:8091/_/ → **Settings** → **Application**
2. Em **CORS (Allowed Origins)** adicionar: `https://gestao-app-three.vercel.app`
3. Salvar

#### Dependências Externas
- **Cloudflare:** Subdomínio `api-gestao.housecloud.tec.br` → `http://137.131.187.156:8091`
  - Tunnel direto pro PocketBase (sem Kong)
  - Fornece HTTPS para o Vercel se conectar sem mixed content
- **Kong (porta 8090):** Não é usado pelo Gestão Casa. É de outro projeto (Supabase).

#### Deploy Autenticado (só CLI)
```bash
npx vercel login
npx vercel link --project gestao-app --yes --scope wellington-s-projects1
npx vercel --prod --yes --scope wellington-s-projects1
```

#### ⚠️ Problema Comum: Git email bloqueando deploy
A Vercel verifica se o email do commit pertence a uma conta GitHub válida.
- **Sintoma:** Deploy fica como `UNKNOWN` ou `Blocked`
- **Causa:** Git email configurado como noreply do GitHub (`144559011+user@users.noreply.github.com`)
- **Solução:**
  ```bash
  git config --global user.email "seu-email@example.com"  # mesmo email da conta Vercel/GitHub
  git commit --amend --author="seu-email@example.com"     # corrigir último commit
  git push --force                                        # re-enviar (cuidado!)
  ```
  Ou apenas fazer um novo commit com o email correto.

### Deploy Frontend — Servidor Docker (alternativo)
```bash
cd frontend
npm run build
scp -r dist/* ubuntu@137.131.187.156:/home/ubuntu/gestaocasa/frontend/dist/
ssh ubuntu@137.131.187.156 "chmod -R o+rX /home/ubuntu/gestaocasa/frontend/dist/ && docker restart gestaocasa-frontend"
```
**⚠️ Sempre reiniciar o container** — arquivos novos herdam umask restrito e inodes stale causam 403 Forbidden.

### Backup Manual
```bash
ssh ubuntu@137.131.187.156 'bash /home/ubuntu/gestaocasa/scripts/backup.sh'
```

### Ver Logs
```bash
ssh ubuntu@137.131.187.156 'tail -f /home/ubuntu/gestaocasa/scripts/push.log'
ssh ubuntu@137.131.187.156 'docker logs gestaocasa-pocketbase --tail 50'
```

### Rodar Testes
```bash
cd frontend
npm test
```

### Reload Nginx
```bash
ssh ubuntu@137.131.187.156 'docker exec gestaocasa-frontend nginx -s reload'
```

### Cron Jobs Ativos
```
0 3 * * * backup.sh                         # Backup diário
0 8 * * * send-push.js                      # Push manhã
0 18 * * * send-push.js                     # Push tarde
5 8 * * * send-email-notifications.js       # Email
8 8 * * * send-discord.js                   # Discord
```

### PWA Cache Stale
Após deploy, pode ser necessário hard refresh + purgar Cloudflare (se usar o domínio `contas.housecloud.tec.br`). O PWA está configurado com `registerType: 'autoUpdate'` — atualiza automaticamente após deploy.

---

## 7. Configurações do App

- **AI:** Settings → Provedor, modelo, API key — salvo no localStorage. Botão "Buscar modelos" popula select.
- **Push:** Settings → Ativar/desativar, requer SW + VAPID keys
- **Email:** `scripts/email-config.json` no servidor (SMTP)
- **Discord:** Settings → URL webhook + botão Testar; cron usa `scripts/discord-config.json`
- **Tema:** localStorage key `gestaocasa-theme`
- **Onboarding:** localStorage key `gestaocasa-onboarding-done`
- **Modo Viagem:** localStorage key `gestaocasa_travel_config` (JSON: active, name, startDate, endDate)

---

## 8. Melhorias Futuras

### Backlog de Ideias
- Gráfico de projeção futura (saldo previsto 6 meses baseado em recorrências)
- Notificações WhatsApp / Telegram
- Importação de CSV (extrato bancário)
- App mobile nativo (Capacitor / Tauri)
- Dashboard customizável (usuário escolhe quais cards exibir)
- Metas compartilhadas (grupo contribui para mesma meta)
- Suporte a mais idiomas (inglês, espanhol)
- Modo escuro automático (follow system)

### Pendências Técnicas
- `scanBillWithAI` — modo debug ativo (campo `notes` mostra `rawResponse` da IA). Remover após confirmar estabilidade.
- Configuração SMTP manual no servidor (`scripts/email-config.json` ainda precisa ser preenchido)

---

## 9. Decisões Técnicas Importantes

- **`window.location.origin`** como PB_URL runtime (Nginx proxy funciona sempre)
- **SQLite direto** quando PocketBase v0.39 migration API falha
- **Relação compartilhada:** `shared_with ?= @request.auth.id` na list rule
- **Tema claro:** classe `.light` no HTML com paleta invertida (sem mudar componentes)
- **SW caching:** StaleWhileRevalidate para GET, NetworkOnly para mutations
- **Rate limit:** Nginx level (não PocketBase) para simplicidade
- **`raw fetch` bypass:** `useTransactions.ts` usa `window.fetch()` em vez de `pb.collection('transactions').create()` porque o SDK detecta tipo conflitante com campo `receipt`
- **`safeUUID()`:** Usar como fallback de `crypto.randomUUID()` em contexto HTTP
- **Agrupar parcelas:** Dashboard + Transactions agrupam por `group_id` (ou `id` para cash). Toggle "Agrupado por compra" / "Parcela a parcela"
- **Ações do card mobile:** Botão `⋮` → `<Modal>` centralizado (`max-w-lg mx-4 max-h-[85vh]`) — dropdown causava overflow
- **Card due_day:** Compra dia 5, cartão vence dia 15 → 1ª parcela dia 15/mês+1. Compra após due_day → pula um mês
- **Débito/à vista sem "Vence":** `TransactionCard` mostra "Pago em {data}" em vez de "Vence {data}"

---

## 10. Auditoria 2026-07-15 — 42 Itens Corrigidos

Auditoria completa do código fonte resultou em 42 correções. Ver `AUDITORIA.md` para o checklist detalhado.

### Resumo por categoria
| Categoria | Itens | Status |
|-----------|-------|--------|
| 🔴 Segurança (endpoints debug, ownership, .gitignore) | 3 | ✅ |
| 🔴 Bugs produção (TransactionCard, parcelas JS Date) | 4 | ✅ |
| 🔴 Perda de dados (migration destrutiva, race conditions) | 3 | ✅ |
| 🟡 Infraestrutura (migrations, scripts, CI/CD) | 6 | ✅ |
| 🟡 Frontend (injection, memory leak, acessibilidade Modal) | 8 | ✅ |
| 🟢 Refatoração (duplicação, loading states, cleanup effects) | 11 | ✅ |
| 📋 Extras (TruffleHog, backlog) | 7 | 1✅ 6⬜ |

### Correções mais importantes
- **5 endpoints debug removidos** (criavam transações sem auth, vazavam schema)
- **Ownership verification adicionada** em DELETE/UPDATE de cards, stores, groups
- **Migration destrutiva `007` desabilitada** — dropava todas as coleções
- **`changeme-push-secret-2026` removido** dos 3 scripts (agora env var obrigatória)
- **Bug JS Date de parcelas corrigido** — `setMonth` com dia 31 não criava data correta
- **Filter injection** em `useGroups.ts` sanitizado com regex
- **Modal.tsx** com focus trap, aria, Escape, scroll lock
- **Código duplicado** de `parseAmount`, `normalizeDateStr`, `formatDateBR` centralizado em `utils.ts`
