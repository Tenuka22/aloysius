import * as stylex from "@stylexjs/stylex";
import { Eye, EyeOff, GripVertical } from "lucide-react";
import { useState } from "react";

import { HOMEPAGE_BLOCKS } from "../../content/cms";
import type { BlockField } from "../../content/cms";
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

const styles = stylex.create({
  layout: {
    display: "grid",
    gap: space.md,
    alignItems: "start",
    // The block list only earns a permanent column once the editor beside it
    // can still show two fields per row. Below that it stacks above the editor.
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
    // On phones the 11-item list would push the editor two screens down, so it
    // scrolls in place; from 80rem it sits in its own column and runs full.
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
    alignItems: "center",
    gap: space["2xs"],
    borderBlockEndWidth: space.px,
    borderBlockEndStyle: "solid",
    borderBlockEndColor: color.border,
  },
  blockPick: {
    display: "flex",
    flex: 1,
    alignItems: "center",
    gap: space.xs,
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
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "2.25rem",
    minHeight: "2.25rem",
    paddingInline: space["3xs"],
    borderWidth: 0,
    backgroundColor: "transparent",
    color: color.onSurfaceMuted,
    cursor: "pointer",
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
  imageField: {
    display: "grid",
    gap: space.sm,
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      [bp.lg]: "13rem minmax(0, 1fr)",
    },
    alignItems: "center",
    padding: space.sm,
    backgroundColor: color.surfaceSunken,
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: color.border,
  },
  imageSlot: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    aspectRatio: "3 / 2",
    padding: space["2xs"],
    backgroundImage: `repeating-linear-gradient(135deg, ${color.placeholder} 0 10px, transparent 10px 20px)`,
    borderWidth: space.px,
    borderStyle: "dashed",
    borderColor: color.borderStrong,
    color: color.placeholderInk,
    fontSize: font.size2xs,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingWide,
    textAlign: "center",
    textTransform: "uppercase",
  },
  editorFoot: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    gap: space["2xs"],
    marginBlockStart: space.md,
  },

  headerActions: {
    display: "flex",
    flexWrap: "wrap",
    gap: space["2xs"],
  },
});

/** Fields the editor has typed into, keyed by field id. */
type Draft = Record<string, string>;

export const HomepageEditor = () => {
  const [selectedId, setSelectedId] = useState(
    HOMEPAGE_BLOCKS[1]?.id ?? "hero"
  );
  const [hidden, setHidden] = useState<Record<string, boolean>>({});
  const [draft, setDraft] = useState<Draft>({});

  const selected =
    HOMEPAGE_BLOCKS.find((block) => block.id === selectedId) ??
    HOMEPAGE_BLOCKS[0];

  const valueOf = (field: BlockField) => draft[field.id] ?? field.value ?? "";

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
          {HOMEPAGE_BLOCKS.map((block, index) => {
            const isHidden = hidden[block.id] ?? false;
            const isActive = block.id === selectedId;
            return (
              <li key={block.id} {...stylex.props(styles.blockItem)}>
                <button
                  aria-current={isActive ? "true" : undefined}
                  onClick={() => setSelectedId(block.id)}
                  title={block.type}
                  type="button"
                  {...stylex.props(
                    styles.blockPick,
                    isActive && styles.blockPickActive,
                    isHidden && styles.blockHidden
                  )}
                >
                  {/*
                    Decorative only. Drag-to-reorder needs a keyboard equivalent
                    to be usable at all, so it is deliberately not wired to a
                    mouse-only handler that keyboard users could not reach.
                  */}
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
                </button>
                <button
                  aria-pressed={isHidden}
                  onClick={() =>
                    setHidden((prev) => ({
                      ...prev,
                      [block.id]: !prev[block.id],
                    }))
                  }
                  title={isHidden ? `Show ${block.name}` : `Hide ${block.name}`}
                  type="button"
                  {...stylex.props(styles.blockToggle)}
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
                    {`${isHidden ? "Show" : "Hide"} ${block.name} section`}
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
                <div key={field.id} {...stylex.props(styles.imageField)}>
                  <div {...stylex.props(styles.imageSlot)}>{field.label}</div>
                  <div>
                    <p {...stylex.props(styles.editorSummary)}>
                      No image selected yet.
                      {field.hint ? ` ${field.hint}` : ""}
                    </p>
                  </div>
                </div>
              ) : (
                <Field
                  dirty={field.id in draft}
                  hint={field.hint}
                  key={field.id}
                  kind={field.kind}
                  label={field.label}
                  onChange={(next) =>
                    setDraft((prev) => ({ ...prev, [field.id]: next }))
                  }
                  value={valueOf(field)}
                  wide={field.wide}
                />
              )
            )}
          </FieldGrid>

          <div {...stylex.props(styles.editorFoot)}>
            <CmsButton onClick={() => setDraft({})} tone="quiet">
              Discard changes
            </CmsButton>
            <CmsButton tone="dark">Apply to section</CmsButton>
          </div>
        </Panel>
      </div>
    </div>
  );
};

export const HomepageEditorActions = () => (
  <div {...stylex.props(styles.headerActions)}>
    <CmsButton tone="quiet">Save draft</CmsButton>
    <CmsButton tone="primary">Publish changes</CmsButton>
  </div>
);
