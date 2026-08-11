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

type BigMatch = {
  id: string
  name: string
  opponent: string
  type: string
  year: number | null
  eventId: string | null
  galleryId: string | null
  sortOrder: number
  status: string
}

export const Route = createFileRoute("/admin/big-matches")({
  component: AdminBigMatches,
})

function BigMatchCard({ match }: { match: BigMatch }) {
  const queryClient = useQueryClient()
  const [name, setName] = useState(match.name)
  const [opponent, setOpponent] = useState(match.opponent)
  const [type, setType] = useState(match.type)
  const [year, setYear] = useState(match.year?.toString() ?? "")
  const [sortOrder, setSortOrder] = useState(match.sortOrder)
  const [status, setStatus] = useState(match.status)

  const updateMutation = useMutation({
    mutationFn: () =>
      client.bigMatches.update({
        id: match.id,
        name,
        opponent,
        type,
        year: year ? Number(year) : null,
        sortOrder,
        status: status as "draft" | "published" | "archived",
      }),
    onSuccess: () => {
      toast.success("Big match updated")
      queryClient.invalidateQueries({ queryKey: ["bigMatches"] })
    },
    onError: (err) => {
      toast.error(err.message)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => client.bigMatches.delete({ id: match.id }),
    onSuccess: () => {
      toast.success("Big match deleted")
      queryClient.invalidateQueries({ queryKey: ["bigMatches"] })
    },
    onError: (err) => {
      toast.error(err.message)
    },
  })

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">{match.name || "Untitled Match"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Match Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Battle of the Two Cities"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Opponent</label>
            <Input
              value={opponent}
              onChange={(e) => setOpponent(e.target.value)}
              placeholder="e.g. Rahula College, Matara"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Type</label>
            <Input
              value={type}
              onChange={(e) => setType(e.target.value)}
              placeholder="e.g. Cricket"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Year</label>
            <Input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="e.g. 2024"
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
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="destructive"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
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

function AdminBigMatches() {
  const queryClient = useQueryClient()
  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState("")
  const [newOpponent, setNewOpponent] = useState("")
  const [newType, setNewType] = useState("Cricket")
  const [newYear, setNewYear] = useState("")

  const { data: bigMatches, isLoading } = useQuery({
    queryKey: ["bigMatches"],
    queryFn: () => client.bigMatches.list(),
  })

  const createMutation = useMutation({
    mutationFn: () =>
      client.bigMatches.create({
        name: newName,
        opponent: newOpponent,
        type: newType,
        year: newYear ? Number(newYear) : undefined,
        status: "published",
      }),
    onSuccess: () => {
      toast.success("Big match created")
      queryClient.invalidateQueries({ queryKey: ["bigMatches"] })
      setShowNew(false)
      setNewName("")
      setNewOpponent("")
      setNewType("Cricket")
      setNewYear("")
    },
    onError: (err) => {
      toast.error(err.message)
    },
  })

  return (
    <div className="flex flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-lg font-semibold">Big Matches</h1>
        <div className="ml-auto">
          <Button size="sm" onClick={() => setShowNew(!showNew)}>
            {showNew ? "Cancel" : "Add Match"}
          </Button>
        </div>
      </header>
      <div className="flex-1 p-6 space-y-6">
        {showNew && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">New Big Match</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Match Name</label>
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Battle of the Two Cities"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Opponent</label>
                  <Input
                    value={newOpponent}
                    onChange={(e) => setNewOpponent(e.target.value)}
                    placeholder="e.g. Rahula College, Matara"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Type</label>
                  <Input
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    placeholder="e.g. Cricket"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Year</label>
                  <Input
                    type="number"
                    value={newYear}
                    onChange={(e) => setNewYear(e.target.value)}
                    placeholder="e.g. 2024"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={() => createMutation.mutate()}
                  disabled={createMutation.isPending || !newName || !newOpponent}
                >
                  {createMutation.isPending ? "Creating..." : "Create"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-48 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : !bigMatches || bigMatches.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">No big matches found. Add one to get started.</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {bigMatches.map((match) => (
              <BigMatchCard key={match.id} match={match} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
