# Supabase Auth & CAPTCHA Setup Guide — Ujwala Eco Products

This document explains how to configure Supabase Authentication with Cloudflare Turnstile CAPTCHA protection for the Ujwala Eco Products application.

---

## Overview

The application uses Supabase Auth for user registration and login, with Cloudflare Turnstile providing bot/abuse protection (CAPTCHA). Both the **registration** and **login** flows require a valid Turnstile CAPTCHA token.

---

## STEP 1: Verify Supabase Auth Settings

1. Open [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project (`ujkhgvhqofdbqwgahslc`)
3. Go to **Authentication → Settings → General**

Verify the following:

| Setting | Required Value |
|---|---|
| Allow new users to sign up | ✅ **ON** |
| Email provider | ✅ **ON** |

### Email Confirmation

Check **Authentication → Settings → Email**:

- If **"Confirm email"** is enabled → users must verify their email before they can sign in. The app will show: _"Account created. Please check your email to verify your account."_
- If **"Confirm email"** is disabled → users are immediately signed in after registration.

> **⚠️ Do NOT change this setting unless you understand the implications.**

---

## STEP 2: Configure CAPTCHA Protection in Supabase

1. In Supabase Dashboard, go to:

   **Authentication → Bot and Abuse Protection → CAPTCHA Protection**

2. **Enable** CAPTCHA protection

3. Select **Cloudflare Turnstile** as the provider

4. Enter the **Turnstile Secret Key** (from Cloudflare Dashboard — see Step 3)

> **🔴 CRITICAL: The Secret Key goes ONLY here in Supabase Dashboard.**
>
> - NEVER put the Turnstile Secret Key in `.env`, `.env.local`, `.env.production`, or any `NEXT_PUBLIC_*` variable.
> - NEVER put the Secret Key in source code.
> - NEVER commit the Secret Key to Git.

5. Save the configuration

---

## STEP 3: Create/Configure Cloudflare Turnstile Site

1. Go to [Cloudflare Dashboard → Turnstile](https://dash.cloudflare.com/?to=/:account/turnstile)

2. Click **"Add Site"** (if you haven't already)

3. Configure:

   | Field | Value |
   |---|---|
   | Site name | Ujwala Eco Products |
   | Domain | `ujwala-eco-site.vercel.app` (and any custom domain) |
   | Widget Mode | Managed |

4. After creation, you will receive two keys:

   | Key | Usage |
   |---|---|
   | **Site Key** | Used by the frontend (public, safe to expose) |
   | **Secret Key** | Used by Supabase Dashboard ONLY (never in code) |

5. Copy the **Site Key** for Step 4

6. Copy the **Secret Key** and paste it into Supabase Dashboard (Step 2, item 4)

---

## STEP 4: Add Environment Variable to the Application

### Local Development

Add to `.env.local`:

```
NEXT_PUBLIC_TURNSTILE_SITE_KEY=YOUR_SITE_KEY_HERE
```

### Production (Vercel)

1. Go to [Vercel Dashboard](https://vercel.com)
2. Select the **Ujwala Eco Products** project
3. Go to **Settings → Environment Variables**
4. Add:

   | Key | Value | Environments |
   |---|---|---|
   | `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Your Turnstile Site Key | ✅ Development, ✅ Preview, ✅ Production |

5. **Redeploy** the application for changes to take effect

> **⚠️ IMPORTANT:** If `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is missing or empty, the application will **block** registration and login submissions and show a configuration error message. This is intentional — CAPTCHA must not be bypassed.

---

## STEP 5: Verify Everything Works

### Test Registration

1. Open `/auth/register`
2. The Turnstile CAPTCHA widget should appear before the "Create Account" button
3. Complete the CAPTCHA challenge
4. Fill in valid user details
5. Click "Create Account"
6. Registration should succeed without the error: _"captcha protection: request disallowed"_

### Test Login

1. Open `/auth/login`
2. The Turnstile CAPTCHA widget should appear before the "Sign In" button
3. Complete the CAPTCHA challenge
4. Enter valid credentials
5. Click "Sign In"
6. Login should succeed

### Error Cases to Verify

- **CAPTCHA not completed** → "Please complete the security verification."
- **CAPTCHA expired** → "Security verification expired. Please try again."
- **Invalid credentials** → "Invalid email or password"
- **Duplicate account** → "Unable to create this account. Please check your details or try signing in."

---

## Architecture Summary

```
Frontend (Register/Login page)
  │
  ├── Cloudflare Turnstile Widget renders
  │     ↓ User completes challenge
  ├── captchaToken stored in React state
  │
  ├── User submits form
  │     ↓
  ├── POST /api/auth/register (or /login)
  │     Body: { email, password, ..., captchaToken }
  │     ↓
  ├── Server-side API route
  │     ↓
  ├── db.auth.signUp({ options: { captchaToken } })
  │     ↓
  ├── Supabase Auth verifies captchaToken with Cloudflare
  │     using the Secret Key configured in Dashboard
  │     ↓
  └── Registration/Login succeeds
```

---

## Security Rules

| Rule | Status |
|---|---|
| Turnstile Secret Key in Supabase Dashboard only | ✅ Required |
| Turnstile Secret Key NOT in code/env files | ✅ Enforced |
| `NEXT_PUBLIC_TURNSTILE_SECRET_KEY` does NOT exist | ✅ Verified |
| Supabase service-role key NOT in browser | ✅ Verified |
| CAPTCHA cannot be bypassed when site key is missing | ✅ Enforced |
| CAPTCHA tokens are ephemeral (not stored) | ✅ Verified |
| No fake CAPTCHA tokens | ✅ Verified |

---

## Files Modified

| File | Change |
|---|---|
| `src/components/TurnstileWidget.tsx` | **NEW** — Reusable Turnstile CAPTCHA component |
| `src/app/auth/register/page.tsx` | Added Turnstile widget + captchaToken state |
| `src/app/auth/login/page.tsx` | Added Turnstile widget + captchaToken state |
| `src/context/AuthContext.tsx` | Added optional `captchaToken` param to `register()` and `login()` |
| `src/app/api/auth/register/route.ts` | Passes `captchaToken` to `db.auth.signUp()` |
| `src/app/api/auth/login/route.ts` | Passes `captchaToken` to `db.auth.signInWithPassword()` |
| `.env.example` | Added `NEXT_PUBLIC_TURNSTILE_SITE_KEY` |
| `.env.local` | Added `NEXT_PUBLIC_TURNSTILE_SITE_KEY` |
