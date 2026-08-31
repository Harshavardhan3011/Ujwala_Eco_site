import { db } from '@/lib/db';
import { verifyPaymentSignature, isRazorpayConfigured } from '@/lib/razorpay';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

    if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing required payment verification parameters' }, { status: 400 });
    }

    if (!isRazorpayConfigured()) {
      return NextResponse.json({ error: 'Razorpay gateway is not configured on the server' }, { status: 400 });
    }

    // Verify HMAC-SHA256 signature server-side
    const isSignatureValid = verifyPaymentSignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    if (!isSignatureValid) {
      console.warn(`Payment signature verification failed for order ${orderId}`);
      await db.from('payments').update({
        status: 'FAILED',
        updated_at: new Date().toISOString(),
      }).eq('order_id', orderId);

      await db.from('orders').update({
        payment_status: 'FAILED',
        updated_at: new Date().toISOString(),
      }).eq('id', orderId);

      return NextResponse.json({ error: 'Payment signature verification failed' }, { status: 400 });
    }

    // Fetch existing order to check idempotency
    const { data: existingOrder, error: fetchErr } = await db.from('orders')
      .select('*, items:order_items(*)')
      .eq('id', orderId)
      .single();

    if (fetchErr || !existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // If order was already marked paid, avoid double stock decrement (idempotency guard)
    const isAlreadyPaid = existingOrder.payment_status === 'PAID';

    // Update payment record
    await db.from('payments').update({
      razorpay_payment_id: razorpay_payment_id,
      razorpay_signature: razorpay_signature,
      status: 'SUCCESS',
      updated_at: new Date().toISOString(),
    }).eq('order_id', orderId);

    // Update order status
    const { data: updatedOrder, error: orderErr } = await db.from('orders').update({
      payment_status: 'PAID',
      order_status: 'CONFIRMED',
      updated_at: new Date().toISOString(),
    }).eq('id', orderId).select('*, items:order_items(*)').single();

    if (orderErr) throw orderErr;

    // Idempotent inventory deduction: only deduct if not already paid
    if (!isAlreadyPaid && updatedOrder.items) {
      for (const item of updatedOrder.items) {
        const { data: prod } = await db.from('products').select('stock_quantity').eq('id', item.product_id).single();
        if (prod) {
          const newStock = Math.max(0, prod.stock_quantity - item.quantity);
          await db.from('products').update({ stock_quantity: newStock }).eq('id', item.product_id);
        }
      }
    }

    // Clear user cart
    if (updatedOrder.user_id) {
      await db.from('cart_items').delete().eq('user_id', updatedOrder.user_id);
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully and order confirmed',
      orderId: updatedOrder.id,
      orderNumber: updatedOrder.order_number,
    });
  } catch (error: any) {
    console.error('Payment verification error:', error);
    return NextResponse.json({ error: error.message || 'Payment verification failed' }, { status: 500 });
  }
}
