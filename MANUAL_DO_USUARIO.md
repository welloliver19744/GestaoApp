# Manual do Usuário — Gestão Casa

## Índice
1. [Primeiros Passos](#1-primeiros-passos)
2. [Dashboard](#2-dashboard)
3. [Transações](#3-transações)
4. [Contas Familiares (Grupos)](#4-contas-familiares-grupos)
5. [Metas Financeiras](#5-metas-financeiras)
6. [Recorrências](#6-recorrências)
7. [Comprovantes](#7-comprovantes)
8. [Relatórios](#8-relatórios)
9. [Configurações](#9-configurações)
10. [Funcionalidades Avançadas](#10-funcionalidades-avançadas)
11. [Instalação do App (PWA)](#11-instalação-do-app-pwa)
12. [Solução de Problemas](#12-solução-de-problemas)

---

## 1. Primeiros Passos

### Acessar o App
Abra o navegador e acesse: `http://137.131.187.156:3001`

### Criar Conta / Login
1. Na tela de login, clique em "Criar conta" (se disponível) ou peça para o administrador criar seu usuário.
2. Faça login com e-mail e senha.

### Tutorial Inicial
Na primeira vez que entrar, um tutorial de 6 passos será exibido explicando as principais funcionalidades. Você pode pular clicando em "Pular" a qualquer momento. Para ver o tutorial novamente, limpe o localStorage (chave `gestaocasa-onboarding-done`).

---

## 2. Dashboard

O Dashboard é a página inicial com uma visão geral das suas finanças.

### Cards de Resumo
- **A Pagar:** Total de contas pendentes no mês.
- **Pago no Mês:** Total já pago.
- **Saldo Projetado:** Diferença entre o que você ganha e o que deve pagar (precisa configurar receitas).
- **vs Mês Anterior:** Comparação com o mês anterior (percentual e valor).

### Gráficos
- **Evolução Mensal:** Linha dos últimos 6 meses (total vs pago).
- **Orçamento por Categoria:** Barras de progresso do orçamento mensal (configurado nas categorias no Settings).
- **Gastos por Categoria:** Gráfico de rosca com distribuição dos gastos no mês.

### Comparativo Mensal
Tabela detalhada mostrando cada categoria comparando o mês atual com o anterior, com percentual de diferença (vermelho = aumento, verde = redução).

### IA Insights
Se configurar uma chave de API de IA (OpenAI, Anthropic etc.) nas Configurações, o botão "Gerar" produz um resumo inteligente, previsão para o próximo mês e alertas de gastos fora do comum.

### Próximos Vencimentos
Lista das próximas contas a pagar. Clique no círculo à esquerda para marcar como paga/pendente.

### Metas Financeiras no Dashboard
As 3 principais metas aparecem com barra de progresso.

### Navegação por Mês
Use os botões `<` e `>` ou clique no nome do mês para abrir o seletor de mês. Clique em "Hoje" para voltar ao mês atual. Use o seletor de data para filtrar um dia específico.

---

## 3. Transações

### Lista de Transações
Todas as transações do mês selecionado, ordenadas por data.

### Busca e Filtros
- **Busca:** Digite no campo de busca para filtrar por descrição, estabelecimento ou observações.
- **Filtros:** Clique no ícone de filtro para mostrar/ocultar filtros de categoria e status (pago/pendente).

### Criar Transação
1. Clique em "Nova".
2. Preencha descrição, categoria, estabelecimento, data, valor e moeda.
3. Escolha pagamento à vista ou parcelado (informe número de parcelas).
4. Opcional: anexar comprovante (foto) e observações.
5. Clique em "Criar".

#### Escaneamento com IA
Se tiver uma chave de API configurada, clique em "Scan" ao lado do campo descrição para fotografar uma conta. A IA lê os dados automaticamente.

#### Auto-categorização
Ao sair do campo descrição (onBlur), se a IA estiver configurada, a categoria será sugerida automaticamente baseada na descrição.

### Editar Transação
Passe o mouse sobre o card e clique no ícone de lápis para editar.

### Excluir Transação
Passe o mouse sobre o card e clique no ícone de lixeira. Transações parceladas podem ser excluídas em grupo.

### Marcar como Paga/Pendente
Clique no círculo à esquerda do card para alternar entre pago e pendente.

### Compartilhar Transação
Se você for o criador da transação, pode compartilhar com outros usuários. Clique no ícone de compartilhar e selecione os usuários. Se estiver filtrando por um grupo, apenas os membros do grupo aparecerão.

### Filtrar por Grupo Familiar
Nas páginas de Dashboard e Transações, o seletor "Grupo:" filtra os dados de um grupo específico. Veja [Contas Familiares](#4-contas-familiares-grupos).

### Seleção em Massa (Bulk Edit)
1. Clique em "Selecionar todos" ou marque checkboxes individuais.
2. Use a barra de ferramentas para:
   - **Pagar:** Marcar todas como pagas.
   - **Pendente:** Marcar todas como pendentes.
   - **Categoria:** Alterar categoria de todas de uma vez.
   - **Excluir:** Excluir todas as selecionadas.

### Exportar
1. Clique em "Exportar".
2. Escolha CSV (planilha) ou PDF.
3. O arquivo será baixado com os dados do mês atual.

---

## 4. Contas Familiares (Grupos)

Compartilhe finanças com sua família ou grupo de pessoas.

### Criar Grupo
1. Acesse "Grupos" no menu lateral.
2. Clique em "Novo Grupo".
3. Dê um nome (ex: "Casa", "Casais", "República") e descrição opcional.
4. Clique em "Criar".

### Gerenciar Membros
1. No card do grupo, clique em "Gerenciar Membros".
2. Uma lista de usuários disponíveis aparece. Selecione os membros do grupo.
3. Clique em "Salvar" para confirmar.

### Filtrar por Grupo
No Dashboard e na página de Transações, use o seletor "Grupo:" no topo para filtrar os dados de um grupo específico:
- **Dashboard:** Mostra apenas os cards, gráficos e transações do grupo selecionado.
- **Transações:** Mostra apenas as transações associadas ao grupo.
- **Criação:** Nova transação é automaticamente associada ao grupo ativo.

### Compartilhar com Grupo
1. Na transação, clique no ícone de compartilhar.
2. Se filtrando por grupo, a lista mostra apenas os membros do grupo ativo.
3. Se não houver grupo ativo, mostra todos os usuários.

### Regras
- Apenas o criador pode editar/excluir o grupo.
- Todos os membros veem as transações associadas.
- Membros podem ser adicionados/removidos a qualquer momento.

---

## 5. Metas Financeiras

### Criar Meta
1. Clique em "Nova Meta".
2. Escolha o tipo:
   - **Meta:** Poupança tradicional com barra de progresso (ex: "Viagem para Europa").
   - **Investimento:** Acompanha valorização (ex: "CDB Banco X"). Mostra percentual de valorização.
3. Preencha nome, valor alvo, valor já guardado, prazo (opcional), ícone e cor.
4. Para investimentos, informe o valor inicial investido.
5. Clique em "Criar".

### Acompanhar Progresso
- **Metas:** Barra de progresso mostra percentual concluído e quanto falta.
- **Investimentos:** Mostra valor investido e percentual de valorização (verde = positivo, vermelho = negativo).

### Adicionar Valor
Clique em "+ Adicionar valor" no card da meta, digite o valor e confirme.

### Editar/Excluir
Use os ícones de editar e excluir no canto superior direito do card.

---

## 6. Recorrências

### O que são
Contas que se repetem mensalmente ou anualmente (aluguel, assinaturas, IPVA etc.).

### Criar Recorrência
1. Clique em "Nova".
2. Preencha descrição, categoria, estabelecimento, valor, moeda e frequência (mensal/anual).
3. Informe o dia do vencimento (e mês para anuais).
4. Escolha à vista ou parcelado.
5. Clique em "Criar".

A recorrência gerará automaticamente uma transação no próximo vencimento.

### Editar Recorrência
Clique no ícone de lápis. O `next_due` só será recalculado se você alterar dia, frequência ou mês. O estado ativo/inativo é preservado.

### Ativar/Desativar
Clique no toggle à esquerda para pausar/reativar uma recorrência sem perdê-la.

### Excluir
Clique no ícone de lixeira.

---

## 7. Comprovantes

### Anexar Comprovante
Na criação/edição de uma transação, use o botão "Scan" ou o campo de upload de arquivo (ícone de câmera) para anexar uma foto do comprovante.

### Galeria de Comprovantes
Acesse pelo menu "Comprovantes" para ver todos os recibos em grid:
- Navegue por mês com os botões `<` e `>`.
- Clique em "Hoje" para mostrar o mês atual.
- Clique em qualquer thumbnail para ver o comprovante ampliado com detalhes da transação.
- No modal, clique em "Abrir em nova aba" para ver a imagem em tamanho original.

---

## 8. Relatórios

### Relatório Anual
Acesse pelo menu "Relatórios" para ver a análise completa do ano:
- **Cards de resumo:** Total do ano, total pago, pendente, quantidade de transações.
- **Gráfico de barras:** Gastos mensais (total vs pago) em cada mês.
- **Gráfico de linhas:** Tendência mensal ao longo do ano.
- **Top categorias:** As 10 categorias com maior gasto no ano, com percentual.
- **Exportar:** Botões CSV e PDF para download do relatório completo.

Navegue entre os anos com os botões `<` e `>`.

---

## 9. Configurações

### Perfil
Altere seu nome de exibição. O e-mail é o mesmo usado no login.

### Inteligência Artificial
Configure para usar recursos de IA (scan de contas, auto-categorização, insights):

1. **Provedor:** Escolha entre 12 provedores pré-configurados + Custom (veja tabela abaixo).
2. **Endpoint:** Preenchido automaticamente ao selecionar o provedor. Para Custom, informe a URL base.
3. **Modelo:** Preenchido automaticamente com o modelo padrão, mas pode ser alterado manualmente. Clique em **"Buscar modelos"** (ao lado do campo) para listar todos os modelos disponíveis da API — o campo vira um `<select>` com as opções. Funciona para todos os provedores.
4. **API Key:** Sua chave de API (fica salva apenas no seu navegador, nunca é enviada ao servidor).

**Provedores suportados:**
| Provedor | Modelo padrão | Endpoint | Preço aproximado |
|----------|---------------|----------|-----------------|
| OpenAI | gpt-4o-mini | api.openai.com | ~$0.15/1M tokens |
| Anthropic | claude-3-haiku | api.anthropic.com | ~$0.25/1M tokens |
| OpenRouter | openai/gpt-4o-mini | openrouter.ai | Vários modelos/providers |
| Groq | llama3-70b-8192 | api.groq.com | Grátis (rate limit) |
| DeepSeek | deepseek-chat | api.deepseek.com | ~$0.14/1M tokens |
| Together AI | Mixtral-8x7B | api.together.xyz | ~$0.30/1M tokens |
| Perplexity | sonar-pro | api.perplexity.ai | ~$0.20/1M tokens |
| NVIDIA NIM | llama3-70b-instruct | nvidia.com | Grátis (rate limit) |
| Mistral AI | mistral-small | api.mistral.ai | ~$0.20/1M tokens |
| Google Gemini | gemini-1.5-flash | googleapis.com | Grátis (60 req/min) |
| Ollama | llama3.2-vision | localhost:11434 | Grátis (local) |

### Notificações
#### Push Notifications
1. Clique em "Ativar" para receber notificações no celular.
2. O navegador pedirá permissão — aceite.
3. Você receberá lembretes diários de contas a vencer e vencidas.
4. Para desativar, clique em "Desativar".

#### Notificações por E-mail
Para configurar, o administrador do servidor precisa:
1. Copiar `scripts/email-config.example.json` para `scripts/email-config.json`.
2. Preencher com dados SMTP (servidor, porta, usuário, senha).
3. Os e-mails serão enviados automaticamente às 08:05 da manhã.

### Aparência
Alternar entre tema escuro (padrão) e claro. A preferência fica salva no navegador.

### Servidor
Mostra a URL do PocketBase configurada.

### App
Se o app não atualizar após um deploy, use "Recarregar App" para limpar o cache do service worker e forçar recarregamento.

---

## 10. Funcionalidades Avançadas

### Multi-moeda
Transações podem ser cadastradas em diferentes moedas (BRL, USD, EUR, GBP, ARS, CLP). O valor é exibido corretamente com o símbolo da moeda.

### Modo Offline
O app funciona offline para leitura:
- Uma faixa âmbar "Sem conexão" aparece no topo.
- Os dados previamente carregados ficam disponíveis.
- As operações de escrita (criar, editar, excluir) só funcionam online.
- O service worker faz cache das respostas da API por até 7 dias.

### Atalhos e Dicas
- **Tema:** Alterne rapidamente pelo botão nas Configurações.
- **Busca:** Use o campo de busca na página de Transações para encontrar rapidamente qualquer registro.
- **Autocomplete:** Ao digitar o estabelecimento, sugestões aparecem baseadas em transações anteriores.

---

## 11. Instalação do App (PWA)

O Gestão Casa é um Progressive Web App e pode ser instalado como um aplicativo nativo:

### No Celular (Android - Chrome)
1. Abra o app no Chrome.
2. Um banner "Instalar App" aparecerá na parte inferior — clique em "Instalar".
3. Ou vá no menu do Chrome (⋮) → "Adicionar à tela inicial".
4. O app aparecerá como um ícone na sua tela inicial.

### No Celular (iPhone - Safari)
1. Abra o app no Safari.
2. Toque no ícone de compartilhar (📤).
3. Role para baixo e toque em "Adicionar à tela de Início".
4. Confirme o nome e toque em "Adicionar".

### No Computador
1. Abra o app no Chrome ou Edge.
2. Clique no ícone de instalação na barra de endereços (➕ ou monitor com seta).
3. Confirme a instalação.

### Benefícios do App Instalado
- Abre em tela cheia (sem barra de endereço).
- Carrega mais rápido.
- Recebe notificações push mesmo com o navegador fechado.
- Atalho na tela inicial.

---

## 12. Solução de Problemas

### O app não carrega / tela branca
1. Tente "Recarregar App" nas Configurações.
2. Limpe o cache do navegador para o site.
3. Verifique se o servidor está online.

### Notificações Push não funcionam
1. Verifique se as notificações estão ativadas nas Configurações.
2. Verifique se o navegador não bloqueou as notificações (geralmente um ícone 🔔 na barra de endereço).
3. No iPhone, o app precisa ser instalado na tela inicial para receber push.

### A IA não funciona
1. Configure a API key nas Configurações → Inteligência Artificial.
2. Verifique se o provedor escolhido está com serviços online.
3. Para Ollama, certifique-se de que o servidor local está rodando.

### Erro ao salvar transação
1. Verifique sua conexão com a internet.
2. Se estiver offline, as alterações não podem ser salvas (o app apenas exibe dados em cache).
3. Tente recarregar a página.

### Tema não persiste
Verifique se o localStorage está habilitado no seu navegador. O tema salvo na chave `gestaocasa-theme`.

### Esqueci a senha
Contate o administrador para redefinir.

---

## Suporte
Para reportar bugs ou sugerir melhorias, abra uma issue em: `https://github.com/welloliver19744/GestaoApp/issues`
