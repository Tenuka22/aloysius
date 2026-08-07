"use client"

import { useUser, useAuth } from "@clerk/tanstack-react-start"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@aloysius-web/ui/components/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@aloysius-web/ui/components/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@aloysius-web/ui/components/sidebar"
import { IconSelector, IconLogout, IconHome } from "@tabler/icons-react"

export function NavUser() {
  const { isMobile } = useSidebar()
  const { user } = useUser()
  const { signOut } = useAuth()

  if (!user) return null

  const firstName = user.firstName || "User"
  const lastName = user.lastName || ""
  const email = user.emailAddresses?.[0]?.emailAddress || ""
  const avatarUrl = user.imageUrl

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton size="lg" className="aria-expanded:bg-muted" />
            }
          >
            <Avatar>
              <AvatarImage src={avatarUrl} alt={firstName} />
              <AvatarFallback>{firstName[0]}{lastName[0]}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{firstName} {lastName}</span>
              <span className="truncate text-xs">{email}</span>
            </div>
            <IconSelector className="ml-auto size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-fit"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar>
                    <AvatarImage src={avatarUrl} alt={firstName} />
                    <AvatarFallback>{firstName[0]}{lastName[0]}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{firstName} {lastName}</span>
                    <span className="truncate text-xs">{email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <IconHome />
                <a href="/">Back to Site</a>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()}>
              <IconLogout />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
