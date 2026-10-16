import {
  CmsButton,
  Field,
  FieldGrid,
  Panel,
  PanelHead,
  RecordList,
  RecordRow,
} from "@aloysius/ui/components/cms/cms-primitives";
import { FileUploader } from "@aloysius/ui/components/cms/file-uploader";
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

import { uploadImageFile } from "@/components/club/upload";
import { mutationErrorText } from "@/components/mutation-error";
import { orpc } from "@/utils/orpc";

/**
 * `/cms/academic-heads` - who leads each part of the College.
 *
 * A roster rather than a block editor because the number of heads is the
 * College's to decide. It used to be three fixed fields on the Academics page
 * (`primary-head-name`, `secondary-deputy-name`), which meant the Head of
 * Commerce could not be listed at all without a deploy, and the Principal was
 * stored twice - once here, once in the global Principal's Message block.
 *
 * Rows, not blocks: the Principal is not in this roster. Their message and
 * portrait are the global block at `/cms/principal`, shown on every page.
 */

interface HeadFormState {
  slug: string;
  name: string;
  role: string;
  bio: string;
  imageId: string | null;
  imagePreviewUrl: string | null;
}

const EMPTY_HEAD: HeadFormState = {
  slug: "",
  name: "",
  role: "",
  bio: "",
  imageId: null,
  imagePreviewUrl: null,
};

const blankOrNull = (value: string) => value.trim() || null;

const patchReducer =
  () =>
  (state: HeadFormState, patch: Partial<HeadFormState>): HeadFormState => ({
    ...state,
    ...patch,
  });

/** A row being edited, with the id the mutation needs. */
interface EditingHead extends HeadFormState {
  id: string;
}

interface HeadDialogProps {
  editing: EditingHead | null;
  onClose: () => void;
  onSaved: () => void;
  open: boolean;
}

const HeadDialog = ({ editing, onClose, onSaved, open }: HeadDialogProps) => {
  const [form, patch] = useReducer(patchReducer(), editing ?? EMPTY_HEAD);

  const create = useMutation(
    orpc.cms.createAcademicHead.mutationOptions({
      onSuccess: () => {
        onSaved();
        onClose();
      },
    })
  );
  const update = useMutation(
    orpc.cms.updateAcademicHead.mutationOptions({
      onSuccess: () => {
        onSaved();
        onClose();
      },
    })
  );

  const busy = create.isPending || update.isPending;
  const canSubmit =
    form.slug.trim().length > 0 && form.name.trim().length > 0 && !busy;

  const payload = {
    slug: form.slug.trim(),
    name: form.name.trim(),
    role: blankOrNull(form.role),
    bio: blankOrNull(form.bio),
    imageId: form.imageId,
  };

  return (
    <FormDialog
      busy={busy}
      description="Live on the About page the moment it is saved — these are published by the College's office, so there is no review queue."
      error={mutationErrorText(
        editing ? update.error : create.error,
        "The person could not be saved."
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
      title={editing ? "Edit person" : "Add person"}
    >
      <FieldGrid>
        <Field
          hint="Lowercase, dashes. A stable identifier the row keeps across renames."
          kind="text"
          label="Slug"
          onChange={(next) => patch({ slug: next })}
          value={form.slug}
        />
        <Field
          kind="text"
          label="Name"
          onChange={(next) => patch({ name: next })}
          value={form.name}
        />
        <Field
          hint='Shown above the name, e.g. "Head of Physics".'
          kind="text"
          label="Role"
          onChange={(next) => patch({ role: next })}
          value={form.role}
        />
        <Field
          kind="textarea"
          label="Short biography"
          onChange={(next) => patch({ bio: next })}
          value={form.bio}
          wide
        />
        <FileUploader
          clearable
          label="Portrait"
          onChange={(next) => patch({ imageId: next, imagePreviewUrl: null })}
          onUpload={uploadImageFile}
          previewUrl={form.imagePreviewUrl}
          ratioKey="principalPortrait"
          value={form.imageId}
          wide
        />
      </FieldGrid>
    </FormDialog>
  );
};

const AcademicHeadsContent = () => {
  const queryClient = useQueryClient();
  const listQuery = orpc.cms.listAcademicHeads.queryOptions();
  const { data: heads } = useSuspenseQuery(listQuery);
  const [dialog, setDialog] = useState<{
    editing: EditingHead | null;
    open: boolean;
    token: number;
  }>({ editing: null, open: false, token: 0 });
  const openToken = useRef(0);

  const remove = useMutation(
    orpc.cms.deleteAcademicHead.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries(listQuery),
    })
  );

  return (
    <>
      <ScreenHead
        eyebrow="People"
        heading="Academic Heads"
        note="Who leads each part of the College, shown under the Principal's message on the About page."
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
              Add person
            </CmsButton>
          }
          title="Heads of department"
        />
        {heads.length === 0 ? (
          <p>
            Nobody published yet. The About page shows nothing in this position
            until the first head is added.
          </p>
        ) : (
          <RecordList label="Academic heads">
            {heads.map((head) => (
              <RecordRow
                actions={
                  <>
                    <CmsButton
                      onClick={() =>
                        setDialog({
                          editing: {
                            bio: head.bio ?? "",
                            id: head.id,
                            imageId: head.imageId,
                            imagePreviewUrl: head.imageUrl,
                            name: head.name,
                            role: head.role ?? "",
                            slug: head.slug,
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
                      onClick={() => remove.mutate({ id: head.id })}
                      tone="danger"
                    >
                      Remove
                    </CmsButton>
                  </>
                }
                key={head.id}
                meta={[head.role, head.slug].filter(Boolean).join(" · ")}
                name={head.name}
              />
            ))}
          </RecordList>
        )}
      </Panel>
      <HeadDialog
        editing={dialog.editing}
        key={dialog.token}
        onClose={() => setDialog((current) => ({ ...current, open: false }))}
        onSaved={() => queryClient.invalidateQueries(listQuery)}
        open={dialog.open}
      />
    </>
  );
};

export const Route = createFileRoute("/cms/academic-heads")({
  head: () => ({
    meta: [
      { title: "Academic Heads — St. Aloysius' College" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: () => (
    <ScreenWrap>
      <Suspense fallback={<div>Loading…</div>}>
        <AcademicHeadsContent />
      </Suspense>
    </ScreenWrap>
  ),
});
