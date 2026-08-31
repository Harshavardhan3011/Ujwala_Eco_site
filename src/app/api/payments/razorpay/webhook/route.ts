import { executePrivilegedQuery, executePrivilegedQueryOne } from '@/lib/serverDb';
import { verifyWebhookSignature } from '@/lib/razorpay';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing x-razorpay-signature header' }, { status: 400 });
    }

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;
    if (!webhookSecret) {
      return NextResponse.json({
        error: 'Razorpay webhook secret is not configured on the server',
      }, { status: 503 });
    }

    // Verify webhook signature
    const isValid = verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      console.warn('Invalid Razorpay webhook signature received');
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    const paymentEntity = payload.payload?.payment?.entity;
    const orderEntity = payload.payload?.order?.entity;

    const razorpayOrderId = paymentEntity?.order_id || orderEntity?.id;
    const razorpayPaymentId = paymentEntity?.id;

    if (!razorpayOrderId) {
      return NextResponse.json({ message: 'Event acknowledged (no order_id present)' }, { status: 200 });
    }

    // Find internal payment record by razorpay_order_id
    const paymentRecord = await executePrivilegedQueryOne(`
      SELECT 
        p.*,
        row_to_json(o.*) as order,
        COALESCE((SELECT json_agg(oi.*) FROM public.order_items oi WHERE oi.order_id = p.order_id), '[]'::json) as items
      FROM public.payments p
      JOIN public.orders o ON o.id = p.order_id
      WHERE p.razorpay_order_id = $1
      LIMIT 1;
    `, [razorpayOrderId]);

    if (!paymentRecord || !paymentRecord.order) {
      console.warn(`Webhook received for unknown Razorpay order: ${razorpayOrderId}`);
      return NextResponse.json({ message: 'Order not found in system' }, { status: 200 });
    }

    const order = paymentRecord.order;
    const isAlreadyPaid = order.payment_status === 'PAID';

    // Handle events idempotently
    if (event === 'payment.captured' || event === 'order.paid') {
      // 1. Update payment record
      await executePrivilegedQuery(`
        UPDATE public.payments
        SET razorpay_payment_id = COALESCE($1, razorpay_payment_id),
            status = 'SUCCESS',
            updated_at = NOW()
        WHERE id = $2;
      `, [razorpayPaymentId || null, paymentRecord.id]);

      // 2. Update order
      await executePrivilegedQuery(`
        UPDATE public.orders
        SET payment_status = 'PAID',
            order_status = 'CONFIRMED',
            updated_at = NOW()
        WHERE id = $1;
      `, [order.id]);

      // 3. Idempotently deduct stock if not already processed
      if (!isAlreadyPaid && paymentRecord.items) {
        for (const item of paymentRecord.items) {
          await executePrivilegedQuery(`
            UPDATE public.products
            SET stock_quantity = GREATEST(0, stock_quantity - $1)
            WHERE id = $2;
          `, [item.quantity, item.product_id]);
        }
      }

      // 4. Clear customer's cart
      if (order.user_id) {
        await executePrivilegedQuery('DELETE FROM public.cart_items WHERE user_id = $1;', [order.user_id]);
      }
    } else if (event === 'payment.failed') {
      await executePrivilegedQuery(`
        UPDATE public.payments
        SET razorpay_payment_id = COALESCE($1, razorpay_payment_id),
            status = 'FAILED',
            updated_at = NOW()
        WHERE id = $2;
      `, [razorpayPaymentId || null, paymentRecord.id]);

      if (!isAlreadyPaid) {
        await executePrivilegedQuery(`
          UPDATE public.orders
          SET payment_status = 'FAILED',
              updated_at = NOW()
          WHERE id = $1;
        `, [order.id]);
      }
    }

    return NextResponse.json({ received: true, event }, { status: 200 });
  } catch (error: any) {
    console.error('Razorpay webhook processing error:', error);
    return NextResponse.json({ error: error.message || 'Webhook processing failed' }, { status: 500 });
  }
}
