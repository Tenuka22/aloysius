import * as stylex from "@stylexjs/stylex";

import {
  CONTACT_DEPARTMENTS,
  CONTACT_DEPARTMENTS_EYEBROW,
  CONTACT_DEPARTMENTS_HEADING,
  CONTACT_DEPARTMENTS_INTRO,
} from "../../content/contact";
import type { ContactDepartment } from "../../content/contact";
import { bp } from "../../tokens/breakpoints.stylex";
import { color, font, motionToken, space } from "../../tokens/tokens.stylex";
import { Container, Eyebrow, Heading, Section } from "../primitives/layout";

const styles = stylex.create({
  /*
   * Intro on the left, directory on the right from 64rem; stacked below it.
   * `minmax(0, …)` on both tracks so a long email cannot widen the grid.
   */
  layout: {
    display: "grid",
    gap: space.xl,
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      [bp.xl]: "minmax(0, 1fr) minmax(0, 1.6fr)",
    },
    alignItems: "start",
  },
  intro: {
    margin: 0,
    marginBlockStart: space.sm,
    maxWidth: "40ch",
    fontSize: font.sizeMd,
    lineHeight: font.leadingRelaxed,
    color: color.onSurfaceMuted,
    textWrap: "pretty",
  },
  list: {
    margin: 0,
    padding: 0,
    listStyle: "none",
    borderBlockStartWidth: space.px,
    borderBlockStartStyle: "solid",
    borderBlockStartColor: color.borderStrong,
  },
  row: {
    display: "grid",
    gap: space.sm,
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      [bp.md]: "minmax(0, 1fr) auto",
    },
    alignItems: "center",
    paddingBlock: space.md,
    borderBlockEndWidth: space.px,
    borderBlockEndStyle: "solid",
    borderBlockEndColor: color.borderStrong,
  },
  name: {
    margin: 0,
    fontFamily: font.display,
    fontSize: font.sizeXl,
    fontWeight: font.weightSemibold,
    lineHeight: font.leadingSnug,
    color: color.onSurface,
  },
  description: {
    margin: 0,
    marginBlockStart: space["3xs"],
    fontSize: font.sizeSm,
    color: color.onSurfaceMuted,
  },
  contacts: {
    display: "flex",
    flexDirection: "column",
    margin: 0,
    padding: 0,
    listStyle: "none",
    textAlign: {
      default: "start",
      [bp.md]: "end",
    },
  },
  link: {
    display: "inline-flex",
    alignItems: "center",
    minBlockSize: {
      default: "1.5rem",
      [bp.touch]: "2.75rem",
    },
    fontFamily: font.mono,
    fontSize: font.sizeXs,
    color: {
      default: color.onSurfaceMuted,
      ":hover": color.accentOnSurface,
    },
    textDecoration: "none",
    overflowWrap: "anywhere",
    transitionProperty: "color",
    transitionDuration: motionToken.fast,
  },
});

/** Strips spaces and brackets so the `tel:` target is dialable. */
const telHref = (telephone: string) =>
  `tel:${telephone.replaceAll(/[^+\d]/gu, "")}`;

const DepartmentRow = ({ department }: { department: ContactDepartment }) => {
  const { name, description, telephone, email } = department;
  return (
    <li {...stylex.props(styles.row)}>
      <div>
        <h3 {...stylex.props(styles.name)}>{name}</h3>
        <p {...stylex.props(styles.description)}>{description}</p>
      </div>
      {telephone || email ? (
        <ul {...stylex.props(styles.contacts)}>
          {telephone ? (
            <li>
              <a href={telHref(telephone)} {...stylex.props(styles.link)}>
                {telephone}
              </a>
            </li>
          ) : null}
          {email ? (
            <li>
              <a href={`mailto:${email}`} {...stylex.props(styles.link)}>
                {email}
              </a>
            </li>
          ) : null}
        </ul>
      ) : null}
    </li>
  );
};

export const ContactDepartments = ({
  departments = CONTACT_DEPARTMENTS,
}: {
  departments?: readonly ContactDepartment[];
}) => {
  if (departments.length === 0) {
    return null;
  }
  return (
    <Section id="directory" labelledBy="contact-directory-title" tone="surface">
      <Container>
        <div {...stylex.props(styles.layout)}>
          <div>
            <Eyebrow>{CONTACT_DEPARTMENTS_EYEBROW}</Eyebrow>
            <Heading id="contact-directory-title" level={2}>
              {CONTACT_DEPARTMENTS_HEADING}
            </Heading>
            <p {...stylex.props(styles.intro)}>{CONTACT_DEPARTMENTS_INTRO}</p>
          </div>
          <ul {...stylex.props(styles.list)}>
            {departments.map((department) => (
              <DepartmentRow department={department} key={department.id} />
            ))}
          </ul>
        </div>
      </Container>
    </Section>
  );
};
