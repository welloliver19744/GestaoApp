# Plano de Melhorias - Gestão Casa

> Apenas sugestões. Nada implementado ainda.

---

## 1. Backup Automático do pb_data

**Problema:** Banco SQLite fica dentro do container Docker. Se o container quebrar ou o VPS for comprometido, os dados podem ser perdidos.

**Sugestões:**
- Script no servidor via cron que executa `docker cp` do `pb_data` pra um diretório fora do container
- Backup diário compactado (`.tar.gz`) com data no nome
- Enviar cópia para nuvem (Google Drive, Dropbox, ou S3-compatible)
- Reter últimos 7 dias (rotacionar backups antigos)
- Opção no Settings do app: "Último backup: 03/06/2026 → Baixar / Exportar"

---

## 2. Upload de Comprovante (imagem anexada à transação)

**Problema:** O scan tira foto pra preencher campos, mas a imagem não é salva. Depois não tem como consultar o comprovante original.

**Sugestões:**
- Novo campo `receipt` do tipo `file` na collection `transactions` do PocketBase
- Upload via formulário (câmera ou galeria)
- Exibir miniatura no TransactionCard
- Modal de visualização em tela cheia
- Opção de download

---

## 3. Notificações Push

**Problema:** Usuário precisa abrir o app pra saber de contas próximas do vencimento.

**Sugestões:**
- Usar Push API + Service Worker (já existe no projeto)
- Inscrever usuário nas notificações (pedir permissão)
- Tipos de notificação:
  - **Contas a vencer amanhã** (push diário)
  - **Contas vencidas e não pagas** (alerta)
  - **Lembrete de parcela** (todo mês)
- Agendamento via PocketBase hooks (`pb_hooks`) com cron
- Configuração no Settings: "Notificações → Ativar / Desativar"

---

## 4. Dashboard Avançado

**Problema:** Dashboard atual mostra resumo simples. Dá pra evoluir bastante.

**Sugestões:**
- **Gráfico de evolução mensal** (linha: receitas vs despesas ao longo dos meses)
- **Gráfico de pizza/rosca** por categoria no mês selecionado
- **Comparativo com mês anterior** (% de aumento/redução)
- **Limite de orçamento** por categoria (barra de progresso: Alimentação R$ 800 / R$ 1200)
- **Extrato rápido**: últimas 5 transações não pagas na home
- **Saldo projetado**: saldo atual - contas a pagar do mês

---

## 5. Multi-moeda / Conversão

**Problema:** App é só BRL. Se o usuário viaja ou faz compra em dólar/euro, não tem como registrar na moeda original.

**Sugestões:**
- Campo `currency` na transação (BRL, USD, EUR, etc.)
- Conversão automática via API de câmbio (ex: AwesomeAPI gratuita)
- Exibição: "R$ 150,00 ($ 26,50)" na tela de transações
- Dashboard sempre em BRL (conversão unificada)

---

## 6. Recorrências (assinaturas fixas)

**Problema:** Netflix, Spotify, aluguel → precisa criar manualmente todo mês.

**Sugestões:**
- Nova collection `recurring_transactions`
- Campos: descrição, categoria, valor, dia do vencimento, tipo (mensal/anual)
- Hook no PocketBase (`pb_hooks`) que roda todo dia e gera as transações do mês automaticamente
- Ao gerar, já vincula com o `group_id` pra editar todas de uma vez (reuso da lógica atual de parcelas)

---

## 7. Metas Financeiras

**Problema:** App só registra o que já gastou. Não ajuda a planejar.

**Sugestões:**
- Collection `goals` no PocketBase: nome, valor alvo, valor atual, prazo
- Card no Dashboard: "Reserva de Emergência → R$ 3.000 / R$ 10.000 (30%)"
- Barra de progresso visual
- Sugestão automática: "Pra atingir sua meta em 12 meses, guarde R$ 583/mês"

---

## 8. Compartilhamento de Contas (despesas divididas)

**Problema:** App é individual. Não dá pra dividir conta com outra pessoa.

**Sugestões:**
- Campo `split_with` (múltiplos usuários) + `split_value` na transação
- Ao pagar, marca quem pagou e quanto cada um deve
- Aba "Contas divididas" com saldo pendente entre usuários
- Botão "Settle up" pra quitar débitos

---

## 9. Exportação de Dados

**Problema:** Não tem como exportar relatório pra contador ou planilha.

**Sugestões:**
- Exportar CSV do mês selecionado (botão no topo da lista de transações)
- Exportar PDF com extrato mensal (sumário + lista)
- Opção "Enviar por email" com o anexo
- Relatório anual (Jan-Dez) em PDF

---

## 10. Melhorias na UX / UI

**Sugestões:**
- **Transição animada** entre rotas (framer-motion ou CSS transition simples)
- **Skeleton loading** nas telas (substituir o "Carregando..." textão)
- **Toast de feedback** ao criar/editar/excluir transação (já existe? verificar)
- **Autocomplete de estabelecimento** baseado no histórico (ao digitar "Pão de", sugere "Pão de Açúcar")
- **Busca textual** na lista de transações
- **Filtro combinado**: mês + categoria + pago/não pago + busca
- **Drag to reorder** ou pin de categorias favoritas
- **Dark mode toggle** (já é dark, mas poderia ter tema claro opcional)

---

## 11. Segurança e Infra

**Sugestões:**
- **Fail2ban** no servidor pra prevenir brute force SSH
- **Firewall UFW**: liberar só 22, 3001, 8091, 443 (se direto)
- **Docker em modo non-root** (rootless)
- **Healthcheck** no container do frontend (nginx)
- **Automatizar deploy** com GitHub Actions (push na main → build → scp → restart)
- **Monitoramento**: Uptime Kuma ou similar pra pingar o domínio

---

## 12. Testes

**Problema:** Zero testes no projeto.

**Sugestões:**
- Testes unitários com Vitest (já usa Vite, integração trivial)
- Testes nos hooks (`useTransactions`, `useAuth`)
- Testes nos utils (`formatCurrency`, `formatDate`)
- Testes de componente com Testing Library
- Teste E2E com Playwright (opcional, mas recomendado pra fluxos críticos)

---

## Prioridade Sugerida

| Prioridade | Item | Motivo |
|---|---|---|
| 🔴 Alta | Backup automático | Risco de perda de dados |
| 🔴 Alta | Upload de comprovante | Já tem o scan, falta salvar |
| 🟡 Média | Notificações push | Engajamento |
| 🟡 Média | Recorrências | Reduz trabalho manual |
| 🟡 Média | Exportação | Utilidade prática |
| 🟢 Baixa | Gráficos no Dashboard | Visual, não funcional |
| 🟢 Baixa | Metas financeiras | Planejamento futuro |
| 🟢 Baixa | Compartilhamento | Escopo maior |
| 🟢 Baixa | Multi-moeda | Nicho |
| 🟢 Baixa | Testes | Qualidade a longo prazo |
| 🟢 Baixa | CI/CD | Automação de deploy |
