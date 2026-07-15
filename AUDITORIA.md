# Auditoria Gestão Casa — Checklist de Correções

> 🚨 **App em produção!** Cada item deve ser implementado com cuidado para não quebrar o app nem perder dados.
> Legenda: `[ ]` = pendente | `[x]` = corrigido | `[~]` = em andamento

---

## 🔴 Crítico — Segurança (fazer primeiro, risco de exploração)

- [x] **1. Remover/desabilitar endpoints debug** (`pocketbase/pb_hooks/`)
  - `debug_create_tx.pb.js` — cria transações sem auth
  - `debug_findcat.pb.js` — vaza IDs internos sem auth
  - `fix_collections.pb.js` — loga schema inteiro a cada 1 minuto
  - `cards_debug.pb.js` — loga body de requests
  - `ping.pb.js` — só noise, remover
  - **Risco:** Baixo (só remover arquivos, não afeta dados)
  - **Como fazer:** Deletar ou comentar os arquivos, reiniciar container

- [x] **2. Adicionar verificação de dono nos endpoints DELETE/UPDATE**
  - `pocketbase/pb_hooks/cards_create.pb.js` — função delete
  - `pocketbase/pb_hooks/stores_crud.pb.js` — função delete
  - `pocketbase/pb_hooks/groups_crud.pb.js` — funções update + delete
  - **Risco:** Médio (mexer em hooks ativos, testar bem)
  - **Como fazer:** Adicionar `if (record.get('owner') !== owner) return c.json(403)` antes do save/delete

- [x] **3. Adicionar `.gitignore` na raiz do projeto**
  - Proteger: `scripts/email-config.json`, `scripts/discord-config.json`, `scripts/vapid-keys.json`
  - **Risco:** Baixo (só git, não afeta runtime)
  - **Como fazer:** Criar `.gitignore` na raiz

---

## 🔴 Crítico — Bug em Produção

- [x] **4. Corrigir `TransactionCard.tsx` — "Pago em" sem verificar `paid`**
  - Arquivo: `frontend/src/components/transactions/TransactionCard.tsx` (linhas 82-86)
  - **Bug:** Transação PIX não paga mostra "Pago em {data}" — engana usuário
  - **Fix:** Só mostrar "Pago em" se `tx.paid === true`
  - **Risco:** Baixo (só muda display, não mexe em dados)

- [x] **5. Corrigir `TransactionCard.tsx` — ternário inútil do `totalAmount`**
  - Arquivo: `TransactionCard.tsx` linha 48
  - **Bug:** `override?.amount ? tx.total_amount : tx.total_amount` — ambos os ramos retornam a mesma coisa, ignora override
  - **Fix:** Trocar para `override?.amount ?? tx.total_amount`
  - **Risco:** Baixo (só display, não mexe em dados)

- [x] **6. Corrigir cálculo de parcelas — bug JS Date (`setMonth`)**
  - Arquivo: `frontend/src/hooks/useTransactions.ts` linhas 128-129
  - **Bug:** Compra 31/jan + 1 mês = 3/mar (fevereiro não tem 31)
  - **Fix:** Usar lógica de `due_date` com dia fixo, similar ao card_due_day
  - **Risco:** Médio (afeta criação de transações parceladas)
  - ⚠️ **Cuidado:** Não pode quebrar parcelas existentes — só afeta parcelas NOVAS

- [x] **7. Corrigir `Math.min(card_due_day, 28)` para respeitar dias do mês**
  - Arquivo: `frontend/src/hooks/useTransactions.ts` linhas 93-98 e 126
  - **Bug:** `due_day = 31` vira 28 até em meses com 30/31 dias
  - **Fix:** Usar `Math.min(card_due_day, diasNoMes(ano, mes))`
  - **Risco:** Médio (afeta criação de parcelas NOVAS, não existentes)

---

## 🔴 Alto — Perda de Dados Potencial

- [x] **8. Corrigir migration `007_recreate_collections.js`**
  - Arquivo: `pocketbase/pb_migrations/007_recreate_collections.js`
  - **Bug:** Dropa e recria TODAS as coleções — destrói dados de usuário se executada
  - **Fix:** Substituir por alter migration não-destrutiva OU documentar risco e remover do diretório ativo
  - **Risco:** 🔴 **Altíssimo se executada** — mas só roda se PocketBase reiniciar com ela presente

