import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components-client/navbar";
import { Footer } from "@/components-client/footer";
import { client } from "@/utils/orpc";

type Event = {
  id: string;
  title: string;
  content: string | null;
  excerpt: string | null;
  coverImage: string | null;
  bodyImage: string | null;
  purpose: string | null;
  organization: string | null;
  organizerName: string | null;
  organizerType: string | null;
  location: string | null;
  startDate: string;
  endDate: string | null;
  isRecurring: boolean;
  isAllDay: boolean;
  tags: string[] | null;
  publishedAt: string | null;
};

const authorTypeLabels: Record<string, string> = {
  student: "Student",
  faculty: "Faculty",
  club: "Club",
  org: "Organization",
};

export const Route = createFileRoute("/events_/$slug")({
  loader: async ({ params }) => {
    const event = await client.events.get({ slug: params.slug });
    return { event };
  },
  staleTime: 5 * 60_000,
  component: EventDetailPage,
});

function EventDetailPage() {
  const { event } = Route.useLoaderData() as { event: Event };

  const eventDate = new Date(event.startDate);
  const month = eventDate.toLocaleString("default", { month: "short" });
  const day = eventDate.getDate();
  const year = eventDate.getFullYear();
  const time = eventDate.toLocaleTimeString("default", { hour: "2-digit", minute: "2-digit" });

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

            {event.coverImage && (
              <div className="aspect-[16/9] overflow-hidden rounded-xl mb-8">
                <img
                  src={event.coverImage}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">{event.title}</h1>

            <div className="flex items-center gap-4 flex-wrap mb-6 text-muted-foreground">
              <div className="flex items-center gap-2">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="size-4"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <time dateTime={event.startDate}>
                  {month} {day}, {year}
                  {!event.isAllDay && ` at ${time}`}
                </time>
              </div>
              {event.isAllDay && <span className="text-sm">All day</span>}
              {event.location && (
                <div className="flex items-center gap-1">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="size-4"
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span>{event.location}</span>
                </div>
              )}
            </div>

            {event.purpose && (
              <div className="p-4 rounded-lg bg-muted/50 mb-6">
                <span className="text-sm font-medium text-muted-foreground">Purpose:</span>
                <span className="ml-2 text-sm">{event.purpose}</span>
              </div>
            )}

            {(event.organizerName || event.organization) && (
              <div className="flex items-center gap-4 flex-wrap mb-6 text-sm text-muted-foreground">
                {event.organization && <span>Organized by {event.organization}</span>}
                {event.organizerName && (
                  <span>
                    by {event.organizerName}
                    {event.organizerType &&
                      ` (${authorTypeLabels[event.organizerType] ?? event.organizerType})`}
                  </span>
                )}
                {event.isRecurring && (
                  <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    Recurring
                  </span>
                )}
              </div>
            )}

            {event.excerpt && (
              <p className="text-lg text-muted-foreground mb-6 italic">{event.excerpt}</p>
            )}

            {event.content && (
              <div className="prose prose-neutral dark:prose-invert max-w-none mb-8">
                <div className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
                  {event.content}
                </div>
              </div>
            )}

            {event.bodyImage && (
              <div className="rounded-xl overflow-hidden mb-8">
                <img src={event.bodyImage} alt="" className="w-full object-cover" />
              </div>
            )}

            {event.tags && event.tags.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {event.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {event.publishedAt && (
              <p className="text-sm text-muted-foreground mt-8">
                Published on {new Date(event.publishedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
