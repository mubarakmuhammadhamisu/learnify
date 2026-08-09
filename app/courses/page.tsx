import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import { getAllCourses } from '@/lib/courses';

// Same reasoning as app/page.tsx — without this, newly published courses
// won't appear here until the next deploy.
export const revalidate = 172800; // 2 days, 48 hours, in seconds

export default async function CoursesPage() {
  const courses = await getAllCourses();

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100">
      <Navbar />

      <section className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold">
          Explore Our <span className="text-indigo-400">Courses</span>
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-gray-400">
          Learn real-world skills with structured, high-quality courses.
        </p>
      </section>

      <section className="max-w-7xl mx-auto px-4 pb-32">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Link
              key={course.slug}
              href={`/courses/${course.slug}`}
              className="group rounded-2xl bg-gray-900 border border-white/10 overflow-hidden hover:border-indigo-500/40 transition"
            >
              <div className={`h-44 bg-linear-to-br ${course.gradientFrom} ${course.gradientTo} relative overflow-hidden`}>
                <Image src={course.thumbnail} alt={course.title} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover" />
                <div className="absolute top-3 left-3 bg-gray-900/70 backdrop-blur text-xs text-gray-200 px-2 py-0.5 rounded-full border border-white/10">
                  {course.level}
                </div>
                <div className="absolute top-3 right-3 bg-gray-900/70 backdrop-blur text-xs text-indigo-300 font-semibold px-2 py-0.5 rounded-full border border-indigo-500/20">
                  {course.price}
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-lg group-hover:text-indigo-400 transition">{course.title}</h3>
                <p className="mt-2 text-sm text-gray-400 line-clamp-2">{course.shortDescription}</p>
                <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
                  <span>{course.instructor}</span>
                  <span>{course.duration}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  );
}
