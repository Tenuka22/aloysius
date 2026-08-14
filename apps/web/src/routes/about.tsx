import { useRef, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components-client/navbar";
import { Footer } from "@/components-client/footer";
import { AnthemScore } from "@/components-client/anthem-score";
import { client } from "@/utils/orpc";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const DEFAULTS: Record<string, string> = {
  about_hero_title: "Our Story, Our Heritage",
  about_hero_intro:
    "The history, mission and people of St. Aloysius' College - a Catholic institution rooted in the heart of Galle.",
  about_history_title: "More Than a Century in Galle",
  history1_year: "1895",
  history1_title: "Founding of the College",
  history1_body:
    "St. Aloysius' College was established by Belgian Jesuit missionaries led by Bishop Joseph Van Reeth.",
  history1_image: "",
  history2_year: "1920s",
  history2_title: "Early Growth",
  history2_body: "Expansion of the College, early buildings and student body.",
  history2_image: "",
  history3_year: "1971",
  history3_title: "A Century of Excellence",
  history3_body:
    "Became a national school with the appointment of the first Buddhist principal, marking milestones in academics, sport and national life.",
  history3_image: "",
  history4_year: "Today",
  history4_title: "The Modern College",
  history4_body:
    "St. Aloysius' College today - facilities, programmes and a community of over 5,000 students.",
  history4_image: "",
  about_vision_statement:
    "To be a leading centre of academic and moral excellence, forming young men of competence, conscience and compassion.",
  about_mission_statement:
    "To provide a holistic Catholic education grounded in Jesuit values, nurturing faith, discipline and service to others.",
  about_principal_heading: "A Word from the Principal",
  about_principal_message:
    "Every Aloysian carries forward a tradition of faith, discipline and excellence - certa viriliter.",
  principal_name: "The Principal",
  principal_photo: "",
  about_anthem_title: "The College Anthem",
  about_anthem_desc:
    "Sung with pride by generations of Aloysians, our anthem embodies the spirit and values of St. Aloysius' College.",
  about_administration_heading: "College Leadership",
};

const anthemLyrics: Record<string, { label: string; stanzas: string[][] }> = {
  en: {
    label: "English",
    stanzas: [
      [
        "Aloysians all, our voice let's raise",
        "In songs of loyalty;",
        "Let's sing our Alma Mater's praise;",
        "Here's to our S. A. C.",
      ],
      [
        "Pure as the lilies of our crest",
        "Our thoughts and deeds e'er be;",
        "Fresh as the sea-wind be our zest",
        "To keep right manfully",
      ],
      [
        "The rule of S. A. C.",
        "We learnt at S. A. C.,",
        "At halls of S. A. C.,",
        "Beside the southern sea.",
      ],
      [
        "Aloysians all, let's young and old",
        "E'er loyal be to her,",
        "And 'neath her banner Green and Gold",
        "Certa Viriliter!",
      ],
      [
        "Aloysians all, our voice let's raise",
        "In songs of loyalty",
        "Let's sing our Alma Mater's praise:",
        "Here's to our S.A.C.",
      ],
      [
        "Aloysians all, let's rally round,",
        "Aloysians young and old,",
        "Let's cheer till loud our halls resound,",
        "Our Flag of Green and Gold.",
      ],
      [
        "Let's sing of all those selfless men",
        "Who served our S.A.C.",
        "Who feared to wield nor power nor pen",
        "From self to set us free.",
      ],
      [
        "Let's sing of Standaert, Van Reeth, Neut,",
        "Of Cooreman and Murphy",
        "To their great work let's pay tribute,",
        "Let's cheer them royally.",
      ],
      [
        "Let's sing of comrades of our youth,",
        "Of lessons that we learned",
        "To serve and work for love of truth",
        "Of youthful fire that burned",
      ],
      [
        "Within our hearts, to strive to rise",
        "Above our common clay,",
        "When shone o'er blue and cloudless skies",
        "Pure light of youth's bright day.",
      ],
      [
        "Aloysians all, let's ever seek",
        "The truth to serve, defend",
        "To right the wrong, to help the weak,",
        "Be fair by foe or friend.",
      ],
      [
        "Let us obey when Lanka calls",
        "And nobly strive for her",
        "Fight manfully what'er befalls,",
        "Certa viriliter.",
      ],
      [
        "Aloysians all, let's keep through life,",
        "Let's keep right manfully,",
        "Through gladsome days or storms and strife",
        "The rule of S.A.C.",
      ],
      [
        "To give and not to count the cost,",
        "As did our young Prince-Saint,",
        "Who rend'ring noble service, lost",
        "His life pure, free from taint.",
      ],
      [
        "Aloysians all, we'll ne'er forget",
        "Our games field and our shore",
        "The ringing cheers, the keen regret",
        "When heroes failed to score.",
      ],
      [
        "Debates in Hall, the laughs that rang",
        "O'er comedies we played;",
        "The rich melodious songs we sang,",
        "The speeches that we made.",
      ],
      [
        "When toil is hard and vigour gone",
        "And minds are not serene,",
        "Let's take fresh hope to labour on,",
        "Hope from our banner's Green.",
      ],
      [
        "When life's toil o'er, our goal is won,",
        "May then 'fore us unfold",
        "The golden harvest of work done,",
        "The glory of our Gold.",
      ],
      [
        "Pure as the lilies of our crest",
        "Our thoughts and deeds e'er be;",
        "Fresh as the sea-wind be our zest",
        "To keep right manfully",
      ],
      [
        "The rule of S.A.C.",
        "We learnt at S.A.C.,",
        "At halls of S.A.C.,",
        "Beside the southern sea.",
      ],
      [
        "Aloysians all, let's young and old",
        "E'er loyal be to her,",
        "And 'neath her banner Green and Gold",
        "Certa viriliter.",
      ],
    ],
  },
  si: {
    label: "සිංහල",
    stanzas: [],
  },
};

const jumpLinks = [
  { label: "HISTORY", href: "#history" },
  { label: "VISION & MISSION", href: "#vision" },
  { label: "MOTTO", href: "#motto" },
  { label: "PRINCIPAL", href: "#principal" },
  { label: "ANTHEM", href: "#anthem" },
  { label: "ADMINISTRATION", href: "#administration" },
];

export const Route = createFileRoute("/about")({
  loader: async () => {
    const [settings, principalData, staffData] = await Promise.all([
      client.settings.getAll(),
      client.principals.getCurrent(),
      client.principals.list({ page: 1, pageSize: 100, status: "published", sort: "sortOrder", sortDir: "asc" }),
    ]);
    return { settings, principal: principalData, staff: staffData.rows };
  },
  staleTime: 5 * 60_000,
  component: AboutPage,
});

function ArchivalImage({ src, className }: { src?: string; className?: string }) {
  if (src) {
    return <img src={src} alt="" className={`w-full h-full object-cover ${className ?? ""}`} />;
  }
  return (
    <div
      className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-green-dark/10 to-green-dark/5 ${className ?? ""}`}
    >
      <span className="text-[10px] tracking-widest text-green-dark/40 font-semibold">ARCHIVE PHOTO</span>
    </div>
  );
}

function AboutPage() {
  const { settings: settingsRaw, principal, staff } = Route.useLoaderData() as {
    settings: Record<string, string>;
    principal: any;
    staff: { id: string; name: string; title: string; portrait: string | null; year: string; sortOrder: number }[];
  };
  const settings = settingsRaw as Record<string, string>;
  const s = (key: string) => settings[key] || DEFAULTS[key] || "";

  const displayName = principal?.name || s("principal_name") || DEFAULTS.principal_name;
  const displayHeading = principal?.quote ? "A Word from the Principal" : s("about_principal_heading");
  const displayMessage = principal?.quote || s("about_principal_message");
  const photo = principal?.portrait || settings.principal_photo;

  const heroRef = useRef<HTMLElement>(null);
  const historyRef = useRef<HTMLElement>(null);
  const visionRef = useRef<HTMLElement>(null);
  const principalRef = useRef<HTMLElement>(null);
  const anthemRef = useRef<HTMLElement>(null);
  const administrationRef = useRef<HTMLElement>(null);
  const [anthemTab, setAnthemTab] = useState("en");
  const [showScore, setShowScore] = useState(false);

  useEffect(() => {
    const ctx = gsap.context(() => {
      for (const ref of [heroRef, historyRef, visionRef, principalRef, anthemRef, administrationRef]) {
        gsap.fromTo(
          ref.current?.querySelectorAll("[data-animate]") ?? [],
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

  const timeline = [1, 2, 3, 4].map((i) => ({
    year: s(`history${i}_year`),
    title: s(`history${i}_title`),
    body: s(`history${i}_body`),
    image: settings[`history${i}_image`],
  }));

  // Group staff by year, sorted descending (most recent first)
  const staffByYear = staff.reduce((acc: Record<string, typeof staff>, member) => {
    const y = member.year || "Unknown";
    if (!acc[y]) acc[y] = [];
    acc[y].push(member);
    return acc;
  }, {} as Record<string, typeof staff>);
  const sortedYears = Object.keys(staffByYear).sort((a, b) => b.localeCompare(a));

  // Role display order
  const roleOrder = [
    "PRINCIPAL", "VICE PRINCIPAL", "DEPUTY PRINCIPAL",
    "DIRECTOR OF STUDIES", "BURSAR", "SPORTS DIRECTOR",
    "SECTIONAL HEAD - PRIMARY (1-5)", "SECTIONAL HEAD - JUNIOR (6-9)",
    "SECTIONAL HEAD - SENIOR (9-11)", "SECTIONAL HEAD - COLLEGE (12-13)",
  ];

  return (
    <div className="min-h-screen bg-cream">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-100 focus:top-2 focus:left-2 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:text-primary-foreground focus:outline-none"
      >
        Skip to main content
      </a>
      <Navbar />
      <main id="main-content">
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
              &nbsp;/&nbsp;<span className="text-gold">ABOUT</span>
            </div>
            <h1
              data-animate
              className="font-heading font-semibold text-5xl sm:text-6xl lg:text-[76px] leading-[1.02] mb-6 max-w-[12ch]"
            >
              {s("about_hero_title")}
            </h1>
            <p data-animate className="text-base sm:text-[17px] leading-[1.7] text-cream/75 max-w-[56ch]">
              {s("about_hero_intro")}
            </p>
            <div
              data-animate
              className="flex gap-5 sm:gap-7 mt-11 flex-wrap text-[13px] font-bold tracking-[0.08em]"
            >
              {jumpLinks.map((link, i) => (
                <a
                  key={link.href}
                  href={link.href}
                  className={
                    i === 0
                      ? "text-gold border-b-2 border-gold pb-1.5"
                      : "text-cream/80 hover:text-gold pb-1.5 transition-colors"
                  }
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Founders */}
        <section className="bg-cream-warm border-t border-green-dark/[0.08] py-24 sm:py-30 px-4 sm:px-6 lg:px-12">
          <div className="mx-auto max-w-295">
            <div data-animate className="text-[11px] tracking-[0.4em] font-bold text-red-brand mb-4.5">
              OUR FOUNDATIONS
            </div>
            <h2
              data-animate
              className="font-['Cormorant_Garamond'] font-semibold text-4xl sm:text-5xl lg:text-[54px] mb-15"
            >
              Built on Faith & Tradition
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
              <div data-animate className="flex flex-col">
                <div className="aspect-[4/5] overflow-hidden mb-6 border border-gold/20">
                  <img
                    src="/Bishop Joseph Van Reeth.png"
                    alt="Bishop Joseph Van Reeth"
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="font-bold text-lg mb-2">Bishop Joseph Van Reeth</h3>
                <p className="text-sm leading-[1.7] text-[#013405]/75">
                  Founded in 1895 by Belgian Jesuit missionaries under Bishop Joseph Van Reeth, the first bishop of Galle, St. Aloysius' College carries forward a 130-year tradition of forming young men of competence, conscience and compassion.
                </p>
              </div>
              <div data-animate className="flex flex-col">
                <div className="aspect-[4/5] overflow-hidden mb-6 border border-gold/20">
                  <img
                    src="/St. Aloysius Gonzaga.png"
                    alt="St. Aloysius Gonzaga"
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="font-bold text-lg mb-2">St. Aloysius Gonzaga</h3>
                <p className="text-sm leading-[1.7] text-[#013405]/75">
                  Named after St. Aloysius Gonzaga, the patron saint of youth, the college embodies the Jesuit values of academic excellence, moral integrity and service to others.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* History Timeline */}
        <section id="history" ref={historyRef} className="bg-[#FFF8E7] py-24 sm:py-30 px-4 sm:px-6 lg:px-12">
          <div className="mx-auto max-w-295">
            <div data-animate className="text-[11px] tracking-[0.4em] font-bold text-[#A51919] mb-4.5">
              HISTORY
            </div>
            <h2
              data-animate
              className="font-['Cormorant_Garamond'] font-semibold text-4xl sm:text-5xl lg:text-[54px] mb-17.5"
            >
              {s("about_history_title")}
            </h2>
            <div className="flex flex-col">
              {timeline.map((t, i) => (
                <div
                  key={i}
                  data-animate
                  className="grid grid-cols-1 sm:grid-cols-[140px_2px_1fr] lg:grid-cols-[180px_2px_minmax(0,1fr)_minmax(0,320px)] gap-6 lg:gap-11 py-8 sm:py-11 border-b border-[#013405]/10 items-start"
                >
                  <div className="font-['Cormorant_Garamond'] text-4xl sm:text-[46px] font-semibold text-[#FFB203] leading-none">
                    {t.year}
                  </div>
                  <div className="hidden sm:block bg-[#FFB203] h-full min-h-20" />
                  <div>
                    <div className="font-bold text-lg sm:text-[19px] mb-2.5">{t.title}</div>
                    <div className="text-sm sm:text-[15px] leading-[1.7] text-[#013405]/75">{t.body}</div>
                  </div>
                  <div className="hidden lg:block h-42.5">
                    <ArchivalImage src={t.image} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Vision & Mission */}
        <section
          id="vision"
          ref={visionRef}
          className="text-[#FFF8E7] py-24 sm:py-30 px-4 sm:px-6 lg:px-12"
          style={{ background: "linear-gradient(180deg, #013405, #062B0A)" }}
        >
          <div
            className="mx-auto max-w-270 grid grid-cols-1 sm:grid-cols-2 gap-px border border-[#FFB203]/25"
            style={{ background: "rgba(255,178,3,0.25)" }}
          >
            <div data-animate className="bg-[#013405] px-8 sm:px-13 py-15">
              <div className="text-[11px] tracking-[0.4em] font-bold text-[#FFB203] mb-5.5">VISION</div>
              <p className="font-['Cormorant_Garamond'] text-2xl sm:text-[30px] leading-[1.4] font-medium m-0">
                {s("about_vision_statement")}
              </p>
            </div>
            <div data-animate className="bg-[#013405] px-8 sm:px-13 py-15">
              <div className="text-[11px] tracking-[0.4em] font-bold text-[#FFB203] mb-5.5">MISSION</div>
              <p className="font-['Cormorant_Garamond'] text-2xl sm:text-[30px] leading-[1.4] font-medium m-0">
                {s("about_mission_statement")}
              </p>
            </div>
          </div>
        </section>

        {/* Motto */}
        <section
          id="motto"
          className="relative overflow-hidden bg-black text-[#FFF8E7] py-35 px-4 sm:px-6 lg:px-12 text-center"
        >
          <img
            src="/logo.png"
            alt=""
            aria-hidden="true"
            className="absolute pointer-events-none opacity-[0.06] left-1/2 top-1/2 hidden sm:block"
            style={{ transform: "translate(-50%, -50%)", height: 520, width: "auto" }}
          />
          <div className="relative">
            <div className="text-[11px] tracking-[0.4em] font-bold text-[#FFB203] mb-7.5">
              THE COLLEGE MOTTO
            </div>
            <div
              className="font-['Cormorant_Garamond'] font-semibold tracking-[0.04em] leading-none"
              style={{ fontSize: "clamp(56px, 8vw, 110px)" }}
            >
              CERTA VIRILITER
            </div>
            <div className="w-14 h-0.5 bg-[#FFB203] my-9 mx-auto" />
            <p className="font-['Cormorant_Garamond'] italic text-2xl sm:text-[26px] text-[#FFF8E7]/80 m-0">
              &ldquo;Strive Manfully&rdquo;
            </p>
          </div>
        </section>

        {/* Principal's Message */}
        <section id="principal" ref={principalRef} className="bg-[#FFF8E7] py-24 sm:py-30 px-4 sm:px-6 lg:px-12">
          <div className="mx-auto max-w-270 grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-10 lg:gap-18 items-center">
            <div data-animate className="relative max-w-[340px] mx-auto lg:mx-0 w-full">
              <div className="absolute -right-3.5 -bottom-3.5 w-full h-full border border-[#FFB203] -z-10 pointer-events-none" />
              {photo ? (
                <img
                  src={photo}
                  alt={displayName}
                  className="w-full h-105 object-cover"
                />
              ) : (
                <div className="w-full h-105 flex items-center justify-center bg-gradient-to-br from-[#013405]/10 to-[#013405]/5">
                  <span className="text-[11px] tracking-widest text-[#013405]/40 font-semibold">
                    PRINCIPAL PORTRAIT
                  </span>
                </div>
              )}
            </div>
            <div data-animate>
              <div className="text-[11px] tracking-[0.4em] font-bold text-[#A51919] mb-4.5">
                PRINCIPAL&rsquo;S MESSAGE
              </div>
              <h2 className="font-['Cormorant_Garamond'] font-semibold text-3xl sm:text-[44px] mb-6">
                {displayHeading}
              </h2>
              <p className="text-base leading-[1.75] text-[#013405]/80 mb-6.5">
                {displayMessage}
              </p>
              <div className="font-['Cormorant_Garamond'] italic text-2xl sm:text-[28px] text-[#013405]/50">
                &mdash; {displayName}
              </div>
              <a
                href="/principals"
                className="inline-flex items-center gap-2.5 font-bold text-sm text-[#013405] border-b-2 border-[#FFB203] pb-1.5 mt-6"
              >
                View All Principals <span>&rarr;</span>
              </a>
            </div>
          </div>
        </section>

        {/* College Anthem */}
        <section
          id="anthem"
          ref={anthemRef}
          className="bg-[#fffdf6] border-t border-[#013405]/[0.08] py-24 sm:py-30 px-4 sm:px-6 lg:px-12"
        >
          <div className="mx-auto max-w-190 text-center">
            <div data-animate className="text-[11px] tracking-[0.4em] font-bold text-[#A51919] mb-4.5">
              COLLEGE ANTHEM
            </div>
            <h2
              data-animate
              className="font-['Cormorant_Garamond'] font-semibold text-3xl sm:text-[50px] mb-10"
            >
              {s("about_anthem_title")}
            </h2>
            <p data-animate className="text-[#013405]/70 max-w-xl mx-auto mb-9">
              {s("about_anthem_desc")}
            </p>

            <div data-animate>
              <div className="flex justify-center gap-1 mb-8">
                {Object.entries(anthemLyrics).map(([key, lang]) => (
                  <button
                    key={key}
                    onClick={() => setAnthemTab(key)}
                    className={`px-5 py-2 text-sm font-semibold transition-colors ${
                      anthemTab === key
                        ? "bg-[#013405] text-[#FFF8E7]"
                        : "bg-[#013405]/5 text-[#013405]/60 hover:text-[#013405]"
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>

              <div className="mb-6">
                <div className="aspect-21/9 bg-[#013405]/5 overflow-hidden">
                  <img
                    src="/collage-en-anthem-creators.png"
                    alt="College Anthem Creators"
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-xs text-[#013405]/50 text-center mt-2 italic">
                  English: Words by D. Anghie &middot; Music by Strom Sidicinus, S.J. &middot; Sinhala:
                  Lyrics by Rev. Fr. Moses Perera &middot; Music by Sunil Santha
                </p>
              </div>

              <div className="border border-[#013405]/15 border-t-2 border-t-[#FFB203] bg-[#FFF8E7] p-7 sm:p-11">
                {anthemLyrics[anthemTab]?.stanzas.length === 0 ? (
                  <p className="text-center text-[#013405]/50 italic py-8">Coming soon.</p>
                ) : (
                  <div className="space-y-6">
                    {anthemLyrics[anthemTab]?.stanzas.map((stanza, si) => (
                      <div
                        key={si}
                        className={si === 1 || si === 2 || si === 18 || si === 19 ? "text-center" : ""}
                      >
                        {stanza.map((line, li) => (
                          <p
                            key={li}
                            className="font-['Cormorant_Garamond'] text-lg leading-relaxed text-[#013405]/85"
                          >
                            {line}
                          </p>
                        ))}
                        {si < (anthemLyrics[anthemTab]?.stanzas.length ?? 0) - 1 && (
                          <div className="border-b border-[#013405]/10 my-4" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {anthemTab === "en" && (
                <div className="mt-6">
                  <button
                    onClick={() => setShowScore(!showScore)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-[#013405]/70 hover:text-[#013405] border border-[#013405]/15 transition-colors"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-4">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z"
                      />
                    </svg>
                    {showScore ? "Hide Sheet Music" : "View Sheet Music"}
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className={`size-3 transition-transform ${showScore ? "rotate-180" : ""}`}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>

                  {showScore && (
                    <div className="mt-4 bg-[#FFF8E7] border border-[#013405]/15 p-4 sm:p-6 overflow-hidden">
                      <div className="text-center mb-4">
                        <h3 className="font-bold text-sm tracking-wide">COLLEGE ANTHEM</h3>
                        <p className="text-xs text-[#013405]/60 mt-1 italic">
                          Words by D. Anghie &middot; Music by Strom Sidicinus, S.J.
                        </p>
                      </div>
                      <AnthemScore />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Administration */}
        <section
          id="administration"
          ref={administrationRef}
          className="bg-[#013405] text-[#FFF8E7] py-24 sm:py-30 px-4 sm:px-6 lg:px-12"
        >
          <div className="mx-auto max-w-295">
            <div data-animate className="text-[11px] tracking-[0.4em] font-bold text-[#FFB203] mb-4.5">
              ADMINISTRATION
            </div>
            <h2
              data-animate
              className="font-['Cormorant_Garamond'] font-semibold text-4xl sm:text-5xl lg:text-[54px] mb-15"
            >
              {s("about_administration_heading")}
            </h2>
            {sortedYears.length === 0 ? (
              <p data-animate className="text-[#FFF8E7]/50 text-sm">No staff members added yet.</p>
            ) : (
              <div className="space-y-16">
                {sortedYears.map((year) => {
                  const yearMembers = staffByYear[year].sort((a, b) => {
                    const ai = roleOrder.indexOf(a.title);
                    const bi = roleOrder.indexOf(b.title);
                    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi) || a.sortOrder - b.sortOrder;
                  });
                  return (
                    <div key={year} data-animate>
                      <div className="text-[11px] tracking-[0.3em] font-bold text-[#FFB203] mb-6 border-b border-[#FFB203]/20 pb-3">
                        {year}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-7">
                        {yearMembers.map((member) => (
                          <div key={member.id} data-animate>
                            {member.portrait ? (
                              <img src={member.portrait} alt={member.name} className="w-full h-70 object-cover" />
                            ) : (
                              <div className="w-full h-70 flex items-center justify-center bg-[#FFF8E7]/5">
                                <span className="text-[10px] tracking-widest text-[#FFF8E7]/40 font-semibold">
                                  PORTRAIT
                                </span>
                              </div>
                            )}
                            <div className="font-bold text-base mt-4.5 mb-1">{member.name}</div>
                            <div className="text-xs tracking-[0.12em] text-[#FFB203]">{member.title}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer settings={settings} />
    </div>
  );
}
