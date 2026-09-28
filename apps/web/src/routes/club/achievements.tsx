import {
  CmsButton,
  Field,
  FieldGrid,
  Notice,
  Panel,
  PanelHead,
} from "@aloysius/ui/components/cms/cms-primitives";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { ClubPage, FieldStack } from "@/components/club/page-parts";
import { PendingList } from "@/components/club/pending-list";
import { orpc } from "@/utils/orpc";

/**
 * Something the club achieved.
 *
 * Deliberately not the school's achievement wall. A club's own results are a
 * different claim with a different audience, and putting them in the global
 * table would mean either a club editing school-level copy, or a school
 * achievement quietly being attributed to whichever club logged it last. A
 * gallery can point at a *school* achievement without either becoming the other.
 *
 * Only a title is required. The other fields are there because a club that has
 * them will fill them in, and requiring them would mean logging "Second place,
 * inter-house photography, 2026" as a category and a date and a detail rather
 * than as the sentence it actually is.
 */

const MAX_TITLE = 160;

const AchievementsPage = () => {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [category, setCategory] = useState("");
  const [achievedOn, setAchievedOn] = useState("");

  const tooLong = title.length > MAX_TITLE;
  const canSubmit = title.trim().length > 0 && !tooLong;

  const create = useMutation(
    orpc.clubs.submitClubAchievement.mutationOptions({
      onSuccess: async () => {
        setTitle("");
        setDetail("");
        setCategory("");
        setAchievedOn("");
        await queryClient.invalidateQueries({
          queryKey: orpc.clubs.listMySubmissions.key(),
        });
      },
    })
  );

  return (
    <ClubPage
      eyebrow="Club / Achievements"
      note="Record something your club has done. A CMS editor reviews it before it appears on the website."
      title="Achievements"
    >
      <Panel accent>
        <PanelHead
          note="Your club's own results, kept separate from the school's achievement wall. A gallery can link to either."
          title="Record an achievement"
        />

        {create.isSuccess ? (
          <Notice tone="success">
            Sent for review. It will appear on the website once a CMS editor
            approves it.
          </Notice>
        ) : null}

        <form
          onSubmit={(event) => {
            event.preventDefault();
            create.reset();
            create.mutate({
              payload: {
                achievedOn: achievedOn.trim() || null,
                category: category.trim() || null,
                detail: detail.trim() || null,
                id: crypto.randomUUID(),
                title: title.trim(),
              },
            });
          }}
        >
          <FieldGrid>
            <Field
              hint={`What you won. ${title.length} of ${MAX_TITLE} characters.`}
              label="Title"
              onChange={setTitle}
              value={title}
              wide
            />
            <Field
              hint="Optional. Where it happened, who it was with, anything worth remembering."
              kind="textarea"
              label="Detail"
              onChange={setDetail}
              value={detail}
              wide
            />
            <Field
              hint="Optional. Anything you like — 'Inter-house', 'National', 'Club'."
              label="Category"
              onChange={setCategory}
              value={category}
            />
            <Field
              hint="Optional, and deliberately not a date picker. '2026 Inter-house' is a good answer."
              label="When"
              onChange={setAchievedOn}
              value={achievedOn}
            />
          </FieldGrid>

          {tooLong ? (
            <Notice tone="warning">
              That title is longer than {MAX_TITLE} characters. Shorten it, or
              move the detail into the field below.
            </Notice>
          ) : null}

          {create.error ? (
            <Notice tone="danger">
              {create.error instanceof Error
                ? create.error.message
                : "The achievement could not be submitted."}
            </Notice>
          ) : null}

          <FieldStack>
            <CmsButton
              disabled={!canSubmit || create.isPending}
              tone="primary"
              type="submit"
            >
              {create.isPending ? "Sending…" : "Submit achievement"}
            </CmsButton>
          </FieldStack>
        </form>
      </Panel>

      <Panel>
        <PanelHead
          eyebrow="Queue"
          note="Everything you have sent that has not been approved or rejected yet."
          title="Awaiting review"
        />
        <PendingList target="clubAchievement" />
      </Panel>
    </ClubPage>
  );
};

export const Route = createFileRoute("/club/achievements")({
  head: () => ({
    meta: [
      { title: "Achievements — Club portal — St. Aloysius' College" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AchievementsPage,
});
