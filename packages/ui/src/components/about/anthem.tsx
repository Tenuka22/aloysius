import * as stylex from "@stylexjs/stylex";
import { useState } from "react";

import {
  ANTHEM_CREDIT,
  ANTHEM_DESC,
  ANTHEM_IMAGE,
  ANTHEM_LANGUAGES,
  ANTHEM_TITLE,
} from "../../content/about";
import { bp } from "../../tokens/breakpoints.stylex";
import { color, font, motionToken, space } from "../../tokens/tokens.stylex";
import {
  Container,
  Eyebrow,
  Heading,
  Lead,
  Section,
} from "../primitives/layout";
import { Media } from "../primitives/media";
import type { ImageSource } from "../primitives/media";
import { Reveal } from "../primitives/reveal";

const PREVIEW_COUNT = 4;

const styles = stylex.create({
  inner: {
    marginInline: "auto",
    maxWidth: "48rem",
    textAlign: "center",
  },
  headingSpacing: {
    marginBlock: `${space.sm} ${space.md}`,
  },
  lead: {
    marginInline: "auto",
  },
  tabs: {
    display: "flex",
    justifyContent: "center",
    gap: space["3xs"],
    marginBlockStart: space.xl,
    marginBlockEnd: space.lg,
  },
  tab: {
    paddingBlock: space.xs,
    paddingInline: space.md,
    fontSize: font.sizeSm,
    fontWeight: font.weightSemibold,
    backgroundColor: color.placeholder,
    color: color.onSurfaceSubtle,
    borderWidth: 0,
    cursor: "pointer",
    transitionProperty: "background-color, color",
    transitionDuration: motionToken.fast,
  },
  tabActive: {
    backgroundColor: color.surfaceInverse,
    color: color.onInverse,
  },
  credit: {
    margin: 0,
    marginBlockEnd: space.lg,
    fontSize: font.sizeXs,
    fontStyle: "italic",
    color: color.onSurfaceSubtle,
  },
  image: {
    marginInline: "auto",
    marginBlockEnd: space.lg,
    maxWidth: "32rem",
  },
  lyricsWrap: {
    position: "relative",
    textAlign: "start",
  },
  lyrics: {
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: color.border,
    borderBlockStartWidth: "2px",
    borderBlockStartColor: color.accent,
    backgroundColor: color.surfaceRaised,
    padding: space.xl,
    columnGap: space.xl,
    columns: {
      default: "1",
      [bp.md]: "2",
    },
  },
  empty: {
    textAlign: "center",
    fontStyle: "italic",
    color: color.onSurfaceSubtle,
    paddingBlock: space.xl,
  },
  stanza: {
    display: "flex",
    gap: space.sm,
    breakInside: "avoid",
    paddingBlockEnd: space.md,
    marginBlockEnd: space.md,
    borderBlockEndWidth: space.px,
    borderBlockEndStyle: "solid",
    borderBlockEndColor: color.border,
  },
  stanzaNumber: {
    flexShrink: 0,
    width: "1.25rem",
    fontFamily: font.display,
    fontWeight: font.weightBold,
    fontSize: font.sizeSm,
    color: color.accent,
  },
  stanzaLine: {
    margin: 0,
    fontFamily: font.display,
    fontSize: font.sizeLg,
    lineHeight: font.leadingRelaxed,
    color: color.onSurfaceMuted,
  },
  fade: {
    position: "absolute",
    insetInline: 0,
    insetBlockEnd: 0,
    height: "7rem",
    backgroundImage: `linear-gradient(180deg, transparent, ${color.surfaceRaised})`,
    pointerEvents: "none",
  },
  expandButton: {
    display: "flex",
    width: "100%",
    justifyContent: "center",
    gap: space["2xs"],
    marginBlockStart: space.md,
    paddingBlock: space.sm,
    fontSize: font.sizeSm,
    fontWeight: font.weightSemibold,
    color: color.onSurfaceMuted,
    backgroundColor: "transparent",
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: color.border,
    cursor: "pointer",
  },
});

export const Anthem = ({
  title = ANTHEM_TITLE,
  description = ANTHEM_DESC,
  credit = ANTHEM_CREDIT,
  image = ANTHEM_IMAGE,
  languages = ANTHEM_LANGUAGES,
}: {
  title?: string;
  description?: string;
  credit?: string;
  image?: ImageSource;
  languages?: typeof ANTHEM_LANGUAGES;
}) => {
  const [activeLanguage, setActiveLanguage] = useState<"en" | "si">("en");
  const [expanded, setExpanded] = useState(false);

  const { stanzas } = languages[activeLanguage];
  const isLong = stanzas.length > PREVIEW_COUNT;
  const visibleStanzas =
    expanded || !isLong ? stanzas : stanzas.slice(0, PREVIEW_COUNT);

  return (
    <Section id="anthem" labelledBy="anthem-title" tone="raised">
      <Container>
        <div {...stylex.props(styles.inner)}>
          <Eyebrow>College Anthem</Eyebrow>
          <Heading id="anthem-title" style={styles.headingSpacing}>
            {title}
          </Heading>
          <Lead style={styles.lead}>{description}</Lead>

          <Reveal direction="up">
            <div role="tablist" {...stylex.props(styles.tabs)}>
              {Object.entries(languages).map(([code, language]) => (
                <button
                  aria-selected={activeLanguage === code}
                  key={code}
                  onClick={() => {
                    setActiveLanguage(code as "en" | "si");
                    setExpanded(false);
                  }}
                  role="tab"
                  type="button"
                  {...stylex.props(
                    styles.tab,
                    activeLanguage === code && styles.tabActive
                  )}
                >
                  {language.label}
                </button>
              ))}
            </div>

            <Media
              placeholder="Anthem creators"
              ratio="3:2"
              source={image}
              style={styles.image}
            />
            <p {...stylex.props(styles.credit)}>{credit}</p>

            <div {...stylex.props(styles.lyricsWrap)}>
              <div {...stylex.props(styles.lyrics)}>
                {stanzas.length === 0 ? (
                  <p {...stylex.props(styles.empty)}>
                    Lyrics for this language are coming soon.
                  </p>
                ) : (
                  visibleStanzas.map((stanza) => (
                    <div {...stylex.props(styles.stanza)} key={stanza.id}>
                      <span {...stylex.props(styles.stanzaNumber)}>
                        {stanza.id}
                      </span>
                      <div>
                        {stanza.lines.map((line) => (
                          <p {...stylex.props(styles.stanzaLine)} key={line}>
                            {line}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
              {isLong && !expanded ? (
                <div aria-hidden="true" {...stylex.props(styles.fade)} />
              ) : null}
            </div>

            {isLong ? (
              <button
                onClick={() => setExpanded((value) => !value)}
                type="button"
                {...stylex.props(styles.expandButton)}
              >
                {expanded
                  ? "Show fewer verses"
                  : `Read full anthem (${stanzas.length} verses)`}
              </button>
            ) : null}
          </Reveal>
        </div>
      </Container>
    </Section>
  );
};
