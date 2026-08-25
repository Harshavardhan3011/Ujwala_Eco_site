'use client';

import React, { useState, useEffect } from 'react';
import { Package, Plus, Edit, Trash2, Search, Upload, X, Check, DollarSign } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    shortDescription: '',
    categoryId: '',
    price: '',
    discountPrice: '',
    stockQuantity: '100',
    minOrderQuantity: '5',
    material: '100% Natural Jute',
    dimensions: '12" W x 14" H x 4" D',
    weight: '220g',
    isCustomizable: false,
    isFeatured: false,
    isBestseller: false,
    tags: '',
    imageUrl: '/uploads/b1.jpeg',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const fetchAdminProducts = async () => {
    setIsLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch(`/api/products?search=${encodeURIComponent(search)}&limit=100`),
        fetch('/api/categories'),
      ]);
      const prodData = await prodRes.json();
      const catData = await catRes.json();
      if (prodData.products) setProducts(prodData.products);
      if (catData.categories) setCategories(catData.categories);
    } catch (err) {
      console.error('Fetch admin products error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminProducts();
  }, [search]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: form,
      });
      const data = await res.json();
      if (data.imageUrl) {
        setFormData((prev) => ({ ...prev, imageUrl: data.imageUrl }));
      }
    } catch (err) {
      console.error('Image upload failed:', err);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        images: [formData.imageUrl],
      };

      const url = editingProductId ? `/api/products/${editingProductId}` : '/api/products';
      const method = editingProductId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setEditingProductId(null);
        fetchAdminProducts();
      }
    } catch (err) {
      console.error('Save product error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (p: any) => {
    setEditingProductId(p.id);
    setFormData({
      name: p.name,
      sku: p.sku,
      description: p.description || '',
      shortDescription: p.shortDescription || '',
      categoryId: p.categoryId,
      price: String(p.price),
      discountPrice: p.discountPrice ? String(p.discountPrice) : '',
      stockQuantity: String(p.stockQuantity),
      minOrderQuantity: String(p.minOrderQuantity),
      material: p.material || '',
      dimensions: p.dimensions || '',
      weight: p.weight || '',
      isCustomizable: p.isCustomizable,
      isFeatured: p.isFeatured,
      isBestseller: p.isBestseller,
      tags: p.tags || '',
      imageUrl: p.images[0]?.imageUrl || '/uploads/b1.jpeg',
    });
    setIsModalOpen(true);
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product from the database?')) return;
    try {
      await fetch(`/api/products/${id}`, { method: 'DELETE' });
      fetchAdminProducts();
    } catch (err) {
      console.error('Delete product error:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="bg-white p-6 rounded-2xl border border-eco-100 shadow-xs flex flex-wrap justify-between items-center gap-4">
        <div>
          <h2 className="font-serif font-bold text-xl text-slate-900">Product Management</h2>
          <p className="text-xs text-slate-500">Add, edit product prices, manage inventory stock & discounts</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search product..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-canvas-100 border border-eco-200 rounded-full py-1.5 pl-8 pr-3 text-xs focus:outline-none"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>

          <button
            onClick={() => {
              setEditingProductId(null);
              setFormData({
                name: '',
                sku: `UJW-${Date.now().toString().slice(-4)}`,
                description: '',
                shortDescription: '',
                categoryId: categories[0]?.id || '',
                price: '200',
                discountPrice: '175',
                stockQuantity: '100',
                minOrderQuantity: '5',
                material: '100% Natural Golden Jute',
                dimensions: '12" W x 14" H x 4" D',
                weight: '220g',
                isCustomizable: true,
                isFeatured: true,
                isBestseller: false,
                tags: 'jute bag, return gift',
                imageUrl: '/uploads/b1.jpeg',
              });
              setIsModalOpen(true);
            }}
            className="bg-eco-700 hover:bg-eco-800 text-white text-xs font-bold px-4 py-2 rounded-full flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" /> Add New Product
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-eco-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-canvas-50 border-b border-eco-100 text-slate-500 font-bold">
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">SKU</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">DB Price</th>
                <th className="py-3 px-4">Stock</th>
                <th className="py-3 px-4">MOQ</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-eco-50 hover:bg-canvas-50">
                  <td className="py-3 px-4 flex items-center gap-3">
                    <img src={p.images[0]?.imageUrl || '/uploads/b1.jpeg'} alt="" className="w-10 h-10 object-cover rounded-lg" />
                    <div>
                      <p className="font-bold text-slate-900 line-clamp-1">{p.name}</p>
                      {p.isCustomizable && <span className="text-[10px] text-jute-700 font-bold">Customizable</span>}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600">{p.sku}</td>
                  <td className="py-3 px-4 text-slate-700 font-medium">{p.category?.name}</td>
                  <td className="py-3 px-4 font-bold text-eco-800">
                    {formatPrice(p.discountPrice ?? p.price)}
                    {p.discountPrice && <span className="text-[10px] text-slate-400 line-through block">{formatPrice(p.price)}</span>}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${p.stockQuantity > 10 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                      {p.stockQuantity} pcs
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-700">{p.minOrderQuantity} pcs</td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <button
                      onClick={() => handleEditClick(p)}
                      className="p-1.5 text-eco-700 hover:bg-eco-50 rounded-lg"
                      title="Edit Product"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(p.id)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                      title="Delete Product"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Edit / Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto border border-eco-200">
            <div className="flex justify-between items-center border-b border-eco-100 pb-3">
              <h3 className="font-serif font-bold text-lg text-slate-900">
                {editingProductId ? 'Edit Product Details & Price' : 'Add New Database Product'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-canvas-100 border border-eco-200 rounded-xl p-2.5 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">SKU *</label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full bg-canvas-100 border border-eco-200 rounded-xl p-2.5 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category *</label>
                  <select
                    required
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full bg-canvas-100 border border-eco-200 rounded-xl p-2.5 focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Regular Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full bg-canvas-100 border border-eco-200 rounded-xl p-2.5 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Discount Price (₹ Optional)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.discountPrice}
                    onChange={(e) => setFormData({ ...formData, discountPrice: e.target.value })}
                    className="w-full bg-canvas-100 border border-eco-200 rounded-xl p-2.5 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Stock Quantity *</label>
                  <input
                    type="number"
                    required
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                    className="w-full bg-canvas-100 border border-eco-200 rounded-xl p-2.5 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Min Order Quantity (MOQ)</label>
                  <input
                    type="number"
                    required
                    value={formData.minOrderQuantity}
                    onChange={(e) => setFormData({ ...formData, minOrderQuantity: e.target.value })}
                    className="w-full bg-canvas-100 border border-eco-200 rounded-xl p-2.5 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Material</label>
                  <input
                    type="text"
                    value={formData.material}
                    onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                    className="w-full bg-canvas-100 border border-eco-200 rounded-xl p-2.5 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Product Image Upload / URL</label>
                <div className="flex items-center gap-3">
                  <img src={formData.imageUrl} alt="" className="w-12 h-12 object-cover rounded-xl border border-eco-200 shrink-0" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="text-xs text-slate-500"
                  />
                  {uploadingImage && <span className="text-xs font-bold text-eco-700">Uploading...</span>}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Description</label>
                <textarea
                  rows={3}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-canvas-100 border border-eco-200 rounded-xl p-2.5 focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap gap-4 pt-2 border-t border-eco-100">
                <label className="flex items-center gap-2 font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={formData.isCustomizable}
                    onChange={(e) => setFormData({ ...formData, isCustomizable: e.target.checked })}
                  />
                  Customizable Printing
                </label>

                <label className="flex items-center gap-2 font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                  />
                  Featured Product
                </label>

                <label className="flex items-center gap-2 font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={formData.isBestseller}
                    onChange={(e) => setFormData({ ...formData, isBestseller: e.target.checked })}
                  />
                  Bestseller Tag
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-eco-700 hover:bg-eco-800 text-white font-bold py-3 rounded-xl shadow-md transition-colors"
              >
                {isSubmitting ? 'Saving to Database...' : 'Save Product & Update Website'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
