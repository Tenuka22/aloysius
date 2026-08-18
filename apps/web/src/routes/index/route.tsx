import { createFileRoute } from "@tanstack/react-router";
import { NoticeStrip } from "@/components-client/notice-strip";
import { Navbar } from "@/components-client/navbar";
import { Hero } from "@/components-client/hero";
import { Heritage } from "@/components-client/heritage";
import { PrincipalMessage } from "@/components-client/principal-message";
import { QuickLinks } from "@/components-client/quick-links";
import { StudentLife } from "@/components-client/student-life";
import { EventsAnnouncements } from "@/components-client/events-announcements";
import { Achievements } from "@/components-client/achievements";
import { Gallery } from "@/components-client/gallery";
import { OBHomeSection } from "@/components-client/ob-home-section";
import { Footer } from "@/components-client/footer";
import { PageError } from "@/components-client/page-error";
import { client } from "@/utils/orpc";
import type { LifeTile } from "@/components-client/student-life";
import type { GalleryImage } from "@/components-client/gallery";

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

function buildLifeTiles(
  activities: {
    id: string;
    slug: string;
    name: string;
    coverImage: string | null;
    images: string[] | null;
  }[],
  events: { id: string; slug: string; title: string; coverImage: string | null }[],
  gallery: { id: string; slug: string; title: string; coverImage: string | null }[],
): LifeTile[] {
  const pool: LifeTile[] = [
    ...activities.map((a) => ({
      id: a.id,
      label: a.name,
      image: a.coverImage ?? a.images?.[0] ?? null,
      href: `/clubs/${a.slug}`,
    })),
    ...events.map((e) => ({
      id: e.id,
      label: e.title,
      image: e.coverImage,
      href: `/events/${e.slug}`,
    })),
    ...gallery.map((g) => ({
      id: g.id,
      label: g.title,
      image: g.coverImage,
      href: `/gallery/${g.slug}`,
    })),
  ];

  const withImage = shuffle(pool.filter((t) => t.image));
  const withoutImage = shuffle(pool.filter((t) => !t.image));

  // Prefer image tiles for the image slots, then fill the rest from whatever remains.
  return [...withImage, ...withoutImage].slice(0, 14);
}

async function buildGalleryImages(
  albums: { id: string; slug: string; title: string; coverImage: string | null }[],
): Promise<GalleryImage[]> {
  const perAlbum = await Promise.all(
    albums.map(async (album) => {
      const res = await client.gallery.listImages({ galleryId: album.id, pageSize: 50 });
      const covers = album.coverImage
        ? [
            {
              id: `${album.id}-cover`,
              url: album.coverImage,
              caption: album.title,
              slug: album.slug,
            },
          ]
        : [];
      const photos = res.rows.map((img) => ({
        id: img.id,
        url: img.url,
        caption: img.caption ?? album.title,
        slug: album.slug,
      }));
      return [...covers, ...photos];
    }),
  );
  return shuffle(perAlbum.flat()).slice(0, 20);
}

export const Route = createFileRoute("/")({
  loader: async () => {
    const [
      settings,
      achievementsData,
      galleryData,
      eventsData,
      newsData,
      announcementsData,
      principalData,
      activitiesData,
      obMembersData,
      obEventsData,
      obDonationsData,
    ] = await Promise.all([
      client.settings.getAll(),
      client.achievements.list({ page: 1, pageSize: 6, status: "published" }),
      client.gallery.list({ page: 1, pageSize: 12, status: "published" }),
      client.events.list({ page: 1, pageSize: 12, status: "published" }),
      client.news.list({ page: 1, pageSize: 10, status: "published" }),
      client.announcements.list({ page: 1, pageSize: 10, status: "published" }),
      client.principals.getCurrent(),
      client.activities.list({ status: "published" }),
      client.ob.obMembers.list({ status: "approved" }),
      client.ob.obEvents.list({ status: "published" }),
      client.ob.obDonations.list({ status: "confirmed" }),
    ]);

    const galleryImages = await buildGalleryImages(galleryData.rows);

    return {
      settings,
      achievements: achievementsData.rows,
      gallery: galleryData.rows,
      galleryImages,
      events: eventsData.rows,
      news: newsData.rows,
      announcements: announcementsData.rows,
      principal: principalData,
      lifeTiles: buildLifeTiles(activitiesData, eventsData.rows, galleryData.rows),
      activities: activitiesData,
      obMembers: obMembersData,
      obEvents: obEventsData,
      obDonations: obDonationsData,
    };
  },
  staleTime: 5 * 60_000,
  errorComponent: PageError,
  component: Home,
});

function Home() {
  const {
    settings,
    achievements,
    gallery,
    galleryImages,
    events,
    news,
    announcements,
    principal,
    lifeTiles,
    activities,
    obMembers,
    obEvents,
    obDonations,
  } = Route.useLoaderData();

  return (
    <div className="min-h-screen bg-cream">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-100 focus:top-2 focus:left-2 focus:bg-green-dark focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-cream focus:outline-2 focus:outline-gold focus:outline-offset-2"
      >
        Skip to main content
      </a>
      <NoticeStrip settings={settings} />
      <Navbar settings={settings} />
      <main id="main-content">
        <Hero settings={settings} />
        <Heritage settings={settings} />
        <PrincipalMessage settings={settings} principal={principal} />
        <QuickLinks settings={settings} />
        <StudentLife settings={settings} tiles={lifeTiles} />
        <EventsAnnouncements
          initialEvents={events}
          initialNews={news}
          initialAnnouncements={announcements}
          initialClubs={activities}
          initialGallery={gallery}
          settings={settings}
        />
        <Achievements initialData={achievements} settings={settings} />
        <OBHomeSection
          settings={settings}
          obMembers={obMembers}
          obEvents={obEvents}
          obDonations={obDonations}
        />
        <Gallery initialImages={galleryImages} settings={settings} />
      </main>
      <Footer settings={settings} />
    </div>
  );
}
