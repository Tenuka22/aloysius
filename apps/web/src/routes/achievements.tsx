"use client";

import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components-client/navbar";
import { Footer } from "@/components-client/footer";
import { client } from "@/utils/orpc";

type Achievement = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  recipientNames: string[];
  recipientType: string;
  year: number | null;
  coverImage: string | null;
};

export const Route = createFileRoute("/achievements")({
  component: AchievementsPage,
});

function AchievementsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["achievements", "public"],
    queryFn: () => client.achievements.list({ page: 1, pageSize: 50, status: "published" }),
  });

  const items = (data?.rows ?? []) as Achievement[];

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
          <div className="mx-auto max-w-5xl text-center">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">Our Achievements</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Celebrating excellence in academics, sports, arts, and community service.
            </p>
          </div>
        </section>

        <section className="px-4 sm:px-6 lg:px-8 pb-16">
          <div className="mx-auto max-w-6xl">
            {isLoading ? (
              <div className="text-center text-muted-foreground py-16">Loading achievements...</div>
            ) : items.length === 0 ? (
              <div className="text-center text-muted-foreground py-16">No achievements yet.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((item) => (
                  <Link
                    key={item.id}
                    to="/achievements/$slug"
                    params={{ slug: item.slug }}
                    className="group relative block overflow-hidden rounded-xl border bg-card hover:shadow-md transition-shadow"
                  >
                    <span className="absolute inset-y-0 left-0 w-0 bg-primary/90 group-hover:w-full transition-all duration-700 ease-out -z-0" />
                    {item.coverImage ? (
                      <div className="relative z-10 aspect-[16/10] overflow-hidden">
                        <img
                          src={item.coverImage}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <div className="relative z-10 aspect-[16/10] bg-muted flex items-center justify-center">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1"
                          className="size-10 text-primary/30"
                        >
                          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                        </svg>
                      </div>
                    )}
                    <div className="relative z-10 p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="inline-flex items-center rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-medium capitalize group-hover:bg-white/20 group-hover:text-white transition-colors">
                          {item.category}
                        </span>
                        {item.year && (
                          <span className="text-xs text-primary/70 group-hover:text-white/80 transition-colors">
                            {item.year}
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-lg mb-1 text-primary group-hover:text-white transition-colors line-clamp-2">
                        {item.title}
                      </h3>
                      {item.recipientNames && item.recipientNames.length > 0 && (
                        <p className="text-sm text-primary/60 group-hover:text-white/70 transition-colors mb-2">
                          {item.recipientNames.join(", ")}
                          <span className="ml-1 text-xs capitalize opacity-60">
                            ({item.recipientType})
                          </span>
                        </p>
                      )}
                      {item.description && (
                        <p className="text-sm text-primary/50 group-hover:text-white/60 transition-colors line-clamp-2">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </Link>
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
