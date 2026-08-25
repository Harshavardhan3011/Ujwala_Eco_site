'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, DollarSign, Users, Package, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/utils';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch('/api/admin/stats');
        const data = await res.json();
        if (data.stats) {
          setStats(data.stats);
          setRecentOrders(data.recentOrders || []);
        }
      } catch (err) {
        console.error('Fetch admin stats error:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadStats();
  }, []);

  if (isLoading) {
    return <div className="text-xs text-slate-500 font-bold p-8">Loading Overview Metrics...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-eco-100 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Total Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="font-serif font-bold text-xl text-slate-900">{formatPrice(stats?.totalRevenue || 0)}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-eco-100 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Total Orders</span>
            <ShoppingBag className="w-4 h-4 text-eco-700" />
          </div>
          <p className="font-serif font-bold text-xl text-slate-900">{stats?.totalOrders || 0}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-eco-100 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Pending Orders</span>
            <span className="w-2 h-2 rounded-full bg-amber-500" />
          </div>
          <p className="font-serif font-bold text-xl text-slate-900">{stats?.pendingOrders || 0}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-eco-100 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Total Products</span>
            <Package className="w-4 h-4 text-eco-700" />
          </div>
          <p className="font-serif font-bold text-xl text-slate-900">{stats?.totalProducts || 0}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-eco-100 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Low Stock Alerts</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <p className="font-serif font-bold text-xl text-rose-700">{stats?.lowStockProducts || 0}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-eco-100 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Total Customers</span>
            <Users className="w-4 h-4 text-eco-700" />
          </div>
          <p className="font-serif font-bold text-xl text-slate-900">{stats?.totalCustomers || 0}</p>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white p-6 rounded-2xl border border-eco-100 shadow-xs space-y-4">
        <div className="flex justify-between items-center border-b border-eco-100 pb-3">
          <h3 className="font-serif font-bold text-base text-slate-900">Recent Customer Orders</h3>
          <Link href="/admin/orders" className="text-xs font-bold text-eco-700 hover:underline">
            View All Orders →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-eco-100 text-slate-400 font-medium">
                <th className="py-2.5 px-3">Order #</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Amount</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Payment</th>
                <th className="py-2.5 px-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((ord) => (
                <tr key={ord.id} className="border-b border-eco-50 hover:bg-canvas-50">
                  <td className="py-3 px-3 font-bold text-eco-800">#{ord.orderNumber}</td>
                  <td className="py-3 px-3">{ord.shippingName}</td>
                  <td className="py-3 px-3 font-bold">{formatPrice(ord.totalAmount)}</td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      ord.orderStatus === 'DELIVERED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                    }`}>
                      {ord.orderStatus}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      ord.paymentStatus === 'PAID' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {ord.paymentStatus}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-500">{formatDate(ord.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
