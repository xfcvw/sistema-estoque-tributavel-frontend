/*
 * Protótipo UX sem servidor. Os dados ficam no localStorage do navegador para
 * permitir que a atividade seja demonstrada sem alterar o projeto Java original.
 */
const STORAGE_KEY = "estoqueTributavelUX";

const exampleData = {
  regime: { name: "Simples Nacional", rate: 6 },
  products: [
    { id: "G001", name: "Console PlayStation 5", category: "Games", origin: "Importado", ncm: "9504.50.00", price: 3999.9, quantity: 3, minimum: 4, taxRate: 15 },
    { id: "E014", name: "Monitor 24\" IPS", category: "Eletrônicos", origin: "Nacional", ncm: "8528.52.20", price: 789.9, quantity: 12, minimum: 5, taxRate: 12 },
    { id: "E019", name: "Teclado mecânico", category: "Eletrônicos", origin: "Importado", ncm: "8471.60.52", price: 249.9, quantity: 4, minimum: 5, taxRate: 14 },
    { id: "C002", name: "Cafeteira elétrica", category: "Casa", origin: "Nacional", ncm: "8516.71.00", price: 219.9, quantity: 8, minimum: 3, taxRate: 10 }
  ],
  clients: [
    { name: "Marina Oliveira", cpf: "52998224725", phone: "(11) 98888-2030", email: "marina@email.com", createdAt: "2026-10-20" },
    { name: "Rafael Mendes", cpf: "39053344705", phone: "(11) 97770-1144", email: "rafael@email.com", createdAt: "2026-10-22" }
  ],
  employees: [
    { code: "F001", name: "Ana Souza", role: "Gerente de estoque", phone: "(11) 96666-1010" },
    { code: "F002", name: "Carlos Lima", role: "Assistente de vendas", phone: "(11) 95555-9090" }
  ],
  movements: [
    { date: "2026-10-26", type: "Entrada", productId: "E014", quantity: 5, employee: "Ana Souza", note: "Reposição do fornecedor" },
    { date: "2026-10-25", type: "Saída", productId: "G001", quantity: 1, employee: "Carlos Lima", note: "Venda registrada" },
    { date: "2026-10-24", type: "Saída", productId: "E019", quantity: 2, employee: "Carlos Lima", note: "Venda registrada" }
  ]
};

let state = loadData();
let activeView = "painel";
let toastTimer;

