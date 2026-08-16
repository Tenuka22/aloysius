"use client";

import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SidebarTrigger } from "@aloysius-web/ui/components/sidebar";
import { Separator } from "@aloysius-web/ui/components/separator";
import { Button } from "@aloysius-web/ui/components/button";
import { Input } from "@aloysius-web/ui/components/input";
import { Card, CardContent } from "@aloysius-web/ui/components/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@aloysius-web/ui/components/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@aloysius-web/ui/components/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@aloysius-web/ui/components/select";
import { Tabs, TabsList, TabsTrigger } from "@aloysius-web/ui/components/tabs";
import { IconPlus, IconDotsVertical, IconPencil, IconTrash, IconEye } from "@tabler/icons-react";
import { orpc } from "@/utils/orpc";
import { toast } from "sonner";
import type { ActivityRow } from "@/lib/api-types";

const typeLabels: Record<string, string> = {
  club: "Club",
  sport: "Sport",
  other: "Other",
};

const statusStyles: Record<string, string> = {
  published: "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  archived: "bg-gray-50 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
  draft: "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
};

const statusLabels: Record<string, string> = {
  published: "Published",
  archived: "Archived",
  draft: "Draft",
};

function DeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  isPending: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Activity</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <strong>{title}</strong>? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isPending}>
            {isPending ? "Deleting…" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ActivityCard({ item }: { item: ActivityRow }) {
  const queryClient = useQueryClient();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const deleteMutation = useMutation(
    orpc.admin.activities.delete.mutationOptions({
      onSuccess: () => {
        toast.success("Activity deleted");
        queryClient.invalidateQueries({ queryKey: orpc.activities.key() });
        setDeleteOpen(false);
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  const thumb = item.logoUrl || item.coverImage;

  return (
    <Card className="flex flex-col overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-5 border-b">
        <div className="flex items-start justify-between gap-3 mb-1">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground shrink-0 overflow-hidden">
              {thumb ? (
                <img src={thumb} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                item.name.charAt(0)
              )}
            </div>
            <h3 className="text-xl font-bold text-foreground truncate">{item.name}</h3>
          </div>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full shrink-0">
            {typeLabels[item.type] ?? item.type}
          </span>
        </div>
      </div>
      <div className="flex-1 p-5 space-y-3">
        <span
          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${statusStyles[item.status] ?? statusStyles.draft}`}
        >
          {statusLabels[item.status] ?? item.status}
        </span>
        {item.description && (
          <p className="text-sm text-muted-foreground line-clamp-3">{item.description}</p>
        )}
        <div className="text-[11px] text-muted-foreground">
          {Array.isArray(item.images) ? item.images.length : 0} gallery{" "}
          {Array.isArray(item.images) && item.images.length === 1 ? "image" : "images"} ·
          Created {new Date(item.createdAt).toLocaleDateString()}
        </div>
      </div>
      <div className="flex border-t">
        <Button
          variant="secondary"
          className="flex-1 h-12 justify-center rounded-none text-sm font-semibold"
          render={<Link to="/admin/activities/$id/edit" params={{ id: item.id }} />}
          nativeButton={false}
        >
          <IconPencil className="mr-1.5 size-4" />
          Manage {typeLabels[item.type] ?? "Activity"}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" className="h-12 w-12 rounded-none border-l" />}>
            <IconDotsVertical className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem render={<Link to="/admin/activities/$id" params={{ id: item.id }} />}>
              <IconEye className="size-4" />
              View Content
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
              <IconTrash className="size-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={() => deleteMutation.mutate({ id: item.id })}
        title={item.name}
        isPending={deleteMutation.isPending}
      />
    </Card>
  );
}

export const Route = createFileRoute("/admin/activities")({
  component: AdminActivitiesList,
});

function AdminActivitiesList() {
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const { data } = useQuery(orpc.activities.list.queryOptions({ input: {} }));

  const allItems = data ?? [];
  const items = allItems.filter((item) => {
    if (typeFilter !== "all" && item.type !== typeFilter) return false;
    if (statusFilter !== "all" && item.status !== statusFilter) return false;
    if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="flex flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-lg font-semibold">Activities</h1>
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" render={<Link to="/admin/activities/new" />} nativeButton={false}>
            <IconPlus className="mr-1 size-4" />
            New Activity
          </Button>
        </div>
      </header>
      <div className="p-6 pb-0">
        <Card className="border-secondary/20">
          <CardContent className="p-4 flex flex-wrap items-center gap-4">
            <Tabs value={typeFilter} onValueChange={(val) => setTypeFilter(val ?? "all")}>
              <TabsList variant="line">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="club">Clubs</TabsTrigger>
                <TabsTrigger value="sport">Sports</TabsTrigger>
                <TabsTrigger value="other">Other</TabsTrigger>
              </TabsList>
            </Tabs>
            <Input
              placeholder="Filter by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-[200px]"
            />
            <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val ?? "all")}>
              <SelectTrigger className="h-9 w-[140px]">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            {(typeFilter !== "all" || statusFilter !== "all" || search) && (
              <Button
                variant="ghost"
                onClick={() => {
                  setTypeFilter("all");
                  setStatusFilter("all");
                  setSearch("");
                }}
                className="h-9 px-2 lg:px-3"
              >
                Reset
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
      <div className="flex-1 p-6">
        {items.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No activities match your filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {items.map((item) => (
              <ActivityCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
