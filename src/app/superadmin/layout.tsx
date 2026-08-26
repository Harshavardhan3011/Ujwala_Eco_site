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
  UserCheck,
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
      { name: 'Dashboard', href: '/superadmin', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Catalog',
    items: [
      { name: 'Products', href: '/superadmin/products', icon: Package },
      { name: 'Categories', href: '/superadmin/categories', icon: FolderTree },
      { name: 'Inventory', href: '/superadmin/inventory', icon: Boxes },
    ],
  },
  {
    label: 'Orders',
    items: [
      { name: 'Orders', href: '/superadmin/orders', icon: ShoppingBag },
      { name: 'Custom Orders', href: '/superadmin/custom-orders', icon: FileText },
    ],
  },
  {
    label: 'Customers',
    items: [
      { name: 'Customers', href: '/superadmin/customers', icon: Users },
      { name: 'Reviews', href: '/superadmin/reviews', icon: Star },
    ],
  },
  {
    label: 'Content',
    items: [
      { name: 'Media', href: '/superadmin/media', icon: ImageIcon },
      { name: 'Site Settings', href: '/superadmin/site-settings', icon: Settings },
    ],
  },
  {
    label: 'System',
    items: [
      { name: 'User Management', href: '/superadmin/users', icon: UserCheck },
    ],
  },
];

const PAGE_TITLES: Record<string, string> = {
  '/superadmin': 'Dashboard',
  '/superadmin/products': 'Products',
  '/superadmin/categories': 'Categories',
  '/superadmin/orders': 'Orders',
  '/superadmin/custom-orders': 'Custom Orders',
  '/superadmin/customers': 'Customers',
  '/superadmin/inventory': 'Inventory',
  '/superadmin/reviews': 'Reviews',
  '/superadmin/media': 'Media Library',
  '/superadmin/site-settings': 'Site Settings',
  '/superadmin/users': 'User Management',
};

function NavLink({ item, active, onClick }: { item: NavItem; active: boolean; onClick?: () => void }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
        active
          ? 'bg-amber-600 text-white shadow-sm'
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
    if (href === '/superadmin') return pathname === '/superadmin';
    return pathname.startsWith(href);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-eco-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-amber-600 rounded-lg flex items-center justify-center text-white font-serif font-bold text-sm shrink-0 shadow-sm">
            U
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">Ujwala Eco</p>
            <p className="text-amber-400 text-[10px] font-bold tracking-wide">System Administration</p>
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
        <div className="w-8 h-8 rounded-full bg-amber-700 text-white font-bold text-sm flex items-center justify-center font-serif shrink-0">
          {(user?.name || 'S')[0].toUpperCase()}
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-xs font-bold text-slate-900 leading-tight max-w-[120px] truncate">{user?.name}</p>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
            SUPERADMIN
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
            href="/superadmin/users"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-2 text-xs text-amber-800 hover:bg-amber-50 font-bold transition-colors"
          >
            <UserCheck className="w-3.5 h-3.5" />
            User Management
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

export default function SuperadminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const roleLower = user?.role?.toLowerCase();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/admin/login');
      } else if (roleLower === 'admin') {
        router.push('/admin');
      } else if (roleLower !== 'superadmin') {
        router.push('/admin/login');
      }
    }
  }, [user, isLoading, router, roleLower]);

  if (isLoading || !user || roleLower !== 'superadmin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-eco-950">
        <div className="text-center space-y-3">
          <ShieldCheck className="w-10 h-10 text-amber-400 mx-auto animate-pulse" />
          <p className="text-amber-300 text-sm font-medium">Verifying superadmin credentials…</p>
        </div>
      </div>
    );
  }

  let pageTitle = 'Dashboard';
  for (const [pattern, title] of Object.entries(PAGE_TITLES)) {
    if (pattern === '/superadmin' ? pathname === '/superadmin' : pathname.startsWith(pattern)) {
      pageTitle = title;
    }
  }
  if (pathname.match(/^\/superadmin\/orders\/[^/]+$/)) pageTitle = 'Order Detail';

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
            <div className="w-7 h-7 bg-amber-600 rounded-lg flex items-center justify-center text-white font-serif font-bold text-sm">
              U
            </div>
            <span className="text-white font-bold text-sm">Superadmin Console</span>
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
              <span className="text-amber-700 font-bold hidden sm:inline">Superadmin</span>
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
