import type { HistoryResponse } from "@aloysius/ui/components/cms/history-popover";
import {
  HomepageEditor,
  HomepageEditorActions,
  SectionsDropdown,
} from "@aloysius/ui/components/cms/homepage-editor";
import type { HomepageEditorHandle } from "@aloysius/ui/components/cms/homepage-editor";
import { HOMEPAGE_BLOCKS } from "@aloysius/ui/content/cms";
import { color, font, space } from "@aloysius/ui/tokens/tokens.stylex";
import * as stylex from "@stylexjs/stylex";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense, useCallback, useRef, useState } from "react";

import { useLiveHomepageBlocks } from "@/hooks/use-live-homepage-blocks";
import { client, orpc } from "@/utils/orpc";

const md = "@media (min-width: 40rem)";

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
  screenHead: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: space.sm,
    marginBlockEnd: space.md,
  },
  headingWrap: {
    minWidth: 0,
  },
  eyebrow: {
    margin: 0,
    fontSize: font.size2xs,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingWidest,
    textTransform: "uppercase",
    color: color.accentOnSurface,
  },
  heading: {
    margin: 0,
    marginBlockStart: space["3xs"],
    fontFamily: font.display,
    fontSize: font.size3xl,
    fontWeight: font.weightSemibold,
    lineHeight: font.leadingTight,
    textWrap: "balance",
  },
  note: {
    margin: 0,
    marginBlockStart: space["3xs"],
    maxWidth: space.measure,
    fontSize: font.sizeSm,
    lineHeight: font.leadingNormal,
    color: color.onSurfaceMuted,
    textWrap: "pretty",
  },
});

const HomepageContent = () => {
  const queryClient = useQueryClient();
  const homepageQuery = orpc.cms.getHomepage.queryOptions();
  const { data: homepage } = useSuspenseQuery(homepageQuery);
  const editorRef = useRef<HomepageEditorHandle>(null);
  const [dirty, setDirty] = useState<Record<string, boolean>>({});
  const [hidden, setHidden] = useState<Record<string, boolean>>({});
  const { highlightedFields } = useLiveHomepageBlocks();

  const updateMutation = useMutation(
    orpc.cms.updateHomepage.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(homepageQuery);
      },
    })
  );

  const publishMutation = useMutation(
    orpc.cms.publishHomepage.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(homepageQuery);
      },
    })
  );

  const handleUpload = useCallback(async (file: File) => {
    const upload = await client.files.getUploadUrl({
      name: file.name,
      size: file.size,
      type: file.type,
    });
    const response = await fetch(upload.uploadUrl, {
      body: file,
      headers: { "Content-Type": file.type },
      method: "PUT",
    });
    if (!response.ok) {
      throw new Error("The media upload failed.");
    }
    const record = await client.files.completeUpload({
      key: upload.key,
      name: file.name,
      size: file.size,
      type: file.type,
    });
    return record.url;
  }, []);

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

  const handlePreview = useCallback(() => {
    const blocks = editorRef.current?.getBlocks();
    if (!blocks) {
      return;
    }

    updateMutation.mutate(
      { blocks },
      {
        onSuccess: (data) => {
          if (data?.draftIds?.[0]) {
            window.open(`/preview/${data.draftIds[0]}`, "_blank");
          }
        },
      }
    );
  }, [updateMutation]);

  const handleToggleHidden = useCallback((blockId: string) => {
    editorRef.current?.toggleHidden(blockId);
    setHidden((prev) => ({ ...prev, [blockId]: !prev[blockId] }));
  }, []);

  const handleSelectBlock = useCallback((blockId: string) => {
    editorRef.current?.selectBlock(blockId);
  }, []);

  const handleFetchHistory = useCallback(
    async (cursor: number): Promise<HistoryResponse> => {
      const result = await client.cms.getHomepageHistory({ cursor });
      return result as HistoryResponse;
    },
    []
  );

  const sectionsSlot = (
    <SectionsDropdown
      blocks={HOMEPAGE_BLOCKS}
      dirty={dirty}
      hidden={hidden}
      onToggle={handleToggleHidden}
      onSelect={handleSelectBlock}
    />
  );

  return (
    <>
      <div {...stylex.props(styles.screenHead)}>
        <div {...stylex.props(styles.headingWrap)}>
          <p {...stylex.props(styles.eyebrow)}>Pages / Homepage</p>
          <h1 {...stylex.props(styles.heading)}>Homepage Editor</h1>
          <p {...stylex.props(styles.note)}>
            Edit the sections that make up the public homepage.
          </p>
        </div>
        <HomepageEditorActions
          onSaveDraft={handleSaveDraft}
          onPublish={handlePublish}
          onPreview={handlePreview}
          sectionsSlot={sectionsSlot}
          fetchHistory={handleFetchHistory}
        />
      </div>
      <HomepageEditor
        ref={editorRef}
        initialBlocks={homepage?.blocks ?? undefined}
        onDirtyChange={handleDirtyChange}
        onUpload={handleUpload}
        highlightedFields={highlightedFields}
      />
    </>
  );
};

export const Route = createFileRoute("/cms/homepage")({
  head: () => ({
    meta: [
      { title: "Homepage Editor — St. Aloysius' College" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: () => (
    <div {...stylex.props(styles.wrap)}>
      <Suspense fallback={<div>Loading homepage…</div>}>
        <HomepageContent />
      </Suspense>
    </div>
  ),
});
