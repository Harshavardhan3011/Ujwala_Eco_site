'use client';

import React, { useState, useEffect } from 'react';
import { Star, Trash2, ThumbsUp, ThumbsDown, Loader2, Search, AlertCircle } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'approved' | 'pending'>('all');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/reviews');
      const data = await res.json();
      if (data.reviews) setReviews(data.reviews);
    } catch { /* ignore */ } finally { setIsLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleApproval = async (id: string, isApproved: boolean) => {
    await fetch(`/api/admin/reviews/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isApproved }),
    });
    load();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/admin/reviews/${id}`, { method: 'DELETE' });
    setDeleteConfirm(null);
    load();
  };

  const filtered = reviews.filter(r => {
    const matchSearch = !search ||
      r.productName?.toLowerCase().includes(search.toLowerCase()) ||
      r.userName?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || (filter === 'approved' ? r.isApproved : !r.isApproved);
    return matchSearch && matchFilter;
  });

  return (
    <div className="space-y-5 max-w-screen-xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Reviews</h1>
          <p className="text-xs text-slate-500 mt-0.5">{reviews.length} total reviews</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-eco-100 px-4 py-3 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by product or customer…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-eco-200 rounded-lg bg-canvas-50 focus:outline-none focus:ring-2 focus:ring-eco-500"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'approved', 'pending'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold capitalize transition-colors ${filter === f ? 'bg-eco-700 text-white' : 'bg-canvas-50 border border-eco-200 text-slate-600 hover:bg-eco-50'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-24 bg-white rounded-xl border border-eco-100">
            <Loader2 className="w-6 h-6 animate-spin text-eco-600" />
            <span className="ml-2 text-sm text-slate-500">Loading reviews…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-xl border border-eco-100 text-slate-400">
            <Star className="w-12 h-12 mb-3 text-eco-200" />
            <p className="text-sm font-semibold text-slate-600">No reviews yet</p>
          </div>
        ) : (
          filtered.map(r => (
            <div key={r.id} className={`bg-white rounded-xl border overflow-hidden ${r.isApproved ? 'border-eco-100' : 'border-amber-200'}`}>
              <div className="px-5 py-4 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-3.5 h-3.5 ${i < r.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`} />
                      ))}
                    </div>
                    <span className="text-xs font-semibold text-slate-900">{r.userName}</span>
                    <span className="text-xs text-slate-400">on</span>
                    <span className="text-xs font-medium text-eco-700 truncate">{r.productName}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${r.isApproved ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {r.isApproved ? 'Approved' : 'Pending'}
                    </span>
                  </div>
                  {r.comment && <p className="text-sm text-slate-600 mt-1">{r.comment}</p>}
                  <p className="text-[11px] text-slate-400 mt-1.5">{formatDate(r.createdAt)}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!r.isApproved && (
                    <button onClick={() => handleApproval(r.id, true)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Approve">
                      <ThumbsUp className="w-4 h-4" />
                    </button>
                  )}
                  {r.isApproved && (
                    <button onClick={() => handleApproval(r.id, false)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Reject">
                      <ThumbsDown className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={() => setDeleteConfirm(r.id)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6 text-rose-600" />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-slate-900">Delete Review?</h3>
              <p className="text-sm text-slate-500 mt-1">This review will be permanently deleted.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 border border-slate-200 rounded-lg text-sm font-medium">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-semibold">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
