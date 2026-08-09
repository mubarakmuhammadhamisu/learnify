// ─────────────────────────────────────────────────────────────────────────────
// lib/generateCourseId.ts
//
// The `courses.id` column has NO default value in Supabase — it's plain
// `text`, not something like `gen_random_uuid()`. Every existing row's id
// was hand-picked in a "course_<topic>_<sequence>" style (e.g. course_ds_001,
// course_react_001). The create-course API never supplied an id at all,
// which is why every insert failed with a not-null violation.
//
// This generates a new id in that same readable style. It's safe to change
// this logic later without touching anything else — `id` is never used as a
// join key anywhere in the app; payments/enrollments join on `slug`.
// ─────────────────────────────────────────────────────────────────────────────

import type { SupabaseClient } from '@supabase/supabase-js';

export async function generateCourseId(supabase: SupabaseClient, title: string): Promise<string> {
  const fragment = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .join('')
    .slice(0, 20) || 'course';

  const prefix = `course_${fragment}_`;

  const { data, error } = await supabase
    .from('courses')
    .select('id')
    .like('id', `${prefix}%`);

  if (error) {
    // Don't let a lookup failure block course creation — fall back to a
    // guaranteed-unique (if less pretty) id, and log loudly so it's visible.
    console.error('[generateCourseId] Failed to check existing ids, falling back to timestamp suffix:', error);
    return `${prefix}${Date.now()}`;
  }

  let maxSeq = 0;
  for (const row of data ?? []) {
    const match = /_(\d+)$/.exec(row.id as string);
    if (match) {
      const n = parseInt(match[1], 10);
      if (!Number.isNaN(n) && n > maxSeq) maxSeq = n;
    }
  }

  const nextSeq = String(maxSeq + 1).padStart(3, '0');
  return `${prefix}${nextSeq}`;
}
