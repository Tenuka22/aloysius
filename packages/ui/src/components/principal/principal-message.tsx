import * as stylex from "@stylexjs/stylex";
import { useId } from "react";

import type { PrincipalContent } from "../../content/principal";
import { sanitizeRichText } from "../../lib/sanitize-rich-text";
import { bp } from "../../tokens/breakpoints.stylex";
import { font } from "../../tokens/tokens.stylex";
import {
  DcEyebrow,
  DcHeading,
  DcInner,
  DcLink,
  DcSection,
  DcSlot,
} from "../home/dc";
import { Reveal } from "../primitives/reveal";

/** The About page's take on the section, to the approved UI/UX design. */
const about = stylex.create({
  grid: {
    display: "grid",
    gap: "48px 72px",
    alignItems: "center",
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      [bp.lg]: "minmax(0, 340px) minmax(0, 1fr)",
    },
  },
  portraitWrap: {
    position: "relative",
    isolation: "isolate",
    maxWidth: {
      default: "340px",
      [bp.lg]: "none",
    },
  },
  portrait: {
    width: "100%",
    aspectRatio: "3 / 4",
  },
  frame: {
    position: "absolute",
    insetInlineEnd: "-14px",
    insetBlockEnd: "-14px",
    width: "100%",
    height: "100%",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "#FFB203",
    zIndex: -1,
    pointerEvents: "none",
    display: {
      default: "none",
      [bp.md]: "block",
    },
  },
  eyebrow: {
    marginBlockEnd: "18px",
  },
  heading: {
    marginBlockEnd: "24px",
    fontSize: "clamp(32px, 3.7vw, 44px)",
    lineHeight: 1.2,
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
    marginBlockEnd: "26px",
    fontSize: "16px",
    lineHeight: 1.75,
    color: "rgba(1, 52, 5, 0.8)",
    textWrap: "pretty",
  },
  name: {
    margin: 0,
    fontFamily: font.display,
    fontStyle: "italic",
    fontSize: "28px",
    color: "rgba(1, 52, 5, 0.5)",
  },
});

const home = stylex.create({
  section: {
    paddingBlock: "clamp(61px, 10vw, 110px)",
  },
  grid: {
    display: "grid",
    gap: "48px 72px",
    alignItems: "center",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))",
  },
  portraitWrap: {
    position: "relative",
    isolation: "isolate",
    maxWidth: "340px",
  },
  portrait: {
    width: "100%",
    aspectRatio: "3 / 4",
  },
  frame: {
    position: "absolute",
    insetInlineEnd: "-14px",
    insetBlockEnd: "-14px",
    width: "100%",
    height: "100%",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "#FFB203",
    zIndex: -1,
    pointerEvents: "none",
    display: {
      default: "none",
      [bp.md]: "block",
    },
  },
  eyebrow: {
    marginBlockEnd: "18px",
  },
  quote: {
    margin: 0,
    marginBlockEnd: "26px",
    fontFamily: font.display,
    fontSize: "32px",
    fontWeight: 500,
    lineHeight: 1.35,
    textWrap: "pretty",
  },
  name: {
    margin: 0,
    fontFamily: font.display,
    fontStyle: "italic",
    fontSize: "28px",
    color: "rgba(1, 52, 5, 0.5)",
  },
  role: {
    margin: 0,
    marginBlock: "6px 30px",
    fontSize: "12px",
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: "rgba(1, 52, 5, 0.72)",
  },
});

/** The homepage's take on the section, to the approved UI/UX design. */
const HomePrincipal = ({
  content,
  id,
  titleId,
}: {
  content: PrincipalContent;
  id?: string;
  titleId: string;
}) => {
  const { eyebrow, quote, name, role, portrait, link } = content;
  return (
    <DcSection id={id} labelledBy={titleId} style={home.section} tone="raised">
      <DcInner narrow>
        <div {...stylex.props(home.grid)}>
          <Reveal direction="up">
            <div {...stylex.props(home.portraitWrap)}>
              <DcSlot
                placeholder="Principal portrait"
                source={portrait}
                style={home.portrait}
              />
              <div aria-hidden="true" {...stylex.props(home.frame)} />
            </div>
          </Reveal>

          <Reveal delay={1} direction="up">
            <div>
              <DcEyebrow style={home.eyebrow}>{eyebrow}</DcEyebrow>
              <blockquote {...stylex.props(home.quote)} id={titleId}>
                &ldquo;{quote}&rdquo;
              </blockquote>
              {name ? <p {...stylex.props(home.name)}>&mdash; {name}</p> : null}
              <p {...stylex.props(home.role)}>{role}</p>
              {link ? (
                <DcLink href={link.href}>
                  {link.label} <span aria-hidden="true">→</span>
                </DcLink>
              ) : null}
            </div>
          </Reveal>
        </div>
      </DcInner>
    </DcSection>
  );
};
/**
 * The Principal's message and portrait - the site's one shared section for
 * both. The homepage and the About page render this same component from the
 * same CMS block, so an editor writes the message once.
 *
 * `variant` is the *page's* choice of how to set the message, and is
 * deliberately not inferred from the content: the homepage sets it as a
 * display-serif pull quote, the About page as body copy under the heading.
 */
export const PrincipalMessage = ({
  content,
  variant = "quote",
  id,
}: {
  content: PrincipalContent;
  /** `quote` sets the message as a pull quote; `article` under the heading. */
  variant?: "quote" | "article";
  /** Anchor id for the section, e.g. `principal` for the About page's in-page nav. */
  id?: string;
}) => {
  const titleId = useId();
  const { heading, quote, body, name, portrait } = content;

  if (variant === "quote") {
    return <HomePrincipal content={content} id={id} titleId={titleId} />;
  }

  return (
    <DcSection id={id} labelledBy={titleId} tone="cream">
      <DcInner narrow>
        <div {...stylex.props(about.grid)}>
          <Reveal direction="up">
            <div {...stylex.props(about.portraitWrap)}>
              <DcSlot
                placeholder="Principal portrait"
                source={portrait}
                style={about.portrait}
              />
              <div aria-hidden="true" {...stylex.props(about.frame)} />
            </div>
          </Reveal>

          <Reveal delay={1} direction="up">
            <div>
              <DcEyebrow style={about.eyebrow}>
                Principal&rsquo;s Message
              </DcEyebrow>
              <DcHeading id={titleId} style={about.heading}>
                {heading ?? "A Word from the Principal"}
              </DcHeading>
              {/*
               * The only `dangerouslySetInnerHTML` on the public site, and
               * the only place rich text is rendered. `body` comes from the
               * CMS, so it is sanitised here rather than trusted - see
               * `lib/sanitize-rich-text.ts`. Sanitising on every render is
               * deliberate: it is a pure string pass, and it means the page
               * cannot render unsanitised HTML if a value ever arrives by a
               * route that skipped the editor.
               */}
              <div
                data-rich-text=""
                {...stylex.props(about.richText)}
                // oxlint-disable-next-line react/no-danger -- the value is sanitised immediately above by an allowlist pass
                dangerouslySetInnerHTML={{
                  __html: sanitizeRichText(body || `<p>${quote}</p>`),
                }}
              />
              {name ? (
                <p {...stylex.props(about.name)}>&mdash; {name}</p>
              ) : null}
            </div>
          </Reveal>
        </div>
      </DcInner>
    </DcSection>
  );
};
