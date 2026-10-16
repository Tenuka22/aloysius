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
 * `/cms/alumni-branches` - the branch directory on the `/alumni` page
 * ("Galle (Main Branch)", "Colombo Branch", "Overseas Branches"). Replaces
 * `ALUMNI_BRANCH_CARDS`, a fixed three-row array that could hold a `contact`
 * and `href` per row but never had either set.
 */

interface BranchFormState {
  name: string;
  contact: string;
  href: string;
  sortOrder: string;
}

const EMPTY_BRANCH: BranchFormState = {
  name: "",
  contact: "",
  href: "",
  sortOrder: "0",
};

/** A row being edited, with the id the mutation needs. */
interface EditingBranch extends BranchFormState {
  id: string;
}

interface BranchDialogProps {
  editing: EditingBranch | null;
  onClose: () => void;
  onSaved: () => void;
  open: boolean;
}

const BranchDialog = ({
  editing,
  onClose,
  onSaved,
  open,
}: BranchDialogProps) => {
  const [form, patch] = useReducer(
    (
      state: BranchFormState,
      statePatch: Partial<BranchFormState>
    ): BranchFormState => ({
      ...state,
      ...statePatch,
    }),
    editing ?? EMPTY_BRANCH
  );

  const create = useMutation(
    orpc.cms.createAlumniBranch.mutationOptions({
      onSuccess: () => {
        onSaved();
        onClose();
      },
    })
  );
  const update = useMutation(
    orpc.cms.updateAlumniBranch.mutationOptions({
      onSuccess: () => {
        onSaved();
        onClose();
      },
    })
  );

  const busy = create.isPending || update.isPending;
  const canSubmit = form.name.trim().length > 0 && !busy;

  const payload = {
    name: form.name.trim(),
    contact: form.contact.trim() || null,
    href: form.href.trim() || null,
    sortOrder: Math.trunc(Number(form.sortOrder)) || 0,
  };

  return (
    <FormDialog
      busy={busy}
      description="Live on the alumni page's branch directory the moment it is saved."
      error={mutationErrorText(
        editing ? update.error : create.error,
        "The branch could not be saved."
      )}
      onClose={onClose}
      onSubmit={() => {
        if (editing) {
          update.mutate({ id: editing.id, ...payload });
        } else {
          create.mutate(payload);
        }
      }}
      open={open}
      submitDisabled={!canSubmit}
      submitLabel={editing ? "Save changes" : "Publish"}
      title={editing ? "Edit branch" : "Add branch"}
    >
      <FieldGrid>
        <Field
          kind="text"
          label="Name"
          onChange={(next) => patch({ name: next })}
          value={form.name}
        />
        <Field
          hint="Phone, email or address shown under the branch name."
          kind="text"
          label="Contact"
          onChange={(next) => patch({ contact: next })}
          value={form.contact}
        />
        <Field
          hint="Adds a 'Branch Details' link when set."
          kind="url"
          label="Link"
          onChange={(next) => patch({ href: next })}
          value={form.href}
        />
        <Field
          hint="Lower numbers display first."
          kind="text"
          label="Order"
          onChange={(next) => patch({ sortOrder: next })}
          value={form.sortOrder}
        />
      </FieldGrid>
    </FormDialog>
  );
};

const AlumniBranchesContent = () => {
  const queryClient = useQueryClient();
  const listQuery = orpc.cms.listAlumniBranches.queryOptions();
  const { data: branches } = useSuspenseQuery(listQuery);
  const [dialog, setDialog] = useState<{
    editing: EditingBranch | null;
    open: boolean;
    token: number;
  }>({ editing: null, open: false, token: 0 });
  const openToken = useRef(0);

  const remove = useMutation(
    orpc.cms.deleteAlumniBranch.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries(listQuery),
    })
  );

  return (
    <>
      <ScreenHead
        eyebrow="Content"
        heading="Alumni Branches"
        note="The OBA branch directory shown on the alumni page - Galle, Colombo, overseas, or any others the Association adds."
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
              Add branch
            </CmsButton>
          }
          title="Branches"
        />
        {branches.length === 0 ? (
          <p>
            Nothing published yet. The alumni page hides its branch directory
            until the first branch is added.
          </p>
        ) : (
          <RecordList label="Branches">
            {branches.map((branch) => (
              <RecordRow
                actions={
                  <>
                    <CmsButton
                      onClick={() =>
                        setDialog({
                          editing: {
                            contact: branch.contact ?? "",
                            href: branch.href ?? "",
                            id: branch.id,
                            name: branch.name,
                            sortOrder: String(branch.sortOrder),
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
                      onClick={() => remove.mutate({ id: branch.id })}
                      tone="danger"
                    >
                      Remove
                    </CmsButton>
                  </>
                }
                key={branch.id}
                meta={branch.contact ?? undefined}
                name={branch.name}
              />
            ))}
          </RecordList>
        )}
      </Panel>
      <BranchDialog
        editing={dialog.editing}
        key={dialog.token}
        onClose={() => setDialog((current) => ({ ...current, open: false }))}
        onSaved={() => queryClient.invalidateQueries(listQuery)}
        open={dialog.open}
      />
    </>
  );
};

export const Route = createFileRoute("/cms/alumni-branches")({
  head: () => ({
    meta: [
      { title: "Alumni Branches — St. Aloysius' College" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: () => (
    <ScreenWrap>
      <Suspense fallback={<div>Loading…</div>}>
        <AlumniBranchesContent />
      </Suspense>
    </ScreenWrap>
  ),
});
