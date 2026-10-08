import {
  CmsButton,
  Field,
  Panel,
  PanelHead,
  Pill,
  RecordList,
  RecordRow,
} from "@aloysius/ui/components/cms/cms-primitives";
import type { PillTone } from "@aloysius/ui/components/cms/cms-primitives";
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
import { useState } from "react";

import { mutationErrorText } from "@/components/mutation-error";
import { orpc } from "@/utils/orpc";

const CLUB = "photography" as const;

const CATEGORIES = [
  { label: "Academic", value: "academic" },
  { label: "Sports", value: "sports" },
  { label: "Arts", value: "arts" },
  { label: "Achievement", value: "achievement" },
  { label: "General", value: "general" },
];

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending review",
  approved: "Approved — live on the news page",
  rejected: "Rejected",
};

const STATUS_TONE: Record<string, PillTone> = {
  pending: "warning",
  approved: "positive",
  rejected: "danger",
};

const AddNewsPostDialog = ({
  onClose,
  onSubmitted,
  open,
}: {
  open: boolean;
  onClose: () => void;
  onSubmitted: () => void;
}) => {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("general");

  const submitMutation = useMutation(
    orpc.club.submitNewsPost.mutationOptions({
      onSuccess: () => {
        setTitle("");
        setSummary("");
        setBody("");
        setCategory("general");
        onSubmitted();
        onClose();
      },
    })
  );

  const canSubmit =
    title.trim().length > 0 &&
    body.trim().length > 0 &&
    !submitMutation.isPending;

  return (
    <FormDialog
      busy={submitMutation.isPending}
      description="Reviewed by the CMS team before it appears on the public news page."
      error={mutationErrorText(
        submitMutation.error,
        "The news post could not be submitted."
      )}
      onClose={onClose}
      onSubmit={() =>
        submitMutation.mutate({
          club: CLUB,
          title: title.trim(),
          summary: summary.trim() || undefined,
          body: body.trim(),
          category: category as
            | "academic"
            | "sports"
            | "arts"
            | "achievement"
            | "general",
        })
      }
      open={open}
      submitDisabled={!canSubmit}
      submitLabel="Submit for review"
      title="New news post"
    >
      <Field kind="text" label="Title" onChange={setTitle} value={title} />
      <Field
        kind="select"
        label="Category"
        onChange={setCategory}
        options={CATEGORIES}
        value={category}
      />
      <Field
        kind="text"
        label="Summary (optional)"
        onChange={setSummary}
        value={summary}
      />
      <Field kind="textarea" label="Body" onChange={setBody} value={body} />
    </FormDialog>
  );
};

const MyNewsPosts = ({ onAdd }: { onAdd: () => void }) => {
  const queryClient = useQueryClient();
  const myNewsQuery = orpc.club.listMyNewsPosts.queryOptions();
  const { data: posts } = useSuspenseQuery(myNewsQuery);

  const withdrawMutation = useMutation(
    orpc.club.withdrawNewsPost.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(myNewsQuery);
      },
    })
  );

  return (
    <Panel>
      <PanelHead
        action={
          <CmsButton onClick={onAdd} tone="primary">
            New news post
          </CmsButton>
        }
        title="Your news posts"
      />
      {posts.length === 0 ? (
        <p>No submissions yet.</p>
      ) : (
        <RecordList label="Your news submissions">
          {posts.map((post) => (
            <RecordRow
              actions={
                <>
                  <Pill tone={STATUS_TONE[post.status] ?? "neutral"}>
                    {STATUS_LABEL[post.status] ?? post.status}
                  </Pill>
                  {post.status === "pending" && (
                    <CmsButton
                      onClick={() => withdrawMutation.mutate({ id: post.id })}
                      tone="danger"
                    >
                      Withdraw
                    </CmsButton>
                  )}
                </>
              }
              key={post.id}
              meta={post.reviewNote && `Reviewer note: ${post.reviewNote}`}
              name={post.title}
            />
          ))}
        </RecordList>
      )}
    </Panel>
  );
};

const NewsContent = () => {
  const queryClient = useQueryClient();
  const myNewsQuery = orpc.club.listMyNewsPosts.queryOptions();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <ScreenWrap>
      <ScreenHead
        eyebrow="Photography Club"
        heading="News"
        note="Every news post is reviewed by the CMS team before it appears on the public news page."
      />
      <MyNewsPosts onAdd={() => setDialogOpen(true)} />
      <AddNewsPostDialog
        onClose={() => setDialogOpen(false)}
        onSubmitted={() => queryClient.invalidateQueries(myNewsQuery)}
        open={dialogOpen}
      />
    </ScreenWrap>
  );
};

export const Route = createFileRoute("/club-admin/photography/news")({
  component: NewsContent,
});
