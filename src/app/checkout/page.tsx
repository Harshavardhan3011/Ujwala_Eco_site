'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import {
  FileText, CheckCircle2, AlertCircle, Loader2, Sparkles,
  ArrowLeft, ArrowRight, ShieldCheck, Truck, ShoppingBag, X, Send,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';

interface PreviewData {
  items: {
    productId: string;
    name: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    customizationNotes?: string | null;
  }[];
  subtotal: number;
  deliveryCharge: number;
  grandTotal: number;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { cartItems, clearCart } = useCart();
  const { user } = useAuth();

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('Visakhapatnam');
  const [state, setState] = useState('Andhra Pradesh');
  const [postalCode, setPostalCode] = useState('530049');
  const [country, setCountry] = useState('India');
  const [customizationNotes, setCustomizationNotes] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');

  // UI States
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [submissionError, setSubmissionError] = useState('');
  const [submittedOrder, setSubmittedOrder] = useState<any | null>(null);

  // Initialize from logged in user profile
  useEffect(() => {
    if (user) {
      if (!fullName && user.name) setFullName(user.name);
      if (!email && user.email) setEmail(user.email);
      if (!phone && user.phone) setPhone(user.phone);
    }
  }, [user]);

  // Validation function with customer-friendly messages
  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!fullName.trim()) {
      errors.fullName = 'Please enter your full name.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!phone.trim() || phone.trim().length < 8) {
      errors.phone = 'Please enter your phone number.';
    }

    if (!addressLine1.trim()) {
      errors.addressLine1 = 'Please enter your delivery address.';
    }

    if (!city.trim()) {
      errors.city = 'Please enter your city.';
    }

    if (!state.trim()) {
      errors.state = 'Please enter your state.';
    }

    if (!postalCode.trim() || postalCode.trim().length < 4) {
      errors.postalCode = 'Please enter your PIN code.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Open Receipt Preview
  const handleReviewOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionError('');

    if (!validateForm()) {
      // Scroll to top of form
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsLoadingPreview(true);

    try {
      // Fetch authoritative server preview & stock validation
      const res = await fetch('/api/order-requests/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cartItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            customizationNotes: item.customizationNotes || customizationNotes || null,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to calculate order preview');
      }

      setPreviewData(data);
      setShowReceiptModal(true);
    } catch (err: any) {
      setSubmissionError(err.message || 'Error validating order items.');
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // Submit Final Order Request
  const handleSubmitOrder = async () => {
    if (isSubmittingOrder) return;
    setIsSubmittingOrder(true);
    setSubmissionError('');

    try {
      let sid = '';
      if (typeof window !== 'undefined') {
        sid = localStorage.getItem('ujwala_cart_sid') || '';
      }

      const res = await fetch('/api/order-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          addressLine1,
          addressLine2,
          city,
          state,
          postalCode,
          country,
          customerNotes,
          customizationNotes,
          items: cartItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            customizationNotes: item.customizationNotes || customizationNotes || null,
          })),
          sessionId: sid,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit order request.');
      }

      clearCart();
      setShowReceiptModal(false);
      setSubmittedOrder(data.orderRequest);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setSubmissionError(err.message || 'Failed to submit order request.');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // 1. Success Screen after submission
  if (submittedOrder) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-eco-100 shadow-sm text-center space-y-6">
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600 shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Request Received
            </span>
            <h1 className="font-serif font-bold text-2xl sm:text-3xl text-slate-900">
              Order Request Submitted
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-mono">
              Request Reference: <strong className="text-slate-900">{submittedOrder.requestNumber}</strong>
            </p>
          </div>

          <div className="p-4 sm:p-6 bg-canvas-50 rounded-2xl border border-eco-100 text-left space-y-3 text-xs text-slate-700">
            <p className="font-bold text-slate-900 text-sm">Next Steps:</p>
            <p>
              Thank you, <strong>{submittedOrder.customerName}</strong>! We have received your order request for{' '}
              <strong>{formatPrice(submittedOrder.totalAmount)}</strong>.
            </p>
            <p className="text-eco-800 bg-eco-50 p-3 rounded-xl border border-eco-200">
              📞 <strong>Ujwala Eco Products</strong> will contact you on <strong>{submittedOrder.customerPhone}</strong> or <strong>{submittedOrder.customerEmail}</strong> to confirm product availability, shipping timeline, and finalize your order.
            </p>
            <p className="text-[11px] text-slate-500">
              ℹ️ No online payment was charged. This is an order request subject to availability confirmation.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link
              href="/shop"
              className="bg-eco-700 hover:bg-eco-800 text-white text-xs font-bold px-6 py-3 rounded-full shadow-md transition-colors text-center"
            >
              Continue Shopping
            </Link>
            {user && (
              <Link
                href="/account/orders"
                className="bg-canvas-100 hover:bg-canvas-200 text-slate-800 text-xs font-bold px-6 py-3 rounded-full transition-colors text-center"
              >
                View My Requests
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 2. Empty Cart Screen
  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center space-y-4 max-w-md">
        <div className="w-16 h-16 bg-eco-50 rounded-full flex items-center justify-center mx-auto text-eco-700">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="font-serif font-bold text-xl text-slate-800">Your Cart is Empty</h2>
        <p className="text-xs text-slate-500">Please add items to your cart before placing an order request.</p>
        <button
          onClick={() => router.push('/shop')}
          className="bg-eco-700 hover:bg-eco-800 text-white text-xs font-bold px-6 py-2.5 rounded-full transition-colors"
        >
          Browse Catalog
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl space-y-8">
      {/* Header */}
      <div className="border-b border-eco-100 pb-4">
        <h1 className="font-serif font-bold text-2xl md:text-3xl text-slate-900 flex items-center gap-2">
          <FileText className="w-6 h-6 text-eco-700" /> Place Order Request
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Complete your customer and delivery details below to review your receipt before submitting.
        </p>
      </div>

      {submissionError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {submissionError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Form */}
        <form onSubmit={handleReviewOrder} className="lg:col-span-2 space-y-6">
          {/* Section 1: Customer Info */}
          <div className="bg-white p-6 rounded-3xl border border-eco-100 shadow-xs space-y-4">
            <h2 className="font-serif font-bold text-base text-slate-900 border-b border-eco-100 pb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-eco-100 text-eco-800 text-xs flex items-center justify-center font-bold">1</span>
              Customer Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Harsha Vardhan"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (formErrors.fullName) setFormErrors((prev) => ({ ...prev, fullName: '' }));
                  }}
                  className={`w-full bg-canvas-50 border rounded-xl p-3 text-xs focus:outline-none focus:bg-white transition-colors ${
                    formErrors.fullName ? 'border-rose-400 bg-rose-50/30' : 'border-eco-200 focus:border-eco-600'
                  }`}
                />
                {formErrors.fullName && (
                  <p className="text-[11px] text-rose-600 mt-1 font-medium">{formErrors.fullName}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  placeholder="customer@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (formErrors.email) setFormErrors((prev) => ({ ...prev, email: '' }));
                  }}
                  className={`w-full bg-canvas-50 border rounded-xl p-3 text-xs focus:outline-none focus:bg-white transition-colors ${
                    formErrors.email ? 'border-rose-400 bg-rose-50/30' : 'border-eco-200 focus:border-eco-600'
                  }`}
                />
                {formErrors.email && (
                  <p className="text-[11px] text-rose-600 mt-1 font-medium">{formErrors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  placeholder="e.g. +91 9876543210"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (formErrors.phone) setFormErrors((prev) => ({ ...prev, phone: '' }));
                  }}
                  className={`w-full bg-canvas-50 border rounded-xl p-3 text-xs focus:outline-none focus:bg-white transition-colors ${
                    formErrors.phone ? 'border-rose-400 bg-rose-50/30' : 'border-eco-200 focus:border-eco-600'
                  }`}
                />
                {formErrors.phone && (
                  <p className="text-[11px] text-rose-600 mt-1 font-medium">{formErrors.phone}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Delivery Address */}
          <div className="bg-white p-6 rounded-3xl border border-eco-100 shadow-xs space-y-4">
            <h2 className="font-serif font-bold text-base text-slate-900 border-b border-eco-100 pb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-eco-100 text-eco-800 text-xs flex items-center justify-center font-bold">2</span>
              Delivery Address
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Address Line 1 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Flat/House No., Building, Street Name"
                  value={addressLine1}
                  onChange={(e) => {
                    setAddressLine1(e.target.value);
                    if (formErrors.addressLine1) setFormErrors((prev) => ({ ...prev, addressLine1: '' }));
                  }}
                  className={`w-full bg-canvas-50 border rounded-xl p-3 text-xs focus:outline-none focus:bg-white transition-colors ${
                    formErrors.addressLine1 ? 'border-rose-400 bg-rose-50/30' : 'border-eco-200 focus:border-eco-600'
                  }`}
                />
                {formErrors.addressLine1 && (
                  <p className="text-[11px] text-rose-600 mt-1 font-medium">{formErrors.addressLine1}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Address Line 2 <span className="text-slate-400 font-normal">(Optional landmark or area)</span>
                </label>
                <input
                  type="text"
                  placeholder="Near landmark, sector, or apartment name"
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                  className="w-full bg-canvas-50 border border-eco-200 rounded-xl p-3 text-xs focus:outline-none focus:bg-white focus:border-eco-600 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    City <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => {
                      setCity(e.target.value);
                      if (formErrors.city) setFormErrors((prev) => ({ ...prev, city: '' }));
                    }}
                    className={`w-full bg-canvas-50 border rounded-xl p-3 text-xs focus:outline-none focus:bg-white transition-colors ${
                      formErrors.city ? 'border-rose-400 bg-rose-50/30' : 'border-eco-200 focus:border-eco-600'
                    }`}
                  />
                  {formErrors.city && (
                    <p className="text-[11px] text-rose-600 mt-1 font-medium">{formErrors.city}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    State <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => {
                      setState(e.target.value);
                      if (formErrors.state) setFormErrors((prev) => ({ ...prev, state: '' }));
                    }}
                    className={`w-full bg-canvas-50 border rounded-xl p-3 text-xs focus:outline-none focus:bg-white transition-colors ${
                      formErrors.state ? 'border-rose-400 bg-rose-50/30' : 'border-eco-200 focus:border-eco-600'
                    }`}
                  />
                  {formErrors.state && (
                    <p className="text-[11px] text-rose-600 mt-1 font-medium">{formErrors.state}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Postal / PIN Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={postalCode}
                    onChange={(e) => {
                      setPostalCode(e.target.value);
                      if (formErrors.postalCode) setFormErrors((prev) => ({ ...prev, postalCode: '' }));
                    }}
                    className={`w-full bg-canvas-50 border rounded-xl p-3 text-xs focus:outline-none focus:bg-white transition-colors ${
                      formErrors.postalCode ? 'border-rose-400 bg-rose-50/30' : 'border-eco-200 focus:border-eco-600'
                    }`}
                  />
                  {formErrors.postalCode && (
                    <p className="text-[11px] text-rose-600 mt-1 font-medium">{formErrors.postalCode}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Notes & Customization */}
          <div className="bg-white p-6 rounded-3xl border border-eco-100 shadow-xs space-y-4">
            <h2 className="font-serif font-bold text-base text-slate-900 border-b border-eco-100 pb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-eco-100 text-eco-800 text-xs flex items-center justify-center font-bold">3</span>
              Additional Instructions & Customization
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ✏️ Custom Printing or Personalization Notes <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Wedding couple names, event dates, logo requirements, color preferences..."
                  value={customizationNotes}
                  onChange={(e) => setCustomizationNotes(e.target.value)}
                  className="w-full bg-canvas-50 border border-eco-200 rounded-xl p-3 text-xs focus:outline-none focus:bg-white focus:border-eco-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  📦 Delivery Instructions or Special Notes <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Deliver between 3 PM and 7 PM, call before arrival..."
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  className="w-full bg-canvas-50 border border-eco-200 rounded-xl p-3 text-xs focus:outline-none focus:bg-white focus:border-eco-600 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Action: Review Order Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoadingPreview}
              className="w-full bg-eco-700 hover:bg-eco-800 text-white font-bold text-sm py-4 px-6 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-99 disabled:opacity-75 cursor-pointer"
            >
              {isLoadingPreview ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Calculating Order Preview...
                </>
              ) : (
                <>
                  Review Order <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
            <p className="text-center text-[11px] text-slate-500 mt-2">
              You will preview the itemized receipt before confirming your request.
            </p>
          </div>
        </form>

        {/* Right 1 Col: Summary Sidebar */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-eco-100 shadow-xs space-y-4">
            <h3 className="font-serif font-bold text-base text-slate-900 border-b border-eco-100 pb-3">
              Selected Items ({cartItems.reduce((acc, i) => acc + i.quantity, 0)})
            </h3>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {cartItems.map((item) => (
                <div key={item.id} className="flex gap-3 py-2 border-b border-eco-50 last:border-0">
                  <img
                    src={item.image ?? '/placeholder-product.svg'}
                    alt={item.productName}
                    className="w-12 h-12 object-cover rounded-lg border border-eco-100 shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder-product.svg';
                      (e.target as HTMLImageElement).onerror = null;
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{item.productName}</p>
                    <p className="text-[10px] text-slate-500">Qty: {item.quantity} × {formatPrice(item.price)}</p>
                    {item.customizationNotes && (
                      <p className="text-[9px] text-jute-800 bg-jute-50 p-0.5 rounded mt-0.5 truncate">
                        ✏️ {item.customizationNotes}
                      </p>
                    )}
                  </div>
                  <span className="text-xs font-bold text-eco-900">{formatPrice(item.itemTotal)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-eco-100 pt-3 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal (estimated)</span>
                <span className="font-bold text-slate-800">
                  {formatPrice(cartItems.reduce((sum, i) => sum + i.itemTotal, 0))}
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Estimated Delivery</span>
                <span className="font-bold text-slate-800">
                  {cartItems.reduce((sum, i) => sum + i.itemTotal, 0) >= 1000 ? 'FREE' : '₹50.00'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-eco-50 p-4 rounded-2xl border border-eco-200 text-xs text-eco-900 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-eco-950">
              <ShieldCheck className="w-4 h-4 text-eco-700" /> Direct Artisan Ordering
            </div>
            <p className="text-[11px] text-eco-800 leading-relaxed">
              Every bag is hand-stitched by skilled women artisans at Ujwala Eco Products. Our team reviews every order request personally to guarantee superior quality.
            </p>
          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* 4. RECEIPT PREVIEW MODAL */}
      {/* ========================================== */}
      {showReceiptModal && previewData && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-eco-100 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="bg-eco-800 text-white p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-eco-200 block">
                  Ujwala Eco Products
                </span>
                <h3 className="font-serif font-bold text-lg">Order Request Preview</h3>
              </div>
              <button
                onClick={() => setShowReceiptModal(false)}
                disabled={isSubmittingOrder}
                className="text-eco-200 hover:text-white p-1.5 rounded-full hover:bg-eco-700 transition-colors"
                aria-label="Close preview"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Receipt Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* Notice Banner */}
              <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl text-amber-900 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-0.5 text-[11px]">
                  <p className="font-bold">Please review your order details before submitting.</p>
                  <p>
                    No payment is charged now. Submitting this request will notify Ujwala Eco Products to contact you to confirm final stock, customization, and delivery.
                  </p>
                </div>
              </div>

              {/* Customer & Address Details */}
              <div className="bg-canvas-50 p-4 rounded-2xl border border-eco-100 space-y-3">
                <h4 className="font-serif font-bold text-xs text-slate-900 border-b border-eco-100 pb-1.5">
                  Customer & Delivery Information
                </h4>
                <div className="grid grid-cols-2 gap-3 text-[11px]">
                  <div>
                    <span className="text-slate-400 block font-medium">Name</span>
                    <span className="font-bold text-slate-800">{fullName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Email</span>
                    <span className="font-bold text-slate-800">{email}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Phone</span>
                    <span className="font-bold text-slate-800">{phone}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Country</span>
                    <span className="font-bold text-slate-800">{country}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block font-medium">Delivery Address</span>
                    <span className="font-bold text-slate-800">
                      {addressLine1}{addressLine2 ? `, ${addressLine2}` : ''}, {city}, {state} — {postalCode}
                    </span>
                  </div>
                  {customizationNotes && (
                    <div className="col-span-2 bg-jute-50 p-2 rounded-lg border border-jute-200">
                      <span className="text-jute-900 font-bold block">Custom Printing / Personalization:</span>
                      <span className="text-jute-800">{customizationNotes}</span>
                    </div>
                  )}
                  {customerNotes && (
                    <div className="col-span-2 bg-canvas-100 p-2 rounded-lg">
                      <span className="text-slate-700 font-bold block">Special Instructions:</span>
                      <span className="text-slate-600">{customerNotes}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Itemized Products Table */}
              <div>
                <h4 className="font-serif font-bold text-xs text-slate-900 mb-2">Requested Products</h4>
                <div className="border border-eco-100 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-canvas-100 text-slate-600 font-medium border-b border-eco-100">
                      <tr>
                        <th className="py-2.5 px-3">Product</th>
                        <th className="py-2.5 px-2 text-center">Qty</th>
                        <th className="py-2.5 px-3 text-right">Price</th>
                        <th className="py-2.5 px-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-eco-50">
                      {previewData.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-canvas-50/50">
                          <td className="py-2.5 px-3">
                            <strong className="text-slate-900 block">{item.name}</strong>
                            <span className="text-[10px] text-slate-400 font-mono">SKU: {item.sku}</span>
                          </td>
                          <td className="py-2.5 px-2 text-center font-bold text-slate-800">{item.quantity}</td>
                          <td className="py-2.5 px-3 text-right text-slate-600">{formatPrice(item.unitPrice)}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-eco-900">{formatPrice(item.lineTotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals Breakdown */}
              <div className="bg-canvas-50 p-4 rounded-2xl border border-eco-100 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-bold text-slate-800">{formatPrice(previewData.subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Delivery Charges</span>
                  <span className="font-bold text-slate-800">
                    {previewData.deliveryCharge > 0 ? formatPrice(previewData.deliveryCharge) : 'FREE'}
                  </span>
                </div>
                <div className="border-t border-eco-200 pt-2 flex justify-between text-sm font-bold text-eco-900">
                  <span>Total Estimated Amount</span>
                  <span className="font-serif text-base text-eco-900">{formatPrice(previewData.grandTotal)}</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-canvas-50 border-t border-eco-100 flex flex-col-reverse sm:flex-row justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowReceiptModal(false)}
                disabled={isSubmittingOrder}
                className="px-5 py-2.5 text-slate-700 hover:bg-canvas-200 rounded-xl text-xs font-bold transition-colors text-center cursor-pointer"
              >
                Back / Edit Details
              </button>
              <button
                type="button"
                onClick={handleSubmitOrder}
                disabled={isSubmittingOrder}
                className="bg-eco-700 hover:bg-eco-800 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-75 cursor-pointer"
              >
                {isSubmittingOrder ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting Order...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" /> Submit Order
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
