"use strict";

const STORAGE_KEY = "smart-stock-analytics-data";
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const APP_TITLE = document.title || "Smart Stock Analytics";
const DEFAULT_STORE_NAME = $("#dashboard-store-name")?.textContent.trim().replace(/\s*·\s*Live$/i, "") || "Toko Maju";
const DEFAULT_OWNER_NAME = $("#profile-owner-name")?.textContent.trim() || "Pemilik Toko";
const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

function localDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateOffset(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return localDate(date);
}

function createId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

function createDemoState() {
  const products = [
    ["SBK-001", "Beras Premium 5kg", "Sembako", 7, 10, 110000, 132000],
    ["SBK-002", "Minyak Goreng 2L", "Sembako", 0, 12, 33000, 39000],
    ["SBK-003", "Gula Pasir 1kg", "Sembako", 18, 8, 14000, 17000],
    ["SBK-004", "Telur Ayam 1kg", "Sembako", 24, 10, 26000, 30000],
    ["SBK-005", "Tepung Terigu 1kg", "Sembako", 15, 8, 9500, 11500],
    ["MNM-001", "Air Mineral 600ml", "Minuman", 2, 48, 2500, 3500],
    ["MNM-002", "Teh Botol 450ml", "Minuman", 34, 12, 4500, 6000],
    ["MNM-003", "Kopi Sachet (renceng)", "Minuman", 21, 10, 12000, 15000],
    ["MNM-004", "Susu UHT 1L", "Minuman", 0, 12, 15500, 19000],
    ["SNK-001", "Keripik Kentang 68g", "Makanan", 16, 8, 9000, 12000],
    ["SNK-002", "Biskuit Kaleng", "Makanan", 5, 6, 48000, 58000],
    ["SNK-003", "Cokelat Batang", "Makanan", 22, 8, 8500, 11000],
    ["SNK-004", "Mi Instan Goreng", "Makanan", 48, 24, 2700, 3500],
    ["KBR-001", "Sabun Cuci Piring 780ml", "Kebersihan", 12, 8, 12500, 16000],
    ["KBR-002", "Deterjen Bubuk 800g", "Kebersihan", 0, 8, 16000, 20000],
    ["KBR-003", "Tisu Wajah 250s", "Kebersihan", 13, 8, 11000, 14000],
    ["PRW-001", "Sampo Sachet (renceng)", "Perawatan", 19, 8, 10500, 13500],
    ["PRW-002", "Pasta Gigi 190g", "Perawatan", 17, 8, 14500, 18000],
    ["ATK-001", "Buku Tulis 38 lbr", "ATK", 26, 10, 3500, 5000],
    ["ATK-002", "Pulpen Gel Hitam", "ATK", 22, 10, 4000, 6000],
  ].map(([sku, name, category, stock, minimum, cost, price]) => ({
    id: createId("prd"),
    sku,
    name,
    category,
    stock,
    minimum,
    cost,
    price,
  }));

  const productBySku = (sku) => products.find((product) => product.sku === sku);
  const sales = [
    ["SBK-001", 4, 0, "Tunai"],
    ["SBK-004", 10, 0, "QRIS"],
    ["MNM-001", 48, 0, "Tunai"],
    ["SNK-004", 36, 1, "Transfer"],
    ["SBK-003", 12, 2, "Tunai"],
    ["SNK-003", 8, 4, "QRIS"],
    ["MNM-002", 24, 6, "Tunai"],
    ["ATK-001", 10, 9, "Transfer"],
    ["KBR-001", 6, 12, "Tunai"],
    ["PRW-002", 8, 18, "QRIS"],
  ].map(([sku, quantity, daysAgo, payment]) => {
    const product = productBySku(sku);
    return {
      id: createId("sale"),
      date: dateOffset(daysAgo),
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      category: product.category,
      quantity,
      unitPrice: product.price,
      unitCost: product.cost,
      amount: product.price * quantity,
      payment,
    };
  });

  return {
    products,
    sales,
    expenses: [
      { id: createId("exp"), date: dateOffset(2), description: "Belanja perlengkapan toko", category: "Operasional", note: "Kebutuhan toko", amount: 30000 },
      { id: createId("exp"), date: dateOffset(5), description: "Pembelian stok sembako", category: "Pembelian Stok", note: "", amount: 1250000 },
      { id: createId("exp"), date: dateOffset(9), description: "Biaya transportasi", category: "Transportasi", note: "", amount: 20000 },
      { id: createId("exp"), date: dateOffset(13), description: "Tagihan listrik", category: "Operasional", note: "Bulanan", amount: 50000 },
    ],
    settings: { storeName: DEFAULT_STORE_NAME, ownerName: DEFAULT_OWNER_NAME },
  };
}

function isValidState(value) {
  return value
    && Array.isArray(value.products)
    && Array.isArray(value.sales)
    && Array.isArray(value.expenses)
    && value.settings
    && typeof value.settings.storeName === "string";
}

let state = {
  products: [], sales: [], expenses: [],
  settings: { storeName: DEFAULT_STORE_NAME, ownerName: DEFAULT_OWNER_NAME },
};
function saveState() {} // data sekarang disimpan di database, bukan di browser

function showToast(message, isError = false) {
  const region = $("#toast-region");
  if (!region) return;
  const toast = document.createElement("div");
  toast.className = `toast${isError ? " error" : ""}`;
  toast.textContent = message;
  region.append(toast);
  window.setTimeout(() => toast.remove(), 3600);
}

function formatCurrency(value) {
  return rupiah.format(Number(value) || 0);
}

function formatShortCurrency(value) {
  const amount = Number(value) || 0;
  if (amount >= 1_000_000) return `Rp ${(amount / 1_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} jt`;
  if (amount >= 1000) return `Rp ${(amount / 1000).toLocaleString("id-ID", { maximumFractionDigits: 0 })} rb`;
  return formatCurrency(amount);
}

function formatDate(value) {
  if (!value) return "-";
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" })
    .format(new Date(year, month - 1, day));
}

function getProduct(productId) {
  return state.products.find((product) => product.id === productId);
}

function marginPercent(product) {
  return product.price > 0 ? ((product.price - product.cost) / product.price) * 100 : 0;
}

function lowStockProducts() {
  return state.products.filter((product) => product.stock <= product.minimum);
}

function salesInRange(days = 30) {
  if (days === "all") return state.sales;
  const from = dateOffset(Number(days) - 1);
  return state.sales.filter((sale) => sale.date >= from && sale.date <= localDate());
}

