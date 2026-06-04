# INSTRUCOES_AMANHA.md

## ✅ Projeto completo – tudo já foi aplicado

### Segurança e Infraestrutura (Item 11) – já aplicado no servidor
- ✅ Fail2Ban instalado e ativo (`/etc/fail2ban/jail.local`)
- ✅ UFW configurado (portas 22, 80, 443, 3001, 8091)
- ✅ Health‑check agendado (systemd timer, 5 em 5 min)
- ✅ CI/CD pronto (`.github/workflows/ci.yml`)

### Testes (Item 12) – 24 testes implementados e passando
- `tests/utils.test.ts` – 12 testes
- `tests/export.test.ts` – 2 testes
- `tests/toast.test.tsx` – 3 testes
- `tests/share-modal.test.tsx` – 7 testes

### Correções aplicadas
- **PocketBase URL:** `client.ts` usa `window.location.origin` (Nginx proxy `/api/` → PocketBase)
- **vite.config.ts:** ajustado para `vitest/config`
- **Permissões do `dist/`:** corrigidas no servidor (755/644)
- **Imports:** `pb` adicionado em `Transactions.tsx`, `Button` removido de `TransactionCard.tsx`

## Como dar manutenção

### Rebuild e deploy do frontend
```bash
cd frontend
npm run build                          # compila
scp -r dist/* servidor:/home/ubuntu/gestaocasa/frontend/dist/   # copia
ssh servidor "find /home/ubuntu/gestaocasa/frontend/dist -type d -exec chmod 755 {} \; -o -type f -exec chmod 644 {} \;"  # permissões
```

### Rodar testes
```bash
cd frontend
npm test                               # modo run único
npm run test:watch                     # modo watch
```

### Fazer novo deploy com Git
```bash
git add .
git commit -m "descrição"
git push
```

## Próximas evoluções (ordem sugerida)
1. **Tratamento de erros** – substituir `.catch(() => {})` por toasts de erro
2. **Modo claro/escuro** – toggle no Settings
3. **Autocomplete no formulário** – sugerir estabelecimentos no TransactionForm
4. **Responsividade mobile** – ajustar telas para dispositivos menores
5. **Suporte offline** – cache via Service Worker + IndexedDB
6. **Editar recorrências** – UI para gerenciar transações recorrentes
7. **Galeria de comprovantes** – página dedicada para ver recibos
8. **Rate limiting** – proteger API contra abuso
9. **Notificações por e-mail** – lembretes por e-mail
