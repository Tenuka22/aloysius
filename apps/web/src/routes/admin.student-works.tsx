"use client"

import { useState, useRef } from "react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  type ColumnFiltersState,
  type PaginationState,
  type SortingState,
} from "@tanstack/react-table"
import { SidebarTrigger } from "@aloysius-web/ui/components/sidebar"
import { Separator } from "@aloysius-web/ui/components/separator"
import { Button } from "@aloysius-web/ui/components/button"
import { Input } from "@aloysius-web/ui/components/input"
import {
  DataTable,
  DataTableColumnHeader,
  DataTablePagination,
  DataTableViewOptions,
} from "@aloysius-web/ui/components/data-table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@aloysius-web/ui/components/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@aloysius-web/ui/components/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@aloysius-web/ui/components/select"
import { IconPlus, IconDotsVertical, IconPencil, IconTrash, IconSend, IconArchive, IconRotate } from "@tabler/icons-react"
import { client } from "@/utils/orpc"
import { toast } from "sonner"
import type { ColumnDef } from "@tanstack/react-table"

type StudentWorkItem = {
  id: string
  title: string
  description: string | null
  category: string
  studentName: string
  studentGrade: string | null
  coverImage: string | null
  contentUrl: string | null
  tags: string[] | null
  status: string
  publishedAt: string | null
  createdAt: string
}

function DeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  title: string
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Student Work</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <strong>{title}</strong>? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ActionsMenu({ item }: { item: StudentWorkItem }) {
  const queryClient = useQueryClient()
  const [deleteOpen, setDeleteOpen] = useState(false)

  const deleteMutation = useMutation({
    mutationFn: () => client.studentWorks.delete({ id: item.id }),
    onSuccess: () => {
      toast.success("Student work deleted")
      queryClient.invalidateQueries({ queryKey: ["studentWorks"] })
      setDeleteOpen(false)
    },
    onError: (err) => {
      toast.error(err.message)
    },
  })

  const statusMutation = useMutation({
    mutationFn: (status: "draft" | "published" | "archived") =>
      client.studentWorks.update({ id: item.id, status, publishNow: status === "published" }),
    onSuccess: () => {
      toast.success("Status updated")
      queryClient.invalidateQueries({ queryKey: ["studentWorks"] })
    },
    onError: (err) => {
      toast.error(err.message)
    },
  })

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon-sm" />
          }
        >
          <IconDotsVertical className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem render={<Link to="/admin/student-works/$id/edit" params={{ id: item.id }} />}>
            <IconPencil className="size-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {item.status === "draft" && (
            <DropdownMenuItem onClick={() => statusMutation.mutate("published")}>
              <IconSend className="size-4" />
              Publish
            </DropdownMenuItem>
          )}
          {item.status === "published" && (
            <>
              <DropdownMenuItem onClick={() => statusMutation.mutate("draft")}>
                <IconRotate className="size-4" />
                Unpublish
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => statusMutation.mutate("archived")}>
                <IconArchive className="size-4" />
                Archive
              </DropdownMenuItem>
            </>
          )}
          {item.status === "archived" && (
            <DropdownMenuItem onClick={() => statusMutation.mutate("draft")}>
              <IconRotate className="size-4" />
              Restore to Draft
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setDeleteOpen(true)}
          >
            <IconTrash className="size-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={() => deleteMutation.mutate()}
        title={item.title}
      />
    </>
  )
}

const categoryColors: Record<string, string> = {
  film: "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  art: "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  music: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  writing: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  design: "bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  photography: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  code: "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  other: "bg-gray-50 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
}

const columns: ColumnDef<StudentWorkItem, any>[] = [
  {
    accessorKey: "coverImage",
    header: "Cover",
    cell: ({ row }) => {
      const url = row.original.coverImage
      if (!url) return <span className="text-muted-foreground">—</span>
      return (
        <img
          src={url}
          alt=""
          className="h-10 w-10 rounded-md object-cover"
        />
      )
    },
    size: 60,
  },
  {
    accessorKey: "title",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Title" />,
  },
  {
    accessorKey: "studentName",
    header: "Student",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.studentName}</span>
    ),
  },
  {
    accessorKey: "category",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Category" />,
    cell: ({ row }) => (
      <span
        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
          categoryColors[row.original.category] ?? categoryColors.other
        }`}
      >
        {row.original.category}
      </span>
    ),
  },
  {
    accessorKey: "studentGrade",
    header: "Grade",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.studentGrade ?? "—"}</span>
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => (
      <span
        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
          row.original.status === "published"
            ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
            : row.original.status === "archived"
              ? "bg-gray-50 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400"
              : "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
        }`}
      >
        {row.original.status === "published" ? "Published" : row.original.status === "archived" ? "Archived" : "Draft"}
      </span>
    ),
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {new Date(row.original.createdAt).toLocaleDateString()}
      </span>
    ),
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => <ActionsMenu item={row.original} />,
  },
]

