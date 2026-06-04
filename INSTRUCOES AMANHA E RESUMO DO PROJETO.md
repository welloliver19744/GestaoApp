# INSTRUCOES AMANHA E RESUMO DO PROJETO

## Resumo geral do que já foi implementado (30 itens)

### 1. Backup automático ✅
- `scripts/backup.sh` – backup diário do SQLite, zero-downtime, 14 dias de retenção

### 2. OCR + Upload de comprovantes ✅
- Função `compressImage` + `scanBillWithAI` (IA lê contas por foto)
- Campo `receipt` do tipo file na collection transactions
- Preview em modal, galeria em `/receipts` com filtro mensal

### 3. Transações recorrentes ✅
- Collection `recurring_transactions`, cron hook gera transações automáticas
- UI de gerenciamento: criar, editar (preserva active/next_due), ativar/desativar, excluir

### 4. Push Notifications ✅
- VAPID keys, Service Worker, toggle no Settings
- Script `send-push.js`, cron diário 08:00

### 5. Exportação de dados ✅
- CSV + PDF (jsPDF + autoTable)
- Botões na página de transações e relatórios

### 6. Dashboard avançado ✅
- Cards de resumo, gráfico linha 6 meses, rosca categorias, orçamento, metas
- Comparativo mensal (categoria vs mês anterior)
- IA Insights (requer API key)

### 7. UX/UI ✅
- Toasts, skeletons, busca, filtros, autocomplete lojas
- Onboarding tutorial (6 passos), PWA install prompt
- Tema claro/escuro, responsividade mobile

### 8. Metas financeiras ✅
- Collection `goals`, CRUD completo
- Dois tipos: goal (progresso) e investment (valorização %)
- Dashboard mostra top 3 com barra de progresso

### 9. Multi-moeda ✅
- Campos `currency` e `original_amount` (BRL, USD, EUR, GBP, ARS, CLP)
- `formatCurrency()` com seletor no formulário

### 10. Compartilhamento de contas ✅
- `shared_with` (many-to-many) + `created_by`
- ShareModal com lista de usuários, badge "Compartilhado"
- 7 testes automatizados

### 11. Segurança e Infraestrutura ✅
- Fail2Ban (sshd + nginx-limit-req), UFW (22, 80, 443, 3001, 8091)
- Healthcheck (systemd timer 5min), CI/CD GitHub Actions
- Rate limiting Nginx (10r/s API, 3r/m login)

### 12. Testes automatizados (24) ✅
- `utils.test.ts` (12), `export.test.ts` (2), `toast.test.tsx` (3), `share-modal.test.tsx` (7)
- CI integrado: `npm test --if-present`

### 13. Error handling ✅
- `.catch()` com console.error + toast em todos os lugares

### 14. Tema claro/escuro ✅
- useTheme hook, localStorage `gestaocasa-theme`, classe `.light` no HTML

### 15. Autocomplete lojas ✅
- Sugestões no TransactionForm baseadas em transações anteriores

### 16. Responsividade mobile ✅
- Headers empilham (flex-col), grids colapsam (1 coluna mobile)
- Hover sempre visível em mobile (md:opacity-0 md:group-hover)

### 17. Editar recorrências ✅
- active preservado, next_due só recalcula se dia/frequência/mês mudar

### 18. Galeria de comprovantes ✅
- `/receipts` grid 2/3/4 colunas, modal com imagem ampliada
- Filtro por mês com navegação

### 19. Suporte offline ✅
- StaleWhileRevalidate para GET /api/* (cache 7 dias)
- NetworkOnly para mutations
- OfflineBanner com status da conexão

### 20. Rate limiting ✅
- Nginx: 10r/s API (burst 20), 3r/m login (burst 2)
- fail2ban nginx-limit-req (3 excessos em 10min → 1h ban)

### 21. Notificações por e-mail ✅
- `send-email-notifications.js` (nodemailer)
- SMTP config em `scripts/email-config.json`
- Cron diário 08:05

### 22. Auto-categorização IA ✅
- onBlur no campo descrição, debounce 400ms, só se ainda não tem categoria

### 23. PWA install prompt ✅
- beforeinstallprompt listener, banner "Instalar App"

### 24. Onboarding ✅
- 6 passos: bem-vindo, transações, metas, recorrências, relatórios, IA
- localStorage `gestaocasa-onboarding-done`

### 25. Comparativo mensal ✅
- Tabela no Dashboard: categoria vs mês anterior com % diferença

### 26. Bulk edit ✅
- Checkboxes, selecionar todos, toolbar: pagar/pendente/categoria/excluir

### 27. Metas investimento ✅
- `goal_type` (goal|investment), `initial_amount`, appreciation %

### 28. Relatórios anuais ✅
- `/reports`: year selector, bar chart + line chart, top 10 categorias
- CSV/PDF export, summary cards

### 29. 11 provedores AI ✅
- OpenAI, Anthropic, OpenRouter, Groq, DeepSeek, Together, Perplexity, NVIDIA, Mistral, Google Gemini, Ollama + Custom
- Endpoint e modelo auto-preenchidos ao selecionar

### 30. Contas familiares ❌ (pendente)
- Orçamento compartilhado real com grupos, permissões, saldo entre usuários

---

## Como dar manutenção

### Rebuild e deploy do frontend
```bash
cd frontend
npm run build
scp -r dist/* ubuntu@137.131.187.156:/home/ubuntu/gestaocasa/frontend/dist/
ssh ubuntu@137.131.187.156 "docker exec gestaocasa-frontend nginx -s reload"
```

### Rodar testes
```bash
cd frontend
npm test
```

### Backup manual
```bash
ssh -i "C:\Users\welld\Downloads\ssh-key-2026-05-26 (1).key" ubuntu@137.131.187.156 'bash /home/ubuntu/gestaocasa/scripts/backup.sh'
```

### Atualizar via Git
```bash
git add .
git commit -m "descrição"
git push
```
