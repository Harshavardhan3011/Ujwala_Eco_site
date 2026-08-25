'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { Heart, ShoppingBag, Star, Eye, Check } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

export interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    discountPrice?: number | null;
    stockQuantity: number;
    minOrderQuantity: number;
    isCustomizable: boolean;
    isFeatured?: boolean;
    isBestseller?: boolean;
    avgRating?: number;
    totalReviews?: number;
    category?: { name: string };
    images: { imageUrl: string; altText?: string }[];
  };
  onQuickView?: (product: any) => void;
}

export const ProductCard = ({ product, onQuickView }: ProductCardProps) => {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [isAdding, setIsAdding] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);

  const primaryImage = product.images[0]?.imageUrl || '/bags/b1.jpeg';
  const secondaryImage = product.images[1]?.imageUrl || primaryImage;

  const inWishlist = isInWishlist(product.id);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsAdding(true);
    const result = await addToCart(product.id, product.minOrderQuantity || 1);
    setIsAdding(false);
    if (result.success) {
      setAddedSuccess(true);
      setTimeout(() => setAddedSuccess(false), 2000);
    }
  };

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    await toggleWishlist(product.id);
  };

  const discountPercent = product.discountPrice
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;

  return (
    <div className="bg-white rounded-2xl border border-eco-100 overflow-hidden shadow-xs hover:shadow-eco-lg transition-all duration-300 flex flex-col group relative">
      {/* Image Container */}
      <div className="relative aspect-square bg-canvas-100 overflow-hidden">
        <Link href={`/products/${product.slug}`} className="block w-full h-full">
          <img
            src={primaryImage}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            onError={(e) => {
              console.warn('[Image 404] Failed to load product image:', primaryImage, 'for product:', product.name);
              (e.target as HTMLImageElement).src = '/placeholder-product.svg';
              (e.target as HTMLImageElement).onerror = null;
            }}
          />
        </Link>

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
          {discountPercent > 0 && (
            <span className="bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
              {discountPercent}% OFF
            </span>
          )}
          {product.isCustomizable && (
            <span className="bg-jute-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
              Customizable
            </span>
          )}
          {product.isBestseller && (
            <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
              Bestseller
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={handleWishlist}
          className={`absolute top-2.5 right-2.5 p-2 rounded-full backdrop-blur-xs transition-colors z-10 shadow-xs ${
            inWishlist ? 'bg-rose-50 text-rose-600' : 'bg-white/80 text-slate-600 hover:text-rose-600'
          }`}
          title="Add to Wishlist"
        >
          <Heart className={`w-4 h-4 ${inWishlist ? 'fill-rose-600' : ''}`} />
        </button>

        {/* Quick View Button */}
        {onQuickView && (
          <button
            onClick={(e) => {
              e.preventDefault();
              onQuickView(product);
            }}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white/90 hover:bg-white text-slate-800 text-xs font-bold px-3 py-1.5 rounded-full shadow-md backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center gap-1 z-10"
          >
            <Eye className="w-3.5 h-3.5" /> Quick View
          </button>
        )}
      </div>

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
        <div>
          {/* Category */}
          {product.category && (
            <span className="text-[10px] text-eco-700 font-bold uppercase tracking-wider block mb-0.5">
              {product.category.name}
            </span>
          )}

          {/* Title */}
          <Link
            href={`/products/${product.slug}`}
            className="font-serif font-bold text-sm text-slate-900 hover:text-eco-700 line-clamp-2 transition-colors"
          >
            {product.name}
          </Link>

          {/* Rating */}
          <div className="flex items-center gap-1 mt-1.5">
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3 h-3 ${
                    i < Math.floor(product.avgRating || 5) ? 'fill-amber-400' : 'text-slate-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              ({product.totalReviews || 1})
            </span>
          </div>
        </div>

        {/* Price & Actions */}
        <div className="pt-2 border-t border-eco-50 space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="font-bold text-base text-eco-900">
              {formatPrice(product.discountPrice ?? product.price)}
            </span>
            {product.discountPrice && (
              <span className="text-xs text-slate-400 line-through">
                {formatPrice(product.price)}
              </span>
            )}
          </div>

          {/* MOQ Indicator */}
          {product.minOrderQuantity > 1 && (
            <p className="text-[10px] text-slate-500 font-medium">
              Min Order: <span className="font-bold text-slate-700">{product.minOrderQuantity} pcs</span>
            </p>
          )}

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={isAdding || product.stockQuantity <= 0}
            className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs ${
              addedSuccess
                ? 'bg-emerald-600 text-white'
                : product.stockQuantity <= 0
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-eco-700 hover:bg-eco-800 text-white active:scale-98'
            }`}
          >
            {addedSuccess ? (
              <>
                <Check className="w-3.5 h-3.5" /> Added to Cart
              </>
            ) : product.stockQuantity <= 0 ? (
              'Out of Stock'
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5" /> Add to Cart
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
