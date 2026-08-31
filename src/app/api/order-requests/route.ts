import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromRequest, isAdminOrSuperAdmin } from '@/lib/auth';
import {
  createOrderRequestPrivileged,
  adminGetOrderRequests,
  customerGetOrderRequests,
  executePrivilegedQuery,
} from '@/lib/serverDb';
import { sendOrderRequestEmails } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = getAuthFromRequest(req);
    const body = await req.json();

    const {
      fullName,
      email,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country = 'India',
      customerNotes,
      customizationNotes,
      items,
      sessionId,
    } = body;

    // 1. Required Field Validations with Customer-Friendly Messages
    const cleanName = (fullName || '').trim();
    if (!cleanName) {
      return NextResponse.json({ error: 'Please enter your full name.' }, { status: 400 });
    }

    const cleanEmail = (email || '').trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    const cleanPhone = (phone || '').trim();
    if (!cleanPhone || cleanPhone.length < 8) {
      return NextResponse.json({ error: 'Please enter your phone number.' }, { status: 400 });
    }

    const cleanAddress1 = (addressLine1 || '').trim();
    if (!cleanAddress1) {
      return NextResponse.json({ error: 'Please enter your delivery address.' }, { status: 400 });
    }

    const cleanAddress2 = (addressLine2 || '').trim();

    const cleanCity = (city || '').trim();
    if (!cleanCity) {
      return NextResponse.json({ error: 'Please enter your city.' }, { status: 400 });
    }

    const cleanState = (state || '').trim();
    if (!cleanState) {
      return NextResponse.json({ error: 'Please enter your state.' }, { status: 400 });
    }

    const cleanPostal = (postalCode || '').trim();
    if (!cleanPostal || cleanPostal.length < 4) {
      return NextResponse.json({ error: 'Please enter your PIN code.' }, { status: 400 });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Your cart contains no items. Please select a product.' }, { status: 400 });
    }

    const fullShippingAddress = cleanAddress2
      ? `${cleanAddress1}, ${cleanAddress2}`
      : cleanAddress1;

    // 2. Create authoritative order request in database
    const orderRequest = await createOrderRequestPrivileged({
      customerId: session?.userId || null,
      customerName: cleanName,
      customerEmail: cleanEmail,
      customerPhone: cleanPhone,
      shippingAddress: fullShippingAddress,
      shippingCity: cleanCity,
      shippingState: cleanState,
      shippingPostalCode: cleanPostal,
      shippingCountry: country,
      customerNotes: (customerNotes || '').trim() || null,
      customizationNotes: (customizationNotes || '').trim() || null,
      items: items.map((i: any) => ({
        productId: i.productId,
        quantity: parseInt(String(i.quantity), 10) || 1,
        customizationNotes: i.customizationNotes || null,
      })),
    });

    // 3. Dispatch emails (Seller and Customer)
    let emailStatus: {
      success: boolean;
      sellerEmailSent: boolean;
      customerEmailSent: boolean;
      error?: string;
    } = {
      success: false,
      sellerEmailSent: false,
      customerEmailSent: false,
    };

    try {
      emailStatus = await sendOrderRequestEmails({
        requestNumber: orderRequest.request_number,
        customerName: orderRequest.customer_name,
        customerEmail: orderRequest.customer_email,
        customerPhone: orderRequest.customer_phone,
        shippingAddress: orderRequest.shipping_address,
        shippingCity: orderRequest.shipping_city,
        shippingState: orderRequest.shipping_state,
        shippingPostalCode: orderRequest.shipping_postal_code,
        shippingCountry: orderRequest.shipping_country,
        subtotal: parseFloat(orderRequest.subtotal),
        deliveryCharge: parseFloat(orderRequest.delivery_charge),
        totalAmount: parseFloat(orderRequest.total_amount),
        customerNotes: orderRequest.customer_notes,
        customizationNotes: orderRequest.customization_notes,
        items: orderRequest.items.map((i: any) => ({
          product_name: i.name,
          sku: i.sku,
          quantity: i.quantity,
          unit_price: i.unitPrice,
          line_total: i.lineTotal,
          customization_notes: i.customizationNotes,
        })),
      });

      // Update email sent marker in database
      await executePrivilegedQuery(
        `UPDATE public.order_requests SET email_sent = $1, email_error = $2 WHERE id = $3;`,
        [emailStatus.sellerEmailSent, emailStatus.error || null, orderRequest.id]
      );
    } catch (emailErr: any) {
      console.error('Email dispatch non-blocking error:', emailErr);
      await executePrivilegedQuery(
        `UPDATE public.order_requests SET email_sent = FALSE, email_error = $1 WHERE id = $2;`,
        [emailErr.message, orderRequest.id]
      );
    }

    // 4. Clear customer cart after successful request placement
    if (session?.userId) {
      await executePrivilegedQuery('DELETE FROM public.cart_items WHERE user_id = $1;', [session.userId]);
    } else if (sessionId) {
      await executePrivilegedQuery('DELETE FROM public.cart_items WHERE session_id = $1;', [sessionId]);
    }

    return NextResponse.json({
      success: true,
      message: 'Order request submitted successfully',
      orderRequest: {
        id: orderRequest.id,
        requestNumber: orderRequest.request_number,
        customerName: orderRequest.customer_name,
        customerEmail: orderRequest.customer_email,
        customerPhone: orderRequest.customer_phone,
        shippingAddress: orderRequest.shipping_address,
        shippingCity: orderRequest.shipping_city,
        shippingState: orderRequest.shipping_state,
        shippingPostalCode: orderRequest.shipping_postal_code,
        subtotal: orderRequest.subtotal,
        deliveryCharge: orderRequest.delivery_charge,
        totalAmount: orderRequest.total_amount,
        status: orderRequest.status,
        items: orderRequest.items,
        createdAt: orderRequest.created_at,
      },
      emailStatus,
    });
  } catch (error: any) {
    console.error('Order request creation error:', error);
    return NextResponse.json({ error: error.message || 'Failed to submit order request' }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = getAuthFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (isAdminOrSuperAdmin(session.role)) {
      const url = new URL(req.url);
      const status = url.searchParams.get('status');
      const requests = await adminGetOrderRequests(status);
      return NextResponse.json({ requests });
    }

    // Authenticated customer
    const requests = await customerGetOrderRequests(session.userId);
    return NextResponse.json({ requests });
  } catch (error: any) {
    console.error('Fetch order requests error:', error);
    return NextResponse.json({ error: 'Failed to fetch order requests' }, { status: 500 });
  }
}
