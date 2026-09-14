import * as stylex from "@stylexjs/stylex";

import { bp } from "../../tokens/breakpoints.stylex";
import { color, font, space } from "../../tokens/tokens.stylex";
import { ButtonLink } from "../primitives/button";
import { Container, Eyebrow, Lead, Section } from "../primitives/layout";
import { Media } from "../primitives/media";
import type { ImageSource } from "../primitives/media";
import { Reveal } from "../primitives/reveal";

const styles = stylex.create({
  grid: {
    display: "grid",
    gap: space.xl,
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      [bp.xl]: "minmax(0, 1fr) minmax(0, 23rem)",
    },
    alignItems: "center",
  },
  watermark: {
    position: "absolute",
    insetInlineStart: "-6rem",
    insetBlockStart: "50%",
    transform: "translateY(-50%)",
    height: "32rem",
    width: "auto",
    opacity: 0.06,
    pointerEvents: "none",
    display: {
      default: "none",
      [bp.xl]: "block",
    },
  },
  quote: {
    margin: 0,
    marginBlock: `${space.sm} ${space.md}`,
    fontFamily: font.display,
    fontSize: font.size3xl,
    fontWeight: font.weightSemibold,
    lineHeight: font.leadingSnug,
    color: color.onInverse,
    textWrap: "balance",
  },
  actions: {
    display: "flex",
    flexWrap: "wrap",
    gap: space.sm,
    marginBlockStart: space.xl,
  },
  action: {
    flex: {
      default: "1 1 100%",
      [bp.sm]: "0 1 auto",
    },
  },
});

export const Alumni = ({
  body = "A global network of Aloysians in leadership, service and scholarship - connected by the crest they carried.",
  photo,
  crestSrc = "/logo.png",
  associationHref = "/alumni",
  distinguishedHref = "/alumni/distinguished",
}: {
  body?: string;
  photo?: ImageSource;
  crestSrc?: string;
  associationHref?: string;
  distinguishedHref?: string;
}) => (
  <Section labelledBy="alumni-title" tone="inverse">
    <img
      alt=""
      aria-hidden="true"
      src={crestSrc}
      {...stylex.props(styles.watermark)}
    />
    <Container>
      <div {...stylex.props(styles.grid)}>
        <Reveal direction="up">
          <div>
            <Eyebrow inverse>Old Boys&rsquo; Association</Eyebrow>
            <h2 id="alumni-title" {...stylex.props(styles.quote)}>
              &ldquo;The Aloysian legacy continues.&rdquo;
            </h2>
            <Lead inverse>{body}</Lead>
            <div {...stylex.props(styles.actions)}>
              <ButtonLink href={associationHref} style={styles.action}>
                Old Boys&rsquo; Association
              </ButtonLink>
              <ButtonLink
                href={distinguishedHref}
                style={styles.action}
                variant="outlineInverse"
              >
                Distinguished Aloysians
              </ButtonLink>
            </div>
          </div>
        </Reveal>

        <Reveal delay={1} direction="up">
          <Media
            placeholder="Archival group photograph"
            ratio="4:5"
            source={photo}
            zoom
          />
        </Reveal>
      </div>
    </Container>
  </Section>
);
