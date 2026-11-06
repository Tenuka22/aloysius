import * as stylex from "@stylexjs/stylex";
import { useRef, useState } from "react";

import {
  ANTHEM_AUDIO_SRC,
  ANTHEM_STANZAS,
  ANTHEM_TITLE,
} from "../../content/about";
import type { AnthemStanza } from "../../content/about";
import { font } from "../../tokens/tokens.stylex";
import { DcEyebrow, DcHeading, DcInner, DcSection } from "../home/dc";
import { Reveal } from "../primitives/reveal";

/** Verses shown before "Read more": the first two, as the College asks. */
const PREVIEW_STANZAS = 2;

const styles = stylex.create({
  section: {
    textAlign: "center",
  },
  inner: {
    maxWidth: "760px",
  },
  heading: {
    marginBlockEnd: "40px",
    fontSize: "clamp(34px, 4.2vw, 50px)",
  },
  box: {
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "rgba(1, 52, 5, 0.15)",
    borderBlockStartWidth: "2px",
    borderBlockStartColor: "#FFB203",
    backgroundColor: "#FFF8E7",
    paddingBlock: "clamp(36px, 5vw, 56px)",
    paddingInline: "clamp(20px, 4.4vw, 48px)",
  },
  lyrics: {
    margin: 0,
    padding: 0,
    listStyle: "none",
    fontFamily: font.display,
    fontStyle: "italic",
    fontSize: "clamp(20px, 2.2vw, 24px)",
    lineHeight: 1.9,
    color: "rgba(1, 52, 5, 0.75)",
  },
  stanza: {
    display: "block",
    marginBlockEnd: "1.4em",
  },
  stanzaLast: {
    marginBlockEnd: 0,
  },
  line: {
    display: "block",
  },
  actions: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: "12px 16px",
    marginBlockStart: "36px",
  },
  listen: {
    display: "inline-flex",
    alignItems: "center",
    gap: "12px",
    paddingBlock: "12px",
    paddingInline: "26px",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "#013405",
    backgroundColor: {
      default: "transparent",
      ":hover": "#013405",
    },
    color: {
      default: "#013405",
      ":hover": "#FFB203",
    },
    fontFamily: "inherit",
    fontSize: "13px",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    cursor: "pointer",
  },
});

const Verse = ({ stanza, last }: { stanza: AnthemStanza; last: boolean }) => (
  <li {...stylex.props(styles.stanza, last && styles.stanzaLast)}>
    {stanza.lines.map((line) => (
      <span {...stylex.props(styles.line)} key={line}>
        {line}
      </span>
    ))}
  </li>
);

/**
 * The College anthem: the lyrics verse by verse and, once a recording is
 * supplied, a button that plays it.
 */
export const Anthem = ({
  title = ANTHEM_TITLE,
  stanzas = ANTHEM_STANZAS,
  audioSrc = ANTHEM_AUDIO_SRC,
}: {
  title?: string;
  stanzas?: readonly AnthemStanza[];
  audioSrc?: string;
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const canExpand = stanzas.length > PREVIEW_STANZAS;
  const visibleStanzas =
    expanded || !canExpand ? stanzas : stanzas.slice(0, PREVIEW_STANZAS);

  const toggle = async () => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    if (audio.paused) {
      await audio.play();
    } else {
      audio.pause();
    }
  };

  return (
    <DcSection
      id="anthem"
      labelledBy="anthem-title"
      style={styles.section}
      tone="raised"
    >
      <DcInner style={styles.inner}>
        <DcEyebrow>College Anthem</DcEyebrow>
        <DcHeading id="anthem-title" style={styles.heading}>
          {title}
        </DcHeading>
        <Reveal direction="up">
          <div {...stylex.props(styles.box)}>
            <ol id="anthem-lyrics" {...stylex.props(styles.lyrics)}>
              {visibleStanzas.map((stanza, index) => (
                <Verse
                  key={stanza.id}
                  last={index === visibleStanzas.length - 1}
                  stanza={stanza}
                />
              ))}
            </ol>
            <div {...stylex.props(styles.actions)}>
              {canExpand ? (
                <button
                  aria-controls="anthem-lyrics"
                  aria-expanded={expanded}
                  onClick={() => setExpanded((value) => !value)}
                  type="button"
                  {...stylex.props(styles.listen)}
                >
                  {expanded ? "Read less" : "Read more"}
                </button>
              ) : null}
              {audioSrc ? (
                <>
                  {/* The anthem is sung text; the lyrics above are its transcript. */}
                  <audio
                    onEnded={() => setPlaying(false)}
                    onPause={() => setPlaying(false)}
                    onPlay={() => setPlaying(true)}
                    preload="none"
                    ref={audioRef}
                    src={audioSrc}
                  >
                    <track kind="captions" />
                  </audio>
                  <button
                    aria-pressed={playing}
                    onClick={toggle}
                    type="button"
                    {...stylex.props(styles.listen)}
                  >
                    <span aria-hidden="true">{playing ? "❚❚" : "▶"}</span>
                    {playing ? "Pause the anthem" : "Listen to the anthem"}
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </Reveal>
      </DcInner>
    </DcSection>
  );
};
