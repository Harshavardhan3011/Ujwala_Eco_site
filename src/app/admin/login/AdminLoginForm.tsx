'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ShieldCheck, Lock, Mail, AlertCircle, LogIn } from 'lucide-react';

export default function AdminLoginForm() {
  const router = useRouter();
  const { login, logout } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const res = await login(email, password);

      if (res.success && res.user) {
        const roleLower = res.user.role?.toLowerCase();
        if (roleLower === 'superadmin') {
          router.push('/superadmin');
          return;
        } else if (roleLower === 'admin') {
          router.push('/admin');
          return;
        } else {
          await logout();
          setErrorMessage('Invalid email or password.');
        }
      } else {
        setErrorMessage('Invalid email or password.');
      }
    } catch {
      setErrorMessage('Invalid email or password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-3xl border border-eco-100 shadow-xl space-y-6 w-full">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 bg-eco-800 text-jute-300 font-bold text-xl rounded-2xl flex items-center justify-center mx-auto shadow-md">
          <ShieldCheck className="w-6 h-6 text-emerald-400" />
        </div>
        <h1 className="font-serif font-bold text-2xl text-slate-900">Admin Control Center</h1>
        <p className="text-xs text-slate-500">Authorized personnel authentication portal</p>
      </div>

      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" /> {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">Admin Email</label>
          <div className="relative">
            <input
              type="email"
              required
              autoComplete="username"
              placeholder="admin@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-canvas-100 border border-eco-200 rounded-xl py-2.5 pl-9 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-eco-600"
            />
            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">Password</label>
          <div className="relative">
            <input
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-canvas-100 border border-eco-200 rounded-xl py-2.5 pl-9 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-eco-600"
            />
            <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-eco-800 hover:bg-eco-900 text-white font-bold text-xs py-3 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
        >
          <LogIn className="w-4 h-4" /> {isSubmitting ? 'Authenticating...' : 'Sign In to Dashboard'}
        </button>
      </form>
    </div>
  );
}
