import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import { auth } from "@clerk/tanstack-react-start/server"

const requireAdmin = createServerFn({ method: "GET" }).handler(async () => {
  const { isAuthenticated, sessionClaims } = await auth()

  if (!isAuthenticated) {
    throw redirect({ to: "/sign-in" })
  }

  const role = (sessionClaims as any)?.metadata?.role

  if (role !== "admin") {
    throw redirect({ to: "/" })
  }

  return { role }
})

export const Route = createFileRoute("/admin")({
  beforeLoad: () => requireAdmin(),
  component: AdminLayout,
})

function AdminLayout() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <a href="/" className="text-lg font-bold">
            Aloysius College
          </a>
          <nav className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Admin Panel</span>
            <a
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Back to Site
            </a>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  )
}
