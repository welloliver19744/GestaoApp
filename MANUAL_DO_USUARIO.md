# Manual do Usuário — Gestão Casa

## Índice
1. [Primeiros Passos](#1-primeiros-passos)
2. [Dashboard](#2-dashboard)
3. [Transações](#3-transações)
4. [Metas Financeiras](#4-metas-financeiras)
5. [Recorrências](#5-recorrências)
6. [Comprovantes](#6-comprovantes)
7. [Relatórios](#7-relatórios)
8. [Configurações](#8-configurações)
9. [Funcionalidades Avançadas](#9-funcionalidades-avançadas)
10. [Instalação do App (PWA)](#10-instalação-do-app-pwa)
11. [Solução de Problemas](#11-solução-de-problemas)

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
Se você for o criador da transação, pode compartilhar com outros usuários. Clique no ícone de compartilhar e selecione os usuários.

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

## 4. Metas Financeiras

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

## 5. Recorrências

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

## 6. Comprovantes

### Anexar Comprovante
Na criação/edição de uma transação, use o botão "Scan" ou o campo de upload de arquivo (ícone de câmera) para anexar uma foto do comprovante.

### Galeria de Comprovantes
Acesse pelo menu "Comprovantes" para ver todos os recibos em grid:
- Navegue por mês com os botões `<` e `>`.
- Clique em "Hoje" para mostrar o mês atual.
- Clique em qualquer thumbnail para ver o comprovante ampliado com detalhes da transação.
- No modal, clique em "Abrir em nova aba" para ver a imagem em tamanho original.

---

## 7. Relatórios

### Relatório Anual
Acesse pelo menu "Relatórios" para ver a análise completa do ano:
- **Cards de resumo:** Total do ano, total pago, pendente, quantidade de transações.
- **Gráfico de barras:** Gastos mensais (total vs pago) em cada mês.
- **Gráfico de linhas:** Tendência mensal ao longo do ano.
- **Top categorias:** As 10 categorias com maior gasto no ano, com percentual.
- **Exportar:** Botões CSV e PDF para download do relatório completo.

Navegue entre os anos com os botões `<` e `>`.

---

## 8. Configurações

### Perfil
Altere seu nome de exibição. O e-mail é o mesmo usado no login.

### Inteligência Artificial
Configure para usar recursos de IA (scan de contas, auto-categorização, insights):

1. **Provedor:** Escolha entre OpenAI, Anthropic (Claude), Ollama (local) ou Custom.
2. **Endpoint:** Para provedores padrão, é preenchido automaticamente. Para Custom, informe a URL base.
3. **Modelo:** Preenchido automaticamente, mas pode ser alterado.
4. **API Key:** Sua chave de API (fica salva apenas no seu navegador, nunca é enviada ao servidor).

**Provedores suportados:**
| Provedor | Modelo padrão | Preço |
|----------|---------------|-------|
| OpenAI | gpt-4o-mini | ~$0.15/1M tokens |
| Anthropic | claude-3-haiku | ~$0.25/1M tokens |
| Ollama | llama3.2-vision | Gratuito (local) |
| Custom | Qualquer | Variável |

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

## 9. Funcionalidades Avançadas

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

## 10. Instalação do App (PWA)

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

## 11. Solução de Problemas

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
