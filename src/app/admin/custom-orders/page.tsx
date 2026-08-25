'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Phone, Mail, CheckCircle2, MessageCircle } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function AdminCustomOrdersPage() {
  const [customOrders, setCustomOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCustomOrders = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/custom-orders');
      const data = await res.json();
      if (data.customOrders) setCustomOrders(data.customOrders);
    } catch (err) {
      console.error('Fetch custom orders error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomOrders();
  }, []);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await fetch(`/api/custom-orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      fetchCustomOrders();
    } catch (err) {
      console.error('Update custom order status error:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-eco-100 shadow-xs">
        <h2 className="font-serif font-bold text-xl text-slate-900">Custom Order Requests</h2>
        <p className="text-xs text-slate-500">Manage inquiries for wedding return gifts, bulk shop orders & tailor-made bags</p>
      </div>

      <div className="space-y-4">
        {customOrders.map((co) => (
          <div key={co.id} className="bg-white p-6 rounded-2xl border border-eco-100 shadow-xs space-y-4">
            <div className="flex flex-wrap justify-between items-center gap-2 border-b border-eco-50 pb-3 text-xs">
              <div>
                <span className="font-bold text-slate-900 text-sm">{co.customerName}</span>
                <span className="text-slate-500 block">
                  Phone: {co.phone} • Email: {co.email}
                </span>
              </div>
              <div className="text-right">
                <span className="font-bold text-jute-700 text-sm">{co.quantity} Pcs</span>
                <span className="text-[11px] text-slate-400 block">{formatDate(co.createdAt)}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-canvas-50 p-4 rounded-xl border border-eco-50">
              <div>
                <span className="text-slate-400 block font-medium">Product Type</span>
                <span className="font-bold text-slate-900">{co.productType}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Event Type</span>
                <span className="font-bold text-slate-900">{co.eventType || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Required Dimensions</span>
                <span className="font-bold text-slate-900">{co.requiredDimensions || 'Standard'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Required Delivery Date</span>
                <span className="font-bold text-slate-900">{co.requiredDeliveryDate || 'Flexible'}</span>
              </div>
            </div>

            {co.customText && (
              <div className="p-3 bg-jute-50 border border-jute-200 rounded-xl text-xs">
                <span className="font-bold text-jute-900 block">✏️ Custom Text / Matter:</span>
                <p className="text-slate-800">{co.customText}</p>
              </div>
            )}

            {co.specialInstructions && (
              <div className="text-xs text-slate-600">
                <span className="font-bold text-slate-800">Special Instructions: </span>
                {co.specialInstructions}
              </div>
            )}

            <div className="flex flex-wrap justify-between items-center gap-4 pt-3 border-t border-eco-50 text-xs">
              <a
                href={`https://wa.me/91${co.phone.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl flex items-center gap-1.5"
              >
                <MessageCircle className="w-4 h-4" /> Reply via WhatsApp
              </a>

              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-600">Status:</span>
                <select
                  value={co.status}
                  onChange={(e) => handleUpdateStatus(co.id, e.target.value)}
                  className="bg-canvas-100 border border-eco-200 rounded-xl p-2 font-bold text-eco-900"
                >
                  <option value="NEW">NEW</option>
                  <option value="CONTACTED">CONTACTED</option>
                  <option value="QUOTATION_SENT">QUOTATION SENT</option>
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="IN_PRODUCTION">IN PRODUCTION</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
