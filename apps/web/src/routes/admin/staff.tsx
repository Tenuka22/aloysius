import {
  CmsButton,
  Panel,
  PanelHead,
} from "@aloysius/ui/components/cms/cms-primitives";
import {
  color,
  font,
  motionToken,
  space,
} from "@aloysius/ui/tokens/tokens.stylex";
import { consumeEventIterator } from "@orpc/client";
import * as stylex from "@stylexjs/stylex";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";

import { StaffForm } from "@/components/admin/staff-form";
import {
  emptyStaffFormValues,
  joinIsoDate,
  splitIsoDate,
  toOptionalField,
} from "@/components/admin/staff-form-values";
import type { StaffFormValues } from "@/components/admin/staff-form-values";
import { client, orpc } from "@/utils/orpc";

const md = "@media (min-width: 40rem)";
const lg = "@media (min-width: 48rem)";

const styles = stylex.create({
  wrap: {
    paddingBlockStart: space.md,
    paddingBlockEnd: space.md,
    paddingInlineStart: space.md,
    paddingInlineEnd: space.md,
    [md]: {
      paddingBlockStart: space.lg,
      paddingBlockEnd: space.lg,
      paddingInlineStart: space.lg,
      paddingInlineEnd: space.lg,
    },
  },
  toolbar: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: space.md,
    marginBlockEnd: space.lg,
  },
  toolbarSearch: {
    flex: "1 1 12rem",
    minWidth: 0,
  },
  searchInput: {
    width: "100%",
    paddingBlock: space["2xs"],
    paddingInline: space.xs,
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: color.borderStrong,
    borderRadius: 0,
    backgroundColor: color.surfaceSunken,
    color: color.onSurface,
    fontFamily: font.body,
    fontSize: font.sizeMd,
    lineHeight: font.leadingNormal,
  },
  table: {
    display: "grid",
    gridTemplateColumns: "minmax(0,1.5fr) minmax(0,1.8fr) 7rem 9rem 2.5rem",
    gap: "1px",
    minWidth: 0,
    backgroundColor: color.border,
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: color.border,
  },
  headerRow: {
    display: {
      default: "none",
      [lg]: "contents",
    },
  },
  headerCell: {
    paddingBlock: space["2xs"],
    paddingInline: space.md,
    backgroundColor: color.surfaceInverse,
    color: color.accentOnInverse,
    fontSize: font.size2xs,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingWider,
    textTransform: "uppercase",
  },
  list: {
    display: "contents",
  },
  row: {
    display: {
      default: "grid",
      [lg]: "contents",
    },
    gridTemplateColumns: {
      default: "1fr",
      [lg]: "auto",
    },
    gap: space["3xs"],
    paddingBlock: space.sm,
    paddingInline: space.sm,
    backgroundColor: {
      default: color.surface,
      [lg]: "transparent",
    },
    borderWidth: {
      default: "1px",
      [lg]: 0,
    },
    borderStyle: "solid",
    borderColor: color.border,
    marginBlockEnd: {
      default: space["2xs"],
      [lg]: 0,
    },
  },
  cell: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: space["3xs"],
    minWidth: 0,
    paddingBlock: {
      default: 0,
      [lg]: space["2xs"],
    },
    paddingInline: {
      default: 0,
      [lg]: space.md,
    },
  },
  cellLabel: {
    display: {
      default: "inline",
      [lg]: "none",
    },
    flexShrink: 0,
    fontSize: font.size2xs,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingWide,
    textTransform: "uppercase",
    color: color.accentOnSurface,
  },
  cellContent: {
    flex: 1,
    minWidth: 0,
    fontSize: font.sizeSm,
    lineHeight: font.leadingNormal,
    color: color.onSurface,
  },
  menuWrap: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gridColumn: {
      default: 1,
      [lg]: "auto",
    },
  },
  menuButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "2rem",
    height: "2rem",
    listStyle: "none",
    borderWidth: 0,
    borderRadius: "0.25rem",
    backgroundColor: "transparent",
    color: color.onSurfaceMuted,
    cursor: "pointer",
    touchAction: "manipulation",
    WebkitTapHighlightColor: "transparent",
    transitionProperty: "background-color",
    transitionDuration: motionToken.fast,
    "::-webkit-details-marker": {
      display: "none",
    },
    "::marker": {
      display: "none",
      content: '""',
    },
  },
  menuDropdown: {
    position: "absolute",
    insetBlockStart: "100%",
    insetInlineEnd: 0,
    minWidth: "10rem",
    backgroundColor: color.surface,
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: color.border,
    paddingBlock: space["3xs"],
    paddingInline: 0,
    zIndex: 30,
    boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
  },
  menuItem: {
    display: "flex",
    alignItems: "center",
    gap: space.xs,
    width: "100%",
    paddingBlock: space.xs,
    paddingInline: space.md,
    borderWidth: 0,
    backgroundColor: "transparent",
    color: color.onSurface,
    fontFamily: font.body,
    fontSize: font.sizeSm,
    textAlign: "start",
    cursor: "pointer",
    touchAction: "manipulation",
    WebkitTapHighlightColor: "transparent",
    transitionProperty: "background-color",
    transitionDuration: motionToken.fast,
  },
  menuItemDanger: {
    color: color.danger,
  },
  dialog: {
    borderWidth: 0,
    padding: 0,
    width: "min(28rem, 95vw)",
    maxHeight: "90dvh",
    borderRadius: "0.25rem",
    zIndex: 21,
    overflowY: "auto",
  },
  dialogInner: {
    display: "flex",
    flexDirection: "column",
    gap: space.lg,
  },
  dialogFooter: {
    display: "flex",
    flexWrap: "wrap",
    gap: space["2xs"],
    justifyContent: "flex-end",
  },
  pagination: {
    display: "flex",
    gap: space.md,
    justifyContent: "center",
    alignItems: "center",
    marginBlockStart: space.lg,
    fontSize: font.sizeSm,
    color: color.onSurfaceMuted,
  },
  pageButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "2.75rem",
    paddingBlock: space["2xs"],
    paddingInline: space.md,
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: color.borderStrong,
    borderRadius: "0.25rem",
    backgroundColor: color.surface,
    color: color.onSurface,
    fontFamily: font.body,
    fontSize: font.sizeSm,
    fontWeight: font.weightBold,
    cursor: "pointer",
    touchAction: "manipulation",
    WebkitTapHighlightColor: "transparent",
  },
  pageButtonDisabled: {
    opacity: 0.4,
    cursor: "not-allowed",
  },
});

