import { db } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data: categories, error } = await db
      .from('categories')
      .select('*, products:products(id)')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;

    const formattedCategories = (categories || []).map((cat: any) => {
      const productCount = (cat.products || []).length;
      return {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        image: cat.image,
        displayOrder: cat.display_order,
        isActive: cat.is_active,
        _count: {
          products: productCount,
        },
      };
    });

    return NextResponse.json({ categories: formattedCategories });
  } catch (error) {
    console.error('Fetch categories error:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = getAuthFromRequest(req);
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized admin access required' }, { status: 403 });
    }

    const { name, slug, description, image, displayOrder } = await req.json();

    if (!name) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    const generatedSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const { data: category, error } = await db.from('categories').insert({
      name,
      slug: generatedSlug,
      description,
      image,
      display_order: displayOrder ? parseInt(displayOrder) : 0,
    }).select().single();

    if (error) throw error;

    return NextResponse.json({ category }, { status: 201 });
  } catch (error: any) {
    console.error('Create category error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create category' }, { status: 500 });
  }
}
