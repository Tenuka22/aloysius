import * as stylex from "@stylexjs/stylex";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useState } from "react";

import {
  FACILITIES,
  FACILITIES_EYEBROW,
  FACILITIES_HEADING,
  FACILITIES_INTRO,
} from "../../content/academics";
import type { Facility } from "../../content/academics";
import { bp } from "../../tokens/breakpoints.stylex";
import {
  color,
  font,
  motionToken,
  shadow,
  space,
} from "../../tokens/tokens.stylex";
import { Container, Eyebrow, Heading, Section } from "../primitives/layout";
import { Media } from "../primitives/media";

const pad = (value: number) => String(value).padStart(2, "0");

const styles = stylex.create({
  header: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: space.lg,
    marginBlockEnd: space.xl,
  },
  intro: {
    margin: 0,
    maxWidth: "40ch",
    fontSize: font.sizeMd,
    lineHeight: font.leadingRelaxed,
    color: color.onInverseMuted,
    textWrap: "pretty",
  },
  /*
   * The list leads and the photograph follows on a phone; side by side with the
   * photograph sticky from 64rem, so it stays in view while a long list is
   * scrolled.
   */
  layout: {
    display: "grid",
    gap: space.xl,
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      [bp.xl]: "minmax(0, 1fr) minmax(0, 1.35fr)",
    },
    alignItems: "start",
  },
  list: {
    margin: 0,
    padding: 0,
    listStyle: "none",
    borderBlockStartWidth: space.px,
    borderBlockStartStyle: "solid",
    borderBlockStartColor: color.borderInverse,
  },
  item: {
    borderBlockEndWidth: space.px,
    borderBlockEndStyle: "solid",
    borderBlockEndColor: color.borderInverse,
  },
  /* A real button: hover previews, but click, Enter and Space all select. */
  pick: {
    display: "grid",
    gridTemplateColumns: "2.75rem minmax(0, 1fr) auto",
    gap: space.sm,
    alignItems: "baseline",
    inlineSize: "100%",
    minBlockSize: "2.75rem",
    paddingBlock: space.sm,
    paddingInlineEnd: 0,
    backgroundColor: "transparent",
    borderWidth: 0,
    color: color.onInverse,
    font: "inherit",
    textAlign: "start",
    cursor: "pointer",
    transitionProperty: "padding-inline-start",
    transitionDuration: motionToken.base,
    transitionTimingFunction: motionToken.ease,
  },
  pickIdle: {
    paddingInlineStart: 0,
  },
  pickActive: {
    paddingInlineStart: space.xs,
  },
  num: {
    fontFamily: font.mono,
    fontSize: font.size2xs,
  },
  numIdle: { color: color.onInverseSubtle },
  numActive: { color: color.accentOnInverse },
  name: {
    fontFamily: font.display,
    fontWeight: font.weightSemibold,
    lineHeight: font.leadingSnug,
    transitionProperty: "color, font-size",
    transitionDuration: motionToken.fast,
  },
  nameIdle: {
    fontSize: font.sizeXl,
    color: color.onInverseMuted,
  },
  nameActive: {
    fontSize: font.size2xl,
    color: color.accentOnInverse,
  },
  tag: {
    fontSize: font.size2xs,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingWider,
    textTransform: "uppercase",
    whiteSpace: "nowrap",
    color: color.onInverseSubtle,
  },

  stage: {
    position: {
      default: "static",
      [bp.xl]: "sticky",
    },
    insetBlockStart: space["3xl"],
  },
  frame: {
    position: "relative",
    overflow: "hidden",
    backgroundColor: color.surfaceInverse,
    boxShadow: shadow.md,
  },
  scrim: {
    position: "absolute",
    inset: 0,
    backgroundImage:
      "linear-gradient(180deg, rgba(4, 34, 10, 0) 40%, rgba(4, 34, 10, 0.94) 100%)",
    pointerEvents: "none",
  },
  badges: {
    position: "absolute",
    insetBlockStart: space.sm,
    insetInline: space.sm,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    pointerEvents: "none",
  },
  badgeTag: {
    paddingBlock: space["3xs"],
    paddingInline: space.xs,
    backgroundColor: color.accent,
    color: color.onAccent,
    fontSize: font.size2xs,
    fontWeight: font.weightExtrabold,
    letterSpacing: font.trackingWider,
    textTransform: "uppercase",
  },
  badgeCount: {
    fontFamily: font.mono,
    fontSize: font.sizeXs,
    color: color.onInverse,
  },
  caption: {
    position: "absolute",
    insetInline: space.md,
    insetBlockEnd: space.md,
    pointerEvents: "none",
  },
  captionName: {
    margin: 0,
    fontFamily: font.display,
    fontSize: font.size2xl,
    fontWeight: font.weightSemibold,
    lineHeight: font.leadingSnug,
    color: color.onInverse,
  },
  rule: {
    inlineSize: "2.75rem",
    blockSize: "2px",
    marginBlock: space.sm,
    backgroundColor: color.accent,
  },
  captionBody: {
    margin: 0,
    maxWidth: "46ch",
    fontSize: font.sizeSm,
    lineHeight: font.leadingRelaxed,
    color: color.onInverseMuted,
  },
  controls: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space.sm,
    marginBlockStart: space.sm,
  },
  hint: {
    fontSize: font.sizeXs,
    color: color.onInverseSubtle,
  },
  arrows: {
    display: "flex",
    gap: space.xs,
  },
  arrow: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    inlineSize: "2.75rem",
    blockSize: "2.75rem",
    backgroundColor: "transparent",
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: {
      default: color.borderInverse,
      ":hover": color.accent,
    },
    color: {
      default: color.onInverse,
      ":hover": color.accentOnInverse,
    },
    cursor: "pointer",
  },
});

