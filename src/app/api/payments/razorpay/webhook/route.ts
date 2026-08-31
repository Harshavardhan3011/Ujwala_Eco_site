import { db } from '@/lib/db';
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
    const { data: paymentRecord, error: pErr } = await db.from('payments')
      .select('*, order:orders(*, items:order_items(*))')
      .eq('razorpay_order_id', razorpayOrderId)
      .maybeSingle();

    if (pErr || !paymentRecord || !paymentRecord.order) {
      console.warn(`Webhook received for unknown Razorpay order: ${razorpayOrderId}`);
      return NextResponse.json({ message: 'Order not found in system' }, { status: 200 });
    }

    const order = paymentRecord.order;
    const isAlreadyPaid = order.payment_status === 'PAID';

    // Handle events idempotently
    if (event === 'payment.captured' || event === 'order.paid') {
      // 1. Update payment record
      await db.from('payments').update({
        razorpay_payment_id: razorpayPaymentId || paymentRecord.razorpay_payment_id,
        status: 'SUCCESS',
        updated_at: new Date().toISOString(),
      }).eq('id', paymentRecord.id);

      // 2. Update order
      await db.from('orders').update({
        payment_status: 'PAID',
        order_status: 'CONFIRMED',
        updated_at: new Date().toISOString(),
      }).eq('id', order.id);

      // 3. Idempotently deduct stock if not already processed
      if (!isAlreadyPaid && order.items) {
        for (const item of order.items) {
          const { data: prod } = await db.from('products').select('stock_quantity').eq('id', item.product_id).single();
          if (prod) {
            const newStock = Math.max(0, prod.stock_quantity - item.quantity);
            await db.from('products').update({ stock_quantity: newStock }).eq('id', item.product_id);
          }
        }
      }

      // 4. Clear customer's cart
      if (order.user_id) {
        await db.from('cart_items').delete().eq('user_id', order.user_id);
      }
    } else if (event === 'payment.failed') {
      await db.from('payments').update({
        razorpay_payment_id: razorpayPaymentId || paymentRecord.razorpay_payment_id,
        status: 'FAILED',
        updated_at: new Date().toISOString(),
      }).eq('id', paymentRecord.id);

      if (!isAlreadyPaid) {
        await db.from('orders').update({
          payment_status: 'FAILED',
          updated_at: new Date().toISOString(),
        }).eq('id', order.id);
      }
    }

    return NextResponse.json({ received: true, event }, { status: 200 });
  } catch (error: any) {
    console.error('Razorpay webhook processing error:', error);
    return NextResponse.json({ error: error.message || 'Webhook processing failed' }, { status: 500 });
  }
}
