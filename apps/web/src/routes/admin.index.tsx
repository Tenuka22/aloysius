import { createFileRoute } from "@tanstack/react-router"
import { SidebarTrigger } from "@aloysius-web/ui/components/sidebar"
import { Separator } from "@aloysius-web/ui/components/separator"

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
})

function AdminDashboard() {
  return (
    <div className="flex flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-lg font-semibold">Dashboard</h1>
      </header>
      <div className="flex-1 space-y-6 p-6">
        <p className="text-muted-foreground">
          Welcome to the admin panel. Only users with the{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-sm">admin</code> role can access
          this page.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">Users</div>
            <div className="text-2xl font-bold">—</div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">Events</div>
            <div className="text-2xl font-bold">—</div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">Student Works</div>
            <div className="text-2xl font-bold">—</div>
          </div>
        </div>
      </div>
    </div>
  )
}