function expensesInRange(days = 30) {
  if (days === "all") return state.expenses;
  const from = dateOffset(Number(days) - 1);
  return state.expenses.filter((expense) => expense.date >= from && expense.date <= localDate());
}

function sum(items, field) {
  return items.reduce((total, item) => total + (Number(item[field]) || 0), 0);
}

function renderHeader() {
  $("#current-date").textContent = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date());
  $("#profile-store-name").textContent = state.settings.storeName;
  $("#profile-owner-name").textContent = state.settings.ownerName || "Pemilik Toko";
  $("#dashboard-store-name").textContent = `${state.settings.storeName} · Live`;
  $("#settings-store-name").value = state.settings.storeName;
  $("#settings-owner-name").value = state.settings.ownerName || "";
}

function renderDashboard() {
  const today = localDate();
  const todaySales = state.sales.filter((sale) => sale.date === today);
  const todayExpenses = state.expenses.filter((expense) => expense.date === today);
  const recentSales = salesInRange(30);
  const recentExpenses = expensesInRange(30);
  const inventoryValue = sum(state.products.map((product) => ({ value: product.stock * product.cost })), "value");
  const revenue = sum(recentSales, "amount");
  const grossProfit = recentSales.reduce((total, sale) => total + ((sale.unitPrice - sale.unitCost) * sale.quantity), 0);
  const operatingExpenses = recentExpenses
    .filter((expense) => expense.category !== "Pembelian Stok")
    .reduce((total, expense) => total + expense.amount, 0);
  const inStockCount = state.products.filter((product) => product.stock > 0).length;
  const lowProducts = lowStockProducts();
  const averageMargin = state.products.length
    ? state.products.reduce((total, product) => total + marginPercent(product), 0) / state.products.length
    : 0;

  $("#metric-stock-value").textContent = formatShortCurrency(inventoryValue);
  $("#metric-stock-note").textContent = `Harga jual ${formatShortCurrency(sum(state.products.map((product) => ({ value: product.stock * product.price })), "value"))}`;
  $("#metric-income-today").textContent = formatShortCurrency(sum(todaySales, "amount"));
  $("#metric-income-count").textContent = `${todaySales.length} transaksi`;
  $("#metric-expense-today").textContent = formatShortCurrency(sum(todayExpenses, "amount"));
  $("#metric-net-profit").textContent = formatShortCurrency(grossProfit - operatingExpenses);
  $("#metric-transactions").textContent = String(recentSales.length);
  $("#metric-revenue-note").textContent = `Omzet ${formatShortCurrency(revenue)}`;
  $("#metric-available").textContent = `${inStockCount} / ${state.products.length}`;
  $("#metric-low-stock").textContent = String(lowProducts.length);
  $("#metric-critical-note").textContent = `${lowProducts.filter((product) => product.stock === 0).length} barang habis`;
  $("#metric-margin").textContent = `${averageMargin.toLocaleString("id-ID", { maximumFractionDigits: 1 })}%`;
  $("#low-stock-badge").textContent = String(lowProducts.length);
  $("#notification-count").textContent = String(lowProducts.length);

  $("#attention-list").innerHTML = lowProducts.length
    ? lowProducts.slice(0, 5).map((product) => `
      <div class="attention-item${product.stock > 0 ? " is-low" : ""}">
        <span class="attention-indicator" aria-hidden="true"></span>
        <span class="attention-copy"><strong>${escapeHTML(product.name)}</strong><small>Stok ${product.stock} / minimum ${product.minimum}</small></span>
        <span class="status-pill${product.stock > 0 ? " low" : ""}">${product.stock === 0 ? "Kritis" : "Menipis"}</span>
      </div>`).join("")
    : '<p class="muted">Semua stok berada di atas batas minimum.</p>';

  const bestSellers = new Map();
  for (const sale of recentSales) {
    const current = bestSellers.get(sale.productId) || { name: sale.productName, quantity: 0, amount: 0 };
    current.quantity += sale.quantity;
    current.amount += sale.amount;
    bestSellers.set(sale.productId, current);
  }
  const top = [...bestSellers.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 5);
  $("#best-seller-list").innerHTML = top.length
    ? top.map((item) => `<li><span class="seller-copy"><strong>${escapeHTML(item.name)}</strong><small>${item.quantity} unit terjual</small></span><strong>${formatShortCurrency(item.amount)}</strong></li>`).join("")
    : '<li class="muted">Belum ada data penjualan.</li>';

  const selectedRange = $("[data-range].is-selected")?.dataset.range || "30";
  drawTrendChart($("#dashboard-chart"), Number(selectedRange) || 30);
}

function drawTrendChart(svg, range = 30) {
  if (!svg) return;
  const days = Math.min(range, 30);
  const labels = Array.from({ length: 7 }, (_, index) => {
    const offset = Math.round((days - 1) * (6 - index) / 6);
    return dateOffset(offset);
  });
  const income = labels.map((date) => sum(state.sales.filter((sale) => sale.date === date), "amount"));
  const expense = labels.map((date) => sum(state.expenses.filter((item) => item.date === date), "amount"));
  const maxValue = Math.max(1, ...income, ...expense);
  const left = 54;
  const right = 878;
  const top = 20;
  const bottom = 205;
  const x = (index) => left + (right - left) * index / Math.max(1, labels.length - 1);
  const y = (value) => bottom - (value / maxValue) * (bottom - top);
  const makePoints = (values) => values.map((value, index) => `${x(index)},${y(value)}`).join(" ");
  const grid = [0, 1, 2, 3].map((index) => {
    const gridY = top + ((bottom - top) * index / 3);
    const value = maxValue * (3 - index) / 3;
    return `<line class="chart-grid-line" x1="${left}" y1="${gridY}" x2="${right}" y2="${gridY}"></line><text class="chart-label" x="0" y="${gridY + 3}">${escapeHTML(formatShortCurrency(value))}</text>`;
  }).join("");
  const dateLabels = labels.map((date, index) => {
    const [year, month, day] = date.split("-").map(Number);
    const text = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short" }).format(new Date(year, month - 1, day));
    return `<text class="chart-label" text-anchor="middle" x="${x(index)}" y="232">${text}</text>`;
  }).join("");
  svg.innerHTML = `
    <defs><linearGradient id="income-gradient" x1="0" x2="0" y1="0" y2="1"><stop class="chart-gradient-start" offset="0"></stop><stop class="chart-gradient-end" offset="1"></stop></linearGradient></defs>
    ${grid}
    <polygon class="chart-area" points="${left},${bottom} ${makePoints(income)} ${right},${bottom}"></polygon>
    <polyline class="chart-line-income" points="${makePoints(income)}"></polyline>
    <polyline class="chart-line-expense" points="${makePoints(expense)}"></polyline>
    ${dateLabels}`;
}

