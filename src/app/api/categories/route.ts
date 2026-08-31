import { verifyAdminFromRequest } from '@/lib/auth';
import { adminGetCategories, adminCreateCategory } from '@/lib/serverDb';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const categories = await adminGetCategories();

    const formattedCategories = (categories || []).map((cat: any) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      image: cat.image,
      displayOrder: cat.display_order,
      isActive: cat.is_active,
      _count: {
        products: parseInt(cat.product_count || '0', 10),
      },
    }));

    return NextResponse.json({ categories: formattedCategories });
  } catch (error) {
    console.error('Fetch categories error:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = verifyAdminFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized admin access required' }, { status: 403 });
    }

    const { name, slug, description, image, displayOrder } = await req.json();

    if (!name) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    const generatedSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const category = await adminCreateCategory({
      name,
      slug: generatedSlug,
      description: description || null,
      image: image || null,
      display_order: displayOrder ? parseInt(displayOrder) : 0,
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error: any) {
    console.error('Create category error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create category' }, { status: 500 });
  }
}
