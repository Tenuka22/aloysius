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
import { ADMISSIONS_BLOCKS } from "@aloysius/ui/content/cms";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense, useCallback, useRef, useState } from "react";

import { uploadImage } from "@/components/club/upload";
import { client, orpc } from "@/utils/orpc";

const AdmissionsContent = () => {
  const queryClient = useQueryClient();
  const admissionsQuery = orpc.cms.getAdmissions.queryOptions();
  const { data: admissions } = useSuspenseQuery(admissionsQuery);
  const editorRef = useRef<HomepageEditorHandle>(null);
  const [dirty, setDirty] = useState<Record<string, boolean>>({});
  const [hidden, setHidden] = useState<Record<string, boolean>>({});

  const updateMutation = useMutation(
    orpc.cms.updateAdmissions.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(admissionsQuery);
      },
    })
  );

  const publishMutation = useMutation(
    orpc.cms.publishAdmissions.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(admissionsQuery);
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
      const result = await client.cms.getAdmissionsHistory({ cursor });
      return result as HistoryResponse;
    },
    []
  );

  const sectionsSlot = (
    <SectionsDropdown
      blocks={ADMISSIONS_BLOCKS}
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
            onPreview={handlePreview}
            onPublish={handlePublish}
            onSaveDraft={handleSaveDraft}
            sectionsSlot={sectionsSlot}
          />
        }
        eyebrow="Pages / Admissions"
        heading="Admissions Editor"
        note="Edit the hero, priority notice and closing contact note. The application process, requirements, key dates, downloads and FAQs are fixed copy, not editable here."
      />
      <HomepageEditor
        blocks={ADMISSIONS_BLOCKS}
        initialBlocks={admissions?.blocks ?? undefined}
        onDirtyChange={handleDirtyChange}
        onUpload={handleUpload}
        ref={editorRef}
      />
    </>
  );
};

export const Route = createFileRoute("/cms/admissions")({
  head: () => ({
    meta: [
      { title: "Admissions Editor — St. Aloysius' College" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: () => (
    <ScreenWrap>
      <Suspense fallback={<div>Loading…</div>}>
        <AdmissionsContent />
      </Suspense>
    </ScreenWrap>
  ),
});
