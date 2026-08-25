'use client';

import React, { useState, useEffect } from 'react';
import { FolderTree, Plus, Edit, Trash2, X } from 'lucide-react';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('/bags/b1.jpeg');
  const [displayOrder, setDisplayOrder] = useState('1');

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (data.categories) setCategories(data.categories);
    } catch (err) {
      console.error('Fetch categories error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingId ? `/api/categories/${editingId}` : '/api/categories';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, image, displayOrder }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setEditingId(null);
        setName('');
        setDescription('');
        fetchCategories();
      }
    } catch (err) {
      console.error('Save category error:', err);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      fetchCategories();
    } catch (err) {
      console.error('Delete category error:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-eco-100 shadow-xs flex justify-between items-center">
        <div>
          <h2 className="font-serif font-bold text-xl text-slate-900">Category Management</h2>
          <p className="text-xs text-slate-500">Organize store categories and display ordering</p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setName('');
            setDescription('');
            setImage('/bags/b1.jpeg');
            setDisplayOrder(String(categories.length + 1));
            setIsModalOpen(true);
          }}
          className="bg-eco-700 hover:bg-eco-800 text-white text-xs font-bold px-4 py-2 rounded-full flex items-center gap-1.5 shadow-xs"
        >
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-eco-100 overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-canvas-50 border-b border-eco-100 text-slate-500 font-bold">
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Slug</th>
              <th className="py-3 px-4">Products</th>
              <th className="py-3 px-4">Display Order</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id} className="border-b border-eco-50 hover:bg-canvas-50">
                <td className="py-3 px-4 flex items-center gap-3">
                  <img src={c.image || '/bags/b1.jpeg'} alt="" className="w-9 h-9 object-cover rounded-lg" />
                  <span className="font-bold text-slate-900">{c.name}</span>
                </td>
                <td className="py-3 px-4 font-mono text-slate-500">{c.slug}</td>
                <td className="py-3 px-4 font-bold text-eco-800">{c._count?.products || 0}</td>
                <td className="py-3 px-4 text-slate-600">{c.displayOrder}</td>
                <td className="py-3 px-4 text-right space-x-2">
                  <button
                    onClick={() => {
                      setEditingId(c.id);
                      setName(c.name);
                      setDescription(c.description || '');
                      setImage(c.image || '/bags/b1.jpeg');
                      setDisplayOrder(String(c.displayOrder));
                      setIsModalOpen(true);
                    }}
                    className="p-1.5 text-eco-700 hover:bg-eco-50 rounded-lg"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(c.id)}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-eco-200">
            <div className="flex justify-between items-center border-b border-eco-100 pb-3">
              <h3 className="font-serif font-bold text-base text-slate-900">
                {editingId ? 'Edit Category' : 'Create Category'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveCategory} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-canvas-100 border border-eco-200 rounded-xl p-2.5"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-canvas-100 border border-eco-200 rounded-xl p-2.5"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Display Order</label>
                <input
                  type="number"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(e.target.value)}
                  className="w-full bg-canvas-100 border border-eco-200 rounded-xl p-2.5"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-eco-700 hover:bg-eco-800 text-white font-bold py-3 rounded-xl shadow-md"
              >
                Save Category
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
