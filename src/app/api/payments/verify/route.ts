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
      await db.payment.update({
        where: { orderId },
        data: { status: 'FAILED' },
      });
      await db.order.update({
        where: { id: orderId },
        data: { paymentStatus: 'FAILED' },
      });
      return NextResponse.json({ error: 'Payment signature verification failed' }, { status: 400 });
    }

    // Update payment record
    await db.payment.update({
      where: { orderId },
      data: {
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature || 'simulated',
        status: 'SUCCESS',
      },
    });

    // Update order status
    const order = await db.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'PAID',
        orderStatus: 'CONFIRMED',
      },
      include: { items: true },
    });

    // Deduct stock for ordered items safely
    for (const item of order.items) {
      await db.product.update({
        where: { id: item.productId },
        data: {
          stockQuantity: {
            decrement: item.quantity,
          },
        },
      });
    }

    // Clear cart for the user
    await db.cartItem.deleteMany({
      where: { userId: order.userId },
    });

    return NextResponse.json({
      message: 'Payment verified successfully and order confirmed',
      orderId: order.id,
      orderNumber: order.orderNumber,
    });
  } catch (error: any) {
    console.error('Payment verification error:', error);
    return NextResponse.json({ error: error.message || 'Payment verification failed' }, { status: 500 });
  }
}
