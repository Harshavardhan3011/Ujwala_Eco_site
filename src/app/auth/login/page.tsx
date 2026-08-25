'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { LogIn, Lock, Mail, AlertCircle } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/account';

  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    const res = await login(email, password);
    setIsSubmitting(false);

    if (res.success) {
      router.push(redirect);
    } else {
      setErrorMessage(res.error || 'Login failed');
    }
  };

  const handleQuickLogin = async (quickEmail: string, quickPass: string) => {
    setEmail(quickEmail);
    setPassword(quickPass);
    setIsSubmitting(true);
    setErrorMessage('');

    const res = await login(quickEmail, quickPass);
    setIsSubmitting(false);

    if (res.success) {
      router.push(redirect);
    } else {
      setErrorMessage(res.error || 'Login failed');
    }
  };

  return (
    <div className="bg-white p-8 rounded-3xl border border-eco-100 shadow-xl space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 bg-eco-700 text-white font-bold text-xl rounded-full flex items-center justify-center mx-auto shadow-md">
          🌱
        </div>
        <h1 className="font-serif font-bold text-2xl text-slate-900">Sign In to Ujwala Eco</h1>
        <p className="text-xs text-slate-500">Access your account, order tracking & admin dashboard</p>
      </div>

      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" /> {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">Email Address</label>
          <div className="relative">
            <input
              type="email"
              required
              placeholder="name@example.com"
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
          className="w-full bg-eco-700 hover:bg-eco-800 text-white font-bold text-xs py-3 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
        >
          <LogIn className="w-4 h-4" /> {isSubmitting ? 'Signing In...' : 'Sign In'}
        </button>
      </form>

      <div className="text-center text-xs text-slate-500 pt-2 border-t border-eco-100">
        Don't have an account?{' '}
        <Link href="/auth/register" className="font-bold text-eco-700 hover:underline">
          Register Here
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-md">
      <Suspense fallback={<div className="text-xs text-slate-500 text-center">Loading login form...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
