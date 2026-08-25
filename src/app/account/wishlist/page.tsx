'use client';

import React from 'react';
import Link from 'next/link';
import { useWishlist } from '@/context/WishlistContext';
import { ProductCard } from '@/components/product/ProductCard';
import { Heart } from 'lucide-react';

export default function WishlistPage() {
  const { wishlist, isLoading } = useWishlist();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center text-xs text-slate-500 font-bold">
        Loading saved wishlist...
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between border-b border-eco-100 pb-4">
        <h1 className="font-serif font-bold text-2xl text-slate-900 flex items-center gap-2">
          <Heart className="w-6 h-6 text-rose-600 fill-rose-600" /> My Saved Wishlist ({wishlist.length})
        </h1>
      </div>

      {wishlist.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-eco-100 text-center space-y-4 shadow-xs">
          <Heart className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-serif font-bold text-lg text-slate-800">Your Wishlist is Empty</h3>
          <p className="text-xs text-slate-500">Save products to your wishlist while browsing to review or purchase them later.</p>
          <Link href="/shop" className="inline-block bg-eco-700 text-white text-xs font-bold px-6 py-2.5 rounded-full">
            Browse Product Catalog
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {wishlist.map((item) => (
            <ProductCard key={item.id} product={item.product} />
          ))}
        </div>
      )}
    </div>
  );
}
