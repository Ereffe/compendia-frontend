import Link from "next/link";
import LoginModal from "../components/login-modal";

const newestArticles = [
  {
    title: "Data Structures in Practice: Linked Lists, Trees, and Real Use Cases",
    excerpt: "Lecture notes and visual examples that help CS students connect theory with implementation.",
    category: "Algorithms",
    publishedAt: "Apr 6, 2026",
    author: "Dr. Marta Green",
  },
  {
    title: "Operating Systems Lab: Process Scheduling Explained with Code",
    excerpt: "A student-friendly breakdown of FCFS, SJF, and Round Robin with implementation snippets.",
    category: "Systems",
    publishedAt: "Apr 4, 2026",
    author: "Adrian Cole",
  },
  {
    title: "How to Write Better SQL for Coursework and Projects",
    excerpt: "Lecturer-approved patterns for joins, indexing basics, and query optimization for beginners.",
    category: "Databases",
    publishedAt: "Apr 1, 2026",
    author: "Compendia CS Faculty",
  },
  {
    title: "Peer Code Review Checklist Before Your Programming Exam",
    excerpt: "Share clear review notes on complexity, edge cases, and test coverage with your classmates.",
    category: "Software Engineering",
    publishedAt: "Mar 29, 2026",
    author: "Nora Patel",
  },
];

export default function Home() {
  return (
    <main className="compendia-surface min-h-screen overflow-x-clip text-slate-950">
      <div className="compendia-noise pointer-events-none fixed inset-0 -z-20" aria-hidden />
      <div className="compendia-grid pointer-events-none fixed inset-0 -z-10 opacity-25" aria-hidden />

      <header className="relative mx-auto max-w-6xl px-6 pt-6 sm:px-8 sm:pt-10">
        <nav className="fade-in-up flex items-center justify-between rounded-full border border-slate-950/15 bg-white/75 px-4 py-2.5 backdrop-blur md:px-6">
          <Link href="/" className="text-sm font-semibold tracking-[0.2em] text-slate-900">
            COMPENDIA
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="#articles"
              className="rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-widest text-slate-700 transition-colors duration-200 hover:bg-slate-900/5"
            >
              Newest Articles
            </Link>
            <Link
              href="#"
              className="rounded-full border border-slate-900/15 bg-white/80 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-slate-800 transition-colors duration-200 hover:bg-slate-900/5"
              aria-label="Open messenger"
            >
              Messenger
            </Link>
            <LoginModal />
          </div>
        </nav>
      </header>

      <section id="articles" className="relative mx-auto max-w-6xl px-6 pb-14 pt-12 sm:px-8 sm:pb-16 sm:pt-16">
        <div className="mb-8 fade-in-up" style={{ animationDelay: "80ms" }}>
          <p className="text-xs font-bold uppercase tracking-[0.32em] text-teal-700">For Computer Science Students and Lecturers</p>
          <h1 className="mt-3 text-4xl font-bold leading-tight sm:text-5xl">Newest Articles</h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-700 sm:text-lg">
            Compendia helps CS communities share knowledge through articles: lecture insights, coding patterns, lab
            walkthroughs, debugging tips, and exam preparation resources in one searchable place.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {newestArticles.map((article, index) => (
            <article
              key={article.title}
              className="fade-in-up rounded-2xl border border-slate-950/10 bg-white/75 p-5 shadow-[0_18px_60px_-36px_rgba(15,23,42,0.6)] backdrop-blur"
              style={{ animationDelay: `${160 + index * 90}ms` }}
            >
              <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-widest">
                <span className="rounded-full bg-teal-100 px-2.5 py-1 text-teal-800">{article.category}</span>
                <span className="text-slate-600">{article.publishedAt}</span>
              </div>
              <h2 className="mt-4 text-xl font-semibold text-slate-950">{article.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{article.excerpt}</p>
              <p className="mt-4 text-sm font-medium text-slate-700">By {article.author}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-6 pb-10 sm:px-8">
        <div className="fade-in-up rounded-2xl border border-slate-950/10 bg-white/70 px-5 py-5 text-sm text-slate-700 backdrop-blur" style={{ animationDelay: "640ms" }}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-semibold tracking-[0.18em] text-slate-900">COMPENDIA</p>
            <p>Built for computer science students and lecturers who learn better together.</p>
            <p>© 2026 Compendia</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