- [x] **9. Corrigir `useGoals.ts` — race condition no `updateProgress`**
  - Arquivo: `frontend/src/hooks/useGoals.ts` linhas 45-47
  - **Bug:** Lê `goal.current_amount` de closure stale — duas chamadas rápidas sobrescrevem uma a outra
  - **Fix:** Usar server-side increment ou ler o valor atualizado antes de somar
  - **Risco:** Baixo (dado financeiro pode ser perdido em clique duplo)

- [x] **10. Corrigir `Groups.tsx` — contagem de membros errada**
  - Arquivo: `frontend/src/pages/Groups.tsx` linha 93
  - **Bug:** `(g.members?.length || 0) + 1` conta o criador duas vezes
  - **Risco:** Baixo (só exibição, não afeta dados)

---

## 🟡 Médio — Infraestrutura

- [x] **11. Criar migration para `pending_notifications` collection**
  - Arquivo: `pocketbase/pb_hooks/push_endpoint.pb.js`
  - **Problema:** Collection existe só no admin UI, não em migration — irrecuperável se resetar DB
  - **Como fazer:** Criar migration `008_create_pending_notifications.js`
  - **Risco:** Baixo (nova migration, não altera existentes)

- [x] **12. Corrigir `c.app.collection().create()` em `push_endpoint.pb.js`**
  - Arquivo: `pocketbase/pb_hooks/push_endpoint.pb.js` linha 103
  - **Problema:** API não existe no PB v0.39 — vai crashar se chamado
  - **Fix:** Substituir por `new Record(collection, data)` + `$app.save()`

- [x] **13. Corrigir `vapid-keys.json` ausente**
  - Arquivo: `scripts/send-push.js`
  - **Problema:** Script quebra na hora se arquivo não existe
  - **Fix:** Adicionar tratamento de erro + mensagem amigável + `process.exit(1)`

- [x] **14. Substituir `changeme-push-secret-2026` por fallback seguro**
  - Arquivos: `scripts/send-push.js`, `send-email-notifications.js`, `send-discord.js`
  - **Fix:** Remover fallback hardcoded — exigir `PUSH_SECRET` como envvar obrigatória
  - **Risco:** Médio — scripts vão parar de funcionar se envvar não estiver configurada no cron

- [x] **15. Corrigir `process.exit(0)` em falha de config**
  - Arquivos: `scripts/send-email-notifications.js`, `scripts/send-discord.js`
  - **Bug:** Cron acha que tudo OK quando config está faltando
  - **Fix:** Mudar para `process.exit(1)`

- [x] **16. Atualizar GitHub Actions (`@v3` → `@v4`)**
  - Arquivo: `.github/workflows/ci.yml`
  - **Problema:** Node 16 deprecated no GitHub Actions

---

## 🟡 Médio — Frontend

- [x] **17. Corrigir `useGroups.ts` — filter injection**
  - Arquivo: `frontend/src/hooks/useGroups.ts` linha 75
  - **Fix:** Usar parâmetros nomeados do PocketBase em vez de interpolação de string

- [x] **18. Adicionar "Bearer " no header Authorization**
  - Arquivo: `frontend/src/hooks/useGroups.ts` linha 11
  - **Fix:** `Authorization: \`Bearer ${pb.authStore.token}\``

- [x] **19. Corrigir leak de `URL.createObjectURL`**
  - Arquivos: `frontend/src/lib/utils.ts` linha 112, `TransactionForm.tsx` linha 161
  - **Fix:** Chamar `URL.revokeObjectURL()` no cleanup

- [x] **20. Corrigir `Modal.tsx` — acessibilidade**
  - Arquivo: `frontend/src/components/ui/Modal.tsx`
  - **Itens:** Adicionar `role="dialog"`, `aria-modal`, focus trap, tecla Escape, scroll lock

- [x] **21. Corrigir `GroupSelector.tsx` — `setSearchParams` sobrescreve params**
  - Arquivo: `frontend/src/components/groups/GroupSelector.tsx` linha 14
  - **Fix:** Usar `setSearchParams(prev => ({ ...prev, group: value }))`

- [x] **22. Corrigir `useCards.ts` — cache invalidation errado**
  - Arquivo: `frontend/src/hooks/useCards.ts` linha 31
  - **Fix:** Invalidar cache DEPOIS do fetch, ou só após mutations (create/update/delete)

