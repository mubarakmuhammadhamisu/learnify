'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { AdminTable, Column } from '@/components/admin/shared/AdminTable';
import { FilterBar } from '@/components/admin/shared/FilterBar';
import { Modal } from '@/components/admin/shared/Modal';
import { Course } from '@/components/admin/mock-data';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ToggleLeft, ToggleRight, BookOpen, Plus, Trash2,
  ArrowLeft, Save, Eye, EyeOff, GripVertical,
  Video, FileText, HelpCircle, X, ChevronDown, ChevronUp, Check, Pencil,
} from 'lucide-react';
import dynamic from 'next/dynamic';

// @hello-pangea/dnd uses browser-only APIs (pointer events, requestAnimationFrame).
// It must NEVER run on the server — dynamic import with ssr:false prevents the crash.
const { DragDropContext, Droppable, Draggable } = {
  DragDropContext: dynamic(
    () => import('@hello-pangea/dnd').then((m) => m.DragDropContext),
    { ssr: false }
  ),
  Droppable: dynamic(
    () => import('@hello-pangea/dnd').then((m) => m.Droppable),
    { ssr: false }
  ),
  Draggable: dynamic(
    () => import('@hello-pangea/dnd').then((m) => m.Draggable),
    { ssr: false }
  ),
};

import type { VideoProvider } from '@/lib/Course';

// ── Lesson types (mirrors lib/Course.ts but self-contained for mock) ──────────
type LessonType = 'video' | 'reading' | 'quiz';

interface VideoContent {
  videoUrl:       string;
  duration:       string;
  videoProvider?: VideoProvider;
}
interface ReadingContent { markdownBody: string; }
interface QuizQuestion   { id: string; question: string; options: string[]; correctAnswer: number; points: number; }
interface QuizContent    { questions: QuizQuestion[]; }

interface DraftLesson {
  id: string;
  title: string;
  type: LessonType;
  content: VideoContent | ReadingContent | QuizContent;
  expanded: boolean;
}

interface DraftModule {
  id: string;
  title: string;
  lessons: DraftLesson[];
  collapsed: boolean;
}

interface CourseForm {
  title: string;
  description: string;
  shortDescription: string;
  instructor: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  price: string;
  premiumPrice: string;
  duration: string;
  thumbnail: string;
  features: string[];
  curriculum: string[];
  published: boolean;
  modules: DraftModule[];
}

const BLANK_FORM: CourseForm = {
  title: '',
  description: '',
  shortDescription: '',
  instructor: '',
  level: 'Beginner',
  price: '',
  premiumPrice: '',
  duration: '',
  thumbnail: '',
  features: [],
  curriculum: [],
  published: false,
  modules: [],
};

function defaultContent(type: LessonType): VideoContent | ReadingContent | QuizContent {
  if (type === 'video')   return { videoUrl: '', duration: '', videoProvider: 'youtube' };
  if (type === 'reading') return { markdownBody: '' };
  return { questions: [{ id: `q-${Date.now()}`, question: '', options: ['', '', '', ''], correctAnswer: 0, points: 10 }] };
}

