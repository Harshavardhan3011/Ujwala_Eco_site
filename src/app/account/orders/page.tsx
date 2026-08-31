'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Package, ChevronRight, Clock, CheckCircle2,
  FileText, ShoppingBag, ArrowRight, ShieldCheck,
} from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/utils';

export default function OrderHistoryPage() {
  const [activeTab, setActiveTab] = useState<'REQUESTS' | 'CONFIRMED'>('REQUESTS');
  const [orderRequests, setOrderRequests] = useState<any[]>([]);
  const [confirmedOrders, setConfirmedOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [reqRes, ordRes] = await Promise.all([
          fetch('/api/order-requests'),
          fetch('/api/orders'),
        ]);

        const reqData = await reqRes.json();
        const ordData = await ordRes.json();

        if (reqData.requests) setOrderRequests(reqData.requests);
        if (ordData.orders) setConfirmedOrders(ordData.orders);
      } catch (err) {
        console.error('Fetch order history error:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center text-xs text-slate-500 font-bold">
        Loading your order history...
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-eco-100 pb-4">
        <div>
          <h1 className="font-serif font-bold text-2xl text-slate-900 flex items-center gap-2">
            <Package className="w-6 h-6 text-eco-700" /> My Orders & Requests
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track your order requests and view confirmed order details
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-canvas-100 p-1 rounded-2xl text-xs font-bold">
          <button
            onClick={() => setActiveTab('REQUESTS')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'REQUESTS'
                ? 'bg-white text-eco-900 shadow-xs'
                : 'text-slate-600 hover:text-eco-800'
            }`}
          >
            Order Requests ({orderRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('CONFIRMED')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'CONFIRMED'
                ? 'bg-white text-eco-900 shadow-xs'
                : 'text-slate-600 hover:text-eco-800'
            }`}
          >
            Confirmed Orders ({confirmedOrders.length})
          </button>
        </div>
      </div>

      {/* Tab 1: Order Requests */}
      {activeTab === 'REQUESTS' && (
        <div className="space-y-4">
          {orderRequests.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 border border-eco-100 text-center space-y-4 shadow-xs">
              <FileText className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-serif font-bold text-lg text-slate-800">No Order Requests Yet</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                When you submit an order request from your cart, it will appear here so you can review its status and communication.
              </p>
              <Link
                href="/shop"
                className="inline-block bg-eco-700 hover:bg-eco-800 text-white text-xs font-bold px-6 py-2.5 rounded-full transition-colors"
              >
                Browse Catalog
              </Link>
            </div>
          ) : (
            orderRequests.map((req) => (
              <div
                key={req.id}
                className="bg-white p-6 rounded-3xl border border-eco-100 shadow-xs space-y-4 hover:border-eco-300 transition-colors"
              >
                <div className="flex flex-wrap justify-between items-center gap-2 border-b border-eco-50 pb-3 text-xs">
                  <div>
                    <span className="font-bold text-slate-900 block text-sm font-mono">
                      Request #{req.request_number}
                    </span>
                    <span className="text-slate-500">Submitted on {formatDate(req.created_at)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full font-bold text-[11px] ${
                        req.status === 'CONFIRMED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : req.status === 'CONTACTED'
                          ? 'bg-sky-100 text-sky-800'
                          : req.status === 'CANCELLED'
                          ? 'bg-slate-100 text-slate-600'
                          : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      {req.status.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-slate-500 bg-canvas-100 px-2 py-1 rounded-full">
                      No Online Payment Charged
                    </span>
                  </div>
                </div>

                {/* Items Summary */}
                <div className="space-y-2">
                  {req.items?.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-xs text-slate-700">
                      <span>
                        <strong>{item.quantity}x</strong> {item.product_name_snapshot || item.name}
                        {item.customization_snapshot && (
                          <span className="text-jute-700 block text-[10px]">
                            ✏️ {item.customization_snapshot}
                          </span>
                        )}
                      </span>
                      <span className="font-bold text-slate-900">
                        {formatPrice(item.line_total || item.unit_price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-3 border-t border-eco-50 gap-2">
                  <span className="font-serif font-bold text-sm text-eco-900">
                    Estimated Total: {formatPrice(req.total_amount)}
                  </span>
                  <p className="text-[11px] text-slate-500">
                    📞 Ujwala will contact you on <strong className="text-slate-700">{req.customer_phone}</strong> to confirm.
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Confirmed Orders */}
      {activeTab === 'CONFIRMED' && (
        <div className="space-y-4">
          {confirmedOrders.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 border border-eco-100 text-center space-y-4 shadow-xs">
              <Package className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-serif font-bold text-lg text-slate-800">No Confirmed Orders</h3>
              <p className="text-xs text-slate-500">
                Confirmed orders processed by Ujwala Eco Products will appear here.
              </p>
            </div>
          ) : (
            confirmedOrders.map((order) => {
              const orderNum = order.order_number || order.orderNumber;
              const orderStat = order.order_status || order.orderStatus || 'CONFIRMED';
              const createdAt = order.created_at || order.createdAt;
              const totalAmt = order.total_amount ?? order.totalAmount;
              const items = order.items || [];

              return (
                <div
                  key={order.id}
                  className="bg-white p-6 rounded-3xl border border-eco-100 shadow-xs space-y-4 hover:border-eco-300 transition-colors"
                >
                  <div className="flex flex-wrap justify-between items-center gap-2 border-b border-eco-50 pb-3 text-xs">
                    <div>
                      <span className="font-bold text-slate-900 block text-sm">Order #{orderNum}</span>
                      <span className="text-slate-500">Confirmed on {formatDate(createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full font-bold text-[11px] bg-emerald-100 text-emerald-800">
                        {orderStat.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {items.map((item: any) => (
                      <div key={item.id} className="flex justify-between text-xs text-slate-700">
                        <span>{item.quantity}x {item.product_name || item.productName}</span>
                        <span className="font-bold">{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-eco-50">
                    <span className="font-serif font-bold text-sm text-eco-900">
                      Total: {formatPrice(totalAmt)}
                    </span>
                    <Link
                      href={`/account/orders/${order.id}`}
                      className="bg-eco-50 hover:bg-eco-100 text-eco-800 text-xs font-bold px-4 py-2 rounded-xl transition-colors flex items-center gap-1"
                    >
                      View Order <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
