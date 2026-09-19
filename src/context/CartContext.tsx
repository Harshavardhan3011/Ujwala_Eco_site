'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

export interface CartItemType {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  productSlug: string;
  image: string | null;
  price: number;
  originalPrice: number;
  quantity: number;
  minOrderQuantity: number;
  stockQuantity: number;
  customizationNotes?: string;
  itemTotal: number;
}

interface CartContextType {
  cartItems: CartItemType[];
  itemCount: number;
  subtotal: number;
  shippingFee: number;
  totalAmount: number;
  isLoading: boolean;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  addToCart: (productId: string, quantity?: number, customizationNotes?: string) => Promise<{ success: boolean; error?: string }>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType>({
  cartItems: [],
  itemCount: 0,
  subtotal: 0,
  shippingFee: 0,
  totalAmount: 0,
  isLoading: true,
  isCartOpen: false,
  setIsCartOpen: () => {},
  addToCart: async () => ({ success: false }),
  updateQuantity: async () => {},
  removeFromCart: async () => {},
  clearCart: async () => {},
});

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState<CartItemType[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [shippingFee, setShippingFee] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const getSessionId = () => {
    if (typeof window === 'undefined') return 'guest';
    let sid = localStorage.getItem('ujwala_cart_sid');
    if (!sid) {
      sid = `sid_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      localStorage.setItem('ujwala_cart_sid', sid);
    }
    return sid;
  };

  const fetchCart = async () => {
    try {
      setIsLoading(true);
      const sid = getSessionId();
      const res = await fetch('/api/cart', {
        headers: { 'x-session-id': sid },
      });
      const data = await res.json();

      if (data.items) {
        setCartItems(data.items);
        setSubtotal(data.subtotal || 0);
        setShippingFee(data.shippingFee || 0);
        setTotalAmount(data.totalAmount || 0);
      }
    } catch (error) {
      console.error('Fetch cart error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [user]);

  const addToCart = async (productId: string, quantity = 1, customizationNotes?: string) => {
    try {
      const sid = getSessionId();
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sid,
        },
        body: JSON.stringify({ productId, quantity, customizationNotes, sessionId: sid }),
      });
      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to add item to cart' };
      }

      await fetchCart();
      setIsCartOpen(true);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to add item to cart' };
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    const targetItem = cartItems.find((i) => i.id === itemId);
    if (!targetItem) return;

    if (quantity < 1) {
      await removeFromCart(itemId);
      return;
    }

    try {
      const sid = getSessionId();
      await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sid,
        },
        body: JSON.stringify({
          productId: targetItem.productId,
          quantity,
          customizationNotes: targetItem.customizationNotes,
          sessionId: sid,
        }),
      });
      await fetchCart();
    } catch (error) {
      console.error('Update quantity error:', error);
    }
  };

  const removeFromCart = async (itemId: string) => {
    try {
      const sid = getSessionId();
      await fetch(`/api/cart?itemId=${itemId}`, {
        method: 'DELETE',
        headers: { 'x-session-id': sid },
      });
      await fetchCart();
    } catch (error) {
      console.error('Remove from cart error:', error);
    }
  };

  const clearCart = async () => {
    try {
      const sid = getSessionId();
      await fetch('/api/cart', {
        method: 'DELETE',
        headers: { 'x-session-id': sid },
      });
      await fetchCart();
    } catch (error) {
      console.error('Clear cart error:', error);
    }
  };

  const itemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        itemCount,
        subtotal,
        shippingFee,
        totalAmount,
        isLoading,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