// Small reusable editor for flat string-array fields (features, curriculum).
// Both are stored as plain jsonb string arrays in Supabase — no nested shape.
function TagListEditor({
  label, placeholder, items, onChange,
}: {
  label: string;
  placeholder: string;
  items: string[];
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState('');

  const addItem = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onChange([...items, trimmed]);
    setDraft('');
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1.5">{label} <span className="text-gray-600">(optional)</span></label>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addItem(); } }}
          placeholder={placeholder}
          className={inputCls}
        />
        <button
          type="button"
          onClick={addItem}
          className="shrink-0 flex items-center gap-1 px-4 rounded-lg border border-indigo-500/30 text-indigo-400 hover:border-indigo-500/60 hover:bg-indigo-500/10 transition text-sm"
        >
          <Plus size={14} /> Add
        </button>
      </div>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {items.map((item, i) => (
            <span key={`${item}-${i}`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-800 border border-gray-700 text-xs text-gray-200">
              {item}
              <button type="button" onClick={() => removeItem(i)} className="text-gray-500 hover:text-red-400 transition">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

const inputCls = 'w-full rounded-lg bg-gray-800 border border-indigo-500/20 px-3 py-2.5 text-white placeholder:text-gray-500 outline-none focus:border-indigo-500/60 transition text-sm';

// ── Main component ────────────────────────────────────────────────────────────
export default function CoursesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pageMode, setPageMode] = useState<'list' | 'create' | 'edit'>('list');
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);

  // ── List-mode state ───────────────────────────────────────────────────────
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [publishedFilter, setPublishedFilter] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid');
  const [toggledCourses, setToggledCourses] = useState<Record<string, boolean>>({});
  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    console.log('[CoursesPage] Fetching /api/admin/courses…');
    fetch('/api/admin/courses')
      .then((r) => {
        console.log('[CoursesPage] Response status:', r.status, r.statusText);
        if (!r.ok) {
          return r.json().then((body) => {
            console.error('[CoursesPage] API returned error body:', body);
            throw new Error(body?.error ?? `Request failed with status ${r.status}`);
          }).catch((parseErr) => {
            console.error('[CoursesPage] Could not parse error response as JSON:', parseErr);
            throw new Error(`Request failed with status ${r.status}`);
          });
        }
        return r.json();
      })
      .then((data) => {
        console.log('[CoursesPage] Raw API payload:', data);
        const rawCourses = Array.isArray(data?.courses) ? data.courses : [];
        if (!Array.isArray(data?.courses)) {
          console.warn('[CoursesPage] data.courses was not an array — defaulting to []. Payload was:', data);
        }
        // Defensive normalisation — guarantees every field the UI reads from
        // (price, totalRevenue, enrolledCount, completionRate, etc.) is always
        // a safe primitive, even if the API ever returns a malformed/partial row.
        const safeCourses: Course[] = rawCourses.map((c: Partial<Course>, idx: number) => {
          if (c == null || typeof c !== 'object') {
            console.error(`[CoursesPage] courses[${idx}] is not an object:`, c);
          }
          if (typeof c?.price !== 'number') {
            console.warn(`[CoursesPage] courses[${idx}].price is not a number ("${c?.id ?? 'unknown id'}"):`, c?.price);
          }
          if (typeof c?.id !== 'string') {
            console.error(`[CoursesPage] courses[${idx}].id is missing or not a string:`, c);
          }
          return {
            id:             typeof c?.id === 'string' ? c.id : `unknown-${idx}`,
            slug:           typeof c?.slug === 'string' ? c.slug : '',
            title:          typeof c?.title === 'string' ? c.title : 'Untitled course',
            description:    typeof c?.description === 'string' ? c.description : '',
            price:          typeof c?.price === 'number' && !Number.isNaN(c.price) ? c.price : 0,
            premiumPrice:   typeof c?.premiumPrice === 'number' && !Number.isNaN(c.premiumPrice) ? c.premiumPrice : 0,
            enrolledCount:  typeof c?.enrolledCount === 'number' ? c.enrolledCount : 0,
            totalRevenue:   typeof c?.totalRevenue === 'number' ? c.totalRevenue : 0,
            published:      typeof c?.published === 'boolean' ? c.published : false,
            lessonsCount:   typeof c?.lessonsCount === 'number' ? c.lessonsCount : 0,
            completionRate: typeof c?.completionRate === 'number' ? c.completionRate : 0,
          };
        });
        console.log('[CoursesPage] Normalised courses ready for render:', safeCourses);
        setCourses(safeCourses);
        setFetchError(null);
        setLoading(false);
      })
      .catch((err) => {
        console.error('[CoursesPage] Fetch failed:', err);
        setFetchError(err instanceof Error ? err.message : 'Failed to load courses.');
        setLoading(false);
      });
  }, []);

  // ── Enter edit mode from ?edit=<courseId> ───────────────────────────────────
  // Fetches the FULL course record (including instructor/level/raw modules,
  // none of which exist on the summary `Course` list shape) from a dedicated
  // single-course endpoint — deliberately not reusing the already-loaded
  // `courses` list, since that would silently populate the edit form with
  // missing instructor/level/modules and wipe them on save.
  useEffect(() => {
    const editId = searchParams.get('edit');
    if (!editId) return;

    console.log('[CoursesPage] Entering edit mode, fetching full record for:', editId);
    fetch(`/api/admin/courses/${editId}`)
      .then((r) => {
        if (!r.ok) throw new Error(`Request failed with status ${r.status}`);
        return r.json();
      })
      .then((data) => {
        const c = data?.course;
        if (!c) {
          console.error('[CoursesPage] Single-course fetch returned no course:', data);
          return;
        }
        setForm({
          title:        typeof c.title === 'string' ? c.title : '',
          description:  typeof c.description === 'string' ? c.description : '',
          shortDescription: typeof c.shortDescription === 'string' ? c.shortDescription : '',
          instructor:   typeof c.instructor === 'string' ? c.instructor : '',
          level:        c.level === 'Intermediate' || c.level === 'Advanced' ? c.level : 'Beginner',
          price:        typeof c.price === 'number' ? String(c.price) : '',
          premiumPrice: typeof c.premiumPrice === 'number' && c.premiumPrice > 0 ? String(c.premiumPrice) : '',
          duration:     typeof c.duration === 'string' ? c.duration : '',
          thumbnail:    typeof c.thumbnail === 'string' ? c.thumbnail : '',
          features:     Array.isArray(c.features) ? c.features.filter((f: unknown) => typeof f === 'string') : [],
          curriculum:   Array.isArray(c.curriculum) ? c.curriculum.filter((t: unknown) => typeof t === 'string') : [],
          published:    typeof c.published === 'boolean' ? c.published : false,
          // Saved modules/lessons never have collapsed/expanded — those are
          // UI-only flags stripped out before every save (see handleSaveCourse).
          // Re-add them here with sane defaults so DraftModule/DraftLesson
          // stay fully-shaped for the editor.
          modules: (Array.isArray(c.modules) ? c.modules : []).map((m: Omit<DraftModule, 'collapsed'>) => ({
            ...m,
            collapsed: false,
            lessons: (m.lessons ?? []).map((l: Omit<DraftLesson, 'expanded'>) => ({ ...l, expanded: false })),
          })),
        });
        setEditingCourseId(c.id);
        setPageMode('edit');
      })
      .catch((err) => {
        console.error('[CoursesPage] Failed to load course for editing:', err);
        setFetchError(err instanceof Error ? err.message : 'Failed to load course for editing.');
      });
  }, [searchParams]);

  // ── Create-mode state ─────────────────────────────────────────────────────
  const [form, setForm] = useState<CourseForm>(BLANK_FORM);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // ── List helpers ──────────────────────────────────────────────────────────
  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase());
      const isPublished = toggledCourses[course.id] !== undefined ? toggledCourses[course.id] : course.published;
      const matchesPublished =
        publishedFilter === '' ? true :
        publishedFilter === 'published' ? isPublished : !isPublished;
      return matchesSearch && matchesPublished;
    });
  }, [courses, searchTerm, publishedFilter, toggledCourses]);

  const handleToggle = async (courseId: string) => {
    const current = toggledCourses[courseId] ?? courses.find(c => c.id === courseId)?.published ?? false;
    const next = !current;
    console.log('[CoursesPage] handleToggle:', { courseId, current, next });
    // Optimistic UI update
    setToggledCourses(prev => ({ ...prev, [courseId]: next }));
    try {
      const res = await fetch('/api/admin/courses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-csrf-protection': '1' },
        body: JSON.stringify({ courseId, published: next }),
      });
      console.log('[CoursesPage] handleToggle response status:', res.status);
      if (!res.ok) {
        const body = await res.json().catch((e) => {
          console.error('[CoursesPage] handleToggle: could not parse error body:', e);
          return {};
        });
        console.error('[CoursesPage] handleToggle failed:', body);
        setToggledCourses(prev => ({ ...prev, [courseId]: current }));
      }
    } catch (err) {
      console.error('[CoursesPage] handleToggle network error:', err);
      setToggledCourses(prev => ({ ...prev, [courseId]: current }));
    }
  };

  const handleDeleteCourse = async () => {
    if (!deleteTarget) {
      console.warn('[CoursesPage] handleDeleteCourse called with no deleteTarget set.');
      return;
    }
    console.log('[CoursesPage] handleDeleteCourse:', deleteTarget.id, deleteTarget.title);
    try {
      const res = await fetch('/api/admin/courses', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'x-csrf-protection': '1' },
        body: JSON.stringify({ courseId: deleteTarget.id }),
      });
      console.log('[CoursesPage] handleDeleteCourse response status:', res.status);
      if (!res.ok) {
        const body = await res.json().catch((e) => {
          console.error('[CoursesPage] handleDeleteCourse: could not parse error body:', e);
          return {};
        });
        console.error('[CoursesPage] handleDeleteCourse failed:', body);
        return;
      }
      setCourses(prev => prev.filter(c => c.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      console.error('[CoursesPage] handleDeleteCourse network error:', err);
    }
  };

  const handleRowClick = (course: Course) => router.push(`/admin/courses/${course.id}`);

  // ── Create helpers ────────────────────────────────────────────────────────
  const totalLessons = form.modules.reduce((acc, m) => acc + m.lessons.length, 0);

  const addModule = () => {
    setForm(f => ({
      ...f,
      modules: [...f.modules, {
        id: `mod-${Date.now()}`,
        title: `Module ${f.modules.length + 1}`,
        lessons: [],
        collapsed: false,
      }],
    }));
  };

  const removeModule = (mi: number) =>
    setForm(f => ({ ...f, modules: f.modules.filter((_, i) => i !== mi) }));

  const updateModuleTitle = (mi: number, title: string) =>
    setForm(f => { const m = [...f.modules]; m[mi] = { ...m[mi], title }; return { ...f, modules: m }; });

  const toggleModuleCollapse = (mi: number) =>
    setForm(f => { const m = [...f.modules]; m[mi] = { ...m[mi], collapsed: !m[mi].collapsed }; return { ...f, modules: m }; });

  const addLesson = (mi: number) => {
    setForm(f => {
      const modules = [...f.modules];
      modules[mi].lessons.push({
        id: `les-${Date.now()}`,
        title: 'New Lesson',
        type: 'video',
        content: { videoUrl: '', duration: '', videoProvider: 'youtube' as VideoProvider },
        expanded: true,
      });
      return { ...f, modules };
    });
  };

  const removeLesson = (mi: number, li: number) =>
    setForm(f => {
      const modules = [...f.modules];
      modules[mi].lessons = modules[mi].lessons.filter((_, i) => i !== li);
      return { ...f, modules };
    });

  const updateLesson = (mi: number, li: number, patch: Partial<DraftLesson>) =>
    setForm(f => {
      const modules = [...f.modules];
      modules[mi].lessons[li] = { ...modules[mi].lessons[li], ...patch };
      return { ...f, modules };
    });

  const changeLessonType = (mi: number, li: number, type: LessonType) =>
    updateLesson(mi, li, { type, content: defaultContent(type) });

  const updateVideoContent = (mi: number, li: number, patch: Partial<VideoContent>) => {
    const prev = form.modules[mi].lessons[li].content as VideoContent;
    updateLesson(mi, li, { content: { ...prev, ...patch } });
  };

  const updateReadingContent = (mi: number, li: number, markdownBody: string) =>
    updateLesson(mi, li, { content: { markdownBody } });

  const updateQuizQuestion = (mi: number, li: number, qi: number, patch: Partial<QuizQuestion>) => {
    const content = { ...(form.modules[mi].lessons[li].content as QuizContent) };
    content.questions = content.questions.map((q, i) => i === qi ? { ...q, ...patch } : q);
    updateLesson(mi, li, { content });
  };

  const addQuestion = (mi: number, li: number) => {
    const content = { ...(form.modules[mi].lessons[li].content as QuizContent) };
    content.questions = [...content.questions, { id: `q-${Date.now()}`, question: '', options: ['', '', '', ''], correctAnswer: 0, points: 10 }];
    updateLesson(mi, li, { content });
  };

  const removeQuestion = (mi: number, li: number, qi: number) => {
    const content = { ...(form.modules[mi].lessons[li].content as QuizContent) };
    content.questions = content.questions.filter((_, i) => i !== qi);
    updateLesson(mi, li, { content });
  };

  // Drag and drop — modules
  const onModuleDragEnd = (result: any) => {
    if (!result.destination) return;
    const modules = [...form.modules];
    const [moved] = modules.splice(result.source.index, 1);
    modules.splice(result.destination.index, 0, moved);
    setForm(f => ({ ...f, modules }));
  };

  // Drag and drop — lessons within a module
  const onLessonDragEnd = (mi: number, result: any) => {
    if (!result.destination) return;
    const modules = [...form.modules];
    const lessons = [...modules[mi].lessons];
    const [moved] = lessons.splice(result.source.index, 1);
    lessons.splice(result.destination.index, 0, moved);
    modules[mi] = { ...modules[mi], lessons };
    setForm(f => ({ ...f, modules }));
  };

  const handleSaveCourse = async () => {
    const errors: string[] = [];
    if (!form.title.trim())        errors.push('Course title is required.');
    if (!form.description.trim())  errors.push('Description is required.');
    if (!form.instructor.trim())   errors.push('Instructor name is required.');
    if (!form.price.trim())        errors.push('Price is required.');
    if (form.modules.length === 0) errors.push('Add at least one module.');

    if (errors.length > 0) {
      console.warn('[CoursesPage] handleSaveCourse validation failed:', errors);
      setFormErrors(errors);
      return;
    }
    setFormErrors([]);

    const parsedPrice = Number(form.price.replace(/[^0-9]/g, '')) || 0;
    const parsedPremiumPrice = form.premiumPrice.trim()
      ? Number(form.premiumPrice.replace(/[^0-9]/g, '')) || 0
      : 0;
    console.log('[CoursesPage] handleSaveCourse: submitting with parsedPrice =', parsedPrice, 'parsedPremiumPrice =', parsedPremiumPrice, 'from raw form.price =', form.price, 'editingCourseId =', editingCourseId);

    const isEditing = editingCourseId !== null;
    const cleanModules = form.modules.map(({ collapsed: _c, ...m }) => ({
      ...m,
      lessons: m.lessons.map(({ expanded: _e, ...l }) => l),
    }));

    try {
      const res = await fetch('/api/admin/courses', {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-protection': '1' },
        body: JSON.stringify({
          ...(isEditing ? { courseId: editingCourseId } : {}),
          title:            form.title,
          description:      form.description,
          shortDescription: form.shortDescription,
          instructor:       form.instructor,
          level:            form.level,
          price:            parsedPrice,
          premiumPrice:     parsedPremiumPrice,
          duration:         form.duration,
          thumbnail:        form.thumbnail,
          features:         form.features,
          curriculum:       form.curriculum,
          published:        form.published,
          modules:          cleanModules,
        }),
      });

      console.log('[CoursesPage] handleSaveCourse response status:', res.status);

      if (!res.ok) {
        const body = await res.json().catch((e) => {
          console.error('[CoursesPage] handleSaveCourse: could not parse error body:', e);
          return {};
        });
        console.error('[CoursesPage] handleSaveCourse failed:', body);
        setFormErrors([body.error ?? 'Failed to save course. Please try again.']);
        return;
      }

      const responseBody = await res.json();
      console.log('[CoursesPage] handleSaveCourse response body:', responseBody);
      const saved = responseBody?.course;
      if (!saved || typeof saved.id !== 'string') {
        console.error('[CoursesPage] handleSaveCourse: response missing valid course object:', responseBody);
        setFormErrors([isEditing
          ? 'Course was updated but the response was malformed. Please refresh the page.'
          : 'Course was created but the response was malformed. Please refresh the page.']);
        return;
      }

      if (isEditing) {
        // Replace the edited course in place — the PUT response is a partial
        // shape (no enrolledCount/totalRevenue/lessonsCount), so merge onto
        // the existing row rather than replacing it wholesale.
        setCourses((prev) => prev.map((c) => (c.id === saved.id ? { ...c, ...saved } : c)));
      } else {
        setCourses((prev) => [saved, ...prev]);
      }

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setPageMode('list');
        setForm(BLANK_FORM);
        setEditingCourseId(null);
        router.replace('/admin/courses');
      }, 1800);
    } catch (err) {
      console.error('[CoursesPage] handleSaveCourse network error:', err);
      setFormErrors(['Network error — please check your connection and try again.']);
    }
  };

  // ── Shared table columns ──────────────────────────────────────────────────
  const courseColumns: Column<Course>[] = [
    { key: 'title', label: 'Course Title', sortable: true },
    {
      key: 'price', label: 'Price', sortable: true,
      render: (v) => {
        if (typeof v !== 'number' || Number.isNaN(v)) {
          console.error('[CoursesPage] price column received a non-numeric value:', v);
          return '₦0';
        }
        return `₦${v.toLocaleString()}`;
      },
    },
    {
      key: 'premiumPrice', label: 'Premium Price', sortable: true,
      render: (v) => {
        if (typeof v !== 'number' || Number.isNaN(v)) {
          console.error('[CoursesPage] premiumPrice column received a non-numeric value:', v);
          return '—';
        }
        return v > 0 ? `₦${v.toLocaleString()}` : '—';
      },
    },
    { key: 'enrolledCount', label: 'Enrolled', sortable: true },
    {
      key: 'totalRevenue', label: 'Revenue', sortable: true,
      render: (v) => {
        if (typeof v !== 'number' || Number.isNaN(v)) {
          console.error('[CoursesPage] totalRevenue column received a non-numeric value:', v);
          return '₦0';
        }
        return `₦${v.toLocaleString()}`;
      },
    },
    {
      key: 'completionRate', label: 'Completion', sortable: true,
      render: (v) => (
        <div className="flex items-center gap-2">
          <div className="w-20 h-2 rounded-full bg-gray-700">
            <div className="h-full rounded-full bg-purple-500" style={{ width: `${v}%` }} />
          </div>
          <span className="text-xs">{v}%</span>
        </div>
      ),
    },
    {
      key: 'published', label: 'Status',
      render: (_, course) => {
        const isPublished = toggledCourses[course.id] ?? course.published;
        return (
          <button onClick={(e) => { e.stopPropagation(); handleToggle(course.id); }} className="flex items-center gap-2 text-sm transition">
            {isPublished ? <><ToggleRight size={18} className="text-green-400" /><span className="text-green-400">Published</span></> : <><ToggleLeft size={18} className="text-gray-500" /><span className="text-gray-500">Draft</span></>}
          </button>
        );
      },
    },
    {
      key: 'slug', label: 'Actions',
      render: (_, course) => (
        <div className="flex items-center gap-2">
          <button onClick={(e) => { e.stopPropagation(); router.push(`/admin/courses?edit=${course.id}`); }} className="flex items-center gap-1 text-xs px-3 py-1 rounded-lg border border-indigo-500/30 text-indigo-400 hover:border-indigo-500/60 hover:bg-indigo-500/10 transition">
            <Pencil size={13} /> Edit
          </button>
          <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(course); }} className="flex items-center gap-1 text-xs px-3 py-1 rounded-lg border border-red-500/30 text-red-400 hover:border-red-500/60 hover:bg-red-500/10 transition">
            <Trash2 size={13} /> Delete
          </button>
        </div>
      ),
    },
  ];

  // ─────────────────────────────────────────────────────────────────────────
  // CREATE MODE
  // ─────────────────────────────────────────────────────────────────────────
  if (pageMode === 'create' || pageMode === 'edit') {
    const isEditing = pageMode === 'edit';
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              setPageMode('list');
              setForm(BLANK_FORM);
              setFormErrors([]);
              setEditingCourseId(null);
              router.replace('/admin/courses');
            }}
            className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition text-sm"
          >
            <ArrowLeft size={18} /> Back to Courses
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setForm(f => ({ ...f, published: !f.published }))}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all ${form.published ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400' : 'bg-gray-700/40 border-gray-600 text-gray-400'}`}
            >
              {form.published ? <><Eye size={14} /> Published</> : <><EyeOff size={14} /> Draft</>}
            </button>
            <button onClick={handleSaveCourse} className="flex items-center gap-2 px-5 py-2 rounded-lg bg-linear-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-medium text-sm transition shadow-lg shadow-indigo-500/30">
              <Save size={16} /> {isEditing ? 'Save Changes' : (form.published ? 'Publish Course' : 'Save Draft')}
            </button>
          </div>
        </div>

        {/* Success banner */}
        {saveSuccess && (
          <div className="flex items-center gap-3 px-5 py-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
            <Check size={18} />
            <span className="text-sm font-medium">Course {form.published ? 'published' : 'saved as draft'}! Returning to list…</span>
          </div>
        )}

        {/* Error banner */}
        {formErrors.length > 0 && (
          <div className="px-5 py-4 rounded-xl bg-red-500/10 border border-red-500/20 space-y-1">
            {formErrors.map((e, i) => <p key={i} className="text-sm text-red-400">• {e}</p>)}
          </div>
        )}

        {/* ── SECTION 1: Basic Info ── */}
        <div className="rounded-xl border border-indigo-500/20 bg-linear-to-br from-gray-900/80 to-gray-800/40 p-6 backdrop-blur-md space-y-4">
          <h2 className="text-lg font-bold text-white">Basic Information</h2>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Course Title *</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Advanced React.js Mastery" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Description *</label>
            <textarea rows={4} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe what students will learn..." className={inputCls} />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Short Description</label>
            <input value={form.shortDescription} onChange={e => setForm(f => ({ ...f, shortDescription: e.target.value }))} placeholder="One-line summary shown on course cards" className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Instructor *</label>
              <input value={form.instructor} onChange={e => setForm(f => ({ ...f, instructor: e.target.value }))} placeholder="Instructor name" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Level</label>
              <select value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value as any }))} className={inputCls}>
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Price (₦) *</label>
            <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="15000" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Premium Price (₦)</label>
            <input type="number" value={form.premiumPrice} onChange={e => setForm(f => ({ ...f, premiumPrice: e.target.value }))} placeholder="Optional — leave blank if no premium tier" className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Duration</label>
              <input value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} placeholder="e.g. 24 hours" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Thumbnail URL</label>
              <input value={form.thumbnail} onChange={e => setForm(f => ({ ...f, thumbnail: e.target.value }))} placeholder="https://..." className={inputCls} />
            </div>
          </div>
        </div>

        {/* ── SECTION 1b: Features & Curriculum ── */}
        <div className="rounded-xl border border-indigo-500/20 bg-linear-to-br from-gray-900/80 to-gray-800/40 p-6 backdrop-blur-md space-y-5">
          <h2 className="text-lg font-bold text-white">Highlights</h2>
          <TagListEditor
            label="Features"
            placeholder="e.g. Hands-on projects"
            items={form.features}
            onChange={(next) => setForm(f => ({ ...f, features: next }))}
          />
          <TagListEditor
            label="Curriculum Topics"
            placeholder="e.g. Introduction to Hooks"
            items={form.curriculum}
            onChange={(next) => setForm(f => ({ ...f, curriculum: next }))}
          />
        </div>

        {/* ── SECTION 2: Modules & Lessons ── */}
        <div className="rounded-xl border border-indigo-500/20 bg-linear-to-br from-gray-900/80 to-gray-800/40 p-6 backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Course Content</h2>
              <p className="text-xs text-gray-400 mt-1">{totalLessons} lesson{totalLessons !== 1 ? 's' : ''} total</p>
            </div>
            <button onClick={addModule} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-linear-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white text-sm font-medium transition">
              <Plus size={16} /> Add Module
            </button>
          </div>

          {form.modules.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-sm">No modules yet. Add one to get started.</p>
            </div>
          ) : (
            <DragDropContext onDragEnd={(result) => {
              if (!result.destination) return;
              if (result.type === 'MODULE') { onModuleDragEnd(result); return; }
              // Lesson drag — droppableId is 'lessons-{moduleId}'
              const mi = form.modules.findIndex(m => `lessons-${m.id}` === result.destination!.droppableId);
              if (mi !== -1) onLessonDragEnd(mi, result);
            }}>
              <Droppable droppableId="modules" type="MODULE">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                    {form.modules.map((module, mi) => (
                      <Draggable key={module.id} draggableId={module.id} index={mi}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="rounded-lg border border-gray-700 bg-gray-800/50 overflow-hidden"
                          >
                            {/* Module header */}
                            <div className="flex items-center gap-3 p-4 bg-gray-800/80">
                              <GripVertical size={16} className="text-gray-500 cursor-grab" {...provided.dragHandleProps} />
                              <input
                                value={module.title}
                                onChange={e => updateModuleTitle(mi, e.target.value)}
                                className="flex-1 bg-transparent text-white font-medium outline-none text-sm"
                              />
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => toggleModuleCollapse(mi)}
                                  className="p-1 text-gray-400 hover:text-gray-200 transition"
                                >
                                  {module.collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                                </button>
                                <button
                                  onClick={() => removeModule(mi)}
                                  className="p-1 text-red-400 hover:text-red-300 transition"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            </div>

                            {/* Module lessons */}
                            {!module.collapsed && (
                              <div className="border-t border-gray-700 p-4 space-y-3 bg-gray-900/50">
                                <Droppable droppableId={`lessons-${module.id}`}>
                                    {(provided) => (
                                      <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                                        {module.lessons.map((lesson, li) => (
                                          <Draggable key={lesson.id} draggableId={lesson.id} index={li}>
                                            {(provided) => (
                                              <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                className="rounded-lg bg-gray-800 border border-gray-700 p-3 space-y-2"
                                              >
                                                <div className="flex items-center gap-2">
                                                  <GripVertical size={14} className="text-gray-500 cursor-grab" {...provided.dragHandleProps} />
                                                  <input
                                                    value={lesson.title}
                                                    onChange={e => updateLesson(mi, li, { title: e.target.value })}
                                                    placeholder="Lesson title"
                                                    className="flex-1 bg-gray-700 text-white outline-none rounded px-2 py-1 text-xs"
                                                  />
                                                  <select
                                                    value={lesson.type}
                                                    onChange={e => changeLessonType(mi, li, e.target.value as LessonType)}
                                                    className="bg-gray-700 text-gray-300 outline-none rounded px-2 py-1 text-xs"
                                                  >
                                                    <option value="video">Video</option>
                                                    <option value="reading">Reading</option>
                                                    <option value="quiz">Quiz</option>
                                                  </select>
                                                  <button
                                                    onClick={() => updateLesson(mi, li, { expanded: !lesson.expanded })}
                                                    className="p-1 text-gray-400 hover:text-gray-200"
                                                  >
                                                    {lesson.expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                                  </button>
                                                  <button
                                                    onClick={() => removeLesson(mi, li)}
                                                    className="p-1 text-red-400 hover:text-red-300"
                                                  >
                                                    <X size={14} />
                                                  </button>
                                                </div>

                                                {/* Lesson content editor */}
                                                {lesson.expanded && (
                                                  <div className="ml-5 pt-2 border-t border-gray-700 space-y-2">
                                                    {lesson.type === 'video' && (
                                                      <>
                                                        <select
                                                          value={(lesson.content as VideoContent).videoProvider ?? 'youtube'}
                                                          onChange={e => updateVideoContent(mi, li, { videoProvider: e.target.value as VideoProvider })}
                                                          className="w-full bg-gray-700 text-gray-300 outline-none rounded px-2 py-1 text-xs"
                                                        >
                                                          <option value="youtube">YouTube</option>
                                                          <option value="gumlet">Gumlet</option>
                                                          <option value="bunny">Bunny</option>
                                                          <option value="gdrive">Google Drive</option>
                                                        </select>
                                                        <input
                                                          value={(lesson.content as VideoContent).videoUrl}
                                                          onChange={e => updateVideoContent(mi, li, { videoUrl: e.target.value })}
                                                          placeholder="Video URL (e.g. https://..."
                                                          className="w-full bg-gray-700 text-white outline-none rounded px-2 py-1 text-xs"
                                                        />
                                                        <input
                                                          value={(lesson.content as VideoContent).duration}
                                                          onChange={e => updateVideoContent(mi, li, { duration: e.target.value })}
                                                          placeholder="Duration (e.g. 15:30)"
                                                          className="w-full bg-gray-700 text-white outline-none rounded px-2 py-1 text-xs"
                                                        />
                                                      </>
                                                    )}
                                                    {lesson.type === 'reading' && (
                                                      <textarea
                                                        value={(lesson.content as ReadingContent).markdownBody}
                                                        onChange={e => updateReadingContent(mi, li, e.target.value)}
                                                        placeholder="Markdown content..."
                                                        rows={3}
                                                        className="w-full bg-gray-700 text-white outline-none rounded px-2 py-1 text-xs"
                                                      />
                                                    )}
                                                    {lesson.type === 'quiz' && (
                                                      <div className="space-y-2">
                                                        {(lesson.content as QuizContent).questions.map((q, qi) => (
                                                          <div key={q.id} className="bg-gray-700/50 rounded p-2 space-y-1 text-xs">
                                                            <input
                                                              value={q.question}
                                                              onChange={e => updateQuizQuestion(mi, li, qi, { question: e.target.value })}
                                                              placeholder="Question"
                                                              className="w-full bg-gray-700 text-white outline-none rounded px-2 py-1"
                                                            />
                                                            {q.options.map((opt, oi) => (
                                                              <input
                                                                key={oi}
                                                                value={opt}
                                                                onChange={e => {
                                                                  const newOpts = [...q.options];
                                                                  newOpts[oi] = e.target.value;
                                                                  updateQuizQuestion(mi, li, qi, { options: newOpts });
                                                                }}
                                                                placeholder={`Option ${oi + 1}`}
                                                                className="w-full bg-gray-700 text-white outline-none rounded px-2 py-1"
                                                              />
                                                            ))}
                                                            <div className="flex gap-1">
                                                              <select
                                                                value={q.correctAnswer}
                                                                onChange={e => updateQuizQuestion(mi, li, qi, { correctAnswer: Number(e.target.value) })}
                                                                className="flex-1 bg-gray-700 text-gray-300 outline-none rounded px-2 py-1"
                                                              >
                                                                <option value={0}>Correct: Option 1</option>
                                                                <option value={1}>Correct: Option 2</option>
                                                                <option value={2}>Correct: Option 3</option>
                                                                <option value={3}>Correct: Option 4</option>
                                                              </select>
                                                              <button
                                                                onClick={() => removeQuestion(mi, li, qi)}
                                                                className="px-2 py-1 text-red-400 hover:text-red-300 bg-red-500/10 rounded"
                                                              >
                                                                <X size={12} />
                                                              </button>
                                                            </div>
                                                          </div>
                                                        ))}
                                                        <button
                                                          onClick={() => addQuestion(mi, li)}
                                                          className="w-full px-2 py-1 text-xs text-indigo-400 border border-indigo-500/30 rounded hover:bg-indigo-500/10"
                                                        >
                                                          + Add Question
                                                        </button>
                                                      </div>
                                                    )}
                                                  </div>
                                                )}
                                              </div>
                                            )}
                                          </Draggable>
                                        ))}
                                        {provided.placeholder}
                                      </div>
                                    )}
                                  </Droppable>
                                <button
                                  onClick={() => addLesson(mi)}
                                  className="w-full px-3 py-2 text-xs text-indigo-400 border border-indigo-500/30 rounded hover:bg-indigo-500/10 transition"
                                >
                                  + Add Lesson
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // LIST MODE
  // ─────────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-400 text-sm animate-pulse">Loading courses…</div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <p className="text-red-400 text-sm font-medium">Failed to load courses</p>
        <p className="text-gray-400 text-xs max-w-md text-center">{fetchError}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 px-4 py-2 rounded-lg bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-sm hover:bg-indigo-500/30 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Courses</h1>
          <p className="mt-2 text-gray-400">Manage course content, pricing, and enrollment.</p>
        </div>
        <button
          onClick={() => setPageMode('create')}
          className="flex items-center gap-2 px-5 py-2 rounded-lg bg-linear-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-medium text-sm transition shadow-lg shadow-indigo-500/30"
        >
          <Plus size={16} /> New Course
        </button>
      </div>

      <FilterBar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        filters={{
          status: {
            label: 'Status',
            value: publishedFilter,
            options: [
              { label: 'Published', value: 'published' },
              { label: 'Draft', value: 'draft' },
            ],
            onChange: setPublishedFilter,
          },
        }}
        placeholder="Search by course name..."
      />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-400">
            Showing {filteredCourses.length} of {courses.length} courses
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'table'
                  ? 'bg-indigo-500/30 text-indigo-200 border border-indigo-500/50'
                  : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-indigo-500/30'
              }`}
            >
              Table
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'grid'
                  ? 'bg-indigo-500/30 text-indigo-200 border border-indigo-500/50'
                  : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-indigo-500/30'
              }`}
            >
              Grid
            </button>
          </div>
        </div>

        {viewMode === 'table' ? (
          <AdminTable
            columns={courseColumns}
            data={filteredCourses}
            onRowClick={handleRowClick}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCourses.map((course) => {
              const isPublished =
                toggledCourses[course.id] !== undefined
                  ? toggledCourses[course.id]
                  : course.published;
              return (
                <div
                  key={course.id}
                  onClick={() => handleRowClick(course)}
                  className="group rounded-xl border border-indigo-500/20 bg-linear-to-br from-gray-900/80 to-gray-800/40 p-6 backdrop-blur-md cursor-pointer transition-all duration-300 hover:border-indigo-400/60 hover:shadow-lg hover:shadow-indigo-500/20"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-12 w-12 rounded-lg bg-linear-to-br from-indigo-500/30 to-purple-500/30 flex items-center justify-center border border-indigo-500/30 group-hover:scale-110 transition-transform duration-300">
                      <BookOpen size={24} className="text-indigo-400" />
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggle(course.id);
                      }}
                      className="flex items-center gap-1 text-xs transition"
                    >
                      {isPublished ? (
                        <>
                          <ToggleRight size={16} className="text-emerald-400" />
                          <span className="text-emerald-400 text-xs">Published</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft size={16} className="text-gray-500" />
                          <span className="text-gray-500 text-xs">Draft</span>
                        </>
                      )}
                    </button>
                  </div>

                  <h3 className="font-semibold text-white line-clamp-2 mb-2">
                    {course.title}
                  </h3>
                  <p className="text-xs text-gray-400 line-clamp-2 mb-4">
                    {course.description}
                  </p>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center p-2 rounded-lg bg-gray-800/30">
                      <span className="text-gray-400">Price</span>
                      <span className="font-semibold text-indigo-400">
                        ₦{typeof course.price === 'number' && !Number.isNaN(course.price) ? course.price.toLocaleString() : '0'}
                      </span>
                    </div>
                    {typeof course.premiumPrice === 'number' && course.premiumPrice > 0 && (
                      <div className="flex justify-between items-center p-2 rounded-lg bg-gray-800/30">
                        <span className="text-gray-400">Premium Price</span>
                        <span className="font-semibold text-amber-400">
                          ₦{course.premiumPrice.toLocaleString()}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center p-2 rounded-lg bg-gray-800/30">
                      <span className="text-gray-400">Revenue</span>
                      <span className="font-semibold text-emerald-400">
                        ₦{typeof course.totalRevenue === 'number' && !Number.isNaN(course.totalRevenue) ? course.totalRevenue.toLocaleString() : '0'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-lg bg-gray-800/30">
                      <span className="text-gray-400">Enrolled</span>
                      <span className="font-semibold text-emerald-400">
                        {course.enrolledCount}
                      </span>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-400 text-xs">Completion</span>
                        <span className="text-xs text-gray-300">
                          {course.completionRate}%
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-gray-700">
                        <div
                          className="h-full rounded-full bg-linear-to-r from-indigo-500 to-purple-500"
                          style={{ width: `${course.completionRate}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Action row — stop propagation so card click (go to detail) doesn't fire */}
                  <div className="mt-4 pt-4 border-t border-indigo-500/10 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => router.push(`/admin/courses?edit=${course.id}`)}
                      className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2 rounded-lg border border-indigo-500/30 text-indigo-400 hover:border-indigo-500/60 hover:bg-indigo-500/10 transition"
                    >
                      <Pencil size={13} /> Edit
                    </button>
                    <button
                      onClick={() => setDeleteTarget(course)}
                      className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2 rounded-lg border border-red-500/30 text-red-400 hover:border-red-500/60 hover:bg-red-500/10 transition"
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Course Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Course"
        footer={
          <>
            <button
              onClick={() => setDeleteTarget(null)}
              className="flex-1 rounded-lg border border-gray-600 px-4 py-2 font-medium text-gray-300 hover:bg-gray-800 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteCourse}
              className="flex-1 rounded-lg bg-red-600 hover:bg-red-700 px-4 py-2 font-medium text-white transition"
            >
              Delete
            </button>
          </>
        }
      >
        <p className="text-gray-300 text-sm">
          Are you sure you want to delete <span className="font-bold text-white">{deleteTarget?.title}</span>? This will remove the course and cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
