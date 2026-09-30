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
import { HOMEPAGE_BLOCKS } from "@aloysius/ui/content/cms";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense, useCallback, useRef, useState } from "react";

import { uploadImage } from "@/components/club/upload";
import { useLiveHomepageBlocks } from "@/hooks/use-live-homepage-blocks";
import { client, orpc } from "@/utils/orpc";

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
      <ScreenHead
        actions={
          <HomepageEditorActions
            onSaveDraft={handleSaveDraft}
            onPublish={handlePublish}
            onPreview={handlePreview}
            sectionsSlot={sectionsSlot}
            fetchHistory={handleFetchHistory}
          />
        }
        eyebrow="Pages / Homepage"
        heading="Homepage Editor"
        note="Edit the sections that make up the public homepage."
      />
      <HomepageEditor
        blocks={HOMEPAGE_BLOCKS}
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
    <ScreenWrap>
      <Suspense fallback={<div>Loading homepage…</div>}>
        <HomepageContent />
      </Suspense>
    </ScreenWrap>
  ),
});
