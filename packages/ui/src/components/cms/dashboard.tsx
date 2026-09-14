import * as stylex from "@stylexjs/stylex";

import { DASHBOARD_TILES, HEALTH_ROWS, PENDING_ITEMS } from "../../content/cms";
import { bp } from "../../tokens/breakpoints.stylex";
import { color, font, space } from "../../tokens/tokens.stylex";
import { CmsButton, Panel, PanelHead } from "./cms-primitives";

const styles = stylex.create({
  /*
   * `auto-fit` + `minmax` rather than the comp's hard `repeat(4, 1fr)`: four
   * 1fr tiles at 320px are 60px wide each. This gives one tile on a phone, two
   * on a large phone, four from a laptop, and keeps filling on an ultra-wide.
   */
  tiles: {
    display: "grid",
    gap: space.sm,
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 13rem), 1fr))",
    marginBlockEnd: space.md,
  },
  tile: {
    minWidth: 0,
    padding: space.md,
    backgroundColor: color.surface,
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: color.border,
    borderBlockStartWidth: "2px",
  },
  tileGreen: { borderBlockStartColor: color.surfaceInverse },
  tileGold: { borderBlockStartColor: color.accent },
  tileCrimson: { borderBlockStartColor: color.danger },
  tileLabel: {
    margin: 0,
    fontSize: font.size2xs,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingWider,
    textTransform: "uppercase",
    color: color.onSurfaceSubtle,
  },
  tileValue: {
    margin: 0,
    marginBlockStart: space["3xs"],
    fontFamily: font.display,
    fontSize: font.size3xl,
    fontWeight: font.weightSemibold,
    lineHeight: 1,
  },
  tileSub: {
    margin: 0,
    marginBlockStart: space["3xs"],
    fontSize: font.sizeXs,
    color: color.onSurfaceMuted,
  },

  columns: {
    display: "grid",
    gap: space.md,
    alignItems: "start",
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      [bp.xxl]: "minmax(0, 1.5fr) minmax(0, 1fr)",
    },
  },

  pendingRow: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: space["2xs"],
    paddingBlock: space.xs,
    borderBlockEndWidth: space.px,
    borderBlockEndStyle: "solid",
    borderBlockEndColor: color.border,
  },
  pendingType: {
    flexShrink: 0,
    paddingBlock: "0.15rem",
    paddingInline: space["3xs"],
    backgroundColor: "rgba(255, 178, 3, 0.24)",
    color: "#7a5400",
    fontSize: font.size2xs,
    fontWeight: font.weightExtrabold,
    letterSpacing: font.trackingWide,
    textTransform: "uppercase",
  },
  pendingTitle: {
    // `14rem` basis keeps the title beside its badge until it would be too
    // cramped to read, then the Review button drops to its own line.
    flex: "1 1 14rem",
    minWidth: 0,
    margin: 0,
    fontSize: font.sizeSm,
    lineHeight: font.leadingNormal,
    textWrap: "pretty",
  },

  healthRow: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space["2xs"],
    paddingBlock: space.xs,
    borderBlockEndWidth: space.px,
    borderBlockEndStyle: "solid",
    borderBlockEndColor: color.borderInverse,
  },
  healthLabel: {
    margin: 0,
    fontSize: font.sizeSm,
    color: color.onInverseMuted,
  },
  healthStatus: {
    margin: 0,
    fontSize: font.size2xs,
    fontWeight: font.weightExtrabold,
    letterSpacing: font.trackingWide,
    textTransform: "uppercase",
  },
  healthOk: { color: "#8fd18f" },
  healthWarn: { color: color.accentOnInverse },
  healthMuted: { color: color.onInverseSubtle },
  empty: {
    margin: 0,
    paddingBlock: space.sm,
    fontSize: font.sizeSm,
    color: color.onSurfaceMuted,
  },
});

const TILE_TONE = {
  green: styles.tileGreen,
  gold: styles.tileGold,
  crimson: styles.tileCrimson,
} as const;

const HEALTH_TONE = {
  ok: styles.healthOk,
  warn: styles.healthWarn,
  muted: styles.healthMuted,
} as const;

export const Dashboard = () => (
  <>
    <div {...stylex.props(styles.tiles)}>
      {DASHBOARD_TILES.map((tile) => (
        <div key={tile.id} {...stylex.props(styles.tile, TILE_TONE[tile.tone])}>
          <p {...stylex.props(styles.tileLabel)}>{tile.label}</p>
          <p {...stylex.props(styles.tileValue)}>{tile.value}</p>
          <p {...stylex.props(styles.tileSub)}>{tile.sub}</p>
        </div>
      ))}
    </div>

    <div {...stylex.props(styles.columns)}>
      <Panel>
        <PanelHead
          note="Submitted by contributors and waiting on an editor."
          title="Pending approval"
        />
        {PENDING_ITEMS.length === 0 ? (
          <p {...stylex.props(styles.empty)}>Nothing is waiting for review.</p>
        ) : (
          PENDING_ITEMS.map((item) => (
            <div key={item.id} {...stylex.props(styles.pendingRow)}>
              <span {...stylex.props(styles.pendingType)}>{item.type}</span>
              <p {...stylex.props(styles.pendingTitle)}>{item.title}</p>
              <CmsButton tone="quiet">Review</CmsButton>
            </div>
          ))
        )}
      </Panel>

      <Panel tone="inverse">
        <PanelHead inverse title="Site health" />
        {HEALTH_ROWS.map((row) => (
          <div key={row.id} {...stylex.props(styles.healthRow)}>
            <p {...stylex.props(styles.healthLabel)}>{row.label}</p>
            <p {...stylex.props(styles.healthStatus, HEALTH_TONE[row.tone])}>
              {row.status}
            </p>
          </div>
        ))}
      </Panel>
    </div>
  </>
);
