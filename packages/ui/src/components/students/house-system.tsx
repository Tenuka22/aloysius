import * as stylex from "@stylexjs/stylex";

import {
  HOUSES,
  HOUSES_EYEBROW,
  HOUSES_HEADING,
  HOUSES_INTRO,
} from "../../content/students";
import type { House } from "../../content/students";
import { color, font, palette, space } from "../../tokens/tokens.stylex";
import {
  Container,
  Eyebrow,
  Heading,
  Lead,
  Section,
} from "../primitives/layout";
import { Reveal } from "../primitives/reveal";

const styles = stylex.create({
  grid: {
    display: "grid",
    listStyle: "none",
    margin: 0,
    marginBlockStart: space["2xl"],
    padding: 0,
    // Four across on a laptop, two on a tablet, one on a phone - without a
    // breakpoint for each, and it keeps filling sensibly on an ultra-wide panel.
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 13rem), 1fr))",
    gap: space.md,
  },
  cell: {
    blockSize: "100%",
  },
  card: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: space["2xs"],
    blockSize: "100%",
    // The mock's fixed `44px 24px` is most of the cell at 320px.
    paddingBlock: space.xl,
    paddingInline: space.md,
    textAlign: "center",
    backgroundColor: color.surface,
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: color.borderStrong,
  },
  /*
   * The rotated diamond from the design. Purely decorative: the house's
   * identity is carried by the text below it, never by this colour alone
   * (WCAG 2.2 SC 1.4.1), so it is `aria-hidden` at the call site.
   */
  swatch: {
    inlineSize: "3.25rem",
    blockSize: "3.25rem",
    marginBlockEnd: space["2xs"],
    transform: "rotate(45deg)",
    flexShrink: 0,
  },
  swatchCrimson: { backgroundColor: palette.crimson },
  swatchGold: { backgroundColor: palette.gold },
  swatchGreen: { backgroundColor: palette.greenDeep },
  /*
   * The one house colour with no brand equivalent - it is school data, not a
   * palette entry, which is why it is a literal here rather than a token.
   */
  swatchBlue: { backgroundColor: "#3b5ba5" },

  name: {
    margin: 0,
    fontFamily: font.display,
    fontSize: font.sizeXl,
    fontWeight: font.weightSemibold,
    lineHeight: font.leadingSnug,
    color: color.onSurface,
    textWrap: "balance",
  },
  colorName: {
    margin: 0,
    fontSize: font.size2xs,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingWider,
    textTransform: "uppercase",
    color: color.onSurfaceSubtle,
  },
  heading: {
    marginBlockEnd: space.sm,
  },
});

const SWATCH_STYLES = {
  crimson: styles.swatchCrimson,
  gold: styles.swatchGold,
  green: styles.swatchGreen,
  blue: styles.swatchBlue,
} as const;

export const HouseSystem = ({
  houses = HOUSES,
}: {
  houses?: readonly House[];
}) => (
  <Section id="houses" labelledBy="houses-title" tone="raised">
    <Container>
      <Eyebrow>{HOUSES_EYEBROW}</Eyebrow>
      <Heading id="houses-title" level={2} style={styles.heading}>
        {HOUSES_HEADING}
      </Heading>
      <Lead>{HOUSES_INTRO}</Lead>

      <ul {...stylex.props(styles.grid)}>
        {houses.map((house) => (
          <li key={house.id} {...stylex.props(styles.cell)}>
            <Reveal direction="up" style={styles.cell}>
              <div {...stylex.props(styles.card)}>
                <span
                  aria-hidden="true"
                  {...stylex.props(styles.swatch, SWATCH_STYLES[house.swatch])}
                />
                {/*
                  Until the college publishes the roster the colour name *is*
                  the house's name here - promoted to the heading so every card
                  is announced by real text. A published name takes its place;
                  neither case invents one.
                */}
                {house.name ? (
                  <>
                    <h3 {...stylex.props(styles.name)}>{house.name}</h3>
                    <p {...stylex.props(styles.colorName)}>{house.colorName}</p>
                  </>
                ) : (
                  <h3 {...stylex.props(styles.name)}>{house.colorName}</h3>
                )}
              </div>
            </Reveal>
          </li>
        ))}
      </ul>
    </Container>
  </Section>
);
