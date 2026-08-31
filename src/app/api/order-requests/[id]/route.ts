import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromRequest, isAdminOrSuperAdmin } from '@/lib/auth';
import {
  adminGetOrderRequestById,
  adminUpdateOrderRequestStatus,
  adminConvertOrderRequestToOrder,
} from '@/lib/serverDb';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = getAuthFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const request = await adminGetOrderRequestById(id);

    if (!request) {
      return NextResponse.json({ error: 'Order request not found' }, { status: 404 });
    }

    // Customer can only view own request
    if (!isAdminOrSuperAdmin(session.role) && request.customer_id !== session.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ request });
  } catch (error: any) {
    console.error('Fetch order request detail error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch order request' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = getAuthFromRequest(req);
    if (!session || !isAdminOrSuperAdmin(session.role)) {
      return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
    }

    const { id } = params;
    const body = await req.json();
    const { status, emailSent, emailError } = body;

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    const updated = await adminUpdateOrderRequestStatus(id, status, emailSent, emailError);
    return NextResponse.json({ success: true, request: updated });
  } catch (error: any) {
    console.error('Update order request error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update order request' }, { status: 400 });
  }
}

// Convert Order Request to Confirmed Order
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = getAuthFromRequest(req);
    if (!session || !isAdminOrSuperAdmin(session.role)) {
      return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
    }

    const { id } = params;
    const body = await req.json().catch(() => ({}));
    const { finalConfirmedTotal } = body;

    const result = await adminConvertOrderRequestToOrder(
      id,
      finalConfirmedTotal !== undefined ? parseFloat(finalConfirmedTotal) : undefined
    );

    return NextResponse.json({
      success: true,
      message: 'Order request converted to confirmed order successfully',
      order: result.order,
      orderRequest: result.orderRequest,
    });
  } catch (error: any) {
    console.error('Convert order request error:', error);
    return NextResponse.json({ error: error.message || 'Failed to convert order request' }, { status: 400 });
  }
}
