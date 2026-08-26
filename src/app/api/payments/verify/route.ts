import { db } from '@/lib/db';
import { verifyPaymentSignature } from '@/lib/razorpay';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

    if (!orderId || !razorpay_order_id || !razorpay_payment_id) {
      return NextResponse.json({ error: 'Missing payment parameters' }, { status: 400 });
    }

    const isSignatureValid = verifyPaymentSignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature: razorpay_signature || 'simulated',
    });

    if (!isSignatureValid) {
      await db.from('payments').update({ status: 'FAILED' }).eq('order_id', orderId);
      await db.from('orders').update({ payment_status: 'FAILED' }).eq('id', orderId);
      return NextResponse.json({ error: 'Payment signature verification failed' }, { status: 400 });
    }

    // Update payment record
    await db.from('payments').update({
      razorpay_payment_id: razorpay_payment_id,
      razorpay_signature: razorpay_signature || 'simulated',
      status: 'SUCCESS',
      updated_at: new Date().toISOString(),
    }).eq('order_id', orderId);

    // Update order status
    const { data: order, error: orderErr } = await db.from('orders').update({
      payment_status: 'PAID',
      order_status: 'CONFIRMED',
      updated_at: new Date().toISOString(),
    }).eq('id', orderId).select('*, items:order_items(*)').single();

    if (orderErr) throw orderErr;

    // Deduct stock for ordered items
    for (const item of (order.items || [])) {
      const { data: prod } = await db.from('products').select('stock_quantity').eq('id', item.product_id).single();
      if (prod) {
        const newStock = Math.max(0, prod.stock_quantity - item.quantity);
        await db.from('products').update({ stock_quantity: newStock }).eq('id', item.product_id);
      }
    }

    // Clear cart for user
    await db.from('cart_items').delete().eq('user_id', order.user_id);

    return NextResponse.json({
      message: 'Payment verified successfully and order confirmed',
      orderId: order.id,
      orderNumber: order.order_number,
    });
  } catch (error: any) {
    console.error('Payment verification error:', error);
    return NextResponse.json({ error: error.message || 'Payment verification failed' }, { status: 500 });
  }
}
