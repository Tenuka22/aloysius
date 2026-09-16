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
import * as stylex from "@stylexjs/stylex";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";

import { orpc } from "@/utils/orpc";

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
    gridTemplateColumns:
      "minmax(0,1.2fr) minmax(0,1fr) minmax(0,1fr) 8rem 8rem 2.5rem",
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
  formField: {
    display: "flex",
    flexDirection: "column",
    gap: space["3xs"],
  },
  formLabel: {
    fontSize: font.size2xs,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingWide,
    textTransform: "uppercase",
    color: color.onSurfaceMuted,
  },
  formInput: {
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

export const Route = createFileRoute("/student-officer/students")({
  loader: ({ context }) => {
    context.queryClient.prefetchQuery(orpc.marking.listStudents.queryOptions());
  },
  component: () => (
    <div {...stylex.props(styles.wrap)}>
      <Suspense fallback="Loading students…">
        <StudentsPage />
      </Suspense>
    </div>
  ),
});

const StudentsPage = () => {
  const { data } = useSuspenseQuery(orpc.marking.listStudents.queryOptions());
  type StudentRow = (typeof data)[number];
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentRow | null>(null);
  const pageSize = 10;

  const deleteStudent = useMutation(
    orpc.marking.deleteStudent.mutationOptions()
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q
      ? data.filter((row) =>
          [
            row.firstName,
            row.lastName,
            row.admissionNumber,
            row.phone,
            row.parentPhone,
          ].some((value) => value?.toLowerCase().includes(q))
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
            placeholder="Search by name, admission number, phone…"
            type="text"
            value={query}
          />
        </div>
        <CmsButton onClick={() => setIsAddOpen(true)} tone="primary">
          Add student
        </CmsButton>
      </div>

      <div {...stylex.props(styles.table)}>
        <div {...stylex.props(styles.headerRow)}>
          <div {...stylex.props(styles.headerCell)}>Admission No.</div>
          <div {...stylex.props(styles.headerCell)}>First Name</div>
          <div {...stylex.props(styles.headerCell)}>Last Name</div>
          <div {...stylex.props(styles.headerCell)}>Phone</div>
          <div {...stylex.props(styles.headerCell)}>Parent Phone</div>
          <div aria-hidden="true" />
        </div>

        <ul {...stylex.props(styles.list)}>
          {pageData.map((row) => (
            <li key={row.id} {...stylex.props(styles.row)}>
              <div {...stylex.props(styles.cell)}>
                <span {...stylex.props(styles.cellLabel)}>Admission No.</span>
                <span {...stylex.props(styles.cellContent)}>
                  {row.admissionNumber}
                </span>
              </div>
              <div {...stylex.props(styles.cell)}>
                <span {...stylex.props(styles.cellLabel)}>First Name</span>
                <span {...stylex.props(styles.cellContent)}>
                  {row.firstName}
                </span>
              </div>
              <div {...stylex.props(styles.cell)}>
                <span {...stylex.props(styles.cellLabel)}>Last Name</span>
                <span {...stylex.props(styles.cellContent)}>
                  {row.lastName}
                </span>
              </div>
              <div {...stylex.props(styles.cell)}>
                <span {...stylex.props(styles.cellLabel)}>Phone</span>
                <span {...stylex.props(styles.cellContent)}>
                  {row.phone || "—"}
                </span>
              </div>
              <div {...stylex.props(styles.cell)}>
                <span {...stylex.props(styles.cellLabel)}>Parent Phone</span>
                <span {...stylex.props(styles.cellContent)}>
                  {row.parentPhone || "—"}
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
                      onClick={() => setEditingStudent(row)}
                      type="button"
                      {...stylex.props(styles.menuItem)}
                    >
                      Edit
                    </button>
                    <button
                      onClick={async () => {
                        await deleteStudent.mutateAsync({
                          id: row.id,
                        });
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

      <AddStudentDialog
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onCreated={() => setIsAddOpen(false)}
      />

      <EditStudentDialog
        onClose={() => setEditingStudent(null)}
        onUpdated={() => setEditingStudent(null)}
        student={editingStudent}
      />
    </>
  );
};

interface AddStudentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const AddStudentDialog = ({
  isOpen,
  onClose,
  onCreated,
}: AddStudentDialogProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [admissionNumber, setAdmissionNumber] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [phone, setPhone] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [admissionYear, setAdmissionYear] = useState("");

  const createStudent = useMutation(
    orpc.marking.createStudent.mutationOptions({
      onSuccess: () => {
        setAdmissionNumber("");
        setFirstName("");
        setLastName("");
        setDateOfBirth("");
        setGender("");
        setPhone("");
        setParentPhone("");
        setAdmissionYear("");
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
        <PanelHead eyebrow="STUDENT OFFICER" title="Add student" />
        <div {...stylex.props(styles.dialogInner)}>
          <div {...stylex.props(styles.formField)}>
            <label htmlFor="add-admission" {...stylex.props(styles.formLabel)}>
              Admission Number
            </label>
            <input
              id="add-admission"
              {...stylex.props(styles.formInput)}
              onChange={(e) => setAdmissionNumber(e.target.value)}
              value={admissionNumber}
            />
          </div>
          <div {...stylex.props(styles.formField)}>
            <label htmlFor="add-first-name" {...stylex.props(styles.formLabel)}>
              First Name
            </label>
            <input
              id="add-first-name"
              {...stylex.props(styles.formInput)}
              onChange={(e) => setFirstName(e.target.value)}
              value={firstName}
            />
          </div>
          <div {...stylex.props(styles.formField)}>
            <label htmlFor="add-last-name" {...stylex.props(styles.formLabel)}>
              Last Name
            </label>
            <input
              id="add-last-name"
              {...stylex.props(styles.formInput)}
              onChange={(e) => setLastName(e.target.value)}
              value={lastName}
            />
          </div>
          <div {...stylex.props(styles.formField)}>
            <label htmlFor="add-dob" {...stylex.props(styles.formLabel)}>
              Date of Birth
            </label>
            <input
              id="add-dob"
              type="date"
              {...stylex.props(styles.formInput)}
              onChange={(e) => setDateOfBirth(e.target.value)}
              value={dateOfBirth}
            />
          </div>
          <div {...stylex.props(styles.formField)}>
            <label htmlFor="add-gender" {...stylex.props(styles.formLabel)}>
              Gender
            </label>
            <select
              id="add-gender"
              {...stylex.props(styles.formInput)}
              onChange={(e) => setGender(e.target.value)}
              value={gender}
            >
              <option value="">Select...</option>
              <option value="M">Male</option>
              <option value="F">Female</option>
            </select>
          </div>
          <div {...stylex.props(styles.formField)}>
            <label htmlFor="add-phone" {...stylex.props(styles.formLabel)}>
              Phone
            </label>
            <input
              id="add-phone"
              {...stylex.props(styles.formInput)}
              onChange={(e) => setPhone(e.target.value)}
              value={phone}
            />
          </div>
          <div {...stylex.props(styles.formField)}>
            <label
              htmlFor="add-parent-phone"
              {...stylex.props(styles.formLabel)}
            >
              Parent Phone
            </label>
            <input
              id="add-parent-phone"
              {...stylex.props(styles.formInput)}
              onChange={(e) => setParentPhone(e.target.value)}
              value={parentPhone}
            />
          </div>
          <div {...stylex.props(styles.formField)}>
            <label
              htmlFor="add-admission-year"
              {...stylex.props(styles.formLabel)}
            >
              Admission Year
            </label>
            <input
              id="add-admission-year"
              type="number"
              {...stylex.props(styles.formInput)}
              onChange={(e) => setAdmissionYear(e.target.value)}
              value={admissionYear}
            />
          </div>
          <div {...stylex.props(styles.dialogFooter)}>
            <CmsButton onClick={onClose} tone="quiet">
              Cancel
            </CmsButton>
            <CmsButton
              disabled={
                admissionNumber.trim().length === 0 ||
                firstName.trim().length === 0 ||
                lastName.trim().length === 0
              }
              onClick={async () => {
                await createStudent.mutateAsync({
                  admissionNumber,
                  firstName,
                  lastName,
                  dateOfBirth: dateOfBirth || undefined,
                  gender: gender || undefined,
                  phone: phone || undefined,
                  parentPhone: parentPhone || undefined,
                  admissionYear: admissionYear
                    ? Number(admissionYear)
                    : undefined,
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

interface EditableStudent {
  id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  parentPhone: string | null;
}

interface EditStudentDialogProps {
  student: EditableStudent | null;
  onClose: () => void;
  onUpdated: () => void;
}

const EditStudentDialog = ({
  student,
  onClose,
  onUpdated,
}: EditStudentDialogProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (student && dialogRef.current) {
      dialogRef.current.showModal();
    } else if (!student && dialogRef.current) {
      dialogRef.current.close();
    }
  }, [student]);

  return (
    <dialog
      ref={dialogRef}
      {...stylex.props(styles.dialog)}
      onCancel={() => onClose()}
    >
      {student && (
        <EditStudentForm
          key={student.id}
          onClose={onClose}
          onUpdated={onUpdated}
          student={student}
        />
      )}
    </dialog>
  );
};

interface EditStudentFormProps {
  student: EditableStudent;
  onClose: () => void;
  onUpdated: () => void;
}

const EditStudentForm = ({
  student,
  onClose,
  onUpdated,
}: EditStudentFormProps) => {
  const [admissionNumber, setAdmissionNumber] = useState(
    student.admissionNumber
  );
  const [firstName, setFirstName] = useState(student.firstName);
  const [lastName, setLastName] = useState(student.lastName);
  const [phone, setPhone] = useState(student.phone ?? "");
  const [parentPhone, setParentPhone] = useState(student.parentPhone ?? "");

  const updateStudent = useMutation(
    orpc.marking.updateStudent.mutationOptions({
      onSuccess: () => {
        onUpdated();
        onClose();
      },
    })
  );

  return (
    <Panel>
      <PanelHead eyebrow="STUDENT OFFICER" title="Edit student" />
      <div {...stylex.props(styles.dialogInner)}>
        <div {...stylex.props(styles.formField)}>
          <label htmlFor="edit-admission" {...stylex.props(styles.formLabel)}>
            Admission Number
          </label>
          <input
            id="edit-admission"
            {...stylex.props(styles.formInput)}
            onChange={(e) => setAdmissionNumber(e.target.value)}
            value={admissionNumber}
          />
        </div>
        <div {...stylex.props(styles.formField)}>
          <label htmlFor="edit-first-name" {...stylex.props(styles.formLabel)}>
            First Name
          </label>
          <input
            id="edit-first-name"
            {...stylex.props(styles.formInput)}
            onChange={(e) => setFirstName(e.target.value)}
            value={firstName}
          />
        </div>
        <div {...stylex.props(styles.formField)}>
          <label htmlFor="edit-last-name" {...stylex.props(styles.formLabel)}>
            Last Name
          </label>
          <input
            id="edit-last-name"
            {...stylex.props(styles.formInput)}
            onChange={(e) => setLastName(e.target.value)}
            value={lastName}
          />
        </div>
        <div {...stylex.props(styles.formField)}>
          <label htmlFor="edit-phone" {...stylex.props(styles.formLabel)}>
            Phone
          </label>
          <input
            id="edit-phone"
            {...stylex.props(styles.formInput)}
            onChange={(e) => setPhone(e.target.value)}
            value={phone}
          />
        </div>
        <div {...stylex.props(styles.formField)}>
          <label
            htmlFor="edit-parent-phone"
            {...stylex.props(styles.formLabel)}
          >
            Parent Phone
          </label>
          <input
            id="edit-parent-phone"
            {...stylex.props(styles.formInput)}
            onChange={(e) => setParentPhone(e.target.value)}
            value={parentPhone}
          />
        </div>
        <div {...stylex.props(styles.dialogFooter)}>
          <CmsButton onClick={onClose} tone="quiet">
            Cancel
          </CmsButton>
          <CmsButton
            disabled={
              admissionNumber.trim().length === 0 ||
              firstName.trim().length === 0 ||
              lastName.trim().length === 0
            }
            onClick={async () => {
              await updateStudent.mutateAsync({
                id: student.id,
                admissionNumber,
                firstName,
                lastName,
                phone: phone || undefined,
                parentPhone: parentPhone || undefined,
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
