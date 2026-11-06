import * as stylex from "@stylexjs/stylex";

import { bp } from "../../tokens/breakpoints.stylex";
import type { ImageSource } from "../primitives/media";
import { Reveal } from "../primitives/reveal";
import { DcEyebrow, DcHeading, DcInner, DcSection, DcSlot } from "./dc";

const styles = stylex.create({
  heading: {
    marginBlockEnd: "60px",
  },
  /*
   * The design's mosaic: six columns, 128px rows, 16px gaps. Below 64rem it
   * collapses to a stack (one column) and then two columns, because the
   * 3-3-2-1 spans only make sense with six columns to spread across.
   */
  grid: {
    display: "grid",
    listStyle: "none",
    margin: 0,
    padding: 0,
    gap: "16px",
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      [bp.mdToXl]: "repeat(2, minmax(0, 1fr))",
      [bp.xl]: "repeat(6, minmax(0, 1fr))",
    },
    gridAutoRows: {
      default: "auto",
      [bp.xl]: "128px",
    },
  },
  tile: {
    position: "relative",
    minWidth: 0,
    minHeight: {
      default: "12rem",
      [bp.xl]: 0,
    },
  },
  spanSports: {
    gridColumn: { default: "auto", [bp.mdToXl]: "span 2", [bp.xl]: "span 3" },
    gridRow: { default: "auto", [bp.xl]: "span 3" },
  },
  spanMusic: {
    gridColumn: { default: "auto", [bp.mdToXl]: "span 2", [bp.xl]: "span 3" },
    gridRow: { default: "auto", [bp.xl]: "span 2" },
  },
  spanTwo: {
    gridColumn: { default: "auto", [bp.xl]: "span 2" },
  },
  spanOne: {
    gridColumn: "auto",
  },
  fill: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
  },
  caption: {
    position: "absolute",
    insetInlineStart: "20px",
    insetBlockEnd: "16px",
    margin: 0,
    paddingBlock: "8px",
    paddingInline: "16px",
    backgroundColor: "#013405",
    color: "#FFF8E7",
    fontSize: "13px",
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    pointerEvents: "none",
  },
  captionSmall: {
    insetInlineStart: "16px",
    insetBlockEnd: "12px",
    paddingBlock: "6px",
    paddingInline: "12px",
    fontSize: "12px",
  },
  panel: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: "16px",
  },
  panelGreen: {
    backgroundColor: "#013405",
    color: "#FFF8E7",
  },
  panelCrimson: {
    backgroundColor: "#A51919",
    color: "#FFF8E7",
    padding: "12px",
  },
  panelGold: {
    backgroundColor: "#FFB203",
    color: "#013405",
    padding: "12px",
  },
  panelTitle: {
    margin: 0,
    fontSize: "15px",
    fontWeight: 800,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  panelTitleHouses: {
    fontSize: "14px",
  },
  panelTitlePrefects: {
    fontSize: "13px",
    letterSpacing: "0.06em",
  },
  panelSub: {
    margin: 0,
    marginBlockStart: "4px",
    fontSize: "12px",
    color: "#FFB203",
  },
});

type Photos = Partial<
  Record<"sports" | "music" | "scouts" | "faith", ImageSource | undefined>
>;

const PhotoTile = ({
  label,
  placeholder,
  image,
  span,
  small = false,
}: {
  label: string;
  placeholder: string;
  image?: ImageSource;
  span: stylex.StyleXStyles;
  small?: boolean;
}) => (
  <li {...stylex.props(styles.tile, span)}>
    <DcSlot placeholder={placeholder} source={image} style={styles.fill} />
    <h3 {...stylex.props(styles.caption, small && styles.captionSmall)}>
      {label}
    </h3>
  </li>
);

export const StudentLife = ({
  photos,
  heading = "The Aloysian Experience",
}: {
  photos?: Photos;
  heading?: string;
}) => (
  <DcSection labelledBy="student-life-title" tone="cream">
    <DcInner>
      <DcEyebrow>Student life</DcEyebrow>
      <DcHeading id="student-life-title" style={styles.heading}>
        {heading}
      </DcHeading>

      <Reveal direction="up">
        <ul {...stylex.props(styles.grid)}>
          <PhotoTile
            image={photos?.sports}
            label="Sports"
            placeholder="Sports — action photo"
            span={styles.spanSports}
          />
          <PhotoTile
            image={photos?.music}
            label="Music & Drama"
            placeholder="Music & drama"
            span={styles.spanMusic}
          />
          <li
            {...stylex.props(
              styles.tile,
              styles.panel,
              styles.panelGreen,
              styles.spanTwo
            )}
          >
            <h3 {...stylex.props(styles.panelTitle)}>Clubs &amp; Societies</h3>
            <p {...stylex.props(styles.panelSub)}>
              Debate &bull; Science &bull; Media &bull; more
            </p>
          </li>
          <li
            {...stylex.props(
              styles.tile,
              styles.panel,
              styles.panelCrimson,
              styles.spanOne
            )}
          >
            <h3 {...stylex.props(styles.panelTitle, styles.panelTitleHouses)}>
              Houses
            </h3>
          </li>
          <PhotoTile
            image={photos?.scouts}
            label="Scouts & Cadets"
            placeholder="Scouts / cadets"
            small
            span={styles.spanTwo}
          />
          <PhotoTile
            image={photos?.faith}
            label="Faith & Service"
            placeholder="Chapel / religious life"
            small
            span={styles.spanTwo}
          />
          <li
            {...stylex.props(
              styles.tile,
              styles.panel,
              styles.panelGold,
              styles.spanOne
            )}
          >
            <h3 {...stylex.props(styles.panelTitle, styles.panelTitlePrefects)}>
              Prefects
            </h3>
          </li>
        </ul>
      </Reveal>
    </DcInner>
  </DcSection>
);
