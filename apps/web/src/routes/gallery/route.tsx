"use client";

import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components-client/navbar";
import { Footer } from "@/components-client/footer";
import { orpc } from "@/utils/orpc";
import { IconX, IconEye } from "@tabler/icons-react";
import { getAspectRatio, aspectRatioClass } from "@/lib/image-ratio";

export const Route = createFileRoute("/gallery")({
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
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.prefetchQuery(
        orpc.gallery.list.queryOptions({
          input: { page: 1, pageSize: 50, status: "published" },
        }),
      ),
      context.queryClient.prefetchQuery(orpc.settings.getAll.queryOptions()),
    ]);
  },
  component: GalleryPage,
});

function QuickPeekModal({
  albumId,
  albumSlug,
  albumTitle,
  albumDescription,
  onClose,
}: {
  albumId: string;
  albumSlug: string;
  albumTitle: string;
  albumDescription: string | null;
  onClose: () => void;
}) {
  const { data, isLoading } = useQuery(
    orpc.gallery.listImages.queryOptions({
      input: { galleryId: albumId, page: 1, pageSize: 20 },
    }),
  );

  const images = data?.rows ?? [];

  return (
    <div
      className="fixed inset-0 z-50 bg-[#013405]/95 flex items-center justify-center p-4 sm:p-8"
      onClick={onClose}
    >
      <div
        className="relative bg-[#fffdf6] w-full max-w-4xl max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-[#013405]/10">
          <div className="min-w-0">
            <h2 className="font-['Cormorant_Garamond'] font-semibold text-2xl sm:text-3xl text-[#013405] leading-snug">
              {albumTitle}
            </h2>
            {albumDescription && (
              <p className="text-[13px] text-[#013405]/55 mt-1.5 line-clamp-2">{albumDescription}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="shrink-0 text-[#013405]/40 hover:text-[#013405] transition-colors"
            aria-label="Close quick peek"
          >
            <IconX className="size-6" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(85vh-140px)] px-6 py-5">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="size-8 border-2 border-[#FFB203] border-t-transparent animate-spin" />
            </div>
          ) : images.length > 0 ? (
            <div className="columns-2 sm:columns-3 gap-3 space-y-3">
              {images.map((image) => {
                const ratio = getAspectRatio(image.url);
                const aspectClass = aspectRatioClass(ratio);
                return (
                  <div key={image.id} className="break-inside-avoid overflow-hidden bg-[#013405]/[0.03]">
                    <div className={aspectClass || ""}>
                      <img
                        src={image.url}
                        alt={image.caption ?? ""}
                        className={`w-full h-full object-cover hover:scale-105 transition-transform duration-500${aspectClass ? "" : " h-auto"}`}
                        loading="lazy"
                      />
                    </div>
                    {image.caption && (
                      <div className="px-2.5 py-2">
                        <p className="text-[11px] text-[#013405]/50 line-clamp-1">{image.caption}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-[#013405]/40 py-16 text-sm">No photos yet.</div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-[#013405]/10 flex items-center justify-between">
          <span className="text-[11px] tracking-[0.14em] font-bold text-[#013405]/40">
            {images.length} PHOTO{images.length === 1 ? "" : "S"}
          </span>
          <Link
            to="/gallery/$slug"
            params={{ slug: albumSlug }}
            onClick={onClose}
            className="inline-flex items-center gap-2 bg-[#013405] px-5 py-2.5 text-[11px] tracking-[0.14em] font-bold text-[#FFB203] hover:bg-[#062B0A] transition-colors"
          >
            VIEW FULL ALBUM
          </Link>
        </div>
      </div>
    </div>
  );
}

function AlbumCard({
  album,
  onPeek,
}: {
  album: { id: string; slug: string; title: string; description: string | null; coverImage: string | null };
  onPeek: (id: string) => void;
}) {
  return (
    <div className="group bg-[#fffdf6] overflow-hidden border border-[#013405]/15 hover:border-[#FFB203] transition-colors duration-300">
      <Link to="/gallery/$slug" params={{ slug: album.slug }} className="block">
        {album.coverImage ? (
          <div className="overflow-hidden">
            {(() => {
              const ratio = getAspectRatio(album.coverImage);
              const aspectClass = aspectRatioClass(ratio);
              return (
                <div className={aspectClass || ""}>
                  <img
                    src={album.coverImage}
                    alt={album.title}
                    className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500${aspectClass ? "" : " h-auto"}`}
                  />
                </div>
              );
            })()}
          </div>
        ) : (
          <div className="aspect-[3/2] bg-[#013405]/[0.04] flex items-center justify-center">
            <span className="text-[11px] tracking-[0.18em] text-[#013405]/40 font-semibold">
              NO COVER
            </span>
          </div>
        )}
      </Link>

      <div className="px-4 py-3 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-['Cormorant_Garamond'] font-semibold text-base sm:text-lg text-[#013405] truncate">
            {album.title}
          </h3>
          {album.description && (
            <p className="text-[12px] text-[#013405]/45 line-clamp-1 mt-0.5">{album.description}</p>
          )}
        </div>
        <button
          onClick={() => onPeek(album.id)}
          className="shrink-0 text-[#013405]/30 hover:text-[#FFB203] transition-colors"
          aria-label={`Quick peek: ${album.title}`}
        >
          <IconEye className="size-4" />
        </button>
      </div>
    </div>
  );
}

function GalleryPage() {
  const { data } = useSuspenseQuery(
    orpc.gallery.list.queryOptions({
      input: { page: 1, pageSize: 50, status: "published" },
    }),
  );
  const { data: settings } = useSuspenseQuery(orpc.settings.getAll.queryOptions());

  const albums = data?.rows ?? [];

  const [peekId, setPeekId] = useState<string | null>(null);
  const peekAlbum = albums.find((a) => a.id === peekId);

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
            &nbsp;/&nbsp;<span className="text-[#FFB203]">GALLERY</span>
          </div>
          <div className="flex items-center gap-4.5 mb-6.5">
            <span className="h-px w-12 bg-[#FFB203]/50 shrink-0" />
            <span className="text-[11px] tracking-[0.4em] font-bold text-[#FFB203]">
              PHOTO ALBUMS
            </span>
          </div>
          <h1 className="font-['Cormorant_Garamond'] font-semibold text-5xl sm:text-6xl lg:text-[72px] leading-[1.02] m-0">
            Photo Gallery
          </h1>
          <p className="text-[15px] sm:text-base text-[#FFF8E7]/65 mt-6 max-w-[62ch]">
            Browse through our collection of memories from events, activities, and campus life at
            St. Aloysius&rsquo; College.
          </p>
        </div>
      </section>

      {/* Albums */}
      <main
        id="main-content"
        className="bg-[#fffdf6] border-t border-[#013405]/[0.08] pt-16 sm:pt-20 pb-22.5 px-4 sm:px-6 lg:px-12"
      >
        <div className="mx-auto max-w-295">
          {albums.length === 0 ? (
            <div className="text-center py-16 text-[#013405]/50">No albums published yet.</div>
          ) : (
            <div className="columns-1 sm:columns-2 gap-4 space-y-4">
              {albums.map((album) => (
                <div key={album.id} className="break-inside-avoid">
                  <AlbumCard album={album} onPeek={setPeekId} />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer settings={settings} />

      {/* Quick Peek Modal */}
      {peekId && peekAlbum && (
        <QuickPeekModal
          albumId={peekAlbum.id}
          albumSlug={peekAlbum.slug}
          albumTitle={peekAlbum.title}
          albumDescription={peekAlbum.description}
          onClose={() => setPeekId(null)}
        />
      )}
    </div>
  );
}
