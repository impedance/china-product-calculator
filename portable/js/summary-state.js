/**
 * summary-state.js
 * Manages the in-memory rows for the Summary (Свод) tab.
 * Persists to localStorage under key 'landedCalc.summaryRows'.
 */

const STORAGE_KEY = 'landedCalc.summaryRows';

// Each row shape:
// {
//   id: string,          // unique id, use crypto.randomUUID() or Date.now()
//   productName: string,
//   quantity: number,
//   unitCost: number,    // totalCostRub per unit
//   retailPrice: number, // retailPriceRub per unit
//   profitPerUnit: number
// }
// Derived (computed, not stored):
//   totalCost = quantity * unitCost
//   totalRevenue = quantity * retailPrice
//   totalProfit = quantity * profitPerUnit
//   margin = totalProfit / totalRevenue

let rows = [];

const listeners = new Set();

function notify() {
  listeners.forEach(fn => {
    try { fn(getRows()); } catch (e) { console.error(e); }
  });
}

function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function getRows() {
  return rows.map(r => ({ ...r }));
}

function addRow(row) {
  rows.push({
    id: String(Date.now()),
    productName: row.productName || 'Новый товар',
    quantity: row.quantity ?? 0,
    unitCost: row.unitCost ?? 0,
    retailPrice: row.retailPrice ?? 0,
    profitPerUnit: row.profitPerUnit ?? 0
  });
  _persist();
  notify();
}

function deleteRow(id) {
  rows = rows.filter(r => r.id !== id);
  _persist();
  notify();
}

function updateRow(id, updates) {
  rows = rows.map(r => r.id === id ? { ...r, ...updates } : r);
  _persist();
  notify();
}

function getTotals() {
  const totalCost = rows.reduce((s, r) => s + r.quantity * r.unitCost, 0);
  const totalRevenue = rows.reduce((s, r) => s + r.quantity * r.retailPrice, 0);
  const totalProfit = rows.reduce((s, r) => s + r.quantity * r.profitPerUnit, 0);
  const margin = totalRevenue > 0 ? totalProfit / totalRevenue : 0;
  return { totalCost, totalRevenue, totalProfit, margin };
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) rows = JSON.parse(raw);
  } catch (e) {
    rows = [];
  }
}

function _persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  } catch (e) {
    console.warn('summary-state: failed to persist', e);
  }
}