function productStatus(product) {
  if (product.stock === 0) return '<span class="status-pill">Habis</span>';
  if (product.stock <= product.minimum) return '<span class="status-pill low">Menipis</span>';
  return '<span class="status-pill safe">Aman</span>';
}

function renderCategoryFilters() {
  const selects = [$("#category-filter"), $("#report-category")];
  for (const select of selects) {
    if (!select) continue;
    const current = select.value;
    const available = [...new Set(state.products.map((product) => product.category))].sort();
    select.innerHTML = `<option value="">Semua kategori</option>${available.map((category) => `<option value="${escapeHTML(category)}">${escapeHTML(category)}</option>`).join("")}`;
    select.value = available.includes(current) ? current : "";
  }
}

function renderInventory() {
  renderCategoryFilters();
  const query = ($("#inventory-search").value || "").trim().toLocaleLowerCase("id-ID");
  const category = $("#category-filter").value;
  const stockFilter = $("#stock-filter").value;
  const sort = $("#inventory-sort").value;
  let products = state.products.filter((product) => {
    const matchesText = `${product.name} ${product.sku} ${product.category}`.toLocaleLowerCase("id-ID").includes(query);
    const matchesCategory = !category || product.category === category;
    const matchesStock = stockFilter === "low" ? product.stock > 0 && product.stock <= product.minimum
      : stockFilter === "out" ? product.stock === 0
        : stockFilter === "available" ? product.stock > 0
          : true;
    return matchesText && matchesCategory && matchesStock;
  });
  products = [...products].sort((a, b) => {
    if (sort === "stock-asc") return a.stock - b.stock;
    if (sort === "stock-desc") return b.stock - a.stock;
    if (sort === "value-desc") return (b.stock * b.cost) - (a.stock * a.cost);
    return a.name.localeCompare(b.name, "id");
  });

  $("#inventory-rows").innerHTML = products.length ? products.map((product) => {
    const margin = marginPercent(product);
    const stockMax = Math.max(product.minimum * 2, product.stock, 1);
    const progressClass = product.stock === 0 ? "is-out" : product.stock <= product.minimum ? "is-low" : "";
    return `<tr>
      <td class="product-cell"><strong>${escapeHTML(product.name)}</strong><small>${productStatus(product)}</small></td>
      <td>${escapeHTML(product.sku)}</td>
      <td>${escapeHTML(product.category)}</td>
      <td><span class="stock-bar"><progress class="${progressClass}" max="${stockMax}" value="${product.stock}"></progress><span>${product.stock} / ${product.minimum}</span></span></td>
      <td>${formatCurrency(product.cost)}</td>
      <td>${formatCurrency(product.price)}</td>
      <td>${margin.toLocaleString("id-ID", { maximumFractionDigits: 1 })}%</td>
      <td><div class="row-actions"><button class="small-button" type="button" data-edit-product="${escapeHTML(product.id)}">Edit</button><button class="small-button delete" type="button" data-delete-product="${escapeHTML(product.id)}">Hapus</button></div></td>
    </tr>`;
  }).join("") : '<tr><td class="empty-row" colspan="8">Barang tidak ditemukan.</td></tr>';
  $("#inventory-summary").textContent = `Menampilkan ${products.length} dari ${state.products.length} barang.`;
  renderSaleProductOptions();
}

function renderSaleProductOptions() {
  const select = $("#sale-product");
  if (!select) return;
  const previous = select.value;
  const availableProducts = state.products.filter((product) => product.stock > 0);
  select.innerHTML = `<option value="">Pilih barang</option>${availableProducts.map((product) => `<option value="${escapeHTML(product.id)}">${escapeHTML(product.name)} · stok ${product.stock} · ${formatCurrency(product.price)}</option>`).join("")}`;
  if (availableProducts.some((product) => product.id === previous)) select.value = previous;
  updateSaleHint();
}

function renderExpenseProductOptions() {
  const select = $("#expense-product");
  if (!select) return;
  const previous = select.value;
  select.innerHTML = `<option value="">Pilih barang</option>${state.products.map((product) => `<option value="${escapeHTML(product.id)}">${escapeHTML(product.name)} · ${formatCurrency(product.cost)}</option>`).join("")}`;
  if (state.products.some((product) => product.id === previous)) select.value = previous;
  updatePurchaseAmount();
}

function updatePurchaseAmount() {
  const category = $("#expense-category");
  const product = getProduct($("#expense-product")?.value);
  const quantity = Number($("#expense-quantity")?.value) || 0;
  const amount = $("#expense-form")?.elements.amount;
  if (category?.value === "Pembelian Stok" && product && quantity > 0 && amount) {
    amount.value = String(product.cost * quantity);
  }
}

function toggleStockPurchaseFields() {
  const purchase = $("#expense-category").value === "Pembelian Stok";
  const fields = $("#expense-stock-fields");
  fields.hidden = !purchase;
  $("#expense-product").required = purchase;
  $("#expense-quantity").required = purchase;
  if (purchase) renderExpenseProductOptions();
}

function renderSales() {
  const query = ($("#sales-search").value || "").trim().toLocaleLowerCase("id-ID");
  const payment = $("#payment-filter").value;
  const from = $("#sales-from").value;
  const to = $("#sales-to").value;
  const sales = [...state.sales].filter((sale) => {
    const matchesText = `${sale.productName} ${sale.sku}`.toLocaleLowerCase("id-ID").includes(query);
    return matchesText && (!payment || sale.payment === payment) && (!from || sale.date >= from) && (!to || sale.date <= to);
  }).sort((a, b) => b.date.localeCompare(a.date));
  $("#sales-rows").innerHTML = sales.length ? sales.map((sale) => `
    <tr><td>${formatDate(sale.date)}</td><td class="product-cell"><strong>${escapeHTML(sale.productName)}</strong><small>${escapeHTML(sale.sku)}</small></td><td>${sale.quantity}</td><td>${escapeHTML(sale.payment)}</td><td>${formatCurrency(sale.amount)}</td><td><div class="row-actions"><button class="small-button delete" type="button" data-delete-sale="${escapeHTML(sale.id)}">Hapus</button></div></td></tr>`).join("")
    : '<tr><td class="empty-row" colspan="6">Belum ada pemasukan yang cocok.</td></tr>';
  const total = sum(sales, "amount");
  $("#income-total").textContent = formatCurrency(total);
  $("#income-count").textContent = String(sales.length);
  $("#income-average").textContent = formatCurrency(sales.length ? total / sales.length : 0);
  $("#sales-summary").textContent = `${sales.length} transaksi · Total ${formatCurrency(total)}`;
}

