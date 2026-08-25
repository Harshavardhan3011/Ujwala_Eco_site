import { db } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = getAuthFromRequest(req);
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin authorization required' }, { status: 403 });
    }

    const customOrders = await db.customOrder.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ customOrders });
  } catch (error) {
    console.error('Fetch custom orders error:', error);
    return NextResponse.json({ error: 'Failed to fetch custom orders' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const {
      customerName,
      email,
      phone,
      productType,
      quantity,
      requiredDimensions,
      colorPreference,
      customText,
      eventType,
      requiredDeliveryDate,
      specialInstructions,
      fileUrl,
    } = data;

    if (!customerName || !email || !phone || !productType || !quantity) {
      return NextResponse.json({ error: 'Name, email, phone, product type, and quantity are required' }, { status: 400 });
    }

    const customOrder = await db.customOrder.create({
      data: {
        customerName,
        email,
        phone,
        productType,
        quantity: parseInt(quantity),
        requiredDimensions,
        colorPreference,
        customText,
        eventType,
        requiredDeliveryDate,
        specialInstructions,
        fileUrl,
        status: 'NEW',
      },
    });

    return NextResponse.json({
      message: 'Custom order request received successfully! Our team will contact you within 24 hours with a quote.',
      customOrder,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Custom order submission error:', error);
    return NextResponse.json({ error: error.message || 'Failed to submit custom order request' }, { status: 500 });
  }
}
