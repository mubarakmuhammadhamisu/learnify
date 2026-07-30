// GET /api/admin/courses
//
// Returns all courses enriched with enrollment counts, total revenue,
// and completion rates. Shape matches the Course interface in mock-data.ts.

import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient, getAuthenticatedAdmin } from '@/lib/adminSupabase';
import { checkCsrfHeader } from '@/lib/csrf';
import { parsePrice } from '@/lib/parsePrice';

export async function GET() {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    console.warn('[GET /api/admin/courses] Rejected — no authenticated admin');
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const supabase = getAdminClient();

  // ── 1. All courses ───────────────────────────────────────────────────────
  const { data: courses, error } = await supabase
    .from('courses')
    .select('id, slug, title, description, price, premium_price, is_published, modules')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[GET /api/admin/courses] Supabase error fetching courses:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!courses || courses.length === 0) {
    console.log('[GET /api/admin/courses] No courses found — returning empty array');
    return NextResponse.json({ courses: [] });
  }

  console.log(`[GET /api/admin/courses] Fetched ${courses.length} course(s)`);

  const slugs = courses.map((c) => c.slug);

  // ── 2. Enrollment counts + completion rates per course ───────────────────
  const { data: enrollments, error: enrollError } = await supabase
    .from('enrollments')
    .select('course_slug, progress')
    .in('course_slug', slugs);

  if (enrollError) {
    console.error('[GET /api/admin/courses] Supabase error fetching enrollments (non-fatal, continuing with 0 counts):', enrollError);
  }

  const enrollCountMap:  Record<string, number> = {};
  const completedMap:    Record<string, number> = {};
  for (const e of enrollments ?? []) {
    enrollCountMap[e.course_slug]  = (enrollCountMap[e.course_slug]  ?? 0) + 1;
    if (e.progress === 100) completedMap[e.course_slug] = (completedMap[e.course_slug] ?? 0) + 1;
  }

  // ── 3. Total revenue per course ──────────────────────────────────────────
  const { data: payments, error: paymentError } = await supabase
    .from('payments')
    .select('course_slug, amount_kobo')
    .eq('status', 'success')
    .in('course_slug', slugs);

  if (paymentError) {
    console.error('[GET /api/admin/courses] Supabase error fetching payments (non-fatal, continuing with 0 revenue):', paymentError);
  }

  const revenueMap: Record<string, number> = {};
  for (const p of payments ?? []) {
    revenueMap[p.course_slug] = (revenueMap[p.course_slug] ?? 0) + Math.round(p.amount_kobo / 100);
  }

  // ── 4. Count lessons from modules JSONB ─────────────────────────────────
  function countLessons(modules: unknown): number {
    if (!Array.isArray(modules)) return 0;
    return modules.reduce(
      (sum: number, m: { lessons?: unknown[] }) => sum + (Array.isArray(m?.lessons) ? m.lessons.length : 0),
      0,
    );
  }

  // ── 5. Assemble ──────────────────────────────────────────────────────────
  const result = courses.map((c) => {
    const enrolled  = enrollCountMap[c.slug] ?? 0;
    const completed = completedMap[c.slug]    ?? 0;
    return {
      id:             c.id,
      slug:           c.slug,
      title:          c.title,
      description:    c.description ?? '',
      price:          parsePrice(c.price),
      premiumPrice:   parsePrice(c.premium_price),
      enrolledCount:  enrolled,
      totalRevenue:   revenueMap[c.slug] ?? 0,
      published:      c.is_published ?? false,
      lessonsCount:   countLessons(c.modules),
      completionRate: enrolled > 0 ? Math.round((completed / enrolled) * 100) : 0,
    };
  });

  return NextResponse.json({ courses: result });
}

// ── POST — create new course ──────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const csrfError = checkCsrfHeader(req);
  if (csrfError) return csrfError;

  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    console.warn('[POST /api/admin/courses] Rejected — no authenticated admin');
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json().catch((e) => {
    console.error('[POST /api/admin/courses] Failed to parse request body as JSON:', e);
    return null;
  });
  if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });

  const { title, description, instructor, level, price, premiumPrice, published, modules } = body;
  console.log('[POST /api/admin/courses] Incoming payload:', { title, instructor, level, price, premiumPrice, published, moduleCount: Array.isArray(modules) ? modules.length : 'not an array' });

  if (!title || !description || !instructor || price === undefined) {
    console.warn('[POST /api/admin/courses] Validation failed — missing required field(s)');
    return NextResponse.json({ error: 'title, description, instructor, price are required' }, { status: 400 });
  }

  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    + '-' + Date.now();

  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('courses')
    .insert({
      slug,
      title,
      description,
      instructor: instructor ?? '',
      level:      level ?? 'Beginner',
      price:      String(price),
      premium_price: premiumPrice ? String(premiumPrice) : null,
      is_published: published ?? false,
      modules:    modules ?? [],
      features:   [],
      curriculum: [],
    })
    .select('id, slug, title, description, price, premium_price, is_published, modules')
    .single();

  if (error) {
    console.error('[POST /api/admin/courses] Supabase insert error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    console.error('[POST /api/admin/courses] Insert succeeded but no data returned');
    return NextResponse.json({ error: 'Course created but no data returned' }, { status: 500 });
  }

  console.log('[POST /api/admin/courses] Course created successfully:', data.id, data.slug);

  return NextResponse.json({
    course: {
      id:             data.id,
      slug:           data.slug,
      title:          data.title,
      description:    data.description ?? '',
      price:          parsePrice(data.price),
      premiumPrice:   parsePrice(data.premium_price),
      enrolledCount:  0,
      totalRevenue:   0,
      published:      data.is_published ?? false,
      lessonsCount:   0,
      completionRate: 0,
    },
  }, { status: 201 });
}

