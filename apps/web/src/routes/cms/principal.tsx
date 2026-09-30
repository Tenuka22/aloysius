import type { HistoryResponse } from "@aloysius/ui/components/cms/history-popover";
import {
  HomepageEditor,
  HomepageEditorActions,
  SectionsDropdown,
} from "@aloysius/ui/components/cms/homepage-editor";
import type { HomepageEditorHandle } from "@aloysius/ui/components/cms/homepage-editor";
import {
  ScreenHead,
  ScreenWrap,
} from "@aloysius/ui/components/cms/screen-head";
import { PRINCIPAL_BLOCKS } from "@aloysius/ui/content/cms";
import { color, font, space } from "@aloysius/ui/tokens/tokens.stylex";
import * as stylex from "@stylexjs/stylex";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense, useCallback, useRef, useState } from "react";

import { uploadImage } from "@/components/club/upload";
import { client, orpc } from "@/utils/orpc";

const styles = stylex.create({
  callout: {
    display: "flex",
    gap: space["2xs"],
    marginBlockEnd: space.md,
    padding: space.sm,
    borderInlineStartWidth: space.px,
    borderInlineStartStyle: "solid",
    borderInlineStartColor: color.accent,
    backgroundColor: color.surfaceRaised,
    fontSize: font.sizeSm,
    lineHeight: font.leadingNormal,
    color: color.onSurfaceMuted,
  },
});

/**
 * Editor for the site's one global block.
 *
 * Deliberately a separate screen rather than a section of the homepage or
 * About editors: whatever is saved here appears on *every* page that shows the
 * Principal's message, and an editor should be able to see that from the screen
 * rather than having to know it.
 */
const PrincipalContent = () => {
  const queryClient = useQueryClient();
  const principalQuery = orpc.cms.getPrincipal.queryOptions();
  const { data: principal } = useSuspenseQuery(principalQuery);
  const editorRef = useRef<HomepageEditorHandle>(null);
  const [dirty, setDirty] = useState<Record<string, boolean>>({});
  const [hidden, setHidden] = useState<Record<string, boolean>>({});

  const updateMutation = useMutation(
    orpc.cms.updatePrincipal.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(principalQuery);
      },
    })
  );

  const publishMutation = useMutation(
    orpc.cms.publishPrincipal.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(principalQuery);
      },
    })
  );

  const handleUpload = uploadImage;

  const handleSaveDraft = useCallback(async () => {
    const blocks = editorRef.current?.getBlocks();
    if (blocks) {
      await updateMutation.mutateAsync({ blocks });
      editorRef.current?.commitBlocks(blocks);
    }
  }, [updateMutation]);

  const handlePublish = useCallback(async () => {
    const blocks = editorRef.current?.getBlocks();
    if (!blocks) {
      return;
    }
    await updateMutation.mutateAsync({ blocks });
    await publishMutation.mutateAsync();
    editorRef.current?.commitBlocks(blocks);
  }, [updateMutation, publishMutation]);

  const handleDirtyChange = useCallback(
    (nextDirty: Record<string, boolean>) => setDirty(nextDirty),
    []
  );

  const handleToggleHidden = useCallback((blockId: string) => {
    editorRef.current?.toggleHidden(blockId);
    setHidden((prev) => ({ ...prev, [blockId]: !prev[blockId] }));
  }, []);

  const handleSelectBlock = useCallback((blockId: string) => {
    editorRef.current?.selectBlock(blockId);
  }, []);

  const handleFetchHistory = useCallback(
    async (cursor: number): Promise<HistoryResponse> => {
      const result = await client.cms.getPrincipalHistory({ cursor });
      return result as HistoryResponse;
    },
    []
  );

  const sectionsSlot = (
    <SectionsDropdown
      blocks={PRINCIPAL_BLOCKS}
      dirty={dirty}
      hidden={hidden}
      onToggle={handleToggleHidden}
      onSelect={handleSelectBlock}
    />
  );

  return (
    <>
      <ScreenHead
        actions={
          <HomepageEditorActions
            fetchHistory={handleFetchHistory}
            onPublish={handlePublish}
            onSaveDraft={handleSaveDraft}
            sectionsSlot={sectionsSlot}
          />
        }
        eyebrow="Global / All pages"
        heading="Principal’s Message"
        note="The message, attribution and portrait shown by every page that carries the section."
      />
      <p {...stylex.props(styles.callout)}>
        <span aria-hidden="true">&#9888;</span>
        <span>
          This block is global. Saving it here changes the Principal&rsquo;s
          message on the homepage and the About page at the same time — it does
          not have a separate copy per page.
        </span>
      </p>
      <HomepageEditor
        blocks={PRINCIPAL_BLOCKS}
        initialBlocks={principal?.blocks ?? undefined}
        onDirtyChange={handleDirtyChange}
        onUpload={handleUpload}
        ref={editorRef}
      />
    </>
  );
};

export const Route = createFileRoute("/cms/principal")({
  head: () => ({
    meta: [
      { title: "Principal's Message — St. Aloysius' College" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: () => (
    <ScreenWrap>
      <Suspense fallback={<div>Loading…</div>}>
        <PrincipalContent />
      </Suspense>
    </ScreenWrap>
  ),
});
