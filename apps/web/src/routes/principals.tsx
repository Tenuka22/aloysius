"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components-client/navbar";
import { Footer } from "@/components-client/footer";
import { client } from "@/utils/orpc";

gsap.registerPlugin(ScrollTrigger);

type Principal = {
  id: string;
  slug: string;
  name: string;
  title: string | null;
  quote: string | null;
  message: string | null;
  bio: string | null;
  education: string | null;
  tenure: string | null;
  portrait: string | null;
  sortOrder: number;
  status: string;
  createdAt: string;
};

export const Route = createFileRoute("/principals")({
  loader: async () => {
    const [principalsData, settings] = await Promise.all([
      client.principals.list({ page: 1, pageSize: 50, status: "published", sort: "sortOrder", sortDir: "asc" }),
      client.settings.getAll(),
    ]);
    return {
      principals: principalsData.rows,
      settings,
    };
  },
  component: PrincipalsPage,
});

function PrincipalsPage() {
  const { principals, settings } = Route.useLoaderData();
  const heroRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-animate]",
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: { trigger: listRef.current, start: "top 85%", once: true },
        },
      );
    }, listRef);
    return () => ctx.revert();
  }, [principals]);

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
      <section
        ref={heroRef}
        className="bg-green-dark py-20 sm:py-28 px-4 sm:px-6 lg:px-12"
      >
        <div className="mx-auto max-w-[1080px]">
          <div className="text-[11px] tracking-[0.4em] font-bold text-gold mb-4">
            ST. ALOYSIUS&rsquo; COLLEGE
          </div>
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-[56px] font-bold text-cream leading-[1.1] mb-5">
            Our Principals
          </h1>
          <p className="text-cream/70 text-lg sm:text-xl max-w-[600px] leading-relaxed">
            A legacy of visionary leadership guiding St. Aloysius&rsquo; College through the years.
          </p>
        </div>
      </section>

      {/* Principal Messages */}
      <main id="main-content" ref={listRef}>
        {principals.length === 0 ? (
          <div className="mx-auto max-w-[1080px] py-24 text-center">
            <p className="text-green-dark/40 text-sm tracking-wide">
              No principal messages available yet.
            </p>
          </div>
        ) : (
          <div className="py-16 sm:py-24 px-4 sm:px-6 lg:px-12">
            <div className="mx-auto max-w-[1080px] space-y-20">
              {principals.map((principal, index) => (
                <PrincipalCard key={principal.id} principal={principal} index={index} />
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer settings={settings} />
    </div>
  );
}

function PrincipalCard({ principal, index }: { principal: Principal; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const isEven = index % 2 === 0;

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el.querySelectorAll("[data-animate]"),
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 85%", once: true },
        },
      );
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={cardRef}
      className={`grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-10 lg:gap-[72px] items-center ${
        !isEven ? "lg:direction-rtl" : ""
      }`}
    >
      <div data-animate className={`relative max-w-[340px] mx-auto lg:mx-0 w-full ${!isEven ? "lg:order-2" : ""}`}>
        <div className="absolute -right-3.5 -bottom-3.5 w-full h-full border border-gold -z-10 pointer-events-none" />
        {principal.portrait ? (
          <img
            src={principal.portrait}
            alt={principal.name}
            className="w-full h-[420px] object-cover"
          />
        ) : (
          <div className="w-full h-[420px] flex items-center justify-center bg-gradient-to-br from-green-dark/10 to-green-dark/5">
            <span className="text-[11px] tracking-widest text-green-dark/40 font-semibold">
              PRINCIPAL PORTRAIT
            </span>
          </div>
        )}
      </div>
      <div data-animate className={!isEven ? "lg:order-1" : ""}>
        <div className="text-[11px] tracking-[0.4em] font-bold text-red-brand mb-4.5">
          FROM THE PRINCIPAL
        </div>
        {principal.quote && (
          <p className="font-heading text-2xl sm:text-[32px] leading-[1.35] font-medium text-green-dark mb-6.5">
            &ldquo;{principal.quote}&rdquo;
          </p>
        )}
        <div className="font-heading italic text-[28px] text-green-dark/50">
          &mdash; {principal.name}
        </div>
        <div className="text-xs tracking-[0.16em] text-green-dark/60 my-1.5">
          {principal.title
            ? `${principal.title.toUpperCase()}, ST. ALOYSIUS&rsquo; COLLEGE`
            : "PRINCIPAL, ST. ALOYSIUS&rsquo; COLLEGE"}
        </div>
        {principal.slug ? (
          <Link
            to="/principals/$slug"
            params={{ slug: principal.slug }}
            className="inline-flex items-center gap-2.5 font-bold text-sm text-green-dark border-b-2 border-gold pb-1.5 mt-6"
          >
            Read the Full Message <span>&rarr;</span>
          </Link>
        ) : (
          principal.message && (
            <div className="mt-6">
              <div className="text-[11px] tracking-[0.4em] font-bold text-red-brand mb-3">
                THE PRINCIPAL&rsquo;S MESSAGE
              </div>
              <p className="font-heading text-lg leading-[1.6] text-green-dark whitespace-pre-wrap">
                {principal.message}
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