export const Route = createFileRoute("/admin/student-works")({
  component: AdminStudentWorksList,
})

function AdminStudentWorksList() {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const searchInputRef = useRef<HTMLInputElement>(null)

  const sort = sorting[0]
  const rawSearch = columnFilters.find((f) => f.id === "title")?.value
  const search = typeof rawSearch === "string" && rawSearch.length > 0 ? rawSearch : undefined
  const rawStatus = columnFilters.find((f) => f.id === "status")?.value
  const status = typeof rawStatus === "string" && rawStatus.length > 0 ? (rawStatus as "draft" | "published" | "archived") : undefined
  const rawCategory = columnFilters.find((f) => f.id === "category")?.value
  const category = typeof rawCategory === "string" && rawCategory.length > 0 ? (rawCategory as string) : undefined

  const { data, isLoading } = useQuery({
    queryKey: ["studentWorks", pagination.pageIndex, pagination.pageSize, sort?.id, sort?.desc, search, status, category],
    queryFn: () => client.studentWorks.list({
      page: pagination.pageIndex + 1,
      pageSize: pagination.pageSize,
      sort: sort?.id,
      sortDir: sort?.desc ? "desc" : "asc",
      search,
      status,
      category,
    }),
  })

  const items = data?.rows ?? []
  const pageCount = data?.pageCount ?? 0

  return (
    <div className="flex flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-lg font-semibold">Student Works</h1>
        <div className="ml-auto">
          <Button size="sm" render={<Link to="/admin/student-works/new" />} nativeButton={false}>
            <IconPlus className="mr-1 size-4" />
            New Student Work
          </Button>
        </div>
      </header>
      <div className="flex-1 p-6">
        <DataTable
          columns={columns}
          data={items}
          pageCount={pageCount}
          loading={isLoading}
          pagination={pagination}
          sorting={sorting}
          columnFilters={columnFilters}
          onPaginationChange={setPagination}
          onSortingChange={setSorting}
          onColumnFiltersChange={setColumnFilters}
          toolbar={(table) => {
            const filters = table.getState().columnFilters
            const isFiltered = filters.length > 0
            const setFilter = (id: string, value: string) => {
              const next = filters.filter((f) => f.id !== id)
              if (value) next.push({ id, value })
              table.setColumnFilters(next)
            }
            return (
              <div className="flex items-center justify-between">
                <div className="flex flex-1 items-center gap-2">
                  <Input
                    ref={searchInputRef}
                    placeholder="Filter by title..."
                    value={(filters.find((f) => f.id === "title")?.value as string) ?? ""}
                    onChange={(e) => setFilter("title", e.target.value)}
                    className="h-8 w-[200px] lg:w-[250px]"
                  />
                  <Select
                    value={(filters.find((f) => f.id === "category")?.value as string) ?? ""}
                    onValueChange={(val) => setFilter("category", val ?? "")}
                  >
                    <SelectTrigger className="h-8 w-[140px]">
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="film">Film</SelectItem>
                      <SelectItem value="art">Art</SelectItem>
                      <SelectItem value="music">Music</SelectItem>
                      <SelectItem value="writing">Writing</SelectItem>
                      <SelectItem value="design">Design</SelectItem>
                      <SelectItem value="photography">Photography</SelectItem>
                      <SelectItem value="code">Code</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={(filters.find((f) => f.id === "status")?.value as string) ?? ""}
                    onValueChange={(val) => setFilter("status", val ?? "")}
                  >
                    <SelectTrigger className="h-8 w-[140px]">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                  {isFiltered && (
                    <Button
                      variant="ghost"
                      onClick={() => table.resetColumnFilters()}
                      className="h-8 px-2 lg:px-3"
                    >
                      Reset
                    </Button>
                  )}
                </div>
                <DataTableViewOptions table={table} />
              </div>
            )
          }}
          paginationBar={(table) => <DataTablePagination table={table} />}
        />
      </div>
    </div>
  )
}
