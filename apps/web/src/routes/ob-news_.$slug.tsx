"use client";

import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Navbar } from "@/components-client/navbar";
import { Footer } from "@/components-client/footer";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/ob-news_/$slug")({
  loader: async ({ context, params }) => {
    await context.queryClient.prefetchQuery(
      orpc.ob.obNews.get.queryOptions({ input: { slug: params.slug } }),
    );
  },
  component: OBNewsDetailPage,
});

function OBNewsDetailPage() {
  const { slug } = Route.useParams();

  const { data: newsItem } = useSuspenseQuery(
    orpc.ob.obNews.get.queryOptions({ input: { slug } }),
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

            {!newsItem ? (
              <div className="text-center py-16">
                <h1 className="text-2xl font-bold mb-2">Article not found</h1>
                <p className="text-muted-foreground">
                  This article may not exist or has not been published.
                </p>
              </div>
            ) : (
              <>
                {newsItem.coverImage && (
                  <div className="aspect-[16/9] overflow-hidden rounded-xl mb-8">
                    <img
                      src={newsItem.coverImage}
                      alt={newsItem.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                  {newsItem.title}
                </h1>

                {newsItem.publishedAt && (
                  <div className="flex items-center gap-4 flex-wrap mb-6 text-sm text-muted-foreground">
                    <time dateTime={newsItem.publishedAt}>
                      {new Date(newsItem.publishedAt).toLocaleDateString()}
                    </time>
                  </div>
                )}

                {newsItem.excerpt && (
                  <p className="text-lg text-muted-foreground mb-6 italic">
                    {newsItem.excerpt}
                  </p>
                )}

                {newsItem.content && (
                  <div
                    className="prose prose-neutral dark:prose-invert max-w-none mb-8"
                    dangerouslySetInnerHTML={{ __html: newsItem.content }}
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
