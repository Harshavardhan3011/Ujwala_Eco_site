'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { UserPlus, Lock, Mail, User, Phone, AlertCircle, Eye, EyeOff } from 'lucide-react';
import TurnstileWidget, { isTurnstileConfigured } from '@/components/TurnstileWidget';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const turnstileConfigured = isTurnstileConfigured();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Block submission if CAPTCHA is configured but not completed
    if (turnstileConfigured && !captchaToken) {
      setErrorMessage('Please complete the security verification.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    const res = await register(name, email, password, phone, captchaToken || undefined);
    setIsSubmitting(false);

    if (res.success) {
      router.push('/account');
    } else {
      // Map known Supabase CAPTCHA errors to friendly messages
      const err = res.error || 'Registration failed';
      if (err.toLowerCase().includes('captcha')) {
        setErrorMessage('Security verification failed. Please try again.');
        setCaptchaToken(null); // Force re-verification
      } else if (err.toLowerCase().includes('already registered') || err.toLowerCase().includes('already been registered')) {
        setErrorMessage('Unable to create this account. Please check your details or try signing in.');
      } else {
        setErrorMessage(err);
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-16 max-w-md">
      <div className="bg-white p-8 rounded-3xl border border-eco-100 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-eco-700 text-white font-bold text-xl rounded-full flex items-center justify-center mx-auto">
            🌱
          </div>
          <h1 className="font-serif font-bold text-2xl text-slate-900">Create Ujwala Account</h1>
          <p className="text-xs text-slate-500">Register to manage custom orders &amp; track deliveries</p>
        </div>

        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Full Name *</label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="Ramesh Kumar"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-canvas-100 border border-eco-200 rounded-xl py-2.5 pl-9 pr-3 text-xs focus:outline-none"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Email Address *</label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-canvas-100 border border-eco-200 rounded-xl py-2.5 pl-9 pr-3 text-xs focus:outline-none"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Phone Number</label>
            <div className="relative">
              <input
                type="tel"
                placeholder="Mobile number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-canvas-100 border border-eco-200 rounded-xl py-2.5 pl-9 pr-3 text-xs focus:outline-none"
              />
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Password *</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-canvas-100 border border-eco-200 rounded-xl py-2.5 pl-9 pr-10 text-xs focus:outline-none focus:ring-1 focus:ring-eco-600"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-eco-500 rounded-md p-0.5 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Cloudflare Turnstile CAPTCHA */}
          <div id="turnstile-register-container">
            <TurnstileWidget
              onVerify={(token) => {
                setCaptchaToken(token);
                setErrorMessage('');
              }}
              onExpire={() => {
                setCaptchaToken(null);
                setErrorMessage('Security verification expired. Please try again.');
              }}
              onError={() => {
                setCaptchaToken(null);
                setErrorMessage('Security verification failed. Please try again.');
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || (turnstileConfigured && !captchaToken)}
            className="w-full bg-eco-700 hover:bg-eco-800 text-white font-bold text-xs py-3 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <UserPlus className="w-4 h-4" /> {isSubmitting ? 'Registering...' : 'Create Account'}
          </button>
        </form>

        <div className="text-center text-xs text-slate-500 pt-2 border-t border-eco-100">
          Already have an account?{' '}
          <Link href="/auth/login" className="font-bold text-eco-700 hover:underline">
            Sign In Here
          </Link>
        </div>
      </div>
    </div>
  );
}
