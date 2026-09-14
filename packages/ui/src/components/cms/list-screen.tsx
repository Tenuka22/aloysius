import * as stylex from "@stylexjs/stylex";

import type { Entry } from "../../content/cms";
import { formatCmsDate } from "../../content/cms";
import { bp } from "../../tokens/breakpoints.stylex";
import { color, font, space } from "../../tokens/tokens.stylex";
import { VisuallyHidden } from "../primitives/layout";
import { CmsButton, StatusBadge } from "./cms-primitives";

/**
 * The entry list.
 *
 * The comp draws a four-column table. A table at 320px leaves two choices -
 * clip it or scroll it sideways - and both are bad on the device most editors
 * will actually reach for. So this is a *list of records* that happens to line
 * up into columns once there is room:
 *
 *  - below 64rem each entry is a card, with its fields stacked and labelled;
 *  - from 64rem the same DOM becomes a four-column grid and a header row
 *    appears above it.
 *
 * There is one copy of the markup, so nothing is announced twice. The per-cell
 * labels stay in the DOM at every width and are simply hidden visually once the
 * column header is doing that job - a screen reader user gets "Status: Draft"
 * either way, which a CSS-only table reflow cannot promise.
 */

const COLUMNS = "minmax(0, 1fr) 8.5rem 9rem 9.5rem";

const styles = stylex.create({
  wrap: {
    backgroundColor: color.surface,
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: color.border,
  },
  headRow: {
    display: {
      default: "none",
      [bp.xl]: "grid",
    },
    gridTemplateColumns: COLUMNS,
    gap: space.sm,
    paddingBlock: space["2xs"],
    paddingInline: space.md,
    backgroundColor: color.surfaceInverse,
    color: color.accentOnInverse,
    fontSize: font.size2xs,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingWider,
    textTransform: "uppercase",
  },
  list: {
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  row: {
    display: "grid",
    gap: {
      default: space["2xs"],
      [bp.xl]: space.sm,
    },
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      [bp.xl]: COLUMNS,
    },
    alignItems: {
      default: "start",
      [bp.xl]: "center",
    },
    paddingBlock: space.sm,
    paddingInline: {
      default: space.sm,
      [bp.xl]: space.md,
    },
    borderBlockEndWidth: space.px,
    borderBlockEndStyle: "solid",
    borderBlockEndColor: color.border,
  },
  cell: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "baseline",
    gap: space["3xs"],
    minWidth: 0,
  },
  cellLabel: {
    flexShrink: 0,
    // Visible as an inline label on the card layout, hidden (but still in the
    // accessibility tree) once the column header above provides it.
    display: {
      default: "inline",
      [bp.xl]: "none",
    },
    fontSize: font.size2xs,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingWide,
    textTransform: "uppercase",
    color: color.onSurfaceSubtle,
  },
  title: {
    margin: 0,
    minWidth: 0,
    fontSize: font.sizeSm,
    fontWeight: font.weightBold,
    lineHeight: font.leadingNormal,
    textWrap: "pretty",
  },
  date: {
    fontFamily: font.mono,
    fontSize: font.sizeXs,
    color: color.onSurfaceMuted,
  },
  actions: {
    display: "flex",
    flexWrap: "wrap",
    gap: space["2xs"],
    marginBlockStart: {
      default: space["3xs"],
      [bp.xl]: 0,
    },
  },
  empty: {
    margin: 0,
    padding: space.lg,
    fontSize: font.sizeSm,
    lineHeight: font.leadingNormal,
    color: color.onSurfaceMuted,
    textAlign: "center",
    textWrap: "pretty",
  },
});

export const ListScreen = ({
  entries,
  noun,
}: {
  entries: readonly Entry[];
  /** Singular noun for the empty state, e.g. "page", "news post". */
  noun: string;
}) => (
  <div {...stylex.props(styles.wrap)}>
    <div aria-hidden="true" {...stylex.props(styles.headRow)}>
      <span>Title</span>
      <span>Status</span>
      <span>Updated</span>
      <span>Actions</span>
    </div>

    {entries.length === 0 ? (
      <p {...stylex.props(styles.empty)}>
        No {noun} entries yet. They will appear here once the content routers
        are connected.
      </p>
    ) : (
      <ul {...stylex.props(styles.list)}>
        {entries.map((entry) => (
          <li key={entry.id} {...stylex.props(styles.row)}>
            <div {...stylex.props(styles.cell)}>
              <h3 {...stylex.props(styles.title)}>{entry.title}</h3>
            </div>

            <div {...stylex.props(styles.cell)}>
              <span {...stylex.props(styles.cellLabel)}>Status</span>
              <VisuallyHidden>Status:</VisuallyHidden>
              <StatusBadge status={entry.status} />
            </div>

            <div {...stylex.props(styles.cell)}>
              <span {...stylex.props(styles.cellLabel)}>Updated</span>
              <VisuallyHidden>Updated:</VisuallyHidden>
              <span {...stylex.props(styles.date)}>
                {formatCmsDate(entry.updated)}
              </span>
            </div>

            <div {...stylex.props(styles.actions)}>
              {/*
                The entry title is appended to each action's accessible name.
                Without it a screen reader user tabbing the list hears "Edit,
                Delete, Edit, Delete" with no way to tell the rows apart.
              */}
              <CmsButton tone="quiet">
                <span aria-hidden="true">Edit</span>
                <VisuallyHidden>{`Edit ${entry.title}`}</VisuallyHidden>
              </CmsButton>
              <CmsButton tone="danger">
                <span aria-hidden="true">Delete</span>
                <VisuallyHidden>{`Delete ${entry.title}`}</VisuallyHidden>
              </CmsButton>
            </div>
          </li>
        ))}
      </ul>
    )}
  </div>
);
