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
import { ANTHEM_IMAGE, FOUNDERS, TIMELINE } from "@aloysius/ui/content/about";
import { ABOUT_BLOCKS } from "@aloysius/ui/content/cms";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense, useCallback, useRef, useState } from "react";

import { uploadImage } from "@/components/club/upload";
import { client, orpc } from "@/utils/orpc";

/** Default archival photos shown when no CMS override is saved. */
const DEFAULT_IMAGES: Record<string, string> = {
  "founder1-image": FOUNDERS[0].image?.src ?? "",
  "founder2-image": FOUNDERS[1].image?.src ?? "",
  "history-1-image": TIMELINE[0].image?.src ?? "",
  "history-2-image": TIMELINE[1].image?.src ?? "",
  "history-3-image": TIMELINE[2].image?.src ?? "",
  "history-4-image": TIMELINE[3].image?.src ?? "",
  "anthem-image": ANTHEM_IMAGE.src,
  "anthem-sinhala-image": ANTHEM_IMAGE.src,
};

const AboutContent = () => {
  const queryClient = useQueryClient();
  const aboutQuery = orpc.cms.getAbout.queryOptions();
  const { data: about } = useSuspenseQuery(aboutQuery);
  const editorRef = useRef<HomepageEditorHandle>(null);
  const [dirty, setDirty] = useState<Record<string, boolean>>({});
  const [hidden, setHidden] = useState<Record<string, boolean>>({});

  const updateMutation = useMutation(
    orpc.cms.updateAbout.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(aboutQuery);
      },
    })
  );

  const publishMutation = useMutation(
    orpc.cms.publishAbout.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(aboutQuery);
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

  const handleFetchHistory = useCallback(
    async (cursor: number): Promise<HistoryResponse> => {
      const result = await client.cms.getAboutHistory({ cursor });
      return result as HistoryResponse;
    },
    []
  );

  const sectionsSlot = (
    <SectionsDropdown
      blocks={ABOUT_BLOCKS}
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
            onPreview={handlePreview}
            onSaveDraft={handleSaveDraft}
            sectionsSlot={sectionsSlot}
          />
        }
        eyebrow="Pages / About"
        heading="About Editor"
        note="Replace the archival photos on the About page. Clearing a photo restores the college's default."
      />
      <HomepageEditor
        blocks={ABOUT_BLOCKS}
        defaultImages={DEFAULT_IMAGES}
        initialBlocks={about?.blocks ?? undefined}
        onDirtyChange={handleDirtyChange}
        onUpload={handleUpload}
        ref={editorRef}
      />
    </>
  );
};

export const Route = createFileRoute("/cms/about")({
  head: () => ({
    meta: [
      { title: "About Editor — St. Aloysius' College" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: () => (
    <ScreenWrap>
      <Suspense fallback={<div>Loading…</div>}>
        <AboutContent />
      </Suspense>
    </ScreenWrap>
  ),
});
