import {
  CmsButton,
  Field,
  FieldGrid,
  Panel,
  PanelHead,
  RecordList,
  RecordRow,
} from "@aloysius/ui/components/cms/cms-primitives";
import {
  ScreenHead,
  ScreenWrap,
} from "@aloysius/ui/components/cms/screen-head";
import { FormDialog } from "@aloysius/ui/components/dialog";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense, useReducer, useRef, useState } from "react";

import { mutationErrorText } from "@/components/mutation-error";
import { orpc } from "@/utils/orpc";

/**
 * `/cms/contact-departments` - the "Reach the right office" directory on
 * `/contact`, and the department emails the enquiry form routes messages to.
 *
 * `id` doubles as the department's slug: `CONTACT_TOPICS` in
 * `packages/ui/src/content/contact.ts` hardcodes `departmentId` values
 * (`admissions`, `academic`, `oba`, `media`) that join against this table's
 * `id` to decide where a topic's enquiry is sent, so it uses the same
 * slug-regex convention as `cms/clubs.tsx`'s slug field. It is editable on
 * create and locked on edit - changing it later would silently break that
 * routing with no error anywhere.
 */

interface DepartmentFormState {
  id: string;
  name: string;
  description: string;
  telephone: string;
  email: string;
  sortOrder: string;
}

const EMPTY_DEPARTMENT: DepartmentFormState = {
  id: "",
  name: "",
  description: "",
  telephone: "",
  email: "",
  sortOrder: "",
};

const blankOrNull = (value: string) => value.trim() || null;

/** A row being edited; `id` is immutable once a row exists. */
interface EditingDepartment extends DepartmentFormState {
  id: string;
}

interface DepartmentDialogProps {
  editing: EditingDepartment | null;
  onClose: () => void;
  onSaved: () => void;
  open: boolean;
}

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const SLUG_HINT = "Lowercase words separated by single hyphens.";
const SLUG_HINT_LOCKED =
  "Locked: topics in the enquiry form route to departments by this id, so changing it would silently break routing.";

const DepartmentDialog = ({
  editing,
  onClose,
  onSaved,
  open,
}: DepartmentDialogProps) => {
  const [form, patch] = useReducer(
    (
      state: DepartmentFormState,
      statePatch: Partial<DepartmentFormState>
    ): DepartmentFormState => ({
      ...state,
      ...statePatch,
    }),
    editing ?? EMPTY_DEPARTMENT
  );

  const create = useMutation(
    orpc.cms.createContactDepartment.mutationOptions({
      onSuccess: () => {
        onSaved();
        onClose();
      },
    })
  );
  const update = useMutation(
    orpc.cms.updateContactDepartment.mutationOptions({
      onSuccess: () => {
        onSaved();
        onClose();
      },
    })
  );

  const busy = create.isPending || update.isPending;
  const idValid = SLUG_PATTERN.test(form.id);
  const sortOrderValid =
    form.sortOrder.trim() === "" || /^-?\d+$/u.test(form.sortOrder.trim());
  const canSubmit =
    form.name.trim().length > 0 && idValid && sortOrderValid && !busy;

  const handleSubmit = () => {
    if (!canSubmit) {
      return;
    }
    const payload = {
      name: form.name.trim(),
      description: blankOrNull(form.description),
      telephone: blankOrNull(form.telephone),
      email: blankOrNull(form.email),
      sortOrder:
        form.sortOrder.trim() === ""
          ? null
          : Math.trunc(Number(form.sortOrder)),
    };
    if (editing) {
      update.mutate({ id: editing.id, ...payload });
    } else {
      create.mutate({ id: form.id, ...payload });
    }
  };

  return (
    <FormDialog
      busy={busy}
      description="Shown in the Contact page directory. A department with an email address is also where the matching enquiry topic's messages are sent."
      error={mutationErrorText(
        editing ? update.error : create.error,
        "The department could not be saved."
      )}
      onClose={onClose}
      onSubmit={handleSubmit}
      open={open}
      submitDisabled={!canSubmit}
      submitLabel={editing ? "Save changes" : "Add department"}
      title={editing ? "Edit department" : "New department"}
    >
      <FieldGrid>
        <Field
          hint={editing ? SLUG_HINT_LOCKED : SLUG_HINT}
          kind={editing ? "readonly" : "text"}
          label="Id / slug"
          onChange={(next) => patch({ id: next })}
          value={form.id}
        />
        <Field
          kind="text"
          label="Name"
          onChange={(next) => patch({ name: next })}
          value={form.name}
        />
        <Field
          kind="textarea"
          label="Description"
          onChange={(next) => patch({ description: next })}
          value={form.description}
          wide
        />
        <Field
          kind="text"
          label="Telephone"
          onChange={(next) => patch({ telephone: next })}
          value={form.telephone}
        />
        <Field
          kind="email"
          label="Email"
          onChange={(next) => patch({ email: next })}
          value={form.email}
        />
        <Field
          hint="Lower numbers list first. Leave blank to sort by name."
          kind="text"
          label="Order"
          onChange={(next) => patch({ sortOrder: next })}
          value={form.sortOrder}
        />
      </FieldGrid>
    </FormDialog>
  );
};

