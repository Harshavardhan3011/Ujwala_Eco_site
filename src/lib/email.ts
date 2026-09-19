/**
 * Ujwala Eco Products — Server-Side Email Dispatcher
 * Sends order request details to Ujwala and confirmation to customers.
 */

import tls from 'tls';
import net from 'net';
import { BUSINESS_PHONE_DISPLAY, BUSINESS_TEL } from '@/lib/constants';

export interface OrderRequestItemSnapshot {
  product_name: string;
  sku: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  variant_info?: string | null;
  customization_notes?: string | null;
}

export interface OrderRequestEmailData {
  requestNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  shippingPostalCode: string;
  shippingCountry?: string;
  subtotal: number;
  deliveryCharge: number;
  totalAmount: number;
  customerNotes?: string | null;
  customizationNotes?: string | null;
  items: OrderRequestItemSnapshot[];
  createdAt?: string;
}

export function isEmailConfigured(): boolean {
  return Boolean(
    process.env.RESEND_API_KEY ||
    (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
  );
}

export function getSellerEmail(): string {
  return process.env.UJWALA_ORDER_EMAIL || 'ujwalaeco@gmail.com';
}

function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Generate HTML email for seller
export function generateSellerEmailHtml(data: OrderRequestEmailData): string {
  const itemsRows = data.items
    .map(
      (item, idx) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 10px 8px; font-size: 13px; color: #1e293b;">
          <strong>${idx + 1}. ${item.product_name}</strong><br/>
          <span style="font-size: 11px; color: #64748b;">SKU: ${item.sku}</span>
          ${item.customization_notes ? `<br/><span style="font-size: 11px; color: #047857; background: #ecfdf5; padding: 2px 4px; border-radius: 4px;">✏️ ${item.customization_notes}</span>` : ''}
        </td>
        <td style="padding: 10px 8px; font-size: 13px; color: #1e293b; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px 8px; font-size: 13px; color: #1e293b; text-align: right;">${formatCurrency(item.unit_price)}</td>
        <td style="padding: 10px 8px; font-size: 13px; color: #047857; font-weight: bold; text-align: right;">${formatCurrency(item.line_total)}</td>
      </tr>`
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Order Request — ${data.requestNumber}</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    
    <!-- Header -->
    <tr>
      <td style="background-color: #065f46; padding: 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 20px; letter-spacing: 0.5px;">UJWALA ECO PRODUCTS</h1>
        <p style="color: #a7f3d0; margin: 4px 0 0 0; font-size: 13px;">New Customer Order Request</p>
      </td>
    </tr>

    <!-- Reference Alert -->
    <tr>
      <td style="padding: 16px 24px; background-color: #ecfdf5; border-bottom: 1px solid #a7f3d0;">
        <p style="margin: 0; font-size: 14px; color: #065f46;">
          <strong>Request Reference:</strong> <span style="font-family: monospace; font-size: 15px; font-weight: bold;">${data.requestNumber}</span>
          <span style="float: right; background-color: #fef3c7; color: #92400e; font-size: 11px; font-weight: bold; padding: 3px 8px; border-radius: 9999px;">PENDING CONFIRMATION</span>
        </p>
      </td>
    </tr>

    <!-- Customer Details -->
    <tr>
      <td style="padding: 24px;">
        <h3 style="margin-top: 0; font-size: 14px; color: #0f172a; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px;">Customer Information</h3>
        <table width="100%" style="font-size: 13px; line-height: 1.6; margin-bottom: 20px;">
          <tr>
            <td width="35%" style="color: #64748b;"><strong>Full Name:</strong></td>
            <td style="color: #0f172a;">${data.customerName}</td>
          </tr>
          <tr>
            <td style="color: #64748b;"><strong>Email:</strong></td>
            <td style="color: #0f172a;"><a href="mailto:${data.customerEmail}" style="color: #047857; text-decoration: none;">${data.customerEmail}</a></td>
          </tr>
          <tr>
            <td style="color: #64748b;"><strong>Phone:</strong></td>
            <td style="color: #0f172a;"><a href="tel:${data.customerPhone}" style="color: #047857; text-decoration: none;">${data.customerPhone}</a></td>
          </tr>
          <tr>
            <td style="color: #64748b; vertical-align: top;"><strong>Delivery Address:</strong></td>
            <td style="color: #0f172a;">
              ${data.shippingAddress}<br/>
              ${data.shippingCity}, ${data.shippingState} — ${data.shippingPostalCode}<br/>
              ${data.shippingCountry || 'India'}
            </td>
          </tr>
          ${data.customerNotes ? `
          <tr>
            <td style="color: #64748b; vertical-align: top;"><strong>Customer Notes:</strong></td>
            <td style="color: #92400e; background: #fffbeb; padding: 6px 8px; border-radius: 6px;">${data.customerNotes}</td>
          </tr>` : ''}
        </table>

        <!-- Order Items -->
        <h3 style="font-size: 14px; color: #0f172a; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px; margin-bottom: 12px;">Requested Items</h3>
        <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0; color: #475569; font-size: 12px; text-transform: uppercase;">
              <th style="padding: 8px; text-align: left;">Item</th>
              <th style="padding: 8px; text-align: center;">Qty</th>
              <th style="padding: 8px; text-align: right;">Unit Price</th>
              <th style="padding: 8px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>

        <!-- Pricing Summary -->
        <table width="100%" style="font-size: 13px; line-height: 1.8; background-color: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0;">
          <tr>
            <td style="color: #64748b;">Subtotal:</td>
            <td style="text-align: right; color: #0f172a; font-weight: bold;">${formatCurrency(data.subtotal)}</td>
          </tr>
          <tr>
            <td style="color: #64748b;">Estimated Delivery Charges:</td>
            <td style="text-align: right; color: #0f172a; font-weight: bold;">${data.deliveryCharge > 0 ? formatCurrency(data.deliveryCharge) : 'FREE'}</td>
          </tr>
          <tr style="border-top: 1px solid #cbd5e1;">
            <td style="color: #065f46; font-size: 15px; font-weight: bold; padding-top: 6px;">Total Requested Amount:</td>
            <td style="text-align: right; color: #065f46; font-size: 16px; font-weight: bold; padding-top: 6px;">${formatCurrency(data.totalAmount)}</td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background-color: #f1f5f9; padding: 16px 24px; text-align: center; font-size: 12px; color: #64748b;">
        This is an automated order notification from the Ujwala Eco Products platform.<br/>
        Please contact the customer to confirm availability, final delivery timeline, and payment mode.
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

// Generate HTML email for customer confirmation
export function generateCustomerEmailHtml(data: OrderRequestEmailData): string {
  const itemsRows = data.items
    .map(
      (item, idx) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 10px 8px; font-size: 13px; color: #1e293b;">
          <strong>${idx + 1}. ${item.product_name}</strong><br/>
          <span style="font-size: 11px; color: #64748b;">SKU: ${item.sku}</span>
          ${item.customization_notes ? `<br/><span style="font-size: 11px; color: #047857; background: #ecfdf5; padding: 2px 4px; border-radius: 4px;">✏️ ${item.customization_notes}</span>` : ''}
        </td>
        <td style="padding: 10px 8px; font-size: 13px; color: #1e293b; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px 8px; font-size: 13px; color: #1e293b; text-align: right;">${formatCurrency(item.unit_price)}</td>
        <td style="padding: 10px 8px; font-size: 13px; color: #047857; font-weight: bold; text-align: right;">${formatCurrency(item.line_total)}</td>
      </tr>`
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order Request Received — ${data.requestNumber}</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    
    <!-- Header -->
    <tr>
      <td style="background-color: #065f46; padding: 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 20px; letter-spacing: 0.5px;">UJWALA ECO PRODUCTS</h1>
        <p style="color: #a7f3d0; margin: 4px 0 0 0; font-size: 13px;">Order Request Confirmation</p>
      </td>
    </tr>

    <!-- Thank You Banner -->
    <tr>
      <td style="padding: 20px 24px; background-color: #ecfdf5; border-bottom: 1px solid #a7f3d0;">
        <h2 style="margin: 0 0 6px 0; color: #065f46; font-size: 16px;">Dear ${data.customerName},</h2>
        <p style="margin: 0; font-size: 13px; color: #064e3b; line-height: 1.5;">
          Thank you for choosing Ujwala Eco Products! We have successfully received your order request (<strong>#${data.requestNumber}</strong>).
        </p>
      </td>
    </tr>

    <!-- Next Steps Notice -->
    <tr>
      <td style="padding: 16px 24px; background-color: #fffbeb; border-bottom: 1px solid #fef3c7;">
        <p style="margin: 0; font-size: 12px; color: #92400e; line-height: 1.5;">
          ℹ️ <strong>What happens next?</strong><br/>
          Our team will contact you on <strong>${data.customerPhone}</strong> or <strong>${data.customerEmail}</strong> to confirm current stock, delivery timeframe, customization details, and finalize your order. No payment was charged online.
        </p>
      </td>
    </tr>

    <!-- Receipt Items -->
    <tr>
      <td style="padding: 24px;">
        <h3 style="font-size: 14px; color: #0f172a; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px; margin-top: 0; margin-bottom: 12px;">Requested Items Summary</h3>
        <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0; color: #475569; font-size: 12px; text-transform: uppercase;">
              <th style="padding: 8px; text-align: left;">Item</th>
              <th style="padding: 8px; text-align: center;">Qty</th>
              <th style="padding: 8px; text-align: right;">Unit Price</th>
              <th style="padding: 8px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>

        <!-- Totals -->
        <table width="100%" style="font-size: 13px; line-height: 1.8; background-color: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
          <tr>
            <td style="color: #64748b;">Subtotal:</td>
            <td style="text-align: right; color: #0f172a; font-weight: bold;">${formatCurrency(data.subtotal)}</td>
          </tr>
          <tr>
            <td style="color: #64748b;">Delivery Charges:</td>
            <td style="text-align: right; color: #0f172a; font-weight: bold;">${data.deliveryCharge > 0 ? formatCurrency(data.deliveryCharge) : 'FREE'}</td>
          </tr>
          <tr style="border-top: 1px solid #cbd5e1;">
            <td style="color: #065f46; font-size: 15px; font-weight: bold; padding-top: 6px;">Total Estimated:</td>
            <td style="text-align: right; color: #065f46; font-size: 16px; font-weight: bold; padding-top: 6px;">${formatCurrency(data.totalAmount)}</td>
          </tr>
        </table>

        <!-- Delivery Address -->
        <h3 style="font-size: 14px; color: #0f172a; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px; margin-bottom: 8px;">Delivery Details</h3>
        <p style="margin: 0; font-size: 13px; color: #334155; line-height: 1.6;">
          ${data.customerName} (${data.customerPhone})<br/>
          ${data.shippingAddress}<br/>
          ${data.shippingCity}, ${data.shippingState} — ${data.shippingPostalCode}<br/>
          ${data.shippingCountry || 'India'}
        </p>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background-color: #f1f5f9; padding: 16px 24px; text-align: center; font-size: 12px; color: #64748b;">
        Have questions? Contact us at <a href="mailto:${getSellerEmail()}" style="color: #047857; text-decoration: none;">${getSellerEmail()}</a> or Call/WhatsApp: <a href="${BUSINESS_TEL}" style="color: #047857; text-decoration: none;">${BUSINESS_PHONE_DISPLAY}</a><br/>
        Ujwala Eco Products • Handcrafted Eco-Friendly Jute Products & Return Gifts
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

/**
 * Sends order request notification emails server-side.
 */
export async function sendOrderRequestEmails(data: OrderRequestEmailData): Promise<{
  success: boolean;
  sellerEmailSent: boolean;
  customerEmailSent: boolean;
  error?: string;
}> {
  const sellerEmail = getSellerEmail();
  const sellerHtml = generateSellerEmailHtml(data);
  const customerHtml = generateCustomerEmailHtml(data);

  // Method 1: Resend API
  if (process.env.RESEND_API_KEY) {
    try {
      const fromEmail = process.env.RESEND_FROM || 'Ujwala Eco Products <ujwalaeco@gmail.com>';

      // 1. Send to seller
      const sellerRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [sellerEmail],
          subject: `New Order Request — ${data.requestNumber}`,
          html: sellerHtml,
        }),
      });

      const sellerSent = sellerRes.ok;

      // 2. Send to customer
      let customerSent = false;
      if (data.customerEmail && data.customerEmail.includes('@')) {
        const custRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [data.customerEmail],
            subject: `Order Request Received — ${data.requestNumber} | Ujwala Eco Products`,
            html: customerHtml,
          }),
        });
        customerSent = custRes.ok;
      }

      return {
        success: sellerSent,
        sellerEmailSent: sellerSent,
        customerEmailSent: customerSent,
      };
    } catch (err: any) {
      console.error('[EMAIL] Resend delivery exception:', err.message);
      return {
        success: false,
        sellerEmailSent: false,
        customerEmailSent: false,
        error: err.message,
      };
    }
  }

  // If email service credentials are not configured in environment
  console.log(`[EMAIL] Email service not configured. Order request #${data.requestNumber} logged for seller ${sellerEmail}.`);
  return {
    success: false,
    sellerEmailSent: false,
    customerEmailSent: false,
    error: 'Email service not configured on server (UJWALA_ORDER_EMAIL logged)',
  };
}
