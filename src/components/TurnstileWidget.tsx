'use client';

import React, { useEffect, useRef, useState } from 'react';

// Extend Window to include Turnstile types
declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          'expired-callback'?: () => void;
          'error-callback'?: () => void;
          theme?: 'light' | 'dark' | 'auto';
          size?: 'normal' | 'compact';
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
}

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';

export default function TurnstileWidget({ onVerify, onExpire, onError }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [scriptError, setScriptError] = useState(false);

  // If the site key is not configured, render a hard-block configuration error
  if (!TURNSTILE_SITE_KEY) {
    return (
      <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-800 text-xs font-bold text-center">
        ⚠️ Security verification is not configured. Registration and login are temporarily unavailable. Please contact the site administrator.
      </div>
    );
  }

  // Load the Turnstile script
  useEffect(() => {
    // Check if already loaded
    if (window.turnstile) {
      setScriptLoaded(true);
      return;
    }

    const existingScript = document.querySelector(
      'script[src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"]'
    );

    if (existingScript) {
      // Script tag exists but may not have finished loading
      const checkLoaded = setInterval(() => {
        if (window.turnstile) {
          setScriptLoaded(true);
          clearInterval(checkLoaded);
        }
      }, 100);
      // Stop checking after 10 seconds
      const timeout = setTimeout(() => clearInterval(checkLoaded), 10000);
      return () => {
        clearInterval(checkLoaded);
        clearTimeout(timeout);
      };
    }

    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;

    script.onload = () => {
      // The turnstile object may take a moment to initialize after script load
      const checkReady = setInterval(() => {
        if (window.turnstile) {
          setScriptLoaded(true);
          clearInterval(checkReady);
        }
      }, 50);
      setTimeout(() => {
        clearInterval(checkReady);
        if (!window.turnstile) {
          setScriptError(true);
        }
      }, 5000);
    };

    script.onerror = () => {
      setScriptError(true);
    };

    document.head.appendChild(script);
  }, []);

  // Stable callback refs to avoid re-renders causing widget re-creation
  const onVerifyRef = useRef(onVerify);
  const onExpireRef = useRef(onExpire);
  const onErrorRef = useRef(onError);
  useEffect(() => { onVerifyRef.current = onVerify; }, [onVerify]);
  useEffect(() => { onExpireRef.current = onExpire; }, [onExpire]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);

  // Render the widget once script is loaded
  useEffect(() => {
    if (!scriptLoaded || !containerRef.current || !window.turnstile) return;

    // Clean up any previous widget
    if (widgetIdRef.current) {
      try {
        window.turnstile.remove(widgetIdRef.current);
      } catch {
        // Widget may have already been removed
      }
    }

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: TURNSTILE_SITE_KEY,
      callback: (token: string) => onVerifyRef.current(token),
      'expired-callback': () => onExpireRef.current?.(),
      'error-callback': () => onErrorRef.current?.(),
      theme: 'light',
      size: 'normal',
    });

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // Ignore cleanup errors
        }
        widgetIdRef.current = null;
      }
    };
  }, [scriptLoaded]);

  if (scriptError) {
    return (
      <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold text-center">
        Failed to load security verification. Please refresh the page and try again.
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <div ref={containerRef} />
      {!scriptLoaded && (
        <div className="text-xs text-slate-400 py-2 text-center">Loading security verification…</div>
      )}
    </div>
  );
}

/**
 * Utility: check whether Turnstile is configured.
 * Use this in forms to determine whether submission should be blocked
 * when no captchaToken is available.
 */
export function isTurnstileConfigured(): boolean {
  return !!TURNSTILE_SITE_KEY;
}
