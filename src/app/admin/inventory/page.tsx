'use client';

import React, { useState, useEffect } from 'react';
import { Boxes, Search, Edit2, Check, X, Loader2, AlertCircle } from 'lucide-react';

const STATUS_DISPLAY: Record<string, { label: string; cls: string }> = {
  IN_STOCK:    { label: 'In Stock',     cls: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  LOW_STOCK:   { label: 'Low Stock',    cls: 'bg-amber-100 text-amber-800 border-amber-200' },
  OUT_OF_STOCK:{ label: 'Out of Stock', cls: 'bg-rose-100 text-rose-800 border-rose-200' },
};

export default function AdminInventoryPage() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/inventory');
      const data = await res.json();
      if (data.inventory) setInventory(data.inventory);
    } catch { /* ignore */ } finally { setIsLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSaveStock = async (id: string) => {
    setSaving(true);
    try {
      await fetch(`/api/admin/inventory/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stockQuantity: Number(editValue) }),
      });
      setEditingId(null);
      load();
    } catch { /* ignore */ } finally { setSaving(false); }
  };

  const filtered = inventory.filter(item => {
    const matchSearch = !search ||
      item.name?.toLowerCase().includes(search.toLowerCase()) ||
      item.sku?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || item.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-5 max-w-screen-xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Inventory</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {inventory.filter(i => i.status === 'LOW_STOCK').length} low stock ·{' '}
            {inventory.filter(i => i.status === 'OUT_OF_STOCK').length} out of stock
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-eco-100 px-4 py-3 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or SKU…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-eco-200 rounded-lg bg-canvas-50 focus:outline-none focus:ring-2 focus:ring-eco-500"
          />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="text-sm border border-eco-200 rounded-lg px-3 py-2 bg-canvas-50 focus:outline-none focus:ring-2 focus:ring-eco-500">
          <option value="">All Status</option>
          <option value="IN_STOCK">In Stock</option>
          <option value="LOW_STOCK">Low Stock</option>
          <option value="OUT_OF_STOCK">Out of Stock</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-eco-100 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 animate-spin text-eco-600" />
            <span className="ml-2 text-sm text-slate-500">Loading inventory…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <Boxes className="w-12 h-12 mb-3 text-eco-200" />
            <p className="text-sm font-semibold text-slate-600">No inventory records</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-eco-100 bg-canvas-50 text-xs text-slate-500 font-semibold">
                  <th className="text-left py-3 px-4">Product</th>
                  <th className="text-left py-3 px-4 hidden md:table-cell">SKU</th>
                  <th className="text-left py-3 px-4 hidden lg:table-cell">Category</th>
                  <th className="text-left py-3 px-4">Stock</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-right py-3 px-4">Update</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-eco-50">
                {filtered.map((item) => (
                  <tr key={item.id} className={`hover:bg-canvas-50 transition-colors ${item.status === 'OUT_OF_STOCK' ? 'bg-rose-50/40' : item.status === 'LOW_STOCK' ? 'bg-amber-50/30' : ''}`}>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-canvas-100 border border-eco-100 overflow-hidden shrink-0">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Boxes className="w-4 h-4 text-eco-300" />
                            </div>
                          )}
                        </div>
                        <p className="font-semibold text-slate-900 text-xs truncate max-w-[160px]">{item.name}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-500 hidden md:table-cell">{item.sku}</td>
                    <td className="py-3 px-4 text-xs text-slate-600 hidden lg:table-cell">{item.category}</td>
                    <td className="py-3 px-4">
                      {editingId === item.id ? (
                        <input
                          type="number"
                          min="0"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          className="w-20 border border-eco-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-eco-500"
                          autoFocus
                        />
                      ) : (
                        <span className="font-bold text-xs text-slate-900">{item.stockQuantity} pcs</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_DISPLAY[item.status]?.cls || 'bg-slate-100 text-slate-600'}`}>
                        {STATUS_DISPLAY[item.status]?.label || item.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {editingId === item.id ? (
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleSaveStock(item.id)} disabled={saving} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={() => setEditingId(null)} className="p-1.5 text-slate-400 hover:bg-canvas-100 rounded-lg transition-colors">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setEditingId(item.id); setEditValue(String(item.stockQuantity)); }}
                          className="p-1.5 text-eco-700 hover:bg-eco-50 rounded-lg transition-colors"
                          title="Update stock"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
