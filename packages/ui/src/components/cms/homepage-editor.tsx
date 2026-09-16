import * as stylex from "@stylexjs/stylex";
import { Eye, EyeOff, GripVertical, History, List } from "lucide-react";
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

import type { BlockField, PageBlock } from "../../content/cms";
import { aspectRatios } from "../../tokens/aspect-ratios";
import { bp } from "../../tokens/breakpoints.stylex";
import { color, font, motionToken, space } from "../../tokens/tokens.stylex";
import { VisuallyHidden } from "../primitives/layout";
import {
  CmsButton,
  Field,
  FieldGrid,
  Panel,
  PanelHead,
  StatusBadge,
} from "./cms-primitives";
import { HistoryDialog, HistoryPopover } from "./history-popover";
import type { HistoryResponse } from "./history-popover";
import { MediaField } from "./media-field";

type Baseline = Record<string, string>;
type DirtyMap = Record<string, boolean>;

const buildBaseline = (
  initialBlocks: HomepageEditorProps["initialBlocks"],
  pageBlocks: readonly PageBlock[]
): Baseline => {
  const baseline: Baseline = {};
  for (const block of initialBlocks ?? []) {
    for (const field of block.fields ?? []) {
      baseline[field.id] = field.value ?? "";
    }
  }
  for (const block of pageBlocks) {
    for (const field of block.fields) {
      if (!(field.id in baseline)) {
        baseline[field.id] = field.value ?? "";
      }
    }
  }
  return baseline;
};

const buildDirtyMap = (
  draft: Draft,
  baseline: Baseline,
  pageBlocks: readonly PageBlock[]
): DirtyMap => {
  const dirty: DirtyMap = {};
  for (const block of pageBlocks) {
    for (const field of block.fields) {
      dirty[field.id] =
        Object.hasOwn(draft, field.id) &&
        draft[field.id] !== baseline[field.id];
    }
  }
  return dirty;
};

const getAspectRatio = (fieldId: string) => {
  switch (fieldId) {
    case "hero-bg": {
      return aspectRatios.hero;
    }
    case "heritage-image-1": {
      return aspectRatios.heritagePhoto;
    }
    case "principal-portrait": {
      return aspectRatios.principalPortrait;
    }
    case "alumni-image": {
      return aspectRatios.alumniPhoto;
    }
    case "life-sports":
    case "life-music": {
      return aspectRatios.mosaicTile;
    }
    default: {
      return aspectRatios.newsCard;
    }
  }
};

