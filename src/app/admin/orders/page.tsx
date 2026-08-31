'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShoppingBag, Search, ChevronLeft, ChevronRight, RefreshCw,
  Eye, Loader2, AlertCircle, Calendar, Filter,
} from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/utils';
import { useAdminPath } from '@/lib/useAdminPath';

const ORDER_STATUS_COLORS: Record<string, string> = {
  PENDING:          'bg-amber-100 text-amber-800 border-amber-200',
  CONFIRMED:        'bg-blue-100 text-blue-800 border-blue-200',
  PROCESSING:       'bg-indigo-100 text-indigo-800 border-indigo-200',
  PACKED:           'bg-purple-100 text-purple-800 border-purple-200',
  SHIPPED:          'bg-sky-100 text-sky-800 border-sky-200',
  OUT_FOR_DELIVERY: 'bg-teal-100 text-teal-800 border-teal-200',
  DELIVERED:        'bg-emerald-100 text-emerald-800 border-emerald-200',
  CANCELLED:        'bg-rose-100 text-rose-800 border-rose-200',
};

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  PENDING:  'bg-slate-100 text-slate-600 border-slate-200',
  PAID:     'bg-emerald-100 text-emerald-700 border-emerald-200',
  FAILED:   'bg-rose-100 text-rose-700 border-rose-200',
  REFUNDED: 'bg-amber-100 text-amber-700 border-amber-200',
};

const ORDER_STATUSES = ['PENDING','CONFIRMED','PROCESSING','PACKED','SHIPPED','OUT_FOR_DELIVERY','DELIVERED','CANCELLED'];
const PAYMENT_STATUSES = ['PENDING','PAID','FAILED','REFUNDED'];
const PAGE_SIZE = 15;

export default function AdminOrdersPage() {
  const paths = useAdminPath();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [page, setPage] = useState(1);

  const fetchOrders = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      if (data.orders) setOrders(data.orders);
      else setError('Failed to load orders');
    } catch {
      setError('Network error loading orders');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const filtered = orders.filter((o) => {
    const orderNum = (o.order_number || o.orderNumber || '').toString();
    const custName = (o.shipping_name || o.shippingName || '').toLowerCase();
    const custPhone = (o.shipping_phone || o.shippingPhone || '').toString();
    const orderStat = (o.order_status || o.orderStatus || 'PENDING').toUpperCase();
    const payStat = (o.payment_status || o.paymentStatus || 'PENDING').toUpperCase();

    const matchSearch = !search ||
      orderNum.toLowerCase().includes(search.toLowerCase()) ||
      custName.includes(search.toLowerCase()) ||
      custPhone.includes(search);

    const matchStatus = !statusFilter || orderStat === statusFilter;
    const matchPayment = !paymentFilter || payStat === paymentFilter;

    return matchSearch && matchStatus && matchPayment;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-5 max-w-screen-xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Orders</h1>
          <p className="text-xs text-slate-500 mt-0.5">{orders.length} total orders</p>
        </div>
        <button onClick={fetchOrders} className="flex items-center gap-2 text-sm text-eco-700 font-medium border border-eco-200 px-3 py-2 rounded-lg hover:bg-eco-50 transition-colors">
          <RefreshCw className="w-4 h-4" />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-xl border border-eco-100 px-4 py-3 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by order #, customer name or phone…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-2 text-sm border border-eco-200 rounded-lg bg-canvas-50 focus:outline-none focus:ring-2 focus:ring-eco-500"
          />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="text-sm border border-eco-200 rounded-lg px-3 py-2 bg-canvas-50 focus:outline-none focus:ring-2 focus:ring-eco-500">
          <option value="">All Statuses</option>
          {ORDER_STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
        <select value={paymentFilter} onChange={(e) => { setPaymentFilter(e.target.value); setPage(1); }} className="text-sm border border-eco-200 rounded-lg px-3 py-2 bg-canvas-50 focus:outline-none focus:ring-2 focus:ring-eco-500">
          <option value="">All Payments</option>
          {PAYMENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-eco-100 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 animate-spin text-eco-600" />
            <span className="ml-2 text-sm text-slate-500">Loading orders…</span>
          </div>
        ) : paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <ShoppingBag className="w-12 h-12 mb-3 text-eco-200" />
            <p className="font-semibold text-sm text-slate-600">{filtered.length === 0 && orders.length > 0 ? 'No orders match your filters' : 'No orders yet'}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-eco-100 bg-canvas-50 text-xs text-slate-500 font-semibold">
                    <th className="text-left py-3 px-4">Order #</th>
                    <th className="text-left py-3 px-4">Customer</th>
                    <th className="text-left py-3 px-4 hidden md:table-cell">Date</th>
                    <th className="text-left py-3 px-4">Amount</th>
                    <th className="text-left py-3 px-4">Payment</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-right py-3 px-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-eco-50">
                  {paginated.map((ord) => {
                    const orderNum = ord.order_number || ord.orderNumber;
                    const custName = ord.shipping_name || ord.shippingName || ord.user?.name || 'Customer';
                    const custPhone = ord.shipping_phone || ord.shippingPhone || '';
                    const orderDate = ord.created_at || ord.createdAt;
                    const totalAmt = ord.total_amount ?? ord.totalAmount;
                    const payStat = (ord.payment_status || ord.paymentStatus || 'PENDING').toUpperCase();
                    const orderStat = (ord.order_status || ord.orderStatus || 'PENDING').toUpperCase();

                    return (
                      <tr key={ord.id} className="hover:bg-canvas-50 transition-colors cursor-pointer" onClick={() => window.location.href = `${paths.orders}/${ord.id}`}>
                        <td className="py-3 px-4 font-semibold text-eco-800 text-xs">#{orderNum}</td>
                        <td className="py-3 px-4">
                          <p className="font-medium text-slate-900 text-xs truncate max-w-[140px]">{custName}</p>
                          <p className="text-[11px] text-slate-400">{custPhone}</p>
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-400 hidden md:table-cell">{formatDate(orderDate)}</td>
                        <td className="py-3 px-4 font-semibold text-xs text-slate-900">{formatPrice(totalAmt)}</td>
                        <td className="py-3 px-4">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${PAYMENT_STATUS_COLORS[payStat] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                            {payStat}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${ORDER_STATUS_COLORS[orderStat] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                            {orderStat.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <Link
                            href={`${paths.orders}/${ord.id}`}
                            className="inline-flex items-center gap-1 text-xs text-eco-700 font-medium hover:text-eco-900 px-2.5 py-1.5 border border-eco-200 rounded-lg hover:bg-eco-50 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">View</span>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
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
