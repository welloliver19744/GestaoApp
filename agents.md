# GestãoApp — Guia do Projeto

## Visão Geral

PWA completo para administração de condomínios com suporte offline, sincronização em nuvem (Turso) e assistente de IA com visão computacional.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | HTML5 + CSS3 (design system, glassmorphism, tema escuro) + Vanilla JS (ES6+) |
| Ícones | BoxIcons (CDN) |
| Fonte | Google Fonts — Outfit |
| Armazenamento | LocalStorage (primário) + Turso SQLite via HTTP API (secundário) |
| IA | OpenAI-compatible (Groq / OpenRouter) — `/chat/completions` |
| PWA | Service Worker (cache-first) + Manifest (standalone) |
| Versionamento | Git + GitHub |

## Estrutura de Arquivos

```
GestaoApp/
├── index.html          # SPA — todas as abas (Dashboard, Unidades, Finanças, IA, Config)
├── style.css           # Design system completo, responsivo, animações
├── app.js              # Controlador principal: navegação, CRUD, dashboard, chat, backup
├── db.js               # Camada de dados: CondoDatabase + TursoClient (LocalStorage + Turso)
├── ai.js               # Motor de IA: CondoAI — chamadas OpenAI-compatible, visão, actions JSON
├── sw.js               # Service Worker — cache-first para PWA offline
├── manifest.json       # Manifesto PWA (nome, ícones, standalone)
├── implementation.md   # Especificação da integração com IA
├── agents.md           # Este arquivo — guia do projeto
├── task.md             # Checklist de implementação da IA
└── icons/
    ├── icon-192.png
    └── icon-512.png
```

## Funcionalidades Principais

- **Dashboard**: saldo, receitas/despesas do mês, fundo de reserva, gráfico SVG fluxo de caixa (6 meses), alertas de pendência
- **Unidades**: CRUD de moradores por apto, status de pagamento, histórico financeiro por unidade
- **Finanças**: lançamentos (receita/despesa), categorias (condomínio, água, luz, conserto, etc.), filtros, exclusão, backup/restore JSON
- **Assistente IA**: chat em linguagem natural, anexo de foto de contas (visão), execução automática de transações via JSON estruturado
- **Config**: conexão Turso, credenciais IA (URL, modelo, API key), exportar/importar backup, resetar dados

## Dados

### LocalStorage Keys

| Key | Tipo | Descrição |
|-----|------|-----------|
| `CONDO_RESIDENTS` | `JSON[]` | Moradores `{apto, morador, telefone, valor, status_pagamento}` |
| `CONDO_TRANSACTIONS` | `JSON[]` | Transações `{id, data, tipo, categoria, valor, descricao, apto_id}` |
| `CONDO_FUNDO_RESERVA` | `string` | Valor do fundo de reserva |
| `CONDO_TURSO_URL` | `string` | URL de conexão Turso |
| `CONDO_TURSO_TOKEN` | `string` | Token de autenticação Turso |
| `llm_url` | `string` | Base URL da API OpenAI-compatible |
| `llm_model` | `string` | Nome do modelo (ex: `openai/gpt-4o-mini`) |
| `llm_key` | `string` | API Key |

### Reset de Dados

`db.js:373` — `resetToDefault()` limpa moradores, transações e fundo de reserva para valores vazios (sem dados padrão). Acessível via Config > "Resetar Dados do App".

## Histórico de Alterações

### 27/05/2026 — Renomeio + Repositório

- App renomeado de **CondoAdmin Pro** → **GestãoApp**
- Pasta renomeada de `appcondominio` → `GestaoApp`
- Arquivos atualizados: `index.html` (title, header, config desc), `manifest.json` (name, short_name)
- Repositório movido para `github.com/welloliver19744/GestaoApp.git`
- `implementation_plan.md` → `implementation.md`
- `resetToDefault()` alterado para limpar dados sem recriar defaults (`db.js:373`)

## Provedores de IA Suportados

| Provedor | Base URL |
|----------|----------|
| OpenRouter | `https://openrouter.ai/api/v1/chat/completions` |
| Groq | `https://api.groq.com/openai/v1/chat/completions` |

Modelos com suporte a visão recomendados: `openai/gpt-4o-mini`, `llama-3.2-90b-vision-preview`.

## Comandos Git

```bash
git status                    # Ver estado
git add -A                    # Stage tudo
git commit -m "mensagem"      # Commitar
git push origin main          # Subir
```

## Fluxo de Trabalho

1. App 100% client-side — abre `index.html` direto ou via servidor HTTP estático
2. Dados ficam em LocalStorage; Turso é opcional para sincronia na nuvem
3. IA requer configuração manual (URL + Modelo + Key) para funcionar
4. Service Worker faz cache dos assets na primeira visita — funciona offline
