import * as stylex from "@stylexjs/stylex";
import { useId } from "react";

import type { PrincipalContent } from "../../content/principal";
import { sanitizeRichText } from "../../lib/sanitize-rich-text";
import { aspectRatios } from "../../tokens/aspect-ratios";
import { bp } from "../../tokens/breakpoints.stylex";
import { color, font, space } from "../../tokens/tokens.stylex";
import { ArrowLink } from "../primitives/button";
import { Container, Eyebrow, Heading, Section } from "../primitives/layout";
import type { Tone } from "../primitives/layout";
import { Media } from "../primitives/media";
import { Reveal } from "../primitives/reveal";

const styles = stylex.create({
  grid: {
    display: "grid",
    gap: space.xl,
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      [bp.xl]: "minmax(0, 21rem) minmax(0, 1fr)",
    },
    alignItems: "center",
  },
  portraitWrap: {
    position: "relative",
    // The offset gold frame only reads on a wide layout; on a phone it would
    // sit on top of the copy.
    paddingInlineEnd: {
      default: 0,
      [bp.xl]: space["2xs"],
    },
    paddingBlockEnd: {
      default: 0,
      [bp.xl]: space["2xs"],
    },
    maxWidth: {
      default: "22rem",
      [bp.xl]: "none",
    },
  },
  frame: {
    display: {
      default: "none",
      [bp.xl]: "block",
    },
    position: "absolute",
    insetBlockStart: space["2xs"],
    insetInlineStart: space["2xs"],
    insetBlockEnd: 0,
    insetInlineEnd: 0,
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: color.accent,
    pointerEvents: "none",
  },
  portrait: {
    position: "relative",
  },
  headingSpacing: {
    marginBlock: `${space.sm} ${space.md}`,
  },
  /**
   * The pull-quote treatment, used when the block has no heading. Capped at the
   * readable measure so a long message wraps into a paragraph-shaped block
   * instead of running the full width of a wide desktop column.
   */
  quote: {
    margin: 0,
    marginBlock: `${space.sm} ${space.md}`,
    maxWidth: "26ch",
    fontFamily: font.display,
    fontSize: font.size2xl,
    fontWeight: font.weightMedium,
    lineHeight: font.leadingSnug,
    textWrap: "pretty",
  },
  /**
   * Container for the sanitised full message.
   *
   * The styles for the elements *inside* it cannot be StyleX, because they
   * arrive as an HTML string rather than as React elements. Those live in
   * `rich-text.css`, scoped to `[data-rich-text]`, so the same rules style the
   * editor and the published page from one place.
   */
  richText: {
    maxWidth: space.measure,
    color: color.onSurfaceMuted,
  },
  attribution: {
    margin: 0,
    fontFamily: font.display,
    fontStyle: "italic",
    fontSize: font.sizeXl,
    color: color.onSurfaceMuted,
  },
  role: {
    margin: 0,
    marginBlock: `${space["3xs"]} ${space.lg}`,
    fontSize: font.size2xs,
    fontWeight: font.weightSemibold,
    letterSpacing: font.trackingWider,
    textTransform: "uppercase",
    color: color.onSurfaceSubtle,
  },
});

/**
 * The Principal's message and portrait — the site's one shared section for
 * both. The homepage and the About page render this same component from the
 * same CMS block, so an editor writes the message once.
 *
 * `variant` is the *page's* choice of how to set the message, and is
 * deliberately not inferred from the content: the homepage sets it as a
 * display-serif pull quote, the About page as body copy under the heading. If
 * this were decided by whether a heading happened to be filled in, an editor
 * clearing the heading on the About page would silently restyle it.
 */
export const PrincipalMessage = ({
  content,
  variant = "quote",
  id,
  tone = "raised",
}: {
  content: PrincipalContent;
  /** `quote` sets the message as a pull quote; `article` under the heading. */
  variant?: "quote" | "article";
  /** Anchor id for the section, e.g. `principal` for the About page's in-page nav. */
  id?: string;
  tone?: Tone;
}) => {
  const titleId = useId();
  const { eyebrow, heading, quote, body, name, role, portrait, link } = content;
  const asArticle = variant === "article";

  return (
    <Section id={id} labelledBy={titleId} tone={tone}>
      <Container>
        <div {...stylex.props(styles.grid)}>
          <Reveal direction="up">
            <div {...stylex.props(styles.portraitWrap)}>
              <Media
                placeholder="Principal portrait"
                ratio={aspectRatios.principalPortrait}
                source={portrait}
                style={styles.portrait}
              />
              <div {...stylex.props(styles.frame)} />
            </div>
          </Reveal>

          <Reveal delay={1} direction="up">
            <div>
              <Eyebrow>{eyebrow}</Eyebrow>
              {asArticle && heading ? (
                <>
                  <Heading id={titleId} level={2} style={styles.headingSpacing}>
                    {heading}
                  </Heading>
                  {/*
                   * The only `dangerouslySetInnerHTML` on the public site, and
                   * the only place rich text is rendered. `body` comes from the
                   * CMS, so it is sanitised here rather than trusted — see
                   * `lib/sanitize-rich-text.ts`. Sanitising on every render is
                   * deliberate: it is a pure string pass, and it means the page
                   * cannot render unsanitised HTML if a value ever arrives by a
                   * route that skipped the editor.
                   */}
                  <div
                    data-rich-text=""
                    {...stylex.props(styles.richText)}
                    // oxlint-disable-next-line react/no-danger -- the value is sanitised immediately above by an allowlist pass
                    dangerouslySetInnerHTML={{ __html: sanitizeRichText(body) }}
                  />
                </>
              ) : (
                <blockquote {...stylex.props(styles.quote)} id={titleId}>
                  &ldquo;{quote}&rdquo;
                </blockquote>
              )}
              {name ? (
                <p {...stylex.props(styles.attribution)}>&mdash; {name}</p>
              ) : null}
              <p {...stylex.props(styles.role)}>{role}</p>
              {link ? (
                <ArrowLink href={link.href}>{link.label}</ArrowLink>
              ) : null}
            </div>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
};
