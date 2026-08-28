'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Package, Plus, Edit, Trash2, Search, X, Check,
  ChevronLeft, ChevronRight, Star, Loader2, AlertCircle, Upload, Image as ImageIcon,
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
  tags: '', images: [] as string[],
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
  const [isDragging, setIsDragging] = useState(false);
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
      images: [],
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
      tags: p.tags || '', images: p.images ? p.images.map(img => img.imageUrl) : [],
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const uploadFiles = async (files: FileList | File[]) => {
    const validFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (validFiles.length === 0) return;

    setUploadingImage(true);
    setFormError('');

    try {
      const uploadPromises = validFiles.map(async (file) => {
        const form = new FormData();
        form.append('file', file);
        form.append('bucket', 'products');
        const res = await fetch('/api/admin/upload', { method: 'POST', body: form });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Upload failed');
        return data.imageUrl as string;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls.filter(Boolean)],
      }));
    } catch (err: any) {
      setFormError(err.message || 'Image upload failed. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = (indexToRemove: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== indexToRemove),
    }));
  };

  const setPrimaryImage = (indexToPrimary: number) => {
    setFormData(prev => {
      const target = prev.images[indexToPrimary];
      const rest = prev.images.filter((_, idx) => idx !== indexToPrimary);
      return {
        ...prev,
        images: [target, ...rest],
      };
    });
  };

  const moveImage = (index: number, direction: 'left' | 'right') => {
    setFormData(prev => {
      const newImages = [...prev.images];
      const targetIndex = direction === 'left' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= newImages.length) return prev;
      const temp = newImages[index];
      newImages[index] = newImages[targetIndex];
      newImages[targetIndex] = temp;
      return { ...prev, images: newImages };
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError('');
    try {
      const payload = {
        ...formData,
        images: formData.images,
      };
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
                            {p.images && p.images[0]?.imageUrl ? (
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

              {/* Product Images (Drag & Drop + Supabase Storage Upload) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Product Images ({formData.images.length})
                  </p>
                  <span className="text-[11px] text-slate-400 font-normal">
                    First image will be used as the primary display image
                  </span>
                </div>

                {/* Drag and Drop Zone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    if (e.dataTransfer.files) uploadFiles(e.dataTransfer.files);
                  }}
                  className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                    isDragging
                      ? 'border-eco-600 bg-eco-50 scale-[1.005]'
                      : 'border-eco-200 bg-canvas-50 hover:border-eco-400 hover:bg-canvas-100'
                  }`}
                >
                  <input
                    type="file"
                    multiple
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={(e) => e.target.files && uploadFiles(e.target.files)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    disabled={uploadingImage}
                  />
                  <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
                    <div className="w-12 h-12 rounded-full bg-eco-100 flex items-center justify-center text-eco-700 shadow-xs">
                      {uploadingImage ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        <Upload className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {uploadingImage ? 'Uploading images to Supabase Storage…' : 'Drag & drop product images here'}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        or <span className="text-eco-700 font-bold underline">Choose Images</span> from your computer
                      </p>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      JPG, JPEG, PNG, WEBP supported. Multiple images allowed.
                    </p>
                  </div>
                </div>

                {/* Uploaded Image Gallery Grid */}
                {formData.images.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
                    {formData.images.map((url, idx) => (
                      <div
                        key={`${url}-${idx}`}
                        className="group relative rounded-xl border border-eco-200 bg-white overflow-hidden shadow-xs hover:shadow-md transition-all"
                      >
                        <div className="aspect-square w-full bg-slate-100 relative overflow-hidden">
                          <img
                            src={url}
                            alt={`Product Preview ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />

                          {/* Primary Badge or Set Primary Action */}
                          {idx === 0 ? (
                            <span className="absolute top-2 left-2 bg-eco-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                              <Star className="w-2.5 h-2.5 fill-current" /> Primary
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setPrimaryImage(idx)}
                              className="absolute top-2 left-2 bg-slate-900/75 hover:bg-eco-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                            >
                              Make Primary
                            </button>
                          )}

                          {/* Delete/Remove Button */}
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="absolute top-2 right-2 bg-rose-600/90 hover:bg-rose-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                            title="Remove image"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>

                          {/* Reorder Arrows */}
                          {formData.images.length > 1 && (
                            <div className="absolute bottom-2 inset-x-2 flex justify-between opacity-0 group-hover:opacity-100 transition-all">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => moveImage(idx, 'left')}
                                className="bg-slate-900/75 hover:bg-slate-900 text-white p-1 rounded-md disabled:opacity-30 transition-colors"
                                title="Move left"
                              >
                                <ChevronLeft className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === formData.images.length - 1}
                                onClick={() => moveImage(idx, 'right')}
                                className="bg-slate-900/75 hover:bg-slate-900 text-white p-1 rounded-md disabled:opacity-30 transition-colors"
                                title="Move right"
                              >
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
                <button type="submit" disabled={isSubmitting || uploadingImage} className="flex-1 py-2.5 bg-eco-700 hover:bg-eco-800 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
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
