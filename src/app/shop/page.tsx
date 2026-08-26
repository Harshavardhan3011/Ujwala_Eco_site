'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ProductCard } from '@/components/product/ProductCard';
import { QuickViewModal } from '@/components/ui/QuickViewModal';
import { Search, Filter, SlidersHorizontal, ArrowUpDown, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

const DEFAULT_MAX_PRICE = 5000;

function ShopContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<any | null>(null);

  // Filter States from URL
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const sort = searchParams.get('sort') || 'featured';
  const minPrice = searchParams.get('minPrice') || '0';
  const rawMaxPrice = searchParams.get('maxPrice');
  const maxPrice = rawMaxPrice && parseInt(rawMaxPrice) > 0 ? rawMaxPrice : DEFAULT_MAX_PRICE.toString();
  const customizable = searchParams.get('customizable') || '';
  const page = searchParams.get('page') || '1';

  // Local filter inputs
  const [searchInput, setSearchInput] = useState(search);
  const [priceRange, setPriceRange] = useState(maxPrice);
  const maxProductPrice = DEFAULT_MAX_PRICE;

  useEffect(() => {
    setSearchInput(search);
    setPriceRange(maxPrice);
  }, [search, maxPrice]);

  useEffect(() => {
    async function loadShopData() {
      setIsLoading(true);
      setHasError(false);
      try {
        const queryParams = new URLSearchParams();
        if (search) queryParams.set('search', search);
        if (category && category !== 'all') queryParams.set('category', category);
        if (sort) queryParams.set('sort', sort);
        if (parseInt(minPrice) > 0) queryParams.set('minPrice', minPrice);
        if (parseInt(maxPrice) > 0 && parseInt(maxPrice) < DEFAULT_MAX_PRICE) {
          queryParams.set('maxPrice', maxPrice);
        }
        if (customizable) queryParams.set('customizable', customizable);
        queryParams.set('page', page);
        queryParams.set('limit', '12');

        const [prodRes, catRes] = await Promise.all([
          fetch(`/api/products?${queryParams.toString()}`),
          fetch('/api/categories'),
        ]);

        if (!prodRes.ok) throw new Error(`Product fetch failed with status ${prodRes.status}`);

        const prodData = await prodRes.json();
        const catData = await catRes.json();

        if (prodData.products) {
          setProducts(prodData.products);
          setPagination(prodData.pagination || { page: 1, totalPages: 1, total: prodData.products.length });
        } else {
          setProducts([]);
          setPagination({ page: 1, totalPages: 1, total: 0 });
        }

        if (catData.categories) {
          setCategories(catData.categories);
        }
      } catch (err) {
        console.error('Shop fetch error:', err);
        setHasError(true);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    }
    loadShopData();
  }, [search, category, sort, minPrice, maxPrice, customizable, page]);

  const updateFilters = (newParams: Record<string, string>) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    Object.entries(newParams).forEach(([key, val]) => {
      if (val && val !== 'all' && (key !== 'maxPrice' || parseInt(val) < DEFAULT_MAX_PRICE)) {
        current.set(key, val);
      } else {
        current.delete(key);
      }
    });
    current.set('page', '1');
    const queryString = current.toString();
    router.push(queryString ? `/shop?${queryString}` : '/shop');
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setPriceRange(DEFAULT_MAX_PRICE.toString());
    router.push('/shop');
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Page Header Banner */}
      <div className="bg-eco-900 text-white rounded-3xl p-6 md:p-10 relative overflow-hidden shadow-md">
        <div className="relative z-10 max-w-xl space-y-2">
          <span className="text-xs font-bold text-jute-300 uppercase tracking-wider block">
            Handcrafted Eco Products
          </span>
          <h1 className="font-serif font-bold text-2xl md:text-4xl text-white">
            Shop Catalog & Custom Orders
          </h1>
          <p className="text-xs md:text-sm text-eco-100">
            Browse our complete collection of natural jute bags, custom printed return gifts, brass items, and Etikoppaka wooden toys from Supabase.
          </p>
        </div>
      </div>

      {/* Main Layout: Filters Sidebar + Product Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filter Sidebar (Desktop) */}
        <aside className="hidden lg:block space-y-6 bg-white p-6 rounded-2xl border border-eco-100 shadow-xs h-fit">
          <div className="flex items-center justify-between border-b border-eco-100 pb-3">
            <h3 className="font-serif font-bold text-sm text-slate-900 flex items-center gap-1.5">
              <SlidersHorizontal className="w-4 h-4 text-eco-700" /> Filter Products
            </h3>
            {(search || category || customizable || parseInt(priceRange) < DEFAULT_MAX_PRICE) && (
              <button
                onClick={handleResetFilters}
                className="text-[11px] text-rose-600 font-bold hover:underline flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Reset
              </button>
            )}
          </div>

          {/* Search Filter */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">Search Keyword</label>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateFilters({ search: searchInput });
              }}
              className="relative"
            >
              <input
                type="text"
                placeholder="Name, SKU, tag..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full bg-canvas-100 border border-eco-200 rounded-xl py-2 pl-3 pr-8 text-xs focus:outline-none focus:ring-1 focus:ring-eco-600"
              />
              <button type="submit" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-eco-700">
                <Search className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          {/* Category Filter List */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">Categories</label>
            <div className="space-y-1 max-h-60 overflow-y-auto text-xs pr-1">
              <button
                onClick={() => updateFilters({ category: '' })}
                className={`w-full text-left py-1.5 px-3 rounded-lg font-medium transition-colors ${
                  !category || category === 'all' ? 'bg-eco-100 text-eco-900 font-bold' : 'text-slate-600 hover:bg-canvas-100'
                }`}
              >
                All Categories
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => updateFilters({ category: cat.slug })}
                  className={`w-full text-left py-1.5 px-3 rounded-lg font-medium transition-colors flex justify-between items-center ${
                    category === cat.slug ? 'bg-eco-100 text-eco-900 font-bold' : 'text-slate-600 hover:bg-canvas-100'
                  }`}
                >
                  <span className="truncate">{cat.name}</span>
                  <span className="text-[10px] text-slate-400 font-bold">({cat._count?.products || 0})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Price Range Slider Filter */}
          <div className="space-y-2 pt-2 border-t border-eco-100">
            <div className="flex justify-between items-center text-xs">
              <label className="font-bold text-slate-700">Max Price Filter</label>
              <span className="font-bold text-eco-800">{formatPrice(parseInt(priceRange))}</span>
            </div>
            <input
              type="range"
              min="50"
              max={maxProductPrice}
              step="50"
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value)}
              onMouseUp={() => updateFilters({ maxPrice: priceRange })}
              onTouchEnd={() => updateFilters({ maxPrice: priceRange })}
              className="w-full accent-eco-700 cursor-pointer"
            />
          </div>

          {/* Customizability Toggle Filter */}
          <div className="pt-2 border-t border-eco-100 space-y-2">
            <label className="text-xs font-bold text-slate-700 block">Customization</label>
            <button
              onClick={() => updateFilters({ customizable: customizable === 'true' ? '' : 'true' })}
              className={`w-full py-2 px-3 rounded-xl text-xs font-bold border transition-colors flex items-center justify-between ${
                customizable === 'true'
                  ? 'bg-jute-50 border-jute-400 text-jute-900'
                  : 'bg-white border-eco-200 text-slate-600 hover:bg-canvas-100'
              }`}
            >
              <span>Custom Printing Only</span>
              <span className="text-xs">{customizable === 'true' ? '✓' : ''}</span>
            </button>
          </div>
        </aside>

        {/* Product Grid Area */}
        <main className="lg:col-span-3 space-y-6">
          {/* Top Control Bar: Total Count & Sorting */}
          <div className="bg-white p-4 rounded-2xl border border-eco-100 shadow-xs flex flex-wrap justify-between items-center gap-4">
            <div className="text-xs text-slate-600 font-medium">
              Showing <span className="font-bold text-slate-900">{products.length}</span> of{' '}
              <span className="font-bold text-slate-900">{pagination.total}</span> products
            </div>

            {/* Sort Control */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                <ArrowUpDown className="w-3.5 h-3.5 text-eco-700" /> Sort By:
              </span>
              <select
                value={sort}
                onChange={(e) => updateFilters({ sort: e.target.value })}
                className="bg-canvas-100 border border-eco-200 rounded-xl py-1.5 px-3 text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="featured">Featured First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="newest">Newest Additions</option>
              </select>
            </div>
          </div>

          {/* Grid Content */}
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white h-72 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : hasError ? (
            <div className="bg-white rounded-2xl border border-rose-100 p-12 text-center space-y-4">
              <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-600 font-bold text-xl">
                ⚠️
              </div>
              <h3 className="font-serif font-bold text-lg text-slate-900">Unable to Load Products</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                There was a problem connecting to the product catalog. Please try again.
              </p>
              <button
                onClick={handleResetFilters}
                className="bg-eco-700 text-white text-xs font-bold px-6 py-2.5 rounded-full hover:bg-eco-800"
              >
                Retry & Reset Filters
              </button>
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white rounded-2xl border border-eco-100 p-12 text-center space-y-4">
              <div className="w-16 h-16 bg-eco-50 rounded-full flex items-center justify-center mx-auto text-eco-700 font-bold text-xl">
                🔍
              </div>
              <h3 className="font-serif font-bold text-lg text-slate-900">No Products Matched</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try searching for different keywords or resetting your price filters.
              </p>
              <button
                onClick={handleResetFilters}
                className="bg-eco-700 text-white text-xs font-bold px-6 py-2.5 rounded-full hover:bg-eco-800"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 md:gap-6">
              {products.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onQuickView={(prod) => setQuickViewProduct(prod)}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 pt-6">
              <button
                disabled={pagination.page <= 1}
                onClick={() => updateFilters({ page: String(pagination.page - 1) })}
                className="p-2 rounded-xl border border-eco-200 bg-white text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-slate-700 px-4">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => updateFilters({ page: String(pagination.page + 1) })}
                className="p-2 rounded-xl border border-eco-200 bg-white text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Quick View Modal */}
      {quickViewProduct && (
        <QuickViewModal
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
        />
      )}
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="text-xs text-slate-500 text-center py-16 font-bold">Loading product catalog...</div>}>
      <ShopContent />
    </Suspense>
  );
}
