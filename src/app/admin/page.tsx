'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ShoppingBag, DollarSign, Users, Package, AlertTriangle,
  FileText, TrendingUp, Clock, CheckCircle2, ArrowRight,
  Boxes, MessageSquare, Plus, BarChart3, UserCheck,
} from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
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

const CUSTOM_STATUS_COLORS: Record<string, string> = {
  NEW:             'bg-blue-100 text-blue-700',
  CONTACTED:       'bg-amber-100 text-amber-700',
  QUOTATION_SENT:  'bg-purple-100 text-purple-700',
  CONFIRMED:       'bg-emerald-100 text-emerald-700',
  IN_PRODUCTION:   'bg-indigo-100 text-indigo-700',
  COMPLETED:       'bg-emerald-100 text-emerald-800',
  CANCELLED:       'bg-rose-100 text-rose-700',
};

interface StatCard {
  label: string;
  value: string | number;
  icon: React.ElementType;
  iconColor: string;
  bgColor: string;
  href?: string;
  urgent?: boolean;
}

function KPICard({ card }: { card: StatCard }) {
  const Icon = card.icon;
  const content = (
    <div className={`bg-white rounded-xl border p-5 flex flex-col gap-3 hover:shadow-md transition-shadow ${card.urgent ? 'border-rose-200' : 'border-eco-100'}`}>
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.bgColor}`}>
          <Icon className={`w-5 h-5 ${card.iconColor}`} />
        </div>
        {card.href && (
          <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
        )}
      </div>
      <div>
        <p className={`font-bold text-2xl font-serif ${card.urgent ? 'text-rose-700' : 'text-slate-900'}`}>
          {card.value}
        </p>
        <p className="text-xs text-slate-500 mt-0.5 font-medium">{card.label}</p>
      </div>
    </div>
  );

  if (card.href) {
    return <Link href={card.href} className="block group">{content}</Link>;
  }
  return content;
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const paths = useAdminPath();
  const [stats, setStats] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [recentCustomOrders, setRecentCustomOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch('/api/admin/stats');
        const data = await res.json();
        if (data.stats) {
          setStats(data.stats);
          setRecentOrders(data.recentOrders || []);
          setRecentCustomOrders(data.recentCustomOrders || []);
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
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-eco-100 h-28" />
          ))}
        </div>
        <div className="bg-white rounded-xl border border-eco-100 h-64" />
      </div>
    );
  }

  const kpiCards: StatCard[] = [
    {
      label: 'Total Revenue',
      value: formatPrice(stats?.totalRevenue || 0),
      icon: DollarSign,
      iconColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      href: paths.orders,
    },
    {
      label: 'Total Orders',
      value: stats?.totalOrders || 0,
      icon: ShoppingBag,
      iconColor: 'text-eco-700',
      bgColor: 'bg-eco-50',
      href: paths.orders,
    },
    {
      label: 'Pending Orders',
      value: stats?.pendingOrders || 0,
      icon: Clock,
      iconColor: 'text-amber-600',
      bgColor: 'bg-amber-50',
      href: paths.orders,
      urgent: (stats?.pendingOrders || 0) > 0,
    },
    {
      label: 'Total Products',
      value: stats?.totalProducts || 0,
      icon: Package,
      iconColor: 'text-eco-700',
      bgColor: 'bg-eco-50',
      href: paths.products,
    },
    {
      label: 'Customers',
      value: stats?.totalCustomers || 0,
      icon: Users,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      href: paths.customers,
    },
    {
      label: 'Low Stock',
      value: stats?.lowStockProducts || 0,
      icon: AlertTriangle,
      iconColor: 'text-rose-600',
      bgColor: 'bg-rose-50',
      href: paths.inventory,
      urgent: (stats?.lowStockProducts || 0) > 0,
    },
  ];

  return (
    <div className="space-y-6 max-w-screen-xl">
      {/* Welcome banner */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">
          Good day, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">Here's what's happening with Ujwala Eco Products today.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpiCards.map((card) => (
          <KPICard key={card.label} card={card} />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-eco-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-eco-50">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-eco-700" />
              <h2 className="font-semibold text-sm text-slate-900">Recent Orders</h2>
            </div>
            <Link href={paths.orders} className="text-xs font-medium text-eco-700 hover:text-eco-900 flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <ShoppingBag className="w-10 h-10 mb-3 text-eco-200" />
              <p className="text-sm font-medium">No orders yet</p>
              <p className="text-xs mt-1">Orders will appear here once customers start purchasing</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-eco-50 bg-canvas-50">
                    <th className="text-left py-3 px-4 text-slate-500 font-semibold">Order #</th>
                    <th className="text-left py-3 px-4 text-slate-500 font-semibold">Customer</th>
                    <th className="text-left py-3 px-4 text-slate-500 font-semibold">Amount</th>
                    <th className="text-left py-3 px-4 text-slate-500 font-semibold">Status</th>
                    <th className="text-left py-3 px-4 text-slate-500 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-eco-50">
                  {recentOrders.map((ord) => (
                    <tr
                      key={ord.id}
                      className="hover:bg-canvas-50 cursor-pointer transition-colors"
                      onClick={() => window.location.href = `${paths.orders}/${ord.id}`}
                    >
                      <td className="py-3 px-4 font-semibold text-eco-800">#{ord.orderNumber}</td>
                      <td className="py-3 px-4 text-slate-700 max-w-[120px] truncate">{ord.shippingName}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{formatPrice(ord.totalAmount)}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${ORDER_STATUS_COLORS[ord.orderStatus] || 'bg-slate-100 text-slate-600'}`}>
                          {ord.orderStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400">{formatDate(ord.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right column: Quick Actions + Custom Orders */}
        <div className="space-y-4">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-eco-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-eco-700" />
              <h2 className="font-semibold text-sm text-slate-900">Quick Actions</h2>
            </div>
            <div className="space-y-2">
              {[
                { label: 'Add Product', href: paths.products, icon: Plus, color: 'bg-eco-700 hover:bg-eco-800 text-white' },
                { label: 'View Orders', href: paths.orders, icon: ShoppingBag, color: 'bg-eco-50 hover:bg-eco-100 text-eco-800' },
                { label: 'Custom Requests', href: paths.customOrders, icon: FileText, color: 'bg-amber-50 hover:bg-amber-100 text-amber-800', badge: stats?.newCustomOrdersCount || 0 },
                { label: 'Check Inventory', href: paths.inventory, icon: Boxes, color: 'bg-canvas-100 hover:bg-canvas-200 text-slate-700' },
                ...(paths.isSuper ? [{ label: 'User Management', href: '/superadmin/users', icon: UserCheck, color: 'bg-amber-600 hover:bg-amber-700 text-white' }] : []),
              ].map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${action.color}`}
                  >
                    <span className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      {action.label}
                    </span>
                    {'badge' in action && (action.badge as number) > 0 && (
                      <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {action.badge as number}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Recent Custom Orders */}
          <div className="bg-white rounded-xl border border-eco-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-eco-50">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-jute-600" />
                <h2 className="font-semibold text-sm text-slate-900">Custom Requests</h2>
              </div>
              <Link href={paths.customOrders} className="text-xs font-medium text-eco-700 hover:text-eco-900 flex items-center gap-1">
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            {recentCustomOrders.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                <FileText className="w-8 h-8 mx-auto mb-2 text-eco-200" />
                <p className="text-xs">No custom requests yet</p>
              </div>
            ) : (
              <div className="divide-y divide-eco-50">
                {recentCustomOrders.map((co) => (
                  <Link
                    key={co.id}
                    href={paths.customOrders}
                    className="flex items-center justify-between px-5 py-3 hover:bg-canvas-50 transition-colors"
                  >
                    <div>
                      <p className="text-xs font-semibold text-slate-900 truncate max-w-[140px]">{co.customerName}</p>
                      <p className="text-[11px] text-slate-400">{co.productType} · {co.quantity} pcs</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${CUSTOM_STATUS_COLORS[co.status] || 'bg-slate-100 text-slate-600'}`}>
                      {co.status?.replace('_', ' ')}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
