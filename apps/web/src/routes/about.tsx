import { useRef, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components-client/navbar";
import { Footer } from "@/components-client/footer";
import { AnthemScore } from "@/components-client/anthem-score";
import { client } from "@/utils/orpc";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type ActivityRow = {
  id: string;
  name: string;
  description: string | null;
  coverImage: string | null;
  logoUrl: string | null;
  type: string;
};
type BigMatchRow = {
  id: string;
  name: string;
  opponent: string;
  coverImage: string | null;
  type: string;
  year: number | null;
  eventId: string | null;
  galleryId: string | null;
};

const DEFAULTS: Record<string, string> = {
  about_hero_badge: "Est. 1895",
  about_hero_title: "St. Aloysius' College",
  about_hero_location: "Galle, Sri Lanka",
  about_hero_motto: '"Certa Viriliter" - Strive Manfully',
  about_mission_title: "Our Mission",
  about_mission_jesuit_title: "Jesuit Tradition",
  about_mission_jesuit_desc:
    "Founded in 1895 by Belgian Jesuit missionaries led by Bishop Joseph Van Reeth, we carry forward a 130-year tradition of forming young men of competence, conscience, and compassion.",
  about_mission_saint_title: "Named After a Saint",
  about_mission_saint_desc:
    "Named after St. Aloysius Gonzaga, the patron saint of youth, we embody the Jesuit values of academic excellence, moral integrity, and service to others.",
  about_history_title: "Our History",
  about_history_desc:
    "St. Aloysius' College was established in 1895 by Belgian Jesuit missionaries led by Bishop Joseph Van Reeth, the first bishop of Galle. The college was named after Saint Aloysius Gonzaga, the patron saint of youth. Situated on Mount Calvary, the college neighbours St. Mary's Cathedral on one side and Sacred Heart Convent on the other. For over a century, it has been a beacon of educational excellence in the Southern Province.",
  about_history_founding:
    "Established in 1895 by Belgian Jesuit missionaries under Bishop Joseph Van Reeth.",
  about_history_location:
    "Located on Mount Calvary, Galle, neighbouring St. Mary's Cathedral.",
  about_history_nationalisation:
    "Became a national school in 1971 with the appointment of the first Buddhist principal.",
  about_history_students:
    "Over 5,000 students from grade 1 to G.C.E. A/L, representing diverse religious groups.",
  about_crest_title: "The College Crest",
  about_values_title: "Our Values",
  about_value1_title: "Competence",
  about_value1_desc: "Academic excellence and practical skills for life",
  about_value2_title: "Conscience",
  about_value2_desc: "Moral integrity and ethical decision-making",
  about_value3_title: "Compassion",
  about_value3_desc: "Service to others and care for the community",
  about_houses_title: "College Houses",
  about_houses_desc:
    "Students represent five houses named after Jesuit Fathers who were pioneers in developing the school in its early days.",
  about_clubs_title: "Clubs & Societies",
  about_clubs_desc:
    "Over 25 clubs and societies fostering leadership, creativity, and intellectual growth.",
  about_sports_title: "Sporting Excellence",
  about_sports_desc: "Excellence across 62+ sports disciplines, from cricket to rugby.",
  about_bigmatches_title: "Big Match Encounters",
  about_bigmatches_desc:
    "Annual cricket encounters that define our sporting tradition.",
  about_anthem_title: "College Anthem",
  about_anthem_desc:
    "Sung with pride by generations of Aloysians, our anthem embodies the spirit and values of St. Aloysius' College.",
  about_location_title: "Find Us",
  about_location_address:
    "St. Aloysius' College\nTemplars' Road\nGalle 80000\nSouthern Province, Sri Lanka",
  about_location_phone: "011 2 333 233",
  about_location_email: "info@aloysiuscollege.lk",
  about_location_website: "aloysiuscollege.lk",
  about_alumni_title: "Old Aloysians",
  about_alumni_desc: "Our alumni network spans the globe, with branches in UK, Galle, and Colombo.",
  about_alumni_countries: "UK,Galle,Colombo",
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

export const Route = createFileRoute("/about")({
  loader: async () => {
    const [settings, activitiesData, bigMatchesData] = await Promise.all([
      client.settings.getAll(),
      client.activities.list({ status: "published" }),
      client.bigMatches.list({ status: "published" }),
    ]);

    return {
      settings,
      activities: activitiesData,
      bigMatches: bigMatchesData,
    };
  },
  staleTime: 5 * 60_000,
  component: AboutPage,
});

function AboutPage() {
  const { settings: settingsRaw, activities, bigMatches: bigMatchesRaw } = Route.useLoaderData();
  const heroRef = useRef<HTMLElement>(null);
  const missionRef = useRef<HTMLDivElement>(null);
  const anthemRef = useRef<HTMLDivElement>(null);
  const clubsRef = useRef<HTMLDivElement>(null);
  const sportsRef = useRef<HTMLDivElement>(null);
  const valuesRef = useRef<HTMLDivElement>(null);
  const [anthemTab, setAnthemTab] = useState("en");
  const [showScore, setShowScore] = useState(false);

  const settings = settingsRaw as Record<string, string>;
  const allActivities = (activities as ActivityRow[]) ?? [];
  const bigMatches = (bigMatchesRaw as BigMatchRow[]) ?? [];

  const clubs = allActivities.filter((a) => a.type === "club");
  const sports = allActivities.filter((a) => a.type === "sport");

  const getSetting = (key: string) => settings[key] || DEFAULTS[key] || "";

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        heroRef.current?.querySelectorAll("[data-animate]") ?? [],
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "power3.out" },
      );

      gsap.fromTo(
        missionRef.current?.querySelectorAll("[data-animate]") ?? [],
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: { trigger: missionRef.current, start: "top 85%", once: true },
        },
      );

      gsap.fromTo(
        anthemRef.current?.querySelectorAll("[data-animate]") ?? [],
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.05,
          ease: "power3.out",
          scrollTrigger: { trigger: anthemRef.current, start: "top 85%", once: true },
        },
      );

      gsap.fromTo(
        clubsRef.current?.querySelectorAll("[data-animate]") ?? [],
        { opacity: 0, y: 40, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.5,
          stagger: 0.05,
          ease: "power3.out",
          scrollTrigger: { trigger: clubsRef.current, start: "top 85%", once: true },
        },
      );

      gsap.fromTo(
        sportsRef.current?.querySelectorAll("[data-animate]") ?? [],
        { opacity: 0, y: 40, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.5,
          stagger: 0.05,
          ease: "power3.out",
          scrollTrigger: { trigger: sportsRef.current, start: "top 85%", once: true },
        },
      );

      gsap.fromTo(
        valuesRef.current?.querySelectorAll("[data-animate]") ?? [],
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: { trigger: valuesRef.current, start: "top 85%", once: true },
        },
      );
    });

    return () => ctx.revert();
  }, []);

  const values = [
    { title: getSetting("about_value1_title"), description: getSetting("about_value1_desc") },
    { title: getSetting("about_value2_title"), description: getSetting("about_value2_desc") },
    { title: getSetting("about_value3_title"), description: getSetting("about_value3_desc") },
  ];

  const alumniCountries = getSetting("about_alumni_countries").split(",").filter(Boolean);
  const locationAddress = getSetting("about_location_address").split("\n");

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
        {/* Hero */}
        <section ref={heroRef} className="py-16 sm:py-20">
          <div className="mx-auto max-w-5xl text-center px-4 sm:px-6 lg:px-8">
            <div data-animate className="mb-8">
              <img
                src="/logo.png"
                alt="St. Aloysius' College Logo"
                className="mx-auto h-32 sm:h-40 w-auto"
              />
            </div>
            <div
              data-animate
              className="inline-flex items-center gap-2 text-[#c9a227]/80 text-xs sm:text-sm font-medium tracking-widest uppercase mb-6"
            >
              <span className="w-8 h-px bg-[#c9a227]/40" />
              {getSetting("about_hero_badge")}
              <span className="w-8 h-px bg-[#c9a227]/40" />
            </div>
            <h1
              data-animate
              className="text-4xl sm:text-5xl md:text-6xl font-light tracking-tight mb-4"
            >
              {getSetting("about_hero_title")}
            </h1>
            <p data-animate className="text-xl text-muted-foreground mb-2">
              {getSetting("about_hero_location")}
            </p>
            <p data-animate className="text-lg text-muted-foreground italic">
              {getSetting("about_hero_motto")}
            </p>
          </div>
        </section>

        {/* Mission */}
        <section ref={missionRef} className="py-16 sm:py-20 bg-muted/30 border-y border-border">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="text-xs font-semibold uppercase tracking-widest text-[#c9a227] mb-2 block">
                Purpose
              </span>
              <h2 data-animate className="text-2xl sm:text-3xl font-light">
                {getSetting("about_mission_title")}
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              <div data-animate className="p-6 rounded-xl border bg-card">
                <div className="aspect-square bg-muted/40 rounded-lg mb-4 overflow-hidden">
                  <img
                    src="/Bishop Joseph Van Reeth.png"
                    alt="Bishop Joseph Van Reeth"
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="font-semibold text-lg mb-3">
                  {getSetting("about_mission_jesuit_title")}
                </h3>
                <p className="text-muted-foreground">{getSetting("about_mission_jesuit_desc")}</p>
              </div>
              <div data-animate className="p-6 rounded-xl border bg-card">
                <div className="aspect-square bg-muted/40 rounded-lg mb-4 overflow-hidden">
                  <img
                    src="/St. Aloysius Gonzaga.png"
                    alt="St. Aloysius Gonzaga"
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="font-semibold text-lg mb-3">
                  {getSetting("about_mission_saint_title")}
                </h3>
                <p className="text-muted-foreground">{getSetting("about_mission_saint_desc")}</p>
              </div>
            </div>
          </div>
        </section>

        {/* History */}
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="text-xs font-semibold uppercase tracking-widest text-[#c9a227] mb-2 block">
                Heritage
              </span>
              <h2 data-animate className="text-2xl sm:text-3xl font-light">
                {getSetting("about_history_title")}
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              <div data-animate className="space-y-6">
                <p className="text-muted-foreground leading-relaxed">
                  {getSetting("about_history_desc")}
                </p>
              </div>
              <div data-animate className="space-y-4">
                <div className="p-5 rounded-xl border bg-card">
                  <h3 className="font-semibold text-lg mb-2">Founding</h3>
                  <p className="text-sm text-muted-foreground">
                    {getSetting("about_history_founding")}
                  </p>
                </div>
                <div className="p-5 rounded-xl border bg-card">
                  <h3 className="font-semibold text-lg mb-2">Location</h3>
                  <p className="text-sm text-muted-foreground">
                    {getSetting("about_history_location")}
                  </p>
                </div>
                <div className="p-5 rounded-xl border bg-card">
                  <h3 className="font-semibold text-lg mb-2">Nationalisation</h3>
                  <p className="text-sm text-muted-foreground">
                    {getSetting("about_history_nationalisation")}
                  </p>
                </div>
                <div className="p-5 rounded-xl border bg-card">
                  <h3 className="font-semibold text-lg mb-2">Students</h3>
                  <p className="text-sm text-muted-foreground">
                    {getSetting("about_history_students")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* College Anthem */}
        <section ref={anthemRef} className="py-16 sm:py-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <span className="text-xs font-semibold uppercase tracking-widest text-[#c9a227] mb-2 block">
                Heritage
              </span>
              <h2 data-animate className="text-2xl sm:text-3xl font-light mb-4">
                {getSetting("about_anthem_title")}
              </h2>
              <p data-animate className="text-muted-foreground max-w-xl mx-auto">
                {getSetting("about_anthem_desc")}
              </p>
            </div>

            <div data-animate>
              <div className="flex justify-center gap-1 mb-8">
                {Object.entries(anthemLyrics).map(([key, lang]) => (
                  <button
                    key={key}
                    onClick={() => setAnthemTab(key)}
                    className={`px-5 py-2 text-sm font-medium transition-colors ${
                      anthemTab === key
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>

              <div data-animate className="mb-6">
                <div className="aspect-[21/9] bg-muted/40 rounded-xl overflow-hidden">
                  <img
                    src="/collage-en-anthem-creators.png"
                    alt="College Anthem Creators"
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center mt-2 italic">
                  English: Words by D. Anghie &middot; Music by Strom Sidicinus, S.J. &middot;
                  Sinhala: Lyrics by Rev. Fr. Moses Perera &middot; Music by Sunil Santha
                </p>
              </div>

              <div className="bg-card border border-border rounded-xl p-6 sm:p-8">
                {anthemLyrics[anthemTab]?.stanzas.length === 0 ? (
                  <p className="text-center text-muted-foreground italic py-8">Coming soon.</p>
                ) : (
                  <div className="space-y-6">
                    {anthemLyrics[anthemTab]?.stanzas.map((stanza, si) => (
                      <div
                        key={si}
                        data-animate
                        className={
                          si === 1 || si === 2 || si === 18 || si === 19 ? "text-center" : ""
                        }
                      >
                        {stanza.map((line, li) => (
                          <p key={li} className="text-sm leading-relaxed text-foreground/80">
                            {line}
                          </p>
                        ))}
                        {si < (anthemLyrics[anthemTab]?.stanzas.length ?? 0) - 1 && (
                          <div className="border-b border-border/50 my-4" />
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
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground border border-border rounded-lg transition-colors"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="size-4"
                    >
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
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                      />
                    </svg>
                  </button>

                  {showScore && (
                    <div className="mt-4 bg-card border border-border rounded-xl p-4 sm:p-6 overflow-hidden">
                      <div className="text-center mb-4">
                        <h3 className="font-semibold text-sm tracking-wide">COLLEGE ANTHEM</h3>
                        <p className="text-xs text-muted-foreground mt-1 italic">
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

        {/* Values */}
        <section ref={valuesRef} className="py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="text-xs font-semibold uppercase tracking-widest text-[#c9a227] mb-2 block">
                Principles
              </span>
              <h2 className="text-2xl sm:text-3xl font-light">
                {getSetting("about_values_title")}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {values.map((value) => (
                <div
                  key={value.title}
                  data-animate
                  className="p-6 rounded-xl border bg-card text-center"
                >
                  <div className="size-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="size-6 text-muted-foreground"
                    >
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{value.title}</h3>
                  <p className="text-sm text-muted-foreground">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Crest */}
        <section className="py-16 sm:py-20 bg-muted/30 border-y border-border">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="text-xs font-semibold uppercase tracking-widest text-[#c9a227] mb-2 block">
                Symbols
              </span>
              <h2 data-animate className="text-2xl sm:text-3xl font-light">
                {getSetting("about_crest_title")}
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-10 items-center">
              <div data-animate className="flex justify-center">
                <img
                  src="/logo.png"
                  alt="St. Aloysius' College Crest"
                  className="w-full max-w-sm"
                />
              </div>
              <div data-animate className="space-y-4">
                <div className="p-4 rounded-xl border bg-card">
                  <h3 className="font-semibold text-sm mb-1 text-[#c9a227]">IHS</h3>
                  <p className="text-sm text-muted-foreground">
                    Iesus Hominum Salvator — Jesus, Saviour of Mankind
                  </p>
                </div>
                <div className="p-4 rounded-xl border bg-card">
                  <h3 className="font-semibold text-sm mb-1 text-[#c9a227]">The Tusker</h3>
                  <p className="text-sm text-muted-foreground">Symbol of Courage</p>
                </div>
                <div className="p-4 rounded-xl border bg-card">
                  <h3 className="font-semibold text-sm mb-1 text-[#c9a227]">Lilies</h3>
                  <p className="text-sm text-muted-foreground">Purity of Conscience</p>
                </div>
                <div className="p-4 rounded-xl border bg-card">
                  <h3 className="font-semibold text-sm mb-1 text-[#c9a227]">Torch</h3>
                  <p className="text-sm text-muted-foreground">Torch of Learning</p>
                </div>
                <div className="p-4 rounded-xl border bg-card">
                  <h3 className="font-semibold text-sm mb-1 text-[#c9a227]">Rooster</h3>
                  <p className="text-sm text-muted-foreground">Symbol of Galle</p>
                </div>
                <div className="p-4 rounded-xl border bg-card">
                  <h3 className="font-semibold text-sm mb-1 text-[#c9a227]">Motto</h3>
                  <p className="text-sm text-muted-foreground italic">
                    Certa Viriliter — Strive Manfully
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Houses */}
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="text-xs font-semibold uppercase tracking-widest text-[#c9a227] mb-2 block">
                Community
              </span>
              <h2 data-animate className="text-2xl sm:text-3xl font-light">
                {getSetting("about_houses_title")}
              </h2>
              <p data-animate className="text-muted-foreground mt-2 max-w-2xl mx-auto">
                {getSetting("about_houses_desc")}
              </p>
            </div>
            <div className="flex justify-center items-center gap-6 sm:gap-8 flex-wrap">
              {[
                { name: "Cooreman", color: "#FFD700" },
                { name: "Murphy", color: "#E31E24" },
                { name: "Neut", color: "#009A44" },
                { name: "Standaert", color: "#C52691" },
                { name: "Van Reeth", color: "#0072CE" },
              ].map((house) => (
                <div key={house.name} data-animate className="flex flex-col items-center gap-2">
                  <div
                    className="size-16 sm:size-20 rounded-full"
                    style={{ backgroundColor: house.color }}
                  />
                  <span className="text-xs font-medium text-muted-foreground">{house.name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Clubs & Societies */}
        <section ref={clubsRef} className="py-16 sm:py-20 bg-muted/30">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-10">
              <div>
                <span className="text-xs font-semibold uppercase tracking-widest text-[#c9a227] mb-2 block">
                  Activities
                </span>
                <h2 className="text-2xl sm:text-3xl font-light">
                  {getSetting("about_clubs_title")}
                </h2>
              </div>
              <p className="text-sm text-muted-foreground max-w-md hidden sm:block">
                {getSetting("about_clubs_desc")}
              </p>
            </div>
            {clubs.length > 0 && (
              <div data-animate className="mb-6">
                <div className="group relative border border-border bg-card overflow-hidden hover:shadow-lg transition-shadow">
                  <span className="absolute inset-y-0 left-0 w-0 bg-primary/90 group-hover:w-full transition-all duration-700 ease-out -z-0" />
                  <div className="relative z-10 grid md:grid-cols-2 gap-0">
                    <div className="aspect-video md:min-h-[240px] bg-muted overflow-hidden">
                      {clubs[0]?.coverImage || clubs[0]?.logoUrl ? (
                        <img
                          src={clubs[0].coverImage || clubs[0].logoUrl || ""}
                          alt={clubs[0].name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            className="size-16 text-primary/30"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="relative z-10 p-6 md:p-8 flex flex-col justify-center">
                      <h3 className="text-xl sm:text-2xl font-light mb-3 text-primary group-hover:text-secondary transition-colors">
                        {clubs[0].name}
                      </h3>
                      {clubs[0].description && (
                        <p className="text-primary/60 text-sm leading-relaxed line-clamp-3 mb-4 group-hover:text-secondary/70 transition-colors">
                          {clubs[0].description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {clubs.length > 1 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {clubs.slice(1, 5).map((club) => (
                  <div
                    key={club.id}
                    data-animate
                    className="group relative border bg-background overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <span className="absolute inset-y-0 left-0 w-0 bg-primary/90 group-hover:w-full transition-all duration-700 ease-out -z-0" />
                    <div className="relative z-10 aspect-video bg-muted overflow-hidden">
                      {club.coverImage || club.logoUrl ? (
                        <img
                          src={club.coverImage || club.logoUrl || ""}
                          alt={club.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1"
                            className="size-8 text-muted-foreground/30"
                          >
                            <circle cx="12" cy="12" r="10" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="relative z-10 p-3">
                      <div className="text-sm font-semibold text-primary group-hover:text-secondary transition-colors line-clamp-2">
                        {club.name}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Sports */}
        <section ref={sportsRef} className="py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-10">
              <div>
                <span className="text-xs font-semibold uppercase tracking-widest text-[#c9a227] mb-2 block">
                  Athletics
                </span>
                <h2 className="text-2xl sm:text-3xl font-light">
                  {getSetting("about_sports_title")}
                </h2>
              </div>
              <p className="text-sm text-muted-foreground max-w-md hidden sm:block">
                {getSetting("about_sports_desc")}
              </p>
            </div>
            {sports.length > 0 && (
              <div data-animate className="mb-6">
                <div className="group relative border border-border bg-card overflow-hidden hover:shadow-lg transition-shadow">
                  <span className="absolute inset-y-0 left-0 w-0 bg-primary/90 group-hover:w-full transition-all duration-700 ease-out -z-0" />
                  <div className="relative z-10 grid md:grid-cols-2 gap-0">
                    <div className="aspect-video md:min-h-[240px] bg-muted overflow-hidden">
                      {sports[0]?.coverImage || sports[0]?.logoUrl ? (
                        <img
                          src={sports[0].coverImage || sports[0].logoUrl || ""}
                          alt={sports[0].name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            className="size-16 text-primary/30"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.996.172-1.756.96-1.756 1.94v3.03c0 .621.504 1.125 1.125 1.125h3.03c.98 0 1.768-.788 1.94-1.756M5.25 4.236A2.25 2.25 0 017.5 2.25h9a2.25 2.25 0 012.25 2.25c.343 1.32.467 2.688.35 4.047"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="relative z-10 p-6 md:p-8 flex flex-col justify-center">
                      <h3 className="text-xl sm:text-2xl font-light mb-3 text-primary group-hover:text-secondary transition-colors">
                        {sports[0].name}
                      </h3>
                      {sports[0].description && (
                        <p className="text-primary/60 text-sm leading-relaxed line-clamp-3 mb-4 group-hover:text-secondary/70 transition-colors">
                          {sports[0].description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {sports.length > 1 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {sports.slice(1, 5).map((sport) => (
                  <div
                    key={sport.id}
                    data-animate
                    className="group relative border bg-background overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <span className="absolute inset-y-0 left-0 w-0 bg-primary/90 group-hover:w-full transition-all duration-700 ease-out -z-0" />
                    <div className="relative z-10 aspect-video bg-muted overflow-hidden">
                      {sport.coverImage || sport.logoUrl ? (
                        <img
                          src={sport.coverImage || sport.logoUrl || ""}
                          alt={sport.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1"
                            className="size-8 text-muted-foreground/30"
                          >
                            <circle cx="12" cy="12" r="10" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="relative z-10 p-3">
                      <div className="text-sm font-semibold text-primary group-hover:text-secondary transition-colors line-clamp-2">
                        {sport.name}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Big Matches */}
        <section className="py-16 sm:py-20 bg-muted/30 border-y border-border">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-10">
              <div>
                <span className="text-xs font-semibold uppercase tracking-widest text-[#c9a227] mb-2 block">
                  Rivalries
                </span>
                <h2 className="text-2xl sm:text-3xl font-light">
                  {getSetting("about_bigmatches_title")}
                </h2>
              </div>
              <p className="text-sm text-muted-foreground max-w-md hidden sm:block">
                {getSetting("about_bigmatches_desc")}
              </p>
            </div>
            {bigMatches.length > 0 && (
              <div data-animate className="mb-6">
                <div className="group relative border border-border bg-card overflow-hidden hover:shadow-lg transition-shadow">
                  <span className="absolute inset-y-0 left-0 w-0 bg-primary/90 group-hover:w-full transition-all duration-700 ease-out -z-0" />
                  <div className="relative z-10 grid md:grid-cols-2 gap-0">
                    <div className="aspect-video md:min-h-[240px] bg-muted overflow-hidden">
                      {bigMatches[0]?.coverImage ? (
                        <img
                          src={bigMatches[0].coverImage}
                          alt={bigMatches[0].name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            className="size-16 text-primary/30"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.996.172-1.756.96-1.756 1.94v3.03c0 .621.504 1.125 1.125 1.125h3.03c.98 0 1.768-.788 1.94-1.756M5.25 4.236A2.25 2.25 0 017.5 2.25h9a2.25 2.25 0 012.25 2.25c.343 1.32.467 2.688.35 4.047"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="relative z-10 p-6 md:p-8 flex flex-col justify-center">
                      <span className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                        {bigMatches[0].type}
                      </span>
                      <h3 className="text-xl sm:text-2xl font-light mb-3 text-primary group-hover:text-secondary transition-colors">
                        {bigMatches[0].name}
                      </h3>
                      <p className="text-primary/60 text-sm leading-relaxed mb-2 group-hover:text-secondary/70 transition-colors">
                        vs {bigMatches[0].opponent}
                      </p>
                      {bigMatches[0].year && (
                        <p className="text-xs text-primary/50 group-hover:text-secondary/60 transition-colors">
                          {bigMatches[0].year}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {bigMatches.length > 1 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {bigMatches.slice(1, 4).map((match) => (
                  <div
                    key={match.id}
                    data-animate
                    className="group relative border bg-background overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <span className="absolute inset-y-0 left-0 w-0 bg-primary/90 group-hover:w-full transition-all duration-700 ease-out -z-0" />
                    <div className="relative z-10 aspect-video bg-muted overflow-hidden">
                      {match.coverImage ? (
                        <img
                          src={match.coverImage}
                          alt={match.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1"
                            className="size-8 text-muted-foreground/30"
                          >
                            <circle cx="12" cy="12" r="10" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="relative z-10 p-3">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-primary group-hover:text-secondary transition-colors">
                        {match.type}
                      </span>
                      <div className="text-sm font-semibold text-primary group-hover:text-secondary transition-colors line-clamp-2 mt-1">
                        {match.name}
                      </div>
                      <div className="text-xs text-primary/50 group-hover:text-secondary/60 transition-colors">
                        vs {match.opponent}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Location & Contact */}
        <section className="py-16 sm:py-20 bg-muted/30 border-y border-border">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="text-xs font-semibold uppercase tracking-widest text-[#c9a227] mb-2 block">
                Visit Us
              </span>
              <h2 data-animate className="text-2xl sm:text-3xl font-light">
                {getSetting("about_location_title")}
              </h2>
            </div>
            <div className="grid lg:grid-cols-2 gap-8">
              <div data-animate className="rounded-xl border bg-card overflow-hidden">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.523!2d80.21222!3d6.03583!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNsKwMDItMjknDA4!5e0!3m2!1sen!2slk!4v1710000000000"
                  width="100%"
                  height="100%"
                  style={{ border: 0, minHeight: '300px' }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="St. Aloysius' College Location"
                />
              </div>
              <div data-animate className="space-y-4">
                <div className="p-5 rounded-xl border bg-card">
                  <div className="flex items-start gap-4">
                    <div className="size-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-5 text-muted-foreground">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Address</h3>
                      <p className="text-sm text-muted-foreground">
                        St. Aloysius' College<br />
                        Templars' Road<br />
                        Galle 80000<br />
                        Southern Province, Sri Lanka
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-5 rounded-xl border bg-card">
                  <div className="flex items-start gap-4">
                    <div className="size-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-5 text-muted-foreground">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Phone</h3>
                      <a
                        href={`tel:${getSetting("about_location_phone").replace(/\s/g, "")}`}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {getSetting("about_location_phone")}
                      </a>
                    </div>
                  </div>
                </div>
                <div className="p-5 rounded-xl border bg-card">
                  <div className="flex items-start gap-4">
                    <div className="size-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-5 text-muted-foreground">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Email & Web</h3>
                      <a
                        href={`mailto:${getSetting("about_location_email")}`}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors block"
                      >
                        {getSetting("about_location_email")}
                      </a>
                      <a
                        href={`https://${getSetting("about_location_website")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors block mt-1"
                      >
                        {getSetting("about_location_website")}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-12 text-center">
              <span className="text-xs font-semibold uppercase tracking-widest text-[#c9a227] mb-2 block">
                Global Network
              </span>
              <p className="text-muted-foreground mb-4">{getSetting("about_alumni_desc")}</p>
              <div className="flex justify-center gap-3 flex-wrap">
                {alumniCountries.map((country) => (
                  <span
                    key={country}
                    className="inline-flex items-center rounded-full bg-card border border-border px-4 py-2 text-sm font-medium"
                  >
                    {country}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