function renderExpenses() {
  const query = ($("#expense-search").value || "").trim().toLocaleLowerCase("id-ID");
  const category = $("#expense-category-filter").value;
  const from = $("#expenses-from").value;
  const to = $("#expenses-to").value;
  const expenses = [...state.expenses].filter((expense) => {
    const matchesText = `${expense.description} ${expense.note || ""}`.toLocaleLowerCase("id-ID").includes(query);
    return matchesText && (!category || expense.category === category) && (!from || expense.date >= from) && (!to || expense.date <= to);
  }).sort((a, b) => b.date.localeCompare(a.date));
  $("#expense-rows").innerHTML = expenses.length ? expenses.map((expense) => `
    <tr><td>${formatDate(expense.date)}</td><td class="product-cell"><strong>${escapeHTML(expense.description)}</strong></td><td>${escapeHTML(expense.category)}</td><td>${escapeHTML(expense.note || "-")}</td><td>${formatCurrency(expense.amount)}</td><td><div class="row-actions"><button class="small-button delete" type="button" data-delete-expense="${escapeHTML(expense.id)}">Hapus</button></div></td></tr>`).join("")
    : '<tr><td class="empty-row" colspan="6">Belum ada pengeluaran yang cocok.</td></tr>';
  const total = sum(expenses, "amount");
  const operating = sum(expenses.filter((expense) => expense.category !== "Pembelian Stok"), "amount");
  $("#expense-total").textContent = formatCurrency(total);
  $("#operating-expense-total").textContent = formatCurrency(operating);
  $("#expense-count").textContent = String(expenses.length);
  $("#expense-summary").textContent = `${expenses.length} catatan · Total ${formatCurrency(total)}`;

  const groups = new Map();
  for (const expense of expenses) groups.set(expense.category, (groups.get(expense.category) || 0) + expense.amount);
  const max = Math.max(1, ...groups.values());
  $("#expense-category-summary").innerHTML = groups.size ? [...groups.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, amount]) => `<div class="category-summary-row"><span>${escapeHTML(name)}</span><progress max="${max}" value="${amount}"></progress><strong>${formatShortCurrency(amount)}</strong></div>`).join("")
    : '<p class="muted">Belum ada data pengeluaran.</p>';
}

function renderAnalysis() {
  const units = sum(state.sales, "quantity");
  const totalRevenue = sum(state.sales, "amount");
  const productMargins = state.products.map(marginPercent);
  const avgMargin = productMargins.length ? productMargins.reduce((a, b) => a + b, 0) / productMargins.length : 0;
  const values = [
    ["Barang terdaftar", state.products.length, state.products.length, state.products.length],
    ["Unit terjual", units, state.sales.length ? units / state.sales.length : 0, Math.max(0, ...state.sales.map((sale) => sale.quantity))],
    ["Pemasukan", formatCurrency(totalRevenue), state.sales.length ? formatCurrency(totalRevenue / state.sales.length) : formatCurrency(0), formatCurrency(Math.max(0, ...state.sales.map((sale) => sale.amount)))],
    ["Margin produk", `${avgMargin.toFixed(1)}%`, `${avgMargin.toFixed(1)}%`, `${Math.max(0, ...productMargins).toFixed(1)}%`],
  ];
  $("#analysis-rows").innerHTML = values.map(([name, count, average, highest]) => `<tr><td>${name}</td><td>${count}</td><td>${typeof average === "number" ? average.toLocaleString("id-ID", { maximumFractionDigits: 1 }) : average}</td><td>${highest}</td><td>-</td></tr>`).join("");
  $("#sales-analysis-copy").textContent = `${state.sales.length} transaksi mencatat ${units} unit barang dengan total pemasukan ${formatCurrency(totalRevenue)}.`;
  $("#sales-insights").innerHTML = [
    ["Barang terjual", `${units} unit`],
    ["Transaksi", String(state.sales.length)],
    ["Rata-rata transaksi", formatCurrency(state.sales.length ? totalRevenue / state.sales.length : 0)],
  ].map(([label, value]) => `<article class="insight-card"><span>${label}</span><strong>${value}</strong></article>`).join("");

  const expenses = sum(state.expenses, "amount");
  const grossProfit = state.sales.reduce((total, sale) => total + ((sale.unitPrice - sale.unitCost) * sale.quantity), 0);
  $("#finance-analysis-copy").textContent = `Pemasukan ${formatCurrency(totalRevenue)} dikurangi pengeluaran ${formatCurrency(expenses)}.`;
  $("#finance-insights").innerHTML = [
    ["Pemasukan", formatCurrency(totalRevenue)],
    ["Pengeluaran", formatCurrency(expenses)],
    ["Laba kotor penjualan", formatCurrency(grossProfit)],
  ].map(([label, value]) => `<article class="insight-card"><span>${label}</span><strong>${value}</strong></article>`).join("");

  $("#correlation-rows").innerHTML = state.products.map((product) => {
    const sold = sum(state.sales.filter((sale) => sale.productId === product.id), "quantity");
    const indication = product.stock <= product.minimum ? "Perlu dipantau" : "Stok cukup";
    return `<tr><td>${escapeHTML(product.name)}</td><td>${product.stock}</td><td>${sold}</td><td>${indication}</td></tr>`;
  }).join("");
  $("#forecast-list").innerHTML = state.products.map((product) => {
    const sold = sum(state.sales.filter((sale) => sale.productId === product.id), "quantity");
    const average = sold / 30;
    return { product, average };
  }).sort((a, b) => b.average - a.average).slice(0, 6)
    .map(({ product, average }) => `<article class="insight-card"><span>${escapeHTML(product.name)}</span><strong>${average.toFixed(1)} unit/hari</strong><small class="muted">Stok saat ini ${product.stock}</small></article>`).join("");
  drawTrendChart($("#analysis-chart"), 30);
}

