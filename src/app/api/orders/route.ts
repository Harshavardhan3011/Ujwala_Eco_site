import { db } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';
import { createPaymentOrder, isRazorpayConfigured } from '@/lib/razorpay';
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
      paymentMethod = 'COD',
      customizationNotes,
      customFileUrl,
    } = await req.json();

    if (!shippingName || !shippingPhone || !shippingAddress || !shippingCity || !shippingPostalCode) {
      return NextResponse.json({ error: 'Complete shipping address is required' }, { status: 400 });
    }

    // If customer selected Razorpay, verify gateway is configured
    if (paymentMethod === 'RAZORPAY' && !isRazorpayConfigured()) {
      return NextResponse.json({
        error: 'Online payment is temporarily unavailable. Please choose Cash on Delivery or try again later.',
      }, { status: 400 });
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

    // Server-side authoritative price retrieval & stock validation
    for (const item of cartItems) {
      const prod = item.product;
      if (!prod || prod.product_status === 'DISCONTINUED') {
        return NextResponse.json({
          error: `Product "${prod?.name || 'Item'}" is currently unavailable.`,
        }, { status: 400 });
      }

      if (prod.stock_quantity < item.quantity) {
        return NextResponse.json({
          error: `Insufficient stock for "${prod.name}". Available quantity: ${prod.stock_quantity}`,
        }, { status: 400 });
      }

      const unitPrice = parseFloat(prod.discount_price ?? prod.price);
      subtotal += unitPrice * item.quantity;

      orderItemsData.push({
        product_id: prod.id,
        product_name: prod.name,
        product_sku: prod.sku,
        price: unitPrice,
        quantity: item.quantity,
        customization_notes: item.customization_notes || null,
      });
    }

    const shippingFee = subtotal >= 1000 ? 0 : 50;
    const totalAmount = subtotal + shippingFee;
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `UJW-${timestamp}-${randomSuffix}`;

    const isCod = paymentMethod === 'COD';
    const initialOrderStatus = isCod ? 'CONFIRMED' : 'PENDING';
    const initialPaymentStatus = 'PENDING';

    // 1. Create internal order in Supabase
    const { data: order, error: orderErr } = await db.from('orders').insert({
      order_number: orderNumber,
      user_id: session.userId,
      shipping_name: shippingName.trim(),
      shipping_phone: shippingPhone.trim(),
      shipping_address: shippingAddress.trim(),
      shipping_city: shippingCity.trim(),
      shipping_state: shippingState?.trim() || 'Andhra Pradesh',
      shipping_postal_code: shippingPostalCode.trim(),
      subtotal,
      shipping_fee: shippingFee,
      total_amount: totalAmount,
      order_status: initialOrderStatus,
      payment_status: initialPaymentStatus,
      payment_method: paymentMethod,
      customization_notes: customizationNotes || null,
      custom_file_url: customFileUrl || null,
    }).select().single();

    if (orderErr || !order) {
      console.error('Order insertion error:', orderErr);
      throw new Error('Failed to create order record in database.');
    }

    // 2. Insert order items
    const itemsToInsert = orderItemsData.map((item) => ({
      ...item,
      order_id: order.id,
    }));
    const { error: itemsErr } = await db.from('order_items').insert(itemsToInsert);
    if (itemsErr) {
      console.error('Order items insertion error:', itemsErr);
      throw new Error('Failed to save order items.');
    }

    // 3. Handle payment method specific processing
    let razorpayOrder = null;

    if (paymentMethod === 'RAZORPAY') {
      try {
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
      } catch (rzpErr: any) {
        console.error('Razorpay order creation error:', rzpErr);
        // Rollback order if razorpay creation fails
        await db.from('orders').delete().eq('id', order.id);
        return NextResponse.json({
          error: rzpErr.message || 'Failed to initialize payment gateway. Please try again or choose COD.',
        }, { status: 400 });
      }
    } else {
      // For COD: create pending payment record
      await db.from('payments').insert({
        order_id: order.id,
        amount: totalAmount,
        status: 'PENDING',
      });

      // Deduct stock for COD confirmed order
      for (const item of itemsToInsert) {
        const { data: prod } = await db.from('products').select('stock_quantity').eq('id', item.product_id).single();
        if (prod) {
          const newStock = Math.max(0, prod.stock_quantity - item.quantity);
          await db.from('products').update({ stock_quantity: newStock }).eq('id', item.product_id);
        }
      }
    }

    // 4. Clear user's cart
    await db.from('cart_items').delete().eq('user_id', session.userId);

    return NextResponse.json({
      order: {
        ...order,
        items: itemsToInsert,
      },
      razorpayOrder,
      isCod,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create order error:', error);
    return NextResponse.json({ error: error.message || 'Failed to place order' }, { status: 500 });
  }
}
