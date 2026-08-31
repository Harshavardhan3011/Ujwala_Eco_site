'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import {
  ShieldCheck, Truck, CreditCard, Banknote, CheckCircle2,
  ArrowRight, Lock, AlertCircle, Loader2, Sparkles,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';

export default function CheckoutPage() {
  const router = useRouter();
  const { cartItems, subtotal, shippingFee, totalAmount, clearCart } = useCart();
  const { user } = useAuth();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const isOnlinePaymentAvailable = Boolean(process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID && process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID.trim() !== '');

  // Address & Order Form State
  const [address, setAddress] = useState({
    shippingName: user?.name || '',
    shippingPhone: user?.phone || '',
    shippingAddress: '',
    landmark: '',
    shippingCity: 'Visakhapatnam',
    shippingState: 'Andhra Pradesh',
    shippingPostalCode: '530049',
    paymentMethod: 'COD', // Default to COD
    customizationNotes: '',
  });

  useEffect(() => {
    if (user) {
      setAddress((prev) => ({
        ...prev,
        shippingName: prev.shippingName || user.name || '',
        shippingPhone: prev.shippingPhone || user.phone || '',
      }));
    }
  }, [user]);

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center space-y-4 max-w-md">
        <h2 className="font-serif font-bold text-xl text-slate-800">Your Cart is Empty</h2>
        <p className="text-xs text-slate-500">Please add eco-friendly items to your cart before proceeding to checkout.</p>
        <button
          onClick={() => router.push('/shop')}
          className="bg-eco-700 hover:bg-eco-800 text-white text-xs font-bold px-6 py-2.5 rounded-full transition-colors"
        >
          Browse Shop
        </button>
      </div>
    );
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push('/auth/login?redirect=/checkout');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      // 1. Create order on backend (server calculates totals & validates stock)
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(address),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to place order.');
      }

      const { order, razorpayOrder, isCod } = data;

      // 2. If COD, order is confirmed immediately
      if (isCod || address.paymentMethod === 'COD') {
        clearCart();
        router.push(`/order-success/${order.order_number || order.orderNumber || order.id}`);
        return;
      }

      // 3. If Online Payment (Razorpay)
      if (address.paymentMethod === 'RAZORPAY' && razorpayOrder) {
        if (typeof window !== 'undefined' && (window as any).Razorpay) {
          const razorpayKey = razorpayOrder.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
          const options = {
            key: razorpayKey,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency || 'INR',
            name: 'Ujwala Eco Products',
            description: `Order ${order.order_number || order.orderNumber}`,
            order_id: razorpayOrder.id,
            handler: async function (paymentResponse: any) {
              await verifyPayment(order.id, order.order_number || order.orderNumber, paymentResponse);
            },
            modal: {
              ondismiss: function () {
                setIsSubmitting(false);
                setErrorMessage('Payment window was closed. Your order is pending payment. You may retry or choose Cash on Delivery.');
              },
            },
            prefill: {
              name: address.shippingName,
              email: user.email,
              contact: address.shippingPhone,
            },
            theme: { color: '#1b4332' },
          };

          const rzp = new (window as any).Razorpay(options);
          rzp.on('payment.failed', function (response: any) {
            setIsSubmitting(false);
            setErrorMessage(`Payment failed: ${response.error?.description || 'Transaction could not be completed.'}`);
          });
          rzp.open();
        } else {
          throw new Error('Razorpay payment gateway script could not be loaded. Please choose Cash on Delivery.');
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment or order processing failed. Please try again.');
      setIsSubmitting(false);
    }
  };

  const verifyPayment = async (orderId: string, orderNumber: string, paymentResponse: any) => {
    try {
      const res = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          ...paymentResponse,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        clearCart();
        router.push(`/order-success/${orderNumber || orderId}`);
      } else {
        setErrorMessage(data.error || 'Payment verification failed. If your account was debited, please contact support.');
        setIsSubmitting(false);
      }
    } catch (err) {
      setErrorMessage('Network error during payment verification. Please check your orders page.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 max-w-5xl">
      {/* Razorpay Standard Checkout Script */}
      {isOnlinePaymentAvailable && (
        <script src="https://checkout.razorpay.com/v1/checkout.js" async />
      )}

      {/* Checkout Step Progress Bar */}
      <div className="bg-white p-4 rounded-2xl border border-eco-100 shadow-xs flex justify-around text-center text-xs font-bold">
        <div className={`flex items-center gap-2 ${step >= 1 ? 'text-eco-800' : 'text-slate-400'}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-eco-700 text-white' : 'bg-slate-200'}`}>1</span>
          <span>Shipping Address</span>
        </div>
        <div className={`flex items-center gap-2 ${step >= 2 ? 'text-eco-800' : 'text-slate-400'}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-eco-700 text-white' : 'bg-slate-200'}`}>2</span>
          <span>Order Review</span>
        </div>
        <div className={`flex items-center gap-2 ${step >= 3 ? 'text-eco-800' : 'text-slate-400'}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-eco-700 text-white' : 'bg-slate-200'}`}>3</span>
          <span>Payment & Confirm</span>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl text-rose-800 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Step Form */}
        <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-3xl border border-eco-100 shadow-sm space-y-6">
          {/* Step 1: Shipping Address */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-serif font-bold text-lg text-slate-900 border-b border-eco-100 pb-3">
                Step 1: Shipping & Delivery Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Recipient Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Full Name"
                    value={address.shippingName}
                    onChange={(e) => setAddress({ ...address, shippingName: e.target.value })}
                    className="w-full bg-canvas-50 border border-eco-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-eco-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="10-digit mobile number"
                    value={address.shippingPhone}
                    onChange={(e) => setAddress({ ...address, shippingPhone: e.target.value })}
                    className="w-full bg-canvas-50 border border-eco-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-eco-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1">Street Address / House No. *</label>
                  <input
                    type="text"
                    required
                    placeholder="Door No, Building, Street, Area"
                    value={address.shippingAddress}
                    onChange={(e) => setAddress({ ...address, shippingAddress: e.target.value })}
                    className="w-full bg-canvas-50 border border-eco-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-eco-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={address.shippingCity}
                    onChange={(e) => setAddress({ ...address, shippingCity: e.target.value })}
                    className="w-full bg-canvas-50 border border-eco-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-eco-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">State</label>
                  <input
                    type="text"
                    required
                    value={address.shippingState}
                    onChange={(e) => setAddress({ ...address, shippingState: e.target.value })}
                    className="w-full bg-canvas-50 border border-eco-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-eco-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Postal Code (PIN) *</label>
                  <input
                    type="text"
                    required
                    value={address.shippingPostalCode}
                    onChange={(e) => setAddress({ ...address, shippingPostalCode: e.target.value })}
                    className="w-full bg-canvas-50 border border-eco-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-eco-500"
                  />
                </div>
              </div>
              <button
                onClick={() => {
                  if (address.shippingName && address.shippingPhone && address.shippingAddress && address.shippingPostalCode) {
                    setStep(2);
                    setErrorMessage('');
                  } else {
                    setErrorMessage('Please fill in all required shipping address fields.');
                  }
                }}
                className="w-full bg-eco-700 hover:bg-eco-800 text-white font-bold text-xs py-3.5 rounded-xl shadow-md transition-colors"
              >
                Continue to Order Review →
              </button>
            </div>
          )}

          {/* Step 2: Order Items Review */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="font-serif font-bold text-lg text-slate-900 border-b border-eco-100 pb-3">
                Step 2: Review Order Items
              </h2>
              <div className="space-y-3 max-h-72 overflow-y-auto divide-y divide-eco-50">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-xs pt-2">
                    <div className="flex items-center gap-3">
                      {item.image ? (
                        <img src={item.image} alt="" className="w-12 h-12 object-cover rounded-lg border border-eco-100" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-canvas-100 border border-eco-100 flex items-center justify-center text-eco-400 font-bold">
                          UJW
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-slate-800">{item.productName}</p>
                        <p className="text-[11px] text-slate-500">Qty: {item.quantity} × {formatPrice(item.price)}</p>
                        {item.customizationNotes && (
                          <p className="text-[10px] text-jute-800 bg-jute-50 px-2 py-0.5 rounded mt-0.5">
                            Custom: {item.customizationNotes}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="font-bold text-eco-800">{formatPrice(item.itemTotal)}</span>
                  </div>
                ))}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Order Notes / Delivery Instructions (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Special instructions, gate code, or packaging notes..."
                  value={address.customizationNotes}
                  onChange={(e) => setAddress({ ...address, customizationNotes: e.target.value })}
                  className="w-full bg-canvas-50 border border-eco-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-eco-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-1/3 border border-eco-200 text-slate-700 font-bold text-xs py-3 rounded-xl hover:bg-canvas-50 transition-colors"
                >
                  ← Edit Address
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="w-2/3 bg-eco-700 hover:bg-eco-800 text-white font-bold text-xs py-3 rounded-xl shadow-md transition-colors"
                >
                  Proceed to Payment Selection →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Payment Method Selection */}
          {step === 3 && (
            <form onSubmit={handlePlaceOrder} className="space-y-5">
              <h2 className="font-serif font-bold text-lg text-slate-900 border-b border-eco-100 pb-3">
                Step 3: Select Payment Method
              </h2>
              <div className="space-y-3">
                {/* Cash on Delivery */}
                <label className={`block p-4 rounded-2xl border cursor-pointer transition-all ${address.paymentMethod === 'COD' ? 'bg-eco-50 border-eco-600 font-bold text-eco-900' : 'bg-white border-eco-200'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="payment"
                        checked={address.paymentMethod === 'COD'}
                        onChange={() => setAddress({ ...address, paymentMethod: 'COD' })}
                      />
                      <div>
                        <p className="text-xs font-bold flex items-center gap-2">
                          <Banknote className="w-4 h-4 text-emerald-700" />
                          Cash on Delivery (COD)
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full">Available</span>
                        </p>
                        <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                          Pay in cash upon doorstep delivery in Visakhapatnam and surrounding areas.
                        </p>
                      </div>
                    </div>
                  </div>
                </label>

                {/* Online Payment via Razorpay */}
                <label className={`block p-4 rounded-2xl border transition-all ${
                  isOnlinePaymentAvailable
                    ? address.paymentMethod === 'RAZORPAY'
                      ? 'bg-eco-50 border-eco-600 font-bold text-eco-900 cursor-pointer'
                      : 'bg-white border-eco-200 cursor-pointer'
                    : 'bg-slate-50 border-slate-200 opacity-85 cursor-not-allowed'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="payment"
                        disabled={!isOnlinePaymentAvailable}
                        checked={address.paymentMethod === 'RAZORPAY'}
                        onChange={() => {
                          if (isOnlinePaymentAvailable) {
                            setAddress({ ...address, paymentMethod: 'RAZORPAY' });
                          }
                        }}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-blue-600" />
                          <p className="text-xs font-bold">Online Payment (UPI, Cards, NetBanking)</p>
                          {isOnlinePaymentAvailable ? (
                            <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded-full">Razorpay</span>
                          ) : (
                            <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded-full">Coming Soon</span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                          {isOnlinePaymentAvailable
                            ? 'Instant & secure checkout via UPI (GPay, PhonePe), Debit/Credit Cards & NetBanking.'
                            : 'Online gateway is currently being configured. Please use Cash on Delivery.'}
                        </p>
                      </div>
                    </div>
                    <Lock className="w-4 h-4 text-slate-400" />
                  </div>
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-1/3 border border-eco-200 text-slate-700 font-bold text-xs py-3.5 rounded-xl hover:bg-canvas-50 transition-colors"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-2/3 bg-eco-700 hover:bg-eco-800 text-white font-extrabold text-xs py-3.5 rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processing Order…</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {address.paymentMethod === 'COD'
                          ? `Place COD Order (${formatPrice(totalAmount)})`
                          : `Pay Online (${formatPrice(totalAmount)})`}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Sidebar Summary */}
        <div className="bg-white p-6 rounded-3xl border border-eco-100 shadow-sm space-y-4 h-fit">
          <h3 className="font-serif font-bold text-base text-slate-900 border-b border-eco-100 pb-3">
            Order Summary
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Items Subtotal</span>
              <span className="font-bold text-slate-900">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Delivery Fee</span>
              <span className="font-bold text-slate-900">
                {shippingFee === 0 ? <span className="text-emerald-700">FREE</span> : formatPrice(shippingFee)}
              </span>
            </div>
            <div className="flex justify-between text-sm font-bold text-slate-900 pt-3 border-t border-eco-100">
              <span>Total Payable</span>
              <span className="text-eco-900 font-serif text-lg">{formatPrice(totalAmount)}</span>
            </div>
          </div>

          <div className="pt-2 text-[11px] text-slate-400 space-y-2 border-t border-eco-50">
            <div className="flex items-center gap-1.5 text-slate-600">
              <ShieldCheck className="w-4 h-4 text-eco-700" />
              <span>100% Secure Transaction & Eco-friendly packing</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600">
              <Truck className="w-4 h-4 text-eco-700" />
              <span>Orders over ₹1,000 qualify for FREE shipping</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
