/**
 * GestãoApp - Database Driver (Hybrid: Turso + LocalStorage)
 * 
 * Architecture:
 *   - LocalStorage is always the primary store (works offline).
 *   - When Turso credentials are configured, data is also synced to a 
 *     remote SQLite database via the Turso HTTP API.
 *   - On read, if Turso is connected we fetch from the cloud first
 *     and cache locally; on failure we fall back to localStorage.
 */

const DEFAULT_RESIDENTS = [
  { apto: "101", morador: "João Silva", telefone: "(11) 98888-7711", valor: 250.00, status_pagamento: "pago" },
  { apto: "102", morador: "Maria Souza", telefone: "(11) 98888-7722", valor: 250.00, status_pagamento: "pendente" },
  { apto: "201", morador: "Carlos Oliveira", telefone: "(11) 98888-7733", valor: 250.00, status_pagamento: "pago" },
  { apto: "202", morador: "Ana Pereira", telefone: "(11) 98888-7744", valor: 250.00, status_pagamento: "pago" }
];

const DEFAULT_TRANSACTIONS = [
  { id: "t-1", data: "2026-05-10", tipo: "receita", categoria: "condominio", valor: 250.00, descricao: "Condomínio Apto 101 - Referente a Maio", apto_id: "101" },
  { id: "t-2", data: "2026-05-12", tipo: "receita", categoria: "condominio", valor: 250.00, descricao: "Condomínio Apto 201 - Referente a Maio", apto_id: "201" },
  { id: "t-3", data: "2026-05-15", tipo: "receita", categoria: "condominio", valor: 250.00, descricao: "Condomínio Apto 202 - Referente a Maio", apto_id: "202" },
  { id: "t-4", data: "2026-05-05", tipo: "despesa", categoria: "agua", valor: 140.00, descricao: "Conta de Água Geral do Prédio", apto_id: "comum" },
  { id: "t-5", data: "2026-05-08", tipo: "despesa", categoria: "luz", valor: 185.50, descricao: "Conta de Luz Área Comum e Hall", apto_id: "comum" },
  { id: "t-6", data: "2026-05-18", tipo: "despesa", categoria: "conserto", valor: 320.00, descricao: "Manutenção do Portão Eletrônico", apto_id: "comum" }
];

// ===========================================================================
// TursoClient — lightweight wrapper around the Turso HTTP API
// ===========================================================================
class TursoClient {
  constructor(url, token) {
    // Ensure the URL ends with the pipeline endpoint
    let cleanUrl = url.replace(/\/+$/, "");
    // Convert libsql:// to https:// so browser fetch works
    if (cleanUrl.startsWith("libsql://")) {
      cleanUrl = cleanUrl.replace("libsql://", "https://");
    }
    this.baseUrl = cleanUrl;
    this.token = token;
  }

