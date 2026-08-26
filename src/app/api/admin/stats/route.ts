import { db } from '@/lib/db';
import { verifyAdminFromRequest } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const admin = verifyAdminFromRequest(req);
    if (!admin) {
      return NextResponse.json({ error: 'Admin authorization required' }, { status: 403 });
    }

    const [
      { count: totalOrders },
      { count: pendingOrders },
      { count: completedOrders },
      { count: totalCustomers },
      { count: totalProducts },
      { count: lowStockProducts },
      { count: outOfStockProducts },
      { count: customOrdersCount },
      { count: newCustomOrdersCount },
      { count: reviewsCount },
      { data: paidOrders },
      { data: recentOrders },
      { data: recentCustomOrders },
      { data: featuredProducts },
    ] = await Promise.all([
      db.from('orders').select('*', { count: 'exact', head: true }),
      db.from('orders').select('*', { count: 'exact', head: true }).eq('order_status', 'PENDING'),
      db.from('orders').select('*', { count: 'exact', head: true }).eq('order_status', 'DELIVERED'),
      db.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'customer'),
      db.from('products').select('*', { count: 'exact', head: true }),
      db.from('products').select('*', { count: 'exact', head: true }).lte('stock_quantity', 10).gt('stock_quantity', 0),
      db.from('products').select('*', { count: 'exact', head: true }).eq('stock_quantity', 0),
      db.from('custom_orders').select('*', { count: 'exact', head: true }),
      db.from('custom_orders').select('*', { count: 'exact', head: true }).eq('status', 'NEW'),
      db.from('reviews').select('*', { count: 'exact', head: true }),
      db.from('orders').select('total_amount').eq('payment_status', 'PAID'),
      db.from('orders')
        .select('id, order_number, shipping_name, shipping_phone, total_amount, order_status, payment_status, created_at, user:profiles(name, email)')
        .order('created_at', { ascending: false })
        .limit(8),
      db.from('custom_orders')
        .select('id, customer_name, phone, product_type, quantity, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5),
      db.from('products')
        .select('id, name, sku, price, discount_price, stock_quantity, is_featured, images:product_images(image_url)')
        .eq('is_featured', true)
        .limit(6),
    ]);

    const totalRevenue = (paidOrders || []).reduce((sum, o) => sum + parseFloat(o.total_amount || '0'), 0);

    // Map camelCase for frontend
    const mappedOrders = (recentOrders || []).map((o: any) => ({
      id: o.id,
      orderNumber: o.order_number,
      shippingName: o.shipping_name,
      shippingPhone: o.shipping_phone,
      totalAmount: o.total_amount,
      orderStatus: o.order_status,
      paymentStatus: o.payment_status,
      createdAt: o.created_at,
      user: o.user,
    }));

    const mappedCustomOrders = (recentCustomOrders || []).map((co: any) => ({
      id: co.id,
      customerName: co.customer_name,
      phone: co.phone,
      productType: co.product_type,
      quantity: co.quantity,
      status: co.status,
      createdAt: co.created_at,
    }));

    const mappedFeatured = (featuredProducts || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      price: p.price,
      discountPrice: p.discount_price,
      stockQuantity: p.stock_quantity,
      isFeatured: p.is_featured,
      imageUrl: p.images?.[0]?.image_url || null,
    }));

    return NextResponse.json({
      stats: {
        totalOrders: totalOrders || 0,
        pendingOrders: pendingOrders || 0,
        completedOrders: completedOrders || 0,
        totalRevenue,
        totalCustomers: totalCustomers || 0,
        totalProducts: totalProducts || 0,
        lowStockProducts: lowStockProducts || 0,
        outOfStockProducts: outOfStockProducts || 0,
        customOrdersCount: customOrdersCount || 0,
        newCustomOrdersCount: newCustomOrdersCount || 0,
        reviewsCount: reviewsCount || 0,
      },
      recentOrders: mappedOrders,
      recentCustomOrders: mappedCustomOrders,
      featuredProducts: mappedFeatured,
    });
  } catch (error) {
    console.error('Fetch admin stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch admin stats' }, { status: 500 });
  }
}
