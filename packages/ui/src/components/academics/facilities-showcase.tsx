import * as stylex from "@stylexjs/stylex";
import { useState } from "react";

import {
  FACILITIES,
  FACILITIES_EYEBROW,
  FACILITIES_HEADING_LINES,
  FACILITIES_INTRO,
} from "../../content/academics";
import type { Facility } from "../../content/academics";
import { bp } from "../../tokens/breakpoints.stylex";
import { font } from "../../tokens/tokens.stylex";
import { DcInner, DcSection, DcSlot } from "../home/dc";

const MONO = "ui-monospace, Menlo, monospace";

const pad = (value: number) => String(value).padStart(2, "0");

/*
 * Measurements are the approved design's (Academics.dc.html): 130px section
 * padding, a 1240px inner, a 1 / 1.35 two-column layout, 17px list rows and a
 * sticky 4:5 stage with every photograph stacked and cross-faded.
 */
const styles = stylex.create({
  section: {
    backgroundColor: "#04220A",
    paddingBlock: "clamp(72px, 11vw, 130px)",
  },
  watermark: {
    position: "absolute",
    insetInlineStart: "-160px",
    insetBlockEnd: "-200px",
    height: "620px",
    width: "auto",
    opacity: 0.045,
    pointerEvents: "none",
    display: {
      default: "none",
      [bp.md]: "block",
    },
  },
  inner: {
    maxWidth: "1240px",
  },
  header: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: "32px",
    marginBlockEnd: "clamp(40px, 5vw, 64px)",
  },
  eyebrow: {
    display: "block",
    margin: 0,
    marginBlockEnd: "20px",
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.46em",
    textTransform: "uppercase",
    color: "#FFB203",
  },
  heading: {
    margin: 0,
    fontFamily: font.display,
    fontWeight: 600,
    fontSize: "clamp(40px, 5.4vw, 72px)",
    lineHeight: 1,
  },
  headingEmphasis: {
    display: "block",
    fontStyle: "italic",
    fontWeight: 500,
    color: "#FFB203",
  },
  intro: {
    margin: 0,
    maxWidth: "40ch",
    fontSize: "15.5px",
    lineHeight: 1.75,
    color: "rgba(255, 248, 231, 0.7)",
  },
  layout: {
    display: "grid",
    gap: "clamp(32px, 5vw, 72px)",
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      [bp.xl]: "minmax(0, 1fr) minmax(0, 1.35fr)",
    },
    alignItems: "start",
  },
  list: {
    display: "flex",
    flexDirection: "column",
    margin: 0,
    padding: 0,
    listStyle: "none",
    borderBlockStartWidth: "1px",
    borderBlockStartStyle: "solid",
    borderBlockStartColor: "rgba(255, 248, 231, 0.14)",
  },
  item: {
    borderBlockEndWidth: "1px",
    borderBlockEndStyle: "solid",
    borderBlockEndColor: "rgba(255, 248, 231, 0.14)",
  },
  /* A real button: hover previews, but click, Enter and Space all select. */
  pick: {
    display: "grid",
    gridTemplateColumns: "44px minmax(0, 1fr) auto",
    gap: "18px",
    alignItems: "baseline",
    inlineSize: "100%",
    paddingBlock: "17px",
    paddingInlineEnd: 0,
    backgroundColor: "transparent",
    borderWidth: 0,
    color: "inherit",
    font: "inherit",
    textAlign: "start",
    cursor: "pointer",
    transitionProperty: "padding-inline-start",
    transitionDuration: "0.35s",
    transitionTimingFunction: "ease",
  },
  pickIdle: {
    paddingInlineStart: "0px",
  },
  pickActive: {
    paddingInlineStart: "14px",
  },
  num: {
    fontFamily: MONO,
    fontSize: "11px",
    letterSpacing: "0.06em",
  },
  numIdle: { color: "rgba(255, 248, 231, 0.4)" },
  numActive: { color: "#FFB203" },
  name: {
    fontFamily: font.display,
    fontWeight: 600,
    lineHeight: 1.1,
    transitionProperty: "color, font-size",
    transitionDuration: "0.3s",
    transitionTimingFunction: "ease",
  },
  nameIdle: {
    fontSize: "24px",
    color: "rgba(255, 248, 231, 0.78)",
  },
  nameActive: {
    fontSize: "30px",
    color: "#FFB203",
  },
  tag: {
    fontSize: "9.5px",
    fontWeight: 700,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    whiteSpace: "nowrap",
  },
  tagIdle: { color: "rgba(255, 248, 231, 0.32)" },
  tagActive: { color: "rgba(255, 248, 231, 0.75)" },

  stage: {
    position: {
      default: "static",
      [bp.xl]: "sticky",
    },
    insetBlockStart: "110px",
  },
  frame: {
    position: "relative",
    overflow: "hidden",
    aspectRatio: "4 / 5",
    maxHeight: "680px",
    width: "100%",
    backgroundColor: "#013405",
    boxShadow: "0 40px 80px -30px rgba(0, 0, 0, 0.6)",
  },
  layer: {
    position: "absolute",
    inset: 0,
    transitionProperty: "opacity",
    transitionDuration: "0.6s",
    transitionTimingFunction: "ease",
  },
  layerOn: { opacity: 1 },
  layerOff: { opacity: 0, pointerEvents: "none" },
  photo: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
  },
  scrim: {
    position: "absolute",
    inset: 0,
    backgroundImage:
      "linear-gradient(180deg, rgba(4, 34, 10, 0) 45%, rgba(4, 34, 10, 0.94) 100%)",
    pointerEvents: "none",
  },
  badges: {
    position: "absolute",
    insetBlockStart: "22px",
    insetInline: "22px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    pointerEvents: "none",
  },
  badgeTag: {
    paddingBlock: "6px",
    paddingInline: "12px",
    backgroundColor: "#FFB203",
    color: "#013405",
    fontSize: "10px",
    fontWeight: 800,
    letterSpacing: "0.22em",
    textTransform: "uppercase",
  },
  badgeCount: {
    fontFamily: MONO,
    fontSize: "12px",
    color: "rgba(255, 248, 231, 0.85)",
  },
  caption: {
    position: "absolute",
    insetInline: "clamp(20px, 3vw, 34px)",
    insetBlockEnd: "clamp(20px, 3vw, 32px)",
    pointerEvents: "none",
  },
  captionName: {
    margin: 0,
    fontFamily: font.display,
    fontSize: "clamp(30px, 3.2vw, 46px)",
    fontWeight: 600,
    lineHeight: 1.05,
  },
  rule: {
    inlineSize: "44px",
    blockSize: "2px",
    marginBlock: "18px 14px",
    backgroundColor: "#FFB203",
  },
  captionBody: {
    margin: 0,
    maxWidth: "46ch",
    fontSize: "15px",
    lineHeight: 1.65,
    color: "rgba(255, 248, 231, 0.82)",
  },
  controls: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
    marginBlockStart: "18px",
  },
  hint: {
    fontSize: "12px",
    letterSpacing: "0.08em",
    color: "rgba(255, 248, 231, 0.5)",
  },
  arrows: {
    display: "flex",
    gap: "8px",
  },
  arrow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    inlineSize: "42px",
    blockSize: "42px",
    padding: 0,
    backgroundColor: "transparent",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: {
      default: "rgba(255, 248, 231, 0.3)",
      ":hover": "#FFB203",
    },
    color: {
      default: "#FFF8E7",
      ":hover": "#FFB203",
    },
    font: "inherit",
    cursor: "pointer",
  },
});

