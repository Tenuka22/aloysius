"use client";

import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Navbar } from "@/components-client/navbar";
import { Footer } from "@/components-client/footer";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/gallery_/$slug")({
  loader: async ({ context, params }) => {
    await context.queryClient.prefetchQuery(
      orpc.gallery.get.queryOptions({ input: { slug: params.slug } }),
    );
  },
  component: AlbumDetailPage,
});

function AlbumDetailPage() {
  const { slug } = Route.useParams();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const { data: album } = useSuspenseQuery(orpc.gallery.get.queryOptions({ input: { slug } }));

  const images = album.images;

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);

  const showPrev = () => {
    if (lightboxIndex !== null && lightboxIndex > 0) {
      setLightboxIndex(lightboxIndex - 1);
    }
  };

  const showNext = () => {
    if (lightboxIndex !== null && lightboxIndex < images.length - 1) {
      setLightboxIndex(lightboxIndex + 1);
    }
  };

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
          <div className="mx-auto max-w-5xl">
            <div className="mb-4">
              <Link
                to="/gallery"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                &larr; Back to Gallery
              </Link>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
              {album.title}
            </h1>
            {album.description && (
              <p className="text-muted-foreground text-lg max-w-2xl">
                {album.description}
              </p>
            )}
          </div>
        </section>

        <section className="px-4 sm:px-6 lg:px-8 pb-16">
          <div className="mx-auto max-w-6xl">
            {images.length > 0 ? (
              <div className="columns-2 sm:columns-3 lg:columns-4 gap-4 space-y-4">
                {images.map((image, index) => (
                  <div
                    key={image.id}
                    className="break-inside-avoid group cursor-pointer overflow-hidden rounded-lg border bg-card hover:shadow-md transition-shadow"
                    onClick={() => openLightbox(index)}
                  >
                    <div className="relative overflow-hidden">
                      <img
                        src={image.url}
                        alt={image.caption ?? ""}
                        className="w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    </div>
                    {image.caption && (
                      <div className="p-3">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {image.caption}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-16">
                No photos in this album yet.
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />

      {lightboxIndex !== null && images[lightboxIndex] && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors z-10"
            aria-label="Close lightbox"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="size-8"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>

          {lightboxIndex > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                showPrev();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white transition-colors z-10"
              aria-label="Previous image"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="size-10"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
          )}

          {lightboxIndex < images.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                showNext();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white transition-colors z-10"
              aria-label="Next image"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="size-10"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          )}

          <div className="max-w-[90vw] max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
            <img
              src={images[lightboxIndex].url}
              alt={images[lightboxIndex].caption ?? ""}
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
            />
            {images[lightboxIndex].caption && (
              <p className="text-white/80 text-center mt-3 text-sm">
                {images[lightboxIndex].caption}
              </p>
            )}
            <p className="text-white/50 text-center mt-1 text-xs">
              {lightboxIndex + 1} / {images.length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
