import * as stylex from "@stylexjs/stylex";

import {
  ALUMNI_BRANCHES_EYEBROW,
  ALUMNI_BRANCHES_HEADING,
  ALUMNI_BRANCHES_INTRO,
  ALUMNI_LOCAL_BRANCHES,
  ALUMNI_OVERSEAS_BRANCHES,
  ALUMNI_OVERSEAS_DESCRIPTION,
  ALUMNI_OVERSEAS_HEADING,
} from "../../content/alumni";
import type { AlumniBranch } from "../../content/alumni";
import { bp } from "../../tokens/breakpoints.stylex";
import { font } from "../../tokens/tokens.stylex";
import { DcEyebrow, DcHeading, DcInner, DcSection } from "../home/dc";
import { Reveal } from "../primitives/reveal";

/** Contact and page details from the CMS roster, keyed by lower-cased branch name. */
export type BranchDetails = Readonly<
  Record<string, { contact?: string; href?: string }>
>;

const BROWN = "#936500";
const MONO = "ui-monospace, Menlo, monospace";

/**
 * A branch site lives on another domain, so it opens in a new tab with
 * `rel="noopener noreferrer"`; without it the destination can reach back
 * through `window.opener`.
 */
const externalProps = (href: string | undefined) =>
  href ? ({ rel: "noopener noreferrer", target: "_blank" } as const) : {};

const pad = (value: number) => String(value).padStart(2, "0");

/*
 * Measurements are the approved design's (Alumni.dc.html): a sticky intro
 * column beside a ruled list of branches, 34px row padding, a 30px serif
 * numeral and a 46px branch name. The two columns collapse to one below the
 * design's 360px track floor.
 */
const styles = stylex.create({
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 360px), 1fr))",
    gap: "clamp(40px, 6vw, 64px) clamp(40px, 7vw, 88px)",
    alignItems: "start",
  },
  intro: {
    display: "flex",
    flexDirection: "column",
    gap: "22px",
    position: {
      default: "static",
      [bp.xl]: "sticky",
    },
    insetBlockStart: "120px",
  },
  eyebrow: {
    marginBlockEnd: 0,
  },
  heading: {
    lineHeight: 1.04,
    textWrap: "balance",
  },
  lead: {
    margin: 0,
    maxWidth: "40ch",
    fontSize: "16px",
    lineHeight: 1.75,
    color: "rgba(1, 52, 5, 0.78)",
    textWrap: "pretty",
  },
  rule: {
    inlineSize: "56px",
    blockSize: "2px",
    backgroundColor: "#FFB203",
  },
  list: {
    display: "flex",
    flexDirection: "column",
    margin: 0,
    padding: 0,
    listStyle: "none",
    borderBlockStartWidth: "2px",
    borderBlockStartStyle: "solid",
    borderBlockStartColor: "#013405",
  },
  row: {
    display: "grid",
    gridTemplateColumns: "64px minmax(0, 1fr) auto",
    gap: "24px",
    alignItems: "center",
    paddingBlock: "34px",
    paddingInline: "8px",
    borderBlockEndWidth: "1px",
    borderBlockEndStyle: "solid",
    borderBlockEndColor: "rgba(1, 52, 5, 0.18)",
    color: "#013405",
    textDecoration: "none",
  },
  rowLink: {
    backgroundColor: {
      default: "transparent",
      ":hover": "#F4ECD6",
    },
  },
  rowGroup: {
    gridTemplateColumns: "64px minmax(0, 1fr)",
    alignItems: "start",
  },
  number: {
    fontFamily: font.display,
    fontSize: "30px",
    fontWeight: 600,
    color: BROWN,
  },
  text: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    minWidth: 0,
  },
  name: {
    margin: 0,
    fontFamily: font.display,
    fontSize: "clamp(34px, 3.6vw, 46px)",
    fontWeight: 600,
    lineHeight: 1,
  },
  description: {
    fontSize: "14px",
    color: "rgba(1, 52, 5, 0.72)",
  },
  contact: {
    fontFamily: MONO,
    fontSize: "11px",
    color: "rgba(1, 52, 5, 0.5)",
  },
  arrow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    inlineSize: "48px",
    blockSize: "48px",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "#013405",
    borderRadius: "50%",
    fontSize: "18px",
  },
  group: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    minWidth: 0,
  },
  groupHead: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  chips: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 180px), 1fr))",
    gap: "10px",
    margin: 0,
    padding: 0,
    listStyle: "none",
  },
  chip: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    paddingBlock: "16px",
    paddingInline: "18px",
    backgroundColor: "#fffdf6",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "rgba(1, 52, 5, 0.14)",
    color: "#013405",
    fontWeight: 600,
    fontSize: "15px",
    textDecoration: "none",
  },
  chipLink: {
    backgroundColor: {
      default: "#fffdf6",
      ":hover": "#FFF8E7",
    },
    borderColor: {
      default: "rgba(1, 52, 5, 0.14)",
      ":hover": "#013405",
    },
  },
  chipArrow: {
    color: BROWN,
    fontSize: "13px",
  },
});

