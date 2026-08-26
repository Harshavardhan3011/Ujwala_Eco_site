import { db } from '@/lib/db';
import { verifyAdminFromRequest } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = verifyAdminFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized admin access required' }, { status: 403 });
    }

    const { id } = params;
    const { name, slug, description, image, displayOrder, isActive } = await req.json();

    const updatePayload: any = {};
    if (name !== undefined) updatePayload.name = name;
    if (slug !== undefined) updatePayload.slug = slug;
    if (description !== undefined) updatePayload.description = description;
    if (image !== undefined) updatePayload.image = image;
    if (displayOrder !== undefined) updatePayload.display_order = parseInt(displayOrder);
    if (isActive !== undefined) updatePayload.is_active = Boolean(isActive);
    updatePayload.updated_at = new Date().toISOString();

    const { data: category, error } = await db
      .from('categories')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ category });
  } catch (error: any) {
    console.error('Update category error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = verifyAdminFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized admin access required' }, { status: 403 });
    }

    const { id } = params;
    const { error } = await db.from('categories').delete().eq('id', id);

    if (error) throw error;

    return NextResponse.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
