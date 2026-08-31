import { verifyAdminFromRequest } from '@/lib/auth';
import { executePrivilegedQuery, executePrivilegedQueryOne } from '@/lib/serverDb';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const admin = verifyAdminFromRequest(req);
    if (!admin) {
      return NextResponse.json({ error: 'Admin authorization required' }, { status: 403 });
    }

    const [
      totalOrdersRes,
      pendingOrdersRes,
      completedOrdersRes,
      totalCustomersRes,
      totalProductsRes,
      lowStockProductsRes,
      outOfStockProductsRes,
      customOrdersCountRes,
      newCustomOrdersCountRes,
      reviewsCountRes,
      revenueRes,
      recentOrders,
      recentCustomOrders,
      featuredProducts,
    ] = await Promise.all([
      executePrivilegedQueryOne("SELECT COUNT(*)::int as count FROM public.orders;"),
      executePrivilegedQueryOne("SELECT COUNT(*)::int as count FROM public.orders WHERE order_status = 'PENDING';"),
      executePrivilegedQueryOne("SELECT COUNT(*)::int as count FROM public.orders WHERE order_status = 'DELIVERED';"),
      executePrivilegedQueryOne("SELECT COUNT(*)::int as count FROM public.profiles WHERE LOWER(role) = 'customer';"),
      executePrivilegedQueryOne("SELECT COUNT(*)::int as count FROM public.products;"),
      executePrivilegedQueryOne("SELECT COUNT(*)::int as count FROM public.products WHERE stock_quantity <= 10 AND stock_quantity > 0;"),
      executePrivilegedQueryOne("SELECT COUNT(*)::int as count FROM public.products WHERE stock_quantity = 0;"),
      executePrivilegedQueryOne("SELECT COUNT(*)::int as count FROM public.custom_orders;"),
      executePrivilegedQueryOne("SELECT COUNT(*)::int as count FROM public.custom_orders WHERE status = 'NEW';"),
      executePrivilegedQueryOne("SELECT COUNT(*)::int as count FROM public.reviews;"),
      executePrivilegedQueryOne("SELECT COALESCE(SUM(total_amount), 0)::float as revenue FROM public.orders WHERE payment_status = 'PAID';"),
      executePrivilegedQuery(`
        SELECT 
          o.id, o.order_number, o.shipping_name, o.shipping_phone, o.total_amount,
          o.order_status, o.payment_status, o.created_at,
          json_build_object('name', pr.name, 'email', pr.email) as user
        FROM public.orders o
        LEFT JOIN public.profiles pr ON pr.id = o.user_id
        ORDER BY o.created_at DESC
        LIMIT 8;
      `),
      executePrivilegedQuery(`
        SELECT id, customer_name, phone, product_type, quantity, status, created_at
        FROM public.custom_orders
        ORDER BY created_at DESC
        LIMIT 5;
      `),
      executePrivilegedQuery(`
        SELECT 
          p.id, p.name, p.sku, p.price, p.discount_price, p.stock_quantity, p.is_featured,
          (SELECT pi.image_url FROM public.product_images pi WHERE pi.product_id = p.id ORDER BY pi.display_order ASC LIMIT 1) as image_url
        FROM public.products p
        WHERE p.is_featured = true
        LIMIT 6;
      `),
    ]);

    const totalRevenue = revenueRes?.revenue || 0;

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
      price: parseFloat(p.price),
      discountPrice: p.discount_price ? parseFloat(p.discount_price) : null,
      stockQuantity: p.stock_quantity,
      isFeatured: p.is_featured,
      imageUrl: p.image_url || null,
    }));

    return NextResponse.json({
      stats: {
        totalOrders: totalOrdersRes?.count || 0,
        pendingOrders: pendingOrdersRes?.count || 0,
        completedOrders: completedOrdersRes?.count || 0,
        totalRevenue,
        totalCustomers: totalCustomersRes?.count || 0,
        totalProducts: totalProductsRes?.count || 0,
        lowStockProducts: lowStockProductsRes?.count || 0,
        outOfStockProducts: outOfStockProductsRes?.count || 0,
        customOrdersCount: customOrdersCountRes?.count || 0,
        newCustomOrdersCount: newCustomOrdersCountRes?.count || 0,
        reviewsCount: reviewsCountRes?.count || 0,
      },
      recentOrders: mappedOrders,
      recentCustomOrders: mappedCustomOrders,
      featuredProducts: mappedFeatured,
    });
  } catch (error: any) {
    console.error('Fetch admin stats error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch admin stats' }, { status: 500 });
  }
}