const BranchRow = ({
  branch,
  index,
  details,
}: {
  branch: AlumniBranch;
  index: number;
  details?: BranchDetails;
}) => {
  const extra = details?.[branch.name.toLowerCase()];
  const href = extra?.href ?? branch.href;
  const contact = extra?.contact ?? branch.contact;
  const Tag = href ? "a" : "div";

  return (
    <li>
      <Tag
        href={href}
        {...externalProps(href)}
        {...stylex.props(styles.row, href ? styles.rowLink : null)}
      >
        <span aria-hidden="true" {...stylex.props(styles.number)}>
          {pad(index + 1)}
        </span>
        <div {...stylex.props(styles.text)}>
          <h3 {...stylex.props(styles.name)}>{branch.name}</h3>
          <span {...stylex.props(styles.description)}>
            {branch.description}
            {contact ? (
              <>
                {branch.description ? " " : null}
                <span {...stylex.props(styles.contact)}>{contact}</span>
              </>
            ) : null}
          </span>
        </div>
        {href ? (
          <span aria-hidden="true" {...stylex.props(styles.arrow)}>
            →
          </span>
        ) : null}
      </Tag>
    </li>
  );
};

const OverseasChip = ({
  branch,
  details,
}: {
  branch: AlumniBranch;
  details?: BranchDetails;
}) => {
  const href = details?.[branch.name.toLowerCase()]?.href ?? branch.href;
  const Tag = href ? "a" : "div";
  return (
    <li>
      <Tag
        href={href}
        {...externalProps(href)}
        {...stylex.props(styles.chip, href ? styles.chipLink : null)}
      >
        <span>{branch.name}</span>
        {href ? (
          <span aria-hidden="true" {...stylex.props(styles.chipArrow)}>
            →
          </span>
        ) : null}
      </Tag>
    </li>
  );
};

/** Where to find the Association: Galle, Colombo, then the overseas branches. */
export const Branches = ({
  details,
  local = ALUMNI_LOCAL_BRANCHES,
  overseas = ALUMNI_OVERSEAS_BRANCHES,
}: {
  details?: BranchDetails;
  local?: readonly AlumniBranch[];
  overseas?: readonly AlumniBranch[];
}) => (
  <DcSection id="branches" labelledBy="branches-title" tone="cream">
    <DcInner>
      <div {...stylex.props(styles.grid)}>
        <Reveal direction="up">
          <div {...stylex.props(styles.intro)}>
            <DcEyebrow style={styles.eyebrow}>
              {ALUMNI_BRANCHES_EYEBROW}
            </DcEyebrow>
            <DcHeading id="branches-title" style={styles.heading}>
              {ALUMNI_BRANCHES_HEADING}
            </DcHeading>
            <p {...stylex.props(styles.lead)}>{ALUMNI_BRANCHES_INTRO}</p>
            <div aria-hidden="true" {...stylex.props(styles.rule)} />
          </div>
        </Reveal>

        <Reveal delay={1} direction="up">
          <ol {...stylex.props(styles.list)}>
            {local.map((branch, index) => (
              <BranchRow
                branch={branch}
                details={details}
                index={index}
                key={branch.id}
              />
            ))}
            {overseas.length > 0 ? (
              <li {...stylex.props(styles.row, styles.rowGroup)}>
                <span aria-hidden="true" {...stylex.props(styles.number)}>
                  {pad(local.length + 1)}
                </span>
                <div {...stylex.props(styles.group)}>
                  <div {...stylex.props(styles.groupHead)}>
                    <h3 {...stylex.props(styles.name)}>
                      {ALUMNI_OVERSEAS_HEADING}
                    </h3>
                    <span {...stylex.props(styles.description)}>
                      {ALUMNI_OVERSEAS_DESCRIPTION}
                    </span>
                  </div>
                  <ul {...stylex.props(styles.chips)}>
                    {overseas.map((branch) => (
                      <OverseasChip
                        branch={branch}
                        details={details}
                        key={branch.id}
                      />
                    ))}
                  </ul>
                </div>
              </li>
            ) : null}
          </ol>
        </Reveal>
      </div>
    </DcInner>
  </DcSection>
);
