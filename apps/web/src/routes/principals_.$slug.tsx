"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components-client/navbar";
import { Footer } from "@/components-client/footer";
import { client } from "@/utils/orpc";
import { getAspectRatio, aspectRatioClass } from "@/lib/image-ratio";

gsap.registerPlugin(ScrollTrigger);

export const Route = createFileRoute("/principals_/$slug")({
  loader: async ({ params }) => {
    const [principal, settings] = await Promise.allSettled([
      client.principals.get({ slug: params.slug }),
      client.settings.getAll(),
    ]);
    return {
      principal: principal.status === "fulfilled" ? principal.value : null,
      settings: settings.status === "fulfilled" ? settings.value : {},
    };
  },
  staleTime: 5 * 60_000,
  component: PrincipalDetailPage,
});

function PrincipalDetailPage() {
  const { principal, settings } = Route.useLoaderData();
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-animate]",
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: { trigger: pageRef.current, start: "top 85%", once: true },
        },
      );
    }, pageRef);
    return () => ctx.revert();
  }, []);

  if (!principal) {
    return (
      <div className="min-h-screen bg-cream">
        <Navbar />
        <main className="py-32 px-4 text-center">
          <h1 className="font-heading text-3xl sm:text-4xl font-semibold text-green-dark mb-3">
            Principal Not Found
          </h1>
          <p className="text-green-dark/60 mb-8">
            The principal you are looking for may not exist or has not been published.
          </p>
          <Link
            to="/principals"
            className="inline-flex items-center gap-2.5 font-bold text-sm text-green-dark border-b-2 border-gold pb-1.5"
          >
            &larr; All Principals
          </Link>
        </main>
        <Footer settings={settings} />
      </div>
    );
  }

  const titleLine = principal.title?.trim() || "Principal";
  const schoolLine = settings.school_name?.trim() || "St. Aloysius' College";

  return (
    <div className="min-h-screen bg-cream">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-100 focus:top-2 focus:left-2 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:text-primary-foreground focus:outline-none"
      >
        Skip to main content
      </a>
      <Navbar />

      {/* Hero */}
      <section className="bg-green-dark py-20 sm:py-24 px-4 sm:px-6 lg:px-12">
        <div className="mx-auto max-w-[1080px]">
          <Link
            to="/principals"
            className="text-xs tracking-[0.2em] text-gold/80 font-semibold hover:text-gold transition-colors"
          >
            &larr; ALL PRINCIPALS
          </Link>
          <div className="text-[11px] tracking-[0.4em] font-bold text-gold mt-8 mb-4">
            FROM THE PRINCIPAL
          </div>
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-[56px] font-bold text-cream leading-[1.1]">
            {principal.name}
          </h1>
          <p className="text-cream/70 text-lg mt-3">
            {titleLine.toUpperCase()}, {schoolLine.toUpperCase()}
            {principal.tenure ? ` &bull; ${principal.tenure.toUpperCase()}` : ""}
          </p>
        </div>
      </section>

      <main id="main-content" ref={pageRef}>
        <div className="py-16 sm:py-24 px-4 sm:px-6 lg:px-12">
          <div className="mx-auto max-w-[1080px] grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-10 lg:gap-[72px] items-start">
            {/* Portrait */}
            <div data-animate className="relative max-w-[340px] mx-auto lg:mx-0 w-full">
              <div className="absolute -right-3.5 -bottom-3.5 w-full h-full border border-gold -z-10 pointer-events-none" />
              {principal.portrait ? (
                <img
                  src={principal.portrait}
                  alt={principal.name}
                  className={`w-full ${aspectRatioClass(getAspectRatio(principal.portrait)) || "aspect-[3/4]"} object-cover`}
                />
              ) : (
                <div className="w-full h-[420px] flex items-center justify-center bg-gradient-to-br from-green-dark/10 to-green-dark/5">
                  <span className="text-[11px] tracking-widest text-green-dark/40 font-semibold">
                    PRINCIPAL PORTRAIT
                  </span>
                </div>
              )}
            </div>

            {/* Content */}
            <div data-animate className="space-y-9">
              {principal.message ? (
                <div>
                  <div className="text-[11px] tracking-[0.4em] font-bold text-red-brand mb-4.5">
                    THE PRINCIPAL&rsquo;S MESSAGE
                  </div>
                  <div className="prose prose-green-dark max-w-none whitespace-pre-wrap font-heading text-xl sm:text-2xl leading-[1.6] text-green-dark">
                    {principal.message}
                  </div>
                  <div className="font-heading italic text-[28px] text-green-dark/50 mt-6">
                    &mdash; {principal.name}
                  </div>
                  <div className="text-xs tracking-[0.16em] text-green-dark/60 mt-1.5">
                    {titleLine.toUpperCase()}, {schoolLine.toUpperCase()}
                  </div>
                </div>
              ) : (
                principal.quote && (
                  <div>
                    <div className="text-[11px] tracking-[0.4em] font-bold text-red-brand mb-4.5">
                      FROM THE PRINCIPAL
                    </div>
                    <p className="font-heading text-2xl sm:text-[32px] leading-[1.35] font-medium text-green-dark">
                      &ldquo;{principal.quote}&rdquo;
                    </p>
                    <div className="font-heading italic text-[28px] text-green-dark/50 mt-6">
                      &mdash; {principal.name}
                    </div>
                  </div>
                )
              )}

              {principal.bio && (
                <div>
                  <div className="text-[11px] tracking-[0.4em] font-bold text-red-brand mb-4.5">
                    ABOUT
                  </div>
                  <p className="text-[15px] leading-relaxed text-green-dark/75 whitespace-pre-wrap">
                    {principal.bio}
                  </p>
                </div>
              )}

              {principal.education && (
                <div>
                  <div className="text-[11px] tracking-[0.4em] font-bold text-red-brand mb-4.5">
                    EDUCATION &amp; QUALIFICATIONS
                  </div>
                  <p className="text-[15px] leading-relaxed text-green-dark/75 whitespace-pre-line">
                    {principal.education}
                  </p>
                </div>
              )}

              {principal.tenure && (
                <div>
                  <div className="text-[11px] tracking-[0.4em] font-bold text-red-brand mb-4.5">
                    TENURE
                  </div>
                  <p className="text-[15px] font-semibold text-green-dark">{principal.tenure}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer settings={settings} />
    </div>
  );
}
