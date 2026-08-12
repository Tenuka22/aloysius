import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components-client/navbar";
import { Footer } from "@/components-client/footer";
import { client } from "@/utils/orpc";

type StudentWork = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  studentNames: string[] | null;
  studentGrade: string | null;
  authorType: string | null;
  coverImage: string | null;
  contentUrl: string | null;
  tags: string[] | null;
  publishedAt: string | null;
};

const categoryLabels: Record<string, string> = {
  film: "Short Film",
  art: "Digital Art",
  music: "Music",
  writing: "Writing",
  design: "UI/UX Design",
  photography: "Photography",
  code: "Code",
  other: "Other",
};

const categoryColors: Record<string, string> = {
  film: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  art: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  music: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  writing: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  design: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  photography: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  code: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  other: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
};

const authorTypeLabels: Record<string, string> = {
  student: "Student",
  faculty: "Faculty",
  club: "Club",
  org: "Organization",
};

export const Route = createFileRoute("/student-works_/$slug")({
  loader: async ({ params }) => {
    const studentWork = await client.studentWorks.get({ slug: params.slug });
    return { studentWork };
  },
  staleTime: 5 * 60_000,
  component: StudentWorkDetailPage,
});

function StudentWorkDetailPage() {
  const { studentWork } = Route.useLoaderData() as { studentWork: StudentWork };

  return (
    <div className="min-h-screen bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-2 focus:left-2 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:text-primary-foreground focus:outline-none"
      >
        Skip to main content
      </a>
      <Navbar />
      <main id="main-content">
        <section className="px-4 sm:px-6 lg:px-8 pt-16 pb-8">
          <div className="mx-auto max-w-4xl">
            <div className="mb-4">
              <Link
                to="/student-works"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                &larr; Back to Student Works
              </Link>
            </div>

            {studentWork.coverImage && (
              <div className="aspect-[16/9] overflow-hidden rounded-xl mb-8">
                <img
                  src={studentWork.coverImage}
                  alt={studentWork.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="flex items-center gap-3 mb-4">
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium capitalize ${categoryColors[studentWork.category] ?? categoryColors.other}`}
              >
                {categoryLabels[studentWork.category] ?? studentWork.category}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              {studentWork.title}
            </h1>

            <div className="flex items-center gap-4 flex-wrap mb-6 text-muted-foreground">
              {studentWork.studentNames && studentWork.studentNames.length > 0 && (
                <span className="text-lg">by {studentWork.studentNames.join(", ")}</span>
              )}
              {studentWork.studentGrade && (
                <span className="text-sm">Grade: {studentWork.studentGrade}</span>
              )}
              {studentWork.authorType && (
                <span className="text-sm text-muted-foreground">
                  {authorTypeLabels[studentWork.authorType] ?? studentWork.authorType}
                </span>
              )}
            </div>

            {studentWork.description && (
              <div className="prose prose-neutral dark:prose-invert max-w-none mb-8">
                <div className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
                  {studentWork.description}
                </div>
              </div>
            )}

            {studentWork.contentUrl && (
              <div className="mb-8">
                <a
                  href={studentWork.contentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="size-4"
                  >
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                  View Content
                </a>
              </div>
            )}

            {studentWork.tags && studentWork.tags.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {studentWork.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {studentWork.publishedAt && (
              <p className="text-sm text-muted-foreground mt-8">
                Published on {new Date(studentWork.publishedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
