'use client';

import React, { useState } from 'react';
import { MapPin, Phone, Mail, MessageCircle, Send, CheckCircle2 } from 'lucide-react';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setForm({ name: '', email: '', phone: '', subject: '', message: '' });
  };

  return (
    <div className="container mx-auto px-4 py-10 space-y-12 max-w-5xl">
      <div className="text-center max-w-xl mx-auto space-y-2">
        <span className="text-xs font-bold text-eco-700 uppercase tracking-wider block">Get In Touch</span>
        <h1 className="font-serif font-bold text-3xl text-slate-900">Contact Ujwala Eco Products</h1>
        <p className="text-xs text-slate-500">
          Have questions regarding prices, custom orders, or bulk shop supply? We are here to assist you.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Verified Details Card */}
        <div className="bg-eco-900 text-white p-8 rounded-3xl space-y-6 shadow-xl flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="font-serif font-bold text-xl text-jute-300">Factory & Office Address</h2>
            <div className="space-y-4 text-xs">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-jute-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Ujwala Eco Products</strong><br />
                  D.No. 7-116, Simhadrinagar, Sector-1,<br />
                  Duvvada, Near VSEZ, Visakhapatnam - 530 049,<br />
                  Andhra Pradesh, India
                </span>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-jute-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Contact Phones:</strong><br />
                  +91 9849530536<br />
                  +91 9701347838<br />
                  +91 8374431924
                </span>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-jute-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Email Support:</strong><br />
                  contact@ujwalaeco.com
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-eco-800">
            <a
              href="https://wa.me/919849530536"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-md"
            >
              <MessageCircle className="w-4 h-4" /> Direct WhatsApp Chat (+91 9849530536)
            </a>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white p-8 rounded-3xl border border-eco-100 shadow-sm space-y-4">
          <h2 className="font-serif font-bold text-xl text-slate-900">Send Us a Message</h2>
          {submitted && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Thank you! Your message has been sent. We will respond shortly.
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Your Name *</label>
              <input
                type="text"
                required
                placeholder="Full Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-canvas-100 border border-eco-200 rounded-xl p-2.5 text-xs focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Phone / Email *</label>
              <input
                type="text"
                required
                placeholder="Phone or Email"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full bg-canvas-100 border border-eco-200 rounded-xl p-2.5 text-xs focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Subject</label>
              <input
                type="text"
                placeholder="Bulk Order / Custom Bags / General Inquiry"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="w-full bg-canvas-100 border border-eco-200 rounded-xl p-2.5 text-xs focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Message *</label>
              <textarea
                rows={4}
                required
                placeholder="Your inquiry..."
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full bg-canvas-100 border border-eco-200 rounded-xl p-2.5 text-xs focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-eco-700 hover:bg-eco-800 text-white font-bold text-xs py-3 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <Send className="w-3.5 h-3.5" /> Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