/**
 * An interactive facilities list. Hover (or focus, click, Enter) on a row
 * previews it in the photograph panel beside it; the arrows step through the
 * list. The panel is announced politely so a screen-reader user hears which
 * facility is showing without losing their place in the list.
 */
export const FacilitiesShowcase = ({
  facilities = FACILITIES,
}: {
  facilities?: readonly Facility[];
}) => {
  const [index, setIndex] = useState(0);

  const count = facilities.length;
  const current = Math.min(index, Math.max(count - 1, 0));
  const active = facilities[current];
  if (!active) {
    return null;
  }

  return (
    <Section
      id="facilities"
      labelledBy="facilities-title"
      tone="inverseGradient"
    >
      <Container width="wide">
        <div {...stylex.props(styles.header)}>
          <div>
            <Eyebrow inverse>{FACILITIES_EYEBROW}</Eyebrow>
            <Heading id="facilities-title" level={2}>
              {FACILITIES_HEADING}
            </Heading>
          </div>
          <p {...stylex.props(styles.intro)}>{FACILITIES_INTRO}</p>
        </div>

        <div {...stylex.props(styles.layout)}>
          <ul {...stylex.props(styles.list)}>
            {facilities.map((facility, position) => {
              const on = position === current;
              return (
                <li key={facility.id} {...stylex.props(styles.item)}>
                  <button
                    aria-pressed={on}
                    onClick={() => setIndex(position)}
                    onMouseEnter={() => setIndex(position)}
                    type="button"
                    {...stylex.props(
                      styles.pick,
                      on ? styles.pickActive : styles.pickIdle
                    )}
                  >
                    <span
                      {...stylex.props(
                        styles.num,
                        on ? styles.numActive : styles.numIdle
                      )}
                    >
                      {pad(position + 1)}
                    </span>
                    <span
                      {...stylex.props(
                        styles.name,
                        on ? styles.nameActive : styles.nameIdle
                      )}
                    >
                      {facility.name}
                    </span>
                    <span {...stylex.props(styles.tag)}>{facility.tag}</span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div {...stylex.props(styles.stage)}>
            <div {...stylex.props(styles.frame)}>
              <Media
                placeholder={`${active.name} photograph`}
                ratio="4:5"
                source={active.image}
              />
              <div {...stylex.props(styles.scrim)} />
              <div {...stylex.props(styles.badges)}>
                <span {...stylex.props(styles.badgeTag)}>{active.tag}</span>
                <span {...stylex.props(styles.badgeCount)}>
                  {pad(current + 1)} / {pad(count)}
                </span>
              </div>
              <div aria-live="polite" {...stylex.props(styles.caption)}>
                <h3 {...stylex.props(styles.captionName)}>{active.name}</h3>
                <div {...stylex.props(styles.rule)} />
                <p {...stylex.props(styles.captionBody)}>
                  {active.description}
                </p>
              </div>
            </div>
            <div {...stylex.props(styles.controls)}>
              <span {...stylex.props(styles.hint)}>
                Select a facility to view it
              </span>
              <span {...stylex.props(styles.arrows)}>
                <button
                  aria-label="Previous facility"
                  onClick={() => setIndex((count + current - 1) % count)}
                  type="button"
                  {...stylex.props(styles.arrow)}
                >
                  <ArrowLeft aria-hidden="true" size={18} />
                </button>
                <button
                  aria-label="Next facility"
                  onClick={() => setIndex((current + 1) % count)}
                  type="button"
                  {...stylex.props(styles.arrow)}
                >
                  <ArrowRight aria-hidden="true" size={18} />
                </button>
              </span>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
};
