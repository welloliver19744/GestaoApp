# Plano de Melhorias - Gestão Casa

> ✅ = Implementado. Itens abaixo refletem o estado atual do projeto.

---

## 1. Backup Automático do pb_data ✅

**Status:** Implementado.
- Script `scripts/backup.sh` no servidor via cron (diário 03:00)
- Backup compactado `.tar.gz` com data no nome
- Retenção de 14 dias (rotação automática)
- Opção no Settings: mostra info do servidor

---

## 2. Upload de Comprovante ✅

**Status:** Implementado.
- Campo `receipt` do tipo `file` na collection `transactions`
- Upload via formulário (câmera ou galeria) com compressImage
- Exibição em miniatura no TransactionCard
- Modal de visualização em tela cheia
- Galeria dedicada em `/receipts` com filtro por mês
- Escaneamento com IA (scanBillWithAI)

---

## 3. Notificações Push ✅

**Status:** Implementado.
- Push API + Service Worker
- Inscrição com toggle no Settings
- Contas a vencer amanhã (push diário 08:00 via cron)
- Contas vencidas e não pagas (alerta)
- Agendamento via `send-push.js` (cron)

---

## 4. Dashboard Avançado ✅

**Status:** Implementado.
- Gráfico de evolução mensal (linha: total vs pago, 6 meses)
- Gráfico de rosca por categoria no mês
- Comparativo com mês anterior (% de aumento/redução)
- Limite de orçamento por categoria (barra de progresso)
- Próximos vencimentos (lista de contas a pagar)
- Saldo projetado e cards de resumo
- Metas financeiras no Dashboard (top 3)
- IA Insights com resumo inteligente

---

## 5. Multi-moeda ✅

**Status:** Implementado.
- Campo `currency` na transação (BRL, USD, EUR, GBP, ARS, CLP)
- Campo `original_amount` para valor original
- Utilitário `formatCurrency(value, currency?)`
- Seletor de moeda no formulário
- Exibição correta em cards, tabelas e relatórios

---

## 6. Recorrências ✅

**Status:** Implementado.
- Collection `recurring_transactions`
- Frequência mensal/anual, dia do mês
- Hook pb_hooks que gera transações automaticamente
- UI de gerenciamento (CRUD, ativar/desativar)
- Edição preserva active/next_due

---

## 7. Metas Financeiras ✅

**Status:** Implementado.
- Collection `goals`: nome, valor alvo, valor atual, prazo
- Card no Dashboard com barra de progresso
- Dois tipos: goal (tradicional) e investment (com valorização)
- Cálculo de valorização percentual para investimentos
- Adicionar valor incremental

---

## 8. Compartilhamento de Contas ✅

**Status:** Implementado.
- Campo `shared_with` (múltiplos usuários) + `created_by`
- Regra de listagem: `shared_with ?= @request.auth.id`
- Componente ShareModal com seleção de usuários
- Badge "Compartilhado" nos cards
- Testes automatizados (7 testes)

---

## 9. Exportação de Dados ✅

**Status:** Implementado.
- Exportar CSV do mês selecionado
- Exportar PDF com extrato mensal (jsPDF + autoTable)
- Relatório anual (/reports) com gráficos + exportação CSV/PDF

---

## 10. Melhorias na UX / UI ✅

**Status:** Implementado.
- Skeleton loading nas telas
- Toast de feedback ao criar/editar/excluir
- Autocomplete de estabelecimento baseado no histórico
- Busca textual na lista de transações
- Filtro combinado: mês + categoria + pago/não pago + busca
- Dark mode + tema claro (toggle no Settings)
- Onboarding tutorial (6 passos, primeira vez)
- Responsividade mobile (flex-col, grids colapsam)
- Offline banner quando sem conexão
- PWA install prompt

---

## 11. Segurança e Infra ✅

**Status:** Implementado.
- Fail2ban: instalado e ativo (jail sshd + jail nginx-limit-req)
- Firewall UFW: portas 22, 80, 443, 3001, 8091
- Healthcheck: systemd timer a cada 5 min
- CI/CD: GitHub Actions (checkout, npm ci, lint, build, tests, TruffleHog)
- Rate limiting: Nginx 10r/s API, 3r/m login
- Deploy automatizado via git push

