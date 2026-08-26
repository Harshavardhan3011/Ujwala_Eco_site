'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Package, Plus, Edit, Trash2, Search, X, Check,
  ChevronLeft, ChevronRight, Star, Loader2, AlertCircle, Upload,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';

const STOCK_BADGE = (qty: number) => {
  if (qty === 0) return 'bg-rose-100 text-rose-800 border-rose-200';
  if (qty <= 10) return 'bg-amber-100 text-amber-800 border-amber-200';
  return 'bg-emerald-100 text-emerald-800 border-emerald-200';
};

const STOCK_LABEL = (qty: number) => {
  if (qty === 0) return 'Out of Stock';
  if (qty <= 10) return 'Low Stock';
  return 'In Stock';
};

const EMPTY_FORM = {
  name: '', sku: '', description: '', shortDescription: '',
  categoryId: '', price: '', discountPrice: '', stockQuantity: '100',
  minOrderQuantity: '5', material: '100% Natural Jute', dimensions: '',
  weight: '', isCustomizable: false, isFeatured: false, isBestseller: false,
  tags: '', imageUrl: '',
};

type Product = {
  id: string; name: string; sku: string; description: string;
  shortDescription?: string; categoryId: string; price: number;
  discountPrice?: number; stockQuantity: number; minOrderQuantity: number;
  material?: string; dimensions?: string; weight?: string;
  isCustomizable: boolean; isFeatured: boolean; isBestseller: boolean;
  tags?: string; images: { imageUrl: string }[];
  category?: { name: string };
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 12;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ ...EMPTY_FORM });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ limit: '200' });
      if (search) params.set('search', search);
      const [prodRes, catRes] = await Promise.all([
        fetch(`/api/products?${params}`),
        fetch('/api/categories'),
      ]);
      const prodData = await prodRes.json();
      const catData = await catRes.json();
      if (prodData.products) setProducts(prodData.products);
      if (catData.categories) setCategories(catData.categories);
    } catch {
      setError('Failed to load products. Please refresh.');
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(fetchProducts, 300);
    return () => clearTimeout(t);
  }, [fetchProducts]);

  const filtered = products.filter(p =>
    !filterCategory || p.categoryId === filterCategory
  );
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openAddModal = () => {
    setEditingId(null);
    setFormData({
      ...EMPTY_FORM,
      sku: `UJW-${Date.now().toString().slice(-5)}`,
      categoryId: categories[0]?.id || '',
      isCustomizable: true, isFeatured: false, isBestseller: false,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingId(p.id);
    setFormData({
      name: p.name, sku: p.sku, description: p.description || '',
      shortDescription: p.shortDescription || '', categoryId: p.categoryId,
      price: String(p.price), discountPrice: p.discountPrice ? String(p.discountPrice) : '',
      stockQuantity: String(p.stockQuantity), minOrderQuantity: String(p.minOrderQuantity),
      material: p.material || '', dimensions: p.dimensions || '', weight: p.weight || '',
      isCustomizable: p.isCustomizable, isFeatured: p.isFeatured, isBestseller: p.isBestseller,
      tags: p.tags || '', imageUrl: p.images[0]?.imageUrl || '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/admin/upload', { method: 'POST', body: form });
      const data = await res.json();
      if (data.imageUrl) setFormData(prev => ({ ...prev, imageUrl: data.imageUrl }));
    } catch { /* ignore */ } finally { setUploadingImage(false); }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError('');
    try {
      const payload = { ...formData, images: formData.imageUrl ? [formData.imageUrl] : [] };
      const url = editingId ? `/api/products/${editingId}` : '/api/products';
      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error || 'Failed to save product'); return; }
      setIsModalOpen(false);
      fetchProducts();
    } catch {
      setFormError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/products/${id}`, { method: 'DELETE' });
      setDeleteConfirm(null);
      fetchProducts();
    } catch { /* ignore */ }
  };

  const inputCls = 'w-full bg-canvas-50 border border-eco-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-eco-500 focus:border-transparent transition-all';
  const labelCls = 'block text-xs font-semibold text-slate-700 mb-1';

  return (
    <div className="space-y-5 max-w-screen-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <h1 className="text-lg font-bold text-slate-900">Products</h1>
          <p className="text-xs text-slate-500 mt-0.5">{products.length} products in catalogue</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-eco-700 hover:bg-eco-800 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-xl border border-eco-100 px-4 py-3 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or SKU…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-2 text-sm border border-eco-200 rounded-lg bg-canvas-50 focus:outline-none focus:ring-2 focus:ring-eco-500"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}
          className="text-sm border border-eco-200 rounded-lg px-3 py-2 bg-canvas-50 focus:outline-none focus:ring-2 focus:ring-eco-500"
        >
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-eco-100 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 animate-spin text-eco-600" />
            <span className="ml-2 text-sm text-slate-500">Loading products…</span>
          </div>
        ) : paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <Package className="w-12 h-12 mb-3 text-eco-200" />
            <p className="font-semibold text-sm text-slate-600">No products found</p>
            <p className="text-xs mt-1">{search ? 'Try a different search term' : 'Click "Add Product" to get started'}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-eco-100 bg-canvas-50 text-xs text-slate-500 font-semibold">
                    <th className="text-left py-3 px-4">Product</th>
                    <th className="text-left py-3 px-4">SKU</th>
                    <th className="text-left py-3 px-4 hidden md:table-cell">Category</th>
                    <th className="text-left py-3 px-4">Price</th>
                    <th className="text-left py-3 px-4">Stock</th>
                    <th className="text-left py-3 px-4 hidden sm:table-cell">Flags</th>
                    <th className="text-right py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-eco-50">
                  {paginated.map((p) => (
                    <tr key={p.id} className="hover:bg-canvas-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-canvas-100 border border-eco-100 overflow-hidden shrink-0">
                            {p.images[0]?.imageUrl ? (
                              <img src={p.images[0].imageUrl} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-4 h-4 text-eco-300" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 text-xs leading-tight truncate max-w-[200px]">{p.name}</p>
                            {p.isCustomizable && <span className="text-[10px] text-jute-700 font-medium">Customizable</span>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-500">{p.sku}</td>
                      <td className="py-3 px-4 hidden md:table-cell text-xs text-slate-600">{p.category?.name || '—'}</td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-xs text-slate-900">{formatPrice(p.discountPrice ?? p.price)}</p>
                        {p.discountPrice && <p className="text-[10px] text-slate-400 line-through">{formatPrice(p.price)}</p>}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STOCK_BADGE(p.stockQuantity)}`}>
                          {p.stockQuantity === 0 ? 'Out of Stock' : `${p.stockQuantity} pcs`}
                        </span>
                      </td>
                      <td className="py-3 px-4 hidden sm:table-cell">
                        <div className="flex gap-1">
                          {p.isFeatured && (
                            <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium flex items-center gap-0.5">
                              <Star className="w-2.5 h-2.5" />Featured
                            </span>
                          )}
                          {p.isBestseller && (
                            <span className="text-[10px] bg-eco-100 text-eco-700 px-1.5 py-0.5 rounded font-medium">Bestseller</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditModal(p)}
                            className="p-1.5 text-eco-700 hover:bg-eco-50 rounded-lg transition-colors"
                            title="Edit product"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(p.id)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-eco-50 text-xs text-slate-500">
                <span>Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</span>
                <div className="flex items-center gap-1">
                  <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-1.5 rounded-lg disabled:opacity-40 hover:bg-eco-50 transition-colors">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-2 font-medium">{page}/{totalPages}</span>
                  <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="p-1.5 rounded-lg disabled:opacity-40 hover:bg-eco-50 transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6 text-rose-600" />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-slate-900">Delete Product?</h3>
              <p className="text-sm text-slate-500 mt-1">This action cannot be undone. The product will be permanently removed from the catalogue.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-canvas-50">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-semibold transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl my-8 shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-eco-100">
              <h2 className="font-bold text-slate-900">{editingId ? 'Edit Product' : 'Add Product'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-canvas-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="px-6 py-5 space-y-5">
              {formError && (
                <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg px-3 py-2.5 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {formError}
                </div>
              )}

              {/* Basic Info */}
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Basic Information</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className={labelCls}>Product Name *</label>
                    <input type="text" required value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} className={inputCls} placeholder="e.g. Natural Jute Tote Bag" />
                  </div>
                  <div>
                    <label className={labelCls}>SKU *</label>
                    <input type="text" required value={formData.sku} onChange={e => setFormData(p => ({ ...p, sku: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Category *</label>
                    <select required value={formData.categoryId} onChange={e => setFormData(p => ({ ...p, categoryId: e.target.value }))} className={inputCls}>
                      <option value="">Select category</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelCls}>Short Description</label>
                    <input type="text" value={formData.shortDescription} onChange={e => setFormData(p => ({ ...p, shortDescription: e.target.value }))} className={inputCls} placeholder="Brief one-line summary" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelCls}>Full Description *</label>
                    <textarea rows={3} required value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} className={inputCls} />
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Pricing & Inventory</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className={labelCls}>Price (₹) *</label>
                    <input type="number" step="0.01" min="0" required value={formData.price} onChange={e => setFormData(p => ({ ...p, price: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Discount Price (₹)</label>
                    <input type="number" step="0.01" min="0" value={formData.discountPrice} onChange={e => setFormData(p => ({ ...p, discountPrice: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Stock Qty *</label>
                    <input type="number" min="0" required value={formData.stockQuantity} onChange={e => setFormData(p => ({ ...p, stockQuantity: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>MOQ</label>
                    <input type="number" min="1" value={formData.minOrderQuantity} onChange={e => setFormData(p => ({ ...p, minOrderQuantity: e.target.value }))} className={inputCls} />
                  </div>
                </div>
              </div>

              {/* Specs */}
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Specifications</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className={labelCls}>Material</label>
                    <input type="text" value={formData.material} onChange={e => setFormData(p => ({ ...p, material: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Dimensions</label>
                    <input type="text" value={formData.dimensions} onChange={e => setFormData(p => ({ ...p, dimensions: e.target.value }))} className={inputCls} placeholder='12"W x 14"H' />
                  </div>
                  <div>
                    <label className={labelCls}>Weight</label>
                    <input type="text" value={formData.weight} onChange={e => setFormData(p => ({ ...p, weight: e.target.value }))} className={inputCls} placeholder="220g" />
                  </div>
                </div>
              </div>

              {/* Image */}
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Product Image</p>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl border border-eco-200 bg-canvas-100 overflow-hidden shrink-0">
                    {formData.imageUrl ? (
                      <img src={formData.imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-6 h-6 text-eco-300" />
                      </div>
                    )}
                  </div>
                  <label className="flex items-center gap-2 px-4 py-2 border border-dashed border-eco-300 rounded-lg text-sm text-eco-700 font-medium hover:bg-eco-50 cursor-pointer transition-colors">
                    {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {uploadingImage ? 'Uploading…' : 'Upload Image'}
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                  {formData.imageUrl && (
                    <button type="button" onClick={() => setFormData(p => ({ ...p, imageUrl: '' }))} className="text-xs text-slate-400 hover:text-rose-500">Remove</button>
                  )}
                </div>
              </div>

              {/* Flags */}
              <div className="flex flex-wrap gap-5 pt-2 border-t border-eco-50">
                {[
                  { key: 'isCustomizable', label: 'Customizable Printing' },
                  { key: 'isFeatured', label: 'Featured Product' },
                  { key: 'isBestseller', label: 'Bestseller Tag' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <div
                      onClick={() => setFormData(p => ({ ...p, [key]: !p[key as keyof typeof p] }))}
                      className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${formData[key as keyof typeof formData] ? 'bg-eco-600' : 'bg-slate-200'}`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${formData[key as keyof typeof formData] ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </div>
                    <span className="text-sm text-slate-700 font-medium">{label}</span>
                  </label>
                ))}
              </div>

              <div className="flex gap-3 pt-2 border-t border-eco-50">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-canvas-50">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 bg-eco-700 hover:bg-eco-800 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                  {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : <><Check className="w-4 h-4" />{editingId ? 'Update Product' : 'Create Product'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