/**
 * An interactive facilities list. Hover (or focus, click, Enter) on a row
 * previews it in the photograph panel beside it; the arrows step through the
 * list. Every photograph is stacked in the panel and cross-faded, as in the
 * design. The panel is announced politely so a screen-reader user hears which
 * facility is showing without losing their place in the list.
 *
 * `facilities` is CMS content - the `facility` table edited at
 * `/cms/facilities` - including each row's own photograph; a facility with
 * no photograph published yet falls back to its own placeholder rather than
 * dropping out of the showcase. Defaults to the shipped `FACILITIES` list so
 * the section still renders before the CMS data has loaded.
 */
export const FacilitiesShowcase = ({
  facilities = FACILITIES,
  crestSrc = "/logo.png",
}: {
  facilities?: readonly Facility[];
  crestSrc?: string;
}) => {
  const [index, setIndex] = useState(0);

  const count = facilities.length;
  const current = Math.min(index, Math.max(count - 1, 0));
  const active = facilities[current];
  if (!active) {
    return null;
  }

  const [firstLine, secondLine] = FACILITIES_HEADING_LINES;

  return (
    <DcSection
      id="facilities"
      labelledBy="facilities-title"
      style={styles.section}
      tone="green"
    >
      <img
        alt=""
        aria-hidden="true"
        decoding="async"
        loading="lazy"
        src={crestSrc}
        {...stylex.props(styles.watermark)}
      />
      <DcInner style={styles.inner}>
        <div {...stylex.props(styles.header)}>
          <div>
            <p {...stylex.props(styles.eyebrow)}>{FACILITIES_EYEBROW}</p>
            <h2 id="facilities-title" {...stylex.props(styles.heading)}>
              {firstLine}{" "}
              <em {...stylex.props(styles.headingEmphasis)}>{secondLine}</em>
            </h2>
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
                    <span
                      {...stylex.props(
                        styles.tag,
                        on ? styles.tagActive : styles.tagIdle
                      )}
                    >
                      {facility.tag}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div {...stylex.props(styles.stage)}>
            <div {...stylex.props(styles.frame)}>
              {facilities.map((facility, position) => (
                <div
                  aria-hidden={position !== current}
                  key={facility.id}
                  {...stylex.props(
                    styles.layer,
                    position === current ? styles.layerOn : styles.layerOff
                  )}
                >
                  <DcSlot
                    inverse
                    placeholder={`${facility.name} photograph`}
                    source={facility.image}
                    style={styles.photo}
                  />
                </div>
              ))}
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
                Hover or select a facility to view it
              </span>
              <span {...stylex.props(styles.arrows)}>
                <button
                  aria-label="Previous facility"
                  onClick={() => setIndex((count + current - 1) % count)}
                  type="button"
                  {...stylex.props(styles.arrow)}
                >
                  <span aria-hidden="true">←</span>
                </button>
                <button
                  aria-label="Next facility"
                  onClick={() => setIndex((current + 1) % count)}
                  type="button"
                  {...stylex.props(styles.arrow)}
                >
                  <span aria-hidden="true">→</span>
                </button>
              </span>
            </div>
          </div>
        </div>
      </DcInner>
    </DcSection>
  );
};
