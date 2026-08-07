import { createFileRoute, Link } from "@tanstack/react-router"
import { SidebarTrigger } from "@aloysius-web/ui/components/sidebar"
import { Separator } from "@aloysius-web/ui/components/separator"
import { Button } from "@aloysius-web/ui/components/button"
import { IconPlus, IconPencil, IconTrash } from "@tabler/icons-react"

const mockAnnouncements = [
  {
    id: "1",
    title: "Admissions Open for Grade 6 – 2026",
    excerpt: "Applications are now open.",
    publishedAt: "2026-05-15",
    createdAt: "2026-05-10",
  },
  {
    id: "2",
    title: "Exam Timetable – Term 2",
    excerpt: "Please check the timetable for updates.",
    publishedAt: "2026-05-12",
    createdAt: "2026-05-08",
  },
  {
    id: "3",
    title: "Congratulations to Our Debaters!",
    excerpt: "Winners at the All-Island Inter-School Competition.",
    publishedAt: null,
    createdAt: "2026-05-05",
  },
]

export const Route = createFileRoute("/admin/news")({
  component: AdminNewsList,
})

function AdminNewsList() {
  return (
    <div className="flex flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-lg font-semibold">News & Announcements</h1>
        <div className="ml-auto">
          <Button size="sm" asChild>
            <Link to="/admin/news/new">
              <IconPlus className="mr-1 size-4" />
              New Announcement
            </Link>
          </Button>
        </div>
      </header>
      <div className="flex-1 p-6">
        <div className="rounded-lg border">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium">Title</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Excerpt</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Created</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {mockAnnouncements.map((item) => (
                <tr key={item.id} className="border-b last:border-0">
                  <td className="px-4 py-3 text-sm font-medium">{item.title}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{item.excerpt}</td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        item.publishedAt
                          ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                      }`}
                    >
                      {item.publishedAt ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{item.createdAt}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon-sm" asChild>
                        <Link to="/admin/news/$id/edit" params={{ id: item.id }}>
                          <IconPencil className="size-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon-sm">
                        <IconTrash className="size-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