function renderMargins() {
  const sorted = [...state.products].sort((a, b) => marginPercent(b) - marginPercent(a));
  const margins = sorted.map(marginPercent);
  $("#margin-average").textContent = `${(margins.length ? margins.reduce((a, b) => a + b, 0) / margins.length : 0).toFixed(1)}%`;
  $("#margin-highest").textContent = sorted[0]?.name || "-";
  $("#margin-lowest").textContent = sorted.at(-1)?.name || "-";
  $("#margin-rows").innerHTML = sorted.map((product) => {
    const margin = marginPercent(product);
    return `<tr><td>${escapeHTML(product.name)}</td><td>${escapeHTML(product.category)}</td><td>${formatCurrency(product.cost)}</td><td>${formatCurrency(product.price)}</td><td>${margin.toFixed(1)}%</td><td><span class="margin-meter"><progress max="100" value="${Math.min(100, margin)}"></progress>${margin.toFixed(0)}%</span></td></tr>`;
  }).join("");
}

function filteredReportSales() {
  const from = $("#report-from").value;
  const to = $("#report-to").value;
  const category = $("#report-category").value;
  return [...state.sales].filter((sale) => {
    const product = getProduct(sale.productId);
    const saleCategory = product?.category || sale.category;
    return (!from || sale.date >= from) && (!to || sale.date <= to) && (!category || saleCategory === category);
  }).sort((a, b) => b.date.localeCompare(a.date));
}

function renderReport() {
  renderCategoryFilters();
  const sales = filteredReportSales();
  const totalSales = sum(sales, "amount");
  const expenses = state.expenses.filter((expense) => (!$("#report-from").value || expense.date >= $("#report-from").value)
    && (!$("#report-to").value || expense.date <= $("#report-to").value));
  const totalExpenses = sum(expenses, "amount");
  $("#report-sales-total").textContent = formatCurrency(totalSales);
  $("#report-expense-total").textContent = formatCurrency(totalExpenses);
  $("#report-profit-total").textContent = formatCurrency(totalSales - totalExpenses);
  $("#report-rows").innerHTML = sales.length ? sales.map((sale) => {
    const product = getProduct(sale.productId);
    return `<tr><td>${formatDate(sale.date)}</td><td>${escapeHTML(sale.productName)}</td><td>${escapeHTML(product?.category || sale.category || "-")}</td><td>${sale.quantity}</td><td>${escapeHTML(sale.payment)}</td><td>${formatCurrency(sale.amount)}</td></tr>`;
  }).join("") : '<tr><td class="empty-row" colspan="6">Tidak ada transaksi pada rentang ini.</td></tr>';
  $("#report-summary").textContent = `${sales.length} transaksi · Total pemasukan ${formatCurrency(totalSales)}`;
}

function renderSettings() {
  $("#settings-product-count").textContent = String(state.products.length);
  $("#settings-sale-count").textContent = String(state.sales.length);
  $("#settings-expense-count").textContent = String(state.expenses.length);
}

function renderAll() {
  renderHeader();
  renderDashboard();
  renderInventory();
  renderSales();
  renderExpenses();
  renderExpenseProductOptions();
  renderAnalysis();
  renderMargins();
  renderReport();
  renderSettings();
}

function activateView(viewName) {
  const pages = $$("[data-page]");
  const selected = pages.some((page) => page.dataset.page === viewName) ? viewName : "dashboard";
  pages.forEach((page) => { page.hidden = page.dataset.page !== selected; });
  $$(".nav-link[data-view]").forEach((link) => {
    const active = link.dataset.view === selected;
    link.classList.toggle("is-active", active);
    if (active) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
  $("#sidebar").classList.remove("is-open");
  document.title = `${selected === "dashboard" ? "Dashboard" : selected[0].toUpperCase() + selected.slice(1)} · ${APP_TITLE}`;
}

function currentViewFromHash() {
  return location.hash.slice(1).replace(/^\/+/, "").split("?")[0] || "dashboard";
}

function openDialog(dialogId) {
  const dialog = $(`#${dialogId}`);
  if (!dialog) return;
  const form = $("form", dialog);
  if (dialogId === "sale-dialog") {
    $("#sale-form").reset();
    renderSaleProductOptions();
    if (form.elements.date) form.elements.date.value = localDate();
    updateSaleHint();
  }
  if (dialogId === "expense-dialog") {
    form.reset();
    if (form.elements.date) form.elements.date.value = localDate();
    toggleStockPurchaseFields();
  }
  dialog.showModal();
}

function closeDialog(dialog) {
  dialog.close();
}

function updateSaleHint() {
  const product = getProduct($("#sale-product")?.value);
  const hint = $("#sale-stock-hint");
  if (!hint) return;
  hint.textContent = product ? `Stok tersedia: ${product.stock} · Harga satuan ${formatCurrency(product.price)}` : "Pilih barang untuk melihat stok dan harga.";
}

function resetProductForm() {
  const form = $("#product-form");
  form.reset();
  form.elements.id.value = "";
  $("#product-dialog-title").textContent = "Tambah Barang";
}

function editProduct(productId) {
  const product = getProduct(productId);
  if (!product) return;
  const form = $("#product-form");
  form.elements.id.value = product.id;
  form.elements.name.value = product.name;
  form.elements.sku.value = product.sku;
  form.elements.category.value = product.category;
  form.elements.stock.value = product.stock;
  form.elements.minimum.value = product.minimum;
  form.elements.cost.value = product.cost;
  form.elements.price.value = product.price;
  $("#product-dialog-title").textContent = "Edit Barang";
  openDialog("product-dialog");
}

function handleProductSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const values = new FormData(form);
  const editingId = values.get("id");
  const product = {
    id: editingId || createId("prd"),
    name: String(values.get("name")).trim(),
    sku: String(values.get("sku")).trim(),
    category: String(values.get("category")),
    stock: Number(values.get("stock")),
    minimum: Number(values.get("minimum")),
    cost: Number(values.get("cost")),
    price: Number(values.get("price")),
  };
  if (!product.name || !product.sku || product.price < 0 || product.cost < 0) {
    showToast("Periksa kembali data barang.", true);
    return;
  }
  if (state.products.some((item) => item.sku.toLowerCase() === product.sku.toLowerCase() && item.id !== editingId)) {
    showToast("SKU tersebut sudah digunakan barang lain.", true);
    return;
  }
  if (editingId) {
    state.products = state.products.map((item) => item.id === editingId ? product : item);
  } else {
    state.products.push(product);
  }
  saveState();
  renderAll();
  closeDialog($("#product-dialog"));
  resetProductForm();
  showToast(editingId ? "Barang berhasil diperbarui." : "Barang berhasil ditambahkan.");
}

function handleSaleSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const values = new FormData(form);
  const product = getProduct(String(values.get("productId")));
  const quantity = Number(values.get("quantity"));
  if (!product) {
    showToast("Pilih barang yang masih tersedia.", true);
    return;
  }
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > product.stock) {
    showToast(`Jumlah melebihi stok tersedia (${product.stock}).`, true);
    return;
  }
  state.sales.push({
    id: createId("sale"),
    date: String(values.get("date")),
    productId: product.id,
    productName: product.name,
    sku: product.sku,
    category: product.category,
    quantity,
    unitPrice: product.price,
    unitCost: product.cost,
    amount: product.price * quantity,
    payment: String(values.get("payment")),
  });
  product.stock -= quantity;
  saveState();
  renderAll();
  closeDialog($("#sale-dialog"));
  form.reset();
  showToast("Penjualan berhasil dicatat dan stok diperbarui.");
}

