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

    let query = db.from('orders').select(`
      *,
      items:order_items(*),
      payment:payments(*),
      user:profiles(name, email, phone)
    `).order('created_at', { ascending: false });

    if (!['admin', 'superadmin'].includes(session.role?.toLowerCase())) {
      query = query.eq('user_id', session.userId);
    }

    if (status) {
      query = query.eq('order_status', status);
    }

    const { data: orders, error } = await query;
    if (error) throw error;

    return NextResponse.json({ orders: orders || [] });
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
    const { data: cartItems, error: cartErr } = await db.from('cart_items')
      .select('*, product:products(*)')
      .eq('user_id', session.userId);

    if (cartErr || !cartItems || cartItems.length === 0) {
      return NextResponse.json({ error: 'Your shopping cart is empty' }, { status: 400 });
    }

    let subtotal = 0;
    const orderItemsData: any[] = [];

    for (const item of cartItems) {
      const prod = item.product;
      const price = parseFloat(prod.discount_price ?? prod.price);

      if (prod.stock_quantity < item.quantity) {
        return NextResponse.json({
          error: `Insufficient stock for product: ${prod.name}. Available: ${prod.stock_quantity}`,
        }, { status: 400 });
      }

      subtotal += price * item.quantity;
      orderItemsData.push({
        product_id: prod.id,
        product_name: prod.name,
        product_sku: prod.sku,
        price,
        quantity: item.quantity,
        customization_notes: item.customization_notes,
      });
    }

    const shippingFee = subtotal > 1000 ? 0 : 50;
    const totalAmount = subtotal + shippingFee;
    const orderNumber = `UJW-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const { data: order, error: orderErr } = await db.from('orders').insert({
      order_number: orderNumber,
      user_id: session.userId,
      shipping_name: shippingName,
      shipping_phone: shippingPhone,
      shipping_address: shippingAddress,
      shipping_city: shippingCity,
      shipping_state: shippingState || 'Andhra Pradesh',
      shipping_postal_code: shippingPostalCode,
      subtotal,
      shipping_fee: shippingFee,
      total_amount: totalAmount,
      order_status: 'PENDING',
      payment_status: 'PENDING',
      payment_method: paymentMethod,
      customization_notes: customizationNotes,
      custom_file_url: customFileUrl,
    }).select().single();

    if (orderErr) throw orderErr;

    // Insert order items
    const itemsToInsert = orderItemsData.map((item) => ({
      ...item,
      order_id: order.id,
    }));
    await db.from('order_items').insert(itemsToInsert);

    // Create Razorpay payment order
    let razorpayOrder = null;
    if (paymentMethod === 'RAZORPAY') {
      razorpayOrder = await createPaymentOrder({
        amount: totalAmount,
        receipt: order.order_number,
        notes: { orderId: order.id, customerName: shippingName },
      });

      await db.from('payments').insert({
        order_id: order.id,
        razorpay_order_id: razorpayOrder.id,
        amount: totalAmount,
        status: 'PENDING',
      });
    }

    // Clear user cart after order placement
    await db.from('cart_items').delete().eq('user_id', session.userId);

    return NextResponse.json({
      order: {
        ...order,
        items: itemsToInsert,
      },
      razorpayOrder,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create order error:', error);
    return NextResponse.json({ error: error.message || 'Failed to place order' }, { status: 500 });
  }
}
