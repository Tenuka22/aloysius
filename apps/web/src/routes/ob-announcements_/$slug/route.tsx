"use client";

import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Navbar } from "@/components-client/navbar";
import { Footer } from "@/components-client/footer";
import { orpc } from "@/utils/orpc";

const audienceLabels: Record<string, string> = {
  all: "Everyone",
  students: "Students",
  parents: "Parents",
  staff: "Staff",
  alumni: "Alumni",
};

export const Route = createFileRoute("/ob-announcements_/$slug")({
  loader: async ({ context, params }) => {
    await context.queryClient.prefetchQuery(
      orpc.ob.obAnnouncements.get.queryOptions({ input: { slug: params.slug } }),
    );
  },
  component: OBAnnouncementDetailPage,
});

function OBAnnouncementDetailPage() {
  const { slug } = Route.useParams();

  const { data: announcement } = useSuspenseQuery(
    orpc.ob.obAnnouncements.get.queryOptions({ input: { slug } }),
  );

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
                to="/ob"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                &larr; Back to Old Boys&rsquo; Association
              </Link>
            </div>

            {!announcement ? (
              <div className="text-center py-16">
                <h1 className="text-2xl font-bold mb-2">Announcement not found</h1>
                <p className="text-muted-foreground">
                  This announcement may not exist or has not been published.
                </p>
              </div>
            ) : (
              <>
                {announcement.coverImage && (
                  <div className="aspect-[16/9] overflow-hidden rounded-xl mb-8">
                    <img
                      src={announcement.coverImage}
                      alt={announcement.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {announcement.audience && announcement.audience !== "all" && (
                    <div className="mb-4">
                      <span className="inline-flex items-center rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                        {audienceLabels[announcement.audience] ??
                          announcement.audience}
                      </span>
                    </div>
                  )}

                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                  {announcement.title}
                </h1>

                {announcement.publishedAt && (
                  <div className="flex items-center gap-4 flex-wrap mb-6 text-sm text-muted-foreground">
                    <time dateTime={announcement.publishedAt}>
                      {new Date(announcement.publishedAt).toLocaleDateString()}
                    </time>
                  </div>
                )}

                {announcement.excerpt && (
                  <p className="text-lg text-muted-foreground mb-6 italic">
                    {announcement.excerpt}
                  </p>
                )}

                {announcement.content && (
                  <div
                    className="prose prose-neutral dark:prose-invert max-w-none mb-8"
                    dangerouslySetInnerHTML={{ __html: announcement.content }}
                  />
                )}
              </>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
