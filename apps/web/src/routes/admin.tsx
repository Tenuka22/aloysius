import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import { auth } from "@clerk/tanstack-react-start/server"
import { SidebarProvider, SidebarInset } from "@aloysius-web/ui/components/sidebar"
import { AdminSidebar } from "@/components/app-sidebar"

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
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  )
}
