# Ujwala Eco Products - Production Full-Stack E-Commerce Platform

A production-ready full-stack e-commerce web application built for **Ujwala Eco Products**, a handcrafted jute bag and eco-friendly products manufacturing business based in Visakhapatnam, Andhra Pradesh.

---

## 🌟 Brand Information & Verified Context

- **Business Name**: Ujwala Eco Products (ఉజ్వల ఎకో ప్రొడక్ట్స్)
- **Founder**: N. Suguna
- **Location & Address**: D.No. 7-116, Simhadrinagar, Sector-1, Duvvada, Near VSEZ, Visakhapatnam - 530 049, Andhra Pradesh, India
- **Contact Numbers**: +91 9849530536, +91 9701347838, +91 8374431924
- **Email**: contact@ujwalaeco.com
- **Social Impact**: Ujwala Educational & Social Trust (Est. 2012) – Book & stationery distribution, merit scholarships, old-age pensions.
- **Mission**: Ban single-use plastic, promote 100% natural jute yarn alternatives, and empower local women homemakers through skill development and employment.

---

## 🚀 Key Features

1. **Database-Driven Price & Catalog Management**:
   - Zero hardcoded prices in the frontend. All product prices, stock, discounts, minimum order quantities (MOQ), materials, and SEO metadata are dynamically fetched from the database (`prisma/dev.db`) and managed via the Admin Dashboard.
2. **Multi-Attribute Search & Filter System**:
   - Real-time product search querying product names, SKUs, categories, tags, and descriptions.
   - Filtering by Category, Price Range slider, Stock status, and Custom Printing availability.
3. **Custom Order Request System**:
   - Dedicated `/custom-orders` page enabling clients to request customized jute bags for weddings, housewarmings, birthdays, and shop bulk supply (with logo printing, bride/groom names, custom dimensions, and delivery dates).
4. **Shopping Cart & Wishlist**:
   - Dynamic persistent shopping cart with subtotal, free shipping progress bar, stock validation, and MOQ enforcement.
   - User wishlist saved per authenticated account.
5. **Multi-Step Checkout & Razorpay Integration**:
   - Step 1: Customer details & shipping address manager.
   - Step 2: Order summary review.
   - Step 3: Online Payment via Razorpay (or Cash on Delivery).
   - Backend HMAC-SHA256 signature verification (`/api/payments/verify`) preventing payment tampering.
6. **Order Tracking & Account Dashboard**:
   - Visual step-bar timeline tracking order statuses (`PENDING` → `CONFIRMED` → `PROCESSING` → `PACKED` → `SHIPPED` → `OUT_FOR_DELIVERY` → `DELIVERED`).
7. **Admin Dashboard (`/admin`)**:
   - Overview stats metrics (Total Revenue, Orders, Pending, Completed, Customers, Low-Stock alerts).
   - Full Product CRUD with image upload & price editing.
   - Category management with custom ordering.
   - Customer Order & Custom Request status updates.
   - Site Settings manager (Update verified address, phone numbers, WhatsApp, announcement banner).
8. **Brand Story & Community Pages**:
   - `/about`: Founder N. Suguna story & residential compound origin.
   - `/social-impact`: Ujwala Educational & Social Trust showcase with real event photos and video embed.
   - `/gallery`: Categorized Lightbox gallery (Products, Manufacturing Unit, Opening Ceremony, Social Trust).

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS + Custom Eco Design Tokens + Lucide Icons
- **Database & ORM**: SQLite (`prisma/dev.db`) + Prisma ORM
- **Authentication**: JWT HTTP-only Cookies + bcryptjs Password Hashing
- **Payments**: Razorpay Payment Gateway API + HMAC Verification

---

## 🔑 Initial Default Admin Credentials

- **Admin Login Page**: `/auth/login` or `/admin`
- **Email**: `admin@ujwalaeco.com`
- **Password**: `admin123`

---

## 📦 Local Setup Instructions

1. **Clone / Navigate to Repository**:
   ```bash
   cd c:\Users\harsha\Desktop\Ujwala_Products
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Initialize Database & Seed Real Photographs**:
   ```bash
   npx prisma db push
   node scripts/seed-runner.js
   ```

4. **Run Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

5. **Build for Production**:
   ```bash
   npm run build
   npm start
   ```

---

## ⚙️ Environment Variables (`.env.local`)

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="ujwala_eco_products_super_secret_jwt_key_2026_prod"
RAZORPAY_KEY_ID="rzp_test_ujwala_key"
RAZORPAY_KEY_SECRET="ujwala_razorpay_secret_key"
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_ujwala_key"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```
