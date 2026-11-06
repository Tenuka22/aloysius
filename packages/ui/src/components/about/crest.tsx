import * as stylex from "@stylexjs/stylex";

import { CREST_HEADING, CREST_SYMBOLS } from "../../content/about";
import { bp } from "../../tokens/breakpoints.stylex";
import { font } from "../../tokens/tokens.stylex";
import { DcEyebrow, DcHeading, DcInner, DcSection } from "../home/dc";
import { Reveal } from "../primitives/reveal";

const styles = stylex.create({
  section: {
    borderBlockEndWidth: "1px",
    borderBlockEndStyle: "solid",
    borderBlockEndColor: "rgba(1, 52, 5, 0.1)",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 420px), 1fr))",
    gap: "clamp(40px, 6vw, 72px)",
    alignItems: "center",
  },
  crestWrap: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    paddingBlock: "24px",
  },
  crest: {
    display: "block",
    width: "100%",
    maxWidth: "340px",
    height: "auto",
  },
  column: {
    display: "flex",
    flexDirection: "column",
    gap: "28px",
  },
  eyebrow: {
    marginBlockEnd: 0,
  },
  heading: {
    lineHeight: 1.05,
  },
  ihs: {
    display: "flex",
    gap: "20px",
    alignItems: "baseline",
    paddingBlock: "22px",
    borderBlockStartWidth: "2px",
    borderBlockStartStyle: "solid",
    borderBlockStartColor: "#013405",
    borderBlockEndWidth: "1px",
    borderBlockEndStyle: "solid",
    borderBlockEndColor: "rgba(1, 52, 5, 0.15)",
  },
  ihsMark: {
    minWidth: "72px",
    fontFamily: font.display,
    fontWeight: 600,
    fontSize: "34px",
    color: "#013405",
  },
  ihsText: {
    margin: 0,
    fontSize: "15px",
    lineHeight: 1.6,
    color: "rgba(1, 52, 5, 0.8)",
  },
  symbols: {
    display: "grid",
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      [bp.md]: "repeat(2, minmax(0, 1fr))",
    },
    columnGap: "32px",
    margin: 0,
    padding: 0,
    listStyle: "none",
  },
  symbol: {
    display: "flex",
    gap: "16px",
    alignItems: "baseline",
    paddingBlock: "18px",
    borderBlockEndWidth: "1px",
    borderBlockEndStyle: "solid",
    borderBlockEndColor: "rgba(1, 52, 5, 0.15)",
  },
  symbolNo: {
    fontFamily: "ui-monospace, Menlo, monospace",
    fontSize: "12px",
    color: "#A51919",
  },
  symbolText: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  symbolName: {
    fontWeight: 700,
    fontSize: "16px",
    color: "#013405",
  },
  symbolMeaning: {
    fontSize: "14px",
    color: "rgba(1, 52, 5, 0.7)",
  },
});

/** The College crest and what each of its symbols stands for. */
export const Crest = ({
  heading = CREST_HEADING,
  crestSrc = "/logo.png",
}: {
  heading?: string;
  crestSrc?: string;
}) => (
  <DcSection
    id="crest"
    labelledBy="crest-title"
    style={styles.section}
    tone="cream"
  >
    <DcInner>
      <div {...stylex.props(styles.grid)}>
        <Reveal direction="up">
          <div {...stylex.props(styles.crestWrap)}>
            <img
              alt="St. Aloysius' College crest"
              decoding="async"
              loading="lazy"
              src={crestSrc}
              {...stylex.props(styles.crest)}
            />
          </div>
        </Reveal>

        <Reveal delay={1} direction="up">
          <div {...stylex.props(styles.column)}>
            <DcEyebrow style={styles.eyebrow}>The Crest</DcEyebrow>
            <DcHeading id="crest-title" style={styles.heading}>
              {heading}
            </DcHeading>
            <div {...stylex.props(styles.ihs)}>
              <span {...stylex.props(styles.ihsMark)}>IHS</span>
              <p {...stylex.props(styles.ihsText)}>
                <em>Iesus Hominum Salvator</em> &mdash; &ldquo;Jesus, Saviour of
                Mankind&rdquo;, at the centre of the crest.
              </p>
            </div>
            <ul {...stylex.props(styles.symbols)}>
              {CREST_SYMBOLS.map((symbol) => (
                <li key={symbol.no} {...stylex.props(styles.symbol)}>
                  <span {...stylex.props(styles.symbolNo)}>{symbol.no}</span>
                  <span {...stylex.props(styles.symbolText)}>
                    <span {...stylex.props(styles.symbolName)}>
                      {symbol.name}
                    </span>
                    <span {...stylex.props(styles.symbolMeaning)}>
                      {symbol.meaning}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </DcInner>
  </DcSection>
);
