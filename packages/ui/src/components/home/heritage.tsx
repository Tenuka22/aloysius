import * as stylex from "@stylexjs/stylex";

import { FOUNDED_YEAR } from "../../content/home";
import { font } from "../../tokens/tokens.stylex";
import type { ImageSource } from "../primitives/media";
import { Reveal } from "../primitives/reveal";
import { DcEyebrow, DcHeading, DcInner, DcLink, DcSection, DcSlot } from "./dc";

const styles = stylex.create({
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))",
    gap: "48px 56px",
    alignItems: "start",
  },
  text: {
    borderInlineStartWidth: "2px",
    borderInlineStartStyle: "solid",
    borderInlineStartColor: "#FFB203",
    paddingInlineStart: "clamp(20px, 3vw, 40px)",
  },
  eyebrow: {
    marginBlockEnd: "20px",
    letterSpacing: "0.4em",
  },
  heading: {
    fontSize: "clamp(36px, 4.8vw, 58px)",
    marginBlockEnd: "28px",
    textWrap: "balance",
  },
  intro: {
    margin: 0,
    marginBlockEnd: "18px",
    maxWidth: "52ch",
    fontSize: "16.5px",
    lineHeight: 1.75,
    color: "rgba(1, 52, 5, 0.8)",
    textWrap: "pretty",
  },
  stats: {
    display: "flex",
    flexWrap: "wrap",
    gap: "24px 44px",
    margin: 0,
    marginBlock: "44px",
  },
  stat: {
    display: "flex",
    flexDirection: "column-reverse",
  },
  statValue: {
    margin: 0,
    fontFamily: font.display,
    fontSize: "clamp(27px, 3.7vw, 44px)",
    fontWeight: 600,
    lineHeight: 1.2,
  },
  statLabel: {
    margin: 0,
    marginBlockStart: "4px",
    fontSize: "12px",
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: "rgba(1, 52, 5, 0.72)",
  },
  photos: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  photoMain: {
    width: "100%",
    height: "clamp(260px, 40vw, 320px)",
  },
  photoDetail: {
    width: "75%",
    height: "190px",
    alignSelf: "flex-end",
  },
});

export const Heritage = ({
  intro = "Founded in 1895 by Belgian Jesuit missionaries on Mount Calvary, Galle, St. Aloysius’ College has shaped generations of young men in the Southern Province — today a National School of over 3,500 boys from Grade 1 to G.C.E. Advanced Level.",
  foundedYear = FOUNDED_YEAR,
  images,
  historyHref = "/about",
  eyebrow = "Our heritage",
  heading = "A Legacy of Excellence",
}: {
  intro?: string;
  foundedYear?: number;
  images?: readonly [ImageSource?, ImageSource?];
  historyHref?: string;
  eyebrow?: string;
  heading?: string;
}) => {
  const years = new Date().getFullYear() - foundedYear;

  return (
    <DcSection labelledBy="heritage-title" tone="cream">
      <DcInner>
        <div {...stylex.props(styles.grid)}>
          <Reveal direction="up">
            <div {...stylex.props(styles.text)}>
              <DcEyebrow style={styles.eyebrow}>{eyebrow}</DcEyebrow>
              <DcHeading id="heritage-title" style={styles.heading}>
                {heading}
              </DcHeading>
              <p {...stylex.props(styles.intro)}>{intro}</p>

              <dl {...stylex.props(styles.stats)}>
                <div {...stylex.props(styles.stat)}>
                  <dt {...stylex.props(styles.statLabel)}>Founded in Galle</dt>
                  <dd {...stylex.props(styles.statValue)}>
                    Est.&nbsp;{foundedYear}
                  </dd>
                </div>
                <div {...stylex.props(styles.stat)}>
                  <dt {...stylex.props(styles.statLabel)}>
                    Of Aloysian tradition
                  </dt>
                  <dd {...stylex.props(styles.statValue)}>
                    {years}&nbsp;Years
                  </dd>
                </div>
              </dl>

              <DcLink href={historyHref}>
                Explore Our History <span aria-hidden="true">→</span>
              </DcLink>
            </div>
          </Reveal>

          <Reveal delay={1} direction="up">
            <div {...stylex.props(styles.photos)}>
              <DcSlot
                placeholder="Archival photograph — early college years"
                source={images?.[0]}
                style={styles.photoMain}
              />
              <DcSlot
                placeholder="Galle Fort / architecture detail"
                source={images?.[1]}
                style={styles.photoDetail}
              />
            </div>
          </Reveal>
        </div>
      </DcInner>
    </DcSection>
  );
};
