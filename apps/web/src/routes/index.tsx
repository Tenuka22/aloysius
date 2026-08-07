import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth, useClerk } from "@clerk/tanstack-react-start";
import { FileUpload } from "@/components/file-upload";
import { Navbar } from "@web-template/ui/components/navbar";
import { DataTable } from "@web-template/ui/components/data-table";
import { DataTablePagination } from "@web-template/ui/components/data-table";
import { FormBuilder } from "@web-template/ui/lib/form-builder";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@web-template/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@web-template/ui/components/card";
import { Separator } from "@web-template/ui/components/separator";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

const mockUsers: User[] = [
  { id: "1", name: "Alice Johnson", email: "alice@example.com", role: "Admin" },
  { id: "2", name: "Bob Smith", email: "bob@example.com", role: "User" },
  { id: "3", name: "Charlie Brown", email: "charlie@example.com", role: "User" },
  { id: "4", name: "Diana Ross", email: "diana@example.com", role: "Editor" },
  { id: "5", name: "Eve Davis", email: "eve@example.com", role: "User" },
];

const columns: ColumnDef<User, unknown>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "role",
    header: "Role",
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <Button variant="ghost" size="sm" onClick={() => alert(`Selected: ${row.original.name}`)}>
        View
      </Button>
    ),
  },
];

const navItems = [
  { label: "Home", href: "/" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Settings", href: "/settings" },
];

const formConfig = {
  fields: [
    { name: "name" as const, kind: "text" as const, label: "Full Name", placeholder: "Enter your name", required: true },
    { name: "email" as const, kind: "text" as const, label: "Email", placeholder: "you@example.com", required: true },
    { name: "role" as const, kind: "select" as const, label: "Role", options: [
      { value: "user", label: "User" },
      { value: "admin", label: "Admin" },
      { value: "editor", label: "Editor" },
    ]},
    { name: "bio" as const, kind: "textarea" as const, label: "Bio", placeholder: "Tell us about yourself..." },
  ],
  layout: [
    { columns: [{ fields: ["name"], span: 6 }, { fields: ["email"], span: 6 }] },
    { columns: [{ fields: ["role"], span: 6 }, { fields: ["bio"], span: 6 }] },
  ],
  submitLabel: "Create User",
};

function Home() {
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 3 });
  const { isSignedIn, signOut } = useAuth();
  const clerk = useClerk();

  return (
    <div className="min-h-screen bg-background">
      <Navbar
        logo={<span className="text-lg font-bold">Web Template</span>}
        items={navItems}
        actions={
          isSignedIn ? (
            <Button size="sm" variant="outline" onClick={() => signOut()}>
              Sign Out
            </Button>
          ) : (
            <Button size="sm" onClick={() => clerk.openSignIn()}>
              Login
            </Button>
          )
        }
      />

      <main className="mx-auto max-w-5xl space-y-8 p-6">
        {isSignedIn && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>File Upload</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">
                  Upload files to your account. Supported formats include images, documents, and more.
                </p>
                <FileUpload />
              </CardContent>
            </Card>

            <Separator />
          </>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Data Table</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={mockUsers.slice(pagination.pageIndex * pagination.pageSize, (pagination.pageIndex + 1) * pagination.pageSize)}
              pageCount={Math.ceil(mockUsers.length / pagination.pageSize)}
              pagination={pagination}
              onPaginationChange={setPagination}
              paginationBar={(table) => <DataTablePagination table={table} />}
            />
          </CardContent>
        </Card>

        <Separator />

        <Card>
          <CardHeader>
            <CardTitle>Form Builder</CardTitle>
          </CardHeader>
          <CardContent>
            <FormBuilder
              config={formConfig}
              defaultValues={{ name: "", email: "", role: "user", bio: "" }}
              onSubmit={async (values) => {
                console.log("Form submitted:", values);
                alert(`Form submitted: ${JSON.stringify(values, null, 2)}`);
              }}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export const Route = createFileRoute("/")({
  component: Home,
});
