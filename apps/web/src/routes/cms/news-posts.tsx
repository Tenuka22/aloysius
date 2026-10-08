import {
  CmsButton,
  Field,
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
import { useReducer, useRef, useState } from "react";

import { uploadImageFile } from "@/components/club/upload";
import { mutationErrorText } from "@/components/mutation-error";
import { orpc } from "@/utils/orpc";

type Category = "academic" | "sports" | "arts" | "achievement" | "general";

interface NewsPostRow {
  id: string;
  title: string;
  summary: string | null;
  body: string;
  category: Category | null;
  coverImageId: string | null;
  coverImageUrl: string | null;
  publishedAt: string | null;
}

const CATEGORY_OPTIONS = [
  { label: "No category", value: "" },
  { label: "Academic", value: "academic" },
  { label: "Sports", value: "sports" },
  { label: "Arts", value: "arts" },
  { label: "Achievement", value: "achievement" },
  { label: "General", value: "general" },
];

interface NewsPostFormState {
  title: string;
  summary: string;
  body: string;
  category: string;
  coverImageId: string | null;
  coverImagePreviewUrl: string | null;
}

const EMPTY_FORM_STATE: NewsPostFormState = {
  title: "",
  summary: "",
  body: "",
  category: "",
  coverImageId: null,
  coverImagePreviewUrl: null,
};

/** The dialog's initial state, read once per mount - the parent remounts the
 * dialog (via `key`) every time it opens, so this never needs to react to a
 * prop change after the fact. */
const formStateFromRow = (row: NewsPostRow | null): NewsPostFormState =>
  row
    ? {
        title: row.title,
        summary: row.summary ?? "",
        body: row.body,
        category: row.category ?? "",
        coverImageId: row.coverImageId,
        coverImagePreviewUrl: row.coverImageUrl,
      }
    : EMPTY_FORM_STATE;

interface FormAction {
  patch: Partial<NewsPostFormState>;
  type: "patch";
}

const formReducer = (
  state: NewsPostFormState,
  action: FormAction
): NewsPostFormState => ({ ...state, ...action.patch });

const NewsPostDialog = ({
  editing,
  onClose,
  onSaved,
  open,
}: {
  open: boolean;
  editing: NewsPostRow | null;
  onClose: () => void;
  onSaved: () => void;
}) => {
  const [form, dispatch] = useReducer(formReducer, editing, formStateFromRow);
  const patch = (next: Partial<NewsPostFormState>) =>
    dispatch({ patch: next, type: "patch" });

  const createMutation = useMutation(
    orpc.cms.createNewsPost.mutationOptions({
      onSuccess: () => {
        onSaved();
        onClose();
      },
    })
  );
  const updateMutation = useMutation(
    orpc.cms.updateNewsPost.mutationOptions({
      onSuccess: () => {
        onSaved();
        onClose();
      },
    })
  );

  const busy = createMutation.isPending || updateMutation.isPending;
  const canSubmit =
    form.title.trim().length > 0 && form.body.trim().length > 0 && !busy;

  const handleSubmit = () => {
    const payload = {
      title: form.title.trim(),
      summary: form.summary.trim() || null,
      body: form.body.trim(),
      category: form.category ? (form.category as Category) : null,
      coverImageId: form.coverImageId,
    };
    if (editing) {
      updateMutation.mutate({ id: editing.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <FormDialog
      busy={busy}
      description="Live on the public news page the instant it is saved — there is no review queue for CMS-direct content."
      error={mutationErrorText(
        editing ? updateMutation.error : createMutation.error,
        "The news post could not be saved."
      )}
      onClose={onClose}
      onSubmit={handleSubmit}
      open={open}
      submitDisabled={!canSubmit}
      submitLabel={editing ? "Save changes" : "Publish"}
      title={editing ? "Edit news post" : "New news post"}
    >
      <Field
        kind="text"
        label="Title"
        onChange={(next) => patch({ title: next })}
        value={form.title}
      />
      <Field
        kind="select"
        label="Category"
        onChange={(next) => patch({ category: next })}
        options={CATEGORY_OPTIONS}
        value={form.category}
      />
      <Field
        kind="text"
        label="Summary (optional)"
        onChange={(next) => patch({ summary: next })}
        value={form.summary}
      />
      <Field
        kind="textarea"
        label="Body"
        onChange={(next) => patch({ body: next })}
        value={form.body}
      />
      <FileUploader
        clearable
        label="Cover image (optional)"
        onChange={(next) => {
          patch({ coverImageId: next, coverImagePreviewUrl: null });
        }}
        onUpload={uploadImageFile}
        previewUrl={form.coverImagePreviewUrl}
        ratioKey="newsCard"
        value={form.coverImageId}
      />
    </FormDialog>
  );
};

const NewsPostsContent = () => {
  const queryClient = useQueryClient();
  const listQuery = orpc.cms.listNewsPosts.queryOptions();
  const { data: posts } = useSuspenseQuery(listQuery);
  const [dialog, setDialog] = useState<{
    open: boolean;
    editing: NewsPostRow | null;
    token: number;
  }>({ editing: null, open: false, token: 0 });
  const openToken = useRef(0);

  const deleteMutation = useMutation(
    orpc.cms.deleteNewsPost.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries(listQuery),
    })
  );

  return (
    <ScreenWrap>
      <ScreenHead
        eyebrow="Content"
        heading="News Articles"
        note="Published directly here — there is no review queue for this content type."
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
              Add news post
            </CmsButton>
          }
          title="News posts"
        />
        {posts.length === 0 ? (
          <p>No news posts yet.</p>
        ) : (
          <RecordList label="News posts">
            {posts.map((post) => (
              <RecordRow
                actions={
                  <>
                    <CmsButton
                      onClick={() =>
                        setDialog({
                          editing: post,
                          open: true,
                          token: (openToken.current += 1),
                        })
                      }
                      tone="quiet"
                    >
                      Edit
                    </CmsButton>
                    <CmsButton
                      disabled={deleteMutation.isPending}
                      onClick={() => deleteMutation.mutate({ id: post.id })}
                      tone="danger"
                    >
                      Delete
                    </CmsButton>
                  </>
                }
                key={post.id}
                meta={[post.category, post.summary].filter(Boolean).join(" · ")}
                name={post.title}
              />
            ))}
          </RecordList>
        )}
      </Panel>
      <NewsPostDialog
        editing={dialog.editing}
        key={dialog.token}
        onClose={() => setDialog((current) => ({ ...current, open: false }))}
        onSaved={() => queryClient.invalidateQueries(listQuery)}
        open={dialog.open}
      />
    </ScreenWrap>
  );
};

export const Route = createFileRoute("/cms/news-posts")({
  head: () => ({
    meta: [
      { title: "News Articles — St. Aloysius' College" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: NewsPostsContent,
});
