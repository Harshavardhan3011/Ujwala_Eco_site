'use client';

import React from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, ShieldCheck, Truck } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

export default function CartPage() {
  const {
    cartItems,
    subtotal,
    shippingFee,
    totalAmount,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 max-w-5xl">
      <div className="flex items-center justify-between border-b border-eco-100 pb-4">
        <h1 className="font-serif font-bold text-2xl md:text-3xl text-slate-900 flex items-center gap-2">
          <ShoppingBag className="w-6 h-6 text-eco-700" /> Shopping Cart ({cartItems.length})
        </h1>
        {cartItems.length > 0 && (
          <button
            onClick={clearCart}
            className="text-xs text-rose-600 font-bold hover:underline"
          >
            Clear Entire Cart
          </button>
        )}
      </div>

      {cartItems.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-eco-100 text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 bg-eco-50 rounded-full flex items-center justify-center mx-auto text-eco-700 font-bold text-2xl">
            🛍️
          </div>
          <h2 className="font-serif font-bold text-xl text-slate-900">Your Shopping Cart is Empty</h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You haven't added any handcrafted eco jute bags or return gift items to your cart yet.
          </p>
          <Link
            href="/shop"
            className="inline-block bg-eco-700 hover:bg-eco-800 text-white text-xs font-bold px-6 py-3 rounded-full shadow-md transition-colors"
          >
            Explore Product Catalog
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items List */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="bg-white p-4 rounded-2xl border border-eco-100 shadow-xs flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <img
                    src={item.image}
                    alt={item.productName}
                    className="w-20 h-20 object-cover rounded-xl border border-eco-100 shrink-0"
                  />
                  <div className="min-w-0">
                    <h3 className="font-serif font-bold text-sm text-slate-900 truncate">
                      {item.productName}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-mono">SKU: {item.productSku}</p>
                    <p className="text-xs font-bold text-eco-800 mt-1">
                      {formatPrice(item.price)} each
                    </p>
                    {item.customizationNotes && (
                      <p className="text-[10px] bg-jute-50 text-jute-900 p-1 rounded mt-1">
                        ✏️ {item.customizationNotes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-6 border-t sm:border-t-0 pt-3 sm:pt-0 border-eco-50">
                  <div className="flex items-center border border-eco-300 rounded-lg bg-white">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="px-2.5 py-1 text-slate-600 hover:text-eco-800 font-bold"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="px-3 text-xs font-bold text-slate-900">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="px-2.5 py-1 text-slate-600 hover:text-eco-800 font-bold"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="text-right">
                    <span className="font-bold text-sm text-eco-900 block">
                      {formatPrice(item.itemTotal)}
                    </span>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-[10px] text-rose-600 font-bold hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary Sidebar */}
          <div className="bg-white p-6 rounded-3xl border border-eco-100 shadow-sm space-y-6 h-fit">
            <h3 className="font-serif font-bold text-base text-slate-900 border-b border-eco-100 pb-3">
              Order Summary
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Items Subtotal</span>
                <span className="font-bold text-slate-900">{formatPrice(subtotal)}</span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>Shipping Fee</span>
                <span className="font-bold text-slate-900">
                  {shippingFee === 0 ? <span className="text-emerald-700 font-bold">FREE</span> : formatPrice(shippingFee)}
                </span>
              </div>

              <div className="flex justify-between text-sm font-bold text-slate-900 pt-3 border-t border-eco-100">
                <span>Total Payable</span>
                <span className="text-eco-900 font-serif text-lg">{formatPrice(totalAmount)}</span>
              </div>
            </div>

            <Link
              href="/checkout"
              className="w-full bg-eco-700 hover:bg-eco-800 text-white font-bold text-xs py-3.5 px-4 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
            >
              Proceed to Multi-Step Checkout <ArrowRight className="w-4 h-4" />
            </Link>

            <div className="space-y-2 text-[11px] text-slate-500 pt-2 border-t border-eco-50">
              <p className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Secure Razorpay Payment Gateway
              </p>
              <p className="flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-eco-700" /> Fast Delivery across Visakhapatnam & India
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
