'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, BookOpen, Users, TrendingUp, Pencil } from 'lucide-react';
import { Course, Enrollment } from '@/components/admin/mock-data';
import { AdminTable, Column } from '@/components/admin/shared/AdminTable';

interface CourseDetailData {
  course: Course;
  enrollments: Enrollment[];
}

export default function CourseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;

  const [data, setData] = useState<CourseDetailData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/courses').then((r) => r.json()),
      fetch('/api/admin/enrollments').then((r) => r.json()),
    ]).then(([coursesData, enrollmentsData]) => {
      // courseId param may be the DB uuid OR the slug — check both
      const course =
        (coursesData.courses ?? []).find((c: Course) => c.id === courseId) ??
        (coursesData.courses ?? []).find((c: Course) => c.slug === courseId) ??
        null;
      // Enrollments are keyed by course slug (e.courseId === course_slug),
      // never by the course UUID — match against course.slug, not course.id.
      const enrollments = (enrollmentsData.enrollments ?? []).filter(
        (e: Enrollment) => e.courseId === course?.slug
      );
      if (course) setData({ course, enrollments });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [courseId]);

  const enrollmentColumns: Column<Enrollment>[] = [
    { key: 'studentName', label: 'Student', sortable: true },
    {
      key: 'dateEnrolled',
      label: 'Enrolled Date',
      sortable: true,
      render: (value) => new Date(value as string).toLocaleDateString(),
    },
    {
      key: 'progress',
      label: 'Progress',
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-2">
          <div className="w-24 h-2 rounded-full bg-gray-700">
            <div className="h-full rounded-full bg-indigo-500" style={{ width: `${value}%` }} />
          </div>
          <span className="text-xs">{value}%</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
          value === 'completed' ? 'bg-green-500/10 text-green-400' :
          value === 'in-progress' ? 'bg-blue-500/10 text-blue-400' :
          'bg-gray-500/10 text-gray-400'
        }`}>
          {String(value).charAt(0).toUpperCase() + String(value).slice(1)}
        </span>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <div className="text-gray-400 text-sm animate-pulse">Loading course…</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300">
          <ArrowLeft size={18} /> Back
        </button>
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-6">
          <p className="text-red-400">Course not found</p>
        </div>
      </div>
    );
  }

  const { course, enrollments: courseEnrollments } = data;
  const completedCount  = courseEnrollments.filter((e) => e.status === 'completed').length;
  const inProgressCount = courseEnrollments.filter((e) => e.status === 'in-progress').length;

  const safePrice = typeof course.price === 'number' && !Number.isNaN(course.price) ? course.price : 0;
  if (safePrice !== course.price) console.error('[CourseDetailPage] price received a non-numeric value:', course.price);

  const safeTotalRevenue = typeof course.totalRevenue === 'number' && !Number.isNaN(course.totalRevenue) ? course.totalRevenue : 0;
  if (safeTotalRevenue !== course.totalRevenue) console.error('[CourseDetailPage] totalRevenue received a non-numeric value:', course.totalRevenue);

  const safePremiumPrice = typeof course.premiumPrice === 'number' && !Number.isNaN(course.premiumPrice) ? course.premiumPrice : 0;
  if (safePremiumPrice !== course.premiumPrice) console.error('[CourseDetailPage] premiumPrice received a non-numeric value:', course.premiumPrice);

  return (
    <div className="space-y-8">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition">
        <ArrowLeft size={18} /> Back to Courses
      </button>

      {/* Course Header */}
      <div className="rounded-xl border border-indigo-500/20 bg-linear-to-br from-gray-900/80 to-gray-800/40 p-8 backdrop-blur-md shadow-lg shadow-indigo-500/10">
        <div className="space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-white">{course.title}</h1>
              <p className="mt-2 text-gray-400">{course.description}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${
                course.published
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-gray-700/50 text-gray-400 border border-gray-600'
              }`}>
                {course.published ? 'Published' : 'Draft'}
              </span>
              <button
                onClick={() => router.push(`/admin/courses?edit=${course.id}`)}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border border-indigo-500/30 text-indigo-400 hover:border-indigo-500/60 hover:bg-indigo-500/10 transition"
              >
                <Pencil size={14} /> Edit
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl bg-linear-to-br from-indigo-500/10 to-indigo-600/5 border border-indigo-500/20 p-5">
              <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Price</p>
              <p className="mt-2 text-3xl font-bold text-indigo-400">₦{safePrice.toLocaleString()}</p>
            </div>
            {safePremiumPrice > 0 && (
              <div className="rounded-xl bg-linear-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 p-5">
                <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Premium Price</p>
                <p className="mt-2 text-3xl font-bold text-amber-400">₦{safePremiumPrice.toLocaleString()}</p>
              </div>
            )}
            <div className="rounded-xl bg-linear-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 p-5">
              <p className="flex items-center gap-2 text-xs uppercase tracking-wider text-gray-500 font-semibold"><Users size={14} />Enrolled</p>
              <p className="mt-2 text-3xl font-bold text-purple-400">{course.enrolledCount}</p>
            </div>
            <div className="rounded-xl bg-linear-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 p-5">
              <p className="flex items-center gap-2 text-xs uppercase tracking-wider text-gray-500 font-semibold"><TrendingUp size={14} />Revenue</p>
              <p className="mt-2 text-3xl font-bold text-emerald-400">
                {safeTotalRevenue >= 1_000_000
                  ? `₦${(safeTotalRevenue / 1_000_000).toFixed(1)}M`
                  : `₦${safeTotalRevenue.toLocaleString()}`}
              </p>
            </div>
            <div className="rounded-xl bg-linear-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 p-5">
              <p className="flex items-center gap-2 text-xs uppercase tracking-wider text-gray-500 font-semibold"><BookOpen size={14} />Lessons</p>
              <p className="mt-2 text-3xl font-bold text-blue-400">{course.lessonsCount}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="rounded-lg bg-linear-to-r from-blue-500/20 to-blue-600/10 border border-blue-500/30 px-4 py-2">
              <p className="text-sm text-blue-300 font-medium"><span className="font-bold text-lg">{completedCount}</span> Completed</p>
            </div>
            <div className="rounded-lg bg-linear-to-r from-indigo-500/20 to-indigo-600/10 border border-indigo-500/30 px-4 py-2">
              <p className="text-sm text-indigo-300 font-medium"><span className="font-bold text-lg">{inProgressCount}</span> In Progress</p>
            </div>
            <div className="rounded-lg bg-linear-to-r from-purple-500/20 to-purple-600/10 border border-purple-500/30 px-4 py-2">
              <p className="text-sm text-purple-300 font-medium"><span className="font-bold text-lg">{course.completionRate}%</span> Completion Rate</p>
            </div>
          </div>
        </div>
      </div>

      {/* Enrolled Students */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-white">Enrolled Students</h2>
        {courseEnrollments.length > 0
          ? <AdminTable columns={enrollmentColumns} data={courseEnrollments} />
          : <div className="rounded-lg border border-indigo-500/20 bg-gray-900/50 p-6 text-center"><p className="text-gray-400">No enrollments yet</p></div>
        }
      </div>
    </div>
  );
}
