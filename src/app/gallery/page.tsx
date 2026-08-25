'use client';

import React, { useState } from 'react';
import { X, ZoomIn } from 'lucide-react';

export default function GalleryPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const galleryItems = [
    { src: '/uploads/b1.jpeg', category: 'products', title: 'Everyday Jute Tote Bag' },
    { src: '/uploads/b3.jpeg', category: 'products', title: 'Custom Printed Return Gift Bag' },
    { src: '/uploads/b5.jpeg', category: 'products', title: 'Zari Border Gift Bag' },
    { src: '/uploads/b18.jpeg', category: 'products', title: 'Solid Brass Diya Set' },
    { src: '/uploads/b22.jpeg', category: 'products', title: 'Etikoppaka Wooden Toy' },
    { src: '/uploads/m1.jpeg', category: 'manufacturing', title: 'Manufacturing Workshop' },
    { src: '/uploads/m2.jpeg', category: 'manufacturing', title: 'Stitching Unit' },
    { src: '/uploads/m3.jpeg', category: 'manufacturing', title: 'Raw Material Processing' },
    { src: '/uploads/o1.jpeg', category: 'opening', title: 'Opening Ceremony' },
    { src: '/uploads/o2.jpeg', category: 'opening', title: 'Unit Inauguration' },
    { src: '/uploads/o3.jpeg', category: 'opening', title: 'Opening Function' },
    { src: '/uploads/e1.jpeg', category: 'social', title: 'Book Distribution Event' },
    { src: '/uploads/e2.jpeg', category: 'social', title: 'Stationery Distribution' },
    { src: '/uploads/e3.jpeg', category: 'social', title: 'Social Trust Function' },
    { src: '/uploads/e4.jpeg', category: 'social', title: 'Merit Scholarship Award' },
  ];

  const filteredItems = activeTab === 'all'
    ? galleryItems
    : galleryItems.filter((item) => item.category === activeTab);

  return (
    <div className="container mx-auto px-4 py-10 space-y-8">
      {/* Header */}
      <div className="text-center max-w-xl mx-auto space-y-2">
        <span className="text-xs font-bold text-eco-700 uppercase tracking-wider block">Visual Showcase</span>
        <h1 className="font-serif font-bold text-3xl text-slate-900">Ujwala Photo Gallery</h1>
        <p className="text-xs text-slate-500">
          Browse real photographs of our product catalog, manufacturing unit, inauguration ceremony, and social trust initiatives.
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap justify-center gap-2">
        {[
          { id: 'all', label: 'All Photos' },
          { id: 'products', label: 'Products' },
          { id: 'manufacturing', label: 'Manufacturing' },
          { id: 'opening', label: 'Opening Ceremony' },
          { id: 'social', label: 'Social Trust' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-colors ${
              activeTab === tab.id
                ? 'bg-eco-700 text-white shadow-xs'
                : 'bg-canvas-100 text-slate-600 hover:bg-eco-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Photo Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {filteredItems.map((item, idx) => (
          <div
            key={idx}
            onClick={() => setLightboxImage(item.src)}
            className="aspect-square bg-canvas-100 rounded-2xl overflow-hidden border border-eco-100 relative group cursor-pointer shadow-xs hover:shadow-lg transition-all"
          >
            <img src={item.src} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white p-2 text-center">
              <ZoomIn className="w-6 h-6 mb-1" />
              <span className="text-[11px] font-bold">{item.title}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-6 right-6 text-white bg-white/20 p-2 rounded-full hover:bg-white/40 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={lightboxImage}
            alt="Enlarged view"
            className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain"
          />
        </div>
      )}
    </div>
  );
}
