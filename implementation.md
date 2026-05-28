# Implementação de Inteligência Artificial Real (Groq / OpenRouter)

**Objetivo**: Transformar o assistente atual em uma IA real capaz de conversar, analisar os dados do condomínio e **ler contas de água/luz através de fotos**, utilizando provedores compatíveis com o formato OpenAI como **Groq** ou **OpenRouter**.

## User Review Required
> [!IMPORTANT]  
> A integração será feita utilizando o padrão "OpenAI Compatible", o que significa que o mesmo código vai funcionar tanto para o **Groq** quanto para o **OpenRouter**! Você precisará inserir a URL, o nome do Modelo (que tenha suporte a visão) e a sua API Key. Confirma esta abordagem?

## Open Questions
- Alguma preferência de qual deixar preenchido como "Padrão" na tela de configuração? (Exemplo: sugerir `https://openrouter.ai/api/v1` como base, ou deixar em branco?)

## Proposed Changes

### 1. Novos Campos de Configuração (`index.html` e `app.js`)
- Criar a seção "Inteligência Artificial (LLM)".
- Três campos:
  - **Base URL** (Ex: `https://openrouter.ai/api/v1` ou `https://api.groq.com/openai/v1`)
  - **Nome do Modelo** (Ex: `openai/gpt-4o-mini` ou `llama-3.2-90b-vision-preview`)
  - **API Key**
- Os valores serão salvos no `localStorage` de forma segura.

### 2. Leitura de Contas por Foto (`index.html`, `style.css` e `app.js`)
- Adicionar um botão de **"Câmera / Anexo"** (ícone de clipe ou câmera) ao lado do campo de digitação do Chat.
- Quando clicado, abrirá o seletor de arquivos (permitindo uso da câmera no celular) para foto de boleto/conta.
- A imagem será convertida para *Base64* e mostrada como uma miniatura acima do input, pronta para ser enviada junto com o texto do usuário.

### 3. Integração com IA Real (`ai.js`)
- Reescrever a classe `CondoAI` para fazer requisições POST para o endpoint `/chat/completions` configurado.
- **Contexto dinâmico**: A IA receberá o saldo atual, fundos e pendências no "System Prompt".
- **Comunicação de Visão (Image URL)**: Se o usuário enviar a foto, ela será enviada no padrão OpenAI (`image_url`).
- **Instruções Estruturadas**: A IA será instruída a retornar:
  1. Texto natural se for conversa.
  2. Um bloco JSON oculto (ex: `{"action": "addTransaction", "valor": 100...}`) caso a intenção seja lançar uma nota, que o aplicativo interceptará e salvará silenciosamente no Turso.

## Done ✓

### 27/05/2026 — Renomeio + Reset de Dados
- Nome alterado de **CondoAdmin Pro** → **GestãoApp**
- Pasta renomeada de `appcondominio` → `GestaoApp`
- Atualizados: `index.html` (title, header, config desc), `manifest.json` (name, short_name), `ai.js`, `app.js`, `db.js`
- `implementation_plan.md` → `implementation.md`
- `resetToDefault()` alterado em `db.js:373` para limpar dados (arrays vazios) ao invés de recriar defaults

## Verification Plan
### Automated Tests
- N/A (Testes manuais)

### Manual Verification
1. Abrir configurações, preencher Base URL (OpenRouter), Modelo com suporte a Visão e API Key.
2. Ir no chat, pedir para analisar o saldo (verifica leitura do DB).
3. Tirar foto de um documento com valor, digitar "Paguei hoje", e verificar se a IA processa o JSON corretamente e cria a transação no Turso.
