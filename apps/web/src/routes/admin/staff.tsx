import { Button } from "@astryxdesign/core/Button";
import { Dialog, DialogHeader } from "@astryxdesign/core/Dialog";
import {
  HStack,
  Layout,
  LayoutContent,
  LayoutFooter,
  LayoutHeader,
  VStack,
} from "@astryxdesign/core/Layout";
import {
  Table,
  pixel,
  useTablePagination,
  useTableSortable,
} from "@astryxdesign/core/Table";
import { Heading } from "@astryxdesign/core/Text";
import { TextInput } from "@astryxdesign/core/TextInput";
import { Toolbar } from "@astryxdesign/core/Toolbar";
import { consumeEventIterator } from "@orpc/client";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense, useEffect, useMemo, useState } from "react";

import { StaffForm } from "@/components/admin/staff-form";
import {
  emptyStaffFormValues,
  joinIsoDate,
  splitIsoDate,
  toOptionalField,
} from "@/components/admin/staff-form-values";
import type { StaffFormValues } from "@/components/admin/staff-form-values";
import { client, orpc } from "@/utils/orpc";

type SortState = { sortKey: string; direction: "ascending" | "descending" }[];

export const Route = createFileRoute("/admin/staff")({
  loader: ({ context }) => {
    context.queryClient.prefetchQuery(orpc.staff.listStaff.queryOptions());
  },
  component: () => (
    <Layout
      content={
        <LayoutContent padding={6}>
          <Suspense fallback="Loading staff…">
            <StaffPage />
          </Suspense>
        </LayoutContent>
      }
      header={
        <LayoutHeader>
          <Heading level={1}>Staff</Heading>
        </LayoutHeader>
      }
      height="fill"
      padding={0}
    />
  ),
});

const StaffPage = () => {
  const queryClient = useQueryClient();
  const { data } = useSuspenseQuery(orpc.staff.listStaff.queryOptions());
  type StaffRow = (typeof data)[number];
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<SortState>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffRow | null>(null);
  const pageSize = 10;

  useEffect(() => {
    const cancel = consumeEventIterator(client.staff.watchStaff(), {
      onEvent: () => {
        queryClient.invalidateQueries(orpc.staff.listStaff.queryOptions());
      },
      onError: (error) => {
        console.error("[staff] SSE error:", error);
      },
    });
    return () => {
      cancel();
    };
  }, [queryClient]);

  const deleteStaff = useMutation(orpc.staff.deleteStaff.mutationOptions());

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = q
      ? data.filter((row) =>
          [row.name, row.email, row.nic, row.phone].some((value) =>
            value?.toLowerCase().includes(q)
          )
        )
      : data;

    const [primarySort] = sort;
    if (primarySort) {
      const { sortKey, direction } = primarySort;
      rows = rows.toSorted((a, b) => {
        const left = String(a[sortKey as keyof typeof a] ?? "");
        const right = String(b[sortKey as keyof typeof b] ?? "");
        const comparison = left.localeCompare(right);
        return direction === "ascending" ? comparison : -comparison;
      });
    }

    return rows;
  }, [data, query, sort]);

  const pageData = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <VStack gap={4}>
      <Toolbar
        endContent={
          <Button
            label="Add staff"
            onClick={() => setIsAddOpen(true)}
            variant="primary"
          />
        }
        label="Staff actions"
        startContent={
          <TextInput
            isLabelHidden
            label="Search staff"
            onChange={(value) => {
              setQuery(value);
              setPage(1);
            }}
            placeholder="Search by name, email, NIC, phone…"
            value={query}
          />
        }
      />

      <Table
        columns={[
          { key: "name", header: "Name" },
          { key: "email", header: "Email" },
          { key: "nic", header: "NIC" },
          { key: "phone", header: "Phone" },
          {
            key: "actions",
            header: "",
            width: pixel(160),
            renderCell: (row: StaffRow) => (
              <HStack gap={2}>
                <Button
                  label="Edit"
                  onClick={() => setEditingStaff(row)}
                  size="sm"
                  variant="secondary"
                />
                <Button
                  clickAction={async () => {
                    await deleteStaff.mutateAsync({ id: row.id });
                  }}
                  label="Delete"
                  size="sm"
                  variant="destructive"
                />
              </HStack>
            ),
          },
        ]}
        data={pageData}
        hasHover
        idKey="id"
        plugins={{
          sort: useTableSortable<StaffRow>({ sort, onSortChange: setSort }),
          pagination: useTablePagination<StaffRow>({
            page,
            onPageChange: setPage,
            totalItems: filtered.length,
            pageSize,
          }),
        }}
      />

      <AddStaffDialog
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onCreated={() => setIsAddOpen(false)}
      />

      <EditStaffDialog
        onClose={() => setEditingStaff(null)}
        onUpdated={() => setEditingStaff(null)}
        staff={editingStaff}
      />
    </VStack>
  );
};

