'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { X, Star, ShoppingBag, Heart, Check, Shield, Truck } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

export interface QuickViewModalProps {
  product: any;
  onClose: () => void;
}

export const QuickViewModal = ({ product, onClose }: QuickViewModalProps) => {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [selectedImage, setSelectedImage] = useState(
    product.images[0]?.imageUrl || '/uploads/b1.jpeg'
  );
  const [quantity, setQuantity] = useState(product.minOrderQuantity || 1);
  const [customizationNotes, setCustomizationNotes] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);

  const inWishlist = isInWishlist(product.id);

  const handleAddToCart = async () => {
    setIsAdding(true);
    const res = await addToCart(product.id, quantity, customizationNotes);
    setIsAdding(false);
    if (res.success) {
      setAddedSuccess(true);
      setTimeout(() => setAddedSuccess(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl z-10 border border-eco-200 overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 bg-canvas-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Gallery Column */}
          <div className="space-y-3">
            <div className="aspect-square bg-canvas-100 rounded-2xl overflow-hidden border border-eco-100">
              <img
                src={selectedImage}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            {product.images?.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {product.images.map((img: any, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(img.imageUrl)}
                    className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === img.imageUrl ? 'border-eco-600' : 'border-transparent opacity-70'
                    }`}
                  >
                    <img src={img.imageUrl} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details Column */}
          <div className="space-y-4">
            <div>
              <span className="text-xs font-bold text-eco-700 uppercase tracking-wider">
                {product.category?.name || 'Jute Bag'}
              </span>
              <h2 className="font-serif font-bold text-xl text-slate-900 mt-1">{product.name}</h2>
              <p className="text-xs text-slate-500 mt-0.5">SKU: {product.sku}</p>

              <div className="flex items-center gap-2 mt-2">
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(product.avgRating || 5) ? 'fill-amber-400' : 'text-slate-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-slate-600 font-semibold">
                  ({product.totalReviews || 1} Reviews)
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 p-3 bg-canvas-100 rounded-xl border border-eco-100">
              <span className="font-serif font-bold text-2xl text-eco-900">
                {formatPrice(product.discountPrice ?? product.price)}
              </span>
              {product.discountPrice && (
                <span className="text-sm text-slate-400 line-through">
                  {formatPrice(product.price)}
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
              {product.description}
            </p>

            {/* Customization Details */}
            {product.isCustomizable && (
              <div className="space-y-1.5 p-3 bg-jute-50 border border-jute-200 rounded-xl text-xs">
                <label className="font-bold text-jute-900 block">
                  ✏️ Custom Printing Instructions (Optional):
                </label>
                <input
                  type="text"
                  placeholder="e.g. Couples names, event date, color preference..."
                  value={customizationNotes}
                  onChange={(e) => setCustomizationNotes(e.target.value)}
                  className="w-full bg-white border border-jute-300 rounded-lg p-2 text-xs focus:outline-none"
                />
              </div>
            )}

            {/* Quantity Selector */}
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-slate-700">Quantity:</span>
              <div className="flex items-center border border-eco-300 rounded-lg bg-white">
                <button
                  onClick={() => setQuantity(Math.max(product.minOrderQuantity || 1, quantity - 1))}
                  className="px-3 py-1 text-slate-700 font-bold"
                >
                  -
                </button>
                <span className="px-3 py-1 text-xs font-bold text-slate-900">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 py-1 text-slate-700 font-bold"
                >
                  +
                </button>
              </div>
              {product.minOrderQuantity > 1 && (
                <span className="text-[11px] text-slate-500 font-medium">
                  (Min Order: {product.minOrderQuantity} pcs)
                </span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleAddToCart}
                disabled={isAdding}
                className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md ${
                  addedSuccess ? 'bg-emerald-600 text-white' : 'bg-eco-700 hover:bg-eco-800 text-white'
                }`}
              >
                {addedSuccess ? <Check className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
                {addedSuccess ? 'Added to Cart' : 'Add to Cart'}
              </button>

              <button
                onClick={() => toggleWishlist(product.id)}
                className={`p-3 rounded-xl border transition-colors ${
                  inWishlist ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-white border-eco-200 text-slate-600 hover:bg-eco-50'
                }`}
              >
                <Heart className={`w-4 h-4 ${inWishlist ? 'fill-rose-600' : ''}`} />
              </button>
            </div>

            <Link
              href={`/products/${product.slug}`}
              onClick={onClose}
              className="block text-center text-xs font-bold text-eco-700 hover:underline pt-1"
            >
              View Full Product Specifications & Details →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
