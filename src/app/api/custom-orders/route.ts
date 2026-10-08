import { verifyAdminFromRequest } from '@/lib/auth';
import { executePrivilegedQuery, executePrivilegedQueryOne } from '@/lib/serverDb';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function mapCustomOrder(order: any) {
  return {
    id: order.id,
    customerName: order.customer_name,
    email: order.email,
    phone: order.phone,
    productType: order.product_type,
    quantity: order.quantity,
    requiredDimensions: order.required_dimensions,
    colorPreference: order.color_preference,
    customText: order.custom_text,
    eventType: order.event_type,
    requiredDeliveryDate: order.required_delivery_date,
    specialInstructions: order.special_instructions,
    fileUrl: order.file_url,
    status: order.status,
    createdAt: order.created_at,
    updatedAt: order.updated_at,
  };
}

export async function GET(req: NextRequest) {
  try {
    const session = verifyAdminFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Admin authorization required' }, { status: 403 });
    }

    const customOrders = await executePrivilegedQuery(
      'SELECT * FROM public.custom_orders ORDER BY created_at DESC;'
    );

    return NextResponse.json({ customOrders: customOrders.map(mapCustomOrder) });
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

    const parsedQuantity = Number.parseInt(String(quantity), 10);
    if (!Number.isInteger(parsedQuantity) || parsedQuantity < 1) {
      return NextResponse.json({ error: 'Quantity must be a positive whole number' }, { status: 400 });
    }

    const customOrder = await executePrivilegedQueryOne(
      `INSERT INTO public.custom_orders (
        customer_name, email, phone, product_type, quantity,
        required_dimensions, color_preference, custom_text, event_type,
        required_delivery_date, special_instructions, file_url, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'NEW')
      RETURNING *;`,
      [
        customerName.trim(),
        email.trim().toLowerCase(),
        phone.trim(),
        productType.trim(),
        parsedQuantity,
        requiredDimensions || null,
        colorPreference || null,
        customText || null,
        eventType || null,
        requiredDeliveryDate || null,
        specialInstructions || null,
        fileUrl || null,
      ]
    );

    if (!customOrder) throw new Error('Custom order could not be created');

    return NextResponse.json({
      message: 'Custom order request received successfully! Our team will contact you within 24 hours with a quote.',
      customOrder: mapCustomOrder(customOrder),
    }, { status: 201 });
  } catch (error: any) {
    console.error('Custom order submission error:', error);
    return NextResponse.json({ error: error.message || 'Failed to submit custom order request' }, { status: 500 });
  }
}
