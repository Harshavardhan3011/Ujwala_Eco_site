import { getAuthFromRequest } from '@/lib/auth';
import { executePrivilegedQuery, executePrivilegedQueryOne } from '@/lib/serverDb';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = getAuthFromRequest(req);
    const sessionId = req.headers.get('x-session-id') || undefined;

    if (!session && !sessionId) {
      return NextResponse.json({ items: [], subtotal: 0, shippingFee: 0, totalAmount: 0 });
    }

    let cartItems: any[] = [];
    if (session) {
      cartItems = await executePrivilegedQuery(`
        SELECT 
          ci.*,
          row_to_json(p.*) as product,
          COALESCE((SELECT json_agg(pi.*) FROM public.product_images pi WHERE pi.product_id = p.id), '[]'::json) as images
        FROM public.cart_items ci
        JOIN public.products p ON p.id = ci.product_id
        WHERE ci.user_id = $1;
      `, [session.userId]);
    } else if (sessionId) {
      cartItems = await executePrivilegedQuery(`
        SELECT 
          ci.*,
          row_to_json(p.*) as product,
          COALESCE((SELECT json_agg(pi.*) FROM public.product_images pi WHERE pi.product_id = p.id), '[]'::json) as images
        FROM public.cart_items ci
        JOIN public.products p ON p.id = ci.product_id
        WHERE ci.session_id = $1;
      `, [sessionId]);
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

        const images = item.images || [];
        const primaryImg = images.find((i: any) => i.is_primary) || images[0];
        const image = primaryImg?.image_url || null;

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

    const product = await executePrivilegedQueryOne(
      'SELECT * FROM public.products WHERE id = $1;',
      [productId]
    );

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (quantity > product.stock_quantity) {
      return NextResponse.json({
        error: `Only ${product.stock_quantity} items currently in stock`,
      }, { status: 400 });
    }

    const userId = session?.userId || null;
    const activeSessionId = session ? null : (sessionId || 'guest-session');

    // Check if item already in cart
    const existingItem = userId
      ? await executePrivilegedQueryOne('SELECT * FROM public.cart_items WHERE product_id = $1 AND user_id = $2;', [productId, userId])
      : await executePrivilegedQueryOne('SELECT * FROM public.cart_items WHERE product_id = $1 AND session_id = $2;', [productId, activeSessionId]);

    if (existingItem) {
      const updated = await executePrivilegedQueryOne(`
        UPDATE public.cart_items
        SET quantity = $1,
            customization_notes = COALESCE($2, customization_notes),
            updated_at = NOW()
        WHERE id = $3
        RETURNING *;
      `, [quantity, customizationNotes || null, existingItem.id]);

      return NextResponse.json({ item: updated });
    } else {
      const newItem = await executePrivilegedQueryOne(`
        INSERT INTO public.cart_items (user_id, session_id, product_id, quantity, customization_notes)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
      `, [userId, activeSessionId, productId, quantity, customizationNotes || null]);

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
      await executePrivilegedQuery('DELETE FROM public.cart_items WHERE id = $1;', [itemId]);
      return NextResponse.json({ message: 'Item removed from cart' });
    } else if (session) {
      await executePrivilegedQuery('DELETE FROM public.cart_items WHERE user_id = $1;', [session.userId]);
      return NextResponse.json({ message: 'Cart cleared' });
    }

    return NextResponse.json({ error: 'Item ID or session required' }, { status: 400 });
  } catch (error) {
    console.error('Delete cart item error:', error);
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}
