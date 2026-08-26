import { db } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = getAuthFromRequest(req);
    const sessionId = req.headers.get('x-session-id') || undefined;

    if (!session && !sessionId) {
      return NextResponse.json({ items: [], subtotal: 0, shippingFee: 0, totalAmount: 0 });
    }

    let query = db.from('cart_items').select(`
      *,
      product:products(
        id, name, sku, slug, price, discount_price, min_order_quantity, stock_quantity,
        images:product_images(*)
      )
    `);

    if (session) {
      query = query.eq('user_id', session.userId);
    } else if (sessionId) {
      query = query.eq('session_id', sessionId);
    }

    const { data: cartItems, error } = await query;

    if (error) {
      console.error('Cart fetch Supabase error:', error);
      throw error;
    }

    let subtotal = 0;
    const items = (cartItems || [])
      .filter((item: any) => item.product != null)
      .map((item: any) => {
        const prod = item.product;
        const price = parseFloat(prod.price);
        const discountPrice = prod.discount_price ? parseFloat(prod.discount_price) : null;
        const unitPrice = discountPrice ?? price;
        const itemTotal = unitPrice * item.quantity;
        subtotal += itemTotal;

        const primaryImg = (prod.images || []).find((i: any) => i.is_primary) || prod.images?.[0];
        const image = primaryImg ? primaryImg.image_url : '/bags/b1.jpeg';

        return {
          id: item.id,
          productId: item.product_id,
          productName: prod.name,
          productSku: prod.sku,
          productSlug: prod.slug,
          image,
          price: unitPrice,
          originalPrice: price,
          quantity: item.quantity,
          minOrderQuantity: prod.min_order_quantity,
          stockQuantity: prod.stock_quantity,
          customizationNotes: item.customization_notes,
          itemTotal,
        };
      });

    const shippingFee = subtotal > 1000 || subtotal === 0 ? 0 : 50;
    const totalAmount = subtotal + shippingFee;

    return NextResponse.json({
      items,
      subtotal,
      shippingFee,
      totalAmount,
    });
  } catch (error) {
    console.error('Fetch cart error:', error);
    return NextResponse.json({ error: 'Failed to fetch cart' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = getAuthFromRequest(req);
    const { productId, quantity, customizationNotes, sessionId } = await req.json();

    if (!productId || !quantity || quantity < 1) {
      return NextResponse.json({ error: 'Invalid product or quantity' }, { status: 400 });
    }

    const { data: product, error: prodErr } = await db.from('products').select('*').eq('id', productId).single();
    if (prodErr || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (quantity < product.min_order_quantity) {
      return NextResponse.json({
        error: `Minimum order quantity for this product is ${product.min_order_quantity}`,
      }, { status: 400 });
    }

    if (quantity > product.stock_quantity) {
      return NextResponse.json({
        error: `Only ${product.stock_quantity} items currently in stock`,
      }, { status: 400 });
    }

    const userId = session?.userId || null;
    const activeSessionId = session ? null : (sessionId || 'guest-session');

    // Check if item already in cart
    let checkQuery = db.from('cart_items').select('*').eq('product_id', productId);
    if (session) {
      checkQuery = checkQuery.eq('user_id', userId);
    } else {
      checkQuery = checkQuery.eq('session_id', activeSessionId);
    }

    const { data: existingItems } = await checkQuery;
    const existingItem = existingItems && existingItems.length > 0 ? existingItems[0] : null;

    if (existingItem) {
      const { data: updated, error: updateErr } = await db.from('cart_items').update({
        quantity: quantity,
        customization_notes: customizationNotes ?? existingItem.customization_notes,
        updated_at: new Date().toISOString(),
      }).eq('id', existingItem.id).select().single();

      if (updateErr) throw updateErr;
      return NextResponse.json({ item: updated });
    } else {
      const { data: newItem, error: createErr } = await db.from('cart_items').insert({
        user_id: userId,
        session_id: activeSessionId,
        product_id: productId,
        quantity,
        customization_notes: customizationNotes,
      }).select().single();

      if (createErr) throw createErr;
      return NextResponse.json({ item: newItem }, { status: 201 });
    }
  } catch (error: any) {
    console.error('Cart POST error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update cart' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get('itemId');
    const session = getAuthFromRequest(req);

    if (itemId) {
      await db.from('cart_items').delete().eq('id', itemId);
      return NextResponse.json({ message: 'Item removed from cart' });
    } else if (session) {
      await db.from('cart_items').delete().eq('user_id', session.userId);
      return NextResponse.json({ message: 'Cart cleared' });
    }

    return NextResponse.json({ error: 'Item ID or session required' }, { status: 400 });
  } catch (error) {
    console.error('Delete cart item error:', error);
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}
