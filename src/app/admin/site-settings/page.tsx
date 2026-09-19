'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { BUSINESS_PHONE_DISPLAY, WHATSAPP_NUMBER } from '@/lib/constants';

export default function AdminSiteSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({
    site_name: 'Ujwala Eco Products',
    site_tagline: 'Say No to Plastic – Handcrafted Eco-Friendly Jute Bags & Return Gifts',
    phone_primary: BUSINESS_PHONE_DISPLAY,
    phone_secondary: '',
    email: 'ujwalaeco@gmail.com',
    address: 'D.No. 7-116, Simhadrinagar, Sector-1, Duvvada, Near VSEZ, Visakhapatnam - 530 049, Andhra Pradesh',
    whatsapp_number: WHATSAPP_NUMBER,
    announcement_banner: '🌿 Custom Jute Bags Available for Weddings, Housewarmings & Bulk Shop Orders!',
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [storageConfigured, setStorageConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/site-settings');
        const data = await res.json();
        if (data.settings) setSettings((prev) => ({ ...prev, ...data.settings }));
      } catch (err) {
        console.error('Fetch site settings error:', err);
      } finally {
        setIsLoading(false);
      }
    }

    async function checkStorageConfig() {
      try {
        const res = await fetch('/api/admin/storage-status');
        const data = await res.json();
        setStorageConfigured(data.configured === true);
      } catch {
        setStorageConfigured(false);
      }
    }

    loadSettings();
    checkStorageConfig();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/site-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });
      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Save site settings error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="text-xs text-slate-500 font-bold p-8">Loading Site Settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-eco-100 shadow-xs">
        <h2 className="font-serif font-bold text-xl text-slate-900">Website Content & Business Settings</h2>
        <p className="text-xs text-slate-500">Configure client phone numbers, address, WhatsApp number, announcement banner & store metadata</p>
      </div>

      {/* Storage Configuration Status */}
      {storageConfigured === false && (
        <div className="p-4 bg-amber-50 border border-amber-300 text-amber-800 rounded-2xl text-xs flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">⚠️ Admin Image Uploads Not Configured</p>
            <p className="font-normal">
              Product image uploads will fail because <code className="bg-amber-100 px-1 rounded">SUPABASE_SECRET_KEY</code> is not set.
            </p>
            <p className="font-normal">
              Get it from: <strong>Supabase Dashboard → Settings → API Keys → Secret key</strong> (starts with <code className="bg-amber-100 px-1 rounded">sb_secret_</code>),
              then add it to your <code className="bg-amber-100 px-1 rounded">.env.local</code> and Vercel environment variables.
            </p>
          </div>
        </div>
      )}

      {storageConfigured === true && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span><strong>Storage Configured:</strong> Admin image uploads are ready.</span>
        </div>
      )}

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Site settings updated successfully!
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white p-6 md:p-8 rounded-3xl border border-eco-100 shadow-sm space-y-6 text-xs">
        {/* Business Info */}
        <div>
          <h3 className="font-serif font-bold text-sm text-slate-900 border-b border-eco-100 pb-2 mb-4">Business Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Business Name</label>
              <input
                type="text"
                value={settings.site_name || ''}
                onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
                className="w-full bg-canvas-100 border border-eco-200 rounded-xl p-3"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Support Email</label>
              <input
                type="email"
                value={settings.email || ''}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                className="w-full bg-canvas-100 border border-eco-200 rounded-xl p-3"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Primary Phone Number</label>
              <input
                type="text"
                value={settings.phone_primary || ''}
                onChange={(e) => setSettings({ ...settings, phone_primary: e.target.value })}
                className="w-full bg-canvas-100 border border-eco-200 rounded-xl p-3"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Secondary Phone Numbers</label>
              <input
                type="text"
                value={settings.phone_secondary || ''}
                onChange={(e) => setSettings({ ...settings, phone_secondary: e.target.value })}
                className="w-full bg-canvas-100 border border-eco-200 rounded-xl p-3"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="font-bold text-slate-700 block mb-1">Factory & Office Street Address</label>
            <textarea
              rows={2}
              value={settings.address || ''}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              className="w-full bg-canvas-100 border border-eco-200 rounded-xl p-3"
            />
          </div>
        </div>

        {/* WhatsApp Order Settings */}
        <div>
          <h3 className="font-serif font-bold text-sm text-slate-900 border-b border-eco-100 pb-2 mb-4">
            WhatsApp Order Settings
          </h3>
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              WhatsApp Order Number <span className="font-normal text-eco-600">(customers send orders to this number)</span>
            </label>
            <input
              type="text"
              value={settings.whatsapp_number || ''}
              onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value })}
              placeholder="918247671857"
              className="w-full bg-canvas-100 border border-eco-200 rounded-xl p-3"
            />
            <div className="mt-1.5 p-2.5 bg-blue-50 border border-blue-100 rounded-lg flex items-start gap-2">
              <Info className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-blue-700">
                Enter the number in international format <strong>without + or spaces</strong>.<br />
                Example: <code className="bg-blue-100 px-1 rounded">918247671857</code> (91 = India country code, then 10-digit mobile).<br />
                This is used to generate the WhatsApp order link: <code className="bg-blue-100 px-1 rounded">wa.me/918247671857</code>
              </p>
            </div>
          </div>
        </div>

        {/* Announcement Banner */}
        <div>
          <h3 className="font-serif font-bold text-sm text-slate-900 border-b border-eco-100 pb-2 mb-4">
            Site Display
          </h3>
          <div>
            <label className="font-bold text-slate-700 block mb-1">Header Announcement Banner Text</label>
            <input
              type="text"
              value={settings.announcement_banner || ''}
              onChange={(e) => setSettings({ ...settings, announcement_banner: e.target.value })}
              className="w-full bg-canvas-100 border border-eco-200 rounded-xl p-3"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="bg-eco-700 hover:bg-eco-800 text-white font-bold py-3.5 px-6 rounded-xl shadow-md transition-colors flex items-center gap-2"
        >
          <Save className="w-4 h-4" /> {isSaving ? 'Saving Settings...' : 'Save Site Settings'}
        </button>
      </form>
    </div>
  );
}
