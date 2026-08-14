"use client";

import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components-client/navbar";
import { Footer } from "@/components-client/footer";
import { client } from "@/utils/orpc";

type MyClub = {
  membership: {
    id: string;
    activityId: string;
    role: "admin" | "member";
    status: "pending" | "approved" | "rejected" | "revoked";
    reason: string | null;
    isAdmin: boolean;
  };
  activity: {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    coverImage: string | null;
    logoUrl: string | null;
    bannerUrl: string | null;
    type: string;
  };
};

const statusStyles: Record<string, string> = {
  approved: "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  pending: "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  rejected: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  revoked: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const statusLabels: Record<string, string> = {
  approved: "Member",
  pending: "Pending Approval",
  rejected: "Rejected",
  revoked: "Access Revoked",
};

const typeLabels: Record<string, string> = {
  club: "Club",
  sport: "Sport",
  other: "Other",
};

export const Route = createFileRoute("/clubs")({
  component: MyClubsPage,
});

function MyClubsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["clubs", "my"],
    queryFn: () => client.clubs.myClubs(),
  });

  const clubs = (data ?? []) as unknown as MyClub[];

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
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">My Clubs</h1>
            <p className="text-muted-foreground text-lg max-w-2xl">
              Your clubs, sports, and societies at St. Aloysius College.
            </p>
          </div>
        </section>

        <section className="px-4 sm:px-6 lg:px-8 pb-16">
          <div className="mx-auto max-w-5xl">
            {isLoading ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {[0, 1].map((i) => (
                  <div key={i} className="h-40 rounded-xl border bg-card animate-pulse" />
                ))}
              </div>
            ) : clubs.length === 0 ? (
              <div className="rounded-xl border border-dashed p-16 text-center">
                <h2 className="text-lg font-semibold mb-2">You are not a member of any club yet</h2>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Request to join a club from its page and a club admin will review your
                  application.
                </p>
                <Link
                  to="/about"
                  className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Browse Clubs
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {clubs.map(({ membership, activity }) => (
                  <Link
                    key={membership.id}
                    to="/clubs/$id"
                    params={{ id: activity.id }}
                    className="group rounded-xl border bg-card overflow-hidden hover:shadow-md transition-shadow"
                  >
                    {activity.bannerUrl || activity.logoUrl || activity.coverImage ? (
                      <div className="aspect-[16/7] overflow-hidden">
                        <img
                          src={
                            activity.bannerUrl ??
                            activity.logoUrl ??
                            activity.coverImage ??
                            undefined
                          }
                          alt={activity.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <div className="aspect-[16/7] bg-muted flex items-center justify-center">
                        <span className="text-3xl font-bold text-muted-foreground/30">
                          {activity.name.slice(0, 1)}
                        </span>
                      </div>
                    )}
                    <div className="p-5">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                          {activity.name}
                        </h3>
                        <span
                          className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            statusStyles[membership.status] ?? statusStyles.pending
                          }`}
                        >
                          {statusLabels[membership.status] ?? membership.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{typeLabels[activity.type] ?? activity.type}</span>
                        {membership.isAdmin && (
                          <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                            Club Admin
                          </span>
                        )}
                      </div>
                      {activity.description && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {activity.description}
                        </p>
                      )}
                      {membership.reason && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                          {membership.reason}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