const styles = stylex.create({
  layout: {
    display: "grid",
    gap: space.md,
    alignItems: "start",
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      [bp.xxl]: "minmax(0, 19rem) minmax(0, 1fr)",
    },
  },
  main: {
    display: "flex",
    flexDirection: "column",
    gap: space.md,
    minWidth: 0,
  },

  /* ---------------------------------------------------------- block list */
  blockPanel: {
    backgroundColor: color.surface,
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: color.border,
    borderBlockStartWidth: "2px",
    borderBlockStartColor: color.accent,
    minWidth: 0,
  },
  blockHead: {
    padding: space.sm,
    borderBlockEndWidth: space.px,
    borderBlockEndStyle: "solid",
    borderBlockEndColor: color.border,
  },
  blockHeadTitle: {
    margin: 0,
    fontSize: font.size2xs,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingWidest,
    textTransform: "uppercase",
    color: color.accentOnSurface,
  },
  blockHeadNote: {
    margin: 0,
    marginBlockStart: space["3xs"],
    fontSize: font.sizeXs,
    color: color.onSurfaceMuted,
  },
  blockList: {
    listStyle: "none",
    margin: 0,
    padding: 0,
    maxHeight: {
      default: "22rem",
      [bp.xxl]: "none",
    },
    overflowY: {
      default: "auto",
      [bp.xxl]: "visible",
    },
    overscrollBehavior: "contain",
  },
  blockItem: {
    display: "flex",
    alignItems: "stretch",
    height: "2.75rem",
    gap: space["2xs"],
    borderBlockEndWidth: space.px,
    borderBlockEndStyle: "solid",
    borderBlockEndColor: color.border,
  },
  blockPick: {
    display: "flex",
    alignItems: "center",
    gap: space.xs,
    flexGrow: 1,
    minWidth: 0,
    minHeight: "2.25rem",
    paddingBlock: space.xs,
    paddingInline: space["2xs"],
    borderWidth: 0,
    borderInlineStartWidth: "3px",
    borderInlineStartStyle: "solid",
    borderInlineStartColor: "transparent",
    backgroundColor: {
      default: "transparent",
      ":hover": "rgba(1, 52, 5, 0.05)",
    },
    color: "inherit",
    fontFamily: font.body,
    textAlign: "start",
    cursor: "pointer",
    touchAction: "manipulation",
    transitionProperty: "background-color",
    transitionDuration: motionToken.fast,
  },
  blockPickActive: {
    backgroundColor: "rgba(255, 178, 3, 0.14)",
    borderInlineStartColor: color.accent,
  },
  blockHidden: {
    opacity: 0.5,
  },
  dirtyDot: {
    flexShrink: 0,
    width: "0.5rem",
    height: "0.5rem",
    borderRadius: "50%",
    backgroundColor: color.accent,
  },
  grip: {
    flexShrink: 0,
    width: "0.75rem",
    height: "0.75rem",
    color: color.onSurfaceSubtle,
  },
  blockNum: {
    flexShrink: 0,
    width: "1.1rem",
    fontFamily: font.mono,
    fontSize: font.size2xs,
    color: color.onSurfaceSubtle,
  },
  blockText: {
    flex: 1,
    minWidth: 0,
  },
  blockName: {
    margin: 0,
    fontSize: font.sizeSm,
    fontWeight: font.weightBold,
    lineHeight: font.leadingSnug,
    overflowWrap: "break-word",
  },
  blockToggle: {
    flexShrink: 0,
    display: "grid",
    placeItems: "center",
    width: "2.75rem",
    height: "2.75rem",
    padding: 0,
    borderWidth: 0,
    borderRadius: 0,
    backgroundColor: {
      default: "transparent",
      ":hover": "rgba(1, 52, 5, 0.08)",
    },
    color: {
      default: color.onSurfaceMuted,
      ":hover": color.onSurface,
    },
    cursor: "pointer",
    transitionProperty: "background-color, color, transform",
    transitionDuration: motionToken.fast,
    transitionTimingFunction: motionToken.ease,
    transform: {
      default: "scale(1)",
      ":active": "scale(0.9)",
    },
  },
  blockToggleHidden: {
    color: color.onSurfaceSubtle,
    opacity: 0.5,
  },
  toggleIcon: {
    width: "1rem",
    height: "1rem",
  },
  addWrap: {
    padding: space["2xs"],
  },
  addButton: {
    width: "100%",
    minHeight: "2.75rem",
    borderWidth: space.px,
    borderStyle: "dashed",
    borderColor: {
      default: color.borderStrong,
      ":hover": color.onSurface,
    },
    backgroundColor: {
      default: "transparent",
      ":hover": color.surfaceSunken,
    },
    color: color.onSurface,
    fontFamily: font.body,
    fontSize: font.size2xs,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingWide,
    textTransform: "uppercase",
    cursor: "pointer",
  },

  /* -------------------------------------------------------------- editor */
  editorMeta: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: space["2xs"],
    marginBlockEnd: space.md,
  },
  editorSummary: {
    margin: 0,
    fontSize: font.sizeXs,
    color: color.onSurfaceMuted,
    textWrap: "pretty",
  },

  headerActions: {
    display: "flex",
    flexWrap: "wrap",
    gap: space["2xs"],
    alignItems: "center",
  },
  sectionsMenuWrap: {
    position: "relative",
  },
  sectionsMenuButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: space["3xs"],
    minHeight: "2.75rem",
    paddingBlock: space["2xs"],
    paddingInline: space.md,
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: color.borderStrong,
    backgroundColor: {
      default: "transparent",
      ":hover": "rgba(1, 52, 5, 0.06)",
    },
    color: color.onSurface,
    fontFamily: font.body,
    fontSize: font.sizeXs,
    fontWeight: font.weightExtrabold,
    letterSpacing: font.trackingWide,
    textTransform: "uppercase",
    cursor: "pointer",
    touchAction: "manipulation",
  },
  sectionsMenuIcon: {
    width: "1rem",
    height: "1rem",
  },
  sectionsDropdown: {
    position: "absolute",
    insetBlockStart: "100%",
    insetInlineEnd: 0,
    zIndex: 100,
    minWidth: "14rem",
    maxHeight: "20rem",
    overflowY: "auto",
    backgroundColor: color.surface,
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: color.border,
    boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
  },
  sectionsDropdownItem: {
    display: "flex",
    alignItems: "center",
    gap: space["2xs"],
    width: "100%",
    minHeight: "2.25rem",
    borderWidth: 0,
    borderBottomWidth: space.px,
    borderStyle: "solid",
    borderColor: color.border,
    backgroundColor: {
      default: "transparent",
      ":hover": "rgba(1, 52, 5, 0.05)",
    },
  },
  sectionsDropdownItemHidden: {
    opacity: 0.5,
  },
  sectionsDropdownItemButton: {
    display: "flex",
    flex: 1,
    alignItems: "center",
    gap: space.xs,
    minWidth: 0,
    minHeight: "2.25rem",
    paddingBlock: space.xs,
    paddingInline: space.sm,
    borderWidth: 0,
    backgroundColor: "transparent",
    color: "inherit",
    fontFamily: font.body,
    fontSize: font.sizeSm,
    fontWeight: font.weightSemibold,
    textAlign: "start",
    cursor: "pointer",
  },
  sectionsDropdownNum: {
    flexShrink: 0,
    width: "1.1rem",
    fontFamily: font.mono,
    fontSize: font.size2xs,
    color: color.onSurfaceSubtle,
  },
  sectionsDropdownName: {
    flex: 1,
    minWidth: 0,
    overflowWrap: "break-word",
  },
  sectionsDropdownDirtyDot: {
    flexShrink: 0,
    width: "0.5rem",
    height: "0.5rem",
    borderRadius: "50%",
    backgroundColor: color.accent,
  },
  sectionsDropdownEye: {
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "1.5rem",
    height: "1.5rem",
    color: color.onSurfaceMuted,
  },
  sectionsDropdownEyeIcon: {
    width: "0.875rem",
    height: "0.875rem",
  },
  historyWrap: {
    position: "relative",
  },
  historyButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: space["3xs"],
    width: "2.75rem",
    height: "2.75rem",
    padding: 0,
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: color.borderStrong,
    borderRadius: "0.375rem",
    backgroundColor: {
      default: "transparent",
      ":hover": "rgba(1, 52, 5, 0.06)",
    },
    color: color.onSurface,
    cursor: "pointer",
    touchAction: "manipulation",
  },
  historyIcon: {
    width: "1rem",
    height: "1rem",
  },
});

