import type { Metadata } from 'next';
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import CoursePreview from "@/components/ui/CoursePreview";

// Without this, Next.js statically prerenders this page once at build/deploy
// time and serves that frozen snapshot to every visitor afterward — so
// courses published in Supabase after the last deploy never show up here,
// even though they show up fine everywhere else (dashboard fetches
// client-side, which is always fresh). Revalidating once a day keeps this
// page self-healing without re-querying on every single request.
export const revalidate = 86400; // 24 hours, in seconds

export const metadata: Metadata = {
  title: 'TITECX — Learn Real-World Tech Skills',
  description: 'High-quality courses built for Nigerian learners. Master in-demand tech skills and get certified.',
  openGraph: {
    title: 'TITECX FORGE — Learn Real-World Tech Skills',
    description: 'High-quality courses built for Nigerian learners. Master in-demand tech skills and get certified.',
    url: 'https://titecx-mb.vercel.app',
    type: 'website',
    images: [
      {
        url: '/og-default.png',
        width: 1200,
        height: 630,
        alt: 'TITECX FORGE — Learn Real-World Tech Skills',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TITECX FORGE — Learn Real-World Tech Skills',
    description: 'High-quality courses built for Nigerian learners. Master in-demand tech skills and get certified.',
    images: ['/og-default.png'],
  },
};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-950 text-gray-100">
      <Navbar />
      <Hero />
      <Features />
      <CoursePreview />
      <FinalCTA />
      <Footer />
    </main>
  );
}

/* =========================
   HERO
========================= */
function Hero() {
  return (
    <section className="relative overflow-hidden  pt-20  pb-12 lg:pt-14 lg:pb-24">
      <div className="absolute inset-0 bg-linear-to-br from-indigo-600/20 via-purple-600/10 to-transparent" />
      <div className="relative max-w-7xl mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center">
        <div className="text-center lg:text-left">
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">
            Learn Skills That {" "}
            <span className="text-indigo-400">Actually Matter</span>
          </h1>
          <p className="mt-6 text-xl text-gray-300">
            High-quality courses built for real-world skills. Join our growing community.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <Link
              href="/courses"
              className="px-8 py-4 rounded-2xl bg-white text-gray-900 font-bold hover:bg-gray-100 transition-colors"
            >
              Browse Courses
            </Link>
            <Link
              href="/register"
              className="px-8 py-4 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors"
            >
              Start Learning
            </Link>
          </div>
        </div>
        <div className="relative">
          <div className="relative aspect-video lg:aspect-square rounded-3xl overflow-hidden shadow-2xl border border-white/10">
            <Image
              src="/brainAndshelld1.png"
              alt="Learning environment"
              fill
              className="object-cover w-full h-full"
              priority
            />
          </div>
          <div className="absolute -bottom-6 -left-6 bg-gray-900/90 backdrop-blur p-4 rounded-2xl border border-white/10 hidden md:block">
            <p className="text-sm font-semibold">Course: AI Engineering</p>
          </div>
        </div>
      </div>
    </section>
  );
}
const features = [
  { title: "Expert-Built Courses", description: "Focused on real skills." },
  { title: "Learn at Your Pace", description: "Pause, resume anytime." },
  { title: "Lifetime Access", description: "Buy once, learn forever." },
];

/* =========================
   FEATURES
========================= */
function Features() {
  return (
    <section className="max-w-7xl mx-auto px-4 py-20 grid md:grid-cols-3 gap-6">
      {features.map((f) => (
        <div
          key={f.title}
          className="p-6 rounded-2xl bg-gray-900 border border-white/10"
        >
          <h3 className="font-semibold">{f.title}</h3>
          <p className="mt-2 text-sm text-gray-400">{f.description}</p>
        </div>
      ))}
    </section>
  );
}


/* =========================
   COURSE PREVIEW
========================= */

/* =========================
   FINAL CTA
========================= */
function FinalCTA() {
  return (
    <section className="py-24 text-center">
      <h2 className="text-3xl font-bold">Ready to Start Learning?</h2>
      <div className="mt-8 flex justify-center gap-4">
        <Link
          href="/register"
          className="px-6 py-3 rounded-2xl bg-white text-gray-900 font-semibold"
        >
          Create Account
        </Link>
        <Link
          href="/courses"
          className="px-6 py-3 rounded-2xl border border-white/10"
        >
          Browse Courses
        </Link>
      </div>
    </section>
  );
}

/* =========================
   FOOTER
========================= */
