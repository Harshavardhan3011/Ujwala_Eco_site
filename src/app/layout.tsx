import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CartDrawer } from '@/components/layout/CartDrawer';

export const metadata: Metadata = {
  title: 'Ujwala Eco Products | Handcrafted Jute Bags & Custom Return Gifts',
  description:
    'Eco-friendly jute bag manufacturer in Visakhapatnam. Custom printed jute bags for weddings, functions, and shop bulk orders. Women empowerment initiative.',
  keywords: [
    'jute bags',
    'eco friendly bags',
    'custom jute bags',
    'wedding return gift bags',
    'visakhapatnam jute manufacturer',
    'ujwala eco products',
    'etikoppaka wooden toys',
    'brass return gifts',
  ],
  authors: [{ name: 'N. Suguna - Ujwala Eco Products' }],
  openGraph: {
    title: 'Ujwala Eco Products | Handcrafted Jute Bags & Eco Gifts',
    description: 'Ban Plastic, Choose Eco-Friendly Handcrafted Jute Bags & Return Gifts.',
    url: 'https://ujwalaeco.com',
    siteName: 'Ujwala Eco Products',
    locale: 'en_IN',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-canvas-50 text-slate-800 font-sans antialiased min-h-screen flex flex-col selection:bg-eco-200 selection:text-eco-900">
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
              <CartDrawer />
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

