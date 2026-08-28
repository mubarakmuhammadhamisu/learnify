// GET /api/admin/courses/[id]
//
// Returns ONE course's full editable record — including instructor, level,
// and the raw modules array — none of which are present on the summary
// `Course` shape returned by GET /api/admin/courses (that endpoint only
// returns a derived lessonsCount, not the raw modules, and never selects
// instructor/level at all).
//
// This exists specifically to safely pre-fill the edit form: reusing the
// already-loaded course list for that would silently omit instructor/level/
// modules and risk wiping them out on save.

import { NextResponse } from 'next/server';
import { getAdminClient, getAuthenticatedAdmin } from '@/lib/adminSupabase';
import { parsePrice } from '@/lib/parsePrice';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    console.warn('[GET /api/admin/courses/[id]] Rejected — no authenticated admin');
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Course id is required' }, { status: 400 });
  }

  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('courses')
    .select('id, slug, title, description, short_description, instructor, level, duration, thumbnail, price, premium_price, is_published, modules, features, curriculum')
    .eq('id', id)
    .single();

  if (error) {
    console.error('[GET /api/admin/courses/[id]] Supabase error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 });
  }

  return NextResponse.json({
    course: {
      id:           data.id,
      slug:         data.slug,
      title:        data.title,
      description:  data.description ?? '',
      shortDescription: data.short_description ?? '',
      instructor:   data.instructor ?? '',
      level:        data.level ?? 'Beginner',
      duration:     data.duration ?? '',
      thumbnail:    data.thumbnail ?? '',
      price:        parsePrice(data.price),
      premiumPrice: parsePrice(data.premium_price),
      published:    data.is_published ?? false,
      modules:      Array.isArray(data.modules) ? data.modules : [],
      features:     Array.isArray(data.features) ? data.features : [],
      curriculum:   Array.isArray(data.curriculum) ? data.curriculum : [],
    },
  });
}
