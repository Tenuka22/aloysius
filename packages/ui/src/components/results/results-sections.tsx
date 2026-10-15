import * as stylex from "@stylexjs/stylex";
import { useState } from "react";

import {
  AL_STREAMS_TABS,
  RESULTS_AL_EYEBROW,
  RESULTS_AL_HEADING,
  RESULTS_AL_NOTE,
  RESULTS_EMPTY_BODY,
  RESULTS_OL_EYEBROW,
  RESULTS_OL_HEADING,
  RESULTS_OL_NOTE,
  RESULTS_SCHOLARSHIP_EYEBROW,
  RESULTS_SCHOLARSHIP_HEADING,
} from "../../content/results";
import type {
  AlRanker,
  ResultsStudent,
  ScholarshipEntry,
  YearResults,
} from "../../content/results";
import { bp } from "../../tokens/breakpoints.stylex";
import { color, font, motionToken, space } from "../../tokens/tokens.stylex";
import {
  Container,
  Eyebrow,
  Heading,
  Section,
  VisuallyHidden,
} from "../primitives/layout";
import { Media } from "../primitives/media";

const NONE = "—";
const PLACES = ["Highest mark", "Second", "Third"] as const;

const styles = stylex.create({
  /* ------------------------------------------------------------ summary */
  summary: {
    backgroundColor: color.surfaceInverseDeep,
    color: color.onInverse,
    paddingInline: space.gutter,
  },
  summaryGrid: {
    display: "grid",
    margin: 0,
    padding: 0,
    listStyle: "none",
    gridTemplateColumns: {
      default: "repeat(2, minmax(0, 1fr))",
      [bp.xl]: "repeat(4, minmax(0, 1fr))",
    },
  },
  summaryItem: {
    paddingBlock: space.lg,
    paddingInline: space.md,
    borderInlineEndWidth: space.px,
    borderInlineEndStyle: "solid",
    borderInlineEndColor: "rgba(255, 178, 3, 0.18)",
  },
  summaryValue: {
    margin: 0,
    fontFamily: font.display,
    fontSize: font.size3xl,
    fontWeight: font.weightSemibold,
    lineHeight: font.leadingTight,
    color: color.accentOnInverse,
  },
  summaryLabel: {
    margin: 0,
    marginBlockStart: space["2xs"],
    fontSize: font.size2xs,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingWider,
    textTransform: "uppercase",
    color: color.onInverseMuted,
  },

  /* ----------------------------------------------------- section header */
  header: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: space.md,
    marginBlockEnd: space.xl,
  },
  note: {
    margin: 0,
    maxWidth: "40ch",
    fontSize: font.sizeSm,
    lineHeight: font.leadingRelaxed,
    color: color.onSurfaceMuted,
  },
  noteInverse: {
    color: color.onInverseMuted,
  },
  empty: {
    margin: 0,
    paddingBlock: space["2xl"],
    paddingInline: space.lg,
    borderWidth: space.px,
    borderStyle: "dashed",
    borderColor: color.borderStrong,
    textAlign: "center",
    fontSize: font.sizeMd,
    color: color.onSurfaceMuted,
  },
  emptyInverse: {
    borderColor: color.borderInverse,
    color: color.onInverseMuted,
  },

  /* ---------------------------------------------------------- A/L tabs */
  streamTabs: {
    margin: 0,
    padding: 0,
    borderWidth: 0,
    minInlineSize: 0,
    display: "flex",
    flexWrap: "wrap",
    marginBlockEnd: space.xl,
    borderBlockEndWidth: space.px,
    borderBlockEndStyle: "solid",
    borderBlockEndColor: color.border,
  },
  streamTab: {
    minBlockSize: "2.75rem",
    paddingInline: space.md,
    marginBlockEnd: "-1px",
    backgroundColor: "transparent",
    borderWidth: 0,
    borderBlockEndWidth: "3px",
    borderBlockEndStyle: "solid",
    fontSize: font.sizeSm,
    fontWeight: font.weightBold,
    cursor: "pointer",
    transitionProperty: "color",
    transitionDuration: motionToken.fast,
  },
  streamTabIdle: {
    borderBlockEndColor: "transparent",
    color: {
      default: color.onSurfaceSubtle,
      ":hover": color.onSurface,
    },
  },
  streamTabActive: {
    borderBlockEndColor: color.accent,
    color: color.onSurface,
  },

  /* ------------------------------------------------- first-place card */
  first: {
    display: "grid",
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      [bp.md]: "minmax(0, 1fr) minmax(0, 1.2fr)",
    },
    maxWidth: "55rem",
    marginBlockEnd: space.lg,
    backgroundColor: color.surfaceInverse,
    color: color.onInverse,
    overflow: "hidden",
  },
  firstBody: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    gap: space.lg,
    padding: space.lg,
  },
  firstBadge: {
    display: "inline-flex",
    alignItems: "center",
    paddingBlock: space["3xs"],
    paddingInline: space.xs,
    backgroundColor: color.accent,
    color: color.onAccent,
    fontSize: font.size2xs,
    fontWeight: font.weightExtrabold,
    letterSpacing: font.trackingWider,
    textTransform: "uppercase",
  },
  firstName: {
    margin: 0,
    marginBlockStart: space.sm,
    fontFamily: font.display,
    fontSize: font.size2xl,
    fontWeight: font.weightSemibold,
    lineHeight: font.leadingSnug,
  },
  firstStream: {
    margin: 0,
    marginBlockStart: space.xs,
    fontSize: font.sizeXs,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingWide,
    textTransform: "uppercase",
    color: color.accentOnInverse,
  },
  stats: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "1px",
    margin: 0,
    backgroundColor: "rgba(255, 178, 3, 0.25)",
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: "rgba(255, 178, 3, 0.25)",
  },
  stat: {
    backgroundColor: color.surfaceInverse,
    padding: space.sm,
  },
  statLabel: {
    margin: 0,
    fontSize: font.size2xs,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingWider,
    textTransform: "uppercase",
    color: color.onInverseSubtle,
  },
  statValue: {
    margin: 0,
    marginBlockStart: space["3xs"],
    fontFamily: font.mono,
    fontSize: font.sizeSm,
    fontWeight: font.weightBold,
  },

  /* ---------------------------------------------------- portrait cards */
  grid: {
    display: "grid",
    margin: 0,
    padding: 0,
    listStyle: "none",
    gap: space.md,
    gridTemplateColumns: "repeat(auto-fill, minmax(11rem, 1fr))",
  },
  card: {
    display: "flex",
    flexDirection: "column",
    backgroundColor: color.surfaceRaised,
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: color.border,
  },
  portrait: {
    position: "relative",
  },
  position: {
    position: "absolute",
    insetBlockStart: 0,
    insetInlineStart: 0,
    paddingBlock: space["3xs"],
    paddingInline: space.xs,
    backgroundColor: color.accent,
    color: color.onAccent,
    fontFamily: font.display,
    fontSize: font.sizeXl,
    fontWeight: font.weightBold,
    lineHeight: font.leadingTight,
  },
  positionPlain: {
    backgroundColor: color.surface,
  },
  result: {
    position: "absolute",
    insetBlockEnd: 0,
    insetInlineEnd: 0,
    paddingBlock: space["3xs"],
    paddingInline: space.xs,
    backgroundColor: color.surfaceInverse,
    color: color.accentOnInverse,
    fontFamily: font.display,
    fontSize: font.sizeLg,
    fontWeight: font.weightBold,
  },
  cardBody: {
    padding: space.sm,
  },
  cardName: {
    margin: 0,
    fontSize: font.sizeSm,
    fontWeight: font.weightBold,
    lineHeight: font.leadingSnug,
  },
  cardStats: {
    display: "flex",
    gap: space.md,
    margin: 0,
    marginBlockStart: space.xs,
    paddingBlockStart: space.xs,
    borderBlockStartWidth: space.px,
    borderBlockStartStyle: "solid",
    borderBlockStartColor: color.border,
  },
  cardStatLabel: {
    margin: 0,
    fontSize: font.size2xs,
    fontWeight: font.weightExtrabold,
    letterSpacing: font.trackingWider,
    textTransform: "uppercase",
    color: color.onSurfaceSubtle,
  },
  cardStatValue: {
    margin: 0,
    marginBlockStart: "2px",
    fontFamily: font.mono,
    fontSize: font.sizeXs,
    fontWeight: font.weightBold,
  },

  /* ------------------------------------------------------------- 9A */
  nineAHead: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: space.lg,
    marginBlockEnd: space.xl,
  },
  big: {
    margin: 0,
    fontFamily: font.display,
    fontSize: font.size4xl,
    fontWeight: font.weightSemibold,
    lineHeight: font.leadingTight,
    color: color.accentOnInverse,
    textAlign: "end",
  },
  bigLabel: {
    margin: 0,
    fontSize: font.size2xs,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingWider,
    textTransform: "uppercase",
    color: color.onInverseMuted,
    textAlign: "end",
  },
  nineAGrid: {
    display: "grid",
    margin: 0,
    padding: 0,
    listStyle: "none",
    gap: space.md,
    gridTemplateColumns: "repeat(auto-fill, minmax(10rem, 1fr))",
  },
  nineACard: {
    textAlign: "center",
  },
  nineAFrame: {
    position: "relative",
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: color.borderAccent,
  },
  nineABadge: {
    position: "absolute",
    insetBlockEnd: "-1px",
    insetInlineEnd: "-1px",
    paddingBlock: "2px",
    paddingInline: space.xs,
    backgroundColor: color.accent,
    color: color.onAccent,
    fontFamily: font.display,
    fontSize: font.sizeMd,
    fontWeight: font.weightBold,
  },
  nineAName: {
    margin: 0,
    marginBlockStart: space.xs,
    fontSize: font.sizeXs,
    color: color.onInverseMuted,
  },
  bands: {
    display: "flex",
    flexWrap: "wrap",
    gap: space.lg,
    margin: 0,
    padding: 0,
    marginBlockStart: space.xl,
    paddingBlockStart: space.lg,
    listStyle: "none",
    borderBlockStartWidth: space.px,
    borderBlockStartStyle: "solid",
    borderBlockStartColor: color.borderInverse,
  },
  bandValue: {
    margin: 0,
    fontFamily: font.display,
    fontSize: font.size2xl,
    fontWeight: font.weightSemibold,
    lineHeight: font.leadingTight,
    color: color.accentOnInverse,
  },
  bandLabel: {
    margin: 0,
    marginBlockStart: "2px",
    fontSize: font.size2xs,
    letterSpacing: font.trackingWide,
    textTransform: "uppercase",
    color: color.onInverseMuted,
  },

  /* ---------------------------------------------------- scholarship */
  facts: {
    display: "flex",
    flexWrap: "wrap",
    gap: space.lg,
    margin: 0,
  },
  factValue: {
    margin: 0,
    fontFamily: font.display,
    fontSize: font.size2xl,
    fontWeight: font.weightSemibold,
    lineHeight: font.leadingTight,
  },
  factLabel: {
    margin: 0,
    marginBlockStart: space["2xs"],
    fontSize: font.size2xs,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingWider,
    textTransform: "uppercase",
    color: color.onSurfaceSubtle,
  },
  topGrid: {
    display: "grid",
    margin: 0,
    marginBlockEnd: space.lg,
    padding: 0,
    listStyle: "none",
    gap: space.md,
    gridTemplateColumns: "repeat(auto-fit, minmax(16rem, 1fr))",
  },
  topCard: {
    display: "flex",
    alignItems: "center",
    gap: space.md,
    padding: space.md,
    backgroundColor: color.surface,
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: color.border,
    borderBlockStartWidth: "3px",
  },
  placeFirst: { borderBlockStartColor: color.accent },
  placeSecond: { borderBlockStartColor: color.onSurface },
  placeThird: { borderBlockStartColor: color.accentOnSurface },
  topPhoto: {
    flexShrink: 0,
    inlineSize: "4.5rem",
    borderRadius: "50%",
    overflow: "hidden",
  },
  place: {
    margin: 0,
    fontSize: font.size2xs,
    fontWeight: font.weightExtrabold,
    letterSpacing: font.trackingWider,
    textTransform: "uppercase",
  },
  topName: {
    margin: 0,
    marginBlockStart: space["3xs"],
    fontSize: font.sizeSm,
    fontWeight: font.weightBold,
  },
  topMarks: {
    margin: 0,
    marginBlockStart: space["3xs"],
    fontFamily: font.display,
    fontSize: font.sizeXl,
    fontWeight: font.weightSemibold,
    lineHeight: font.leadingTight,
  },
  tableWrap: {
    overflowX: "auto",
    backgroundColor: color.surface,
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: color.border,
  },
  table: {
    inlineSize: "100%",
    minInlineSize: "30rem",
    borderCollapse: "collapse",
    textAlign: "start",
  },
  th: {
    paddingBlock: space.xs,
    paddingInline: space.md,
    backgroundColor: color.surfaceInverse,
    color: color.accentOnInverse,
    fontSize: font.size2xs,
    fontWeight: font.weightExtrabold,
    letterSpacing: font.trackingWider,
    textAlign: "start",
    textTransform: "uppercase",
  },
  td: {
    paddingBlock: space.xs,
    paddingInline: space.md,
    borderBlockEndWidth: space.px,
    borderBlockEndStyle: "solid",
    borderBlockEndColor: color.border,
    fontSize: font.sizeSm,
  },
  tdMono: {
    fontFamily: font.mono,
    fontWeight: font.weightBold,
  },
  tableFoot: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: space.sm,
    marginBlockStart: space.sm,
    fontSize: font.sizeXs,
    color: color.onSurfaceMuted,
  },
  pdf: {
    display: "inline-flex",
    alignItems: "center",
    minBlockSize: "2.75rem",
    fontWeight: font.weightBold,
    color: color.onSurface,
    textDecoration: "none",
    borderBlockEndWidth: space.px,
    borderBlockEndStyle: "solid",
    borderBlockEndColor: color.accent,
  },
});

