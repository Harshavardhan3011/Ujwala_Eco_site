import { db } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';
import { createPaymentOrder } from '@/lib/razorpay';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = getAuthFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    let where: any = {};
    if (session.role !== 'ADMIN') {
      where.userId = session.userId;
    }

    if (status) {
      where.orderStatus = status;
    }

    const orders = await db.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        items: true,
        payment: true,
        user: { select: { name: true, email: true, phone: true } },
      },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Fetch orders error:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = getAuthFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Please login to place an order' }, { status: 401 });
    }

    const {
      shippingName,
      shippingPhone,
      shippingAddress,
      shippingCity,
      shippingState,
      shippingPostalCode,
      paymentMethod = 'RAZORPAY',
      customizationNotes,
      customFileUrl,
    } = await req.json();

    if (!shippingName || !shippingPhone || !shippingAddress || !shippingCity || !shippingPostalCode) {
      return NextResponse.json({ error: 'Complete shipping address is required' }, { status: 400 });
    }

    // Fetch user's cart items
    const cartItems = await db.cartItem.findMany({
      where: { userId: session.userId },
      include: { product: true },
    });

    if (cartItems.length === 0) {
      return NextResponse.json({ error: 'Your shopping cart is empty' }, { status: 400 });
    }

    // Recalculate totals from database prices (NEVER trust frontend prices!)
    let subtotal = 0;
    const orderItemsData = [];

    for (const item of cartItems) {
      const price = item.product.discountPrice ?? item.product.price;
      
      // Stock check
      if (item.product.stockQuantity < item.quantity) {
        return NextResponse.json({
          error: `Insufficient stock for product: ${item.product.name}. Available: ${item.product.stockQuantity}`,
        }, { status: 400 });
      }

      subtotal += price * item.quantity;
      orderItemsData.push({
        productId: item.product.id,
        productName: item.product.name,
        productSku: item.product.sku,
        price,
        quantity: item.quantity,
        customizationNotes: item.customizationNotes,
      });
    }

    const shippingFee = subtotal > 1000 ? 0 : 50;
    const totalAmount = subtotal + shippingFee;

    const orderNumber = `UJW-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const order = await db.order.create({
      data: {
        orderNumber,
        userId: session.userId,
        shippingName,
        shippingPhone,
        shippingAddress,
        shippingCity,
        shippingState: shippingState || 'Andhra Pradesh',
        shippingPostalCode,
        subtotal,
        shippingFee,
        totalAmount,
        orderStatus: 'PENDING',
        paymentStatus: 'PENDING',
        paymentMethod,
        customizationNotes,
        customFileUrl,
        items: {
          create: orderItemsData,
        },
      },
      include: {
        items: true,
      },
    });

    // Create Razorpay payment order
    let razorpayOrder = null;
    if (paymentMethod === 'RAZORPAY') {
      razorpayOrder = await createPaymentOrder({
        amount: totalAmount,
        receipt: order.orderNumber,
        notes: { orderId: order.id, customerName: shippingName },
      });

      await db.payment.create({
        data: {
          orderId: order.id,
          razorpayOrderId: razorpayOrder.id,
          amount: totalAmount,
          status: 'PENDING',
        },
      });
    }

    return NextResponse.json({
      order,
      razorpayOrder,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create order error:', error);
    return NextResponse.json({ error: error.message || 'Failed to place order' }, { status: 500 });
  }
}