function handleExpenseSubmit(event) {
  event.preventDefault();
  const values = new FormData(event.currentTarget);
  const category = String(values.get("category"));
  const product = category === "Pembelian Stok" ? getProduct(String(values.get("productId"))) : null;
  const quantity = category === "Pembelian Stok" ? Number(values.get("quantity")) : 0;
  if (category === "Pembelian Stok" && (!product || !Number.isInteger(quantity) || quantity < 1)) {
    showToast("Pilih barang dan masukkan jumlah stok yang valid.", true);
    return;
  }
  if (product) product.stock += quantity;
  state.expenses.push({
    id: createId("exp"),
    date: String(values.get("date")),
    description: String(values.get("description")).trim(),
    category,
    note: String(values.get("note") || "").trim(),
    amount: Number(values.get("amount")),
    productId: product?.id || "",
    quantity,
  });
  saveState();
  renderAll();
  closeDialog($("#expense-dialog"));
  event.currentTarget.reset();
  showToast("Pengeluaran berhasil dicatat.");
}

function deleteProduct(productId) {
  const product = getProduct(productId);
  if (!product || !window.confirm(`Hapus barang "${product.name}"?`)) return;
  state.products = state.products.filter((item) => item.id !== productId);
  saveState();
  renderAll();
  showToast("Barang berhasil dihapus.");
}

function deleteSale(saleId) {
  const sale = state.sales.find((item) => item.id === saleId);
  if (!sale || !window.confirm("Hapus catatan penjualan ini? Stok barang akan dikembalikan.")) return;
  const product = getProduct(sale.productId);
  if (product) product.stock += sale.quantity;
  state.sales = state.sales.filter((item) => item.id !== saleId);
  saveState();
  renderAll();
  showToast("Penjualan dihapus dan stok dikembalikan.");
}

function deleteExpense(expenseId) {
  const expense = state.expenses.find((item) => item.id === expenseId);
  if (!expense || !window.confirm(`Hapus catatan "${expense.description}"?`)) return;
  const product = expense.productId && getProduct(expense.productId);
  if (product && product.stock < expense.quantity) {
    showToast("Stok tidak cukup untuk membatalkan pembelian ini. Catat penyesuaian stok terlebih dahulu.", true);
    return;
  }
  if (product) product.stock -= expense.quantity;
  state.expenses = state.expenses.filter((item) => item.id !== expenseId);
  saveState();
  renderAll();
  showToast("Catatan pengeluaran dihapus.");
}

function exportJson() {
  downloadFile(`smart-stock-backup-${localDate()}.json`, JSON.stringify(state, null, 2), "application/json");
}