/* ------------------------------------------------------------------ summary */

const SUMMARY_ITEMS = [
  { key: "alUniversityEntrants", label: "A/L university entrants" },
  { key: "alThreeA", label: "A/L 3A passes" },
  { key: "olNineA", label: "O/L 9A achievers" },
  { key: "scholarshipPassers", label: "Scholarship passers" },
] as const;

export const ResultsSummary = ({ data }: { data: YearResults }) => {
  const items = SUMMARY_ITEMS.flatMap(({ key, label }) => {
    const value = data.summary?.[key];
    return value === undefined || value === null ? [] : [{ key, label, value }];
  });
  if (items.length === 0) {
    return null;
  }
  return (
    <section aria-label="Results at a glance" {...stylex.props(styles.summary)}>
      <Container>
        <ul {...stylex.props(styles.summaryGrid)}>
          {items.map(({ key, label, value }) => (
            <li key={key} {...stylex.props(styles.summaryItem)}>
              <p {...stylex.props(styles.summaryValue)}>{value}</p>
              <p {...stylex.props(styles.summaryLabel)}>{label}</p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
};

/* ----------------------------------------------------------------- A/L area */

const rankerStats = (ranker: AlRanker) =>
  [
    ["Z-score", ranker.zScore],
    ["District rank", ranker.districtRank],
    ["Island rank", ranker.islandRank],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]));

const FirstPlace = ({
  ranker,
  streamLabel,
}: {
  ranker: AlRanker;
  streamLabel: string;
}) => {
  const stats = rankerStats(ranker);
  return (
    <article {...stylex.props(styles.first)}>
      <Media
        placeholder="Stream first — portrait"
        ratio="4:5"
        source={ranker.image}
      />
      <div {...stylex.props(styles.firstBody)}>
        <div>
          <span {...stylex.props(styles.firstBadge)}>Stream first</span>
          <h3 {...stylex.props(styles.firstName)}>{ranker.name}</h3>
          <p {...stylex.props(styles.firstStream)}>{streamLabel}</p>
        </div>
        <dl {...stylex.props(styles.stats)}>
          <div {...stylex.props(styles.stat)}>
            <dt {...stylex.props(styles.statLabel)}>Result</dt>
            <dd {...stylex.props(styles.statValue)}>{ranker.result}</dd>
          </div>
          {stats.map(([label, value]) => (
            <div key={label} {...stylex.props(styles.stat)}>
              <dt {...stylex.props(styles.statLabel)}>{label}</dt>
              <dd {...stylex.props(styles.statValue)}>{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </article>
  );
};

const RankerCard = ({
  ranker,
  position,
}: {
  ranker: AlRanker;
  position: number;
}) => (
  <li {...stylex.props(styles.card)}>
    <div {...stylex.props(styles.portrait)}>
      <Media placeholder="Portrait" ratio="4:5" source={ranker.image} />
      <span
        {...stylex.props(styles.position, position > 3 && styles.positionPlain)}
      >
        {String(position).padStart(2, "0")}
      </span>
      <span {...stylex.props(styles.result)}>{ranker.result}</span>
    </div>
    <div {...stylex.props(styles.cardBody)}>
      <h4 {...stylex.props(styles.cardName)}>{ranker.name}</h4>
      {ranker.districtRank || ranker.islandRank ? (
        <dl {...stylex.props(styles.cardStats)}>
          {ranker.districtRank ? (
            <div>
              <dt {...stylex.props(styles.cardStatLabel)}>District</dt>
              <dd {...stylex.props(styles.cardStatValue)}>
                {ranker.districtRank}
              </dd>
            </div>
          ) : null}
          {ranker.islandRank ? (
            <div>
              <dt {...stylex.props(styles.cardStatLabel)}>Island</dt>
              <dd {...stylex.props(styles.cardStatValue)}>
                {ranker.islandRank}
              </dd>
            </div>
          ) : null}
        </dl>
      ) : null}
    </div>
  </li>
);

export const AlRankers = ({
  data,
  year,
}: {
  data: YearResults;
  year: string;
}) => {
  const [stream, setStream] = useState(AL_STREAMS_TABS[0]?.id ?? "");
  const streamLabel =
    AL_STREAMS_TABS.find((tab) => tab.id === stream)?.label ?? "";
  const rankers = data.alRankers?.[stream] ?? [];
  const [first, ...rest] = rankers;

  return (
    <Section id="al" labelledBy="results-al-title" tone="surface">
      <Container>
        <div {...stylex.props(styles.header)}>
          <div>
            <Eyebrow>
              {RESULTS_AL_EYEBROW} &bull; {year}
            </Eyebrow>
            <Heading id="results-al-title" level={2}>
              {RESULTS_AL_HEADING}
            </Heading>
          </div>
          <p {...stylex.props(styles.note)}>{RESULTS_AL_NOTE}</p>
        </div>

        <fieldset {...stylex.props(styles.streamTabs)}>
          <VisuallyHidden>
            <legend>A/L stream</legend>
          </VisuallyHidden>
          {AL_STREAMS_TABS.map((tab) => {
            const on = tab.id === stream;
            return (
              <button
                aria-pressed={on}
                key={tab.id}
                onClick={() => setStream(tab.id)}
                type="button"
                {...stylex.props(
                  styles.streamTab,
                  on ? styles.streamTabActive : styles.streamTabIdle
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </fieldset>

        {first ? (
          <>
            <FirstPlace ranker={first} streamLabel={streamLabel} />
            {rest.length > 0 ? (
              <ul {...stylex.props(styles.grid)}>
                {rest.map((ranker, offset) => (
                  <RankerCard
                    key={ranker.id}
                    position={offset + 2}
                    ranker={ranker}
                  />
                ))}
              </ul>
            ) : null}
          </>
        ) : (
          <p {...stylex.props(styles.empty)}>{RESULTS_EMPTY_BODY}</p>
        )}
      </Container>
    </Section>
  );
};

/* --------------------------------------------------------------------- O/L */

const NineACard = ({ student }: { student: ResultsStudent }) => (
  <li {...stylex.props(styles.nineACard)}>
    <div {...stylex.props(styles.nineAFrame)}>
      <Media placeholder="Portrait" ratio="4:5" source={student.image} />
      <span aria-hidden="true" {...stylex.props(styles.nineABadge)}>
        9A
      </span>
    </div>
    <p {...stylex.props(styles.nineAName)}>{student.name}</p>
  </li>
);

export const NineAchievers = ({
  data,
  year,
}: {
  data: YearResults;
  year: string;
}) => {
  const { nineA } = data;
  const students = nineA?.students ?? [];
  const bands = nineA?.bands ?? [];

  return (
    <Section id="ol" labelledBy="results-ol-title" tone="inverseGradient">
      <Container>
        <div {...stylex.props(styles.nineAHead)}>
          <div>
            <Eyebrow inverse>
              {RESULTS_OL_EYEBROW} &bull; {year}
            </Eyebrow>
            <Heading id="results-ol-title" level={2}>
              {RESULTS_OL_HEADING}
            </Heading>
            <p {...stylex.props(styles.note, styles.noteInverse)}>
              {RESULTS_OL_NOTE}
            </p>
          </div>
          <div>
            <p {...stylex.props(styles.big)}>9A</p>
            {nineA?.total ? (
              <p {...stylex.props(styles.bigLabel)}>{nineA.total} students</p>
            ) : null}
          </div>
        </div>

        {students.length > 0 ? (
          <ul {...stylex.props(styles.nineAGrid)}>
            {students.map((student) => (
              <NineACard key={student.id} student={student} />
            ))}
          </ul>
        ) : (
          <p {...stylex.props(styles.empty, styles.emptyInverse)}>
            {RESULTS_EMPTY_BODY}
          </p>
        )}

        {bands.length > 0 ? (
          <ul {...stylex.props(styles.bands)}>
            {bands.map((band) => (
              <li key={band.band}>
                <p {...stylex.props(styles.bandValue)}>{band.band}</p>
                <p {...stylex.props(styles.bandLabel)}>{band.count} students</p>
              </li>
            ))}
          </ul>
        ) : null}
      </Container>
    </Section>
  );
};

/* ------------------------------------------------------------- scholarship */

const PLACE_STYLES = [styles.placeFirst, styles.placeSecond, styles.placeThird];

const TopCard = ({
  entry,
  place,
}: {
  entry: ScholarshipEntry;
  place: number;
}) => (
  <li {...stylex.props(styles.topCard, PLACE_STYLES[place])}>
    <div {...stylex.props(styles.topPhoto)}>
      <Media placeholder="" ratio="1:1" source={entry.image} />
    </div>
    <div>
      <p {...stylex.props(styles.place)}>{PLACES[place]}</p>
      <p {...stylex.props(styles.topName)}>{entry.name}</p>
      <p {...stylex.props(styles.topMarks)}>{entry.marks}</p>
    </div>
  </li>
);

export const ScholarshipPassers = ({
  data,
  year,
}: {
  data: YearResults;
  year: string;
}) => {
  const { scholarship } = data;
  const top = scholarship?.top ?? [];
  const list = scholarship?.list ?? [];
  const facts = [
    ["Passed", scholarship?.passed],
    ["Cut-off mark", scholarship?.cutOff],
    ["Highest mark", scholarship?.highest],
  ].filter((fact): fact is [string, string] => Boolean(fact[1]));
  const hasContent = top.length > 0 || list.length > 0;

  return (
    <Section
      id="scholarship"
      labelledBy="results-scholarship-title"
      tone="raised"
    >
      <Container>
        <div {...stylex.props(styles.header)}>
          <div>
            <Eyebrow>
              {RESULTS_SCHOLARSHIP_EYEBROW} &bull; {year}
            </Eyebrow>
            <Heading id="results-scholarship-title" level={2}>
              {RESULTS_SCHOLARSHIP_HEADING}
            </Heading>
          </div>
          {facts.length > 0 ? (
            <dl {...stylex.props(styles.facts)}>
              {facts.map(([label, value]) => (
                <div key={label}>
                  <dd {...stylex.props(styles.factValue)}>{value}</dd>
                  <dt {...stylex.props(styles.factLabel)}>{label}</dt>
                </div>
              ))}
            </dl>
          ) : null}
        </div>

        {hasContent ? null : (
          <p {...stylex.props(styles.empty)}>{RESULTS_EMPTY_BODY}</p>
        )}

        {top.length > 0 ? (
          <ul {...stylex.props(styles.topGrid)}>
            {top.slice(0, PLACES.length).map((entry, place) => (
              <TopCard entry={entry} key={entry.id} place={place} />
            ))}
          </ul>
        ) : null}

        {list.length > 0 ? (
          <>
            <div {...stylex.props(styles.tableWrap)}>
              <table
                aria-label={`Scholarship passers, ${year}`}
                {...stylex.props(styles.table)}
              >
                <thead>
                  <tr>
                    <th scope="col" {...stylex.props(styles.th)}>
                      No.
                    </th>
                    <th scope="col" {...stylex.props(styles.th)}>
                      Student
                    </th>
                    <th scope="col" {...stylex.props(styles.th)}>
                      Class
                    </th>
                    <th scope="col" {...stylex.props(styles.th)}>
                      Marks
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((entry, offset) => (
                    <tr key={entry.id}>
                      <td {...stylex.props(styles.td, styles.tdMono)}>
                        {String(offset + PLACES.length + 1).padStart(2, "0")}
                      </td>
                      <td {...stylex.props(styles.td)}>{entry.name}</td>
                      <td {...stylex.props(styles.td)}>
                        {entry.className ?? NONE}
                      </td>
                      <td {...stylex.props(styles.td, styles.tdMono)}>
                        {entry.marks}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div {...stylex.props(styles.tableFoot)}>
              <span>
                Showing {list.length + top.length} of{" "}
                {scholarship?.total ?? list.length + top.length} passers
              </span>
              {scholarship?.pdfHref ? (
                <a href={scholarship.pdfHref} {...stylex.props(styles.pdf)}>
                  Download full list (PDF) &rarr;
                </a>
              ) : null}
            </div>
          </>
        ) : null}
      </Container>
    </Section>
  );
};
