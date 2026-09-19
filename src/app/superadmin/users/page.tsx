'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { formatDate } from '@/lib/utils';
import { UserCheck, UserPlus, Trash2, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';

export default function SuperadminUsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');

  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/superadmin/users');
      const data = await res.json();
      if (res.ok && data.users) {
        setUsers(data.users);
      } else {
        setActionError(data.error || 'Failed to load admin users');
      }
    } catch (err: any) {
      setActionError(err.message || 'Failed to load admin users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError('');
    setFormSuccess('');

    try {
      const res = await fetch('/api/superadmin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, phone }),
      });

      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || 'Failed to create admin user');
      } else {
        setFormSuccess('Admin account created successfully!');
        setName('');
        setEmail('');
        setPassword('');
        setPhone('');
        setShowCreateModal(false);
        loadUsers();
      }
    } catch (err: any) {
      setFormError(err.message || 'Error creating admin user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (targetId: string, targetName: string) => {
    if (!confirm(`Are you sure you want to remove admin access for ${targetName}?`)) return;

    setActionError('');
    try {
      const res = await fetch(`/api/superadmin/users/${targetId}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (!res.ok) {
        setActionError(data.error || 'Failed to delete user');
      } else {
        loadUsers();
      }
    } catch (err: any) {
      setActionError(err.message || 'Failed to delete user');
    }
  };

  return (
    <div className="space-y-6 max-w-screen-xl">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-eco-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-amber-700" />
            <h1 className="font-serif font-bold text-xl text-slate-900">User Management</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">Create and manage operational administrator accounts</p>
        </div>
        <button
          onClick={() => {
            setFormError('');
            setFormSuccess('');
            setShowCreateModal(true);
          }}
          className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-colors flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" /> Create New Admin
        </button>
      </div>

      {actionError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" /> {actionError}
        </div>
      )}

      {formSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" /> {formSuccess}
        </div>
      )}

      {/* Admin Users List Table */}
      <div className="bg-white p-6 rounded-2xl border border-eco-100 shadow-xs space-y-4">
        <h3 className="font-serif font-bold text-base text-slate-900 border-b border-eco-100 pb-3">
          Administrative Accounts ({users.length})
        </h3>

        {isLoading ? (
          <div className="text-xs text-slate-500 font-bold p-6 text-center">Loading Admin User Accounts...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-eco-100 text-slate-400 font-medium">
                  <th className="py-3 px-3">Name</th>
                  <th className="py-3 px-3">Email</th>
                  <th className="py-3 px-3">Role</th>
                  <th className="py-3 px-3">Created</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const roleLower = u.role?.toLowerCase();
                  const isSuper = roleLower === 'superadmin';
                  return (
                    <tr key={u.id} className="border-b border-eco-50 hover:bg-canvas-50 transition-colors">
                      <td className="py-3.5 px-3 font-bold text-slate-900">{u.name}</td>
                      <td className="py-3.5 px-3 text-slate-600">{u.email}</td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isSuper ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-eco-100 text-eco-800'
                          }`}
                        >
                          {isSuper ? 'SUPERADMIN' : 'ADMIN'}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-slate-500">{formatDate(u.created_at)}</td>
                      <td className="py-3.5 px-3 text-right">
                        {!isSuper ? (
                          <button
                            onClick={() => handleDeleteUser(u.id, u.name)}
                            className="text-rose-600 hover:text-rose-800 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                            title="Remove Admin Access"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium italic">Protected</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Admin Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-3xl border border-eco-100 shadow-2xl max-w-md w-full space-y-4">
            <div className="flex justify-between items-center border-b border-eco-100 pb-3">
              <h3 className="font-serif font-bold text-lg text-slate-900">Create Operational Admin</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {formError}
              </div>
            )}

            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-canvas-100 border border-eco-200 rounded-xl py-2.5 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-amber-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="admin.name@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-canvas-100 border border-eco-200 rounded-xl py-2.5 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-amber-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Initial Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-canvas-100 border border-eco-200 rounded-xl py-2.5 pl-3 pr-10 text-xs focus:outline-none focus:ring-1 focus:ring-amber-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-md p-0.5 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Phone (Optional)</label>
                <input
                  type="text"
                  placeholder="+91 8247671857"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-canvas-100 border border-eco-200 rounded-xl py-2.5 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-amber-600"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-eco-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-canvas-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs"
                >
                  {isSubmitting ? 'Creating Admin...' : 'Create Admin Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