- [x] **23. Corrigir `DonutChart.tsx` — moeda hardcoded**
  - Arquivo: `frontend/src/components/ui/DonutChart.tsx` linha 32
  - **Fix:** Usar `currency` do dado ou passar por prop

- [x] **24. Corrigir `Goals.tsx` — `initial_amount = 0` falsy**
  - Arquivo: `frontend/src/pages/Goals.tsx` linha 241
  - **Fix:** `g.initial_amount ?? g.current_amount` (verificar se é null/undefined, não falsy)

---

## 🟢 Baixo — Refatoração / Boas Práticas

- [x] **25. Extrair lógica `PurchaseGroup` para hook compartilhado**
  - Arquivos: `Dashboard.tsx` + `Transactions.tsx` — código duplicado
  - **Benefício:** Reduz duplicação, facilita manutenção

- [x] **26. Extrair `getLabel`/`getColor` para hook ou util**
  - Arquivos: `ReceiptGallery.tsx` + `Reports.tsx` — código duplicado

- [x] **27. Extrair `parseAmount` e `normalizeDateStr` para util compartilhada**
  - Arquivos: `lib/ai.ts` + `lib/nfce.ts` — lógica duplicada

- [x] **28. Extrair `formatDateBR` para `lib/utils.ts`**
  - Arquivos: `Dashboard.tsx` + `ReceiptGallery.tsx` — mesma função inline

- [x] **29. Adicionar loading state no botão de submit do Login**
  - Arquivo: `frontend/src/pages/Login.tsx`
  - **Fix:** Desabilitar botão enquanto requisição está em andamento

- [x] **30. Adicionar loading/error states no `useCategories`**
  - Arquivo: `frontend/src/hooks/useCategories.ts`
  - **Fix:** Retornar `isLoading` e `error` para os componentes

- [x] **31. Adicionar cleanup em todos os `useEffect` de fetch**
  - Arquivos: `Transactions.tsx`, `ReceiptGallery.tsx`, `Groups.tsx`, `Reports.tsx`, `TransactionForm.tsx`
  - **Fix:** Usar `AbortController` ou flag `ignore`

- [x] **32. Corrigir `sw.ts` — `notificationclick` nunca acha janela aberta**
  - Arquivo: `frontend/sw.ts`
  - **Fix:** Comparar `c.url.includes(url)` em vez de `c.url === url`

- [x] **33. Corrigir `export.ts` — `revokeObjectURL` antes do download**
  - Arquivo: `frontend/src/lib/export.ts` linha 44
  - **Fix:** Usar `setTimeout(() => revokeObjectURL(url), 1000)` ou revogar no `click` handler

- [x] **34. Adicionar `authRefresh()` na montagem do app**
  - Arquivo: `frontend/src/hooks/useAuth.ts`
  - **Fix:** Verificar se token ainda é válido ao carregar

- [x] **35. Substituir `alert()` por `useToast()` no Settings e Recurring**
  - Arquivos: `Settings.tsx` (linhas 100, 102, 585, 586), `Recurring.tsx` (linha 138)

---

## 📋 Itens Extras / Ideias

- [ ] **36. Incluir `sw.ts` no `tsconfig.app.json`** para typecheck
- [ ] **37. Adicionar `engines: { node: ">=18" }` no `scripts/package.json`**
- [ ] **38. Criar `.env.example` para scripts** documentando `PB_URL` e `PUSH_SECRET`
- [x] **39. Adicionar `fail_on_detection: true` no TruffleHog do CI** ✅ (feito junto item 16)
- [ ] **40. Adicionar CI para `scripts/`** (pelo menos syntax check)
- [ ] **41. Adicionar loading/skeleton no App.tsx** em vez de tela branca
- [ ] **42. Extrair shared utility module nos hooks PB** (`pb_hooks/lib/utils.pb.js`) para ID generation, auth check, delete pattern

---

> **Última atualização:** 2026-07-15
>
> **Resumo:** 42/42 itens do checklist concluídos + 1 extra (item 39). Restam 6 ideias no backlog (itens 36-38, 40-42).
>
> **Observação:** Git email alterado de noreply para welloliver1974@gmail.com para compatibilidade com Vercel.
> **Workflow definido:** Alterar código → atualizar docs .md → git commit → git push → Vercel auto-deploy.
> **Vercel:** Projeto `gestao-app` (wellington-s-projects1) em https://gestao-app-three.vercel.app.
> Config rootDirectory=`frontend` via vercel.json + frontend/vercel.json com framework=vite.
