'use client';

import { usePathname } from 'next/navigation';

export function useAdminPath() {
  const pathname = usePathname();
  const isSuper = pathname.startsWith('/superadmin');
  const base = isSuper ? '/superadmin' : '/admin';
  return {
    base,
    isSuper,
    orders: `${base}/orders`,
    products: `${base}/products`,
    categories: `${base}/categories`,
    customOrders: `${base}/custom-orders`,
    customers: `${base}/customers`,
    inventory: `${base}/inventory`,
    reviews: `${base}/reviews`,
    media: `${base}/media`,
    siteSettings: `${base}/site-settings`,
    users: `/superadmin/users`,
  };
}
