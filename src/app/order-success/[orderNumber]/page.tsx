'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle2, Package, Truck, MapPin, Phone,
  CreditCard, Banknote, ArrowRight, ShoppingBag, Loader2,
} from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/utils';

export default function OrderSuccessPage() {
  const params = useParams();
  const router = useRouter();
  const orderNumber = params.orderNumber as string;

  const [order, setOrder] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadOrder() {
      try {
        const res = await fetch(`/api/orders/${orderNumber}`);
        const data = await res.json();
        if (res.ok && data.order) {
          setOrder(data.order);
        } else {
          setError(data.error || 'Order not found');
        }
      } catch (err: any) {
        setError('Failed to load order details');
      } finally {
        setIsLoading(false);
      }
    }

    if (orderNumber) {
      loadOrder();
    }
  }, [orderNumber]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center space-y-4 max-w-md">
        <Loader2 className="w-8 h-8 text-eco-700 animate-spin" />
        <p className="text-sm font-semibold text-slate-600">Loading order confirmation…</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto px-4 py-20 text-center space-y-4 max-w-md">
        <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto">
          <Package className="w-8 h-8" />
        </div>
        <h1 className="font-serif font-bold text-xl text-slate-900">Order Placed</h1>
        <p className="text-xs text-slate-500">
          Your order has been recorded. You can view all your orders in your customer account.
        </p>
        <div className="flex gap-3 justify-center pt-2">
          <Link
            href="/account/orders"
            className="bg-eco-700 hover:bg-eco-800 text-white font-bold text-xs px-5 py-2.5 rounded-full transition-colors"
          >
            My Orders
          </Link>
          <Link
            href="/shop"
            className="border border-eco-200 text-eco-900 font-bold text-xs px-5 py-2.5 rounded-full hover:bg-eco-50 transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  const isCod = order.payment_method === 'COD';

  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl space-y-8">
      {/* Success Hero Card */}
      <div className="bg-white rounded-3xl p-8 border border-eco-100 shadow-sm text-center space-y-4">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-50">
          <CheckCircle2 className="w-9 h-9" />
        </div>
        <div>
          <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full mb-2">
            {isCod ? 'Order Placed — Cash on Delivery' : 'Payment Confirmed'}
          </span>
          <h1 className="font-serif font-bold text-2xl md:text-3xl text-slate-900">
            Thank you for your order!
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Order Reference: <span className="font-bold text-slate-900 font-mono">#{order.order_number}</span>
          </p>
        </div>

        <div className="bg-canvas-50 rounded-2xl p-4 border border-eco-100 text-left grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Placed On</span>
            <span className="font-semibold text-slate-800">{formatDate(order.created_at)}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Payment Mode</span>
            <span className="font-semibold text-slate-800 flex items-center gap-1">
              {isCod ? <Banknote className="w-3.5 h-3.5 text-emerald-600" /> : <CreditCard className="w-3.5 h-3.5 text-blue-600" />}
              {isCod ? 'Cash on Delivery' : 'Online Payment (Razorpay)'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Total Amount</span>
            <span className="font-serif font-bold text-base text-eco-900">{formatPrice(order.total_amount)}</span>
          </div>
        </div>
      </div>

      {/* Items & Shipping Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Ordered Items List */}
        <div className="md:col-span-2 bg-white rounded-3xl p-6 border border-eco-100 shadow-sm space-y-4">
          <h2 className="font-serif font-bold text-base text-slate-900 flex items-center gap-2 border-b border-eco-100 pb-3">
            <ShoppingBag className="w-4 h-4 text-eco-700" />
            Purchased Items ({(order.items || []).length})
          </h2>
          <div className="divide-y divide-eco-50 space-y-2">
            {(order.items || []).map((item: any) => (
              <div key={item.id} className="pt-2 flex justify-between items-center text-xs">
                <div>
                  <p className="font-semibold text-slate-900">{item.product_name || item.productName}</p>
                  <p className="text-slate-400 text-[11px]">
                    Qty: {item.quantity} × {formatPrice(item.price)}
                  </p>
                  {item.customization_notes && (
                    <p className="text-[10px] text-jute-800 bg-jute-50 px-2 py-0.5 rounded mt-1">
                      Custom: {item.customization_notes}
                    </p>
                  )}
                </div>
                <span className="font-bold text-slate-900">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-eco-100 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Shipping & Handling</span>
              <span>{Number(order.shipping_fee) === 0 ? <span className="text-emerald-700 font-bold">FREE</span> : formatPrice(order.shipping_fee)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-eco-50">
              <span>Grand Total</span>
              <span className="text-eco-900 font-serif text-base">{formatPrice(order.total_amount)}</span>
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        <div className="bg-white rounded-3xl p-6 border border-eco-100 shadow-sm space-y-4 h-fit">
          <h2 className="font-serif font-bold text-base text-slate-900 flex items-center gap-2 border-b border-eco-100 pb-3">
            <MapPin className="w-4 h-4 text-eco-700" />
            Shipping Details
          </h2>
          <div className="text-xs space-y-2 text-slate-600">
            <p className="font-bold text-slate-900 text-sm">{order.shipping_name}</p>
            <p className="flex items-center gap-1.5 text-slate-700 font-medium">
              <Phone className="w-3.5 h-3.5 text-slate-400" /> {order.shipping_phone}
            </p>
            <p className="leading-relaxed text-slate-600">
              {order.shipping_address}, {order.shipping_city}, {order.shipping_state} - {order.shipping_postal_code}
            </p>
          </div>

          <div className="pt-3 border-t border-eco-50">
            <div className="bg-eco-50 rounded-xl p-3 text-[11px] text-eco-900 font-medium flex items-center gap-2">
              <Truck className="w-4 h-4 text-eco-700 shrink-0" />
              <span>We are preparing your eco-friendly handcrafted items for dispatch.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
        <Link
          href={`/account/orders/${order.id}`}
          className="bg-eco-700 hover:bg-eco-800 text-white font-bold text-xs px-6 py-3 rounded-full shadow-md transition-colors flex items-center justify-center gap-2"
        >
          <Package className="w-4 h-4" /> Track Order in Account
        </Link>
        <Link
          href="/shop"
          className="border border-eco-300 text-eco-900 hover:bg-eco-50 font-bold text-xs px-6 py-3 rounded-full transition-colors flex items-center justify-center gap-2"
        >
          Continue Shopping <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
