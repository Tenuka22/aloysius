import {
  CmsButton,
  Field,
  FieldGrid,
  Panel,
  PanelHead,
  Pill,
  RecordList,
  RecordRow,
} from "@aloysius/ui/components/cms/cms-primitives";
import { FileUploader } from "@aloysius/ui/components/cms/file-uploader";
import {
  ScreenHead,
  ScreenWrap,
} from "@aloysius/ui/components/cms/screen-head";
import { FormDialog } from "@aloysius/ui/components/dialog";
import { ACHIEVEMENT_CATEGORIES } from "@aloysius/ui/content/home";
import type { AchievementCategory } from "@aloysius/ui/content/home";
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
 * `/cms/achievements` - the "National Science Olympiad", "U19 rugby
 * champions" cards on the homepage achievements section.
 *
 * The category options mirror `ACHIEVEMENT_CATEGORIES` from
 * `@aloysius/ui/content/home`, minus `"All"` - that entry is the public
 * section's own "show everything" filter pill, not a category a row can hold.
 */

const CATEGORY_OPTIONS: { label: string; value: AchievementCategory }[] = [];
for (const category of ACHIEVEMENT_CATEGORIES) {
  if (category !== "All") {
    CATEGORY_OPTIONS.push({ label: category, value: category });
  }
}

const DEFAULT_CATEGORY: AchievementCategory =
  CATEGORY_OPTIONS[0]?.value ?? "Academic";

const EXCERPT_LENGTH = 120;

interface AchievementFormState {
  title: string;
  category: AchievementCategory;
  detail: string;
  imageId: string | null;
  imagePreviewUrl: string | null;
}

const EMPTY_ACHIEVEMENT: AchievementFormState = {
  title: "",
  category: DEFAULT_CATEGORY,
  detail: "",
  imageId: null,
  imagePreviewUrl: null,
};

/** A row being edited, with the id the mutation needs. */
interface EditingAchievement extends AchievementFormState {
  id: string;
}

interface AchievementDialogProps {
  editing: EditingAchievement | null;
  onClose: () => void;
  onSaved: () => void;
  open: boolean;
}

const AchievementDialog = ({
  editing,
  onClose,
  onSaved,
  open,
}: AchievementDialogProps) => {
  const [form, patch] = useReducer(
    (
      state: AchievementFormState,
      statePatch: Partial<AchievementFormState>
    ): AchievementFormState => ({
      ...state,
      ...statePatch,
    }),
    editing ?? EMPTY_ACHIEVEMENT
  );

  const create = useMutation(
    orpc.cms.createAchievement.mutationOptions({
      onSuccess: () => {
        onSaved();
        onClose();
      },
    })
  );
  const update = useMutation(
    orpc.cms.updateAchievement.mutationOptions({
      onSuccess: () => {
        onSaved();
        onClose();
      },
    })
  );

  const busy = create.isPending || update.isPending;
  const canSubmit =
    form.title.trim().length > 0 &&
    form.detail.trim().length > 0 &&
    form.category.trim().length > 0 &&
    !busy;

  const payload = {
    category: form.category,
    detail: form.detail.trim(),
    imageId: form.imageId,
    title: form.title.trim(),
  };

  return (
    <FormDialog
      busy={busy}
      description="Live on the homepage the moment it is saved — these are published by the College's office, so there is no review queue."
      error={mutationErrorText(
        editing ? update.error : create.error,
        "The achievement could not be saved."
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
      title={editing ? "Edit achievement" : "Add achievement"}
    >
      <FieldGrid>
        <Field
          kind="text"
          label="Title"
          onChange={(next) => patch({ title: next })}
          value={form.title}
        />
        <Field
          kind="select"
          label="Category"
          onChange={(next) => patch({ category: next as AchievementCategory })}
          options={CATEGORY_OPTIONS}
          value={form.category}
        />
        <Field
          kind="textarea"
          label="Detail"
          onChange={(next) => patch({ detail: next })}
          value={form.detail}
          wide
        />
        <FileUploader
          clearable
          label="Photo"
          onChange={(next) => patch({ imageId: next, imagePreviewUrl: null })}
          onUpload={uploadImageFile}
          previewUrl={form.imagePreviewUrl}
          ratioKey="achievementCard"
          value={form.imageId}
          wide
        />
      </FieldGrid>
    </FormDialog>
  );
};

const AchievementsContent = () => {
  const queryClient = useQueryClient();
  const listQuery = orpc.cms.listAchievements.queryOptions();
  const { data: achievements } = useSuspenseQuery(listQuery);
  const [dialog, setDialog] = useState<{
    editing: EditingAchievement | null;
    open: boolean;
    token: number;
  }>({ editing: null, open: false, token: 0 });
  const openToken = useRef(0);

  const remove = useMutation(
    orpc.cms.deleteAchievement.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries(listQuery),
    })
  );

  return (
    <>
      <ScreenHead
        eyebrow="Content"
        heading="Achievements"
        note="Academic, sporting and other achievements shown in the homepage achievements section, filterable there by category."
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
              Add achievement
            </CmsButton>
          }
          title="Achievements"
        />
        {achievements.length === 0 ? (
          <p>
            Nothing published yet. The homepage shows nothing in this section
            until the first achievement is added.
          </p>
        ) : (
          <RecordList label="Achievements">
            {achievements.map((achievement) => (
              <RecordRow
                actions={
                  <>
                    <Pill tone="neutral">{achievement.category}</Pill>
                    <CmsButton
                      onClick={() =>
                        setDialog({
                          editing: {
                            category:
                              achievement.category as AchievementCategory,
                            detail: achievement.detail,
                            id: achievement.id,
                            imageId: achievement.imageId,
                            imagePreviewUrl: achievement.imageUrl,
                            title: achievement.title,
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
                      onClick={() => remove.mutate({ id: achievement.id })}
                      tone="danger"
                    >
                      Remove
                    </CmsButton>
                  </>
                }
                key={achievement.id}
                meta={
                  achievement.detail.length > EXCERPT_LENGTH
                    ? `${achievement.detail.slice(0, EXCERPT_LENGTH).trimEnd()}…`
                    : achievement.detail
                }
                name={achievement.title}
              />
            ))}
          </RecordList>
        )}
      </Panel>
      <AchievementDialog
        editing={dialog.editing}
        key={dialog.token}
        onClose={() => setDialog((current) => ({ ...current, open: false }))}
        onSaved={() => queryClient.invalidateQueries(listQuery)}
        open={dialog.open}
      />
    </>
  );
};

export const Route = createFileRoute("/cms/achievements")({
  head: () => ({
    meta: [
      { title: "Achievements — St. Aloysius' College" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: () => (
    <ScreenWrap>
      <Suspense fallback={<div>Loading…</div>}>
        <AchievementsContent />
      </Suspense>
    </ScreenWrap>
  ),
});
