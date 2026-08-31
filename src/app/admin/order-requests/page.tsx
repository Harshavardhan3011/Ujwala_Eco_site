'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  FileText, Search, RefreshCw, Eye, CheckCircle2,
  Clock, AlertCircle, Phone, Mail, MapPin, X, ArrowRight,
  Sparkles, Check, ShoppingBag, Loader2,
} from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/utils';

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  PENDING_CONFIRMATION: {
    label: 'Pending Confirmation',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
  },
  CONTACTED: {
    label: 'Contacted',
    bg: 'bg-sky-50',
    text: 'text-sky-800',
    border: 'border-sky-200',
  },
  QUOTED: {
    label: 'Quoted',
    bg: 'bg-purple-50',
    text: 'text-purple-800',
    border: 'border-purple-200',
  },
  CONFIRMED: {
    label: 'Confirmed',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
  },
  COMPLETED: {
    label: 'Completed',
    bg: 'bg-emerald-100',
    text: 'text-emerald-900',
    border: 'border-emerald-300',
  },
  CANCELLED: {
    label: 'Cancelled',
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-300',
  },
  REJECTED: {
    label: 'Rejected',
    bg: 'bg-rose-50',
    text: 'text-rose-800',
    border: 'border-rose-200',
  },
};

export default function AdminOrderRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [customFinalTotal, setCustomFinalTotal] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    setActionError('');
    try {
      const url = statusFilter !== 'ALL' ? `/api/order-requests?status=${statusFilter}` : '/api/order-requests';
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok && data.requests) {
        setRequests(data.requests);
      } else {
        setActionError(data.error || 'Failed to load order requests');
      }
    } catch (err: any) {
      setActionError(err.message || 'Error fetching order requests');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const filtered = requests.filter((r) => {
    if (!search) return true;
    const query = search.toLowerCase();
    return (
      r.request_number?.toLowerCase().includes(query) ||
      r.customer_name?.toLowerCase().includes(query) ||
      r.customer_email?.toLowerCase().includes(query) ||
      r.customer_phone?.includes(query)
    );
  });

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedRequest) return;
    setIsUpdatingStatus(true);
    setActionError('');
    setActionMessage('');

    try {
      const res = await fetch(`/api/order-requests/${selectedRequest.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update status');

      setActionMessage(`Status updated to ${newStatus}`);
      setSelectedRequest((prev: any) => ({ ...prev, status: newStatus }));
      fetchRequests();
    } catch (err: any) {
      setActionError(err.message || 'Error updating status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleConvertToOrder = async () => {
    if (!selectedRequest) return;
    if (!confirm(`Are you sure you want to convert Request #${selectedRequest.request_number} to a Confirmed Order?`)) return;

    setIsConverting(true);
    setActionError('');
    setActionMessage('');

    try {
      const res = await fetch(`/api/order-requests/${selectedRequest.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          finalConfirmedTotal: customFinalTotal ? parseFloat(customFinalTotal) : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to convert order request');

      setActionMessage(`Successfully converted to Confirmed Order #${data.order.order_number}!`);
      setSelectedRequest((prev: any) => ({
        ...prev,
        status: 'CONFIRMED',
        confirmed_order_id: data.order.id,
        final_confirmed_total: data.order.total_amount,
      }));
      fetchRequests();
    } catch (err: any) {
      setActionError(err.message || 'Error converting request');
    } finally {
      setIsConverting(false);
    }
  };

  const openDetail = (req: any) => {
    setSelectedRequest(req);
    setCustomFinalTotal(String(req.total_amount || ''));
    setActionMessage('');
    setActionError('');
  };

  return (
    <div className="space-y-6 max-w-screen-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-eco-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-eco-700" />
            <h1 className="font-serif font-bold text-xl text-slate-900">Customer Order Requests</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Review incoming product order requests submitted via website & email notifications
          </p>
        </div>

        <button
          onClick={fetchRequests}
          disabled={isLoading}
          className="bg-eco-50 hover:bg-eco-100 text-eco-800 font-bold text-xs px-4 py-2.5 rounded-xl border border-eco-200 transition-colors flex items-center gap-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {actionError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" /> {actionError}
        </div>
      )}

      {actionMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" /> {actionMessage}
        </div>
      )}

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-eco-100 shadow-xs flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Request #, Customer, Email, Phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-canvas-50 border border-eco-200 rounded-xl text-xs focus:outline-none focus:bg-white focus:border-eco-600"
          />
        </div>

        {/* Status Pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs font-bold">
          {['ALL', 'PENDING_CONFIRMATION', 'CONTACTED', 'QUOTED', 'CONFIRMED', 'CANCELLED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-eco-800 text-white shadow-xs'
                  : 'bg-canvas-50 text-slate-600 hover:bg-eco-50 hover:text-eco-800'
              }`}
            >
              {st === 'ALL' ? 'All Requests' : STATUS_CONFIG[st]?.label || st}
            </button>
          ))}
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-eco-100 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-500 font-bold flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-eco-700" /> Loading Order Requests...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <FileText className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No order requests found</p>
            <p className="text-xs text-slate-400">Incoming requests from customers will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-canvas-50 text-slate-500 font-medium border-b border-eco-100">
                <tr>
                  <th className="py-3 px-4">Request #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Delivery Location</th>
                  <th className="py-3 px-4">Items</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-eco-50">
                {filtered.map((req) => {
                  const cfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.PENDING_CONFIRMATION;
                  const totalItems = req.items?.reduce((acc: number, i: any) => acc + (i.quantity || 1), 0) || 0;

                  return (
                    <tr key={req.id} className="hover:bg-canvas-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {req.request_number}
                        {req.email_sent && (
                          <span className="block text-[10px] text-emerald-600 font-sans font-normal">
                            ✉️ Email sent
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <strong className="text-slate-900 block">{req.customer_name}</strong>
                        <span className="text-slate-500 text-[11px] block">{req.customer_phone}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {req.shipping_city}, {req.shipping_state}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-800">{totalItems} pcs</span>
                        <span className="text-[10px] text-slate-400 block">({req.items?.length || 0} unique)</span>
                      </td>
                      <td className="py-3 px-4 font-bold text-eco-900 font-serif text-sm">
                        {formatPrice(req.total_amount)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        {formatDate(req.created_at)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => openDetail(req)}
                          className="bg-eco-50 hover:bg-eco-100 text-eco-800 text-xs font-bold px-3 py-1.5 rounded-lg border border-eco-200 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" /> View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================== */}
      {/* DETAIL MODAL */}
      {/* ========================================== */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-eco-100 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in duration-200 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-eco-800 text-white p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-eco-200 block">
                  Order Request Detail
                </span>
                <h3 className="font-serif font-bold text-lg">{selectedRequest.request_number}</h3>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="text-eco-200 hover:text-white p-1.5 rounded-full hover:bg-eco-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {actionError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-bold">
                  {actionError}
                </div>
              )}
              {actionMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold">
                  {actionMessage}
                </div>
              )}

              {/* Status Bar */}
              <div className="bg-canvas-50 p-4 rounded-2xl border border-eco-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <span className="text-slate-400 block text-[10px]">Current Status</span>
                  <span className="font-bold text-sm text-slate-900">
                    {STATUS_CONFIG[selectedRequest.status]?.label || selectedRequest.status}
                  </span>
                </div>

                {/* Status Changer */}
                <div className="flex items-center gap-2">
                  <select
                    value={selectedRequest.status}
                    onChange={(e) => handleUpdateStatus(e.target.value)}
                    disabled={isUpdatingStatus}
                    className="bg-white border border-eco-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none"
                  >
                    <option value="PENDING_CONFIRMATION">Pending Confirmation</option>
                    <option value="CONTACTED">Contacted</option>
                    <option value="QUOTED">Quoted</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>
              </div>

              {/* Customer Contact Details */}
              <div className="bg-canvas-50 p-4 rounded-2xl border border-eco-100 space-y-3">
                <h4 className="font-serif font-bold text-xs text-slate-900 border-b border-eco-100 pb-1.5">
                  Customer & Shipping Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                  <div>
                    <span className="text-slate-400 block font-medium">Customer Name</span>
                    <span className="font-bold text-slate-800">{selectedRequest.customer_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Email</span>
                    <a href={`mailto:${selectedRequest.customer_email}`} className="font-bold text-eco-700 underline">
                      {selectedRequest.customer_email}
                    </a>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Phone Number</span>
                    <a href={`tel:${selectedRequest.customer_phone}`} className="font-bold text-eco-700 underline">
                      {selectedRequest.customer_phone}
                    </a>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Date Placed</span>
                    <span className="font-bold text-slate-800">{formatDate(selectedRequest.created_at)}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-400 block font-medium">Delivery Address</span>
                    <span className="font-bold text-slate-800">
                      {selectedRequest.shipping_address}, {selectedRequest.shipping_city}, {selectedRequest.shipping_state} — {selectedRequest.shipping_postal_code}, {selectedRequest.shipping_country || 'India'}
                    </span>
                  </div>
                  {selectedRequest.customization_notes && (
                    <div className="sm:col-span-2 bg-jute-50 p-2.5 rounded-xl border border-jute-200">
                      <span className="text-jute-900 font-bold block">✏️ Custom Printing / Instructions:</span>
                      <span className="text-jute-800">{selectedRequest.customization_notes}</span>
                    </div>
                  )}
                  {selectedRequest.customer_notes && (
                    <div className="sm:col-span-2 bg-canvas-100 p-2.5 rounded-xl">
                      <span className="text-slate-700 font-bold block">📦 Customer Special Notes:</span>
                      <span className="text-slate-600">{selectedRequest.customer_notes}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Items Table Snapshot */}
              <div>
                <h4 className="font-serif font-bold text-xs text-slate-900 mb-2">Requested Products Snapshot</h4>
                <div className="border border-eco-100 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-canvas-100 text-slate-600 font-medium border-b border-eco-100">
                      <tr>
                        <th className="py-2.5 px-3">Product</th>
                        <th className="py-2.5 px-2 text-center">Qty</th>
                        <th className="py-2.5 px-3 text-right">Unit Price</th>
                        <th className="py-2.5 px-3 text-right">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-eco-50">
                      {selectedRequest.items?.map((item: any, idx: number) => (
                        <tr key={idx}>
                          <td className="py-2.5 px-3">
                            <strong className="text-slate-900 block">{item.product_name_snapshot || item.name}</strong>
                            <span className="text-[10px] text-slate-400 font-mono">
                              SKU: {item.sku_snapshot || item.sku || 'N/A'}
                            </span>
                            {item.customization_snapshot && (
                              <span className="block text-[10px] text-jute-700 mt-0.5">
                                ✏️ {item.customization_snapshot}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-2 text-center font-bold text-slate-800">{item.quantity}</td>
                          <td className="py-2.5 px-3 text-right text-slate-600">{formatPrice(item.unit_price)}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-eco-900">{formatPrice(item.line_total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Snapshot */}
              <div className="bg-canvas-50 p-4 rounded-2xl border border-eco-100 space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-bold text-slate-800">{formatPrice(selectedRequest.subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Delivery Charges</span>
                  <span className="font-bold text-slate-800">
                    {selectedRequest.delivery_charge > 0 ? formatPrice(selectedRequest.delivery_charge) : 'FREE'}
                  </span>
                </div>
                <div className="border-t border-eco-200 pt-2 flex justify-between text-sm font-bold text-eco-900">
                  <span>Total Amount (Requested)</span>
                  <span className="font-serif text-base text-eco-900">{formatPrice(selectedRequest.total_amount)}</span>
                </div>
                {selectedRequest.final_confirmed_total && (
                  <div className="border-t border-emerald-200 pt-2 flex justify-between text-sm font-bold text-emerald-800">
                    <span>Final Confirmed Total</span>
                    <span className="font-serif text-base">{formatPrice(selectedRequest.final_confirmed_total)}</span>
                  </div>
                )}
              </div>

              {/* Convert to Confirmed Order Section */}
              {!selectedRequest.confirmed_order_id ? (
                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-emerald-900 font-bold">
                    <ShoppingBag className="w-4 h-4 text-emerald-700" /> Convert to Confirmed Order
                  </div>
                  <p className="text-[11px] text-emerald-800">
                    After confirming order arrangements with the customer, create an official confirmed order in the system.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 items-center">
                    <div className="flex-1 w-full">
                      <label className="text-[10px] text-emerald-900 font-bold block mb-1">
                        Final Total Amount (₹)
                      </label>
                      <input
                        type="number"
                        value={customFinalTotal}
                        onChange={(e) => setCustomFinalTotal(e.target.value)}
                        placeholder="Final amount"
                        className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none"
                      />
                    </div>
                    <button
                      onClick={handleConvertToOrder}
                      disabled={isConverting}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 shrink-0 sm:self-end cursor-pointer"
                    >
                      {isConverting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      Confirm & Create Order
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-emerald-100 border border-emerald-300 rounded-2xl flex items-center justify-between text-emerald-900">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                    <div>
                      <p className="font-bold text-xs">Converted to Confirmed Order</p>
                      <p className="text-[10px] text-emerald-800">Order ID: {selectedRequest.confirmed_order_id}</p>
                    </div>
                  </div>
                  <Link
                    href={`/admin/orders/${selectedRequest.confirmed_order_id}`}
                    className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                  >
                    View Order
                  </Link>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-canvas-50 border-t border-eco-100 flex justify-end">
              <button
                onClick={() => setSelectedRequest(null)}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
