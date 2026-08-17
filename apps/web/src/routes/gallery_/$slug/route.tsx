"use client";

import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Navbar } from "@/components-client/navbar";
import { Footer } from "@/components-client/footer";
import { orpc } from "@/utils/orpc";
import { getAspectRatio, aspectRatioClass } from "@/lib/image-ratio";

export const Route = createFileRoute("/gallery_/$slug")({
  head: () => ({
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&display=swap",
      },
    ],
  }),
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.prefetchQuery(
        orpc.gallery.get.queryOptions({ input: { slug: params.slug } }),
      ),
      context.queryClient.prefetchQuery(
        orpc.settings.getAll.queryOptions(),
      ),
    ]);
  },
  component: AlbumDetailPage,
});

function AlbumDetailPage() {
  const { slug } = Route.useParams();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const { data: album } = useSuspenseQuery(orpc.gallery.get.queryOptions({ input: { slug } }));
  const { data: settings } = useSuspenseQuery(orpc.settings.getAll.queryOptions());

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
    <div className="min-h-screen bg-[#FFF8E7]" style={{ fontFamily: "'Manrope', sans-serif" }}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-100 focus:top-2 focus:left-2 focus:border focus:border-[#FFB203] focus:bg-[#013405] focus:px-4 focus:py-2 focus:text-sm focus:text-[#FFB203] focus:outline-none"
      >
        Skip to main content
      </a>
      <Navbar settings={settings} />

      {/* Hero */}
      <section className="bg-[#013405] text-[#FFF8E7] pt-20 pb-16 sm:pt-24 sm:pb-19 px-4 sm:px-6 lg:px-12">
        <div className="mx-auto max-w-295">
          <div className="text-xs tracking-[0.2em] text-[#FFF8E7]/60 mb-6.5">
            <Link to="/" className="hover:text-[#FFB203] transition-colors">
              HOME
            </Link>
            &nbsp;/&nbsp;
            <Link to="/gallery" className="hover:text-[#FFB203] transition-colors">
              GALLERY
            </Link>
            &nbsp;/&nbsp;<span className="text-[#FFB203]">{album.title.toUpperCase()}</span>
          </div>
          <div className="flex items-center gap-4.5 mb-6.5">
            <span className="h-px w-12 bg-[#FFB203]/50 shrink-0" />
            <span className="text-[11px] tracking-[0.4em] font-bold text-[#FFB203]">
              ALBUM
            </span>
          </div>
          <h1 className="font-['Cormorant_Garamond'] font-semibold text-4xl sm:text-5xl lg:text-[54px] leading-[1.05] m-0">
            {album.title}
          </h1>
          {album.description && (
            <p className="text-[15px] sm:text-base text-[#FFF8E7]/65 mt-6 max-w-[62ch] leading-relaxed">
              {album.description}
            </p>
          )}
          <div className="mt-5 text-[11px] tracking-[0.14em] font-bold text-[#FFB203]/60">
            {images.length} PHOTO{images.length === 1 ? "" : "S"}
          </div>
        </div>
      </section>

      {/* Photos */}
      <main
        id="main-content"
        className="bg-[#fffdf6] border-t border-[#013405]/[0.08] pt-16 sm:pt-20 pb-22.5 px-4 sm:px-6 lg:px-12"
      >
        <div className="mx-auto max-w-295">
          {images.length > 0 ? (
            <div className="columns-2 sm:columns-3 lg:columns-4 gap-4 space-y-4">
              {images.map((image, index) => (
                <div
                  key={image.id}
                  className="break-inside-avoid group cursor-pointer overflow-hidden bg-[#fffdf6] border border-[#013405]/15 hover:border-[#FFB203] transition-colors"
                  onClick={() => openLightbox(index)}
                >
                  <div className="relative overflow-hidden">
                    {(() => {
                      const ratio = getAspectRatio(image.url);
                      const aspectClass = aspectRatioClass(ratio);
                      return (
                        <div className={aspectClass || ""}>
                          <img
                            src={image.url}
                            alt={image.caption ?? ""}
                            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500${aspectClass ? "" : " h-auto"}`}
                            loading="lazy"
                          />
                        </div>
                      );
                    })()}
                    <div className="absolute inset-0 bg-[#013405]/0 group-hover:bg-[#013405]/10 transition-colors duration-300" />
                  </div>
                  {image.caption && (
                    <div className="px-3 py-2.5">
                      <p className="text-[12px] text-[#013405]/55 line-clamp-2 leading-relaxed">
                        {image.caption}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-[#013405]/50 py-16">
              No photos in this album yet.
            </div>
          )}
        </div>
      </main>

      <Footer settings={settings} />

      {/* Lightbox */}
      {lightboxIndex !== null && images[lightboxIndex] && (
        <div
          className="fixed inset-0 z-50 bg-[#013405]/95 flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-5 right-5 text-[#FFB203]/70 hover:text-[#FFB203] transition-colors z-10"
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
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#FFB203]/70 hover:text-[#FFB203] transition-colors z-10"
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
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#FFB203]/70 hover:text-[#FFB203] transition-colors z-10"
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
              className="max-w-full max-h-[85vh] object-contain"
            />
            {images[lightboxIndex].caption && (
              <p className="text-[#FFF8E7]/80 text-center mt-3 text-sm font-['Cormorant_Garamond'] italic">
                {images[lightboxIndex].caption}
              </p>
            )}
            <p className="text-[#FFB203]/50 text-center mt-1 text-xs tracking-[0.14em] font-bold">
              {lightboxIndex + 1} / {images.length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
