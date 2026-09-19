'use client';

import React from 'react';
import Link from 'next/link';
import { MapPin, Phone, Mail, MessageCircle, Heart, ShieldCheck, Truck, RefreshCw } from 'lucide-react';
import { BUSINESS_PHONE_DISPLAY, BUSINESS_TEL, WHATSAPP_LINK } from '@/lib/constants';

export const Footer = () => {
  return (
    <footer className="bg-eco-950 text-slate-300 pt-12 pb-6 border-t-4 border-jute-400">
      {/* Value Proposition Highlights */}
      <div className="container mx-auto px-4 pb-10 border-b border-eco-800">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center md:text-left">
          <div className="flex items-center gap-4 bg-eco-900/50 p-4 rounded-xl border border-eco-800">
            <div className="w-10 h-10 rounded-full bg-eco-800 flex items-center justify-center text-jute-300">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">100% Eco-Friendly</h4>
              <p className="text-xs text-slate-400">Natural golden jute yarn & non-toxic dyes</p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-eco-900/50 p-4 rounded-xl border border-eco-800">
            <div className="w-10 h-10 rounded-full bg-eco-800 flex items-center justify-center text-jute-300">
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Women Empowerment</h4>
              <p className="text-xs text-slate-400">Handcrafted by local women artisans</p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-eco-900/50 p-4 rounded-xl border border-eco-800">
            <div className="w-10 h-10 rounded-full bg-eco-800 flex items-center justify-center text-jute-300">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Custom Bulk Orders</h4>
              <p className="text-xs text-slate-400">Tailored logo & print for weddings & shops</p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-eco-900/50 p-4 rounded-xl border border-eco-800">
            <div className="w-10 h-10 rounded-full bg-eco-800 flex items-center justify-center text-jute-300">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Direct Factory Prices</h4>
              <p className="text-xs text-slate-400">Best wholesale rates without middlemen</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="container mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Brand & Story */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-jute-500 text-eco-950 font-bold flex items-center justify-center text-lg">
              🌱
            </div>
            <span className="font-serif font-bold text-xl text-white">Ujwala Eco Products</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Founded by <strong>N. Suguna</strong> in Visakhapatnam, Ujwala Eco Products manufactures handcrafted jute bags, return gifts, and eco-friendly products while empowering local women homemakers through skill development and employment.
          </p>
          <div className="pt-2">
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-full transition-colors"
            >
              <MessageCircle className="w-4 h-4" /> WhatsApp Order Support
            </a>
          </div>
        </div>

        {/* Categories */}
        <div>
          <h4 className="font-serif font-bold text-sm text-white uppercase tracking-wider mb-4 border-l-2 border-jute-400 pl-2">
            Product Categories
          </h4>
          <ul className="space-y-2 text-xs">
            <li><Link href="/shop?category=jute-bags" className="hover:text-jute-300 transition-colors">Everyday Jute Bags</Link></li>
            <li><Link href="/shop?category=customized-jute-bags" className="hover:text-jute-300 transition-colors">Customized Printed Bags</Link></li>
            <li><Link href="/shop?category=gift-return-gift-bags" className="hover:text-jute-300 transition-colors">Wedding & Function Return Gift Bags</Link></li>
            <li><Link href="/shop?category=designer-jute-bags" className="hover:text-jute-300 transition-colors">Designer Jute Handbags</Link></li>
            <li><Link href="/shop?category=brass-german-silver" className="hover:text-jute-300 transition-colors">Brass & German Silver Items</Link></li>
            <li><Link href="/shop?category=etikoppaka-wooden-toys" className="hover:text-jute-300 transition-colors">Etikoppaka Wooden Toys</Link></li>
          </ul>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="font-serif font-bold text-sm text-white uppercase tracking-wider mb-4 border-l-2 border-jute-400 pl-2">
            Explore & Community
          </h4>
          <ul className="space-y-2 text-xs">
            <li><Link href="/about" className="hover:text-jute-300 transition-colors">About Founder & Mission</Link></li>
            <li><Link href="/social-impact" className="hover:text-jute-300 transition-colors">Ujwala Educational & Social Trust</Link></li>
            <li><Link href="/custom-orders" className="hover:text-jute-300 transition-colors">Request Bulk Custom Quotes</Link></li>
            <li><Link href="/gallery" className="hover:text-jute-300 transition-colors">Manufacturing & Event Gallery</Link></li>
            <li><Link href="/contact" className="hover:text-jute-300 transition-colors">Contact & Location</Link></li>
          </ul>
        </div>

        {/* Verified Contact Details */}
        <div>
          <h4 className="font-serif font-bold text-sm text-white uppercase tracking-wider mb-4 border-l-2 border-jute-400 pl-2">
            Factory & Office Address
          </h4>
          <ul className="space-y-3 text-xs">
            <li className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-jute-400 shrink-0 mt-0.5" />
              <span>D.No. 7-116, Simhadrinagar, Sector-1, Duvvada, Near VSEZ, Visakhapatnam - 530 049, Andhra Pradesh</span>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-jute-400 shrink-0" />
              <a href={BUSINESS_TEL} className="hover:text-jute-300 transition-colors">
                {BUSINESS_PHONE_DISPLAY}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-jute-400 shrink-0" />
              <span>ujwalaeco@gmail.com</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Copyright Footer */}
      <div className="container mx-auto px-4 pt-6 border-t border-eco-900 flex flex-col md:flex-row justify-between items-center text-xs text-slate-500 gap-4">
        <p>© {new Date().getFullYear()} Ujwala Eco Products. All rights reserved. Handcrafted in India.</p>
        <div className="flex items-center gap-4">
          <Link href="/privacy" className="hover:text-slate-300 transition-colors">Privacy Policy</Link>
          <span>•</span>
          <Link href="/terms" className="hover:text-slate-300 transition-colors">Terms of Service</Link>
          <span>•</span>
          <Link href="/shipping" className="hover:text-slate-300 transition-colors">Shipping Policy</Link>
        </div>
      </div>
    </footer>
  );
};
