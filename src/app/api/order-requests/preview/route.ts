import { NextRequest, NextResponse } from 'next/server';
import { executePrivilegedQuery } from '@/lib/serverDb';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items, shippingAddress } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Please add at least one product to your order' }, { status: 400 });
    }

    const productIds = items.map((i: any) => i.productId).filter(Boolean);
    if (productIds.length === 0) {
      return NextResponse.json({ error: 'Invalid product selection' }, { status: 400 });
    }

    // Fetch authoritative product details from database
    const products = await executePrivilegedQuery(
      `SELECT id, name, sku, price, discount_price, stock_quantity, product_status 
       FROM public.products 
       WHERE id = ANY($1::uuid[]);`,
      [productIds]
    );

    const productMap = new Map<string, any>();
    products.forEach((p: any) => productMap.set(p.id, p));

    let subtotal = 0;
    const validatedItems: any[] = [];

    for (const item of items) {
      const prod = productMap.get(item.productId);
      if (!prod) {
        return NextResponse.json({ error: `Product not found: ${item.productId}` }, { status: 400 });
      }
      if (prod.product_status && prod.product_status !== 'ACTIVE') {
        return NextResponse.json({ error: `Product is unavailable: ${prod.name}` }, { status: 400 });
      }

      const qty = parseInt(String(item.quantity || 1), 10);
      if (isNaN(qty) || qty < 1) {
        return NextResponse.json({ error: `Invalid quantity for "${prod.name}". Must be at least 1.` }, { status: 400 });
      }
      if (qty > prod.stock_quantity) {
        return NextResponse.json({
          error: `Only ${prod.stock_quantity} units of "${prod.name}" are currently available in stock.`,
        }, { status: 400 });
      }

      const unitPrice = parseFloat(prod.discount_price ?? prod.price);
      const lineTotal = unitPrice * qty;
      subtotal += lineTotal;

      validatedItems.push({
        productId: prod.id,
        name: prod.name,
        sku: prod.sku || 'UJW-PROD',
        quantity: qty,
        unitPrice,
        lineTotal,
        customizationNotes: item.customizationNotes || null,
      });
    }

    // Centralized delivery calculation: Free over ₹1000, else ₹50
    const deliveryCharge = subtotal >= 1000 ? 0 : 50;
    const grandTotal = subtotal + deliveryCharge;

    return NextResponse.json({
      success: true,
      items: validatedItems,
      subtotal,
      deliveryCharge,
      grandTotal,
    });
  } catch (error: any) {
    console.error('Order preview calculation error:', error);
    return NextResponse.json({ error: error.message || 'Failed to calculate order preview' }, { status: 500 });
  }
}