export const Route = createFileRoute("/admin/staff")({
  loader: ({ context }) => {
    context.queryClient.prefetchQuery(orpc.staff.listStaff.queryOptions());
  },
  component: () => (
    <div {...stylex.props(styles.wrap)}>
      <Suspense fallback="Loading staff…">
        <StaffPage />
      </Suspense>
    </div>
  ),
});

const StaffPage = () => {
  const queryClient = useQueryClient();
  const { data } = useSuspenseQuery(orpc.staff.listStaff.queryOptions());
  type StaffRow = (typeof data)[number];
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
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
    return q
      ? data.filter((row) =>
          [row.name, row.email, row.nic, row.phone].some((value) =>
            value?.toLowerCase().includes(q)
          )
        )
      : data;
  }, [data, query]);

  const pageData = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <>
      <div {...stylex.props(styles.toolbar)}>
        <div {...stylex.props(styles.toolbarSearch)}>
          <input
            {...stylex.props(styles.searchInput)}
            onChange={(e) => {
              setQuery(e.currentTarget.value);
              setPage(1);
            }}
            placeholder="Search by name, email, NIC, phone…"
            type="text"
            value={query}
          />
        </div>
        <CmsButton onClick={() => setIsAddOpen(true)} tone="primary">
          Add staff
        </CmsButton>
      </div>

      <div {...stylex.props(styles.table)}>
        <div {...stylex.props(styles.headerRow)}>
          <div {...stylex.props(styles.headerCell)}>Name</div>
          <div {...stylex.props(styles.headerCell)}>Email</div>
          <div {...stylex.props(styles.headerCell)}>NIC</div>
          <div {...stylex.props(styles.headerCell)}>Phone</div>
          <div aria-hidden="true" />
        </div>

        <ul {...stylex.props(styles.list)}>
          {pageData.map((row) => (
            <li key={row.id} {...stylex.props(styles.row)}>
              <div {...stylex.props(styles.cell)}>
                <span {...stylex.props(styles.cellLabel)}>Name</span>
                <span {...stylex.props(styles.cellContent)}>{row.name}</span>
              </div>
              <div {...stylex.props(styles.cell)}>
                <span {...stylex.props(styles.cellLabel)}>Email</span>
                <span {...stylex.props(styles.cellContent)}>
                  {row.email || "—"}
                </span>
              </div>
              <div {...stylex.props(styles.cell)}>
                <span {...stylex.props(styles.cellLabel)}>NIC</span>
                <span {...stylex.props(styles.cellContent)}>
                  {row.nic || "—"}
                </span>
              </div>
              <div {...stylex.props(styles.cell)}>
                <span {...stylex.props(styles.cellLabel)}>Phone</span>
                <span {...stylex.props(styles.cellContent)}>
                  {row.phone || "—"}
                </span>
              </div>
              <div {...stylex.props(styles.menuWrap)}>
                <details>
                  <summary
                    aria-label="Actions"
                    {...stylex.props(styles.menuButton)}
                  >
                    ⋮
                  </summary>
                  <div {...stylex.props(styles.menuDropdown)}>
                    <button
                      onClick={() => setEditingStaff(row)}
                      type="button"
                      {...stylex.props(styles.menuItem)}
                    >
                      Edit
                    </button>
                    <button
                      onClick={async () => {
                        await deleteStaff.mutateAsync({ id: row.id });
                      }}
                      type="button"
                      {...stylex.props(styles.menuItem, styles.menuItemDanger)}
                    >
                      Delete
                    </button>
                  </div>
                </details>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Pagination */}
      <div {...stylex.props(styles.pagination)}>
        <button
          disabled={page === 1}
          onClick={() => setPage(Math.max(1, page - 1))}
          type="button"
          {...stylex.props(
            styles.pageButton,
            page === 1 && styles.pageButtonDisabled
          )}
        >
          Previous
        </button>
        <span>Page {page}</span>
        <button
          disabled={pageData.length < pageSize}
          onClick={() => setPage(page + 1)}
          type="button"
          {...stylex.props(
            styles.pageButton,
            pageData.length < pageSize && styles.pageButtonDisabled
          )}
        >
          Next
        </button>
      </div>

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
    </>
  );
};

