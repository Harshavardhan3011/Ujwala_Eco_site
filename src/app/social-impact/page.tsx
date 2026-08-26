'use client';

import React from 'react';
import Link from 'next/link';
import { Heart, BookOpen, Award, Users, ArrowRight } from 'lucide-react';
import { getStorageUrl } from '@/lib/storage';

export default function SocialImpactPage() {
  const rawTrustImages = [
    'trusts/e1.jpeg',
    'trusts/e2.jpeg',
    'trusts/e3.jpeg',
    'trusts/e4.jpeg',
    'trusts/e5.jpeg',
    'trusts/e6.jpeg',
    'trusts/e7.jpeg',
    'trusts/e8.jpeg',
    'trusts/e9.jpeg',
    'trusts/e10.jpeg',
    'trusts/e11.jpeg',
    'trusts/e12.jpeg',
  ];

  const trustImages = rawTrustImages.map((raw) => ({
    src: getStorageUrl(raw),
    localFallback: `/Ujwala _Educational_&_Social_Trust/${raw.replace('trusts/', '')}`,
  }));

  return (
    <div className="container mx-auto px-4 py-10 space-y-16 max-w-5xl">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-eco-900 via-eco-800 to-eco-950 text-white p-8 md:p-12 rounded-3xl shadow-xl text-center space-y-4">
        <span className="bg-jute-500 text-eco-950 text-xs font-extrabold px-3.5 py-1 rounded-full uppercase tracking-wider inline-block">
          Non-Profit Initiative • Established 2012
        </span>
        <h1 className="font-serif font-extrabold text-3xl md:text-5xl text-white">
          Ujwala Educational & Social Trust
        </h1>
        <p className="text-xs md:text-sm text-eco-100 max-w-2xl mx-auto leading-relaxed">
          Extending our eco-mission into direct social welfare. Serving underprivileged students and senior citizens across Visakhapatnam since 2012.
        </p>
      </div>

      {/* Trust Key Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-eco-100 shadow-xs space-y-3">
          <div className="w-12 h-12 bg-eco-100 text-eco-800 rounded-2xl flex items-center justify-center font-bold text-xl">
            📚
          </div>
          <h3 className="font-serif font-bold text-base text-slate-900">Books & Stationery Drive</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Distributing free notebooks, pens, geometry boxes, and educational kits to students from low-income families at the start of each academic year.
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-eco-100 shadow-xs space-y-3">
          <div className="w-12 h-12 bg-eco-100 text-eco-800 rounded-2xl flex items-center justify-center font-bold text-xl">
            🎓
          </div>
          <h3 className="font-serif font-bold text-base text-slate-900">Merit Scholarships</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Providing financial scholarships to meritorious students to ensure financial constraints do not stop their higher education goals.
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-eco-100 shadow-xs space-y-3">
          <div className="w-12 h-12 bg-eco-100 text-eco-800 rounded-2xl flex items-center justify-center font-bold text-xl">
            👴
          </div>
          <h3 className="font-serif font-bold text-base text-slate-900">Old-Age Support Pension</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Monthly pension assistance and essential medicine kits for helpless elderly individuals in Duvvada and Simhadrinagar.
          </p>
        </div>
      </div>

      {/* Trust Activities Photo Grid */}
      <div className="space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="font-serif font-bold text-2xl text-slate-900">
            Social Initiatives Photo Records
          </h2>
          <p className="text-xs text-slate-500">
            Real event photographs from Supabase Storage documenting our book distribution drives and community welfare events.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {trustImages.map((img, idx) => (
            <div key={idx} className="aspect-square bg-canvas-100 rounded-2xl overflow-hidden border border-eco-100 shadow-xs hover:shadow-md transition-shadow">
              <img
                src={img.src}
                alt={`Trust event ${idx + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = img.localFallback;
                  (e.target as HTMLImageElement).onerror = null;
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Video Feature Embed Section */}
      <div className="bg-canvas-100 p-8 md:p-12 rounded-3xl border border-eco-200 text-center space-y-6">
        <h3 className="font-serif font-bold text-xl text-slate-900">
          Ujwala Trust In Action
        </h3>
        <p className="text-xs text-slate-600 max-w-xl mx-auto">
          Watch our community coverage and social empowerment initiatives.
        </p>
        <div className="max-w-2xl mx-auto aspect-video rounded-2xl overflow-hidden shadow-xl border-2 border-eco-200">
          <iframe
            className="w-full h-full"
            src="https://www.youtube.com/embed/_KQ70ZSE_p4"
            title="Ujwala Educational & Social Trust"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}
