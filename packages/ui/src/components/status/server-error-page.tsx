import * as stylex from "@stylexjs/stylex";

import { bp } from "../../tokens/breakpoints.stylex";
import { color, font, space } from "../../tokens/tokens.stylex";
import { ServerErrorArt } from "./status-illustration";
import { StatusPage } from "./status-page";

const blink = stylex.keyframes({
  "0%, 100%": { opacity: 1 },
  "50%": { opacity: 0.25 },
});

const styles = stylex.create({
  reference: {
    display: "inline-flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: space["2xs"],
    paddingBlock: space["2xs"],
    paddingInline: space.sm,
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: color.borderInverse,
    fontFamily: font.mono,
    fontSize: font.sizeXs,
    lineHeight: font.leadingNormal,
    color: color.onInverseSubtle,
    // The support team will ask for this, so it must be selectable on touch.
    userSelect: "text",
    maxInlineSize: "100%",
    // A long generated id must wrap, not push the layout wider.
    overflowWrap: "anywhere",
    textAlign: {
      default: "center",
      [bp.xl]: "start",
    },
  },
  dot: {
    inlineSize: "0.4375rem",
    blockSize: "0.4375rem",
    borderRadius: "50%",
    backgroundColor: color.dangerBright,
    flexShrink: 0,
    animationName: {
      default: blink,
      [bp.reducedMotion]: "none",
    },
    animationDuration: "1.4s",
    animationTimingFunction: "ease-in-out",
    animationIterationCount: "infinite",
  },
  code: {
    color: color.onInverseMuted,
  },
});

export interface ServerErrorPageProps {
  /** Correlation id from the server log. Shown so support can find the trace. */
  reference?: string;
  /**
   * ISO timestamp of the failure, from the server. Deliberately *not* defaulted
   * to `new Date()`: evaluated during render that resolves differently on the
   * server than during hydration, which is a real hydration mismatch and makes
   * React discard the server HTML for this subtree. When the caller has no
   * server timestamp the line is simply omitted.
   */
  timestamp?: string;
}

const formatTimestamp = (iso?: string): string | undefined => {
  if (!iso) {
    return undefined;
  }
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
};

/**
 * 500. Rendered from the router's error boundary, so it must not depend on any
 * loader data, query client or context - whatever just failed may be exactly
 * that. Everything it needs arrives as a plain prop.
 */
export const ServerErrorPage = ({
  reference,
  timestamp,
}: ServerErrorPageProps) => {
  const stamp = formatTimestamp(timestamp);
  const hasReference = Boolean(reference || stamp);

  return (
    <StatusPage
      art={<ServerErrorArt />}
      crestPosition="start"
      description="The server could not complete your request. Our team has been notified - please try again in a few moments."
      eyebrow="Server error"
      heading="Error 500 - something went wrong on our side."
      numeral="500"
      primaryAction={{ label: "Return to homepage", href: "/" }}
      secondaryAction={{ label: "Report the problem", href: "/contact" }}
    >
      {hasReference ? (
        <p {...stylex.props(styles.reference)}>
          {/*
            The dot is decorative: the word "Reference" carries the meaning, so
            colour is never the only thing communicating it (WCAG SC 1.4.1).
          */}
          <span aria-hidden="true" {...stylex.props(styles.dot)} />
          <span>
            Reference{" "}
            <span {...stylex.props(styles.code)}>{reference ?? "n/a"}</span>
            {stamp ? (
              <>
                {" • "}
                <time dateTime={stamp} {...stylex.props(styles.code)}>
                  {stamp}
                </time>
              </>
            ) : null}
          </span>
        </p>
      ) : null}
    </StatusPage>
  );
};
