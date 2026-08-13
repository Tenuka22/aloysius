"use client";

import { useRef, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { IconPhoto } from "@tabler/icons-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type FeaturedAlbum = {
  id: string;
  activityId: string;
  title: string;
  description: string | null;
  coverImage: string | null;
  featuredOnHome: boolean;
  imageCount: number;
  clubName: string | null;
};

export function ClubAlbumsHome({
  initialAlbums,
  settings,
}: {
  initialAlbums?: FeaturedAlbum[];
  settings?: Record<string, string>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);

  const albums = initialAlbums ?? [];
  const heading = settings?.club_albums_heading || "Club Moments";

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        headingRef.current,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: "power3.out",
          scrollTrigger: { trigger: headingRef.current, start: "top 90%", once: true },
        },
      );

      gsap.fromTo(
        ref.current?.children ?? [],
        { opacity: 0, scale: 0.95 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.5,
          stagger: 0.06,
          ease: "power3.out",
          scrollTrigger: { trigger: ref.current, start: "top 90%", once: true },
        },
      );
    });

    return () => ctx.revert();
  }, []);

  if (albums.length === 0) return null;

  return (
    <section className="py-16 sm:py-20 bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div ref={headingRef} className="mb-10">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#c9a227] mb-2 block">
            From Our Clubs
          </span>
          <h2 className="text-2xl sm:text-3xl font-light">{heading}</h2>
        </div>

        <div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {albums.map((album) => (
            <Link
              key={album.id}
              to="/clubs/$id"
              params={{ id: album.activityId }}
              className="group rounded-xl border bg-card overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="relative aspect-video overflow-hidden bg-muted">
                {album.coverImage ? (
                  <img
                    src={album.coverImage}
                    alt={album.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <IconPhoto className="size-10 text-muted-foreground/40" />
                  </div>
                )}
                {album.clubName && (
                  <span className="absolute top-2 left-2 inline-flex items-center rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white backdrop-blur">
                    {album.clubName}
                  </span>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold group-hover:text-primary transition-colors">
                  {album.title}
                </h3>
                {album.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {album.description}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  {album.imageCount} photo{album.imageCount === 1 ? "" : "s"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
