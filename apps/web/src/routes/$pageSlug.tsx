"use client"

import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { Navbar } from "@/components-client/navbar"
import { Footer } from "@/components-client/footer"
import { client } from "@/utils/orpc"

type PageData = {
  id: string
  slug: string
  title: string
  content: string
  excerpt: string | null
  coverImage: string | null
  status: string
}

export const Route = createFileRoute("/$pageSlug")({
  component: CmsPage,
})

function CmsPage() {
  const { pageSlug } = Route.useParams()

  const { data: page, isLoading, error } = useQuery({
    queryKey: ["pages", "public", pageSlug],
    queryFn: () => client.pages.getBySlug({ slug: pageSlug }),
  })

  const pageData = page as PageData | undefined

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
        {isLoading ? (
          <div className="px-4 sm:px-6 lg:px-8 pt-16 pb-16">
            <div className="mx-auto max-w-4xl text-center text-muted-foreground py-16">
              Loading...
            </div>
          </div>
        ) : error || !pageData || pageData.status !== "published" ? (
          <div className="px-4 sm:px-6 lg:px-8 pt-16 pb-16">
            <div className="mx-auto max-w-4xl text-center py-16">
              <h1 className="text-4xl font-bold mb-4">Page Not Found</h1>
              <p className="text-muted-foreground text-lg">
                The page you&apos;re looking for doesn&apos;t exist or has not been published.
              </p>
            </div>
          </div>
        ) : (
          <>
            {pageData.coverImage && (
              <div className="px-4 sm:px-6 lg:px-8 pt-16">
                <div className="mx-auto max-w-5xl">
                  <div className="aspect-[21/9] overflow-hidden rounded-2xl">
                    <img
                      src={pageData.coverImage}
                      alt={pageData.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            )}

            <section className="px-4 sm:px-6 lg:px-8 pt-12 pb-16">
              <div className="mx-auto max-w-4xl">
                <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-8">
                  {pageData.title}
                </h1>

                <div
                  className="prose prose-gray dark:prose-invert max-w-none prose-headings:tracking-tight prose-a:text-primary prose-img:rounded-xl"
                  dangerouslySetInnerHTML={{ __html: pageData.content }}
                />
              </div>
            </section>
          </>
        )}
      </main>
      <Footer />
    </div>
  )
}
