# INSTRUCOES AMANHA E RESUMO DO PROJETO

## Resumo geral do que já foi implementado

### 1. Backup automático
- **scripts/backup.sh** – script Bash que cria backup diário do banco SQLite, mantém 7 cópias, usa `rsync` para cópia zero‑downtime.

### 2. Otimizações de imagem
- Função **compressImage** em `frontend/src/lib/utils.ts` que redimensiona e comprime fotos antes do upload para o PocketBase.

### 2.2 Upload de comprovantes
- Campo de upload de recibo na tela de cadastro de transação, preview em modal e armazenamento no PocketBase.

### 3. Transações recorrentes
- Nova coleção **recurring_transactions** no PocketBase, cron hook que gera transações mensais, página UI para gerenciamento.

### 4. Push Notifications
- Geração de VAPID keys, service worker, toggle nas configurações, script `scripts/send_push.sh`, cron job para enviar notificações de lembrete.

### 5. Exportação de dados
- Botões CSV e PDF nas páginas de relatório, utilitários de exportação `exportCsv.ts` e `exportPdf.ts`.

### 6. Dashboard avançado
- Cards de resumo, gráficos de linhas e donuts, barra de orçamento, cards de metas.

### 7. UX/UI Improvements
- Toasts de sucesso/erro, skeleton loaders, busca e filtros avançados, autocomplete de categorias.

### 8. Metas financeiras
- Coleção **goals**, CRUD UI, barra de progresso nos cards, visualização no dashboard.

### 9. Multi‑moeda
- Campos `currency` e `original_amount` nas transações, utilitário `formatCurrency(value, currency?)`, seletor de moeda no formulário, exibição correta em cards e relatórios.

### 10. **Compartilhamento de Contas** (concluído)
- **Banco:** campos `shared_with` (relation many‑to‑many com users) e `created_by` adicionados na coleção `transactions`.
- **Regra de listagem:** `@request.auth.id != "" && (created_by = @request.auth.id || shared_with ?= @request.auth.id)`.
- **Frontend:** tipos atualizados (`Transaction`, `TransactionCreate`), componente **ShareModal** com lista de usuários, botão de compartilhamento e badge nos cards, payload de criação inclui `created_by`.
- **Testes:** 7 testes automatizados no `share-modal.test.tsx`.

### 11. Segurança e Infraestrutura *(aplicado no servidor)*
- **Fail2Ban:** instalado e ativo (`/etc/fail2ban/jail.local`, 5 tentativas, ban 1 h).
- **UFW:** instalado e ativo (portas 22, 80, 443, 3001, 8091).
- **Health‑check:** script agendado via systemd timer a cada 5 min.
- **CI/CD:** `.github/workflows/ci.yml` configurado.

### 12. Correções aplicadas durante o desenvolvimento
- **403 Forbidden:** permissão do `dist/` corrigida para 755 no servidor.
- **Build errors:** imports corrigidos (`pb` ausente em `Transactions.tsx`, `Button` não usado em `TransactionCard.tsx`).
- **PocketBase URL:** `client.ts` alterado para usar `window.location.origin` (antes `http://localhost:8090` não funcionava do navegador). Nginx proxy `/api/` → PocketBase.
- **vite.config.ts:** ajustado para `vitest/config`.

### 13. Testes automatizados (24 testes, todos passando)
- `tests/utils.test.ts` – 12 testes (formatCurrency, formatDate, cn)
- `tests/export.test.ts` – 2 testes (exportCSV)
- `tests/toast.test.tsx` – 3 testes (ToastProvider)
- `tests/share-modal.test.tsx` – 7 testes (ShareModal)
- CI integrado com `npm test --if-present` no GitHub Actions

---

## ✅ Projeto completo – próximos passos

O projeto está finalizado. Para manutenção futura:

### Rebuild e deploy
```bash
cd frontend
npm run build
scp -r dist/* servidor:/home/ubuntu/gestaocasa/frontend/dist/
ssh servidor "find /home/ubuntu/gestaocasa/frontend/dist -type d -exec chmod 755 {} \; -o -type f -exec chmod 644 {} \;"
```

### Rodar testes
```bash
cd frontend
npm test          # modo run
npm run test:watch # modo watch
```

### Atualizar via Git
```bash
git add .
git commit -m "descrição"
git push
```

---

Qualquer dúvida sobre algum passo, basta chamar. Boa continuação!