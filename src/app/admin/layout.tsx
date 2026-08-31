'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingBag,
  FileText,
  Settings,
  Users,
  Star,
  Boxes,
  Image as ImageIcon,
  Bell,
  Menu,
  X,
  LogOut,
  ChevronDown,
  ExternalLink,
  ShieldCheck,
  User as UserIcon,
  Sparkles,
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: 'Overview',
    items: [
      { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Catalog',
    items: [
      { name: 'Products', href: '/admin/products', icon: Package },
      { name: 'Categories', href: '/admin/categories', icon: FolderTree },
      { name: 'Inventory', href: '/admin/inventory', icon: Boxes },
    ],
  },
  {
    label: 'Orders',
    items: [
      { name: 'Order Requests', href: '/admin/order-requests', icon: FileText },
      { name: 'Confirmed Orders', href: '/admin/orders', icon: ShoppingBag },
      { name: 'Custom Orders', href: '/admin/custom-orders', icon: Sparkles },
    ],
  },
  {
    label: 'Customers',
    items: [
      { name: 'Customers', href: '/admin/customers', icon: Users },
      { name: 'Reviews', href: '/admin/reviews', icon: Star },
    ],
  },
  {
    label: 'Content',
    items: [
      { name: 'Media', href: '/admin/media', icon: ImageIcon },
      { name: 'Settings', href: '/admin/site-settings', icon: Settings },
    ],
  },
];

const PAGE_TITLES: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/products': 'Products',
  '/admin/categories': 'Categories',
  '/admin/order-requests': 'Order Requests',
  '/admin/orders': 'Confirmed Orders',
  '/admin/custom-orders': 'Custom Orders',
  '/admin/customers': 'Customers',
  '/admin/inventory': 'Inventory',
  '/admin/reviews': 'Reviews',
  '/admin/media': 'Media Library',
  '/admin/site-settings': 'Settings',
};

function NavLink({ item, active, onClick }: { item: NavItem; active: boolean; onClick?: () => void }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
        active
          ? 'bg-eco-700 text-white shadow-sm'
          : 'text-eco-200 hover:bg-eco-800 hover:text-white'
      }`}
    >
      <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-eco-300 group-hover:text-white'}`} />
      <span>{item.name}</span>
    </Link>
  );
}

function Sidebar({ pathname, onNavClick }: { pathname: string; onNavClick?: () => void }) {
  const getActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-eco-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-eco-600 rounded-lg flex items-center justify-center text-white font-serif font-bold text-sm shrink-0">
            U
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">Ujwala Eco</p>
            <p className="text-eco-400 text-[10px] font-medium">Admin Operations</p>
          </div>
        </div>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="text-[10px] font-bold text-eco-500 uppercase tracking-widest px-3 mb-1.5">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  active={getActive(item.href)}
                  onClick={onNavClick}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom: Storefront link */}
      <div className="px-3 py-4 border-t border-eco-800">
        <Link
          href="/shop"
          className="flex items-center gap-2 px-3 py-2 text-eco-400 hover:text-eco-200 text-xs font-medium transition-colors"
          onClick={onNavClick}
        >
          <ExternalLink className="w-3.5 h-3.5" />
          View Storefront
        </Link>
      </div>
    </div>
  );
}

function ProfileMenu({ user, logout }: { user: any; logout: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-eco-50 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-eco-700 text-white font-bold text-sm flex items-center justify-center font-serif shrink-0">
          {(user?.name || 'A')[0].toUpperCase()}
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-xs font-bold text-slate-900 leading-tight max-w-[120px] truncate">{user?.name}</p>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-eco-100 text-eco-800">
            ADMIN
          </span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-52 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-50">
          <div className="px-4 py-2.5 border-b border-slate-100">
            <p className="text-xs font-bold text-slate-900 truncate">{user?.name}</p>
            <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
          </div>
          <Link
            href="/account"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-eco-50 transition-colors"
          >
            <UserIcon className="w-3.5 h-3.5" />
            My Account
          </Link>
          <Link
            href="/shop"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-eco-50 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            View Storefront
          </Link>
          <div className="border-t border-slate-100 mt-1 pt-1">
            <button
              onClick={() => { setOpen(false); logout(); }}
              className="flex items-center gap-2 w-full px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isLoginPage = pathname === '/admin/login';
  const roleLower = user?.role?.toLowerCase();

  useEffect(() => {
    if (!isLoginPage && !isLoading) {
      if (!user) {
        router.push('/admin/login');
      } else if (roleLower === 'superadmin') {
        router.push('/superadmin');
      } else if (roleLower !== 'admin') {
        router.push('/admin/login');
      }
    }
  }, [user, isLoading, router, pathname, isLoginPage, roleLower]);

  if (isLoginPage) return <>{children}</>;

  if (isLoading || !user || roleLower !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-eco-950">
        <div className="text-center space-y-3">
          <ShieldCheck className="w-10 h-10 text-eco-400 mx-auto animate-pulse" />
          <p className="text-eco-300 text-sm font-medium">Verifying admin credentials…</p>
        </div>
      </div>
    );
  }

  let pageTitle = 'Dashboard';
  for (const [pattern, title] of Object.entries(PAGE_TITLES)) {
    if (pattern === '/admin' ? pathname === '/admin' : pathname.startsWith(pattern)) {
      pageTitle = title;
    }
  }
  if (pathname.match(/^\/admin\/orders\/[^/]+$/)) pageTitle = 'Order Detail';

  return (
    <div className="flex h-screen bg-canvas-100 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-56 bg-eco-950 shrink-0">
        <Sidebar pathname={pathname} />
      </aside>

      {/* Mobile Drawer */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-eco-950 flex flex-col lg:hidden transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-eco-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-eco-600 rounded-lg flex items-center justify-center text-white font-serif font-bold text-sm">
              U
            </div>
            <span className="text-white font-bold text-sm">Ujwala Eco</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="text-eco-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>
        <Sidebar pathname={pathname} onNavClick={() => setSidebarOpen(false)} />
      </aside>

      {/* Main Content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <header className="bg-white border-b border-eco-100 px-4 sm:px-6 h-14 flex items-center justify-between gap-4 shrink-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-eco-50 transition-colors"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-1.5 text-sm">
              <span className="text-slate-400 font-medium hidden sm:inline">Admin</span>
              <span className="text-slate-300 hidden sm:inline">/</span>
              <span className="font-semibold text-slate-800">{pageTitle}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="relative p-2 rounded-lg text-slate-500 hover:bg-eco-50 transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            <ProfileMenu user={user} logout={logout} />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
