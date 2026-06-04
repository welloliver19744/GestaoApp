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
### 10. Compartilhamento de contas (em andamento)
- **Backend:** campos `shared_with` (many‑to‑many com users) e `created_by` na coleção `transactions`.
- **Regra de listagem:** `@request.auth.id != "" && (created_by = @request.auth.id || shared_with ?= @request.auth.id)`.
- **Frontend:** tipos atualizados, componente `ShareModal` que lista usuários (via `fetchUsers`), botão de compartilhamento nos cards, badge indicando que está compartilhada, payload inclui `created_by`.
- **Back‑fill:** script para popular `created_by` nos registros existentes.
- **Teste manual:** verificado que o usuário A cria, compartilha com B, B vê; usuários não compartilhados não veem.
### 11. Segurança e Infraestrutura (pronto, só aplicar)
- `scripts/fail2ban.conf` – protecção SSH (5 tentativas, ban 1 h).
- `scripts/setup_ufw.sh` – regras UFW (SSH, 80/443, 8091). 
- `scripts/healthcheck.sh` – verifica `/api/health` do PocketBase.
- `.github/workflows/ci.yml` – CI/CD no GitHub Actions (checkout, npm ci, lint, build, testes, TruffleHog). 
- Guia de aplicação (`SECURITY_SETUP_GUIDE.md`).
### 12. Testes (pendente)
- Ainda não há testes automatizados; próximo passo será criar testes unitários/componente com Vitest e integrá‑los ao CI.

## Próximos passos recomendados
1. **Aplicar segurança no servidor** (fail2ban, UFW, health‑check).
2. **Validar CI/CD** – fazer push para `main` e confirmar a execução no GitHub Actions.
3. **Implementar testes** (Vitest) para as áreas críticas (ShareModal, utils, compressImage).
4. **Revisar fluxo de compartilhamento** com duas contas reais e garantir que as regras de listagem continuam corretas.

---

Qualquer dúvida ou ajuste, é só avisar!