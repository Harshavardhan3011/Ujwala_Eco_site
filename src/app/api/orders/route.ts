import { getAuthFromRequest } from '@/lib/auth';
import {
  adminGetOrders,
  customerGetOrders,
  executePrivilegedQuery,
  withTransaction,
} from '@/lib/serverDb';
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

    let orders: any[] = [];
    if (['admin', 'superadmin'].includes(session.role?.toLowerCase())) {
      orders = await adminGetOrders(status);
    } else {
      orders = await customerGetOrders(session.userId);
    }

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

    // Fetch user's cart items with product details via privileged query
    const cartItems = await executePrivilegedQuery(`
      SELECT 
        ci.*,
        row_to_json(p.*) as product
      FROM public.cart_items ci
      JOIN public.products p ON p.id = ci.product_id
      WHERE ci.user_id = $1;
    `, [session.userId]);

    if (!cartItems || cartItems.length === 0) {
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

    let razorpayOrder: any = null;
    if (paymentMethod === 'RAZORPAY') {
      try {
        razorpayOrder = await createPaymentOrder({
          amount: totalAmount,
          receipt: orderNumber,
          notes: { customerName: shippingName },
        });
      } catch (rzpErr: any) {
        console.error('Razorpay order creation error:', rzpErr);
        return NextResponse.json({
          error: rzpErr.message || 'Failed to initialize payment gateway. Please try again or choose COD.',
        }, { status: 400 });
      }
    }

    // Execute order creation transactionally
    const createdOrder = await withTransaction(async (client) => {
      // 1. Create internal order
      const insertOrderSql = `
        INSERT INTO public.orders (
          order_number, user_id, shipping_name, shipping_phone, shipping_address,
          shipping_city, shipping_state, shipping_postal_code, subtotal, shipping_fee,
          total_amount, order_status, payment_status, payment_method, customization_notes,
          custom_file_url
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING *;
      `;

      const orderRes = await client.query(insertOrderSql, [
        orderNumber,
        session.userId,
        shippingName.trim(),
        shippingPhone.trim(),
        shippingAddress.trim(),
        shippingCity.trim(),
        shippingState?.trim() || 'Andhra Pradesh',
        shippingPostalCode.trim(),
        subtotal,
        shippingFee,
        totalAmount,
        initialOrderStatus,
        initialPaymentStatus,
        paymentMethod,
        customizationNotes || null,
        customFileUrl || null,
      ]);

      const order = orderRes.rows[0];

      // 2. Insert order items
      for (const item of orderItemsData) {
        await client.query(`
          INSERT INTO public.order_items (order_id, product_id, product_name, product_sku, price, quantity, customization_notes)
          VALUES ($1, $2, $3, $4, $5, $6, $7);
        `, [order.id, item.product_id, item.product_name, item.product_sku, item.price, item.quantity, item.customization_notes]);
      }

      // 3. Insert payment record
      if (paymentMethod === 'RAZORPAY' && razorpayOrder) {
        await client.query(`
          INSERT INTO public.payments (order_id, razorpay_order_id, amount, status)
          VALUES ($1, $2, $3, $4);
        `, [order.id, razorpayOrder.id, totalAmount, 'PENDING']);
      } else {
        await client.query(`
          INSERT INTO public.payments (order_id, amount, status)
          VALUES ($1, $2, $3);
        `, [order.id, totalAmount, 'PENDING']);

        // Deduct stock for COD confirmed order
        for (const item of orderItemsData) {
          await client.query(`
            UPDATE public.products
            SET stock_quantity = GREATEST(0, stock_quantity - $1)
            WHERE id = $2;
          `, [item.quantity, item.product_id]);
        }
      }

      // 4. Clear user's cart
      await client.query('DELETE FROM public.cart_items WHERE user_id = $1;', [session.userId]);

      return order;
    });

    return NextResponse.json({
      order: {
        ...createdOrder,
        items: orderItemsData,
      },
      razorpayOrder,
      isCod,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create order error:', error);
    return NextResponse.json({ error: error.message || 'Failed to place order' }, { status: 500 });
  }
}
