/**
 * GestãoApp - Main Application Controller
 */

document.addEventListener("DOMContentLoaded", async () => {
  // Initialize Database
  window.condoDb.initializeLocalDB();
  
  // Element Selections
  const elements = {
    // Navigation Tabs
    navItems: document.querySelectorAll(".nav-item"),
    tabPanes: document.querySelectorAll(".tab-pane"),
    
    // Status Bar
    dbStatus: document.getElementById("db-status"),
    currentDateText: document.getElementById("current-date-text"),
    
    // Dashboard Stats
    valSaldoCaixa: document.getElementById("val-saldo-caixa"),
    valSaldoCaixaSub: document.getElementById("val-saldo-caixa-sub"),
    valFundoReserva: document.getElementById("val-fundo-reserva"),
    valReceitasMes: document.getElementById("val-receitas-mes"),
    valReceitasCount: document.getElementById("val-receitas-count"),
    valDespesasMes: document.getElementById("val-despesas-mes"),
    valDespesasCount: document.getElementById("val-despesas-count"),
    
    // Alerts list & table
    dashboardAlerts: document.getElementById("dashboard-alerts"),
    dashboardRecentTransactions: document.getElementById("dashboard-recent-transactions"),
    
    // Apartments Page
    apartmentCards: document.querySelectorAll(".apartment-card"),
    apartmentDetailsSection: document.getElementById("apartment-details-section"),
    detailUnitTitle: document.getElementById("detail-unit-title"),
    detailUnitStatus: document.getElementById("detail-unit-status"),
    btnCloseUnitDetail: document.getElementById("btn-close-unit-detail"),
    formResidentEdit: document.getElementById("form-resident-edit"),
    editResidentApto: document.getElementById("edit-resident-apto"),
    editResidentName: document.getElementById("edit-resident-name"),
    editResidentPhone: document.getElementById("edit-resident-phone"),
    editResidentValue: document.getElementById("edit-resident-value"),
    unitRecentTransactionsList: document.getElementById("unit-recent-transactions-list"),
    
    // Finances Page
    transactionForm: document.getElementById("transaction-form"),
    transValue: document.getElementById("trans-value"),
    transDate: document.getElementById("trans-date"),
    transCategory: document.getElementById("trans-category"),
    transUnit: document.getElementById("trans-unit"),
    transDesc: document.getElementById("trans-desc"),
    typeReceita: document.getElementById("type-receita"),
    typeDespesa: document.getElementById("type-despesa"),
    filterType: document.getElementById("filter-type"),
    filterCategory: document.getElementById("filter-category"),
    financesTransactionsList: document.getElementById("finances-transactions-list"),
    
    // Chat Page
    chatMessagesContainer: document.getElementById("chat-messages-container"),
    chatInputForm: document.getElementById("chat-input-form"),
    chatUserInput: document.getElementById("chat-user-input"),
    quickChips: document.querySelectorAll(".chip"),
    chatImageInput: document.getElementById("chat-image-input"),
    btnAttachImage: document.getElementById("btn-attach-image"),
    chatImagePreviewContainer: document.getElementById("chat-image-preview-container"),
    chatImagePreview: document.getElementById("chat-image-preview"),
    btnRemoveImage: document.getElementById("btn-remove-image"),
    
    // Config Page
    tursoConfigForm: document.getElementById("turso-config-form"),
    tursoUrl: document.getElementById("turso-url"),
    tursoToken: document.getElementById("turso-token"),
    btnSaveTurso: document.getElementById("btn-save-turso"),
    btnDisconnectTurso: document.getElementById("btn-disconnect-turso"),
    
    // LLM Config
    llmConfigForm: document.getElementById("llm-config-form"),
    llmUrl: document.getElementById("llm-url"),
    llmModel: document.getElementById("llm-model"),
    llmKey: document.getElementById("llm-key"),
    btnSaveLlm: document.getElementById("btn-save-llm"),
    btnExportData: document.getElementById("btn-export-data"),
    btnImportData: document.getElementById("btn-import-data"),
    btnResetData: document.getElementById("btn-reset-data"),
    
    // Quick modal & trigger
    btnQuickTransaction: document.getElementById("btn-quick-transaction"),
    modalQuickTransaction: document.getElementById("modal-quick-transaction"),
    btnCloseQuickModal: document.getElementById("btn-close-quick-modal"),
    modalFormPlaceholder: document.getElementById("modal-form-placeholder"),
    btnSeeAllTransactions: document.getElementById("btn-see-all-transactions")
  };

  // Set today's date in headers and forms
  const todayDate = new Date();
  const formattedDate = todayDate.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  elements.currentDateText.textContent = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
  
  if (elements.transDate) {
    elements.transDate.value = todayDate.toISOString().split("T")[0];
  }

  // Active Tab controller
  function setActiveTab(tabId) {
    elements.navItems.forEach(item => {
      if (item.getAttribute("data-tab") === tabId) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });

    elements.tabPanes.forEach(pane => {
      if (pane.id === `tab-${tabId}`) {
        pane.classList.add("active");
      } else {
        pane.classList.remove("active");
      }
    });

    // Handle view specific initializations
    if (tabId === "dashboard") {
      updateDashboardData();
    } else if (tabId === "apartamentos") {
      loadApartmentsList();
    } else if (tabId === "transacoes") {
      loadTransactionsList();
    }
  }

  // Setup tab click events
  elements.navItems.forEach(item => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      const tabId = item.getAttribute("data-tab");
      setActiveTab(tabId);
      window.location.hash = tabId;
    });
  });

  // Deep Link Routing
  if (window.location.hash) {
    const tabId = window.location.hash.substring(1);
    const validTabs = ["dashboard", "apartamentos", "transacoes", "ia-chat", "configuracoes"];
    if (validTabs.includes(tabId)) {
      setActiveTab(tabId);
    }
  }

  // DB Cloud Connection Indicator
  function updateDbStatusBadge() {
    if (window.condoDb.isSbConnected) {
      elements.dbStatus.className = "db-status-badge online";
      elements.dbStatus.querySelector(".status-text").textContent = "Nuvem Conectada";
    } else {
      elements.dbStatus.className = "db-status-badge offline";
      elements.dbStatus.querySelector(".status-text").textContent = "Modo Local";
    }
  }
  updateDbStatusBadge();

  // ==========================================================================
  // VIEW LOGIC: DASHBOARD
  // ==========================================================================
  async function updateDashboardData() {
    const transactions = await window.condoDb.getTransactions();
    const residents = await window.condoDb.getResidents();
    const reserva = window.condoDb.getFundoReserva();
    
    // Balance calculation
    let totalReceitas = 0;
    let totalDespesas = 0;
    let receitasCount = 0;
    let despesasCount = 0;

    const currentMonth = todayDate.getMonth();
    const currentYear = todayDate.getFullYear();

    transactions.forEach(t => {
      const tDate = new Date(t.data);
      const isCurrentMonth = tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;

      if (t.tipo === "receita") {
        totalReceitas += t.valor;
        if (isCurrentMonth) receitasCount++;
      } else {
        totalDespesas += t.valor;
        if (isCurrentMonth) despesasCount++;
      }
    });

    const saldoCaixa = totalReceitas - totalDespesas;
    
    // Update stats elements
    elements.valSaldoCaixa.textContent = `R$ ${saldoCaixa.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
    elements.valFundoReserva.textContent = `R$ ${reserva.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
    
    // Month summary cards
    let monthReceitasVal = 0;
    let monthDespesasVal = 0;
    
    transactions.forEach(t => {
      const tDate = new Date(t.data);
      if (tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear) {
        if (t.tipo === "receita") monthReceitasVal += t.valor;
        else monthDespesasVal += t.valor;
      }
    });

    elements.valReceitasMes.textContent = `R$ ${monthReceitasVal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
    elements.valReceitasCount.textContent = `${receitasCount} entrada(s) este mês`;
    
    elements.valDespesasMes.textContent = `R$ ${monthDespesasVal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
    elements.valDespesasCount.textContent = `${despesasCount} saída(s) este mês`;

    // Alert systems
    generateDashboardAlerts(residents, saldoCaixa);

    // Recent Transactions Table
    renderRecentTransactions(transactions);

    // Render Charts
    renderCashFlowChart(transactions);
  }

  function generateDashboardAlerts(residents, saldoCaixa) {
    elements.dashboardAlerts.innerHTML = "";
    const pendingUnits = residents.filter(r => r.status_pagamento !== "pago");
    let hasAlerts = false;

    // A. Pending payments alert
    if (pendingUnits.length > 0) {
      hasAlerts = true;
      pendingUnits.forEach(u => {
        const alertItem = document.createElement("div");
        alertItem.className = "alert-item";
        alertItem.innerHTML = `
          <i class="bx bx-time-five alert-icon warning"></i>
          <div class="alert-content">
            <h4>Pendência: Apto ${u.apto}</h4>
            <p>${u.morador} - Condomínio de R$ ${u.valor.toFixed(2)} não identificado.</p>
          </div>
          <button class="btn btn-secondary btn-sm btn-quick-pay" data-apto="${u.apto}" data-val="${u.valor}">
            Receber
          </button>
        `;
        elements.dashboardAlerts.appendChild(alertItem);
      });
    }

    // B. Low balance warning
    if (saldoCaixa < 150) {
      hasAlerts = true;
      const alertItem = document.createElement("div");
      alertItem.className = "alert-item";
      alertItem.innerHTML = `
        <i class="bx bx-error alert-icon warning" style="color: var(--rose); background: var(--rose-glow)"></i>
        <div class="alert-content">
          <h4>Saldo de Caixa Baixo</h4>
          <p>O caixa atual possui apenas R$ ${saldoCaixa.toFixed(2)}. Evite novos gastos.</p>
        </div>
      `;
      elements.dashboardAlerts.appendChild(alertItem);
    }

    if (!hasAlerts) {
      elements.dashboardAlerts.innerHTML = `
        <div class="alert-empty-state">
          <i class="bx bx-badge-check"></i>
          <p>Tudo sob controle! Sem pendências urgentes.</p>
        </div>
      `;
    } else {
      // Dynamic binding of quick payments
      document.querySelectorAll(".btn-quick-pay").forEach(btn => {
        btn.addEventListener("click", async () => {
          const apto = btn.getAttribute("data-apto");
          const val = parseFloat(btn.getAttribute("data-val"));
          
          await window.condoDb.addTransaction({
            data: new Date().toISOString().split("T")[0],
            tipo: "receita",
            categoria: "condominio",
            valor: val,
            descricao: `Pagamento mensal do condomínio do Apto ${apto}`,
            apto_id: apto
          });

          updateDashboardData();
        });
      });
    }
  }

  function renderRecentTransactions(transactions) {
    const listContainer = elements.dashboardRecentTransactions;
    listContainer.innerHTML = "";
    
    // Top 5 most recent
    const recent = transactions.slice(0, 5);
    
    if (recent.length === 0) {
      listContainer.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">Nenhum lançamento registrado.</td></tr>`;
      return;
    }

    recent.forEach(t => {
      const tr = document.createElement("tr");
      
      const badgeClass = t.tipo === "receita" ? "badge-success" : "badge-warning";
      const valueClass = t.tipo === "receita" ? "text-emerald" : "text-rose";
      const sign = t.tipo === "receita" ? "+" : "-";

      tr.innerHTML = `
        <td>${formatDateBR(t.data)}</td>
        <td><span class="badge ${badgeClass}">${t.tipo.toUpperCase()}</span></td>
        <td>${t.categoria.toUpperCase()}</td>
        <td>${t.descricao}</td>
        <td>${t.apto_id ? `Apto ${t.apto_id}` : "Geral"}</td>
        <td class="${valueClass} font-bold">${sign} R$ ${t.valor.toFixed(2)}</td>
      `;
      listContainer.appendChild(tr);
    });
  }

  // Render SVG interactive line chart
  function renderCashFlowChart(transactions) {
    const svg = document.getElementById("cashflow-chart");
    if (!svg) return;
    svg.innerHTML = "";

    // Group data by last 6 months
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const last6Months = [];
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(todayDate.getMonth() - i);
      last6Months.push({
        month: d.getMonth(),
        year: d.getFullYear(),
        name: monthNames[d.getMonth()],
        receitas: 0,
        despesas: 0
      });
    }

    transactions.forEach(t => {
      const tDate = new Date(t.data);
      const tMonth = tDate.getMonth();
      const tYear = tDate.getFullYear();
      
      const idx = last6Months.findIndex(m => m.month === tMonth && m.year === tYear);
      if (idx !== -1) {
        if (t.tipo === "receita") {
          last6Months[idx].receitas += t.valor;
        } else {
          last6Months[idx].despesas += t.valor;
        }
      }
    });

    // Draw Chart Coordinates
    const width = 600;
    const height = 200;
    const padding = 40;
    const graphWidth = width - padding * 2;
    const graphHeight = height - padding * 2;

    // Find Max Value for scaling
    let maxVal = 500; // default minimum scale
    last6Months.forEach(m => {
      if (m.receitas > maxVal) maxVal = m.receitas;
      if (m.despesas > maxVal) maxVal = m.despesas;
    });
    maxVal = maxVal * 1.15; // add 15% top padding

    // Generate Points
    const receitaPoints = [];
    const despesaPoints = [];
    const stepX = graphWidth / (last6Months.length - 1);

    last6Months.forEach((m, idx) => {
      const x = padding + idx * stepX;
      const yRec = height - padding - (m.receitas / maxVal) * graphHeight;
      const yDes = height - padding - (m.despesas / maxVal) * graphHeight;
      receitaPoints.push({ x, y: yRec, val: m.receitas });
      despesaPoints.push({ x, y: yDes, val: m.despesas });
    });

    // Draw Helper gridlines
    for (let i = 0; i <= 3; i++) {
      const y = padding + (graphHeight / 3) * i;
      const valLabel = maxVal - (maxVal / 3) * i;
      svg.innerHTML += `
        <line x1="${padding}" y1="${y}" x2="${width - padding}" y2="${y}" stroke="rgba(255,255,255,0.05)" stroke-width="1" stroke-dasharray="4" />
        <text x="${padding - 5}" y="${y + 4}" fill="var(--text-muted)" font-size="10" text-anchor="end">R$ ${Math.round(valLabel)}</text>
      `;
    }

    // Draw X labels
    last6Months.forEach((m, idx) => {
      const x = padding + idx * stepX;
      svg.innerHTML += `
        <text x="${x}" y="${height - 10}" fill="var(--text-muted)" font-size="11" text-anchor="middle">${m.name}</text>
      `;
    });

    // Draw Receitas Path (green)
    const recPathD = receitaPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(" ");
    svg.innerHTML += `
      <path d="${recPathD}" fill="none" stroke="var(--emerald)" stroke-width="3" stroke-linecap="round" filter="drop-shadow(0px 3px 6px rgba(16, 185, 129, 0.3))" />
    `;

    // Draw Despesas Path (rose)
    const desPathD = despesaPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(" ");
    svg.innerHTML += `
      <path d="${desPathD}" fill="none" stroke="var(--rose)" stroke-width="3" stroke-linecap="round" filter="drop-shadow(0px 3px 6px rgba(244, 63, 94, 0.3))" />
    `;

    // Draw interactive circular points
    receitaPoints.forEach(p => {
      svg.innerHTML += `
        <circle cx="${p.cx || p.x}" cy="${p.cy || p.y}" r="5" fill="#0b0f19" stroke="var(--emerald)" stroke-width="3" />
        <title>Receitas: R$ ${p.val.toFixed(2)}</title>
      `;
    });

    despesaPoints.forEach(p => {
      svg.innerHTML += `
        <circle cx="${p.x}" cy="${p.y}" r="5" fill="#0b0f19" stroke="var(--rose)" stroke-width="3" />
        <title>Despesas: R$ ${p.val.toFixed(2)}</title>
      `;
    });
  }

  // ==========================================================================
  // VIEW LOGIC: APARTAMENTOS
  // ==========================================================================
  async function loadApartmentsList() {
    const residents = await window.condoDb.getResidents();
    const transactions = await window.condoDb.getTransactions();

    residents.forEach(res => {
      // Find dom indicators
      const card = document.querySelector(`.apartment-card[data-apto="${res.apto}"]`);
      if (card) {
        const nameEl = document.getElementById(`morador-${res.apto}`);
        const statusEl = document.getElementById(`status-pag-${res.apto}`);

        nameEl.textContent = res.morador || "Sem morador registrado";
        
        if (res.status_pagamento === "pago") {
          statusEl.innerHTML = `<span class="badge badge-success"><i class="bx bx-check-circle"></i> Condomínio Pago</span>`;
        } else {
          statusEl.innerHTML = `<span class="badge badge-warning"><i class="bx bx-time-five"></i> Pendente</span>`;
        }
      }
    });

    // Update Common Area maintenance counts
    const commonCard = document.querySelector(`.apartment-card.area-comum`);
    if (commonCard) {
      const repairs = transactions.filter(t => t.apto_id === "comum" && t.categoria === "conserto");
      document.getElementById("status-pag-comum").innerHTML = `
        <span class="badge badge-info"><i class="bx bx-wrench"></i> ${repairs.length} Manutenções Registradas</span>
      `;
    }
  }

  // Apartamentos Card Clicks (View details)
  elements.apartmentCards.forEach(card => {
    card.addEventListener("click", async () => {
      const apto = card.getAttribute("data-apto");
      
      // Toggle Active Card highlight
      elements.apartmentCards.forEach(c => c.classList.remove("active"));
      card.classList.add("active");

      // Load details section
      elements.apartmentDetailsSection.classList.remove("hidden");
      elements.detailUnitTitle.textContent = apto === "comum" ? "Área Comum" : `Unidade ${apto}`;
      
      const residents = await window.condoDb.getResidents();
      const unitRes = residents.find(r => r.apto === apto);

      if (apto === "comum") {
        elements.editResidentName.value = "Administração Prédio";
        elements.editResidentPhone.value = "N/A";
        elements.editResidentValue.value = "0";
        elements.editResidentName.disabled = true;
        elements.editResidentPhone.disabled = true;
        elements.editResidentValue.disabled = true;
        elements.detailUnitStatus.innerHTML = `<span class="badge badge-info"><i class="bx bx-building"></i> Área Geral</span>`;
      } else {
        elements.editResidentName.disabled = false;
        elements.editResidentPhone.disabled = false;
        elements.editResidentValue.disabled = false;
        
        elements.editResidentName.value = unitRes ? unitRes.morador : "";
        elements.editResidentPhone.value = unitRes ? unitRes.telefone : "";
        elements.editResidentValue.value = unitRes ? unitRes.valor : "250.00";
        elements.editResidentApto.value = apto;

        if (unitRes && unitRes.status_pagamento === "pago") {
          elements.detailUnitStatus.innerHTML = `<span class="badge badge-success"><i class="bx bx-check-circle"></i> Condomínio Pago</span>`;
        } else {
          elements.detailUnitStatus.innerHTML = `<span class="badge badge-warning"><i class="bx bx-time-five"></i> Pagamento Pendente</span>`;
        }
      }

      // Load history for this specific unit
      const transactions = await window.condoDb.getTransactions();
      const unitTrans = transactions.filter(t => t.apto_id === apto);
      const listContainer = elements.unitRecentTransactionsList;
      listContainer.innerHTML = "";

      if (unitTrans.length === 0) {
        listContainer.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 1.5rem 0;">Sem lançamentos vinculados a esta unidade.</td></tr>`;
      } else {
        unitTrans.forEach(t => {
          const tr = document.createElement("tr");
          const valClass = t.tipo === "receita" ? "text-emerald" : "text-rose";
          const sign = t.tipo === "receita" ? "+" : "-";
          
          tr.innerHTML = `
            <td>${formatDateBR(t.data)}</td>
            <td><span class="badge ${t.tipo === "receita" ? 'badge-success' : 'badge-warning'}">${t.tipo.toUpperCase()}</span></td>
            <td>${t.descricao}</td>
            <td class="${valClass} font-bold">${sign} R$ ${t.valor.toFixed(2)}</td>
          `;
          listContainer.appendChild(tr);
        });
      }
    });
  });

  if (elements.btnCloseUnitDetail) {
    elements.btnCloseUnitDetail.addEventListener("click", () => {
      elements.apartmentDetailsSection.classList.add("hidden");
      elements.apartmentCards.forEach(c => c.classList.remove("active"));
    });
  }

  // Resident Form submit
  if (elements.formResidentEdit) {
    elements.formResidentEdit.addEventListener("submit", async (e) => {
      e.preventDefault();
      const apto = elements.editResidentApto.value;
      const name = elements.editResidentName.value;
      const phone = elements.editResidentPhone.value;
      const value = elements.editResidentValue.value;

      await window.condoDb.saveResident(apto, name, phone, value);
      loadApartmentsList();
      
      // Update Detail UI status
      elements.apartmentDetailsSection.classList.add("hidden");
      elements.apartmentCards.forEach(c => c.classList.remove("active"));
      showToast('success', 'Atualização', `Informações do Apto ${apto} atualizadas com sucesso!`);
    });
  }

  // ==========================================================================
  // VIEW LOGIC: TRANSAÇÕES / FINANÇAS
  // ==========================================================================
  async function loadTransactionsList() {
    const transactions = await window.condoDb.getTransactions();
    const filterT = elements.filterType.value;
    const filterC = elements.filterCategory.value;
    
    const listContainer = elements.financesTransactionsList;
    listContainer.innerHTML = "";

    const filtered = transactions.filter(t => {
      const matchType = filterT === "todos" || t.tipo === filterT;
      const matchCat = filterC === "todas" || t.categoria === filterC;
      return matchType && matchCat;
    });

    if (filtered.length === 0) {
      listContainer.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 2rem 0;">Nenhum lançamento corresponde aos filtros.</td></tr>`;
      return;
    }

    filtered.forEach(t => {
      const tr = document.createElement("tr");
      const valClass = t.tipo === "receita" ? "text-emerald" : "text-rose";
      const sign = t.tipo === "receita" ? "+" : "-";

      tr.innerHTML = `
        <td>${formatDateBR(t.data)}</td>
        <td><span class="badge ${t.tipo === "receita" ? 'badge-success' : 'badge-warning'}">${t.tipo.toUpperCase()}</span></td>
        <td>${t.categoria.toUpperCase()}</td>
        <td>${t.descricao}</td>
        <td>${t.apto_id ? `Apto ${t.apto_id}` : "Geral"}</td>
        <td class="${valClass} font-bold">${sign} R$ ${t.valor.toFixed(2)}</td>
        <td>
          <button class="table-btn-delete" data-id="${t.id}">
            <i class="bx bx-trash"></i>
          </button>
        </td>
      `;
      listContainer.appendChild(tr);
    });

    // Delete transaction bindings
    document.querySelectorAll(".table-btn-delete").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-id");
        if (confirm("Tem certeza que deseja excluir permanentemente este lançamento?")) {
          await window.condoDb.deleteTransaction(id);
          loadTransactionsList();
          updateDashboardData();
        }
      });
    });
  }

  // Finance Form Submit
  if (elements.transactionForm) {
    elements.transactionForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      const tipo = document.querySelector('input[name="trans-type"]:checked').value;
      const valor = parseFloat(elements.transValue.value);
      const data = elements.transDate.value;
      const categoria = elements.transCategory.value;
      const apto_id = elements.transUnit.value;
      const descricao = elements.transDesc.value;

      await window.condoDb.addTransaction({
        data, tipo, categoria, valor, descricao, apto_id
      });

      // Clear Form
      elements.transValue.value = "";
      elements.transDesc.value = "";
      
      loadTransactionsList();
      updateDashboardData();

      // Close modal if open
      elements.modalQuickTransaction.classList.add("hidden");

      showToast('success', 'Lançamento Registrado', 'Lançamento financeiro registrado com sucesso!');
    });
  }

  // Filter bindings
  if (elements.filterType) {
    elements.filterType.addEventListener("change", loadTransactionsList);
  }
  if (elements.filterCategory) {
    elements.filterCategory.addEventListener("change", loadTransactionsList);
  }

  // ==========================================================================
  // VIEW LOGIC: IA ASSISTANTE / CHAT
  // ==========================================================================
  let currentAttachedImageBase64 = null;

  if (elements.btnAttachImage) {
    elements.btnAttachImage.addEventListener("click", () => {
      elements.chatImageInput.click();
    });
  }

  if (elements.chatImageInput) {
    elements.chatImageInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        currentAttachedImageBase64 = ev.target.result;
        elements.chatImagePreview.src = currentAttachedImageBase64;
        elements.chatImagePreviewContainer.classList.remove("hidden");
      };
      reader.readAsDataURL(file);
    });
  }

  if (elements.btnRemoveImage) {
    elements.btnRemoveImage.addEventListener("click", () => {
      currentAttachedImageBase64 = null;
      elements.chatImagePreview.src = "";
      elements.chatImagePreviewContainer.classList.add("hidden");
      elements.chatImageInput.value = "";
    });
  }

  if (elements.chatInputForm) {
    elements.chatInputForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const prompt = elements.chatUserInput.value.trim();
      const imagePayload = currentAttachedImageBase64;
      
      if (!prompt && !imagePayload) return;

      if (imagePayload) {
        appendChatMessage("user", prompt ? `${prompt} [Imagem Anexada]` : "[Imagem Anexada]");
        elements.btnRemoveImage.click(); // clear image attachment state
      } else {
        appendChatMessage("user", prompt);
      }
      
      elements.chatUserInput.value = "";

      // Simulate thinking animation
      const thinkingEl = appendThinkingBubble();
      
      // Delay so UI updates
      setTimeout(async () => {
        try {
          const response = await window.condoAi.processCommand(prompt, imagePayload);
          thinkingEl.remove();
          appendChatMessage("system", response.message);
          
          // Refresh app state if action happened
          if (response.actionExecuted) {
            updateDashboardData();
          }
        } catch (error) {
          thinkingEl.remove();
          appendChatMessage("system", "🤖 **Erro:** Não foi possível me conectar com o provedor de IA. Verifique as configurações (URL e API Key).");
          console.error(error);
        }
      }, 50);
    });
  }

  // Chips click bindings
  elements.quickChips.forEach(chip => {
    chip.addEventListener("click", () => {
      const cmd = chip.getAttribute("data-cmd");
      elements.chatUserInput.value = cmd;
      elements.chatInputForm.dispatchEvent(new Event("submit"));
    });
  });

  function appendChatMessage(sender, text) {
    const container = elements.chatMessagesContainer;
    const msg = document.createElement("div");
    msg.className = `chat-msg ${sender}`;
    
    const icon = sender === "system" ? "bxs-bot" : "bx-user";
    const bubbleContent = text.replace(/\n/g, "<br>");

    msg.innerHTML = `
      <div class="msg-avatar"><i class="bx ${icon}"></i></div>
      <div class="msg-bubble">${bubbleContent}</div>
    `;
    
    container.appendChild(msg);
    container.scrollTop = container.scrollHeight;
  }

  function appendThinkingBubble() {
    const container = elements.chatMessagesContainer;
    const msg = document.createElement("div");
    msg.className = "chat-msg system";
    msg.innerHTML = `
      <div class="msg-avatar"><i class="bx bxs-bot"></i></div>
      <div class="msg-bubble">🤖 <em>Pensando...</em></div>
    `;
    container.appendChild(msg);
    container.scrollTop = container.scrollHeight;
    return msg;
  }

  // ==========================================================================
  // VIEW LOGIC: CONFIGURAÇÕES
  // ==========================================================================
  
  // Fill in Turso configs if they exist
  if (window.condoDb.tursoUrl) {
    elements.tursoUrl.value = window.condoDb.tursoUrl;
    elements.tursoToken.value = window.condoDb.tursoToken;
  }

  if (elements.tursoConfigForm) {
    elements.tursoConfigForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const url = elements.tursoUrl.value.trim();
      const token = elements.tursoToken.value.trim();

      if (!url || !token) {
        showToast('warning', 'Campos obrigatórios', 'Preencha a URL e o Token do Turso.');
        return;
      }

      elements.btnSaveTurso.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Conectando...';
      elements.btnSaveTurso.disabled = true;

      try {
        await window.condoDb.connectTurso(url, token);
        showToast('success', 'Turso Conectado!', 'Seus dados foram sincronizados com o banco na nuvem.');
        updateDashboardData();
      } catch (err) {
        showToast('error', 'Erro de Conexão', err.message);
      } finally {
        elements.btnSaveTurso.innerHTML = '<i class="bx bx-link"></i> Salvar & Conectar';
        elements.btnSaveTurso.disabled = false;
      }
    });
  }

  if (elements.btnDisconnectTurso) {
    elements.btnDisconnectTurso.addEventListener("click", () => {
      window.condoDb.disconnectTurso();
      elements.tursoUrl.value = "";
      elements.tursoToken.value = "";
      showToast('info', 'Desconectado', 'Turso desconectado. O app voltou ao modo offline/local.');
    });
  }

  // LLM Config Load
  const savedLlmUrl = localStorage.getItem('llm_url');
  const savedLlmModel = localStorage.getItem('llm_model');
  const savedLlmKey = localStorage.getItem('llm_key');
  if (savedLlmUrl && elements.llmUrl) elements.llmUrl.value = savedLlmUrl;
  if (savedLlmModel && elements.llmModel) elements.llmModel.value = savedLlmModel;
  if (savedLlmKey && elements.llmKey) elements.llmKey.value = savedLlmKey;

  if (elements.llmConfigForm) {
    elements.llmConfigForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const url = elements.llmUrl.value.trim();
      const model = elements.llmModel.value.trim();
      const key = elements.llmKey.value.trim();
      
      localStorage.setItem('llm_url', url);
      localStorage.setItem('llm_model', model);
      localStorage.setItem('llm_key', key);
      
      showToast('success', 'IA Configurada', 'As configurações do provedor LLM foram salvas.');
    });
  }

  // Backup Export
  if (elements.btnExportData) {
    elements.btnExportData.addEventListener("click", () => {
      const data = window.condoDb.exportBackup();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup_condominio_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }

  // Backup Import
  if (elements.btnImportData) {
    elements.btnImportData.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const parsed = JSON.parse(event.target.result);
          if (confirm("Importar esse backup irá sobrescrever seus dados atuais. Confirmar?")) {
            window.condoDb.importBackup(parsed);
            alert("Backup importado com sucesso! Recarregando dados...");
            location.reload();
          }
        } catch (err) {
          alert("Arquivo inválido. Certifique-se de que é um JSON exportado do GestãoApp.");
        }
      };
      reader.readAsText(file);
    });
  }

  // Reset local database
  if (elements.btnResetData) {
    elements.btnResetData.addEventListener("click", () => {
      if (confirm("Tem certeza que deseja apagar TODOS os lançamentos e restaurar moradores padrão? Esta ação não pode ser desfeita.")) {
        window.condoDb.resetToDefault();
        alert("Configurações originais restauradas!");
        location.reload();
      }
    });
  }

  // ==========================================================================
  // QUICK TRANSACTION MODAL HANDLERS
  // ==========================================================================
  if (elements.btnQuickTransaction) {
    elements.btnQuickTransaction.addEventListener("click", () => {
      elements.modalQuickTransaction.classList.remove("hidden");
      // Move form into modal
      const form = document.getElementById("transaction-form");
      elements.modalFormPlaceholder.appendChild(form);
    });
  }

  if (elements.btnCloseQuickModal) {
    elements.btnCloseQuickModal.addEventListener("click", () => {
      elements.modalQuickTransaction.classList.add("hidden");
      // Restore form back to its origin tab section
      const form = document.getElementById("transaction-form");
      const tab = document.getElementById("tab-transacoes").querySelector(".finances-layout");
      if (tab) {
        tab.insertBefore(form, tab.firstChild);
      }
    });
  }

  if (elements.btnSeeAllTransactions) {
    elements.btnSeeAllTransactions.addEventListener("click", () => {
      setActiveTab("transacoes");
    });
  }

  // Helper formatting routines
  function formatDateBR(dateStr) {
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  // Run initial dashboard load
  updateDashboardData();
});

  // ==========================================================================
  // TOAST NOTIFICATION UTILITY
  // ==========================================================================

  function showToast(type, title, message) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div class="toast-icon">
        <i class="bx ${type === 'success' ? 'bx-check-circle' : type === 'error' ? 'bx-x-circle' : type === 'info' ? 'bx-info-circle' : 'bx-error'}"></i>
      </div>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-desc">${message}</div>
      </div>
    `;
    container.appendChild(toast);
    // Auto-remove after 4 seconds
    setTimeout(() => {
      toast.classList.add('removing');
      toast.addEventListener('animationend', () => toast.remove());
    }, 4000);
  }

