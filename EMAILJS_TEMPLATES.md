# EmailJS Setup — Ujwala Eco Products

> **Purpose**: This file contains the exact EmailJS templates and setup instructions for the Contact page and Custom Orders page.
> Do **NOT** commit real API keys to this file or the repository.

---

## 1. Required EmailJS Configuration

Before creating templates, set up EmailJS:

1. Go to [https://www.emailjs.com](https://www.emailjs.com) → Sign In / Create Account
2. **Dashboard → Email Services** → Add New Service
   - Choose **Gmail** (or your preferred provider)
   - Connect your Google account (`ujwalaeco@gmail.com`)
   - Give it a Service Name: `Ujwala Eco Products`
   - Note down the **Service ID** (e.g., `service_abc123`)
3. **Dashboard → Email Templates** → Create templates (see sections 2 & 3 below)
4. **Dashboard → Account → General** → Copy your **Public Key**

> **Safe vs Secret**:
> - ✅ **Public Key** — safe for frontend use (prefix with `NEXT_PUBLIC_`)
> - ✅ **Service ID** — safe for frontend use
> - ✅ **Template ID** — safe for frontend use
> - ❌ **Private Key** — never expose; not needed for client-side EmailJS

---

## 2. Contact Form Template

### Template Name
`ujwala_contact_enquiry`

### Subject
```
New Contact Enquiry from {{from_name}} — Ujwala Eco Products
```

### To Email
Set this to: `ujwalaeco@gmail.com` in the EmailJS template settings → **To Email** field.

### Template Body (copy exactly into EmailJS Template → Content)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NEW CONTACT ENQUIRY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Name:
{{from_name}}

Phone / Email:
{{from_phone}}

Subject:
{{subject}}

Message:
{{message}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Received from Ujwala Eco Products Website
ujwalaeco.com
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Variables Used by the Contact Form

| EmailJS Variable | Source Field | Notes |
|-----------------|-------------|-------|
| `{{from_name}}` | `form.name` | Customer's full name |
| `{{from_phone}}` | `form.phone` | Phone OR email (combined field) |
| `{{subject}}` | `form.subject` | Enquiry subject |
| `{{message}}` | `form.message` | Customer's message |

> **Note**: The Contact page uses `form.phone` for the "Phone / Email" field (combined field). The field label says "Phone / Email *" and stores to `form.phone`. Map this to `{{from_phone}}` in your EmailJS template.

---

## 3. Custom Orders Template

### Template Name
`ujwala_custom_order`

### Subject
```
New Custom Order Request from {{customer_name}} — Ujwala Eco Products
```

### To Email
Set this to: `ujwalaeco@gmail.com` in the EmailJS template settings → **To Email** field.

### Template Body (copy exactly into EmailJS Template → Content)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NEW CUSTOM ORDER REQUEST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CUSTOMER DETAILS

Name:
{{customer_name}}

Phone (WhatsApp):
{{customer_phone}}

Email:
{{customer_email}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ORDER SPECIFICATIONS

Event / Function Type:
{{event_type}}

Product Type Required:
{{product_type}}

Required Quantity (Pcs):
{{quantity}}

Dimensions (W x H x D):
{{required_dimensions}}

Color / Jute Preference:
{{color_preference}}

Custom Text / Matter to Print:
{{custom_text}}

Required Delivery Date:
{{required_delivery_date}}

Additional Requirements / Notes:
{{special_instructions}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Received from Ujwala Eco Products Website
ujwalaeco.com
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Variables Used by the Custom Orders Form

| EmailJS Variable | Source Field | Form Label |
|-----------------|-------------|-----------|
| `{{customer_name}}` | `formData.customerName` | Your Full Name |
| `{{customer_phone}}` | `formData.phone` | Phone Number (WhatsApp) |
| `{{customer_email}}` | `formData.email` | Email Address |
| `{{event_type}}` | `formData.eventType` | Event / Function Type |
| `{{product_type}}` | `formData.productType` | Product Type |
| `{{quantity}}` | `formData.quantity` | Required Quantity (Pcs) |
| `{{required_dimensions}}` | `formData.requiredDimensions` | Dimensions (W x H x D) |
| `{{color_preference}}` | `formData.colorPreference` | Color Preference |
| `{{custom_text}}` | `formData.customText` | Custom Text / Matter to Print |
| `{{required_delivery_date}}` | `formData.requiredDeliveryDate` | Required Delivery Date |
| `{{special_instructions}}` | `formData.specialInstructions` | Additional Requirements / Notes |

---

## 4. Environment Variables

### Local Development (`.env.local`)

```env
# EmailJS — safe to expose in frontend (NEXT_PUBLIC_ prefix is correct)
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=your_public_key_here
NEXT_PUBLIC_EMAILJS_SERVICE_ID=service_abc123
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=template_contact_id
NEXT_PUBLIC_EMAILJS_CUSTOM_ORDER_TEMPLATE_ID=template_custom_order_id
```

### Vercel Production

Add the same variables in:
**Vercel → Project → Settings → Environment Variables**

Set each variable for:
- ✅ Production
- ✅ Preview
- ✅ Development

> **Important**: These are PUBLIC EmailJS keys — they are safe to put in `NEXT_PUBLIC_` variables and will be visible in browser JavaScript. EmailJS is designed this way. Do **not** put your EmailJS **Private Key** anywhere in the code.

---

## 5. EmailJS Dashboard Setup — Step by Step

### STEP 1 — Create Email Service
1. EmailJS Dashboard → **Email Services** → **Add New Service**
2. Choose **Gmail**
3. Connect Gmail account: `ujwalaeco@gmail.com`
4. Service Name: `Ujwala Eco Products`
5. Click **Create Service**
6. ✅ Note the **Service ID** (e.g., `service_abc123`)

### STEP 2 — Create Contact Form Template
1. EmailJS Dashboard → **Email Templates** → **Create New Template**
2. Template Name: `ujwala_contact_enquiry`
3. Subject: `New Contact Enquiry from {{from_name}} — Ujwala Eco Products`
4. To Email: `ujwalaeco@gmail.com`
5. Paste the template body from Section 2 above
6. Click **Save**
7. ✅ Note the **Template ID** (e.g., `template_xyz111`)

### STEP 3 — Create Custom Orders Template
1. EmailJS Dashboard → **Email Templates** → **Create New Template**
2. Template Name: `ujwala_custom_order`
3. Subject: `New Custom Order Request from {{customer_name}} — Ujwala Eco Products`
4. To Email: `ujwalaeco@gmail.com`
5. Paste the template body from Section 3 above
6. Click **Save**
7. ✅ Note the **Template ID** (e.g., `template_xyz222`)

### STEP 4 — Get Your Public Key
1. EmailJS Dashboard → **Account** → **General**
2. Copy **Public Key** (e.g., `abc123XYZ`)

### STEP 5 — Add to Environment Variables

Add to `.env.local`:
```env
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=abc123XYZ
NEXT_PUBLIC_EMAILJS_SERVICE_ID=service_abc123
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=template_xyz111
NEXT_PUBLIC_EMAILJS_CUSTOM_ORDER_TEMPLATE_ID=template_xyz222
```

Also add all four to **Vercel → Project → Settings → Environment Variables** for Production, Preview, and Development.

---

## 6. Final Checklist

- [ ] EmailJS account created / logged in
- [ ] Gmail service connected (`ujwalaeco@gmail.com`)
- [ ] Service ID copied
- [ ] Contact template (`ujwala_contact_enquiry`) created
- [ ] Contact Template ID copied
- [ ] Custom Order template (`ujwala_custom_order`) created
- [ ] Custom Order Template ID copied
- [ ] Public Key copied
- [ ] `NEXT_PUBLIC_EMAILJS_PUBLIC_KEY` added to `.env.local`
- [ ] `NEXT_PUBLIC_EMAILJS_SERVICE_ID` added to `.env.local`
- [ ] `NEXT_PUBLIC_EMAILJS_TEMPLATE_ID` added to `.env.local`
- [ ] `NEXT_PUBLIC_EMAILJS_CUSTOM_ORDER_TEMPLATE_ID` added to `.env.local`
- [ ] All 4 variables added to Vercel (Production + Preview + Development)
- [ ] Contact form tested — email received at `ujwalaeco@gmail.com`
- [ ] Custom Orders form tested — email received at `ujwalaeco@gmail.com`

---

> **Note on current implementation**: The Contact form (`/contact`) currently has a placeholder `handleSubmit` that sets `submitted = true` without actually calling EmailJS. The Custom Orders form (`/custom-orders`) calls `/api/custom-orders` which stores the order in the database. To activate EmailJS sending, the frontend forms need to be wired up using `emailjs.send(serviceId, templateId, templateParams, publicKey)`.
