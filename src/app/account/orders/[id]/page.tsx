'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Package, CheckCircle2, Clock, Truck, MapPin,
  CreditCard, ArrowLeft, Loader2, Banknote,
} from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/utils';

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [order, setOrder] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadOrderDetail() {
      try {
        const res = await fetch(`/api/orders/${id}`);
        const data = await res.json();
        if (data.order) setOrder(data.order);
      } catch (err) {
        console.error('Fetch order detail error:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadOrderDetail();
  }, [id]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-eco-700 animate-spin" />
        <span className="text-xs text-slate-500 font-semibold">Loading tracking details…</span>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-16 text-center space-y-4 max-w-md">
        <h2 className="font-serif font-bold text-xl text-slate-800">Order Not Found</h2>
        <p className="text-xs text-slate-500">The requested order details could not be found.</p>
        <Link
          href="/account/orders"
          className="inline-block bg-eco-700 hover:bg-eco-800 text-white text-xs font-bold px-6 py-2.5 rounded-full transition-colors"
        >
          Back to Order History
        </Link>
      </div>
    );
  }

  const orderNum = order.order_number || order.orderNumber;
  const orderStat = (order.order_status || order.orderStatus || 'PENDING').toUpperCase();
  const payStat = (order.payment_status || order.paymentStatus || 'PENDING').toUpperCase();
  const payMethod = (order.payment_method || order.paymentMethod || 'COD').toUpperCase();
  const createdAt = order.created_at || order.createdAt;
  const totalAmt = order.total_amount ?? order.totalAmount;
  const items = order.items || [];
  const isCod = payMethod === 'COD';

  // Tracking steps definition
  const steps = [
    { key: 'PENDING', label: 'Order Placed' },
    { key: 'CONFIRMED', label: 'Confirmed' },
    { key: 'PROCESSING', label: 'In Production' },
    { key: 'PACKED', label: 'Packed' },
    { key: 'SHIPPED', label: 'Dispatched' },
    { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
    { key: 'DELIVERED', label: 'Delivered' },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === orderStat);

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 max-w-4xl">
      <Link
        href="/account/orders"
        className="text-xs font-bold text-eco-700 hover:underline inline-flex items-center gap-1"
      >
        <ArrowLeft className="w-4 h-4" /> Back to My Orders
      </Link>

      {/* Header Info */}
      <div className="bg-white p-6 rounded-3xl border border-eco-100 shadow-sm flex flex-wrap justify-between items-center gap-4">
        <div>
          <span className="text-xs text-slate-500">Order Reference</span>
          <h1 className="font-serif font-bold text-xl text-slate-900">#{orderNum}</h1>
          <p className="text-xs text-slate-500">Placed on {formatDate(createdAt)}</p>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-500 block">Total Amount</span>
          <span className="font-serif font-bold text-2xl text-eco-900">{formatPrice(totalAmt)}</span>
        </div>
      </div>

      {/* Visual Status Timeline Bar */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-eco-100 shadow-sm space-y-4">
        <h3 className="font-serif font-bold text-sm text-slate-900 flex items-center gap-2">
          <Truck className="w-4 h-4 text-eco-700" /> Live Delivery Status Timeline
        </h3>

        {orderStat === 'CANCELLED' ? (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-bold">
            This order has been cancelled. Please contact customer support if you have questions.
          </div>
        ) : (
          <div className="py-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-center">
              {steps.map((step, idx) => {
                const isDone = currentStepIndex >= idx && currentStepIndex !== -1;
                const isCurrent = currentStepIndex === idx;
                return (
                  <div key={step.key} className="space-y-2">
                    <div
                      className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center text-xs font-bold transition-colors ${
                        isCurrent
                          ? 'bg-eco-700 text-white ring-4 ring-eco-100'
                          : isDone
                          ? 'bg-emerald-600 text-white'
                          : 'bg-canvas-100 text-slate-400 border border-slate-200'
                      }`}
                    >
                      {isDone ? '✓' : idx + 1}
                    </div>
                    <span className={`text-[10px] block leading-tight ${isCurrent ? 'font-extrabold text-eco-900' : isDone ? 'font-bold text-slate-800' : 'text-slate-400'}`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Ordered Items List */}
      <div className="bg-white p-6 rounded-3xl border border-eco-100 shadow-sm space-y-4">
        <h3 className="font-serif font-bold text-base text-slate-900 border-b border-eco-100 pb-3">
          Purchased Items ({items.length})
        </h3>
        <div className="space-y-3 divide-y divide-eco-50">
          {items.map((item: any) => (
            <div key={item.id} className="pt-3 first:pt-0 flex justify-between items-center text-xs">
              <div>
                <p className="font-bold text-slate-900">{item.product_name || item.productName}</p>
                <p className="text-[11px] text-slate-500 font-mono">SKU: {item.product_sku || item.productSku}</p>
                {item.customization_notes && (
                  <p className="text-[10px] bg-jute-100 text-jute-900 p-1 rounded mt-1">
                    ✏️ {item.customization_notes}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="font-bold text-eco-800">{formatPrice(item.price * item.quantity)}</p>
                <p className="text-[11px] text-slate-500">{item.quantity} x {formatPrice(item.price)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Delivery Address & Payment Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-eco-100 shadow-sm space-y-2">
          <h4 className="font-serif font-bold text-sm text-slate-900 flex items-center gap-1.5 border-b border-eco-100 pb-2">
            <MapPin className="w-4 h-4 text-eco-700" /> Delivery Address
          </h4>
          <div className="text-xs text-slate-700 space-y-1 pt-1">
            <p className="font-bold text-slate-900">{order.shipping_name || order.shippingName}</p>
            <p>Phone: {order.shipping_phone || order.shippingPhone}</p>
            <p>
              {order.shipping_address || order.shippingAddress}, {order.shipping_city || order.shippingCity}, {order.shipping_state || order.shippingState} - {order.shipping_postal_code || order.shippingPostalCode}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-eco-100 shadow-sm space-y-2">
          <h4 className="font-serif font-bold text-sm text-slate-900 flex items-center gap-1.5 border-b border-eco-100 pb-2">
            <CreditCard className="w-4 h-4 text-eco-700" /> Payment Information
          </h4>
          <div className="text-xs text-slate-700 space-y-1 pt-1">
            <p className="flex items-center gap-1.5">
              Method:
              <span className="font-bold text-slate-900 flex items-center gap-1">
                {isCod ? <Banknote className="w-3.5 h-3.5 text-emerald-600" /> : <CreditCard className="w-3.5 h-3.5 text-blue-600" />}
                {isCod ? 'Cash on Delivery (COD)' : 'Online Payment (Razorpay)'}
              </span>
            </p>
            <p>
              Payment Status:
              <span className={`ml-1.5 font-bold ${payStat === 'PAID' ? 'text-emerald-700' : 'text-amber-700'}`}>
                {payStat}
              </span>
            </p>
            <p>Total Charge: <strong className="text-slate-900">{formatPrice(totalAmt)}</strong></p>
          </div>
        </div>
      </div>
    </div>
  );
}
