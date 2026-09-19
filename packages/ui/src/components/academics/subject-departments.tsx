import * as stylex from "@stylexjs/stylex";

import {
  DEPARTMENTS_EYEBROW,
  DEPARTMENTS_HEADING,
  DEPARTMENTS_INTRO,
  SUBJECT_DEPARTMENTS,
} from "../../content/academics";
import type { SubjectDepartment } from "../../content/academics";
import { bp } from "../../tokens/breakpoints.stylex";
import { color, font, space } from "../../tokens/tokens.stylex";
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

const styles = stylex.create({
  /*
   * Text and photographs share a row only from 64rem up. Below that the images
   * would be squeezed into a column too narrow to read as photographs, so they
   * stack underneath at full width instead.
   */
  layout: {
    display: "grid",
    gap: space.xl,
    alignItems: "start",
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      [bp.xl]: "minmax(0, 1fr) minmax(0, 27.5rem)",
    },
  },

  list: {
    display: "flex",
    flexDirection: "column",
    listStyle: "none",
    margin: 0,
    marginBlockStart: space.xl,
    padding: 0,
  },
  row: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: space["2xs"],
    // A comfortable reading rhythm that also keeps each row a 44px-tall band on
    // touch displays, kiosks and smart boards.
    minBlockSize: "2.75rem",
    paddingBlock: space.xs,
    borderBlockEndWidth: space.px,
    borderBlockEndStyle: "solid",
    borderBlockEndColor: color.border,
  },
  name: {
    margin: 0,
    minWidth: 0,
    fontSize: font.sizeLg,
    fontWeight: font.weightBold,
    lineHeight: font.leadingSnug,
    color: color.onSurface,
  },
  head: {
    margin: 0,
    minWidth: 0,
    fontSize: font.sizeSm,
    color: color.onSurfaceSubtle,
  },

  figures: {
    display: "flex",
    flexDirection: "column",
    gap: space.md,
    marginBlockStart: space.xl,
  },
  /*
   * The design insets the second photograph. Doing that with a percentage width
   * would shrink it to a stamp on a phone, so the inset only applies once the
   * figures sit in their own column.
   */
  figureInset: {
    alignSelf: {
      default: "stretch",
      [bp.xl]: "flex-end",
    },
    inlineSize: {
      default: "100%",
      [bp.xl]: "80%",
    },
  },
});

export const SubjectDepartments = ({
  departments = SUBJECT_DEPARTMENTS,
  labImage,
  libraryImage,
}: {
  departments?: readonly SubjectDepartment[];
  labImage?: ImageSource;
  libraryImage?: ImageSource;
}) => (
  <Section id="departments" labelledBy="departments-title" tone="raised">
    <Container>
      <div {...stylex.props(styles.layout)}>
        <div>
          <Eyebrow>{DEPARTMENTS_EYEBROW}</Eyebrow>
          <Heading id="departments-title" level={2}>
            {DEPARTMENTS_HEADING}
          </Heading>
          <Lead>{DEPARTMENTS_INTRO}</Lead>

          <ul {...stylex.props(styles.list)}>
            {departments.map((department) => (
              <li key={department.id} {...stylex.props(styles.row)}>
                <h3 {...stylex.props(styles.name)}>{department.name}</h3>
                {/*
                  No placeholder when the roster has not been published: an
                  empty slot is honest, a dash or a fake name is not.
                */}
                {department.head ? (
                  <p {...stylex.props(styles.head)}>{department.head}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>

        <Reveal direction="up">
          <div {...stylex.props(styles.figures)}>
            <Media
              placeholder="Science laboratory"
              ratio="4:3"
              source={labImage}
            />
            <Media
              placeholder="Classroom & library"
              ratio="3:2"
              source={libraryImage}
              style={styles.figureInset}
            />
          </div>
        </Reveal>
      </div>
    </Container>
  </Section>
);
