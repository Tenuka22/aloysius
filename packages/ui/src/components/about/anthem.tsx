import * as stylex from "@stylexjs/stylex";
import { useRef, useState } from "react";
import type { KeyboardEvent } from "react";

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
    flexWrap: "wrap",
    justifyContent: "center",
    gap: space["3xs"],
    marginBlockStart: space.xl,
    marginBlockEnd: space.lg,
  },
  tab: {
    // 44px minimum so the language switch is comfortable on touch displays,
    // kiosks and smart boards (WCAG 2.2 SC 2.5.8 clears at 24px; this is the
    // comfort target).
    minBlockSize: "2.75rem",
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
    padding: {
      default: space.md,
      [bp.md]: space.xl,
    },
    columnGap: space.xl,
  },
  /*
   * Two columns only once the full text is on screen. While the verses are
   * truncated, a second column asks the reader to go down, back up, and then
   * down again into a block that is cut off mid-way - so the preview stays
   * single-column and the layout widens on expand.
   */
  lyricsColumns: {
    columns: {
      default: "1",
      [bp.lg]: "2",
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
    // Gold text on the cream surface is ~1.9:1 - crimson is the accent colour
    // that passes on this background.
    color: color.accentOnSurface,
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
    minBlockSize: "2.75rem",
    alignItems: "center",
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
  sinhalaImage = ANTHEM_IMAGE,
  languages = ANTHEM_LANGUAGES,
}: {
  title?: string;
  description?: string;
  credit?: string;
  image?: ImageSource;
  sinhalaImage?: ImageSource;
  languages?: typeof ANTHEM_LANGUAGES;
}) => {
  const [activeLanguage, setActiveLanguage] = useState<"en" | "si">("en");
  const [expanded, setExpanded] = useState(false);
  const tablistRef = useRef<HTMLDivElement>(null);

  const codes = Object.keys(languages) as ("en" | "si")[];

  /**
   * `role="tablist"` is a promise that arrow keys move between the tabs and
   * that Home/End jump to the ends; without it the pattern is worse for
   * keyboard users than plain buttons would have been (WCAG 2.2 SC 2.1.1 plus
   * the APG tabs pattern). Focus follows selection, which is correct here
   * because switching panels is instant and has no side effects.
   */
  const onTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const index = codes.indexOf(activeLanguage);
    let next = index;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      next = (index + 1) % codes.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      next = (index - 1 + codes.length) % codes.length;
    } else if (event.key === "Home") {
      next = 0;
    } else if (event.key === "End") {
      next = codes.length - 1;
    } else {
      return;
    }
    const code = codes[next];
    if (!code) {
      return;
    }
    event.preventDefault();
    setActiveLanguage(code);
    setExpanded(false);
    tablistRef.current
      ?.querySelector<HTMLButtonElement>(`#anthem-tab-${code}`)
      ?.focus();
  };

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
            <div
              aria-label="Anthem language"
              ref={tablistRef}
              role="tablist"
              {...stylex.props(styles.tabs)}
            >
              {codes.map((code) => {
                const selected = activeLanguage === code;
                return (
                  <button
                    aria-controls="anthem-lyrics"
                    aria-selected={selected}
                    id={`anthem-tab-${code}`}
                    key={code}
                    lang={code}
                    onClick={() => {
                      setActiveLanguage(code);
                      setExpanded(false);
                    }}
                    onKeyDown={onTabKeyDown}
                    role="tab"
                    tabIndex={selected ? 0 : -1}
                    type="button"
                    {...stylex.props(styles.tab, selected && styles.tabActive)}
                  >
                    {languages[code].label}
                  </button>
                );
              })}
            </div>

            <Media
              placeholder="Anthem creators"
              ratio="3:2"
              source={activeLanguage === "si" ? sinhalaImage : image}
              style={styles.image}
            />
            <p {...stylex.props(styles.credit)}>{credit}</p>

            <div
              aria-labelledby={`anthem-tab-${activeLanguage}`}
              id="anthem-lyrics"
              lang={activeLanguage}
              role="tabpanel"
              tabIndex={0}
              {...stylex.props(styles.lyricsWrap)}
            >
              <div
                {...stylex.props(
                  styles.lyrics,
                  (expanded || !isLong) && styles.lyricsColumns
                )}
              >
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
                aria-controls="anthem-lyrics"
                aria-expanded={expanded}
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
