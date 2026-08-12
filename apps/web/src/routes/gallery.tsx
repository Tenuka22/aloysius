"use client";

import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components-client/navbar";
import { Footer } from "@/components-client/footer";
import { client } from "@/utils/orpc";

type GalleryAlbum = {
  id: string;
  title: string;
  description: string | null;
  coverImage: string | null;
  eventId: string | null;
};

export const Route = createFileRoute("/gallery")({
  component: GalleryPage,
});

function GalleryPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["gallery", "public"],
    queryFn: () => client.gallery.list({ page: 1, pageSize: 50, status: "published" }),
  });

  const albums = (data?.rows ?? []) as GalleryAlbum[];

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
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">Photo Gallery</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Browse through our collection of memories from events, activities, and campus life.
            </p>
          </div>
        </section>

        <section className="px-4 sm:px-6 lg:px-8 pb-16">
          <div className="mx-auto max-w-6xl">
            {isLoading ? (
              <div className="text-center text-muted-foreground py-16">Loading albums...</div>
            ) : albums.length === 0 ? (
              <div className="text-center text-muted-foreground py-16">No albums yet.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {albums.map((album) => (
                  <Link
                    key={album.id}
                    to="/gallery/$slug"
                    params={{ slug: album.slug }}
                    className="group block overflow-hidden rounded-xl border bg-card hover:shadow-md transition-shadow"
                  >
                    {album.coverImage ? (
                      <div className="aspect-[16/10] overflow-hidden">
                        <img
                          src={album.coverImage}
                          alt={album.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <div className="aspect-[16/10] bg-muted flex items-center justify-center">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1"
                          className="size-10 text-muted-foreground/40"
                        >
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <path d="M21 15l-5-5L5 21" />
                        </svg>
                      </div>
                    )}
                    <div className="p-5">
                      <h3 className="font-semibold text-lg mb-1 line-clamp-1">{album.title}</h3>
                      {album.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {album.description}
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
