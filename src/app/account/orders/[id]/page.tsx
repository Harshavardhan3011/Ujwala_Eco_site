'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Package, CheckCircle2, Clock, Truck, MapPin, CreditCard, ArrowLeft } from 'lucide-react';
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
      <div className="container mx-auto px-4 py-16 text-center text-xs text-slate-500 font-bold">
        Loading tracking details...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="font-serif font-bold text-xl text-slate-800">Order Not Found</h2>
        <button
          onClick={() => router.push('/account/orders')}
          className="bg-eco-700 text-white text-xs font-bold px-6 py-2.5 rounded-full"
        >
          Back to Order History
        </button>
      </div>
    );
  }

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

  const currentStepIndex = steps.findIndex((s) => s.key === order.orderStatus);

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 max-w-4xl">
      <button
        onClick={() => router.push('/account/orders')}
        className="text-xs font-bold text-eco-700 hover:underline flex items-center gap-1"
      >
        <ArrowLeft className="w-4 h-4" /> Back to My Orders
      </button>

      {/* Header Info */}
      <div className="bg-white p-6 rounded-3xl border border-eco-100 shadow-sm flex flex-wrap justify-between items-center gap-4">
        <div>
          <span className="text-xs text-slate-500">Order Reference</span>
          <h1 className="font-serif font-bold text-xl text-slate-900">#{order.orderNumber}</h1>
          <p className="text-xs text-slate-500">Placed on {formatDate(order.createdAt)}</p>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-500 block">Total Amount</span>
          <span className="font-serif font-bold text-2xl text-eco-900">{formatPrice(order.totalAmount)}</span>
        </div>
      </div>

      {/* Visual Status Timeline Bar */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-eco-100 shadow-sm space-y-4">
        <h3 className="font-serif font-bold text-sm text-slate-900 flex items-center gap-2">
          <Truck className="w-4 h-4 text-eco-700" /> Live Delivery Status Timeline
        </h3>

        {order.orderStatus === 'CANCELLED' ? (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-bold">
            This order has been cancelled. Please contact customer support if you have questions.
          </div>
        ) : (
          <div className="py-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-center">
              {steps.map((step, idx) => {
                const isDone = currentStepIndex >= idx;
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
          Purchased Items ({order.items.length})
        </h3>
        <div className="space-y-3">
          {order.items.map((item: any) => (
            <div key={item.id} className="flex justify-between items-center text-xs p-3 bg-canvas-50 rounded-2xl border border-eco-50">
              <div>
                <p className="font-bold text-slate-900">{item.productName}</p>
                <p className="text-[11px] text-slate-500 font-mono">SKU: {item.productSku}</p>
                {item.customizationNotes && (
                  <p className="text-[10px] bg-jute-100 text-jute-900 p-1 rounded mt-1">
                    ✏️ {item.customizationNotes}
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
            <p className="font-bold text-slate-900">{order.shippingName}</p>
            <p>Phone: {order.shippingPhone}</p>
            <p>{order.shippingAddress}, {order.shippingCity}, {order.shippingState} - {order.shippingPostalCode}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-eco-100 shadow-sm space-y-2">
          <h4 className="font-serif font-bold text-sm text-slate-900 flex items-center gap-1.5 border-b border-eco-100 pb-2">
            <CreditCard className="w-4 h-4 text-eco-700" /> Payment Information
          </h4>
          <div className="text-xs text-slate-700 space-y-1 pt-1">
            <p>Method: <strong className="text-slate-900">{order.paymentMethod}</strong></p>
            <p>Payment Status: <strong className="text-emerald-700">{order.paymentStatus}</strong></p>
            <p>Total Charge: <strong>{formatPrice(order.totalAmount)}</strong></p>
          </div>
        </div>
      </div>
    </div>
  );
}
