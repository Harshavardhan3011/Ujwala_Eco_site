'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import {
  ShoppingBag, Trash2, Plus, Minus, ArrowRight, ShieldCheck,
  Truck, MessageCircle, X, CheckCircle2, AlertCircle, Loader2,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { getStorageUrl } from '@/lib/storage';
import { WHATSAPP_NUMBER } from '@/lib/constants';

interface CustomerForm {
  name: string;
  mobile: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  note: string;
}

const emptyForm: CustomerForm = {
  name: '', mobile: '', email: '', address: '',
  city: 'Visakhapatnam', state: 'Andhra Pradesh', pincode: '', note: '',
};

export default function CartPage() {
  const {
    cartItems, subtotal, shippingFee, totalAmount,
    updateQuantity, removeFromCart, clearCart,
  } = useCart();

  const [showWhatsAppForm, setShowWhatsAppForm] = useState(false);
  const [form, setForm] = useState<CustomerForm>(emptyForm);
  const [formErrors, setFormErrors] = useState<Partial<CustomerForm>>({});
  const [isOpening, setIsOpening] = useState(false);
  const [waNumber, setWaNumber] = useState(WHATSAPP_NUMBER);

  // Fetch WhatsApp number from the server-side config endpoint
  useEffect(() => {
    fetch('/api/whatsapp-order-config')
      .then((r) => r.json())
      .then((d) => { if (d.whatsappNumber) setWaNumber(d.whatsappNumber); })
      .catch(() => {/* keep default */});
  }, []);

  const validate = (): boolean => {
    const errors: Partial<CustomerForm> = {};
    if (!form.name.trim()) errors.name = 'Name is required';
    if (!form.mobile.trim() || form.mobile.replace(/\D/g, '').length < 10)
      errors.mobile = 'Valid 10-digit mobile number required';
    if (!form.address.trim()) errors.address = 'Delivery address is required';
    if (!form.city.trim()) errors.city = 'City is required';
    if (!form.state.trim()) errors.state = 'State is required';
    if (!form.pincode.trim() || form.pincode.replace(/\D/g, '').length < 6)
      errors.pincode = 'Valid 6-digit PIN code required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleWhatsAppOrder = () => {
    if (!validate()) return;
    setIsOpening(true);

    // Build structured WhatsApp message
    const lines: string[] = [
      '🛒 *NEW ORDER — UJWALA ECO PRODUCTS*',
      '',
      '━━━━━━━━━━━━━━━━━━━━━━',
      '*CUSTOMER DETAILS*',
      `Name: ${form.name}`,
      `Mobile: ${form.mobile}`,
    ];
    if (form.email) lines.push(`Email: ${form.email}`);
    lines.push(
      `Address: ${form.address}`,
      `City: ${form.city}`,
      `State: ${form.state}`,
      `Pincode: ${form.pincode}`,
      '',
      '━━━━━━━━━━━━━━━━━━━━━━',
      '*ORDER DETAILS*',
      '',
    );

    cartItems.forEach((item, idx) => {
      const itemSubtotal = item.price * item.quantity;
      const imageUrl = item.image ? getStorageUrl('products', item.image) : null;
      lines.push(
        `${idx + 1}. *${item.productName}*`,
        `   SKU: ${item.productSku}`,
        `   Qty: ${item.quantity}`,
        `   Price: ${formatPrice(item.price)} each`,
        `   Subtotal: ${formatPrice(itemSubtotal)}`,
      );
      if (imageUrl && imageUrl.startsWith('http')) {
        lines.push(`   Image: ${imageUrl}`);
      }
      if (item.customizationNotes) {
        lines.push(`   Note: ${item.customizationNotes}`);
      }
      lines.push('');
    });

    lines.push(
      '━━━━━━━━━━━━━━━━━━━━━━',
      `Items Subtotal: ${formatPrice(subtotal)}`,
      `Shipping: ${shippingFee === 0 ? 'FREE' : formatPrice(shippingFee)}`,
      `*TOTAL: ${formatPrice(totalAmount)}*`,
    );
    if (form.note) {
      lines.push('', '━━━━━━━━━━━━━━━━━━━━━━', `Customer Note: ${form.note}`);
    }
    lines.push('', '— Sent from ujwalaeco.com');

    const message = lines.join('\n');
    const encoded = encodeURIComponent(message);
    const url = `https://wa.me/${waNumber}?text=${encoded}`;

    window.open(url, '_blank', 'noopener,noreferrer');
    setIsOpening(false);
    setShowWhatsAppForm(false);
    setForm(emptyForm);
  };

  const fieldCls = (err?: string) =>
    `w-full bg-canvas-100 border rounded-xl p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-eco-600 ${
      err ? 'border-rose-400' : 'border-eco-200'
    }`;

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 max-w-5xl">
      {/* Page Header */}
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
          <div className="w-16 h-16 bg-eco-50 rounded-full flex items-center justify-center mx-auto text-2xl">
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
            {cartItems.map((item) => {
              const resolvedImage = getStorageUrl('products', item.image || '');
              return (
                <div
                  key={item.id}
                  className="bg-white p-4 rounded-2xl border border-eco-100 shadow-xs flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-20 h-20 rounded-xl border border-eco-100 shrink-0 overflow-hidden bg-eco-50 flex items-center justify-center">
                      <img
                        src={resolvedImage}
                        alt={item.productName}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder-product.svg';
                          (e.target as HTMLImageElement).onerror = null;
                        }}
                      />
                    </div>
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
                        className="text-[10px] text-rose-600 font-bold hover:underline flex items-center gap-0.5 ml-auto"
                      >
                        <Trash2 className="w-2.5 h-2.5" /> Remove
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary Sidebar */}
          <div className="bg-white p-6 rounded-3xl border border-eco-100 shadow-sm space-y-5 h-fit">
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
                  {shippingFee === 0 ? (
                    <span className="text-emerald-700 font-bold">FREE</span>
                  ) : (
                    formatPrice(shippingFee)
                  )}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 pt-3 border-t border-eco-100">
                <span>Total Payable</span>
                <span className="text-eco-900 font-serif text-lg">{formatPrice(totalAmount)}</span>
              </div>
            </div>

            {/* Primary CTA: WhatsApp Order */}
            <button
              onClick={() => setShowWhatsAppForm(true)}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3.5 px-4 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4" /> Order via WhatsApp
            </button>

            {/* Secondary CTA: Full Checkout */}
            <Link
              href="/checkout"
              className="w-full bg-eco-700 hover:bg-eco-800 text-white font-bold text-xs py-3 px-4 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
            >
              Full Checkout <ArrowRight className="w-4 h-4" />
            </Link>

            <div className="space-y-2 text-[11px] text-slate-500 pt-1 border-t border-eco-50">
              <p className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Secure order process
              </p>
              <p className="flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-eco-700" /> Fast Delivery across Visakhapatnam &amp; India
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── WhatsApp Order Form Modal ── */}
      {showWhatsAppForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-eco-100 sticky top-0 bg-white rounded-t-3xl z-10">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-emerald-600" />
                <h2 className="font-serif font-bold text-base text-slate-900">Order via WhatsApp</h2>
              </div>
              <button
                onClick={() => { setShowWhatsAppForm(false); setFormErrors({}); }}
                className="p-1.5 rounded-full hover:bg-eco-50 transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p>
                  We'll send your order details directly to our WhatsApp. Our team will confirm
                  availability and delivery details with you.
                </p>
              </div>

              {/* Customer Details */}
              <div>
                <p className="text-[11px] font-bold text-eco-700 uppercase tracking-wider mb-3">
                  Your Details
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Srinivas Rao"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className={fieldCls(formErrors.name)}
                    />
                    {formErrors.name && (
                      <p className="text-[10px] text-rose-600 mt-0.5 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {formErrors.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Mobile Number (WhatsApp) *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 8247671857"
                      value={form.mobile}
                      onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                      className={fieldCls(formErrors.mobile)}
                    />
                    {formErrors.mobile && (
                      <p className="text-[10px] text-rose-600 mt-0.5 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {formErrors.mobile}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Email Address <span className="font-normal text-slate-400">(optional)</span>
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. yourname@gmail.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className={fieldCls()}
                    />
                  </div>
                </div>
              </div>

              {/* Delivery Details */}
              <div>
                <p className="text-[11px] font-bold text-eco-700 uppercase tracking-wider mb-3">
                  Delivery Address
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Street / House Address *
                    </label>
                    <textarea
                      rows={2}
                      required
                      placeholder="Flat / House No., Street, Area..."
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      className={fieldCls(formErrors.address)}
                    />
                    {formErrors.address && (
                      <p className="text-[10px] text-rose-600 mt-0.5 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {formErrors.address}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">City *</label>
                      <input
                        type="text"
                        required
                        placeholder="City"
                        value={form.city}
                        onChange={(e) => setForm({ ...form, city: e.target.value })}
                        className={fieldCls(formErrors.city)}
                      />
                      {formErrors.city && (
                        <p className="text-[10px] text-rose-600 mt-0.5">{formErrors.city}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">State *</label>
                      <input
                        type="text"
                        required
                        placeholder="State"
                        value={form.state}
                        onChange={(e) => setForm({ ...form, state: e.target.value })}
                        className={fieldCls(formErrors.state)}
                      />
                      {formErrors.state && (
                        <p className="text-[10px] text-rose-600 mt-0.5">{formErrors.state}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">PIN Code *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 530049"
                      maxLength={6}
                      value={form.pincode}
                      onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                      className={fieldCls(formErrors.pincode)}
                    />
                    {formErrors.pincode && (
                      <p className="text-[10px] text-rose-600 mt-0.5 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {formErrors.pincode}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Additional Note <span className="font-normal text-slate-400">(optional)</span>
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Any special delivery instructions or customization notes..."
                      value={form.note}
                      onChange={(e) => setForm({ ...form, note: e.target.value })}
                      className={fieldCls()}
                    />
                  </div>
                </div>
              </div>

              {/* Order Preview in Modal */}
              <div className="bg-canvas-50 rounded-2xl p-4 border border-eco-100 space-y-2">
                <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Your Order ({cartItems.length} item{cartItems.length !== 1 ? 's' : ''})
                </p>
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between text-xs text-slate-700">
                    <span className="truncate max-w-[60%] font-medium">{item.productName} ×{item.quantity}</span>
                    <span className="font-bold text-eco-900">{formatPrice(item.itemTotal)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-eco-100">
                  <span>Total</span>
                  <span className="text-eco-900">{formatPrice(totalAmount)}</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleWhatsAppOrder}
                disabled={isOpening}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm py-4 rounded-2xl shadow-lg transition-colors flex items-center justify-center gap-2"
              >
                {isOpening ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Opening WhatsApp...</>
                ) : (
                  <><MessageCircle className="w-5 h-5" /> Send Order on WhatsApp</>
                )}
              </button>

              <p className="text-[10px] text-slate-400 text-center">
                This will open WhatsApp with your order details pre-filled. No payment is taken online.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
