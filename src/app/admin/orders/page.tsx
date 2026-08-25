'use client';

import React, { useState, useEffect } from 'react';
import { ShoppingBag, Search, CheckCircle2, Truck, RefreshCw } from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/utils';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const url = statusFilter ? `/api/orders?status=${statusFilter}` : '/api/orders';
      const res = await fetch(url);
      const data = await res.json();
      if (data.orders) setOrders(data.orders);
    } catch (err) {
      console.error('Fetch admin orders error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderStatus: newStatus }),
      });
      fetchOrders();
    } catch (err) {
      console.error('Update order status error:', err);
    }
  };

  const handleUpdatePaymentStatus = async (orderId: string, newStatus: string) => {
    try {
      await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: newStatus }),
      });
      fetchOrders();
    } catch (err) {
      console.error('Update payment status error:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-eco-100 shadow-xs flex flex-wrap justify-between items-center gap-4">
        <div>
          <h2 className="font-serif font-bold text-xl text-slate-900">Order Management</h2>
          <p className="text-xs text-slate-500">Track customer orders, review custom prints, and update status</p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-canvas-100 border border-eco-200 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PROCESSING">Processing</option>
            <option value="PACKED">Packed</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <button onClick={fetchOrders} className="p-2 text-eco-700 hover:bg-eco-50 rounded-xl">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {orders.map((ord) => (
          <div key={ord.id} className="bg-white p-6 rounded-2xl border border-eco-100 shadow-xs space-y-4">
            <div className="flex flex-wrap justify-between items-center gap-2 border-b border-eco-50 pb-3 text-xs">
              <div>
                <span className="font-bold text-slate-900 text-sm">Order #{ord.orderNumber}</span>
                <span className="text-slate-500 block">Customer: {ord.shippingName} ({ord.shippingPhone})</span>
              </div>
              <div className="text-right">
                <span className="font-serif font-bold text-base text-eco-900">{formatPrice(ord.totalAmount)}</span>
                <span className="text-[11px] text-slate-400 block">{formatDate(ord.createdAt)}</span>
              </div>
            </div>

            {/* Customization Details preview */}
            {ord.customizationNotes && (
              <div className="p-3 bg-jute-50 border border-jute-200 rounded-xl text-xs">
                <span className="font-bold text-jute-900 block">✏️ Custom Printing Notes:</span>
                <p className="text-slate-700">{ord.customizationNotes}</p>
              </div>
            )}

            {/* Purchased Items */}
            <div className="space-y-2 text-xs">
              {ord.items.map((item: any) => (
                <div key={item.id} className="flex justify-between text-slate-700">
                  <span>{item.quantity}x {item.productName} (SKU: {item.productSku})</span>
                  <span className="font-bold">{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            {/* Address & Status Controls */}
            <div className="flex flex-wrap justify-between items-center gap-4 pt-3 border-t border-eco-50 text-xs">
              <div className="text-slate-600">
                <span className="font-bold text-slate-800">Ship To: </span>
                {ord.shippingAddress}, {ord.shippingCity} - {ord.shippingPostalCode}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Order Status Select */}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block mb-0.5">Order Status</span>
                  <select
                    value={ord.orderStatus}
                    onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value)}
                    className="bg-canvas-100 border border-eco-200 rounded-lg p-1.5 font-bold text-eco-900"
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="CONFIRMED">CONFIRMED</option>
                    <option value="PROCESSING">PROCESSING</option>
                    <option value="PACKED">PACKED</option>
                    <option value="SHIPPED">SHIPPED</option>
                    <option value="OUT_FOR_DELIVERY">OUT FOR DELIVERY</option>
                    <option value="DELIVERED">DELIVERED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>

                {/* Payment Status Select */}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block mb-0.5">Payment</span>
                  <select
                    value={ord.paymentStatus}
                    onChange={(e) => handleUpdatePaymentStatus(ord.id, e.target.value)}
                    className="bg-canvas-100 border border-eco-200 rounded-lg p-1.5 font-bold text-emerald-800"
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="PAID">PAID</option>
                    <option value="FAILED">FAILED</option>
                    <option value="REFUNDED">REFUNDED</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
