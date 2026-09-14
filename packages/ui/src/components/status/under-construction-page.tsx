import * as stylex from "@stylexjs/stylex";

import { color, font, space } from "../../tokens/tokens.stylex";
import { UnderConstructionArt } from "./status-illustration";
import { StatusPage } from "./status-page";

const styles = stylex.create({
  progress: {
    inlineSize: "min(100%, 26rem)",
  },
  progressHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: space.sm,
    marginBlockEnd: space["2xs"],
    fontSize: font.size2xs,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingWider,
    textTransform: "uppercase",
    color: color.onInverseSubtle,
  },
  progressValue: {
    color: color.accentOnInverse,
    fontVariantNumeric: "tabular-nums",
  },
  /*
   * A native <progress>, not the mock's decorative bar animating between 14%
   * and 72% forever. A bar that moves but never means anything is a WCAG 2.2
   * SC 2.2.2 nuisance and tells the visitor nothing. `<progress>` also carries
   * the role, min, max and value for free, and degrades to an OS-native bar if
   * the CSS never arrives.
   *
   * The fill colour lives in `index.css` - it needs `::-webkit-progress-value`
   * and `::-moz-progress-bar`, which StyleX cannot express.
   */
  track: {
    display: "block",
    blockSize: "6px",
    inlineSize: "100%",
    // Strips the OS chrome so the track/fill colours below actually apply.
    appearance: "none",
    borderWidth: 0,
    backgroundColor: color.borderInverse,
    color: color.accent,
  },
});

export interface UnderConstructionPageProps {
  /** What is being built, e.g. "Alumni directory". Falls back to generic copy. */
  sectionName?: string;
  /** 0-100. Omit to hide the progress indicator entirely. */
  percentComplete?: number;
}

const clampPercent = (value: number): number =>
  Math.min(100, Math.max(0, Math.round(value)));

/**
 * "Coming soon" screen for sections the Media Unit has not published yet.
 *
 * Unlike 404 and 500 this is a *real* page at a real URL, so it returns 200 -
 * but it is served `noindex` by the route until the content lands, so an empty
 * placeholder never enters the search index under a name we want to rank.
 */
export const UnderConstructionPage = ({
  sectionName,
  percentComplete,
}: UnderConstructionPageProps) => {
  const percent =
    percentComplete === undefined ? undefined : clampPercent(percentComplete);

  return (
    <StatusPage
      art={<UnderConstructionArt />}
      crestPosition="start"
      description="Our Media Unit is preparing this part of the website. Please check back shortly - it will be published as soon as it is ready."
      eyebrow="Under construction"
      heading={
        sectionName
          ? `${sectionName} is being built.`
          : "This section is being built."
      }
      numeral="Coming soon"
      primaryAction={{ label: "Return to homepage", href: "/" }}
      secondaryAction={{ label: "Latest news", href: "/news" }}
      tone="inverseDeep"
    >
      {percent === undefined ? null : (
        <div {...stylex.props(styles.progress)}>
          <p {...stylex.props(styles.progressHeader)}>
            <span>Build progress</span>
            <span {...stylex.props(styles.progressValue)}>{percent}%</span>
          </p>
          <progress
            aria-label="Build progress"
            data-status-progress=""
            max={100}
            value={percent}
            {...stylex.props(styles.track)}
          />
        </div>
      )}
    </StatusPage>
  );
};
