'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Package, Heart, LogOut } from 'lucide-react';

export default function AccountPage() {
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center space-y-4 max-w-md">
        <h2 className="font-serif font-bold text-xl text-slate-800">Sign In Required</h2>
        <p className="text-xs text-slate-500">Please log in to access your profile and order history.</p>
        <Link href="/auth/login" className="inline-block bg-eco-700 text-white text-xs font-bold px-6 py-2.5 rounded-full">
          Sign In
        </Link>
      </div>
    );
  }

  const isAdminUser = ['admin', 'superadmin', 'ADMIN', 'SUPERADMIN'].includes(user.role);

  return (
    <div className="container mx-auto px-4 py-10 space-y-8 max-w-4xl">
      <div className="bg-white p-8 rounded-3xl border border-eco-100 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-eco-700 text-white font-bold text-2xl flex items-center justify-center font-serif">
            {user.name[0]}
          </div>
          <div>
            <h1 className="font-serif font-bold text-2xl text-slate-900">{user.name}</h1>
            <p className="text-xs text-slate-500">{user.email} • {user.phone || 'No phone added'}</p>
            <span className="mt-1 inline-block bg-eco-100 text-eco-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
              {user.role} Account
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          {isAdminUser && (
            <Link
              href="/admin"
              className="text-xs text-eco-700 font-semibold hover:text-eco-900 underline underline-offset-2 transition-colors"
            >
              → Administration
            </Link>
          )}
          <button
            onClick={logout}
            className="text-xs text-rose-600 font-bold hover:bg-rose-50 px-4 py-2 rounded-xl border border-rose-200 transition-colors flex items-center gap-1.5"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Link
          href="/account/orders"
          className="bg-canvas-100 p-6 rounded-2xl border border-eco-100 hover:border-eco-400 transition-all space-y-2 group"
        >
          <Package className="w-8 h-8 text-eco-700 group-hover:scale-110 transition-transform" />
          <h3 className="font-serif font-bold text-base text-slate-900">Order History & Tracking</h3>
          <p className="text-xs text-slate-500">Track current orders & review past purchases.</p>
        </Link>

        <Link
          href="/account/wishlist"
          className="bg-canvas-100 p-6 rounded-2xl border border-eco-100 hover:border-eco-400 transition-all space-y-2 group"
        >
          <Heart className="w-8 h-8 text-rose-600 group-hover:scale-110 transition-transform" />
          <h3 className="font-serif font-bold text-base text-slate-900">Saved Wishlist</h3>
          <p className="text-xs text-slate-500">View items saved for future purchase.</p>
        </Link>
      </div>
    </div>
  );
}