const ContactDepartmentsContent = () => {
  const queryClient = useQueryClient();
  const listQuery = orpc.cms.listContactDepartments.queryOptions();
  const { data: departments } = useSuspenseQuery(listQuery);
  const [dialog, setDialog] = useState<{
    editing: EditingDepartment | null;
    open: boolean;
    token: number;
  }>({ editing: null, open: false, token: 0 });
  const openToken = useRef(0);

  const remove = useMutation(
    orpc.cms.deleteContactDepartment.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries(listQuery),
    })
  );

  return (
    <>
      <ScreenHead
        eyebrow="Content"
        heading="Contact Departments"
        note="The 'Reach the right office' directory on the Contact page. A department's email address is also where its matching enquiry topic's messages are sent."
      />
      <Panel>
        <PanelHead
          action={
            <CmsButton
              onClick={() =>
                setDialog({
                  editing: null,
                  open: true,
                  token: (openToken.current += 1),
                })
              }
              tone="primary"
            >
              Add department
            </CmsButton>
          }
          title="Departments"
        />
        {departments.length === 0 ? (
          <p>
            No departments yet. The Contact page directory shows nothing until
            the first one is added.
          </p>
        ) : (
          <RecordList label="Departments">
            {departments.map((department) => (
              <RecordRow
                actions={
                  <>
                    <CmsButton
                      onClick={() =>
                        setDialog({
                          editing: {
                            id: department.id,
                            name: department.name,
                            description: department.description ?? "",
                            telephone: department.telephone ?? "",
                            email: department.email ?? "",
                            sortOrder:
                              department.sortOrder === null
                                ? ""
                                : String(department.sortOrder),
                          },
                          open: true,
                          token: (openToken.current += 1),
                        })
                      }
                      tone="quiet"
                    >
                      Edit
                    </CmsButton>
                    <CmsButton
                      disabled={remove.isPending}
                      onClick={() => remove.mutate({ id: department.id })}
                      tone="danger"
                    >
                      Remove
                    </CmsButton>
                  </>
                }
                key={department.id}
                meta={
                  department.email ??
                  department.telephone ??
                  department.description ??
                  "No contact details yet"
                }
                name={department.name}
              />
            ))}
          </RecordList>
        )}
      </Panel>
      <DepartmentDialog
        editing={dialog.editing}
        key={dialog.token}
        onClose={() => setDialog((current) => ({ ...current, open: false }))}
        onSaved={() => queryClient.invalidateQueries(listQuery)}
        open={dialog.open}
      />
    </>
  );
};

export const Route = createFileRoute("/cms/contact-departments")({
  head: () => ({
    meta: [
      { title: "Contact Departments — St. Aloysius' College" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: () => (
    <ScreenWrap>
      <Suspense fallback={<div>Loading…</div>}>
        <ContactDepartmentsContent />
      </Suspense>
    </ScreenWrap>
  ),
});
