'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import {
  ShoppingBag,
  Heart,
  User as UserIcon,
  Search,
  Menu,
  X,
  Sparkles,
  Phone,
  MessageCircle,
  ChevronDown,
  LogOut,
  LayoutDashboard,
  Package,
} from 'lucide-react';

export const Header = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { itemCount, setIsCartOpen } = useCart();
  const { wishlistCount } = useWishlist();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);

  // Live search suggestion debouncer
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/products?search=${encodeURIComponent(searchQuery)}&limit=5`);
        const data = await res.json();
        if (data.products) {
          setSuggestions(data.products);
        }
      } catch (err) {
        console.error('Search suggestion error:', err);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Shop Products', href: '/shop' },
    { name: 'Custom Orders', href: '/custom-orders' },
    { name: 'Social Impact', href: '/social-impact' },
    { name: 'Gallery', href: '/gallery' },
    { name: 'About Us', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-eco-100 shadow-sm">
      {/* Top Announcement Bar */}
      <div className="bg-eco-800 text-white text-xs py-2 px-4 flex flex-wrap justify-between items-center text-center">
        <div className="container mx-auto flex justify-between items-center px-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-jute-300 animate-pulse" />
            <span>🌿 Direct Factory Jute Bags & Custom Orders for Weddings, Events & Shops!</span>
          </div>
          <div className="hidden md:flex items-center gap-4 text-eco-100">
            <a href="tel:+919849530536" className="flex items-center gap-1 hover:text-white transition-colors">
              <Phone className="w-3 h-3" /> +91 9849530536
            </a>
            <a
              href="https://wa.me/919849530536"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-white transition-colors"
            >
              <MessageCircle className="w-3 h-3 text-emerald-400" /> WhatsApp Direct
            </a>
          </div>
        </div>
      </div>

      {/* Main Navbar Header */}
      <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="lg:hidden text-slate-700 hover:text-eco-700 p-1"
          aria-label="Toggle Navigation Menu"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-full bg-eco-700 flex items-center justify-center text-white font-bold text-xl shadow-md group-hover:bg-eco-600 transition-colors">
            🌱
          </div>
          <div>
            <span className="font-serif font-bold text-lg md:text-xl text-eco-900 tracking-tight block leading-tight">
              Ujwala Eco Products
            </span>
            <span className="text-[10px] text-jute-600 font-medium block uppercase tracking-wider">
              Visakhapatnam • Handcrafted Jute
            </span>
          </div>
        </Link>

        {/* Search Bar with Autocomplete */}
        <div ref={searchRef} className="hidden md:block flex-1 max-w-md relative">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Search jute bags, return gifts, wooden toys..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              className="w-full bg-canvas-100 border border-eco-200 rounded-full py-2 pl-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-eco-600 focus:bg-white transition-all placeholder:text-slate-400"
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-eco-700 hover:text-eco-900"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>

          {/* Autocomplete Suggestions Box */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-eco-200 rounded-2xl shadow-xl z-50 overflow-hidden">
              <div className="p-2 text-xs font-semibold text-slate-500 bg-canvas-50 border-b border-eco-100">
                Matching Products
              </div>
              {suggestions.map((p) => (
                <Link
                  key={p.id}
                  href={`/products/${p.slug}`}
                  onClick={() => setShowSuggestions(false)}
                  className="flex items-center gap-3 p-2.5 hover:bg-eco-50 transition-colors border-b border-eco-50 last:border-none"
                >
                  <img
                    src={p.images[0]?.imageUrl || '/bags/b1.jpeg'}
                    alt={p.name}
                    className="w-10 h-10 object-cover rounded-lg"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-800 truncate">{p.name}</p>
                    <p className="text-[11px] text-eco-700 font-bold">₹{p.discountPrice || p.price}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Action Icons: Wishlist, Cart, Account */}
        <div className="flex items-center gap-3 md:gap-4">
          {/* Wishlist Icon */}
          <Link
            href="/account/wishlist"
            className="relative text-slate-700 hover:text-eco-700 p-1.5 rounded-full hover:bg-eco-50 transition-colors"
            title="Wishlist"
          >
            <Heart className="w-5 h-5" />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {wishlistCount}
              </span>
            )}
          </Link>

          {/* Cart Icon & Drawer Trigger */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative flex items-center gap-2 bg-eco-50 text-eco-800 hover:bg-eco-100 px-3 py-1.5 rounded-full border border-eco-200 transition-colors"
          >
            <ShoppingBag className="w-4 h-4 text-eco-700" />
            <span className="text-xs font-bold">{itemCount}</span>
            <span className="hidden sm:inline text-xs font-medium border-l border-eco-200 pl-2">
              Cart
            </span>
          </button>

          {/* Account Menu Dropdown */}
          <div className="relative">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                  className="flex items-center gap-1 text-xs font-semibold text-slate-800 bg-canvas-100 hover:bg-canvas-200 px-3 py-1.5 rounded-full border border-eco-200 transition-colors"
                >
                  <UserIcon className="w-3.5 h-3.5 text-eco-700" />
                  <span className="max-w-[80px] truncate">{user.name.split(' ')[0]}</span>
                  <ChevronDown className="w-3 h-3 text-slate-500" />
                </button>

                {isAccountMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-eco-200 rounded-xl shadow-xl z-50 py-2">
                    <div className="px-4 py-2 border-b border-eco-100">
                      <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                      <span className="mt-1 inline-block bg-eco-100 text-eco-800 text-[10px] font-bold px-2 py-0.5 rounded">
                        {user.role}
                      </span>
                    </div>

                    {['admin', 'superadmin', 'ADMIN', 'SUPERADMIN'].includes(user.role) && (
                      <Link
                        href="/admin"
                        onClick={() => setIsAccountMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-xs text-eco-800 hover:bg-eco-50 font-bold"
                      >
                        <LayoutDashboard className="w-3.5 h-3.5 text-eco-700" /> Admin Dashboard
                      </Link>
                    )}

                    <Link
                      href="/account"
                      onClick={() => setIsAccountMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-eco-50"
                    >
                      <UserIcon className="w-3.5 h-3.5 text-slate-500" /> My Profile
                    </Link>

                    <Link
                      href="/account/orders"
                      onClick={() => setIsAccountMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-eco-50"
                    >
                      <Package className="w-3.5 h-3.5 text-slate-500" /> My Orders & Tracking
                    </Link>

                    <button
                      onClick={() => {
                        setIsAccountMenuOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 border-t border-eco-100 mt-1"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="bg-eco-700 hover:bg-eco-800 text-white text-xs font-semibold px-4 py-1.5 rounded-full transition-colors shadow-sm"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Main Navigation Links Bar */}
      <nav className="hidden lg:block bg-canvas-50 border-t border-eco-100">
        <div className="container mx-auto px-4 flex justify-center items-center gap-8 py-2.5">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-xs uppercase font-bold tracking-wider transition-colors ${
                  isActive ? 'text-eco-800 underline underline-offset-8 decoration-2 decoration-eco-600' : 'text-slate-600 hover:text-eco-700'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-eco-100 px-4 py-4 space-y-4">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-canvas-100 border border-eco-200 rounded-full py-2 pl-4 pr-10 text-sm focus:outline-none"
            />
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-eco-700">
              <Search className="w-4 h-4" />
            </button>
          </form>

          <div className="flex flex-col space-y-2 pt-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`py-2 text-sm font-semibold border-b border-eco-50 ${
                  pathname === link.href ? 'text-eco-700 font-bold' : 'text-slate-700'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};
