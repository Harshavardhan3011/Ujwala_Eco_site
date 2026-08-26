'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingBag,
  FileText,
  Settings,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (!isLoginPage && !isLoading && (!user || user.role?.toLowerCase() !== 'admin')) {
      router.push('/admin/login');
    }
  }, [user, isLoading, router, pathname, isLoginPage]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (isLoading || !user || user.role?.toLowerCase() !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-16 text-center text-xs font-bold text-slate-500 space-y-2">
        <ShieldCheck className="w-8 h-8 text-eco-700 mx-auto animate-bounce" />
        <p>Verifying Admin Security Clearance...</p>
      </div>
    );
  }

  const adminNav = [
    { name: 'Overview Stats', href: '/admin', icon: LayoutDashboard },
    { name: 'Products Catalog', href: '/admin/products', icon: Package },
    { name: 'Categories Manager', href: '/admin/categories', icon: FolderTree },
    { name: 'Customer Orders', href: '/admin/orders', icon: ShoppingBag },
    { name: 'Custom Order Requests', href: '/admin/custom-orders', icon: FileText },
    { name: 'Site Settings', href: '/admin/site-settings', icon: Settings },
  ];

  return (
    <div className="bg-canvas-100 min-h-screen">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-2xl border border-eco-100 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-eco-800 text-jute-300 font-bold flex items-center justify-center">
              ⚙️
            </div>
            <div>
              <h1 className="font-serif font-bold text-base text-slate-900">Admin Control Center</h1>
              <p className="text-[11px] text-slate-500">Ujwala Eco Products Management</p>
            </div>
          </div>
          <Link
            href="/shop"
            className="text-xs font-bold text-eco-700 hover:underline flex items-center gap-1 bg-canvas-100 px-3 py-1.5 rounded-full border border-eco-200"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Storefront
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Admin Navigation Sidebar */}
          <aside className="bg-white p-4 rounded-2xl border border-eco-100 shadow-xs h-fit space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-3 py-1">
              Admin Menu
            </span>
            {adminNav.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                    isActive ? 'bg-eco-700 text-white shadow-xs' : 'text-slate-700 hover:bg-canvas-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </aside>

          {/* Main Admin Content View */}
          <main className="lg:col-span-4">{children}</main>
        </div>
      </div>
    </div>
  );
}
