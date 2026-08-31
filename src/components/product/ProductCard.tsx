'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { Heart, ShoppingBag, Star, Eye, Check } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { getStorageUrl } from '@/lib/storage';

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
    images?: { imageUrl: string; altText?: string }[];
    image?: string;
  };
  onQuickView?: (product: any) => void;
}

export const ProductCard = ({ product, onQuickView }: ProductCardProps) => {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [isAdding, setIsAdding] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);

  const rawPrimaryImage = product.images?.[0]?.imageUrl || product.image || '/bags/b1.jpeg';
  const primaryImage = getStorageUrl('products', rawPrimaryImage);

  const inWishlist = isInWishlist(product.id);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsAdding(true);
    const result = await addToCart(product.id, 1);
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
    : null;

  return (
    <div className="group bg-white rounded-2xl border border-eco-100 shadow-xs hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col h-full">
      {/* Product Image Section */}
      <div className="relative aspect-4/3 bg-eco-50 overflow-hidden">
        <Link href={`/products/${product.slug}`} className="block w-full h-full">
          <img
            src={primaryImage}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        </Link>

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
          {discountPercent && (
            <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
              {discountPercent}% OFF
            </span>
          )}
          {product.isFeatured && (
            <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
              Featured
            </span>
          )}
          {product.isBestseller && (
            <span className="bg-eco-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
              Bestseller
            </span>
          )}
        </div>

        {/* Quick Action Buttons */}
        <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 z-10">
          <button
            onClick={handleWishlist}
            aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
            className={`p-1.5 rounded-full shadow-xs transition-all ${
              inWishlist
                ? 'bg-rose-50 text-rose-500 hover:bg-rose-100'
                : 'bg-white/90 text-slate-600 hover:text-rose-500 hover:bg-white'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${inWishlist ? 'fill-current' : ''}`} />
          </button>
          {onQuickView && (
            <button
              onClick={(e) => {
                e.preventDefault();
                onQuickView(product);
              }}
              aria-label="Quick preview"
              className="p-1.5 bg-white/90 text-slate-600 hover:text-eco-700 hover:bg-white rounded-full shadow-xs transition-all opacity-0 group-hover:opacity-100"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Product Info */}
      <div className="p-3.5 flex flex-col flex-1 justify-between gap-2.5">
        <div>
          {/* Category */}
          {product.category && (
            <p className="text-[11px] text-eco-600 font-medium mb-0.5">
              {product.category.name}
            </p>
          )}

          {/* Title */}
          <Link href={`/products/${product.slug}`} className="block">
            <h3 className="font-serif font-bold text-xs text-slate-900 line-clamp-2 hover:text-eco-700 transition-colors">
              {product.name}
            </h3>
          </Link>

          {/* Rating */}
          <div className="flex items-center gap-1 mt-1">
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-2.5 h-2.5 ${
                    i < Math.floor(product.avgRating || 5)
                      ? 'fill-current text-amber-400'
                      : 'text-slate-200'
                  }`}
                />
              ))}
            </div>
            <span className="text-[10px] text-slate-400">
              ({product.totalReviews || 0})
            </span>
          </div>
        </div>

        {/* Pricing & Cart Action */}
        <div className="space-y-2 pt-1 border-t border-eco-50">
          <div className="flex items-baseline gap-1.5">
            <span className="font-serif font-bold text-sm text-slate-900">
              {formatPrice(product.discountPrice ?? product.price)}
            </span>
            {product.discountPrice && (
              <span className="text-xs text-slate-400 line-through">
                {formatPrice(product.price)}
              </span>
            )}
          </div>

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