interface AddStaffDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const AddStaffDialog = ({
  isOpen,
  onClose,
  onCreated,
}: AddStaffDialogProps) => {
  const [values, setValues] = useState<StaffFormValues>(emptyStaffFormValues);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const createStaff = useMutation(
    orpc.staff.createStaff.mutationOptions({
      onSuccess: () => {
        setValues(emptyStaffFormValues);
        onCreated();
        onClose();
      },
    })
  );

  useEffect(() => {
    if (isOpen && dialogRef.current) {
      dialogRef.current.showModal();
    } else if (!isOpen && dialogRef.current) {
      dialogRef.current.close();
    }
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      {...stylex.props(styles.dialog)}
      onCancel={() => onClose()}
    >
      <Panel>
        <PanelHead eyebrow="ADMIN" title="Add staff" />
        <div {...stylex.props(styles.dialogInner)}>
          <StaffForm onChange={setValues} values={values} />
          <div {...stylex.props(styles.dialogFooter)}>
            <CmsButton onClick={onClose} tone="quiet">
              Cancel
            </CmsButton>
            <CmsButton
              disabled={values.name.trim().length === 0}
              onClick={async () => {
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
              tone="primary"
            >
              Add
            </CmsButton>
          </div>
        </div>
      </Panel>
    </dialog>
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

interface EditStaffDialogProps {
  staff: EditableStaff | null;
  onClose: () => void;
  onUpdated: () => void;
}

const EditStaffDialog = ({
  staff,
  onClose,
  onUpdated,
}: EditStaffDialogProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (staff && dialogRef.current) {
      dialogRef.current.showModal();
    } else if (!staff && dialogRef.current) {
      dialogRef.current.close();
    }
  }, [staff]);

  return (
    <dialog
      ref={dialogRef}
      {...stylex.props(styles.dialog)}
      onCancel={() => onClose()}
    >
      {staff && (
        <EditStaffForm
          key={staff.id}
          onClose={onClose}
          onUpdated={onUpdated}
          staff={staff}
        />
      )}
    </dialog>
  );
};

interface EditStaffFormProps {
  staff: EditableStaff;
  onClose: () => void;
  onUpdated: () => void;
}

const EditStaffForm = ({ staff, onClose, onUpdated }: EditStaffFormProps) => {
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
    <Panel>
      <PanelHead eyebrow="ADMIN" title="Edit staff" />
      <div {...stylex.props(styles.dialogInner)}>
        <StaffForm onChange={setValues} values={values} />
        <div {...stylex.props(styles.dialogFooter)}>
          <CmsButton onClick={onClose} tone="quiet">
            Cancel
          </CmsButton>
          <CmsButton
            disabled={values.name.trim().length === 0}
            onClick={async () => {
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
            tone="primary"
          >
            Save
          </CmsButton>
        </div>
      </div>
    </Panel>
  );
};
