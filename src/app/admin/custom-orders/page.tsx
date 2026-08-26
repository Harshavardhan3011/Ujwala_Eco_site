'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Search, MessageCircle, Loader2, AlertCircle, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { formatDate } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = {
  NEW:             'bg-blue-100 text-blue-800 border-blue-200',
  CONTACTED:       'bg-amber-100 text-amber-800 border-amber-200',
  QUOTATION_SENT:  'bg-purple-100 text-purple-800 border-purple-200',
  CONFIRMED:       'bg-emerald-100 text-emerald-800 border-emerald-200',
  IN_PRODUCTION:   'bg-indigo-100 text-indigo-800 border-indigo-200',
  COMPLETED:       'bg-emerald-100 text-emerald-900 border-emerald-300',
  CANCELLED:       'bg-rose-100 text-rose-800 border-rose-200',
};

const STATUSES = ['NEW','CONTACTED','QUOTATION_SENT','CONFIRMED','IN_PRODUCTION','COMPLETED','CANCELLED'];
const PAGE_SIZE = 10;

export default function AdminCustomOrdersPage() {
  const [customOrders, setCustomOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchCustomOrders = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/custom-orders');
      const data = await res.json();
      if (data.customOrders) setCustomOrders(data.customOrders);
      else setError('Failed to load custom orders');
    } catch { setError('Network error'); } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchCustomOrders(); }, []);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await fetch(`/api/custom-orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      fetchCustomOrders();
    } catch { /* ignore */ }
  };

  const filtered = customOrders.filter(co => {
    const matchSearch = !search ||
      co.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      co.phone?.includes(search) ||
      co.productType?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || co.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-5 max-w-screen-xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Custom Orders</h1>
          <p className="text-xs text-slate-500 mt-0.5">{customOrders.length} requests total</p>
        </div>
        <button onClick={fetchCustomOrders} className="flex items-center gap-2 text-sm text-eco-700 font-medium border border-eco-200 px-3 py-2 rounded-lg hover:bg-eco-50 transition-colors">
          <RefreshCw className="w-4 h-4" />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-eco-100 px-4 py-3 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, phone or product type…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-2 text-sm border border-eco-200 rounded-lg bg-canvas-50 focus:outline-none focus:ring-2 focus:ring-eco-500"
          />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="text-sm border border-eco-200 rounded-lg px-3 py-2 bg-canvas-50 focus:outline-none focus:ring-2 focus:ring-eco-500">
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4" />{error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-eco-100 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 animate-spin text-eco-600" />
            <span className="ml-2 text-sm text-slate-500">Loading…</span>
          </div>
        ) : paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <FileText className="w-12 h-12 mb-3 text-eco-200" />
            <p className="font-semibold text-sm text-slate-600">No custom requests yet</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-eco-100 bg-canvas-50 text-xs text-slate-500 font-semibold">
                    <th className="text-left py-3 px-4">Customer</th>
                    <th className="text-left py-3 px-4">Product Type</th>
                    <th className="text-left py-3 px-4 hidden md:table-cell">Qty</th>
                    <th className="text-left py-3 px-4 hidden lg:table-cell">Date</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-right py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-eco-50">
                  {paginated.map((co) => (
                    <React.Fragment key={co.id}>
                      <tr
                        className="hover:bg-canvas-50 cursor-pointer transition-colors"
                        onClick={() => setExpanded(expanded === co.id ? null : co.id)}
                      >
                        <td className="py-3 px-4">
                          <p className="font-semibold text-slate-900 text-xs">{co.customerName}</p>
                          <p className="text-[11px] text-slate-400">{co.phone}</p>
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-700 font-medium">{co.productType}</td>
                        <td className="py-3 px-4 text-xs text-slate-700 hidden md:table-cell">{co.quantity} pcs</td>
                        <td className="py-3 px-4 text-xs text-slate-400 hidden lg:table-cell">{formatDate(co.createdAt)}</td>
                        <td className="py-3 px-4">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_COLORS[co.status] || 'bg-slate-100 text-slate-600'}`}>
                            {co.status?.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            <a
                              href={`https://wa.me/91${(co.phone || '').replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-2.5 py-1.5 rounded-lg transition-colors"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">WhatsApp</span>
                            </a>
                            <select
                              value={co.status}
                              onChange={e => handleUpdateStatus(co.id, e.target.value)}
                              className="text-[11px] border border-eco-200 rounded-lg px-2 py-1.5 bg-canvas-50 focus:outline-none font-semibold text-slate-700"
                            >
                              {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                            </select>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded detail row */}
                      {expanded === co.id && (
                        <tr>
                          <td colSpan={6} className="px-4 pb-4 bg-canvas-50 border-b border-eco-100">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 text-xs">
                              {[
                                { label: 'Event Type', value: co.eventType || 'N/A' },
                                { label: 'Dimensions', value: co.requiredDimensions || 'Standard' },
                                { label: 'Delivery Date', value: co.requiredDeliveryDate || 'Flexible' },
                                { label: 'Email', value: co.email || '—' },
                              ].map(({ label, value }) => (
                                <div key={label}>
                                  <p className="text-slate-400 font-medium">{label}</p>
                                  <p className="font-semibold text-slate-800">{value}</p>
                                </div>
                              ))}
                            </div>
                            {co.customText && (
                              <div className="mt-3 bg-jute-50 border border-jute-200 rounded-lg p-3 text-xs">
                                <span className="font-bold text-jute-800">Custom Text / Matter: </span>
                                <span className="text-slate-700">{co.customText}</span>
                              </div>
                            )}
                            {co.specialInstructions && (
                              <div className="mt-2 text-xs">
                                <span className="font-bold text-slate-700">Special Instructions: </span>
                                <span className="text-slate-600">{co.specialInstructions}</span>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-eco-50 text-xs text-slate-500">
                <span>Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</span>
                <div className="flex items-center gap-1">
                  <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-1.5 rounded-lg disabled:opacity-40 hover:bg-eco-50">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-2 font-medium">{page}/{totalPages}</span>
                  <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="p-1.5 rounded-lg disabled:opacity-40 hover:bg-eco-50">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
