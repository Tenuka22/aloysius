"use client";

import { useMemo, useRef, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { client, orpc } from "@/utils/orpc";
import type { OBMember, OBEvent, OBDonation } from "@/lib/api-types";

import { Navbar } from "@/components-client/navbar";
import { Footer } from "@/components-client/footer";
import { MediaImage } from "@/components-client/media-image";
import { sortByRole } from "@/lib/ob-sort";
import {
  IconHeart,
  IconUsers,
  IconDownload,
} from "@tabler/icons-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export const Route = createFileRoute("/ob")({
  beforeLoad: async () => {
    const settings = await client.settings.getAll();
    return { settings };
  },
  component: () => {
    const { settings } = Route.useRouteContext();
    return <OBPage settings={settings} />;
  },
});

function formatDate(date: string | Date | null) {
  if (!date) return "";
  return new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function OBPage({ settings }: { settings?: Record<string, string> } = {}) {
  const { data: members = [] } = useQuery(orpc.ob.obMembers.list.queryOptions({ input: {} }));
  const { data: events = [] } = useQuery(orpc.ob.obEvents.list.queryOptions({ input: {} }));
  const { data: donations = [] } = useQuery(orpc.ob.obDonations.list.queryOptions({ input: {} }));
  const { data: obGalleries = [] } = useQuery(
    orpc.gallery.list.queryOptions({
      input: { scope: "ob", status: "published", pageSize: 12 },
      select: (result) => result.rows,
    }),
  );
  const { data: obNews = [] } = useQuery(
    orpc.ob.obNews.list.queryOptions({ input: { status: "published" } }),
  );
  const { data: obAnnouncements = [] } = useQuery(
    orpc.ob.obAnnouncements.list.queryOptions({ input: { status: "published" } }),
  );




  const activeMembers = useMemo(
    () => members.filter((m: OBMember) => m.status === "approved" && m.role !== "ADMINISTRATOR"),
    [members],
  );

  const publishedEvents = useMemo(() => events.filter((e: OBEvent) => e.status === "published"), [events]);
  const confirmedDonations = useMemo(() => donations.filter((d: OBDonation) => d.status === "confirmed"), [donations]);
  const totalConfirmed = useMemo(
    () => confirmedDonations.reduce((sum: number, d: OBDonation) => sum + (d.amount || 0), 0),
    [confirmedDonations],
  );

  const currentYear = String(new Date().getFullYear());
  const yearMembers = useMemo(
    () => activeMembers.filter((m: OBMember) => m.year === currentYear || !m.year),
    [activeMembers, currentYear],
  );

  const headRoles = [
    "PATRON", "JESUIT REPRESENTATIVE", "PARISH PRIEST", "PRESIDENT",
    "VICE PRESIDENT - ADMINISTRATION", "VICE PRESIDENT - ACADEMICS",
    "VICE PRESIDENT - SOCIAL & CURRICULAR EVENTS", "VICE PRESIDENT - FUNDRAISING",
    "VICE PRESIDENT - MEMBERSHIP", "VICE PRESIDENT - PLAYGROUND & SPORTS",
    "SECRETARY", "ASSISTANT SECRETARY", "TREASURER", "ASSISTANT TREASURER",
  ];

  const headCommittee = useMemo(
    () => sortByRole(yearMembers.filter((m: OBMember) => headRoles.includes(m.role.toUpperCase()))),
    [yearMembers],
  );
  const regularMembers = useMemo(
    () => sortByRole(yearMembers.filter((m: OBMember) => !headRoles.includes(m.role.toUpperCase()))),
    [yearMembers],
  );

  const heroRef = useRef<HTMLElement>(null);
  const committeeRef = useRef<HTMLElement>(null);
  const membershipRef = useRef<HTMLElement>(null);
  const eventsRef = useRef<HTMLElement>(null);
  const donationsRef = useRef<HTMLElement>(null);
  const newsRef = useRef<HTMLElement>(null);
  const announcementsRef = useRef<HTMLElement>(null);
  const galleriesRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      for (const ref of [
        heroRef,
        committeeRef,
        membershipRef,
        eventsRef,
        donationsRef,
        newsRef,
        announcementsRef,
        galleriesRef,
      ]) {
        if (!ref.current) continue;
        gsap.fromTo(
          ref.current.querySelectorAll("[data-animate]"),
          { opacity: 0, y: 24 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.08,
            ease: "power3.out",
            scrollTrigger: { trigger: ref.current, start: "top 85%", once: true },
          },
        );
      }
    });
    return () => ctx.revert();
  }, []);

  return (
    <div className="min-h-screen bg-cream">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-100 focus:top-2 focus:left-2 focus:bg-green-dark focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-cream focus:outline-2 focus:outline-gold focus:outline-offset-2"
      >
        Skip to main content
      </a>
      <Navbar settings={settings} />

      {/* Hero */}
      <section
        ref={heroRef}
        className="relative bg-green-dark text-cream overflow-hidden py-32.5 sm:pt-32.5 sm:pb-27.5 px-4 sm:px-6 lg:px-12"
      >
        <img
          src="/logo.png"
          alt=""
          aria-hidden="true"
          className="absolute pointer-events-none opacity-[0.07] hidden sm:block"
          style={{ right: -90, top: -60, height: 480, width: "auto" }}
        />
        <div className="relative mx-auto max-w-295">
          <div data-animate className="text-xs tracking-[0.2em] text-cream/60 mb-6.5">
            <a href="/" className="hover:text-gold transition-colors">
              HOME
            </a>
            &nbsp;/&nbsp;<span className="text-gold">OLD BOYS&rsquo; ASSOCIATION</span>
          </div>
          <h1
            data-animate
            className="font-heading font-semibold text-5xl sm:text-6xl lg:text-[76px] leading-[1.02] mb-6 max-w-[14ch]"
          >
            Old Boys&rsquo; Association
          </h1>
          <p data-animate className="text-base sm:text-[17px] leading-[1.7] text-cream/75 max-w-[56ch]">
            The Aloysian Legacy Continues &mdash; connecting generations of old boys through fellowship, service, and shared memories.
          </p>
          {yearMembers.length > 0 && (
            <div data-animate className="flex gap-6 mt-11 text-center">
              <div>
                <div className="font-heading text-4xl sm:text-5xl font-semibold text-gold">
                  {headCommittee.length + regularMembers.length}
                </div>
                <div className="text-[11px] tracking-[0.18em] font-bold text-cream/50 mt-1.5">
                  MEMBERS
                </div>
              </div>
              {publishedEvents.length > 0 && (
                <div>
                  <div className="font-heading text-4xl sm:text-5xl font-semibold text-gold">
                    {publishedEvents.length}
                  </div>
                  <div className="text-[11px] tracking-[0.18em] font-bold text-cream/50 mt-1.5">
                    EVENTS
                  </div>
                </div>
              )}
              {totalConfirmed > 0 && (
                <div>
                  <div className="font-heading text-4xl sm:text-5xl font-semibold text-gold">
                    {confirmedDonations.length}
                  </div>
                  <div className="text-[11px] tracking-[0.18em] font-bold text-cream/50 mt-1.5">
                    DONATIONS
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <main id="main-content">
        {/* Committee */}
        {yearMembers.length > 0 && (
          <section
            ref={committeeRef}
            className="bg-cream-warm border-t border-green-dark/[0.08] py-24 sm:py-30 px-4 sm:px-6 lg:px-12"
          >
            <div className="mx-auto max-w-295">
              <div data-animate className="text-[11px] tracking-[0.4em] font-bold text-red-brand mb-4.5">
                COMMITTEE {currentYear}
              </div>
              <h2
                data-animate
                className="font-heading font-semibold text-4xl sm:text-5xl lg:text-[54px] leading-[1.05] mb-15"
              >
                Our Leadership
              </h2>

              {headCommittee.length > 0 && (
                <div data-animate className="mb-16 lg:mb-20">
                  <div className="flex items-center gap-3 mb-6">
                    <IconUsers className="size-5 text-gold" />
                    <h3 className="text-[11px] tracking-[0.2em] font-bold text-green-dark/45">
                      HEAD COMMITTEE
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {headCommittee.map((member: OBMember) => (
                      <div
                        key={member.id}
                        className="bg-cream border border-green-dark/10 p-5 flex gap-4 hover:border-gold transition-colors"
                      >
                        <div className="w-14 h-14 shrink-0 overflow-hidden bg-green-dark/[0.04]">
                          {member.photo ? (
                            <img
                              src={member.photo}
                              alt={member.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-heading text-lg text-green-dark/40">
                              {member.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-sm text-green-dark leading-tight truncate">
                            {member.name}
                          </div>
                          <div className="text-[10px] tracking-[0.12em] font-bold text-gold mt-1 uppercase">
                            {member.role}
                          </div>
                          {member.bio && (
                            <p className="text-xs text-green-dark/50 mt-2 line-clamp-2 leading-relaxed">
                              {member.bio}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {regularMembers.length > 0 && (
                <div data-animate>
                  <div className="flex items-center gap-3 mb-6">
                    <IconUsers className="size-5 text-gold" />
                    <h3 className="text-[11px] tracking-[0.2em] font-bold text-green-dark/45">
                      MEMBERS
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {regularMembers.map((member: OBMember) => (
                      <div
                        key={member.id}
                        className="bg-cream border border-green-dark/10 p-5 flex gap-4 hover:border-gold transition-colors"
                      >
                        <div className="w-12 h-12 shrink-0 overflow-hidden bg-green-dark/[0.04]">
                          {member.photo ? (
                            <img
                              src={member.photo}
                              alt={member.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-heading text-base text-green-dark/40">
                              {member.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-sm text-green-dark leading-tight truncate">
                            {member.name}
                          </div>
                          <div className="text-[10px] tracking-[0.12em] text-green-dark/50 mt-0.5 uppercase">
                            {member.role}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Join / Membership */}
        <section
          ref={membershipRef}
          className="bg-green-dark text-cream py-24 sm:py-30 px-4 sm:px-6 lg:px-12"
        >
          <div className="mx-auto max-w-295">
            <div data-animate className="text-[11px] tracking-[0.4em] font-bold text-gold mb-4.5">
              MEMBERSHIP
            </div>
            <h2
              data-animate
              className="font-heading font-semibold text-4xl sm:text-5xl lg:text-[54px] leading-[1.05] text-cream mb-6 max-w-[18ch]"
            >
              Join the Old Boys&rsquo; Association
            </h2>
            <p data-animate className="text-base sm:text-[17px] text-cream/65 max-w-[56ch] leading-relaxed mb-10">
              Are you an alumnus of St. Aloysius&rsquo; College? Request membership to stay connected with the OB community.
            </p>

            <div data-animate className="flex flex-col sm:flex-row gap-6 items-start">
              <a
                href="/OB%20Membership%20Application.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 bg-gold text-green-dark font-bold text-sm tracking-wider px-8 py-4 hover:bg-gold-light transition-colors"
              >
                <IconDownload className="size-4" />
                DOWNLOAD APPLICATION FORM
              </a>
              <p className="text-sm text-cream/50 leading-relaxed max-w-xs">
                Fill out the form and submit it to the OB office for approval.
              </p>
            </div>
          </div>
        </section>

        {/* Events */}
        {publishedEvents.length > 0 && (
          <section
            ref={eventsRef}
            className="bg-cream border-t border-green-dark/[0.08] py-24 sm:py-30 px-4 sm:px-6 lg:px-12"
          >
            <div className="mx-auto max-w-295">
              <div data-animate className="text-[11px] tracking-[0.4em] font-bold text-red-brand mb-4.5">
                EVENTS
              </div>
              <h2
                data-animate
                className="font-heading font-semibold text-4xl sm:text-5xl lg:text-[54px] leading-[1.05] mb-15"
              >
                Upcoming Events
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {publishedEvents.map((event: OBEvent) => (
                  <div
                    key={event.id}
                    data-animate
                    className="border border-green-dark/10 overflow-hidden bg-cream hover:border-gold transition-colors group"
                  >
                    <div className="overflow-hidden">
                      <MediaImage
                        src={event.coverImage}
                        alt={event.title}
                        className="w-full aspect-[16/9] object-cover transition-transform duration-500 group-hover:scale-105"
                        fallback={
                          <div className="w-full aspect-[16/9] bg-green-dark/[0.04] flex items-center justify-center">
                            <span className="text-[11px] tracking-widest text-green-dark/40 font-semibold">
                              EVENT
                            </span>
                          </div>
                        }
                      />
                    </div>
                    <div className="p-5">
                      <div className="flex gap-3 text-[10.5px] tracking-[0.14em] font-bold mb-2.5">
                        {event.eventDate && (
                          <span className="text-green-dark/45">
                            {formatDate(event.eventDate)}
                          </span>
                        )}
                        {event.location && (
                          <span className="text-green-dark/45">{event.location}</span>
                        )}
                      </div>
                      <h3 className="font-heading text-xl font-semibold text-green-dark leading-tight">
                        {event.title}
                      </h3>
                      {event.description && (
                        <p className="text-sm text-green-dark/55 mt-2.5 line-clamp-3 leading-relaxed">
                          {event.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Donations */}
        <section
          ref={donationsRef}
          className="text-cream py-24 sm:py-30 px-4 sm:px-6 lg:px-12"
          style={{ background: "linear-gradient(180deg, #013405, #062B0A)" }}
        >
          <div className="mx-auto max-w-295">
            <div data-animate className="text-[11px] tracking-[0.4em] font-bold text-gold mb-4.5">
              SUPPORT
            </div>
            <h2
              data-animate
              className="font-heading font-semibold text-4xl sm:text-5xl lg:text-[54px] leading-[1.05] mb-15 max-w-[16ch]"
            >
              Support Our Cause
            </h2>

            <div data-animate className="grid grid-cols-1 sm:grid-cols-2 gap-px border border-gold/25 mb-16" style={{ background: "rgba(255,178,3,0.25)" }}>
              <div className="bg-green-dark px-8 py-12 text-center">
                <div className="font-heading text-5xl sm:text-6xl font-semibold text-gold mb-2">
                  {totalConfirmed.toLocaleString()}
                </div>
                <div className="text-[10px] tracking-[0.18em] font-bold text-cream/50">
                  LKR RAISED
                </div>
              </div>
              <div className="bg-green-dark px-8 py-12 text-center">
                <div className="font-heading text-5xl sm:text-6xl font-semibold text-gold mb-2">
                  {confirmedDonations.length}
                </div>
                <div className="text-[10px] tracking-[0.18em] font-bold text-cream/50">
                  DONORS
                </div>
              </div>
            </div>

            {confirmedDonations.length > 0 && (
              <div data-animate>
                <div className="flex items-center gap-3 mb-8">
                  <IconHeart className="size-5 text-gold" />
                  <h3 className="text-[11px] tracking-[0.2em] font-bold text-gold">
                    RECENT SUPPORTERS
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {confirmedDonations.slice(0, 9).map((d: OBDonation) => (
                    <div
                      key={d.id}
                      className="bg-cream/[0.04] border border-gold/10 p-6 hover:border-gold/30 transition-colors"
                    >
                      <div className="flex items-center gap-4 mb-4">
                        {d.image ? (
                          <img
                            src={d.image}
                            alt=""
                            className="w-12 h-12 rounded-full object-cover shrink-0 border border-gold/20"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-cream/5 flex items-center justify-center shrink-0 border border-gold/10">
                            <span className="text-gold font-heading text-lg font-semibold">
                              {(d.isAnonymous ? "A" : d.donorName?.charAt(0) || "?").toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-bold text-base text-cream truncate">
                            {d.isAnonymous ? "Anonymous" : d.donorName}
                          </div>
                          {d.purpose && (
                            <div className="text-sm text-cream/50 truncate mt-0.5">
                              {d.purpose}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="font-heading text-2xl font-semibold text-gold">
                        LKR {(d.amount || 0).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* News */}
        {obNews.length > 0 && (
          <section
            ref={newsRef}
            className="bg-cream border-t border-green-dark/[0.08] py-24 sm:py-30 px-4 sm:px-6 lg:px-12"
          >
            <div className="mx-auto max-w-295">
              <div data-animate className="text-[11px] tracking-[0.4em] font-bold text-red-brand mb-4.5">
                NEWS
              </div>
              <h2
                data-animate
                className="font-heading font-semibold text-4xl sm:text-5xl lg:text-[54px] leading-[1.05] mb-15"
              >
                OB News
              </h2>

              {/* Featured first item */}
              {obNews[0] && (
                <Link
                  key={obNews[0].id}
                  to="/ob-news/$slug"
                  params={{ slug: obNews[0].slug }}
                  data-animate
                  className="group block overflow-hidden border border-green-dark/10 bg-cream hover:border-gold transition-colors mb-6"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-2">
                    <div className="aspect-[16/10] lg:aspect-auto overflow-hidden bg-green-dark/[0.03]">
                      {obNews[0].coverImage ? (
                        <img
                          src={obNews[0].coverImage}
                          alt={obNews[0].title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full min-h-[280px] flex items-center justify-center text-[11px] tracking-[0.18em] text-green-dark/40 font-semibold">
                          NO IMAGE
                        </div>
                      )}
                    </div>
                    <div className="p-8 lg:p-10 flex flex-col justify-center">
                      {obNews[0].publishedAt && (
                        <span className="text-[10.5px] font-bold tracking-[0.14em] text-gold mb-3 block">
                          {formatDate(obNews[0].publishedAt)}
                        </span>
                      )}
                      <h3 className="font-heading text-2xl sm:text-3xl font-semibold text-green-dark leading-tight mb-3 group-hover:text-gold transition-colors">
                        {obNews[0].title}
                      </h3>
                      {obNews[0].excerpt && (
                        <p className="text-sm text-green-dark/55 line-clamp-3 leading-relaxed">
                          {obNews[0].excerpt}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              )}

              {/* Remaining items */}
              {obNews.length > 1 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {obNews.slice(1, 4).map((item) => (
                    <Link
                      key={item.id}
                      to="/ob-news/$slug"
                      params={{ slug: item.slug }}
                      data-animate
                      className="group block overflow-hidden border border-green-dark/10 bg-cream hover:border-gold transition-colors"
                    >
                      <div className="aspect-[4/3] overflow-hidden bg-green-dark/[0.03]">
                        {item.coverImage ? (
                          <img
                            src={item.coverImage}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[11px] tracking-[0.18em] text-green-dark/40 font-semibold">
                            NO IMAGE
                          </div>
                        )}
                      </div>
                      <div className="p-5">
                        {item.publishedAt && (
                          <span className="text-[10.5px] font-bold tracking-[0.14em] text-gold mb-2 block">
                            {formatDate(item.publishedAt)}
                          </span>
                        )}
                        <h3 className="font-heading text-lg font-semibold text-green-dark line-clamp-2 leading-tight">
                          {item.title}
                        </h3>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Announcements */}
        {obAnnouncements.length > 0 && (
          <section
            ref={announcementsRef}
            className="bg-cream-warm border-t border-green-dark/[0.08] py-24 sm:py-30 px-4 sm:px-6 lg:px-12"
          >
            <div className="mx-auto max-w-295">
              <div data-animate className="text-[11px] tracking-[0.4em] font-bold text-red-brand mb-4.5">
                ANNOUNCEMENTS
              </div>
              <h2
                data-animate
                className="font-heading font-semibold text-4xl sm:text-5xl lg:text-[54px] leading-[1.05] mb-15"
              >
                OB Announcements
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {obAnnouncements.map((item, i) => (
                  <Link
                    key={item.id}
                    to="/ob-announcements/$slug"
                    params={{ slug: item.slug }}
                    data-animate
                  >
                    <div className={`border border-green-dark/10 p-8 hover:border-gold transition-colors group h-full ${
                      i % 2 === 0 ? "bg-cream" : "bg-cream-warm"
                    }`}>
                      <div className="flex items-center gap-3 mb-4">
                        {item.audience && (
                          <span className="bg-gold/10 text-gold text-[10px] font-bold tracking-[0.14em] px-3 py-1 uppercase">
                            {item.audience}
                          </span>
                        )}
                        {item.publishedAt && (
                          <span className="text-[11px] text-green-dark/40">
                            {formatDate(item.publishedAt)}
                          </span>
                        )}
                      </div>
                      <h3 className="font-heading text-xl sm:text-2xl font-semibold text-green-dark mb-3 group-hover:text-gold transition-colors leading-snug">
                        {item.title}
                      </h3>
                      {item.excerpt && (
                        <p className="text-sm text-green-dark/55 line-clamp-2 leading-relaxed">
                          {item.excerpt}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Galleries */}
        {obGalleries.length > 0 && (
          <section
            ref={galleriesRef}
            className="bg-cream border-t border-green-dark/[0.08] py-24 sm:py-30 px-4 sm:px-6 lg:px-12"
          >
            <div className="mx-auto max-w-295">
              <div data-animate className="text-[11px] tracking-[0.4em] font-bold text-red-brand mb-4.5">
                GALLERIES
              </div>
              <h2
                data-animate
                className="font-heading font-semibold text-4xl sm:text-5xl lg:text-[54px] leading-[1.05] mb-15"
              >
                OB Photo Galleries
              </h2>

              {/* Featured large gallery */}
              {obGalleries[0] && (
                <Link
                  key={obGalleries[0].id}
                  to="/gallery/$slug"
                  params={{ slug: obGalleries[0].slug }}
                  data-animate
                  className="group block overflow-hidden border border-green-dark/10 bg-cream hover:border-gold transition-colors mb-5"
                >
                  <div className="aspect-[21/9] overflow-hidden bg-green-dark/[0.03]">
                    {obGalleries[0].coverImage ? (
                      <img
                        src={obGalleries[0].coverImage}
                        alt={obGalleries[0].title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[11px] tracking-[0.18em] text-green-dark/40 font-semibold">
                        NO IMAGE
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <span className="text-[10.5px] font-bold tracking-[0.14em] text-gold mb-2 block uppercase">
                      {obGalleries[0].obEventId ? "EVENT" : "DONATION"}
                    </span>
                    <h3 className="font-heading text-2xl sm:text-3xl font-semibold text-green-dark group-hover:text-gold transition-colors">
                      {obGalleries[0].title}
                    </h3>
                  </div>
                </Link>
              )}

              {/* Remaining galleries */}
              {obGalleries.length > 1 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {obGalleries.slice(1, 4).map((g) => (
                    <Link
                      key={g.id}
                      to="/gallery/$slug"
                      params={{ slug: g.slug }}
                      data-animate
                      className="group block overflow-hidden border border-green-dark/10 bg-cream hover:border-gold transition-colors"
                    >
                      <div className="aspect-[4/3] overflow-hidden bg-green-dark/[0.03]">
                        {g.coverImage ? (
                          <img
                            src={g.coverImage}
                            alt={g.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[11px] tracking-[0.18em] text-green-dark/40 font-semibold">
                            NO IMAGE
                          </div>
                        )}
                      </div>
                      <div className="p-5">
                        <span className="text-[10.5px] font-bold tracking-[0.14em] text-gold mb-1.5 block uppercase">
                          {g.obEventId ? "EVENT" : "DONATION"}
                        </span>
                        <h3 className="font-heading text-lg font-semibold text-green-dark line-clamp-1">
                          {g.title}
                        </h3>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      <Footer settings={settings} />
    </div>
  );
}
