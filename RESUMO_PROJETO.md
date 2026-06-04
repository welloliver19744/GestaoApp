# RESUMO_PROJETO.md

## Visão geral
O **Gestão Casa** é um PWA para controle financeiro doméstico que usa:
- **PocketBase** (SQLite) como backend API.
- **React (Vite)** como frontend.
- Docker/Kong/Nginx para entrega.

## Funcionalidades já entregues
### 1. Backup automático
- `scripts/backup.sh` gera backup diário, mantém 7 cópias, usa `rsync` para cópia zero‑downtime.
### 2. Otimização de imagens
- Função `compressImage` em `frontend/src/lib/utils.ts` comprime fotos antes do upload.
### 2.2 Upload de comprovantes
- Campo de upload na criação de transação, preview em modal, armazenamento no PocketBase.
### 3. Transações recorrentes
- Coleção `recurring_transactions`, cron hook que cria transações mensais, UI de gerenciamento.
### 4. Push Notifications
- VAPID keys, Service Worker, toggle nas configurações, script `scripts/send_push.sh`, cron para lembretes.
### 5. Exportação de dados
- Botões CSV e PDF, utilitários `exportCsv.ts` e `exportPdf.ts`.
### 6. Dashboard avançado
- Cards de resumo, gráfico de linha, donut, barra de orçamento, cards de metas.
### 7. UX/UI Improvements
- Toasts, skeleton loaders, busca avançada, autocomplete de categorias.
### 8. Metas financeiras
- Coleção `goals`, CRUD UI, barra de progresso, visualização no dashboard.
### 9. Multi‑moeda
- Campos `currency` e `original_amount`, utilitário `formatCurrency(value, currency?)`, seletor de moeda no formulário, exibição correta.
### 10. Compartilhamento de contas (concluído)
- **Backend:** campos `shared_with` (many‑to‑many com users) e `created_by` na coleção `transactions`.
- **Regra de listagem:** `@request.auth.id != "" && (created_by = @request.auth.id || shared_with ?= @request.auth.id)`.
- **Frontend:** tipos atualizados, componente `ShareModal` (lista usuários, seleção múltipla, PATCH), botão de compartilhamento nos cards, badge "Compartilhado", payload inclui `created_by`.
- **Back‑fill:** script para popular `created_by` nos registros existentes.
- **Teste manual + automatizado:** 7 testes no `share-modal.test.tsx` cobrindo render, seleção, save, cancel, empty state.
### 11. Segurança e Infraestrutura (aplicado no servidor)
- **Fail2Ban:** instalado e ativo, config `/etc/fail2ban/jail.local` (5 tentativas, ban 1 h).
- **UFW:** instalado e ativo, regras: SSH (22), HTTP (80), HTTPS (443), API (8091), Nginx (3001).
- **Health‑check:** script em `/home/ubuntu/gestaocasa/scripts/healthcheck.sh`, agendado via systemd timer a cada 5 min.
- `.github/workflows/ci.yml` – CI/CD no GitHub Actions (checkout, npm ci, lint, build, testes, TruffleHog).
### 12. Correções de deploy e bugs
- **403 Forbidden:** permissão do `dist/` alterada de `700` para `755` no servidor.
- **Build errors:** removido import não utilizado (`Button` em `TransactionCard.tsx`), adicionado import faltante (`pb` em `Transactions.tsx`).
- **PocketBase URL:** alterado `client.ts` para usar `window.location.origin` em produção (antes usava `http://localhost:8090`, que não funcionava do navegador). Nginx proxy `/api/` → PocketBase.
- **vite.config.ts:** ajustado para `vitest/config` (TS não reconhecia `test`).
### 13. Testes automatizados (24 testes, todos passando)
- `tests/utils.test.ts` (12) – `formatCurrency`, `formatDate`, `formatMonthYear`, `cn`
- `tests/export.test.ts` (2) – `exportCSV` gera CSV e cria link de download
- `tests/toast.test.tsx` (3) – `ToastProvider` renderiza, mostra toast e estiliza erro
- `tests/share-modal.test.tsx` (7) – abre/fecha, carrega usuários, seleciona, salva, cancela, empty state
- CI integrado: `npm test --if-present` roda no GitHub Actions

---

## Próximas evoluções previstas

| # | Item | Descrição |
|---|------|-----------|
| 14 | **Tratamento de erros** | Substituir `.catch(() => {})` por feedback visual ao usuário (toast de erro) |
| 15 | **Modo claro/escuro** | Toggle no Settings para alternar entre tema light e dark |
| 16 | **Suporte offline** | Cache de páginas e dados para funcionar sem internet (Service Worker + IndexedDB) |
| 17 | **Responsividade mobile** | Ajustar telas e componentes para dispositivos menores |
| 18 | **Editar recorrências** | UI para editar/excluir transações recorrentes (não só as geradas) |
| 19 | **Galeria de comprovantes** | Página dedicada para ver todos os comprovantes anexados |
| 20 | **Autocomplete no formulário** | Sugerir estabelecimentos enquanto digita no TransactionForm |
| 21 | **Rate limiting na API** | Proteger endpoints contra abuso (PocketBase hooks) |
| 22 | **Notificações por e-mail** | Enviar lembretes por e-mail além do push |
| 23 | **Auto-categorização IA** | Categorização automática ao digitar descrição (onBlur) |
| 24 | **PWA Install Prompt** | Banner de instalação via beforeinstallprompt |
| 25 | **Onboarding** | Tutorial de 6 passos no primeiro acesso |
| 26 | **Comparativo mensal** | Tabela categoria vs mês anterior no Dashboard |
| 27 | **Bulk edit** | Seleção múltipla com ações em massa |
| 28 | **Metas investimento** | goal_type, appreciation %, initial_amount |
| 29 | **Relatórios anuais** | Página /reports com gráficos e exportação |
| 30 | **Contas familiares** | Grupos, GroupSelector, Dashboard/Transactions filtrados, ShareModal integrado, schema SQLite direto |
| | **Extra** | Busca automática de modelos AI (botão "Buscar modelos" no Settings) |
| | **Descobertas** | `$app.dao()` não existe no PB v0.39; campos são JSON em `_collections.fields`; `new Field()` rejeita `_pb_users_auth_`; `crypto.randomUUID()` não disponível em cron |

