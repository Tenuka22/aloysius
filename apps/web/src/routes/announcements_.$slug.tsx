import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components-client/navbar";
import { Footer } from "@/components-client/footer";
import { client } from "@/utils/orpc";

type Announcement = {
  id: string;
  title: string;
  content: string | null;
  excerpt: string | null;
  coverImage: string | null;
  tags: string[] | null;
  audience: string;
  addressedTo: string | null;
  authorName: string | null;
  authorType: string | null;
  publishedAt: string | null;
};

const authorTypeLabels: Record<string, string> = {
  student: "Student",
  faculty: "Faculty",
  club: "Club",
  org: "Organization",
};

const audienceLabels: Record<string, string> = {
  all: "Everyone",
  students: "Students",
  parents: "Parents",
  staff: "Staff",
  alumni: "Alumni",
};

export const Route = createFileRoute("/announcements_/$slug")({
  loader: async ({ params }) => {
    const announcement = await client.announcements.get({ slug: params.slug });
    return { announcement };
  },
  staleTime: 5 * 60_000,
  component: AnnouncementDetailPage,
});

function AnnouncementDetailPage() {
  const { announcement } = Route.useLoaderData() as { announcement: Announcement };

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
                to="/news-events"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                &larr; Back to News & Events
              </Link>
            </div>

            {announcement.coverImage && (
              <div className="aspect-[16/9] overflow-hidden rounded-xl mb-8">
                <img
                  src={announcement.coverImage}
                  alt={announcement.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="flex items-center gap-3 mb-4 flex-wrap">
              {announcement.audience && announcement.audience !== "all" && (
                <span className="inline-flex items-center rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                  {audienceLabels[announcement.audience] ?? announcement.audience}
                </span>
              )}
              {announcement.addressedTo && (
                <span className="text-sm text-muted-foreground">
                  To: {announcement.addressedTo}
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              {announcement.title}
            </h1>

            <div className="flex items-center gap-4 flex-wrap mb-6 text-sm text-muted-foreground">
              {announcement.authorName && (
                <span>
                  by {announcement.authorName}
                  {announcement.authorType &&
                    ` (${authorTypeLabels[announcement.authorType] ?? announcement.authorType})`}
                </span>
              )}
              {announcement.publishedAt && (
                <time dateTime={announcement.publishedAt}>
                  {new Date(announcement.publishedAt).toLocaleDateString()}
                </time>
              )}
            </div>

            {announcement.excerpt && (
              <p className="text-lg text-muted-foreground mb-6 italic">{announcement.excerpt}</p>
            )}

            {announcement.content && (
              <div className="prose prose-neutral dark:prose-invert max-w-none mb-8">
                <div className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
                  {announcement.content}
                </div>
              </div>
            )}

            {announcement.tags && announcement.tags.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {announcement.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