// ── PUT — edit an existing course (full update, slug is immutable) ────────────
// Body: { courseId, title, description, instructor, level, price, premiumPrice, published, modules }
// NOTE: slug is intentionally never updated here — payments and enrollments
// join to courses via course_slug, so changing it would silently disconnect
// a course from its historical revenue/enrollment data.
export async function PUT(req: NextRequest) {
  const csrfError = checkCsrfHeader(req);
  if (csrfError) return csrfError;

  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    console.warn('[PUT /api/admin/courses] Rejected — no authenticated admin');
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json().catch((e) => {
    console.error('[PUT /api/admin/courses] Failed to parse request body as JSON:', e);
    return null;
  });
  if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });

  const { courseId, title, description, instructor, level, price, premiumPrice, published, modules } = body;
  console.log('[PUT /api/admin/courses] Incoming edit:', { courseId, title, instructor, level, price, premiumPrice, published, moduleCount: Array.isArray(modules) ? modules.length : 'not an array' });

  if (!courseId || !title || !description || !instructor || price === undefined) {
    console.warn('[PUT /api/admin/courses] Validation failed — missing required field(s)');
    return NextResponse.json({ error: 'courseId, title, description, instructor, price are required' }, { status: 400 });
  }

  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('courses')
    .update({
      title,
      description,
      instructor:    instructor ?? '',
      level:         level ?? 'Beginner',
      price:         String(price),
      premium_price: premiumPrice ? String(premiumPrice) : null,
      is_published:  published ?? false,
      modules:       modules ?? [],
    })
    .eq('id', courseId)
    .select('id, slug, title, description, price, premium_price, is_published, modules')
    .single();

  if (error) {
    console.error('[PUT /api/admin/courses] Supabase update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    console.error('[PUT /api/admin/courses] Update succeeded but no data returned — courseId may not exist:', courseId);
    return NextResponse.json({ error: 'Course not found' }, { status: 404 });
  }

  console.log('[PUT /api/admin/courses] Course updated successfully:', data.id, data.slug);

  return NextResponse.json({
    course: {
      id:             data.id,
      slug:           data.slug,
      title:          data.title,
      description:    data.description ?? '',
      price:          parsePrice(data.price),
      premiumPrice:   parsePrice(data.premium_price),
      published:      data.is_published ?? false,
    },
  });
}

// ── PATCH — toggle is_published for a course ──────────────────────────────────
// Body: { courseId: string; published: boolean }
export async function PATCH(req: NextRequest) {
  const csrfError = checkCsrfHeader(req);
  if (csrfError) return csrfError;

  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    console.warn('[PATCH /api/admin/courses] Rejected — no authenticated admin');
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json().catch((e) => {
    console.error('[PATCH /api/admin/courses] Failed to parse request body as JSON:', e);
    return null;
  });
  if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });

  const { courseId, published } = body;
  console.log('[PATCH /api/admin/courses] Toggling publish state:', { courseId, published });

  if (!courseId || typeof published !== 'boolean') {
    console.warn('[PATCH /api/admin/courses] Validation failed:', { courseId, published });
    return NextResponse.json({ error: 'courseId and published (boolean) are required' }, { status: 400 });
  }

  const supabase = getAdminClient();
  const { error } = await supabase
    .from('courses')
    .update({ is_published: published })
    .eq('id', courseId);

  if (error) {
    console.error('[PATCH /api/admin/courses] Supabase update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  console.log('[PATCH /api/admin/courses] Updated successfully:', courseId);
  return NextResponse.json({ success: true });
}

// ── DELETE — remove a course ──────────────────────────────────────────────────
// Body: { courseId: string }
export async function DELETE(req: NextRequest) {
  const csrfError = checkCsrfHeader(req);
  if (csrfError) return csrfError;

  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    console.warn('[DELETE /api/admin/courses] Rejected — no authenticated admin');
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json().catch((e) => {
    console.error('[DELETE /api/admin/courses] Failed to parse request body as JSON:', e);
    return null;
  });
  if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });

  const { courseId } = body;
  console.log('[DELETE /api/admin/courses] Deleting course:', courseId);

  if (!courseId) {
    console.warn('[DELETE /api/admin/courses] Validation failed — missing courseId');
    return NextResponse.json({ error: 'courseId is required' }, { status: 400 });
  }

  const supabase = getAdminClient();
  const { error } = await supabase
    .from('courses')
    .delete()
    .eq('id', courseId);

  if (error) {
    console.error('[DELETE /api/admin/courses] Supabase delete error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  console.log('[DELETE /api/admin/courses] Deleted successfully:', courseId);
  return NextResponse.json({ success: true });
}
