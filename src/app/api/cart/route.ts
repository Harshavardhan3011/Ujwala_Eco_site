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

    const where = session
      ? { userId: session.userId }
      : { sessionId };

    const cartItems = await db.cartItem.findMany({
      where,
      include: {
        product: {
          include: {
            images: { orderBy: { displayOrder: 'asc' }, take: 1 },
          },
        },
      },
    });

    let subtotal = 0;
    const items = cartItems
      .filter((item) => item.product != null)
      .map((item) => {
      const unitPrice = item.product.discountPrice ?? item.product.price;
      const itemTotal = unitPrice * item.quantity;
      subtotal += itemTotal;

      return {
        id: item.id,
        productId: item.productId,
        productName: item.product.name,
        productSku: item.product.sku,
        productSlug: item.product.slug,
        image: item.product.images[0]?.imageUrl || '/bags/b1.jpeg',
        price: unitPrice,
        originalPrice: item.product.price,
        quantity: item.quantity,
        minOrderQuantity: item.product.minOrderQuantity,
        stockQuantity: item.product.stockQuantity,
        customizationNotes: item.customizationNotes,
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

    const product = await db.product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (quantity < product.minOrderQuantity) {
      return NextResponse.json({
        error: `Minimum order quantity for this product is ${product.minOrderQuantity}`,
      }, { status: 400 });
    }

    if (quantity > product.stockQuantity) {
      return NextResponse.json({
        error: `Only ${product.stockQuantity} items currently in stock`,
      }, { status: 400 });
    }

    const userId = session?.userId || null;
    const activeSessionId = session ? null : (sessionId || 'guest-session');

    // Check if item already in cart
    const existingItem = await db.cartItem.findFirst({
      where: session
        ? { userId, productId }
        : { sessionId: activeSessionId, productId },
    });

    if (existingItem) {
      const updated = await db.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: quantity,
          customizationNotes: customizationNotes ?? existingItem.customizationNotes,
        },
      });
      return NextResponse.json({ item: updated });
    } else {
      const newItem = await db.cartItem.create({
        data: {
          userId,
          sessionId: activeSessionId,
          productId,
          quantity,
          customizationNotes,
        },
      });
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
      await db.cartItem.delete({ where: { id: itemId } });
      return NextResponse.json({ message: 'Item removed from cart' });
    } else if (session) {
      await db.cartItem.deleteMany({ where: { userId: session.userId } });
      return NextResponse.json({ message: 'Cart cleared' });
    }

    return NextResponse.json({ error: 'Item ID or session required' }, { status: 400 });
  } catch (error) {
    console.error('Delete cart item error:', error);
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}
