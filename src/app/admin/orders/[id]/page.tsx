'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Package, MapPin, User, CreditCard, Clock, Loader2, AlertCircle, Check } from 'lucide-react';
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

const ORDER_STATUSES = ['PENDING','CONFIRMED','PROCESSING','PACKED','SHIPPED','OUT_FOR_DELIVERY','DELIVERED','CANCELLED'];
const PAYMENT_STATUSES = ['PENDING','PAID','FAILED','REFUNDED'];

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const paths = useAdminPath();
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [orderStatus, setOrderStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/orders/${params.id}`);
        const data = await res.json();
        if (data.order) {
          setOrder(data.order);
          setOrderStatus(data.order.orderStatus);
          setPaymentStatus(data.order.paymentStatus);
        } else {
          setError('Order not found');
        }
      } catch {
        setError('Failed to load order');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [params.id]);

  const handleUpdateStatus = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/orders/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderStatus, paymentStatus }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        const data = await res.json();
        if (data.order) setOrder(data.order);
      }
    } catch { /* ignore */ } finally { setSaving(false); }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 animate-spin text-eco-600" />
        <span className="ml-2 text-sm text-slate-500">Loading order…</span>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="space-y-4">
        <Link href={paths.orders} className="flex items-center gap-2 text-sm text-eco-700 font-medium">
          <ArrowLeft className="w-4 h-4" />Back to Orders
        </Link>
        <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4" />{error || 'Order not found'}
        </div>
      </div>
    );
  }

  const inputCls = 'border border-eco-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-eco-500 bg-canvas-50';

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={paths.orders} className="p-2 rounded-lg border border-eco-200 text-slate-600 hover:bg-eco-50 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-slate-900">Order #{order.orderNumber}</h1>
          <p className="text-xs text-slate-500">{formatDate(order.createdAt)}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${ORDER_STATUS_COLORS[order.orderStatus] || 'bg-slate-100 text-slate-600'}`}>
          {order.orderStatus?.replace('_', ' ')}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Items + Customer + Shipping */}
        <div className="lg:col-span-2 space-y-4">
          {/* Order Items */}
          <div className="bg-white rounded-xl border border-eco-100 overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-eco-50">
              <Package className="w-4 h-4 text-eco-700" />
              <h2 className="font-semibold text-sm text-slate-900">Order Items</h2>
            </div>
            <div className="divide-y divide-eco-50">
              {(order.items || []).map((item: any) => (
                <div key={item.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="w-12 h-12 rounded-lg bg-canvas-100 border border-eco-100 shrink-0 flex items-center justify-center">
                    <Package className="w-5 h-5 text-eco-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{item.productName}</p>
                    <p className="text-xs text-slate-400">SKU: {item.productSku} · Qty: {item.quantity}</p>
                    {item.customizationNotes && (
                      <p className="text-xs text-jute-700 mt-0.5 bg-jute-50 px-2 py-1 rounded">Custom: {item.customizationNotes}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-slate-900">{formatPrice(item.price * item.quantity)}</p>
                    <p className="text-xs text-slate-400">{formatPrice(item.price)} each</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-5 py-3 bg-canvas-50 border-t border-eco-50 flex justify-between items-center">
              <span className="text-sm font-semibold text-slate-700">Total</span>
              <span className="text-base font-bold text-slate-900">{formatPrice(order.totalAmount)}</span>
            </div>
          </div>

          {/* Customer */}
          <div className="bg-white rounded-xl border border-eco-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-4 h-4 text-eco-700" />
              <h2 className="font-semibold text-sm text-slate-900">Customer</h2>
            </div>
            <div className="space-y-1 text-sm">
              <p className="font-semibold text-slate-900">{order.shippingName}</p>
              <p className="text-slate-500">{order.shippingPhone}</p>
              {order.user?.email && <p className="text-slate-400 text-xs">{order.user.email}</p>}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-xl border border-eco-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-4 h-4 text-eco-700" />
              <h2 className="font-semibold text-sm text-slate-900">Shipping Address</h2>
            </div>
            <div className="text-sm text-slate-600 space-y-0.5">
              <p>{order.shippingAddress}</p>
              <p>{order.shippingCity}{order.shippingState ? `, ${order.shippingState}` : ''}</p>
              <p>{order.shippingPostalCode}</p>
            </div>
          </div>

          {/* Custom notes */}
          {order.customizationNotes && (
            <div className="bg-jute-50 border border-jute-200 rounded-xl p-5">
              <p className="text-xs font-bold text-jute-800 mb-2">✏️ Customization Notes</p>
              <p className="text-sm text-slate-700">{order.customizationNotes}</p>
            </div>
          )}
        </div>

        {/* Right: Status Update + Payment */}
        <div className="space-y-4">
          {/* Status Update */}
          <div className="bg-white rounded-xl border border-eco-100 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-eco-700" />
              <h2 className="font-semibold text-sm text-slate-900">Update Status</h2>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Order Status</label>
              <select value={orderStatus} onChange={e => setOrderStatus(e.target.value)} className={`w-full ${inputCls}`}>
                {ORDER_STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Payment Status</label>
              <select value={paymentStatus} onChange={e => setPaymentStatus(e.target.value)} className={`w-full ${inputCls}`}>
                {PAYMENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <button
              onClick={handleUpdateStatus}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-eco-700 hover:bg-eco-800 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              {saved ? <><Check className="w-4 h-4" />Saved!</> : saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : 'Update Order'}
            </button>
          </div>

          {/* Payment Info */}
          <div className="bg-white rounded-xl border border-eco-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="w-4 h-4 text-eco-700" />
              <h2 className="font-semibold text-sm text-slate-900">Payment</h2>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Method</span>
                <span className="font-medium text-slate-900">{order.paymentMethod || 'Online'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  order.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-700' :
                  order.paymentStatus === 'FAILED' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'
                }`}>{order.paymentStatus}</span>
              </div>
              <div className="flex justify-between border-t border-eco-50 pt-2 mt-2">
                <span className="font-semibold text-slate-700">Total</span>
                <span className="font-bold text-slate-900">{formatPrice(order.totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
