# INSTRUCOES_AMANHA.md

## ✅ Projeto completo – todos os 30 itens

### Completos
1. Backup automático (cron, 14d retention, `scripts/backup.sh`)
2. OCR + upload comprovantes (compressImage, scanBillWithAI, receit field)
3. Transações recorrentes (cron hook + UI gerenciamento)
4. Push notifications (VAPID, SW, cron, toggle Settings)
5. Export CSV/PDF (CSV + jsPDF com autoTable)
6. Dashboard avançado (cards resumo, line, donut, budgets, goals)
7. UX/UI (toasts, skeletons, search, filters, autocomplete)
8. Metas financeiras (CRUD, progress bars, goal_type investimento)
9. Multi-moeda (currency field, formatCurrency)
10. Compartilhamento (shared_with, ShareModal, list rules)
11. Segurança (fail2ban, UFW, healthcheck, CI/CD, rate limiting Nginx)
12. Testes (24 unit + component tests)
13. Error handling (console.error + toast em todos .catch)
14. Tema claro/escuro (useTheme, localStorage, .light CSS class)
15. Autocomplete lojas (TransactionForm, histórico)
16. Responsividade mobile (headers flex-col, grids colapsam, hover sempre visível)
17. Editar recorrências (preserva active/next_due condicional)
18. Galeria de comprovantes (/receipts, grid month filter, modal)
19. Suporte offline (StaleWhileRevalidate API cache, OfflineBanner)
20. Rate limiting (Nginx 10r/s API, 3r/m login, fail2ban nginx-limit-req)
21. Notificações e-mail (nodemailer, cron 08:05, config template)
22. Auto-categorização AI onBlur (debounce 400ms)
23. PWA install prompt (beforeinstallprompt)
24. Onboarding tutorial (6 steps, localStorage)
25. Comparativo mensal (tabela categoria vs mês anterior)
26. Bulk edit (checkboxes, selecionar todos, pagar/pendente/categoria/excluir)
27. Metas investimento (goal_type, appreciation %, initial_amount)
28. Relatórios anuais (/reports, bar/line charts, top categorias, export)
29. 11 provedores AI (OpenAI, Anthropic, OpenRouter, Groq, DeepSeek, Together, Perplexity, NVIDIA, Mistral, Google Gemini, Ollama + Custom)

### Pendente
30. **Contas familiares** (orçamento compartilhado real com múltiplos usuários)

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
npm run test:watch
```

### Fazer novo deploy com Git
```bash
git add .
git commit -m "descrição"
git push
```

### Backup manual
```bash
ssh -i "C:\Users\welld\Downloads\ssh-key-2026-05-26 (1).key" ubuntu@137.131.187.156 'bash /home/ubuntu/gestaocasa/scripts/backup.sh'
```

## Comandos úteis no servidor
```bash
# Logs push
tail -f /home/ubuntu/gestaocasa/scripts/push.log

# Healthcheck manual
bash /home/ubuntu/gestaocasa/scripts/healthcheck.sh

# Ver timers ativos
systemctl list-timers | grep gestaocasa

# CRONs ativos
crontab -l
```
