'use client';

import React from 'react';
import Link from 'next/link';
import { Heart, ShieldCheck, Users, MapPin, CheckCircle2, ArrowRight } from 'lucide-react';
import { getStorageUrl } from '@/lib/storage';

export default function AboutPage() {
  const unitImages = [
    { src: getStorageUrl('products/m1.jpeg'), fallback: '/bags/m1.jpeg' },
    { src: getStorageUrl('products/m2.jpeg'), fallback: '/bags/m2.jpeg' },
    { src: getStorageUrl('products/m3.jpeg'), fallback: '/bags/m3.jpeg' },
    { src: getStorageUrl('products/m4.jpeg'), fallback: '/bags/m4.jpeg' },
  ];

  return (
    <div className="container mx-auto px-4 py-10 space-y-16 max-w-5xl">
      {/* Header Banner */}
      <div className="bg-eco-900 text-white p-8 md:p-12 rounded-3xl shadow-xl space-y-4 text-center">
        <span className="bg-eco-700/60 text-jute-300 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider inline-block">
          Handcrafted in Visakhapatnam
        </span>
        <h1 className="font-serif font-extrabold text-3xl md:text-5xl text-white">
          About Ujwala Eco Products
        </h1>
        <p className="text-xs md:text-sm text-eco-100 max-w-2xl mx-auto leading-relaxed">
          Founded by <strong>N. Suguna</strong> in Simhadrinagar, Duvvada. Dedicated to environmental preservation through raw golden jute craftsmanship and empowering local women homemakers.
        </p>
      </div>

      {/* Main Story & Origins */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center bg-white p-8 md:p-10 rounded-3xl border border-eco-100 shadow-sm">
        <div className="space-y-4">
          <span className="text-xs font-bold text-eco-700 uppercase tracking-wider block">Our Origin Story</span>
          <h2 className="font-serif font-bold text-2xl md:text-3xl text-slate-900 leading-tight">
            From a Residential Compound to a Thriving Eco Unit
          </h2>
          <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
            The story of Ujwala Eco Products began in the residential compound of our founder, <strong>N. Suguna</strong>, in Simhadrinagar, Visakhapatnam. Witnessing the environmental hazards of single-use plastic bags in local markets, she set out to manufacture durable, 100% biodegradable jute alternatives.
          </p>
          <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
            Central to our vision was creating employment for homemakers in the neighborhood. Today, our workshop trains local women artisans in precision stitching, handles attachment, screen printing, and quality control — enabling them to achieve financial independence.
          </p>
        </div>

        <div className="relative">
          <img
            src={getStorageUrl('products/m1.jpeg')}
            alt="N. Suguna Founder"
            className="rounded-2xl shadow-xl w-full object-cover border-4 border-canvas-100"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/bags/m1.jpeg';
              (e.target as HTMLImageElement).onerror = null;
            }}
          />
        </div>
      </div>

      {/* Core Principles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-canvas-100 p-6 rounded-2xl border border-eco-100 space-y-3">
          <div className="w-10 h-10 bg-eco-800 text-jute-300 rounded-full flex items-center justify-center font-bold">
            🌱
          </div>
          <h3 className="font-serif font-bold text-base text-slate-900">100% Eco Protection</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Natural golden jute fiber is completely biodegradable and leaves zero microplastic residue on the planet.
          </p>
        </div>

        <div className="bg-canvas-100 p-6 rounded-2xl border border-eco-100 space-y-3">
          <div className="w-10 h-10 bg-eco-800 text-jute-300 rounded-full flex items-center justify-center font-bold">
            👩‍🎨
          </div>
          <h3 className="font-serif font-bold text-base text-slate-900">Women Empowerment</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Sustained employment for local women homemakers, fostering economic independence and dignity.
          </p>
        </div>

        <div className="bg-canvas-100 p-6 rounded-2xl border border-eco-100 space-y-3">
          <div className="w-10 h-10 bg-eco-800 text-jute-300 rounded-full flex items-center justify-center font-bold">
            🤝
          </div>
          <h3 className="font-serif font-bold text-base text-slate-900">Custom Craftsmanship</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Tailor-made customized prints for weddings, housewarmings, shop bulk orders, and traditional gifts.
          </p>
        </div>
      </div>

      {/* Manufacturing Workshop Section */}
      <div className="bg-white p-8 md:p-10 rounded-3xl border border-eco-100 shadow-sm space-y-6">
        <h2 className="font-serif font-bold text-2xl text-slate-900 text-center">
          Our Manufacturing Unit & Quality Standards
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {unitImages.map((img, idx) => (
            <img
              key={idx}
              src={img.src}
              alt={`Unit photo ${idx + 1}`}
              className="rounded-xl aspect-square object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = img.fallback;
                (e.target as HTMLImageElement).onerror = null;
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
