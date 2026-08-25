'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, ChevronRight, Clock, CheckCircle2, Truck, AlertCircle } from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/utils';

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadOrders() {
      try {
        const res = await fetch('/api/orders');
        const data = await res.json();
        if (data.orders) setOrders(data.orders);
      } catch (err) {
        console.error('Fetch orders error:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadOrders();
  }, []);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center text-xs text-slate-500 font-bold">
        Loading order history...
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between border-b border-eco-100 pb-4">
        <h1 className="font-serif font-bold text-2xl text-slate-900 flex items-center gap-2">
          <Package className="w-6 h-6 text-eco-700" /> My Orders & Live Tracking
        </h1>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-eco-100 text-center space-y-4 shadow-xs">
          <Package className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-serif font-bold text-lg text-slate-800">No Orders Placed Yet</h3>
          <p className="text-xs text-slate-500">When you place an order, its details and live status will appear here.</p>
          <Link href="/shop" className="inline-block bg-eco-700 text-white text-xs font-bold px-6 py-2.5 rounded-full">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white p-6 rounded-3xl border border-eco-100 shadow-xs space-y-4 hover:border-eco-300 transition-colors"
            >
              <div className="flex flex-wrap justify-between items-center gap-2 border-b border-eco-50 pb-3 text-xs">
                <div>
                  <span className="font-bold text-slate-900 block text-sm">Order #{order.orderNumber}</span>
                  <span className="text-slate-500">Placed on {formatDate(order.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full font-bold text-[11px] ${
                    order.orderStatus === 'DELIVERED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : order.orderStatus === 'CANCELLED'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-900'
                  }`}>
                    {order.orderStatus}
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    order.paymentStatus === 'PAID' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    Payment: {order.paymentStatus}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                {order.items.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-xs text-slate-700">
                    <span>{item.quantity}x {item.productName}</span>
                    <span className="font-bold">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-eco-50">
                <span className="font-serif font-bold text-sm text-eco-900">
                  Total: {formatPrice(order.totalAmount)}
                </span>
                <Link
                  href={`/account/orders/${order.id}`}
                  className="bg-eco-50 hover:bg-eco-100 text-eco-800 text-xs font-bold px-4 py-2 rounded-xl transition-colors flex items-center gap-1"
                >
                  View Details & Track <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