function loadData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : structuredClone(exampleData);
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function money(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatDate(date) {
  return new Intl.DateTimeFormat("pt-BR").format(new Date(`${date}T12:00:00`));
}

function formatCpf(cpf) {
  const onlyNumbers = cpf.replace(/\D/g, "");
  return onlyNumbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

// Confere os dois dígitos verificadores oficiais antes de aceitar um CPF.
function isValidCpf(cpf) {
  const digits = cpf.replace(/\D/g, "");
  if (!/^\d{11}$/.test(digits) || /^(\d)\1{10}$/.test(digits)) return false;
  const calculateDigit = (length) => {
    let sum = 0;
    for (let i = 0; i < length; i += 1) sum += Number(digits[i]) * (length + 1 - i);
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };
  return calculateDigit(9) === Number(digits[9]) && calculateDigit(10) === Number(digits[10]);
}

function productById(id) { return state.products.find((product) => product.id === id); }
function isLow(product) { return product.quantity <= product.minimum; }

function render() {
  renderHeader(); renderDashboard(); renderProducts(); renderMovements(); renderClients(); renderEmployees(); renderReports();
}

function renderHeader() {
  document.querySelector("#regime-chip").textContent = `${state.regime.name} · ${state.regime.rate}%`;
}

function renderDashboard() {
  const lowProducts = state.products.filter(isLow);
  const stockValue = state.products.reduce((total, item) => total + item.price * item.quantity, 0);
  const entries = state.movements.filter((item) => item.type === "Entrada").reduce((total, item) => total + item.quantity, 0);
  document.querySelector("#metric-products").textContent = state.products.length;
  document.querySelector("#metric-low-stock").textContent = lowProducts.length;
  document.querySelector("#metric-entries").textContent = entries;
  document.querySelector("#metric-value").textContent = money(stockValue);
  document.querySelector("#low-stock-list").innerHTML = lowProducts.length ? lowProducts.map((item) => `
    <div class="compact-row"><span class="product-dot">${item.name.charAt(0)}</span><div><strong>${item.name}</strong><small>${item.id} · mínimo: ${item.minimum} unidades</small></div><div class="row-value"><strong>${item.quantity}</strong><small>unidades</small></div><span class="badge warning">Repor</span></div>`).join("") : "<p class='muted'>Nenhum produto no estoque mínimo.</p>";
  document.querySelector("#recent-activity").innerHTML = state.movements.slice(0, 4).map((item) => {
    const product = productById(item.productId);
    const outgoing = item.type === "Saída";
    return `<div class="compact-row"><span class="product-dot">${outgoing ? "↑" : "↓"}</span><div><strong>${product?.name || item.productId}</strong><small>${formatDate(item.date)} · ${item.employee}</small></div><div class="row-value"><span class="badge ${outgoing ? "out" : "in"}">${outgoing ? "−" : "+"}${item.quantity} un.</span></div></div>`;
  }).join("") || "<p class='muted'>Ainda não há movimentações.</p>";
}

function renderProducts() {
  const search = document.querySelector("#product-search").value.trim().toLowerCase();
  const filter = document.querySelector("#product-filter").value;
  const filtered = state.products.filter((item) => {
    const matchesSearch = `${item.name} ${item.id} ${item.category}`.toLowerCase().includes(search);
    const matchesFilter = filter === "todos" || (filter === "baixo" && isLow(item)) || (filter === "ok" && !isLow(item));
    return matchesSearch && matchesFilter;
  });
  document.querySelector("#products-table").innerHTML = filtered.map((item) => `
    <tr><td><strong>${item.name}</strong><span class="subtext">Cód. ${item.id} · ${money(item.price)}</span></td><td>${item.category}</td><td>${item.origin}<span class="subtext">NCM ${item.ncm}</span></td><td><span class="stock-value">${item.quantity} un.</span><span class="subtext">Mínimo: ${item.minimum}</span></td><td>${item.taxRate}%</td><td><span class="badge ${isLow(item) ? "warning" : "success"}">${isLow(item) ? "Estoque baixo" : "Regular"}</span></td></tr>`).join("") || emptyRow(6, "Nenhum produto encontrado.");
}

function renderMovements() {
  document.querySelector("#movements-table").innerHTML = state.movements.map((item) => {
    const product = productById(item.productId);
    const outgoing = item.type === "Saída";
    return `<tr><td>${formatDate(item.date)}</td><td><span class="badge ${outgoing ? "out" : "in"}">${item.type}</span></td><td><strong>${product?.name || item.productId}</strong></td><td>${outgoing ? "−" : "+"}${item.quantity} un.</td><td>${item.employee}</td><td>${item.note || "—"}</td></tr>`;
  }).join("") || emptyRow(6, "Nenhuma movimentação registrada.");
}

function renderClients() {
  const search = document.querySelector("#client-search").value.trim().toLowerCase();
  document.querySelector("#clients-table").innerHTML = state.clients.filter((item) => `${item.name} ${item.cpf}`.toLowerCase().includes(search)).map((item) => `
    <tr><td><strong>${item.name}</strong></td><td>${formatCpf(item.cpf)}</td><td>${item.phone}</td><td>${item.email}</td><td>${formatDate(item.createdAt)}</td></tr>`).join("") || emptyRow(5, "Nenhum cliente encontrado.");
}

function renderEmployees() {
  document.querySelector("#employees-table").innerHTML = state.employees.map((item) => `<tr><td><strong>${item.code}</strong></td><td>${item.name}</td><td>${item.role}</td><td>${item.phone}</td><td><span class="badge success">Ativo</span></td></tr>`).join("") || emptyRow(5, "Nenhum funcionário cadastrado.");
}

function renderReports() {
  const totalTax = state.products.reduce((sum, item) => sum + item.price * item.quantity * (item.taxRate / 100), 0);
  const categories = Object.entries(state.products.reduce((all, item) => ({ ...all, [item.category]: (all[item.category] || 0) + item.quantity }), {}));
  document.querySelector("#report-regime").textContent = state.regime.name;
  document.querySelector("#report-rate").textContent = `${state.regime.rate}%`;
  document.querySelector("#tax-estimate").textContent = money(totalTax);
  document.querySelector("#category-summary").innerHTML = categories.map(([name, quantity]) => `<div class="summary-row"><span>${name}</span><strong>${quantity} unidades</strong></div>`).join("") || "<p class='muted'>Sem produtos cadastrados.</p>";
}

function emptyRow(columns, message) { return `<tr><td colspan="${columns}" class="muted">${message}</td></tr>`; }

function openModal(type) {
  const form = document.querySelector("#modal-form");
  const modal = document.querySelector("#modal-backdrop");
  const definitions = {
    product: { kicker: "CATÁLOGO", title: "Cadastrar produto", content: productForm() },
    client: { kicker: "PESSOAS", title: "Cadastrar cliente", content: clientForm() },
    employee: { kicker: "EQUIPE", title: "Cadastrar funcionário", content: employeeForm() },
    movement: { kicker: "ESTOQUE", title: "Registrar movimentação", content: movementForm() },
    regime: { kicker: "TRIBUTAÇÃO", title: "Alterar regime tributário", content: regimeForm() }
  };
  const definition = definitions[type];
  document.querySelector("#modal-kicker").textContent = definition.kicker;
  document.querySelector("#modal-title").textContent = definition.title;
  form.dataset.type = type; form.innerHTML = definition.content; modal.hidden = false;
  form.querySelector("input, select")?.focus();
  if (type === "client") form.querySelector("#cpf").addEventListener("input", (event) => { event.target.value = event.target.value.replace(/\D/g, "").slice(0, 11); });
}

function field(label, id, type = "text", extra = "", full = false) { return `<div class="field ${full ? "full" : ""}"><label for="${id}">${label}</label><input id="${id}" name="${id}" type="${type}" ${extra} /></div>`; }
function selectField(label, id, options, full = false) { return `<div class="field ${full ? "full" : ""}"><label for="${id}">${label}</label><select id="${id}" name="${id}">${options}</select></div>`; }
function formActions(label) { return `<p class="form-error" id="form-error" role="alert"></p><div class="form-actions"><button class="button secondary" type="button" id="cancel-modal">Cancelar</button><button class="button primary" type="submit">${label}</button></div>`; }
function productForm() { return `<div class="form-grid">${field("Código do produto *", "id", "text", "required maxlength='10' placeholder='Ex.: E020'")}${field("Nome do produto *", "name", "text", "required maxlength='60'")}${selectField("Categoria *", "category", "<option>Eletrônicos</option><option>Games</option><option>Casa</option><option>Informática</option>")}${selectField("Origem *", "origin", "<option>Nacional</option><option>Importado</option>")}${field("NCM *", "ncm", "text", "required pattern='[0-9.]{8,10}' placeholder='Ex.: 8528.52.20'")}${field("Alíquota (%) *", "taxRate", "number", "required min='0' max='100' step='0.01'")}${field("Preço (R$) *", "price", "number", "required min='0.01' step='0.01'")}${field("Quantidade inicial *", "quantity", "number", "required min='0' step='1'")}${field("Estoque mínimo *", "minimum", "number", "required min='0' step='1'")}</div>${formActions("Salvar produto")}`; }
function clientForm() { return `<div class="form-grid">${field("Nome completo *", "name", "text", "required maxlength='70'", true)}${field("CPF *", "cpf", "text", "required inputmode='numeric' maxlength='11' placeholder='Somente números'")}${field("Telefone *", "phone", "tel", "required maxlength='20'")}${field("E-mail *", "email", "email", "required maxlength='80'", true)}</div>${formActions("Salvar cliente")}`; }
function employeeForm() { return `<div class="form-grid">${field("Código *", "code", "text", "required maxlength='10' placeholder='Ex.: F003'")}${field("Nome completo *", "name", "text", "required maxlength='70'")}${field("Cargo *", "role", "text", "required maxlength='60'")}${field("Telefone *", "phone", "tel", "required maxlength='20'")}</div>${formActions("Salvar funcionário")}`; }
function movementForm() { const products = state.products.map((item) => `<option value="${item.id}">${item.name} (${item.quantity} un.)</option>`).join(""); const employees = state.employees.map((item) => `<option>${item.name}</option>`).join(""); return `<div class="form-grid">${selectField("Tipo *", "type", "<option>Entrada</option><option>Saída</option>")}${selectField("Produto *", "productId", products)}${field("Quantidade *", "quantity", "number", "required min='1' step='1'")}${selectField("Responsável *", "employee", employees)}<div class="field full"><label for="note">Observação</label><textarea id="note" name="note" maxlength="120" placeholder="Ex.: venda, devolução ou reposição"></textarea></div></div>${formActions("Registrar")}`; }
function regimeForm() { return `<div class="form-grid">${selectField("Regime tributário", "name", "<option>Simples Nacional</option><option>Lucro Presumido</option><option>Lucro Real</option>", true)}${field("Alíquota base (%) *", "rate", "number", `required min='0' max='100' step='0.01' value='${state.regime.rate}'`, true)}</div>${formActions("Atualizar regime")}`; }

function closeModal() { document.querySelector("#modal-backdrop").hidden = true; }
function showError(message) { document.querySelector("#form-error").textContent = message; }
function showToast(message, isError = false) { const toast = document.querySelector("#toast"); toast.textContent = message; toast.classList.toggle("error", isError); toast.classList.add("show"); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove("show"), 3200); }

function handleForm(event) {
  event.preventDefault(); const data = Object.fromEntries(new FormData(event.currentTarget).entries()); const type = event.currentTarget.dataset.type;
  if (!event.currentTarget.checkValidity()) { showError("Preencha os campos obrigatórios corretamente."); return; }
  if (type === "product") {
    if (state.products.some((item) => item.id.toLowerCase() === data.id.trim().toLowerCase())) return showError("Já existe um produto com este código.");
    state.products.unshift({ ...data, id: data.id.trim().toUpperCase(), price: Number(data.price), quantity: Number(data.quantity), minimum: Number(data.minimum), taxRate: Number(data.taxRate) });
  }
  if (type === "client") {
    if (!isValidCpf(data.cpf)) return showError("CPF inválido. Confira os 11 dígitos informados.");
    if (state.clients.some((item) => item.cpf === data.cpf)) return showError("Este CPF já está cadastrado.");
    state.clients.unshift({ ...data, createdAt: new Date().toISOString().slice(0, 10) });
  }
  if (type === "employee") {
    if (state.employees.some((item) => item.code.toLowerCase() === data.code.trim().toLowerCase())) return showError("Já existe um funcionário com este código.");
    state.employees.unshift({ ...data, code: data.code.trim().toUpperCase() });
  }
  if (type === "movement") {
    const product = productById(data.productId); const quantity = Number(data.quantity);
    if (data.type === "Saída" && quantity > product.quantity) return showError(`Saída não permitida: há apenas ${product.quantity} unidade(s) em estoque.`);
    product.quantity += data.type === "Entrada" ? quantity : -quantity;
    state.movements.unshift({ ...data, quantity, date: new Date().toISOString().slice(0, 10) });
  }
  if (type === "regime") state.regime = { name: data.name, rate: Number(data.rate) };
  saveData(); closeModal(); render(); showToast("Registro salvo com sucesso.");
}

function changeView(view) {
  activeView = view;
  document.querySelectorAll(".view").forEach((element) => element.classList.toggle("active", element.id === `${view}-view`));
  document.querySelectorAll(".nav-link").forEach((element) => element.classList.toggle("active", element.dataset.view === view));
  const headings = { painel:["VISÃO GERAL", "Bom dia, Vinicius."], produtos:["CATÁLOGO", "Controle de produtos"], movimentacoes:["MOVIMENTAÇÕES", "Atualização de estoque"], clientes:["PESSOAS", "Base de clientes"], funcionarios:["EQUIPE", "Gestão de funcionários"], relatorios:["ANÁLISE", "Visão para decisão"] };
  document.querySelector("#page-kicker").textContent = headings[view][0]; document.querySelector("#page-title").textContent = headings[view][1];
  document.querySelector(".sidebar").classList.remove("open"); window.scrollTo({ top: 0, behavior: "smooth" });
}

document.addEventListener("click", (event) => {
  const action = event.target.closest("[data-action]")?.dataset.action;
  if (action === "open-product") openModal("product"); if (action === "open-client") openModal("client"); if (action === "open-employee") openModal("employee"); if (action === "open-movement") openModal("movement");
  const viewLink = event.target.closest("[data-view]"); if (viewLink) { event.preventDefault(); changeView(viewLink.dataset.view); }
});
document.querySelector("#modal-form").addEventListener("submit", handleForm);
document.querySelector("#close-modal").addEventListener("click", closeModal);
document.querySelector("#modal-backdrop").addEventListener("click", (event) => { if (event.target.id === "modal-backdrop") closeModal(); });
document.addEventListener("click", (event) => { if (event.target.id === "cancel-modal") closeModal(); });
document.querySelector("#product-search").addEventListener("input", renderProducts);
document.querySelector("#product-filter").addEventListener("change", renderProducts);
document.querySelector("#client-search").addEventListener("input", renderClients);
document.querySelector("#change-regime").addEventListener("click", () => openModal("regime"));
document.querySelector("#reset-data").addEventListener("click", () => { state = structuredClone(exampleData); saveData(); render(); showToast("Dados de exemplo restaurados."); });
document.querySelector("#menu-button").addEventListener("click", () => document.querySelector(".sidebar").classList.toggle("open"));
document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeModal(); });

render();
