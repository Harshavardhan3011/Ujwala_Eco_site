import { db } from '@/lib/db';
import { verifyAdminFromRequest } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = verifyAdminFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Admin authorization required' }, { status: 403 });
    }

    const { data: customOrders, error } = await db.from('custom_orders').select('*').order('created_at', { ascending: false });
    if (error) throw error;

    return NextResponse.json({ customOrders: customOrders || [] });
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

    const { data: customOrder, error } = await db.from('custom_orders').insert({
      customer_name: customerName,
      email,
      phone,
      product_type: productType,
      quantity: parseInt(quantity),
      required_dimensions: requiredDimensions,
      color_preference: colorPreference,
      custom_text: customText,
      event_type: eventType,
      required_delivery_date: requiredDeliveryDate,
      special_instructions: specialInstructions,
      file_url: fileUrl,
      status: 'NEW',
    }).select().single();

    if (error) throw error;

    return NextResponse.json({
      message: 'Custom order request received successfully! Our team will contact you within 24 hours with a quote.',
      customOrder,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Custom order submission error:', error);
    return NextResponse.json({ error: error.message || 'Failed to submit custom order request' }, { status: 500 });
  }
}
