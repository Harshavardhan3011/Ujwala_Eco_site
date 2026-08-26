'use client';

import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Folder, Loader2, ExternalLink } from 'lucide-react';

const BUCKETS = [
  { name: 'products', label: 'Products', description: 'Product catalogue images' },
  { name: 'openings', label: 'Opening Day', description: 'Opening ceremony photos' },
  { name: 'trusts', label: 'Trust & Social', description: 'Social impact images' },
  { name: 'founder', label: 'Founder', description: 'Founder/about images' },
];

export default function AdminMediaPage() {
  const [activeBucket, setActiveBucket] = useState('products');
  const [files, setFiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Get Supabase URL from env
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  const getPublicUrl = (bucket: string, path: string) =>
    `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;

  useEffect(() => {
    async function loadBucket() {
      if (!supabaseUrl) return;
      setIsLoading(true);
      setError('');
      setFiles([]);
      try {
        const res = await fetch(`/api/admin/upload?bucket=${activeBucket}`);
        const data = await res.json();
        if (data.files) setFiles(data.files);
        else setError(data.error || 'Failed to load media');
      } catch {
        setError('Failed to load media files');
      } finally {
        setIsLoading(false);
      }
    }
    loadBucket();
  }, [activeBucket, supabaseUrl]);

  return (
    <div className="space-y-5 max-w-screen-xl">
      <div>
        <h1 className="text-lg font-bold text-slate-900">Media Library</h1>
        <p className="text-xs text-slate-500 mt-0.5">Images stored in Supabase Storage</p>
      </div>

      {/* Bucket Tabs */}
      <div className="flex flex-wrap gap-2">
        {BUCKETS.map(b => (
          <button
            key={b.name}
            onClick={() => setActiveBucket(b.name)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
              activeBucket === b.name
                ? 'bg-eco-700 text-white border-eco-700'
                : 'bg-white text-slate-700 border-eco-200 hover:bg-eco-50'
            }`}
          >
            <Folder className="w-4 h-4" />
            {b.label}
          </button>
        ))}
      </div>

      {/* Bucket Info */}
      <div className="bg-white rounded-xl border border-eco-100 px-5 py-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">{BUCKETS.find(b => b.name === activeBucket)?.label}</p>
          <p className="text-xs text-slate-500">{BUCKETS.find(b => b.name === activeBucket)?.description}</p>
        </div>
        <a
          href={`${supabaseUrl}/project/default/storage/buckets/${activeBucket}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-eco-700 font-medium hover:text-eco-900 transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Open in Supabase
        </a>
      </div>

      {/* Media Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24 bg-white rounded-xl border border-eco-100">
          <Loader2 className="w-6 h-6 animate-spin text-eco-600" />
          <span className="ml-2 text-sm text-slate-500">Loading media…</span>
        </div>
      ) : error ? (
        <div className="bg-white rounded-xl border border-eco-100 p-8 text-center space-y-3">
          <ImageIcon className="w-12 h-12 mx-auto text-eco-200" />
          <p className="text-sm font-medium text-slate-600">Media listing unavailable</p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Image files are managed directly in Supabase Storage. Use the "Open in Supabase" button to upload and manage media files for the <strong>{activeBucket}</strong> bucket.
          </p>
          <a
            href={`${supabaseUrl}/project/default/storage/buckets`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-eco-700 font-medium border border-eco-200 px-4 py-2 rounded-lg hover:bg-eco-50 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Open Supabase Storage
          </a>
        </div>
      ) : files.length === 0 ? (
        <div className="bg-white rounded-xl border border-eco-100 p-8 text-center space-y-3">
          <ImageIcon className="w-12 h-12 mx-auto text-eco-200" />
          <p className="text-sm font-medium text-slate-600">No files in this bucket</p>
          <p className="text-xs text-slate-400">Upload images directly to Supabase Storage</p>
          <a
            href={`${supabaseUrl}/project/default/storage/buckets/${activeBucket}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-eco-700 font-medium border border-eco-200 px-4 py-2 rounded-lg hover:bg-eco-50 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Upload to {activeBucket}
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {files.map((file, i) => (
            <div key={i} className="bg-white rounded-xl border border-eco-100 overflow-hidden group hover:border-eco-300 transition-colors">
              <div className="aspect-square bg-canvas-100 relative overflow-hidden">
                <img
                  src={getPublicUrl(activeBucket, file.name)}
                  alt={file.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={e => {
                    const img = e.target as HTMLImageElement;
                    img.style.display = 'none';
                    img.nextSibling && ((img.nextSibling as HTMLElement).style.display = 'flex');
                  }}
                />
                <div className="hidden w-full h-full absolute inset-0 items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-eco-300" />
                </div>
              </div>
              <div className="px-2 py-1.5">
                <p className="text-[10px] text-slate-500 truncate font-medium" title={file.name}>{file.name}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
