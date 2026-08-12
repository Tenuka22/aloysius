import { createFileRoute, Link } from "@tanstack/react-router"
import { Navbar } from "@/components-client/navbar"
import { Footer } from "@/components-client/footer"

type NewsItem = {
  id: string
  title: string
  content: string | null
  excerpt: string | null
  coverImage: string | null
  tags: string[] | null
  authorName: string | null
  authorType: string | null
  publishedAt: string | null
}

const authorTypeLabels: Record<string, string> = {
  student: "Student",
  faculty: "Faculty",
  club: "Club",
  org: "Organization",
}

export const Route = createFileRoute("/news_/$newsId")({
  loader: async ({ params }) => {
    const [{ createRouterClient }, { appRouter }] = await Promise.all([
      import("@orpc/server"),
      import("@aloysius-web/api/routers/index"),
    ])

    const serverClient = createRouterClient(appRouter)
    const newsItem = await serverClient.news.get({ id: params.newsId })
    return { newsItem }
  },
  staleTime: 5 * 60_000,
  component: NewsDetailPage,
})

function NewsDetailPage() {
  const { newsItem } = Route.useLoaderData() as { newsItem: NewsItem }

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

            <div className="flex items-center gap-4 flex-wrap mb-6 text-sm text-muted-foreground">
              {newsItem.authorName && (
                <span>
                  by {newsItem.authorName}
                  {newsItem.authorType && ` (${authorTypeLabels[newsItem.authorType] ?? newsItem.authorType})`}
                </span>
              )}
              {newsItem.publishedAt && (
                <time dateTime={newsItem.publishedAt}>
                  {new Date(newsItem.publishedAt).toLocaleDateString()}
                </time>
              )}
            </div>

            {newsItem.excerpt && (
              <p className="text-lg text-muted-foreground mb-6 italic">
                {newsItem.excerpt}
              </p>
            )}

            {newsItem.content && (
              <div className="prose prose-neutral dark:prose-invert max-w-none mb-8">
                <div className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
                  {newsItem.content}
                </div>
              </div>
            )}

            {newsItem.tags && newsItem.tags.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {newsItem.tags.map((tag) => (
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
  )
}
