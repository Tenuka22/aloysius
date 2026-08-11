"use client"

import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { SidebarTrigger } from "@aloysius-web/ui/components/sidebar"
import { Separator } from "@aloysius-web/ui/components/separator"
import { Button } from "@aloysius-web/ui/components/button"
import { Input } from "@aloysius-web/ui/components/input"
import { Card, CardContent, CardHeader, CardTitle } from "@aloysius-web/ui/components/card"
import { client } from "@/utils/orpc"
import { toast } from "sonner"

type StatItem = {
  id: string
  label: string
  value: string
  icon: string
  sortOrder: number
}

export const Route = createFileRoute("/admin/stats")({
  component: AdminStats,
})

function StatCard({ stat }: { stat: StatItem }) {
  const queryClient = useQueryClient()
  const [label, setLabel] = useState(stat.label)
  const [value, setValue] = useState(stat.value)
  const [icon, setIcon] = useState(stat.icon)
  const [sortOrder, setSortOrder] = useState(stat.sortOrder)

  const updateMutation = useMutation({
    mutationFn: () =>
      client.stats.update({
        id: stat.id,
        label,
        value,
        icon,
        sortOrder,
      }),
    onSuccess: () => {
      toast.success("Stat updated")
      queryClient.invalidateQueries({ queryKey: ["stats"] })
    },
    onError: (err) => {
      toast.error(err.message)
    },
  })

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">{stat.label || "Untitled Stat"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Label</label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Label"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Value</label>
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Value"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Icon</label>
            <Input
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="Icon name"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Sort Order</label>
            <Input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              min={0}
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={() => updateMutation.mutate()}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function AdminStats() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["stats"],
    queryFn: () => client.stats.list(),
  })

  return (
    <div className="flex flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-lg font-semibold">Stats</h1>
      </header>
      <div className="flex-1 p-6">
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-48 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : !stats || stats.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">No stats found.</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {stats.map((stat) => (
              <StatCard key={stat.id} stat={stat} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
