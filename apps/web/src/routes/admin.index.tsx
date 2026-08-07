import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
})

function AdminDashboard() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Dashboard</h2>
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
  )
}
