# Checklist de Implementação - IA Real (OpenAI Compatible)

- `[x]` 1. **Interface de Configurações (`index.html` e `app.js`)**: Criar campos para Base URL, Modelo e API Key.
- `[x]` 2. **Botão de Anexo/Câmera (`index.html` e `style.css`)**: Adicionar input de arquivo e botão na área do chat, com estilo para miniatura da imagem (preview).
- `[x]` 3. **Lógica de Anexo (`app.js`)**: Implementar leitura da imagem para Base64 quando selecionada pelo usuário.
- `[x]` 4. **Integração LLM (`ai.js`)**: Reescrever o motor da IA para montar chamadas HTTP compatíveis com OpenAI.
- `[x]` 5. **System Prompt e Actions (`ai.js`)**: Enviar estado do DB e processar ações JSON devolvidas pela IA para interagir com o Turso.