/** Fields the editor has typed into, keyed by field id. */
type Draft = Record<string, string>;
interface DraftState {
  draft: Draft;
  dirty: DirtyMap;
}
const EMPTY_DIRTY: DirtyMap = {};

export interface Block {
  id: string;
  hidden: boolean;
  fields: { id: string; value: string }[];
}

/** Handle exposed via ref so the route can read the current blocks. */
export interface HomepageEditorHandle {
  getBlocks: () => Block[];
  getDirty: () => DirtyMap;
  getHidden: () => Record<string, boolean>;
  toggleHidden: (blockId: string) => void;
  selectBlock: (blockId: string) => void;
  commitBlocks: (blocks: Block[]) => void;
}

export interface HomepageEditorProps {
  /** The page's block registry, e.g. `HOMEPAGE_BLOCKS` or `ABOUT_BLOCKS`. */
  blocks: readonly PageBlock[];
  initialBlocks?: {
    id: string;
    hidden?: boolean;
    fields?: { id: string; value?: string }[];
  }[];
  onDirtyChange?: (dirty: DirtyMap) => void;
  onUpload?: (file: File) => Promise<string>;
  /** Field IDs that just received a real-time update (flash highlight). */
  highlightedFields?: Record<string, number>;
}

// eslint-disable-next-line react-doctor/no-giant-component
export const HomepageEditor = forwardRef<
  HomepageEditorHandle,
  HomepageEditorProps
