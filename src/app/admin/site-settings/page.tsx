'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle2 } from 'lucide-react';

export default function AdminSiteSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({
    site_name: 'Ujwala Eco Products',
    site_tagline: 'Say No to Plastic – Handcrafted Eco-Friendly Jute Bags & Return Gifts',
    phone_primary: '+91 9849530536',
    phone_secondary: '+91 9701347838, +91 8374431924',
    email: 'contact@ujwalaeco.com',
    address: 'D.No. 7-116, Simhadrinagar, Sector-1, Duvvada, Near VSEZ, Visakhapatnam - 530 049, Andhra Pradesh',
    whatsapp_number: '919849530536',
    announcement_banner: '🌿 Custom Jute Bags Available for Weddings, Housewarmings & Bulk Shop Orders!',
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

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
    loadSettings();
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
        <p className="text-xs text-slate-500">Configure client phone numbers, address, announcement banner & store metadata</p>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Site settings updated successfully!
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white p-6 md:p-8 rounded-3xl border border-eco-100 shadow-sm space-y-4 text-xs">
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

          <div>
            <label className="font-bold text-slate-700 block mb-1">Support Email</label>
            <input
              type="email"
              value={settings.email || ''}
              onChange={(e) => setSettings({ ...settings, email: e.target.value })}
              className="w-full bg-canvas-100 border border-eco-200 rounded-xl p-3"
            />
          </div>
        </div>

        <div>
          <label className="font-bold text-slate-700 block mb-1">Factory & Office Street Address</label>
          <textarea
            rows={2}
            value={settings.address || ''}
            onChange={(e) => setSettings({ ...settings, address: e.target.value })}
            className="w-full bg-canvas-100 border border-eco-200 rounded-xl p-3"
          />
        </div>

        <div>
          <label className="font-bold text-slate-700 block mb-1">Header Announcement Banner Text</label>
          <input
            type="text"
            value={settings.announcement_banner || ''}
            onChange={(e) => setSettings({ ...settings, announcement_banner: e.target.value })}
            className="w-full bg-canvas-100 border border-eco-200 rounded-xl p-3"
          />
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
