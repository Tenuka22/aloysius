import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components-client/navbar";
import { Footer } from "@/components-client/footer";
import { client } from "@/utils/orpc";

type Achievement = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  recipientNames: string[] | null;
  recipientType: string | null;
  year: number | null;
  coverImage: string | null;
  tags: string[] | null;
  publishedAt: string | null;
};

const categoryLabels: Record<string, string> = {
  academic: "Academic",
  sports: "Sports",
  arts: "Arts",
  clubs: "Clubs",
  community: "Community",
  other: "Other",
};

const categoryColors: Record<string, string> = {
  academic: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  sports: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  arts: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  clubs: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  community: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  other: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
};

const recipientTypeLabels: Record<string, string> = {
  student: "Student",
  faculty: "Faculty",
  club: "Club",
  org: "Organization",
};

export const Route = createFileRoute("/achievements_/$slug")({
  loader: async ({ params }) => {
    const achievement = await client.achievements.get({ slug: params.slug });
    return { achievement };
  },
  staleTime: 5 * 60_000,
  component: AchievementDetailPage,
});

function AchievementDetailPage() {
  const { achievement } = Route.useLoaderData() as { achievement: Achievement };

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
          <div className="mx-auto max-w-4xl">
            <div className="mb-4">
              <Link
                to="/achievements"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                &larr; Back to Achievements
              </Link>
            </div>

            {achievement.coverImage && (
              <div className="aspect-[16/9] overflow-hidden rounded-xl mb-8">
                <img
                  src={achievement.coverImage}
                  alt={achievement.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="flex items-center gap-3 mb-4">
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium capitalize ${categoryColors[achievement.category] ?? categoryColors.other}`}
              >
                {categoryLabels[achievement.category] ?? achievement.category}
              </span>
              {achievement.year && (
                <span className="text-sm text-muted-foreground">{achievement.year}</span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              {achievement.title}
            </h1>

            {achievement.recipientNames && achievement.recipientNames.length > 0 && (
              <p className="text-lg text-muted-foreground mb-6">
                {achievement.recipientNames.join(", ")}
                {achievement.recipientType && (
                  <span className="ml-2 text-sm capitalize opacity-60">
                    ({recipientTypeLabels[achievement.recipientType] ?? achievement.recipientType})
                  </span>
                )}
              </p>
            )}

            {achievement.description && (
              <div className="prose prose-neutral dark:prose-invert max-w-none mb-8">
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {achievement.description}
                </p>
              </div>
            )}

            {achievement.tags && achievement.tags.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {achievement.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {achievement.publishedAt && (
              <p className="text-sm text-muted-foreground mt-8">
                Published on {new Date(achievement.publishedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