>(
  // eslint-disable-next-line prefer-arrow-callback
  function HomepageEditor(
    {
      blocks: pageBlocks,
      initialBlocks,
      onDirtyChange,
      onUpload,
      highlightedFields,
    },
    ref
  ) {
    const [selectedId, setSelectedId] = useState(
      pageBlocks[1]?.id ?? pageBlocks[0]?.id ?? ""
    );
    const [hidden, setHidden] = useState<Record<string, boolean>>(() => {
      if (!initialBlocks) {
        return {};
      }
      const h: Record<string, boolean> = {};
      for (const b of initialBlocks) {
        if (b.hidden) {
          h[b.id] = true;
        }
      }
      return h;
    });
    const [baseline, setBaseline] = useState<Baseline>(() =>
      buildBaseline(initialBlocks, pageBlocks)
    );
    const [draftState, setDraftState] = useState<DraftState>({
      draft: {},
      dirty: {},
    });
    const { draft, dirty } = draftState;

    const selected =
      pageBlocks.find((block) => block.id === selectedId) ?? pageBlocks[0];

    const valueOf = useCallback(
      (field: BlockField) =>
        draft[field.id] ?? baseline[field.id] ?? field.value ?? "",
      [baseline, draft]
    );

    const getFieldDirty = useCallback(
      (fieldId: string) => dirty[fieldId] ?? false,
      [dirty]
    );

    const updateDraft = useCallback(
      (updater: (previous: Draft) => Draft) => {
        const nextDraft = updater(draftState.draft);
        const nextDirty = buildDirtyMap(nextDraft, baseline, pageBlocks);
        setDraftState({ draft: nextDraft, dirty: nextDirty });
        onDirtyChange?.(nextDirty);
      },
      [baseline, draftState.draft, onDirtyChange, pageBlocks]
    );

    const updateField = useCallback(
      (fieldId: string, nextValue: string) => {
        updateDraft((previous) => {
          const next = { ...previous };
          if (nextValue === baseline[fieldId]) {
            Reflect.deleteProperty(next, fieldId);
          } else {
            next[fieldId] = nextValue;
          }
          return next;
        });
      },
      [baseline, updateDraft]
    );

    const commitBlocks = useCallback(
      (blocks: Block[]) => {
        const nextBaseline = { ...baseline };
        const nextDraft = { ...draftState.draft };
        for (const block of blocks) {
          for (const field of block.fields) {
            nextBaseline[field.id] = field.value;
            Reflect.deleteProperty(nextDraft, field.id);
          }
          setHidden((previous) => ({
            ...previous,
            [block.id]: block.hidden,
          }));
        }
        const nextDirty = buildDirtyMap(nextDraft, nextBaseline, pageBlocks);
        setBaseline(nextBaseline);
        setDraftState({ draft: nextDraft, dirty: nextDirty });
        onDirtyChange?.(nextDirty);
      },
      [baseline, draftState.draft, onDirtyChange, pageBlocks]
    );

    const buildBlocks = useCallback(
      (): Block[] =>
        pageBlocks.map((block) => ({
          id: block.id,
          hidden: hidden[block.id] ?? false,
          fields: block.fields.map((f) => ({
            id: f.id,
            value: valueOf(f),
          })),
        })),
      [hidden, pageBlocks, valueOf]
    );

    const isSectionDirty = useCallback(
      (sectionId: string): boolean => {
        const section = pageBlocks.find((b) => b.id === sectionId);
        if (!section) {
          return false;
        }
        return section.fields.some((f) => getFieldDirty(f.id));
      },
      [getFieldDirty, pageBlocks]
    );

    useImperativeHandle(
      ref,
      () => ({
        getBlocks: buildBlocks,
        getDirty: () => dirty,
        getHidden: () => hidden,
        toggleHidden: (blockId: string) =>
          setHidden((prev) => ({ ...prev, [blockId]: !prev[blockId] })),
        selectBlock: (blockId: string) => setSelectedId(blockId),
        commitBlocks,
      }),
      [buildBlocks, commitBlocks, dirty, hidden]
    );

    return (
      <div {...stylex.props(styles.layout)}>
        <nav aria-label="Page sections" {...stylex.props(styles.blockPanel)}>
          <div {...stylex.props(styles.blockHead)}>
            <p {...stylex.props(styles.blockHeadTitle)}>Page sections</p>
            <p {...stylex.props(styles.blockHeadNote)}>
              Select a section to edit it.
            </p>
          </div>

          <ul {...stylex.props(styles.blockList)}>
            {pageBlocks.map((block, index) => {
              const isHidden = hidden[block.id] ?? false;
              const isActive = block.id === selectedId;
              const hasUnsavedChanges = isSectionDirty(block.id);
              return (
                <li key={block.id} {...stylex.props(styles.blockItem)}>
                  <button
                    aria-current={isActive ? "true" : undefined}
                    onClick={() => setSelectedId(block.id)}
                    title={
                      hasUnsavedChanges
                        ? `${block.name} — unsaved changes`
                        : block.type
                    }
                    type="button"
                    {...stylex.props(
                      styles.blockPick,
                      isActive && styles.blockPickActive,
                      isHidden && styles.blockHidden
                    )}
                  >
                    <GripVertical
                      aria-hidden="true"
                      {...stylex.props(styles.grip)}
                    />
                    <span aria-hidden="true" {...stylex.props(styles.blockNum)}>
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span {...stylex.props(styles.blockText)}>
                      <span {...stylex.props(styles.blockName)}>
                        {block.name}
                      </span>
                    </span>
                    {hasUnsavedChanges ? (
                      <span
                        aria-hidden="true"
                        title="Unsaved changes"
                        {...stylex.props(styles.dirtyDot)}
                      />
                    ) : null}
                    <VisuallyHidden>
                      {hasUnsavedChanges ? "Unsaved changes" : ""}
                    </VisuallyHidden>
                  </button>
                  <button
                    aria-label={
                      isHidden ? `Show ${block.name}` : `Hide ${block.name}`
                    }
                    onClick={() => {
                      setHidden((prev) => ({
                        ...prev,
                        [block.id]: !prev[block.id],
                      }));
                    }}
                    title={
                      isHidden ? `Show ${block.name}` : `Hide ${block.name}`
                    }
                    type="button"
                    {...stylex.props(
                      styles.blockToggle,
                      isHidden && styles.blockToggleHidden
                    )}
                  >
                    {isHidden ? (
                      <EyeOff
                        aria-hidden="true"
                        {...stylex.props(styles.toggleIcon)}
                      />
                    ) : (
                      <Eye
                        aria-hidden="true"
                        {...stylex.props(styles.toggleIcon)}
                      />
                    )}
                    <VisuallyHidden>
                      {isHidden
                        ? `${block.name} is hidden`
                        : `${block.name} is visible`}
                    </VisuallyHidden>
                  </button>
                </li>
              );
            })}
          </ul>

          <div {...stylex.props(styles.addWrap)}>
            <button type="button" {...stylex.props(styles.addButton)}>
              + Add section
            </button>
          </div>
        </nav>

        <div {...stylex.props(styles.main)}>
          <Panel>
            <PanelHead
              eyebrow="Editing section"
              title={selected?.name ?? "Section"}
            />
            <div {...stylex.props(styles.editorMeta)}>
              {selected ? <StatusBadge status={selected.status} /> : null}
              <p {...stylex.props(styles.editorSummary)}>{selected?.summary}</p>
            </div>

            <FieldGrid>
              {selected?.fields.map((field) =>
                field.kind === "image" ? (
                  <MediaField
                    aspectRatio={getAspectRatio(field.id)}
                    field={field}
                    key={field.id}
                    onChange={(next) => updateField(field.id, next)}
                    onUpload={onUpload}
                    value={valueOf(field)}
                    variant={field.id === "hero-bg" ? "hero" : "image"}
                    wide={field.wide}
                  />
                ) : (
                  <Field
                    dirty={getFieldDirty(field.id)}
                    hint={field.hint}
                    key={field.id}
                    kind={field.kind}
                    label={field.label}
                    onChange={(next) => updateField(field.id, next)}
                    onReset={() =>
                      updateField(
                        field.id,
                        baseline[field.id] ?? field.value ?? ""
                      )
                    }
                    value={valueOf(field)}
                    wide={field.wide}
                    highlighted={
                      highlightedFields && field.id in highlightedFields
                    }
                  />
                )
              )}
            </FieldGrid>
          </Panel>
        </div>
      </div>
    );
  }
);