---

## 12. Testes ✅

**Status:** Implementado.
- 24 testes com Vitest + Testing Library
- `tests/utils.test.ts` (12) – formatCurrency, formatDate, cn
- `tests/export.test.ts` (2) – exportCSV
- `tests/toast.test.tsx` (3) – ToastProvider
- `tests/share-modal.test.tsx` (7) – ShareModal
- CI integrado: `npm test --if-present` no GitHub Actions

---

## 13. Inteligência Artificial ✅

**Status:** Implementado.
- 11 provedores pré-configurados (OpenAI, Anthropic, OpenRouter, Groq, DeepSeek, Together, Perplexity, NVIDIA, Mistral, Google Gemini, Ollama + Custom)
- Endpoint e modelo preenchidos automaticamente ao selecionar
- Scan de contas com OCR (scanBillWithAI)
- Auto-categorização na digitação (onBlur com debounce)
- Insights financeiros no Dashboard
- Chat IA com dados do usuário

---

## 14. Notificações por E-mail ✅

**Status:** Implementado.
- Script `scripts/send-email-notifications.js` (nodemailer)
- Configuração SMTP em `scripts/email-config.json`
- Envio automático via cron às 08:05
- Lembretes de contas a vencer e vencidas
- Seção informativa no Settings

---

## 15. Contas Familiares ✅

**Status:** Implementado.
- Coleção `groups` (name, description, members, created_by)
- `useGroups` hook com CRUD + gerenciamento de membros
- Página `/groups` com criação/edição/exclusão
- `GroupSelector` no Dashboard e Transactions (filtro via URL param)
- Dashboard filtra cards/gráficos/transactions pelo grupo
- TransactionForm com campo opcional de grupo
- ShareModal integrado: filtra membros do grupo ativo
- Sidebar com link "Grupos"
- Schema SQLite corrigido via Python (workaround: `new Field()` rejeita `_pb_users_auth_`)

---

## 16. Busca Automática de Modelos AI ✅

**Status:** Implementado.
- Botão "Buscar modelos" no Settings ao lado do campo Modelo
- Funciona para todos os 12 provedores (cada um com auth própria: Bearer, x-api-key, query param)
- Ao clicar, fetch de `{endpoint}/models` e exibe `<select>` com opções
- Botão de recarregar quando já populado
- Mensagem de erro se API retornar falha

---

---

## 17. Métodos de Pagamento + Cartões + Estabelecimentos ✅

**Status:** Implementado.
- Seleção de forma de pagamento (Dinheiro, Pix, Crédito, Débito) com botões no `TransactionForm`
- Quando Crédito/Débito selecionado, aparece select de cartões filtrado por tipo
- Seção "Meus Cartões" em Configurações: cadastro de cartões (nome, tipo, dia de vencimento), sem dados sensíveis
- Auto-salvamento de estabelecimentos na collection `stores` ao criar/editar transação
- Novas collections: `cards` e `stores` via script Python SQLite (`scripts/add_payment_stores_cards.py`)
- Colunas `payment_method` e `card_id` adicionadas à tabela `transactions`
- Hook `useCards.ts` com CRUD para cartões do usuário

---

## 18. Correções de Scanner IA (visão) ✅

**Status:** Implementado.
- Formato de imagem corrigido para Anthropic: `{ type: 'image', source: { type: 'base64', ... } }`
- Default Groq alterado de `llama3-70b-8192` para `llama-3.2-11b-vision-preview` (suporte a visão)
- Mensagem de erro amigável quando modelo não suporta imagens
- Fix em `barcode.ts`: overlay fullscreen com câmera visível, linha animada de scan, botão "Cancelar"
- `safeUUID()` adicionado como fallback de `crypto.randomUUID()` em contexto HTTP
- Corrigição em `toFormData` para serializar arrays como JSON string (campo `tags`)

---

## Próximo item sugerido

Nenhum. Projeto funcionalmente completo. Apenas configuração SMTP manual pendente.
