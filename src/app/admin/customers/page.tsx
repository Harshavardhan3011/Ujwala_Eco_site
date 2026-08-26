'use client';

import React, { useState, useEffect } from 'react';
import { Users, Search, ShoppingBag, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDate } from '@/lib/utils';

const PAGE_SIZE = 15;

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/admin/customers');
        const data = await res.json();
        if (data.customers) setCustomers(data.customers);
      } catch { /* ignore */ } finally { setIsLoading(false); }
    }
    load();
  }, []);

  const filtered = customers.filter(c =>
    !search ||
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  );
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-5 max-w-screen-xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Customers</h1>
          <p className="text-xs text-slate-500 mt-0.5">{customers.length} registered customers</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-eco-100 px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, or phone…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-2 text-sm border border-eco-200 rounded-lg bg-canvas-50 focus:outline-none focus:ring-2 focus:ring-eco-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-eco-100 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 animate-spin text-eco-600" />
            <span className="ml-2 text-sm text-slate-500">Loading customers…</span>
          </div>
        ) : paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <Users className="w-12 h-12 mb-3 text-eco-200" />
            <p className="text-sm font-semibold text-slate-600">{search ? 'No customers match your search' : 'No customers yet'}</p>
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-eco-100 bg-canvas-50 text-xs text-slate-500 font-semibold">
                  <th className="text-left py-3 px-4">Customer</th>
                  <th className="text-left py-3 px-4 hidden md:table-cell">Phone</th>
                  <th className="text-left py-3 px-4 hidden sm:table-cell">Registered</th>
                  <th className="text-left py-3 px-4">Orders</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-eco-50">
                {paginated.map((c) => (
                  <tr key={c.id} className="hover:bg-canvas-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-eco-100 text-eco-800 font-bold text-sm flex items-center justify-center shrink-0">
                          {(c.name || c.email || 'C')[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 text-xs truncate">{c.name || 'No name'}</p>
                          <p className="text-[11px] text-slate-400 truncate">{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600 hidden md:table-cell">{c.phone || '—'}</td>
                    <td className="py-3 px-4 text-xs text-slate-400 hidden sm:table-cell">{formatDate(c.createdAt)}</td>
                    <td className="py-3 px-4">
                      <span className="flex items-center gap-1 text-xs font-semibold text-eco-800">
                        <ShoppingBag className="w-3.5 h-3.5 text-eco-400" />
                        {c.orderCount}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