HomepageEditor.displayName = "HomepageEditor";

/** Dropdown showing all sections with visibility toggles. */
export const SectionsDropdown = ({
  blocks,
  dirty = EMPTY_DIRTY,
  hidden,
  onToggle,
  onSelect,
}: {
  blocks: readonly { id: string; name: string }[];
  dirty?: DirtyMap;
  hidden: Record<string, boolean>;
  onToggle: (blockId: string) => void;
  onSelect: (blockId: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(() => setOpen(false), []);

  // Close on outside click
  const handleBlur = useCallback(
    (e: React.FocusEvent) => {
      if (!wrapRef.current?.contains(e.relatedTarget)) {
        handleClose();
      }
    },
    [handleClose]
  );

  return (
    <div
      ref={wrapRef}
      {...stylex.props(styles.sectionsMenuWrap)}
      onBlur={handleBlur}
    >
      <button
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((o) => !o)}
        type="button"
        {...stylex.props(styles.sectionsMenuButton)}
      >
        <List aria-hidden="true" {...stylex.props(styles.sectionsMenuIcon)} />
        Sections
      </button>
      {open ? (
        <div role="menu" {...stylex.props(styles.sectionsDropdown)}>
          {blocks.map((block, index) => {
            const isHidden = hidden[block.id] ?? false;
            return (
              <div
                key={block.id}
                role="menuitem"
                {...stylex.props(
                  styles.sectionsDropdownItem,
                  isHidden && styles.sectionsDropdownItemHidden
                )}
              >
                <button
                  onClick={() => {
                    onSelect(block.id);
                    handleClose();
                  }}
                  type="button"
                  {...stylex.props(styles.sectionsDropdownItemButton)}
                >
                  <span
                    aria-hidden="true"
                    {...stylex.props(styles.sectionsDropdownNum)}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span {...stylex.props(styles.sectionsDropdownName)}>
                    {block.name}
                  </span>
                  {dirty[block.id] ? (
                    <span
                      aria-hidden="true"
                      title="Unsaved changes"
                      {...stylex.props(styles.sectionsDropdownDirtyDot)}
                    />
                  ) : null}
                </button>
                <button
                  aria-pressed={isHidden}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggle(block.id);
                  }}
                  title={isHidden ? `Show ${block.name}` : `Hide ${block.name}`}
                  type="button"
                  {...stylex.props(styles.sectionsDropdownEye)}
                >
                  {isHidden ? (
                    <EyeOff
                      aria-hidden="true"
                      {...stylex.props(styles.sectionsDropdownEyeIcon)}
                    />
                  ) : (
                    <Eye
                      aria-hidden="true"
                      {...stylex.props(styles.sectionsDropdownEyeIcon)}
                    />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};

export const HomepageEditorActions = ({
  onSaveDraft,
  onPublish,
  onPreview,
  sectionsSlot,
  fetchHistory,
}: {
  onSaveDraft?: () => void | Promise<void>;
  onPublish?: () => void | Promise<void>;
  onPreview?: () => void | Promise<void>;
  sectionsSlot?: React.ReactNode;
  fetchHistory?: (cursor: number) => Promise<HistoryResponse>;
}) => {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [fullHistoryOpen, setFullHistoryOpen] = useState(false);
  return (
    <div {...stylex.props(styles.headerActions)}>
      {sectionsSlot}
      <div {...stylex.props(styles.historyWrap)}>
        <button
          aria-expanded={historyOpen}
          aria-label="Version history"
          onClick={() => setHistoryOpen((o) => !o)}
          title="Version history"
          type="button"
          {...stylex.props(styles.historyButton)}
        >
          <History aria-hidden="true" {...stylex.props(styles.historyIcon)} />
        </button>
        {historyOpen && fetchHistory ? (
          <HistoryPopover
            fetchHistory={fetchHistory}
            onClose={() => setHistoryOpen(false)}
            onShowFull={() => {
              setHistoryOpen(false);
              setFullHistoryOpen(true);
            }}
          />
        ) : null}
        {fetchHistory ? (
          <HistoryDialog
            fetchHistory={fetchHistory}
            onClose={() => setFullHistoryOpen(false)}
            open={fullHistoryOpen}
          />
        ) : null}
      </div>
      <CmsButton onClick={onSaveDraft} tone="quiet">
        Save draft
      </CmsButton>
      <CmsButton onClick={onPublish} tone="primary">
        Publish changes
      </CmsButton>
      <CmsButton onClick={onPreview} tone="dark">
        Preview
      </CmsButton>
    </div>
  );
};
