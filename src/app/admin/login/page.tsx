import React, { Suspense } from 'react';
import { Metadata } from 'next';
import AdminLoginForm from './AdminLoginForm';

export const metadata: Metadata = {
  title: 'Admin Control Center Sign In | Ujwala Eco Products',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLoginPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center container mx-auto px-4 py-16 max-w-md">
      <Suspense fallback={<div className="text-xs text-slate-500 text-center font-bold">Loading Security Portal...</div>}>
        <AdminLoginForm />
      </Suspense>
    </div>
  );
}
