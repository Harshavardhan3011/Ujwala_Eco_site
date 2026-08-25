'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { ShieldCheck, Truck, CreditCard, CheckCircle2, ArrowRight, Lock } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

export default function CheckoutPage() {
  const router = useRouter();
  const { cartItems, subtotal, shippingFee, totalAmount, clearCart } = useCart();
  const { user } = useAuth();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Address Form State
  const [address, setAddress] = useState({
    shippingName: user?.name || '',
    shippingPhone: user?.phone || '',
    shippingAddress: '',
    landmark: '',
    shippingCity: 'Visakhapatnam',
    shippingState: 'Andhra Pradesh',
    shippingPostalCode: '530049',
    paymentMethod: 'RAZORPAY',
    customizationNotes: '',
  });

  useEffect(() => {
    if (user) {
      setAddress((prev) => ({
        ...prev,
        shippingName: prev.shippingName || user.name,
        shippingPhone: prev.shippingPhone || user.phone || '',
      }));
    }
  }, [user]);

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center space-y-4 max-w-md">
        <h2 className="font-serif font-bold text-xl text-slate-800">Your Cart is Empty</h2>
        <p className="text-xs text-slate-500">Please add items to your cart before proceeding to checkout.</p>
        <button
          onClick={() => router.push('/shop')}
          className="bg-eco-700 text-white text-xs font-bold px-6 py-2.5 rounded-full"
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
      // 1. Create order on backend
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(address),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to place order');
      }

      const { order, razorpayOrder } = data;

      // 2. Handle Razorpay Checkout
      if (address.paymentMethod === 'RAZORPAY' && razorpayOrder) {
        // Handle Razorpay flow or simulated completion
        if (typeof window !== 'undefined' && (window as any).Razorpay) {
          const options = {
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_ujwala_key',
            amount: razorpayOrder.amount,
            currency: 'INR',
            name: 'Ujwala Eco Products',
            description: `Order ${order.orderNumber}`,
            order_id: razorpayOrder.id,
            handler: async function (response: any) {
              await verifyPayment(order.id, response);
            },
            prefill: {
              name: address.shippingName,
              email: user.email,
              contact: address.shippingPhone,
            },
            theme: { color: '#1b4332' },
          };
          const rzp = new (window as any).Razorpay(options);
          rzp.open();
        } else {
          // Simulation fallback for sandbox development
          await verifyPayment(order.id, {
            razorpay_order_id: razorpayOrder.id,
            razorpay_payment_id: `pay_sim_${Date.now()}`,
            razorpay_signature: 'simulated_signature',
          });
        }
      } else {
        // COD order
        clearCart();
        router.push(`/account/orders/${order.id}`);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment/order processing failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const verifyPayment = async (orderId: string, paymentResponse: any) => {
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
      if (res.ok) {
        clearCart();
        router.push(`/account/orders/${orderId}`);
      } else {
        setErrorMessage(data.error || 'Payment verification failed');
      }
    } catch (err) {
      setErrorMessage('Payment verification request error');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 max-w-5xl">
      {/* Script Loader for Razorpay Checkout SDK */}
      <script src="https://checkout.razorpay.com/v1/checkout.js" async />

      {/* Checkout Step Progress Bar */}
      <div className="bg-white p-4 rounded-2xl border border-eco-100 shadow-xs flex justify-around text-center text-xs font-bold">
        <div className={`flex items-center gap-2 ${step >= 1 ? 'text-eco-800' : 'text-slate-400'}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-eco-700 text-white' : 'bg-slate-200'}`}>1</span>
          <span>Shipping Address</span>
        </div>
        <div className={`flex items-center gap-2 ${step >= 2 ? 'text-eco-800' : 'text-slate-400'}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-eco-700 text-white' : 'bg-slate-200'}`}>2</span>
          <span>Order Summary</span>
        </div>
        <div className={`flex items-center gap-2 ${step >= 3 ? 'text-eco-800' : 'text-slate-400'}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-eco-700 text-white' : 'bg-slate-200'}`}>3</span>
          <span>Razorpay Payment</span>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl text-rose-800 text-xs font-bold">
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Step Form */}
        <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-3xl border border-eco-100 shadow-sm space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-serif font-bold text-lg text-slate-900 border-b border-eco-100 pb-3">
                Step 1: Enter Shipping Address & Contact Details
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
                    className="w-full bg-canvas-100 border border-eco-200 rounded-xl p-3 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="Mobile Number"
                    value={address.shippingPhone}
                    onChange={(e) => setAddress({ ...address, shippingPhone: e.target.value })}
                    className="w-full bg-canvas-100 border border-eco-200 rounded-xl p-3 text-xs focus:outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1">Street Address / House No. *</label>
                  <input
                    type="text"
                    required
                    placeholder="Door No, Street name, Area"
                    value={address.shippingAddress}
                    onChange={(e) => setAddress({ ...address, shippingAddress: e.target.value })}
                    className="w-full bg-canvas-100 border border-eco-200 rounded-xl p-3 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={address.shippingCity}
                    onChange={(e) => setAddress({ ...address, shippingCity: e.target.value })}
                    className="w-full bg-canvas-100 border border-eco-200 rounded-xl p-3 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Pincode *</label>
                  <input
                    type="text"
                    required
                    value={address.shippingPostalCode}
                    onChange={(e) => setAddress({ ...address, shippingPostalCode: e.target.value })}
                    className="w-full bg-canvas-100 border border-eco-200 rounded-xl p-3 text-xs focus:outline-none"
                  />
                </div>
              </div>
              <button
                onClick={() => {
                  if (address.shippingName && address.shippingPhone && address.shippingAddress) {
                    setStep(2);
                  } else {
                    setErrorMessage('Please fill in all required address fields');
                  }
                }}
                className="w-full bg-eco-700 hover:bg-eco-800 text-white font-bold text-xs py-3.5 rounded-xl shadow-md transition-colors"
              >
                Continue to Order Summary →
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="font-serif font-bold text-lg text-slate-900 border-b border-eco-100 pb-3">
                Step 2: Review Order Items & Customizations
              </h2>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-xs p-2 bg-canvas-50 rounded-xl border border-eco-50">
                    <div className="flex items-center gap-3">
                      <img src={item.image} alt="" className="w-10 h-10 object-cover rounded-lg" />
                      <div>
                        <p className="font-bold text-slate-800">{item.productName}</p>
                        <p className="text-[11px] text-slate-500">Qty: {item.quantity} x {formatPrice(item.price)}</p>
                      </div>
                    </div>
                    <span className="font-bold text-eco-800">{formatPrice(item.itemTotal)}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep(1)}
                  className="w-1/3 border border-eco-300 text-slate-700 font-bold text-xs py-3 rounded-xl"
                >
                  ← Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="w-2/3 bg-eco-700 hover:bg-eco-800 text-white font-bold text-xs py-3 rounded-xl shadow-md"
                >
                  Proceed to Payment Selection →
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <form onSubmit={handlePlaceOrder} className="space-y-4">
              <h2 className="font-serif font-bold text-lg text-slate-900 border-b border-eco-100 pb-3">
                Step 3: Select Payment Method
              </h2>
              <div className="space-y-3">
                <label className={`block p-4 rounded-2xl border cursor-pointer transition-all ${address.paymentMethod === 'RAZORPAY' ? 'bg-eco-50 border-eco-600 font-bold text-eco-900' : 'bg-white border-eco-200'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="payment"
                        checked={address.paymentMethod === 'RAZORPAY'}
                        onChange={() => setAddress({ ...address, paymentMethod: 'RAZORPAY' })}
                      />
                      <div>
                        <p className="text-xs font-bold">Online Payment via Razorpay</p>
                        <p className="text-[11px] text-slate-500 font-normal">UPI, Credit/Debit Cards, NetBanking, GPay, PhonePe</p>
                      </div>
                    </div>
                    <Lock className="w-4 h-4 text-emerald-600" />
                  </div>
                </label>

                <label className={`block p-4 rounded-2xl border cursor-pointer transition-all ${address.paymentMethod === 'COD' ? 'bg-eco-50 border-eco-600 font-bold text-eco-900' : 'bg-white border-eco-200'}`}>
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payment"
                      checked={address.paymentMethod === 'COD'}
                      onChange={() => setAddress({ ...address, paymentMethod: 'COD' })}
                    />
                    <div>
                      <p className="text-xs font-bold">Cash on Delivery (COD)</p>
                      <p className="text-[11px] text-slate-500 font-normal">Pay cash upon doorstep delivery in Visakhapatnam</p>
                    </div>
                  </div>
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-1/3 border border-eco-300 text-slate-700 font-bold text-xs py-3.5 rounded-xl"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-2/3 bg-jute-400 hover:bg-jute-500 text-eco-950 font-extrabold text-xs py-3.5 rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2"
                >
                  {isSubmitting ? 'Processing Order...' : `Pay & Confirm Order (${formatPrice(totalAmount)})`}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Sidebar Summary */}
        <div className="bg-white p-6 rounded-3xl border border-eco-100 shadow-sm space-y-4 h-fit">
          <h3 className="font-serif font-bold text-base text-slate-900 border-b border-eco-100 pb-3">
            Summary
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span className="font-bold text-slate-900">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Delivery</span>
              <span className="font-bold text-slate-900">
                {shippingFee === 0 ? <span className="text-emerald-700">FREE</span> : formatPrice(shippingFee)}
              </span>
            </div>
            <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-eco-100">
              <span>Total</span>
              <span className="text-eco-900 font-serif text-lg">{formatPrice(totalAmount)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
