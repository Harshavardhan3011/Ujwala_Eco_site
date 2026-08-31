import { executePrivilegedQuery, executePrivilegedQueryOne, adminGetOrderById } from '@/lib/serverDb';
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
      await executePrivilegedQuery(
        `UPDATE public.payments SET status = 'FAILED', updated_at = NOW() WHERE order_id = $1;`,
        [orderId]
      );
      await executePrivilegedQuery(
        `UPDATE public.orders SET payment_status = 'FAILED', updated_at = NOW() WHERE id = $1;`,
        [orderId]
      );

      return NextResponse.json({ error: 'Payment signature verification failed' }, { status: 400 });
    }

    // Fetch existing order to check idempotency
    const existingOrder = await adminGetOrderById(orderId);
    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // If order was already marked paid, avoid double stock decrement (idempotency guard)
    const isAlreadyPaid = existingOrder.payment_status === 'PAID';

    // Update payment record
    await executePrivilegedQuery(`
      UPDATE public.payments
      SET razorpay_payment_id = $1,
          razorpay_signature = $2,
          status = 'SUCCESS',
          updated_at = NOW()
      WHERE order_id = $3;
    `, [razorpay_payment_id, razorpay_signature, orderId]);

    // Update order status
    await executePrivilegedQuery(`
      UPDATE public.orders
      SET payment_status = 'PAID',
          order_status = 'CONFIRMED',
          updated_at = NOW()
      WHERE id = $1;
    `, [orderId]);

    const updatedOrder = await adminGetOrderById(orderId);

    // Idempotent inventory deduction: only deduct if not already paid
    if (!isAlreadyPaid && updatedOrder.items) {
      for (const item of updatedOrder.items) {
        await executePrivilegedQuery(`
          UPDATE public.products
          SET stock_quantity = GREATEST(0, stock_quantity - $1)
          WHERE id = $2;
        `, [item.quantity, item.product_id]);
      }
    }

    // Clear user cart
    if (updatedOrder.user_id) {
      await executePrivilegedQuery('DELETE FROM public.cart_items WHERE user_id = $1;', [updatedOrder.user_id]);
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