function exportCsv() {
  const rows = [
    ["Tanggal", "Barang", "SKU", "Kategori", "Jumlah", "Metode", "Total"],
    ...filteredReportSales().map((sale) => [
      sale.date,
      sale.productName,
      sale.sku,
      getProduct(sale.productId)?.category || sale.category || "",
      sale.quantity,
      sale.payment,
      sale.amount,
    ]),
  ];
  const csv = `\uFEFF${rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\r\n")}`;
  downloadFile(`laporan-penjualan-${localDate()}.csv`, csv, "text/csv;charset=utf-8");
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

async function restoreBackup(file) {
  if (!file) return;
  try {
    const parsed = JSON.parse(await file.text());
    if (!isValidState(parsed)
      || !parsed.products.every((product) => product.id && product.sku && Number.isFinite(Number(product.stock)))
      || !parsed.sales.every((sale) => sale.id && Number.isFinite(Number(sale.amount)))
      || !parsed.expenses.every((expense) => expense.id && Number.isFinite(Number(expense.amount)))) {
      throw new Error("Format backup tidak valid atau datanya tidak lengkap.");
    }
    state = parsed;
    saveState();
    renderAll();
    showToast("Backup berhasil dipulihkan.");
  } catch (error) {
    console.error("Gagal memulihkan backup:", error);
    showToast(`Backup gagal dipulihkan: ${error.message}`, true);
  }
}

function setAnalysisTab(tabName) {
  $$("[data-analysis-tab]").forEach((button) => {
    const active = button.dataset.analysisTab === tabName;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", String(active));
  });
  $$("[data-analysis-panel]").forEach((panel) => {
    panel.hidden = panel.dataset.analysisPanel !== tabName;
  });
}

function showSearchResults(query) {
  const results = $("#search-results");
  const term = query.trim().toLocaleLowerCase("id-ID");
  if (!term) {
    results.hidden = true;
    results.innerHTML = "";
    return;
  }
  const matches = state.products.filter((product) => `${product.name} ${product.sku}`.toLocaleLowerCase("id-ID").includes(term)).slice(0, 6);
  results.innerHTML = matches.length ? matches.map((product) => `
    <button class="search-result" type="button" data-search-product="${escapeHTML(product.id)}">${escapeHTML(product.name)}<small>${escapeHTML(product.sku)} · stok ${product.stock}</small></button>`).join("")
    : '<div class="search-result">Barang tidak ditemukan.</div>';
  results.hidden = false;
}

function bindEvents() {
  document.addEventListener("click", (event) => {
    const viewLink = event.target.closest("[data-view]");
    if (viewLink) {
      const view = viewLink.dataset.view;
      if (location.hash === `#${view}`) activateView(view);
      return;
    }

    const openButton = event.target.closest("[data-open-dialog]");
    if (openButton) {
      if (openButton.dataset.openDialog === "product-dialog") resetProductForm();
      openDialog(openButton.dataset.openDialog);
      return;
    }

    const closeButton = event.target.closest("[data-close-dialog]");
    if (closeButton) {
      closeDialog(closeButton.closest("dialog"));
      return;
    }

    const editButton = event.target.closest("[data-edit-product]");
    if (editButton) {
      editProduct(editButton.dataset.editProduct);
      return;
    }

    const deleteProductButton = event.target.closest("[data-delete-product]");
    if (deleteProductButton) {
      deleteProduct(deleteProductButton.dataset.deleteProduct);
      return;
    }

    const deleteSaleButton = event.target.closest("[data-delete-sale]");
    if (deleteSaleButton) {
      deleteSale(deleteSaleButton.dataset.deleteSale);
      return;
    }

    const deleteExpenseButton = event.target.closest("[data-delete-expense]");
    if (deleteExpenseButton) {
      deleteExpense(deleteExpenseButton.dataset.deleteExpense);
      return;
    }

    const rangeButton = event.target.closest("[data-range]");
    if (rangeButton) {
      $$("[data-range]").forEach((button) => button.classList.toggle("is-selected", button === rangeButton));
      renderDashboard();
      return;
    }

    const analysisButton = event.target.closest("[data-analysis-tab]");
    if (analysisButton) {
      setAnalysisTab(analysisButton.dataset.analysisTab);
      return;
    }

    const searchResult = event.target.closest("[data-search-product]");
    if (searchResult) {
      location.hash = "#inventaris";
      $("#inventory-search").value = getProduct(searchResult.dataset.searchProduct)?.name || "";
      renderInventory();
      $("#search-results").hidden = true;
      $("#global-search").value = "";
      return;
    }

    if (!event.target.closest(".global-search")) $("#search-results").hidden = true;
  });

  window.addEventListener("hashchange", () => activateView(currentViewFromHash()));
  $("#sidebar-toggle").addEventListener("click", () => $("#sidebar").classList.toggle("is-open"));
  $("#global-search").addEventListener("input", (event) => showSearchResults(event.currentTarget.value));
  $("#global-search").addEventListener("keydown", (event) => {
    if (event.key === "Escape") $("#search-results").hidden = true;
  });
  document.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      $("#global-search").focus();
    }
  });

  $("#product-form").addEventListener("submit", handleProductSubmit);
  $("#sale-form").addEventListener("submit", handleSaleSubmit);
  $("#expense-form").addEventListener("submit", handleExpenseSubmit);
  $("#sale-product").addEventListener("change", updateSaleHint);
  $("#sale-form").elements.quantity.addEventListener("input", updateSaleHint);
  $("#expense-category").addEventListener("change", toggleStockPurchaseFields);
  $("#expense-product").addEventListener("change", updatePurchaseAmount);
  $("#expense-quantity").addEventListener("input", updatePurchaseAmount);
  $(".notification-button").addEventListener("click", () => {
    $("#stock-filter").value = "low";
    location.hash = "#inventaris";
    renderInventory();
  });

  $("#inventory-search").addEventListener("input", renderInventory);
  $("#category-filter").addEventListener("change", renderInventory);
  $("#stock-filter").addEventListener("change", renderInventory);
  $("#inventory-sort").addEventListener("change", renderInventory);
  ["sales-search", "sales-from", "sales-to"].forEach((id) => $(`#${id}`).addEventListener("input", renderSales));
  $("#payment-filter").addEventListener("change", renderSales);
  ["expense-search", "expenses-from", "expenses-to"].forEach((id) => $(`#${id}`).addEventListener("input", renderExpenses));
  $("#expense-category-filter").addEventListener("change", renderExpenses);
  ["report-from", "report-to"].forEach((id) => $(`#${id}`).addEventListener("input", renderReport));
  $("#report-category").addEventListener("change", renderReport);

  $("#profile-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    state.settings.storeName = String(values.get("storeName")).trim();
    state.settings.ownerName = String(values.get("ownerName")).trim() || "Pemilik Toko";
    saveState();
    renderHeader();
    showToast("Profil toko berhasil disimpan.");
  });
  $("#restore-file").addEventListener("change", (event) => restoreBackup(event.currentTarget.files[0]));
  $("#load-demo").addEventListener("click", () => {
    if (!window.confirm("Muat ulang data demo? Data tersimpan saat ini akan diganti.")) return;
    state = createDemoState();
    saveState();
    renderAll();
    showToast("Data demo berhasil dimuat.");
  });
  $("#clear-data").addEventListener("click", () => {
    if (!window.confirm("Kosongkan semua barang dan transaksi? Aksi ini tidak dapat dibatalkan.")) return;
    state.products = [];
    state.sales = [];
    state.expenses = [];
    saveState();
    renderAll();
    showToast("Data barang dan transaksi berhasil dikosongkan.");
  });
  $$("[data-export='json']").forEach((button) => button.addEventListener("click", exportJson));
  $$("[data-export='csv']").forEach((button) => button.addEventListener("click", exportCsv));
  $$("[data-print]").forEach((button) => button.addEventListener("click", () => window.print()));

  $$("dialog").forEach((dialog) => {
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
  });
}

function startApplication() {
  renderAll();
  bindEvents();
  activateView(currentViewFromHash());
  setAnalysisTab("deskriptif");
}

// ===== TAHAP A: login + database Supabase =====
const SUPABASE_URL = "https://kvxraitlhladltfjyhba.supabase.co";
const SUPABASE_KEY = "sb_publishable_zRXtWPuXbgoy74u1nX1uRA_XkMRKxaC";

let db = null;
let shopId = null;
let userRole = null;

function friendlyError(error) {
  const message = String(error?.message || "");
  if (error?.code === "23505") return "SKU tersebut sudah digunakan barang lain.";
  if (error?.code === "42501") return "Akun Anda tidak diizinkan melakukan aksi ini.";
  if (message.includes("Failed to fetch")) return "Tidak ada koneksi internet.";
  return message || "Terjadi kesalahan.";
}

function notAvailable() { showToast("Fitur ini dipasang di tahap B.", true); }

const mapProduct = (r) => ({
  id: r.id, sku: r.sku, name: r.name, category: r.category,
  stock: Number(r.stock), minimum: Number(r.minimum),
  cost: Number(r.cost), price: Number(r.price),
});
const mapSale = (r) => ({
  id: r.id, date: r.sale_date, productId: r.product_id, productName: r.product_name,
  sku: r.sku || "", category: r.category || "", quantity: Number(r.quantity),
  unitPrice: Number(r.unit_price), unitCost: Number(r.unit_cost),
  amount: Number(r.unit_price) * Number(r.quantity), payment: r.payment,
});
const mapExpense = (r) => ({
  id: r.id, date: r.expense_date, description: r.description, category: r.category,
  note: r.note || "", amount: Number(r.amount),
  productId: r.product_id || "", quantity: Number(r.quantity) || 0,
});

