/**
 * GestãoApp - Real AI Assistant (OpenAI Compatible)
 */

class CondoAI {
  constructor(db) {
    this.db = db;
  }

  async processCommand(text, imageBase64 = null) {
    const apiUrl = localStorage.getItem('llm_url');
    const apiKey = localStorage.getItem('llm_key');
    const model = localStorage.getItem('llm_model');

    if (!apiUrl || !apiKey || !model) {
      return {
        message: "🤖 **Atenção:** A Inteligência Artificial ainda não foi configurada. Por favor, vá na aba de **Configurações**, na seção 'Inteligência Artificial (LLM)', e insira sua Base URL, Modelo e API Key.",
        actionExecuted: false
      };
    }

    // Gather context from DB
    const transactions = await this.db.getTransactions();
    const residents = await this.db.getResidents();
    const reserva = this.db.getFundoReserva();
    
    let totalReceitas = 0;
    let totalDespesas = 0;
    transactions.forEach(t => {
      if (t.tipo === "receita") totalReceitas += t.valor;
      else totalDespesas += t.valor;
    });
    const saldo = totalReceitas - totalDespesas;

    const pendentes = residents.filter(r => r.status_pagamento !== "pago");
    const pendentesList = pendentes.length > 0 
      ? pendentes.map(r => `Apto ${r.apto} (${r.morador}, R$ ${r.valor})`).join(", ")
      : "Nenhum (Todos em dia)";

    const todayDate = new Date().toISOString().split("T")[0];

    // Build System Prompt
    const systemPrompt = `Você é o GestãoApp AI, o assistente inteligente de gestão do condomínio.
    
INFORMAÇÕES ATUAIS DO CONDOMÍNIO (HOJE: ${todayDate}):
- Saldo em Caixa: R$ ${saldo.toFixed(2)}
- Fundo de Reserva: R$ ${reserva.toFixed(2)}
- Unidades Pendentes de Pagamento: ${pendentesList}

INSTRUÇÕES:
1. Responda de forma amigável, direta e profissional. Formate os valores em Reais (R$).
2. Se o usuário estiver apenas perguntando sobre saldos, relatórios ou pendências, apenas responda em Markdown.
3. Se o usuário pedir para REGISTRAR, ADICIONAR, LANÇAR ou PAGAR alguma despesa ou receita (ou se ele enviar uma FOTO de conta/boleto e informar que pagou ou quer lançar), você deve analisar os dados, e além do seu texto de resposta, você DEVE retornar um bloco JSON delimitado por \`\`\`json ... \`\`\` com os dados estruturados da transação.

FORMATO DO JSON (apenas se for lançar algo):
\`\`\`json
{
  "action": "addTransaction",
  "payload": {
    "data": "YYYY-MM-DD",
    "tipo": "receita" | "despesa",
    "categoria": "agua" | "luz" | "conserto" | "condominio" | "outro",
    "valor": 150.00,
    "descricao": "Breve descrição",
    "apto_id": "101" | "102" | "201" | "202" | "comum"
  }
}
\`\`\`
Dica: se for ler uma conta/boleto na imagem anexada, extraia o valor total exato e o tipo (ex: energia = luz, sabesp/caesb = agua). Apto comum para contas gerais.
Nunca retorne o JSON se não for para salvar/alterar o banco.`;

    // Construct Messages array (OpenAI Format)
    let userContent = [];
    if (text) {
      userContent.push({ type: "text", text: text });
    } else if (imageBase64) {
      userContent.push({ type: "text", text: "Por favor, analise a conta/documento nesta imagem." });
    }
    
    if (imageBase64) {
      userContent.push({
        type: "image_url",
        image_url: { url: imageBase64 }
      });
    }

    const bodyPayload = {
      model: model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent }
      ],
      temperature: 0.1
    };

    // Make the API Request
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(bodyPayload)
    });

    if (!response.ok) {
      throw new Error(`API HTTP Error: ${response.status}`);
    }

    const resultData = await response.json();
    const assistantMessage = resultData.choices[0].message.content;

    // Check if there is a JSON block to execute
    const jsonMatch = assistantMessage.match(/```json\s*([\s\S]*?)\s*```/);
    
    if (jsonMatch) {
      try {
        const jsonBlock = JSON.parse(jsonMatch[1]);
        if (jsonBlock.action === "addTransaction" && jsonBlock.payload) {
          // Execute the DB action
          await this.db.addTransaction(jsonBlock.payload);
          
          // Remove the JSON block from the message shown to the user
          const cleanMessage = assistantMessage.replace(/```json\s*[\s\S]*?\s*```/, "").trim();
          
          return {
            message: cleanMessage || "🤖 Transação registrada com sucesso!",
            actionExecuted: true,
            payload: jsonBlock.payload
          };
        }
      } catch (e) {
        console.error("Erro ao fazer parse do JSON da IA:", e);
      }
    }

    // Normal response
    return {
      message: assistantMessage,
      actionExecuted: false
    };
  }
}

window.condoAi = new CondoAI(window.condoDb);