const AddStaffDialog = ({
  isOpen,
  onClose,
  onCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}) => {
  const [values, setValues] = useState<StaffFormValues>(emptyStaffFormValues);

  const createStaff = useMutation(
    orpc.staff.createStaff.mutationOptions({
      onSuccess: () => {
        setValues(emptyStaffFormValues);
        onCreated();
        onClose();
      },
    })
  );

  return (
    <Dialog isOpen={isOpen} onOpenChange={onClose} purpose="form" width={420}>
      <Layout
        content={
          <LayoutContent>
            <StaffForm onChange={setValues} values={values} />
          </LayoutContent>
        }
        footer={
          <LayoutFooter>
            <HStack gap={2} hAlign="end">
              <Button label="Cancel" onClick={onClose} variant="secondary" />
              <Button
                clickAction={async () => {
                  await createStaff.mutateAsync({
                    name: values.name,
                    email: toOptionalField(values.email),
                    nic: toOptionalField(values.nic),
                    phone: toOptionalField(values.phone),
                    gender: toOptionalField(values.gender) as
                      | "male"
                      | "female"
                      | undefined,
                    birthDate: toOptionalField(
                      joinIsoDate({
                        day: values.birthDay,
                        month: values.birthMonth,
                        year: values.birthYear,
                      })
                    ),
                  });
                }}
                isDisabled={values.name.trim().length === 0}
                label="Add"
                variant="primary"
              />
            </HStack>
          </LayoutFooter>
        }
        header={<DialogHeader onOpenChange={onClose} title="Add staff" />}
      />
    </Dialog>
  );
};

interface EditableStaff {
  id: string;
  name: string;
  email: string | null;
  nic: string | null;
  phone: string | null;
  gender: string | null;
  birthDate: string | null;
}

const EditStaffDialog = ({
  staff,
  onClose,
  onUpdated,
}: {
  staff: EditableStaff | null;
  onClose: () => void;
  onUpdated: () => void;
}) => (
  <Dialog
    isOpen={staff !== null}
    onOpenChange={(open) => {
      if (!open) {
        onClose();
      }
    }}
    purpose="form"
    width={420}
  >
    {staff && (
      <EditStaffForm
        key={staff.id}
        onClose={onClose}
        onUpdated={onUpdated}
        staff={staff}
      />
    )}
  </Dialog>
);

const EditStaffForm = ({
  staff,
  onClose,
  onUpdated,
}: {
  staff: EditableStaff;
  onClose: () => void;
  onUpdated: () => void;
}) => {
  const [values, setValues] = useState<StaffFormValues>(() => {
    const { day, month, year } = splitIsoDate(staff.birthDate ?? "");
    return {
      name: staff.name,
      email: staff.email ?? "",
      nic: staff.nic ?? "",
      phone: staff.phone ?? "",
      gender: staff.gender ?? "",
      birthDay: day,
      birthMonth: month,
      birthYear: year,
    };
  });

  const updateStaff = useMutation(
    orpc.staff.updateStaff.mutationOptions({
      onSuccess: () => {
        onUpdated();
        onClose();
      },
    })
  );

  return (
    <Layout
      content={
        <LayoutContent>
          <StaffForm onChange={setValues} values={values} />
        </LayoutContent>
      }
      footer={
        <LayoutFooter>
          <HStack gap={2} hAlign="end">
            <Button label="Cancel" onClick={onClose} variant="secondary" />
            <Button
              clickAction={async () => {
                await updateStaff.mutateAsync({
                  id: staff.id,
                  name: values.name,
                  email: toOptionalField(values.email),
                  nic: toOptionalField(values.nic),
                  phone: toOptionalField(values.phone),
                  gender: toOptionalField(values.gender) as
                    | "male"
                    | "female"
                    | undefined,
                  birthDate: toOptionalField(
                    joinIsoDate({
                      day: values.birthDay,
                      month: values.birthMonth,
                      year: values.birthYear,
                    })
                  ),
                });
              }}
              isDisabled={values.name.trim().length === 0}
              label="Save"
              variant="primary"
            />
          </HStack>
        </LayoutFooter>
      }
      header={<DialogHeader onOpenChange={onClose} title="Edit staff" />}
    />
  );
};
