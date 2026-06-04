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

### 10. **Compartilhamento de Contas** (em andamento)
- **Banco:** campos `shared_with` (relation many‑to‑many com users) e `created_by` adicionados na coleção `transactions`.
- **Regra de listagem:** `@request.auth.id != "" && (created_by = @request.auth.id || shared_with ?= @request.auth.id)`.
- **Frontend:** tipos atualizados (`Transaction`, `TransactionCreate`), componente **ShareModal** com lista de usuários (fetch via `fetchUsers`), botão de compartilhamento e badge nos cards, payload de criação inclui `created_by`.
- **Back‑fill:** script para popular `created_by` em registros existentes.
- **Teste manual:** verificado que usuário A cria, compartilha com B, B vê a transação; usuários não compartilhados não vêem.

### 11. Segurança e Infraestrutura *(pronto, só falta aplicar no servidor)*
- **scripts/fail2ban.conf** – config padrão (bande 1 h, 5 tentativas, protege SSH).
- **scripts/setup_ufw.sh** – regras UFW: permite SSH, 80/443, porta pública 8091 (Kong/Nginx), habilita firewall.
- **scripts/healthcheck.sh** – script Bash que verifica `/api/health` do PocketBase e retorna 0/1.
- **.github/workflows/ci.yml** – pipeline CI/CD no GitHub Actions (checkout, npm ci, lint, build, testes, escaneamento de segredos com TruffleHog).
- **SECURITY_SETUP_GUIDE.md** – guia passo‑a‑passo para copiar os scripts para o servidor, instalar fail2ban, configurar UFW, agendar health‑check e validar CI.

### 12. Testes (pendente)
- Ainda não há testes automatizados; a próxima fase será criar testes unitários/componente (Vitest) para as partes críticas (ShareModal, formatCurrency, compressImage, etc.) e integrar ao CI.

---

## Instruções para amanhã (passos a seguir)

### 1. Aplicar segurança no servidor
1. **Acessar** o servidor via SSH.
2. **Transferir** a pasta `scripts/` (scp) para o diretório `/home/<usuario>/gestaocasa/`.
3. **Instalar** e habilitar **fail2ban**:
   ```bash
   sudo cp /home/<usuario>/gestaocasa/fail2ban.conf /etc/fail2ban/jail.local
   sudo apt-get update && sudo apt-get install -y fail2ban
   sudo systemctl restart fail2ban
   sudo systemctl status fail2ban
   ```
4. **Configurar firewall UFW**:
   ```bash
   chmod +x /home/<usuario>/gestaocasa/setup_ufw.sh
   sudo /home/<usuario>/gestaocasa/setup_ufw.sh
   sudo ufw status verbose
   ```
5. **Instalar health‑check** e agendar:
   - Tornar executável: `chmod +x healthcheck.sh`.
   - Testar: `./healthcheck.sh` (deve retornar "Health check passed").
   - Agendar com **systemd timer** (recomendado) ou **cron** (exemplo no guide).

### 2. Validar o workflow CI/CD
1. **Commit** e **push** as alterações restantes ao GitHub:
   ```bash
   git add .
   git commit -m "Add security scripts and CI workflow"
   git push origin main
   ```
2. Acessar a aba **Actions** no repositório e acompanhar a execução.
3. Se houver falhas (por exemplo, lint ou testes), corrigi‑las antes de avançar.

### 3. Implementar testes automáticos (Item 12)
1. Instalar Vitest (já está como dependência): `npm i -D vitest @testing-library/react` dentro da pasta `frontend`.
2. Criar arquivos de teste:
   - `frontend/tests/ShareModal.test.tsx` → verifica carregamento de usuários, seleção múltipla e chamada PATCH.
   - `frontend/tests/utils.test.ts` → cobre `formatCurrency` (incluindo moeda opcional) e `compressImage` (mock de canvas).
3. Atualizar o script de CI (`npm test --if-present`) para garantir que falhe caso algum teste quebre.
4. Rodar localmente: `npm test` e depois subir as mudanças.

### 4. Revisão final do compartilhamento
- Testar fluxo completo com duas contas reais (criar, compartilhar, des‑compartilhar) e confirmar que as regras de listagem continuam corretas.
- Garantir que a badge "Compartilhada" aparece nos cards das transações que têm `shared_with`.

---

## Checklist rápido (para marcar amanhã)
- [ ] Fail2ban instalado e ativo
- [ ] UFW configurado e habilitado
- [ ] Health‑check rodando a cada 5 min
- [ ] CI/CD executando sem erros
- [ ] Testes Vitest criados e passando
- [ ] Fluxo de compartilhamento testado com duas contas

---

Qualquer dúvida sobre algum passo, basta chamar. Boa continuação!