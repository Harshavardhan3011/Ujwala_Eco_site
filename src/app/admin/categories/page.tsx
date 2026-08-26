'use client';

import React, { useState, useEffect } from 'react';
import { FolderTree, Plus, Edit, Trash2, X, Loader2, AlertCircle, Check } from 'lucide-react';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [displayOrder, setDisplayOrder] = useState('1');

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (data.categories) setCategories(data.categories);
    } catch { /* ignore */ } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchCategories(); }, []);

  const openAdd = () => {
    setEditingId(null); setName(''); setDescription('');
    setImage(''); setDisplayOrder(String(categories.length + 1));
    setFormError(''); setIsModalOpen(true);
  };

  const openEdit = (c: any) => {
    setEditingId(c.id); setName(c.name); setDescription(c.description || '');
    setImage(c.image || ''); setDisplayOrder(String(c.displayOrder || 1));
    setFormError(''); setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError('');
    try {
      const url = editingId ? `/api/categories/${editingId}` : '/api/categories';
      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, image, displayOrder }),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error || 'Failed to save'); return; }
      setIsModalOpen(false);
      fetchCategories();
    } catch { setFormError('Network error'); } finally { setIsSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      setDeleteConfirm(null);
      fetchCategories();
    } catch { /* ignore */ }
  };

  const inputCls = 'w-full bg-canvas-50 border border-eco-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-eco-500';
  const labelCls = 'block text-xs font-semibold text-slate-700 mb-1';

  return (
    <div className="space-y-5 max-w-screen-lg">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Categories</h1>
          <p className="text-xs text-slate-500 mt-0.5">{categories.length} categories</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-eco-700 hover:bg-eco-800 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors">
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      <div className="bg-white rounded-xl border border-eco-100 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-eco-600" />
            <span className="ml-2 text-sm text-slate-500">Loading…</span>
          </div>
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <FolderTree className="w-12 h-12 mb-3 text-eco-200" />
            <p className="text-sm font-semibold text-slate-600">No categories yet</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-eco-100 bg-canvas-50 text-xs text-slate-500 font-semibold">
                <th className="text-left py-3 px-4">Category</th>
                <th className="text-left py-3 px-4 hidden sm:table-cell">Slug</th>
                <th className="text-left py-3 px-4">Products</th>
                <th className="text-left py-3 px-4 hidden md:table-cell">Order</th>
                <th className="text-right py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-eco-50">
              {categories.map((c) => (
                <tr key={c.id} className="hover:bg-canvas-50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg border border-eco-100 bg-canvas-100 overflow-hidden shrink-0">
                        {c.image ? (
                          <img src={c.image} alt={c.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FolderTree className="w-4 h-4 text-eco-300" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{c.name}</p>
                        {c.description && <p className="text-[11px] text-slate-400 truncate max-w-[200px]">{c.description}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-slate-500 hidden sm:table-cell">{c.slug}</td>
                  <td className="py-3 px-4 font-semibold text-eco-800 text-xs">{c._count?.products ?? 0}</td>
                  <td className="py-3 px-4 text-xs text-slate-500 hidden md:table-cell">{c.displayOrder}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(c)} className="p-1.5 text-eco-700 hover:bg-eco-50 rounded-lg transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteConfirm(c.id)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6 text-rose-600" />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-slate-900">Delete Category?</h3>
              <p className="text-sm text-slate-500 mt-1">This cannot be undone. Products in this category will be unassigned.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 border border-slate-200 rounded-lg text-sm font-medium">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-semibold">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-eco-100">
              <h2 className="font-bold text-slate-900">{editingId ? 'Edit Category' : 'Add Category'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-canvas-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="px-6 py-5 space-y-4">
              {formError && (
                <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg px-3 py-2.5 text-sm">
                  <AlertCircle className="w-4 h-4" />{formError}
                </div>
              )}
              <div>
                <label className={labelCls}>Category Name *</label>
                <input type="text" required value={name} onChange={e => setName(e.target.value)} className={inputCls} placeholder="e.g. Jute Tote Bags" />
              </div>
              <div>
                <label className={labelCls}>Description</label>
                <textarea rows={2} value={description} onChange={e => setDescription(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Image URL (Supabase Storage)</label>
                <input type="text" value={image} onChange={e => setImage(e.target.value)} className={inputCls} placeholder="https://..." />
                {image && <img src={image} alt="" className="mt-2 h-16 w-16 object-cover rounded-lg border border-eco-200" />}
              </div>
              <div>
                <label className={labelCls}>Display Order</label>
                <input type="number" min="1" value={displayOrder} onChange={e => setDisplayOrder(e.target.value)} className={inputCls} />
              </div>
              <div className="flex gap-3 pt-2 border-t border-eco-50">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-700">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 bg-eco-700 hover:bg-eco-800 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2">
                  {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : <><Check className="w-4 h-4" />{editingId ? 'Update' : 'Create'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
