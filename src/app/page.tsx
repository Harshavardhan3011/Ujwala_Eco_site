'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ProductCard } from '@/components/product/ProductCard';
import { QuickViewModal } from '@/components/ui/QuickViewModal';
import {
  ShoppingBag,
  Sparkles,
  Heart,
  ShieldCheck,
  Award,
  Users,
  ArrowRight,
  MessageCircle,
  Truck,
  Package,
  CheckCircle2,
  ChevronRight,
  Star,
} from 'lucide-react';

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [quickViewProduct, setQuickViewProduct] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [prodRes, catRes] = await Promise.all([
          fetch('/api/products?featured=true&limit=8'),
          fetch('/api/categories'),
        ]);

        const prodData = await prodRes.json();
        const catData = await catRes.json();

        if (prodData.products) setFeaturedProducts(prodData.products);
        if (catData.categories) setCategories(catData.categories);
      } catch (err) {
        console.error('Homepage data fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-16 pb-16">
      {/* 1. Hero Banner */}
      <section className="relative bg-gradient-to-r from-eco-900 via-eco-800 to-eco-950 text-white overflow-hidden py-16 md:py-24">
        {/* Background Decorative Pattern */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#d4a373_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="container mx-auto px-4 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-eco-700/60 border border-eco-500/40 text-jute-300 text-xs font-bold px-3.5 py-1.5 rounded-full shadow-inner">
              <Sparkles className="w-4 h-4 text-jute-300 animate-pulse" />
              <span>Visakhapatnam’s Trusted Eco Jute Manufacturer</span>
            </div>

            <h1 className="font-serif font-extrabold text-3xl sm:text-4xl md:text-5xl text-white tracking-tight leading-tight">
              Say No to Plastic. <br />
              <span className="text-jute-300 underline decoration-jute-400/50 decoration-wavy">
                Choose Handcrafted Jute.
              </span>
            </h1>

            <p className="text-sm md:text-base text-eco-100 max-w-xl leading-relaxed mx-auto lg:mx-0">
              100% biodegradable jute tote bags, custom printed return gifts for weddings, housewarmings, and shop bulk supply. Handcrafted by local women artisans under founder <strong>N. Suguna</strong>.
            </p>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
              <Link
                href="/shop"
                className="bg-jute-400 hover:bg-jute-500 text-eco-950 font-extrabold text-sm px-6 py-3.5 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" /> Explore Shop Collection
              </Link>
              <Link
                href="/custom-orders"
                className="bg-white/10 hover:bg-white/20 text-white font-bold text-sm px-6 py-3.5 rounded-full border border-white/20 transition-all flex items-center gap-2"
              >
                Request Custom Order Quote <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Quick stats trust badge */}
            <div className="pt-6 grid grid-cols-3 gap-4 border-t border-eco-700/50 text-center lg:text-left">
              <div>
                <span className="font-serif font-bold text-xl text-jute-300 block">100%</span>
                <span className="text-[11px] text-eco-200 uppercase tracking-wider">Natural Fibre</span>
              </div>
              <div>
                <span className="font-serif font-bold text-xl text-jute-300 block">Direct</span>
                <span className="text-[11px] text-eco-200 uppercase tracking-wider">Factory Pricing</span>
              </div>
              <div>
                <span className="font-serif font-bold text-xl text-jute-300 block">Women</span>
                <span className="text-[11px] text-eco-200 uppercase tracking-wider">Artisan Empowerment</span>
              </div>
            </div>
          </div>

          {/* Hero Image Collage */}
          <div className="relative">
            <div className="relative mx-auto max-w-md lg:max-w-none grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <img
                  src="/uploads/b1.jpeg"
                  alt="Everyday Jute Bag"
                  className="rounded-2xl shadow-2xl object-cover w-full h-64 border-2 border-eco-600/50"
                />
                <img
                  src="/uploads/b5.jpeg"
                  alt="Return Gift Bag"
                  className="rounded-2xl shadow-xl object-cover w-full h-44 border-2 border-eco-600/50"
                />
              </div>
              <div className="space-y-4 pt-8">
                <img
                  src="/uploads/b3.jpeg"
                  alt="Custom Printed Bag"
                  className="rounded-2xl shadow-xl object-cover w-full h-44 border-2 border-eco-600/50"
                />
                <img
                  src="/uploads/b22.jpeg"
                  alt="Etikoppaka Toys"
                  className="rounded-2xl shadow-2xl object-cover w-full h-64 border-2 border-eco-600/50"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Product Categories Grid */}
      <section className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div>
            <span className="text-xs font-bold text-eco-700 uppercase tracking-wider block">
              Curated Collections
            </span>
            <h2 className="font-serif font-bold text-2xl md:text-3xl text-slate-900 mt-1">
              Shop By Category
            </h2>
          </div>
          <Link
            href="/shop"
            className="text-xs font-bold text-eco-700 hover:text-eco-900 flex items-center gap-1 hover:underline"
          >
            View All Categories ({categories.length}) <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/shop?category=${cat.slug}`}
              className="group relative bg-white rounded-2xl border border-eco-100 overflow-hidden shadow-xs hover:shadow-eco transition-all duration-300 flex flex-col"
            >
              <div className="aspect-[4/3] bg-canvas-100 overflow-hidden relative">
                <img
                  src={cat.image || '/uploads/b1.jpeg'}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                <span className="absolute bottom-2.5 left-3 text-[11px] font-bold text-jute-200 bg-eco-900/80 px-2 py-0.5 rounded-full backdrop-blur-xs">
                  {cat._count?.products || 0} Products
                </span>
              </div>
              <div className="p-3.5 text-center flex-1 flex flex-col justify-center">
                <h3 className="font-serif font-bold text-sm text-slate-900 group-hover:text-eco-700 transition-colors">
                  {cat.name}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. Featured Products Showcase */}
      <section className="container mx-auto px-4 bg-canvas-100/70 py-12 rounded-3xl border border-eco-100">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div>
            <span className="text-xs font-bold text-eco-700 uppercase tracking-wider block">
              Handpicked Essentials
            </span>
            <h2 className="font-serif font-bold text-2xl md:text-3xl text-slate-900 mt-1">
              Featured Eco Products
            </h2>
          </div>
          <Link
            href="/shop"
            className="text-xs font-bold text-eco-700 hover:text-eco-900 flex items-center gap-1 hover:underline"
          >
            Browse Entire Shop <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white h-72 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {featuredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onQuickView={(p) => setQuickViewProduct(p)}
              />
            ))}
          </div>
        )}
      </section>

      {/* 4. Customized Products Spotlight */}
      <section className="container mx-auto px-4">
        <div className="bg-gradient-to-br from-jute-500 via-jute-600 to-jute-800 rounded-3xl p-8 md:p-12 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider inline-block">
                Tailor-Made Orders
              </span>
              <h2 className="font-serif font-extrabold text-2xl md:text-4xl text-white leading-tight">
                Need Customized Jute Bags for Weddings, Housewarmings, or Shops?
              </h2>
              <p className="text-xs md:text-sm text-jute-100 leading-relaxed">
                We design and print custom jute bags according to your exact requirements! Add bride & groom names, event dates, brand logos, custom dimensions, and color preferences.
              </p>
              <ul className="space-y-2 text-xs font-medium text-jute-100 pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                  Custom logo & text screen printing / gold foil printing
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                  Bulk orders for cloth stores, gold shops, hotels & departmental stores
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                  Competitive direct factory wholesale pricing
                </li>
              </ul>
              <div className="pt-4 flex flex-wrap gap-4">
                <Link
                  href="/custom-orders"
                  className="bg-white text-jute-900 font-extrabold text-xs px-6 py-3 rounded-full shadow-md hover:bg-jute-100 transition-colors"
                >
                  Submit Custom Order Request
                </Link>
                <a
                  href="https://wa.me/919849530536"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6 py-3 rounded-full shadow-md transition-colors flex items-center gap-1.5"
                >
                  <MessageCircle className="w-4 h-4" /> WhatsApp Us (+91 9849530536)
                </a>
              </div>
            </div>

            <div className="relative mx-auto">
              <img
                src="/uploads/ujwala-banner.jpeg"
                alt="Ujwala Eco Banner"
                className="rounded-2xl shadow-2xl border-4 border-white/20 max-w-md w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 5. Women Empowerment & Founder Story */}
      <section className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-3xl border border-eco-100 p-8 md:p-12 shadow-sm grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="relative">
            <img
              src="/uploads/founder-suguna.jpeg"
              alt="Founder N. Suguna"
              className="rounded-2xl shadow-xl w-full max-w-md mx-auto object-cover border-4 border-canvas-100"
            />
            <div className="absolute -bottom-4 right-4 bg-eco-800 text-white p-4 rounded-2xl shadow-lg max-w-xs text-xs">
              <p className="font-serif italic text-jute-200">
                "We wanted to build something people would reach for — not just because it's eco-friendly, but because it's the better bag."
              </p>
              <span className="block mt-2 font-bold text-white">— N. Suguna, Founder</span>
            </div>
          </div>

          <div className="space-y-5">
            <span className="text-xs font-bold text-eco-700 uppercase tracking-wider block">
              Our Journey & Social Impact
            </span>
            <h2 className="font-serif font-bold text-2xl md:text-3xl text-slate-900 leading-snug">
              Empowerment Rooted in Simhadrinagar, Visakhapatnam
            </h2>
            <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
              Started in the residential compound of founder <strong>N. Suguna</strong> in Simhadrinagar, Duvvada, Ujwala Eco Products was established with a dual mission: to combat single-use plastic pollution and to create meaningful employment opportunities for homemakers and women artisans in the surrounding community.
            </p>            <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
              Every bag is hand-woven from raw golden jute fiber and carefully stitched to endure years of daily use. By choosing Ujwala, you directly support local women households and sustainable livelihoods.
            </p>

            <div className="pt-2">
              <Link
                href="/about"
                className="inline-flex items-center gap-2 text-xs font-bold text-eco-700 hover:text-eco-900 hover:underline"
              >
                Read Full Founder Story & Vision →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Social Impact Trust Section (Ujwala Educational & Social Trust) */}
      <section className="container mx-auto px-4">
        <div className="bg-canvas-100 rounded-3xl border border-eco-200 p-8 md:p-12">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-10">
            <span className="bg-eco-200 text-eco-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider inline-block">
              Established 2012
            </span>
            <h2 className="font-serif font-bold text-2xl md:text-3xl text-slate-900">
              Ujwala Educational & Social Trust
            </h2>
            <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
              Beyond eco-manufacturing, our sister non-profit trust has been serving the underprivileged community since 2012 through educational scholarships, stationery distribution, and senior citizen pensions.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-5 rounded-2xl border border-eco-100 text-center space-y-3 shadow-xs">
              <div className="w-12 h-12 bg-eco-100 rounded-full flex items-center justify-center mx-auto text-eco-700 font-bold">
                📚
              </div>
              <h3 className="font-serif font-bold text-sm text-slate-900">Student Notebooks</h3>
              <p className="text-xs text-slate-500">Free distribution of books and stationery to underprivileged students.</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-eco-100 text-center space-y-3 shadow-xs">
              <div className="w-12 h-12 bg-eco-100 rounded-full flex items-center justify-center mx-auto text-eco-700 font-bold">
                🎓
              </div>
              <h3 className="font-serif font-bold text-sm text-slate-900">Merit Scholarships</h3>
              <p className="text-xs text-slate-500">Financial assistance for bright, needy students pursuing education.</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-eco-100 text-center space-y-3 shadow-xs">
              <div className="w-12 h-12 bg-eco-100 rounded-full flex items-center justify-center mx-auto text-eco-700 font-bold">
                👴
              </div>
              <h3 className="font-serif font-bold text-sm text-slate-900">Old-Age Pensions</h3>
              <p className="text-xs text-slate-500">Monthly pension support for elderly individuals without financial care.</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-eco-100 text-center space-y-3 shadow-xs">
              <div className="w-12 h-12 bg-eco-100 rounded-full flex items-center justify-center mx-auto text-eco-700 font-bold">
                🖼️
              </div>
              <h3 className="font-serif font-bold text-sm text-slate-900">Trust Initiatives</h3>
              <p className="text-xs text-slate-500">Regular community drives and social welfare activities in Duvvada.</p>
            </div>
          </div>

          <div className="text-center pt-8">
            <Link
              href="/social-impact"
              className="bg-eco-700 hover:bg-eco-800 text-white font-bold text-xs px-6 py-3 rounded-full shadow-md transition-colors inline-flex items-center gap-2"
            >
              View Trust Photographs & Impact Details <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 7. Manufacturing & Event Photo Gallery Preview */}
      <section className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div>
            <span className="text-xs font-bold text-eco-700 uppercase tracking-wider block">
              Behind the Scenes
            </span>
            <h2 className="font-serif font-bold text-2xl md:text-3xl text-slate-900 mt-1">
              Manufacturing & Event Gallery
            </h2>
          </div>
          <Link
            href="/gallery"
            className="text-xs font-bold text-eco-700 hover:text-eco-900 flex items-center gap-1 hover:underline"
          >
            Explore Complete Gallery →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {['/uploads/m1.jpeg', '/uploads/m2.jpeg', '/uploads/m3.jpeg', '/uploads/o1.jpeg', '/uploads/o2.jpeg', '/uploads/e1.jpeg'].map((img, idx) => (
            <div key={idx} className="aspect-square bg-canvas-100 rounded-xl overflow-hidden border border-eco-100 group relative">
              <img
                src={img}
                alt="Gallery photo"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-eco-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
                View Photo
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 8. Call To Action Footer Banner */}
      <section className="container mx-auto px-4">
        <div className="bg-eco-900 text-white rounded-3xl p-8 md:p-12 text-center space-y-4 shadow-xl">
          <h2 className="font-serif font-bold text-2xl md:text-3xl text-white">
            Ready to Make the Eco-Friendly Switch?
          </h2>
          <p className="text-xs md:text-sm text-eco-100 max-w-xl mx-auto">
            Order durable handcrafted jute bags or contact us for customized function return gifts. Direct factory pricing with Visakhapatnam doorstep delivery.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <Link
              href="/shop"
              className="bg-jute-400 hover:bg-jute-500 text-eco-950 font-extrabold text-xs px-6 py-3 rounded-full shadow-md transition-colors"
            >
              Shop All Products
            </Link>
            <a
              href="tel:+919849530536"
              className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-6 py-3 rounded-full border border-white/20 transition-colors"
            >
              Call Factory: +91 9849530536
            </a>
          </div>
        </div>
      </section>

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