async function loadData() {
  const [p, s, e] = await Promise.all([
    db.from("products").select("*").eq("shop_id", shopId).order("name"),
    db.from("sales").select("*").eq("shop_id", shopId).order("sale_date", { ascending: false }),
    db.from("expenses").select("*").eq("shop_id", shopId).order("expense_date", { ascending: false }),
  ]);
  const error = p.error || s.error || e.error;
  if (error) throw error;
  state.products = p.data.map(mapProduct);
  state.sales = s.data.map(mapSale);
  state.expenses = e.data.map(mapExpense);
}

function showLogin(message = "") {
  $("#login-error").textContent = message;
  $("#login-screen").style.display = "grid";
}

async function enterApp() {
  const { data: { user } } = await db.auth.getUser();
  const { data: member, error } = await db
    .from("shop_members").select("shop_id, role, shops(name)")
    .eq("user_id", user.id).limit(1).maybeSingle();
  if (error || !member) {
    await db.auth.signOut();
    showLogin("Akun ini belum terdaftar sebagai anggota toko. Hubungi pemilik.");
    return;
  }
  const shop = Array.isArray(member.shops) ? member.shops[0] : member.shops;
  shopId = member.shop_id;
  userRole = member.role;
  state.settings.storeName = shop?.name || DEFAULT_STORE_NAME;
  state.settings.ownerName = user.email;
  await loadData();
  renderAll();
  $("#login-screen").style.display = "none";
}

async function handleLogin(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const values = new FormData(form);
  const button = $("button[type=submit]", form);
  button.disabled = true;
  $("#login-error").textContent = "";
  try {
    const { error } = await db.auth.signInWithPassword({
      email: String(values.get("email")).trim(),
      password: String(values.get("password")),
    });
    if (error) { $("#login-error").textContent = "Email atau kata sandi salah."; return; }
    form.reset();
    await enterApp();
  } catch (error) {
    $("#login-error").textContent = friendlyError(error);
  } finally {
    button.disabled = false;
  }
}

async function handleLogout() {
  await db.auth.signOut();
  state.products = []; state.sales = []; state.expenses = [];
  shopId = null; userRole = null;
  renderAll();
  showLogin();
}

// Fungsi di bawah menimpa fungsi lama bernama sama: yang paling bawah dipakai.
async function handleProductSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const values = new FormData(form);
  const editingId = String(values.get("id") || "");
  const row = {
    name: String(values.get("name")).trim(),
    sku: String(values.get("sku")).trim(),
    category: String(values.get("category")),
    stock: Number(values.get("stock")),
    minimum: Number(values.get("minimum")),
    cost: Number(values.get("cost")),
    price: Number(values.get("price")),
  };
  if (!row.name || !row.sku || !(row.cost >= 0) || !(row.price >= 0)
    || !Number.isInteger(row.stock) || row.stock < 0
    || !Number.isInteger(row.minimum) || row.minimum < 0) {
    showToast("Periksa kembali data barang.", true);
    return;
  }
  const button = $("button[type=submit]", form);
  button.disabled = true;
  try {
    const query = editingId
      ? db.from("products").update(row).eq("id", editingId).eq("shop_id", shopId)
      : db.from("products").insert({ ...row, shop_id: shopId });
    const { data, error } = await query.select();
    if (error) throw error;
    if (!data?.length) throw new Error("Perubahan tidak tersimpan (tidak ada izin atau data tidak ditemukan).");
    await loadData();
    renderAll();
    closeDialog($("#product-dialog"));
    resetProductForm();
    showToast(editingId ? "Barang berhasil diperbarui." : "Barang berhasil ditambahkan.");
  } catch (error) {
    showToast(friendlyError(error), true);
  } finally {
    button.disabled = false;
  }
}

async function deleteProduct(productId) {
  const product = getProduct(productId);
  if (!product || !window.confirm(`Hapus barang "${product.name}"?`)) return;
  const { data, error } = await db.from("products").delete()
    .eq("id", productId).eq("shop_id", shopId).select();
  if (error) { showToast(friendlyError(error), true); return; }
  if (!data?.length) { showToast("Barang tidak terhapus (tidak ada izin).", true); return; }
  await loadData();
  renderAll();
  showToast("Barang berhasil dihapus.");
}

async function handleSaleSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const values = new FormData(form);
  const product = getProduct(String(values.get("productId")));
  const quantity = Number(values.get("quantity"));
  if (!product) { showToast("Pilih barang yang masih tersedia.", true); return; }
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > product.stock) {
    showToast(`Jumlah melebihi stok tersedia (${product.stock}).`, true);
    return;
  }
  const button = $("button[type=submit]", form);
  button.disabled = true;
  try {
    const { error } = await db.rpc("record_sale", {
      p_shop: shopId, p_product_id: product.id, p_quantity: quantity,
      p_payment: String(values.get("payment")), p_date: String(values.get("date")),
    });
    if (error) throw error;
    await loadData();
    renderAll();
    closeDialog($("#sale-dialog"));
    form.reset();
    showToast("Penjualan berhasil dicatat dan stok diperbarui.");
  } catch (error) {
    showToast(friendlyError(error), true);
    loadData().then(renderAll).catch(() => {});
  } finally {
    button.disabled = false;
  }
}

// Dimatikan sampai tahap B
function handleExpenseSubmit(event) { event.preventDefault(); notAvailable(); }
function deleteSale() { notAvailable(); }
function deleteExpense() { notAvailable(); }
function restoreBackup() { notAvailable(); }

async function boot() {
  renderAll();
  bindEvents();
  activateView(currentViewFromHash());
  setAnalysisTab("deskriptif");
  $("#login-form").addEventListener("submit", handleLogin);
  $("#logout-button").addEventListener("click", handleLogout);
  ["#load-demo", "#clear-data", "#restore-file"].forEach((selector) => { $(selector).disabled = true; });
  $$("#profile-form input, #profile-form button").forEach((element) => { element.disabled = true; });
  if (!window.supabase) { showLogin("Library Supabase gagal dimuat. Periksa koneksi internet."); return; }
  db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  const { data } = await db.auth.getSession();
  if (!data.session) { showLogin(); return; }
  try { await enterApp(); } catch (error) { showLogin(friendlyError(error)); }
}

boot();