  /**
   * Execute one or more SQL statements via the Turso HTTP pipeline API.
   * @param {Array<{sql: string, args?: Array}>} statements
   * @returns {Promise<Array>} array of result objects
   */
  async execute(statements) {
    const body = {
      requests: statements.map(s => ({
        type: "execute",
        stmt: {
          sql: s.sql,
          args: (s.args || []).map(a => {
            if (a === null || a === undefined) return { type: "null", value: null };
            if (typeof a === "number") {
              return Number.isInteger(a)
                ? { type: "integer", value: String(a) }
                : { type: "float", value: a };
            }
            return { type: "text", value: String(a) };
          })
        }
      })),
      baton: null
    };

    // Add a "close" request at the end to free resources
    body.requests.push({ type: "close" });

    const resp = await fetch(`${this.baseUrl}/v2/pipeline`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Turso HTTP ${resp.status}: ${text}`);
    }

    const json = await resp.json();
    // Map results – each result has { type, response: { type, result } }
    return json.results || [];
  }

  /**
   * Helper: run a single query and return parsed row objects.
   */
  async query(sql, args) {
    const results = await this.execute([{ sql, args }]);
    return this._parseResult(results[0]);
  }

  /**
   * Helper: run a single write statement (INSERT/UPDATE/DELETE).
   */
  async run(sql, args) {
    await this.execute([{ sql, args }]);
  }

  /**
   * Parse a single pipeline result into an array of plain objects.
   */
  _parseResult(result) {
    if (!result || result.type === "error") {
      const msg = result?.error?.message || "Unknown Turso error";
      throw new Error(msg);
    }
    const res = result.response?.result;
    if (!res || !res.cols || !res.rows) return [];

    const cols = res.cols.map(c => c.name);
    return res.rows.map(row => {
      const obj = {};
      row.forEach((cell, i) => {
        obj[cols[i]] = cell.value;
      });
      return obj;
    });
  }
}

// ===========================================================================
// CondoDatabase — main data layer
// ===========================================================================
class CondoDatabase {
  constructor() {
    this.tursoClient = null;
    this.isTursoConnected = false;
    this.tursoUrl = localStorage.getItem("CONDO_TURSO_URL") || "";
    this.tursoToken = localStorage.getItem("CONDO_TURSO_TOKEN") || "";

    this.initTurso();
  }

  // ------- Turso connection management -------

  initTurso() {
    if (this.tursoUrl && this.tursoToken) {
      try {
        this.tursoClient = new TursoClient(this.tursoUrl, this.tursoToken);
        this.isTursoConnected = true;
        console.log("Turso Client inicializado com sucesso!");
      } catch (e) {
        console.error("Falha ao inicializar Turso:", e);
        this.isTursoConnected = false;
      }
    } else {
      this.isTursoConnected = false;
    }
  }

  /**
   * Connect to Turso with new credentials. Validates by running a simple query.
   */
  async connectTurso(url, token) {
    try {
      const client = new TursoClient(url, token);
      // Validate connection with a trivial query
      await client.query("SELECT 1");

      this.tursoUrl = url;
      this.tursoToken = token;
      this.tursoClient = client;
      this.isTursoConnected = true;

      localStorage.setItem("CONDO_TURSO_URL", url);
      localStorage.setItem("CONDO_TURSO_TOKEN", token);

      // Auto-sync local data to Turso
      await this.syncLocalToCloud();

      return true;
    } catch (e) {
      console.error("Turso connection failed:", e);
      throw new Error("Não foi possível conectar ao Turso. Verifique a URL e o Token. Erro: " + e.message);
    }
  }

  disconnectTurso() {
    this.tursoUrl = "";
    this.tursoToken = "";
    this.tursoClient = null;
    this.isTursoConnected = false;
    localStorage.removeItem("CONDO_TURSO_URL");
    localStorage.removeItem("CONDO_TURSO_TOKEN");
  }

  // ------- Local DB initialisation -------

  initializeLocalDB() {
    if (!localStorage.getItem("CONDO_RESIDENTS")) {
      localStorage.setItem("CONDO_RESIDENTS", JSON.stringify(DEFAULT_RESIDENTS));
    }
    if (!localStorage.getItem("CONDO_TRANSACTIONS")) {
      localStorage.setItem("CONDO_TRANSACTIONS", JSON.stringify(DEFAULT_TRANSACTIONS));
    }
    if (!localStorage.getItem("CONDO_FUNDO_RESERVA")) {
      localStorage.setItem("CONDO_FUNDO_RESERVA", "500.00");
    }
  }

  // ------- Residents CRUD -------

  async getResidents() {
    this.initializeLocalDB();
    if (this.isTursoConnected) {
      try {
        const rows = await this.tursoClient.query(
          "SELECT apto, morador, telefone, valor, status_pagamento FROM apartamentos ORDER BY apto ASC"
        );
        if (rows && rows.length > 0) {
          // Normalise valor to number
          const parsed = rows.map(r => ({ ...r, valor: parseFloat(r.valor) }));
          localStorage.setItem("CONDO_RESIDENTS", JSON.stringify(parsed));
          return parsed;
        }
      } catch (e) {
        console.warn("Turso fetch residents failed, fallback to local:", e);
      }
    }
    return JSON.parse(localStorage.getItem("CONDO_RESIDENTS"));
  }

  async saveResident(apto, name, phone, value) {
    let residents = await this.getResidents();
    const idx = residents.findIndex(r => r.apto === apto);
    if (idx !== -1) {
      residents[idx].morador = name;
      residents[idx].telefone = phone;
      residents[idx].valor = parseFloat(value);
      localStorage.setItem("CONDO_RESIDENTS", JSON.stringify(residents));

      if (this.isTursoConnected) {
        try {
          await this.tursoClient.run(
            `INSERT INTO apartamentos (apto, morador, telefone, valor) VALUES (?, ?, ?, ?)
             ON CONFLICT(apto) DO UPDATE SET morador=excluded.morador, telefone=excluded.telefone, valor=excluded.valor`,
            [apto, name, phone, parseFloat(value)]
          );
        } catch (e) {
          console.error("Failed to sync resident edit to Turso:", e);
        }
      }
    }
    return residents;
  }

  async updatePaymentStatus(apto, status) {
    let residents = await this.getResidents();
    const idx = residents.findIndex(r => r.apto === apto);
    if (idx !== -1) {
      residents[idx].status_pagamento = status;
      localStorage.setItem("CONDO_RESIDENTS", JSON.stringify(residents));

      if (this.isTursoConnected) {
        try {
          await this.tursoClient.run(
            `INSERT INTO apartamentos (apto, status_pagamento) VALUES (?, ?)
             ON CONFLICT(apto) DO UPDATE SET status_pagamento=excluded.status_pagamento`,
            [apto, status]
          );
        } catch (e) {
          console.error("Failed to sync resident status to Turso:", e);
        }
      }
    }
  }

  // ------- Transactions CRUD -------

  async getTransactions() {
    this.initializeLocalDB();
    if (this.isTursoConnected) {
      try {
        const rows = await this.tursoClient.query(
          "SELECT id, data, tipo, categoria, valor, descricao, apto_id FROM transacoes ORDER BY data DESC"
        );
        if (rows) {
          const parsed = rows.map(r => ({ ...r, valor: parseFloat(r.valor) }));
          localStorage.setItem("CONDO_TRANSACTIONS", JSON.stringify(parsed));
          return parsed;
        }
      } catch (e) {
        console.warn("Turso fetch transactions failed, fallback to local:", e);
      }
    }
    const trans = JSON.parse(localStorage.getItem("CONDO_TRANSACTIONS"));
    return trans.sort((a, b) => new Date(b.data) - new Date(a.data));
  }

  async addTransaction(transaction) {
    this.initializeLocalDB();
    const transactions = JSON.parse(localStorage.getItem("CONDO_TRANSACTIONS"));
    const newTrans = {
      id: "t-" + Date.now(),
      data: transaction.data,
      tipo: transaction.tipo,
      categoria: transaction.categoria,
      valor: parseFloat(transaction.valor),
      descricao: transaction.descricao,
      apto_id: transaction.apto_id || null
    };

    transactions.push(newTrans);
    localStorage.setItem("CONDO_TRANSACTIONS", JSON.stringify(transactions));

    // Update resident payment status if it is a condo fee payment
    if (transaction.tipo === "receita" && transaction.categoria === "condominio" && transaction.apto_id) {
      await this.updatePaymentStatus(transaction.apto_id, "pago");
    }

    if (this.isTursoConnected) {
      try {
        await this.tursoClient.run(
          "INSERT INTO transacoes (id, data, tipo, categoria, valor, descricao, apto_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [newTrans.id, newTrans.data, newTrans.tipo, newTrans.categoria, newTrans.valor, newTrans.descricao, newTrans.apto_id]
        );
      } catch (e) {
        console.error("Failed to sync transaction to Turso:", e);
      }
    }

    return newTrans;
  }

  async deleteTransaction(id) {
    const transactions = JSON.parse(localStorage.getItem("CONDO_TRANSACTIONS"));
    const updated = transactions.filter(t => t.id !== id);
    localStorage.setItem("CONDO_TRANSACTIONS", JSON.stringify(updated));

    if (this.isTursoConnected) {
      try {
        await this.tursoClient.run("DELETE FROM transacoes WHERE id = ?", [id]);
      } catch (e) {
        console.error("Failed to delete transaction from Turso:", e);
      }
    }
  }

  // ------- Cash reserve -------

  getFundoReserva() {
    this.initializeLocalDB();
    return parseFloat(localStorage.getItem("CONDO_FUNDO_RESERVA") || "0");
  }

  setFundoReserva(val) {
    localStorage.setItem("CONDO_FUNDO_RESERVA", parseFloat(val).toFixed(2));
  }

  // ------- Backup / Restore -------

  exportBackup() {
    this.initializeLocalDB();
    return {
      residents: JSON.parse(localStorage.getItem("CONDO_RESIDENTS")),
      transactions: JSON.parse(localStorage.getItem("CONDO_TRANSACTIONS")),
      fundoReserva: this.getFundoReserva()
    };
  }

  importBackup(backupData) {
    if (backupData.residents) localStorage.setItem("CONDO_RESIDENTS", JSON.stringify(backupData.residents));
    if (backupData.transactions) localStorage.setItem("CONDO_TRANSACTIONS", JSON.stringify(backupData.transactions));
    if (backupData.fundoReserva !== undefined) this.setFundoReserva(backupData.fundoReserva);
  }

  resetToDefault() {
    localStorage.removeItem("CONDO_RESIDENTS");
    localStorage.removeItem("CONDO_TRANSACTIONS");
    localStorage.removeItem("CONDO_FUNDO_RESERVA");
    this.initializeLocalDB();
  }

  // ------- Sync local → Turso -------

  async syncLocalToCloud() {
    if (!this.isTursoConnected) return;
    try {
      const residents = JSON.parse(localStorage.getItem("CONDO_RESIDENTS")) || [];
      const transactions = JSON.parse(localStorage.getItem("CONDO_TRANSACTIONS")) || [];

      const statements = [];

      // Upsert all residents
      for (const r of residents) {
        statements.push({
          sql: `INSERT INTO apartamentos (apto, morador, telefone, valor, status_pagamento)
                VALUES (?, ?, ?, ?, ?)
                ON CONFLICT(apto) DO UPDATE SET
                  morador=excluded.morador,
                  telefone=excluded.telefone,
                  valor=excluded.valor,
                  status_pagamento=excluded.status_pagamento`,
          args: [r.apto, r.morador, r.telefone, r.valor, r.status_pagamento]
        });
      }

      // Upsert all transactions
      for (const t of transactions) {
        statements.push({
          sql: `INSERT INTO transacoes (id, data, tipo, categoria, valor, descricao, apto_id)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                  data=excluded.data,
                  tipo=excluded.tipo,
                  categoria=excluded.categoria,
                  valor=excluded.valor,
                  descricao=excluded.descricao,
                  apto_id=excluded.apto_id`,
          args: [t.id, t.data, t.tipo, t.categoria, t.valor, t.descricao, t.apto_id || null]
        });
      }

      if (statements.length > 0) {
        await this.tursoClient.execute(statements);
      }

      console.log("Sincronização completa de dados locais para o Turso concluída!");
    } catch (e) {
      console.error("Falha ao sincronizar dados locais com o Turso:", e);
    }
  }
}

// Global DB instance
window.condoDb = new CondoDatabase();
