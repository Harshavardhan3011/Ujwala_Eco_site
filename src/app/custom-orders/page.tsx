'use client';

import React, { useState } from 'react';
import { Sparkles, CheckCircle2, MessageCircle, Phone, FileUp, Send } from 'lucide-react';
import { BUSINESS_PHONE, BUSINESS_TEL, WHATSAPP_LINK } from '@/lib/constants';

export default function CustomOrdersPage() {
  const [formData, setFormData] = useState({
    customerName: '',
    email: '',
    phone: '',
    productType: 'Customized Jute Gift Bags',
    quantity: '50',
    requiredDimensions: '10" W x 12" H x 4" D',
    colorPreference: 'Natural Jute with Maroon Border',
    customText: '',
    eventType: 'Housewarming Ceremony',
    requiredDeliveryDate: '',
    specialInstructions: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const res = await fetch('/api/custom-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMessage(data.message || 'Custom order request received successfully!');
        setFormData({
          customerName: '',
          email: '',
          phone: '',
          productType: 'Customized Jute Gift Bags',
          quantity: '50',
          requiredDimensions: '',
          colorPreference: '',
          customText: '',
          eventType: 'Housewarming Ceremony',
          requiredDeliveryDate: '',
          specialInstructions: '',
        });
      } else {
        setErrorMessage(data.error || 'Failed to submit request');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-10 space-y-12 max-w-4xl">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-jute-600 via-jute-500 to-jute-700 text-white p-8 md:p-12 rounded-3xl shadow-xl space-y-4 text-center">
        <div className="inline-flex items-center gap-2 bg-white/20 px-3.5 py-1 rounded-full text-xs font-bold text-jute-100">
          <Sparkles className="w-4 h-4 text-jute-200 animate-pulse" />
          Direct Factory Tailor-Made Orders
        </div>
        <h1 className="font-serif font-extrabold text-3xl md:text-5xl text-white">
          Customized Jute Bag Printing
        </h1>
        <p className="text-xs md:text-sm text-jute-100 max-w-2xl mx-auto leading-relaxed">
          Order tailor-made jute bags customized with your wedding couple names, housewarming dates, corporate logos, custom handles, and specific size dimensions!
        </p>
      </div>

      {/* Main Request Form */}
      <div className="bg-white rounded-3xl p-6 md:p-10 border border-eco-100 shadow-sm space-y-6">
        {successMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-sm">{successMessage}</p>
              <p className="text-[11px] font-normal text-emerald-700 mt-0.5">
                Our Visakhapatnam production team will review your specifications and call you back shortly with exact quotes.
              </p>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl text-rose-800 text-xs font-bold">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <h2 className="font-serif font-bold text-lg text-slate-900 border-b border-eco-100 pb-3">
            Enter Your Customization Requirements
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Your Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Srinivas Rao"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                className="w-full bg-canvas-100 border border-eco-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-1 focus:ring-eco-600"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Phone Number (WhatsApp) *</label>
              <input
                type="tel"
                required
                placeholder="e.g. 8247671857"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-canvas-100 border border-eco-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-1 focus:ring-eco-600"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Email Address *</label>
              <input
                type="email"
                required
                placeholder="e.g. srinivas@gmail.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-canvas-100 border border-eco-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-1 focus:ring-eco-600"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Event / Function Type</label>
              <select
                value={formData.eventType}
                onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                className="w-full bg-canvas-100 border border-eco-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-1 focus:ring-eco-600"
              >
                <option value="Housewarming Ceremony">Housewarming Ceremony (Gruhapravesam)</option>
                <option value="Wedding / Engagement">Wedding / Engagement (Pelli/Niscitartham)</option>
                <option value="Birthday Celebration">Birthday Celebration</option>
                <option value="Shop / Corporate Bulk Supply">Shop / Corporate Bulk Supply</option>
                <option value="Pooja / Festival Distribution">Pooja / Festival Distribution</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Product Type</label>
              <input
                type="text"
                required
                placeholder="e.g. Custom Return Gift Bags"
                value={formData.productType}
                onChange={(e) => setFormData({ ...formData, productType: e.target.value })}
                className="w-full bg-canvas-100 border border-eco-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-1 focus:ring-eco-600"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Required Quantity (Pcs) *</label>
              <input
                type="number"
                min="10"
                required
                placeholder="e.g. 100"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full bg-canvas-100 border border-eco-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-1 focus:ring-eco-600"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Dimensions (W x H x D)</label>
              <input
                type="text"
                placeholder="e.g. 10 inches x 12 inches x 4 inches"
                value={formData.requiredDimensions}
                onChange={(e) => setFormData({ ...formData, requiredDimensions: e.target.value })}
                className="w-full bg-canvas-100 border border-eco-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-1 focus:ring-eco-600"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Required Delivery Date</label>
              <input
                type="date"
                value={formData.requiredDeliveryDate}
                onChange={(e) => setFormData({ ...formData, requiredDeliveryDate: e.target.value })}
                className="w-full bg-canvas-100 border border-eco-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-1 focus:ring-eco-600"
              />
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Custom Text / Matter to Print</label>
              <input
                type="text"
                placeholder="e.g. Srinivas & Lakshmi Gruhapravesam - 15th Oct 2026"
                value={formData.customText}
                onChange={(e) => setFormData({ ...formData, customText: e.target.value })}
                className="w-full bg-canvas-100 border border-eco-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-1 focus:ring-eco-600"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Additional Requirements / Notes</label>
              <textarea
                rows={3}
                placeholder="Specify preferred handle type (rope, cane, cotton tape), zipper requirement, foil color..."
                value={formData.specialInstructions}
                onChange={(e) => setFormData({ ...formData, specialInstructions: e.target.value })}
                className="w-full bg-canvas-100 border border-eco-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-1 focus:ring-eco-600"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-eco-700 hover:bg-eco-800 text-white font-bold text-xs py-3.5 px-6 rounded-2xl shadow-md transition-colors flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            {isSubmitting ? 'Submitting Request...' : 'Submit Custom Order Request'}
          </button>
        </form>
      </div>

      {/* Direct Contact Options */}
      <div className="bg-canvas-100 p-6 rounded-3xl border border-eco-200 text-center space-y-3">
        <h3 className="font-serif font-bold text-sm text-slate-900">Need Immediate Custom Quotes?</h3>
        <p className="text-xs text-slate-600">
          Contact our production unit directly via Phone or WhatsApp for urgent order discussions.
        </p>
        <div className="flex flex-wrap justify-center gap-4 pt-2">
          <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-5 py-2.5 rounded-full transition-colors flex items-center gap-1.5"
          >
            <MessageCircle className="w-4 h-4" /> WhatsApp ({BUSINESS_PHONE})
          </a>
          <a
            href={BUSINESS_TEL}
            className="bg-eco-800 hover:bg-eco-900 text-white text-xs font-bold px-5 py-2.5 rounded-full transition-colors flex items-center gap-1.5"
          >
            <Phone className="w-4 h-4" /> Call {BUSINESS_PHONE}
          </a>
        </div>
      </div>
    </div>
  );
}
