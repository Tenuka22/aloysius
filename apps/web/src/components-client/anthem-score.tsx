"use client";

import { useRef, useEffect, useState } from "react";
import VexFlow from "vexflow";

const { Renderer, Stave, StaveNote, Voice, Formatter, Annotation, Accidental, Articulation, Beam } =
  VexFlow;

const ANTHEM_LINES = [
  {
    clef: "treble",
    timeSig: "2/4",
    keySig: "F",
    notes: [
      { key: "b/4", duration: "8r" },
      { key: "c/4", duration: "8", lyric: "A" },
      { key: "c/4", duration: "8", lyric: "lo" },
      { key: "b/4", duration: "q", lyric: "y" },
      { key: "d/5", duration: "8", lyric: "si-" },
      { key: "c/5", duration: "8", lyric: "ans" },
      { key: "d/5", duration: "qd", lyric: "all" },
      { key: "d/5", duration: "8", lyric: "our" },
      { key: "e/5", duration: "16", lyric: "voice" },
      { key: "d/5", duration: "16", lyric: "" },
      { key: "c/5", duration: "16", lyric: "let's" },
      { key: "b/4", duration: "16", lyric: "" },
      { key: "b/4", duration: "qd", lyric: "raise" },
      { key: "b/4", duration: "8", lyric: "In", accidental: "n" },
      { key: "b/4", duration: "q", lyric: "songs" },
      { key: "g/4", duration: "q", lyric: "of" },
    ],
  },
  {
    notes: [
      { key: "d/5", duration: "8", lyric: "lo.." },
      { key: "c/5", duration: "8", lyric: "yal-" },
      { key: "b/4", duration: "8", lyric: "" },
      { key: "g/4", duration: "qd", lyric: "ty" },
      { key: "d/4", duration: "8", lyric: "Let's" },
      { key: "g/4", duration: "q", lyric: "sing" },
      { key: "b/4", duration: "q", lyric: "our" },
      { key: "d/5", duration: "qd", lyric: "Al" },
      { key: "c/5", duration: "8", lyric: "ma" },
      { key: "e/5", duration: "16", lyric: "Ma-" },
      { key: "d/5", duration: "16", lyric: "" },
      { key: "c/5", duration: "16", lyric: "ter's" },
      { key: "b/4", duration: "16", lyric: "" },
      { key: "d/5", duration: "qd", lyric: "praise" },
      { key: "f/5", duration: "8", lyric: "Here's" },
    ],
  },
  {
    notes: [
      { key: "f/5", duration: "qd", lyric: "to" },
      { key: "d/5", duration: "8", lyric: "our" },
      { key: "b/4", duration: "q", lyric: "S." },
      { key: "g/4", duration: "q", lyric: "A." },
      { key: "a/4", duration: "qd", lyric: "C." },
      { key: "c/5", duration: "8", lyric: "Here's" },
      { key: "d/5", duration: "qd", lyric: "to" },
      { key: "c/5", duration: "q", lyric: "our" },
      { key: "b/4", duration: "8", lyric: "S.", accidental: "n" },
      { key: "d/5", duration: "8", lyric: "A." },
      { key: "c/5", duration: "8", lyric: "" },
      { key: "b/4", duration: "h", lyric: "C.", fermata: true },
    ],
  },
  {
    section: "CHORUS",
    notes: [
      { key: "d/5", duration: "q", lyric: "Pure" },
      { key: "c/5", duration: "q", lyric: "as" },
      { key: "b/4", duration: "q", lyric: "the" },
      { key: "d/5", duration: "q", lyric: "li-" },
      { key: "c/5", duration: "q", lyric: "lies" },
      { key: "e/5", duration: "8d", lyric: "of" },
      { key: "f/5", duration: "16", lyric: "our" },
      { key: "d/5", duration: "8", lyric: "crest" },
      { key: "b/4", duration: "8", lyric: "Our", accidental: "n" },
      { key: "d/5", duration: "q", lyric: "thoughts" },
      { key: "e/5", duration: "8", lyric: "and", accidental: "b" },
      { key: "d/5", duration: "8", lyric: "" },
      { key: "d/5", duration: "q", lyric: "deeds" },
      { key: "a/4", duration: "8", lyric: "e'er", accidental: "b" },
      { key: "g/4", duration: "h", lyric: "be" },
    ],
  },
  {
    notes: [
      { key: "d/5", duration: "8", lyric: "Fresh" },
      { key: "c/5", duration: "8", lyric: "as" },
      { key: "d/5", duration: "q", lyric: "the" },
      { key: "c/5", duration: "q", lyric: "sea" },
      { key: "b/4", duration: "8", lyric: "wind", accidental: "n" },
      { key: "a/4", duration: "qd", lyric: "be" },
      { key: "c/5", duration: "8", lyric: "our" },
      { key: "b/4", duration: "8", lyric: "zest" },
      { key: "d/5", duration: "qd", lyric: "To" },
      { key: "c/5", duration: "8", lyric: "keep" },
      { key: "b/4", duration: "q", lyric: "right" },
      { key: "d/5", duration: "q", lyric: "man-" },
      { key: "c/5", duration: "8", lyric: "ful-" },
      { key: "d/5", duration: "8", lyric: "ly" },
      { key: "e/5", duration: "q", lyric: "THE", accent: true },
      { key: "d/5", duration: "qd", lyric: "RULE" },
      { key: "c/5", duration: "8", lyric: "OF" },
    ],
  },
  {
    notes: [
      { key: "d/5", duration: "qd", lyric: "S." },
      { key: "f/5", duration: "8", lyric: "A.", accent: true },
      { key: "e/5", duration: "qd", lyric: "C." },
      { key: "d/5", duration: "8", lyric: "WE" },
      { key: "d/5", duration: "q", lyric: "LEARNT" },
      { key: "c/5", duration: "q", lyric: "AT" },
      { key: "b/4", duration: "q", lyric: "S." },
      { key: "c/5", duration: "8", lyric: "A." },
      { key: "d/5", duration: "qd", lyric: "C." },
      { key: "c/5", duration: "8", lyric: "AT" },
      { key: "b/4", duration: "q", lyric: "HALLS" },
      { key: "c/5", duration: "q", lyric: "OF" },
      { key: "d/5", duration: "qd", lyric: "S." },
      { key: "c/5", duration: "8", lyric: "A." },
      { key: "d/5", duration: "qd", lyric: "C." },
      { key: "c/5", duration: "8", lyric: "BE-" },
    ],
  },
  {
    notes: [
      { key: "d/5", duration: "qd", lyric: "SIDE" },
      { key: "c/5", duration: "8", lyric: "THE" },
      { key: "d/5", duration: "h", lyric: "SOU-THERN" },
      { key: "d/5", duration: "h", lyric: "SEA", fermata: true },
      { key: "c/4", duration: "8", lyric: "A-" },
      { key: "d/4", duration: "8", lyric: "lo" },
      { key: "e/4", duration: "8", lyric: "y-" },
      { key: "g/4", duration: "8", lyric: "sians" },
      { key: "d/5", duration: "8", lyric: "all" },
      { key: "c/5", duration: "8", lyric: "let's" },
      { key: "d/5", duration: "qd", lyric: "young" },
      { key: "c/5", duration: "8", lyric: "and" },
      { key: "e/5", duration: "16", lyric: "old" },
      { key: "d/5", duration: "16", lyric: "" },
      { key: "c/5", duration: "16", lyric: "E'er" },
      { key: "b/4", duration: "16", lyric: "" },
      { key: "d/5", duration: "q", lyric: "lo" },
      { key: "c/4", duration: "q", lyric: "yal" },
    ],
  },
  {
    notes: [
      { key: "e/5", duration: "16", lyric: "be-" },
      { key: "d/5", duration: "16", lyric: "to-" },
      { key: "c/5", duration: "16", lyric: "" },
      { key: "b/4", duration: "16", lyric: "her" },
      { key: "g/4", duration: "qd", lyric: "And" },
      { key: "d/4", duration: "8", lyric: "neath" },
      { key: "d/5", duration: "q", lyric: "the" },
      { key: "c/5", duration: "q", lyric: "ban-" },
      { key: "d/5", duration: "q", lyric: "ner" },
      { key: "e/5", duration: "q", lyric: "Green" },
      { key: "c/5", duration: "8", lyric: "and" },
      { key: "b/4", duration: "8", lyric: "Gold" },
      { key: "d/5", duration: "q", lyric: "CER-", accent: true },
      { key: "d/5", duration: "q", lyric: "TA", accent: true },
      { key: "e/5", duration: "qd", lyric: "VI-" },
      { key: "d/5", duration: "8", lyric: "RI-" },
    ],
  },
  {
    notes: [
      { key: "d/5", duration: "q", lyric: "LI-" },
      { key: "c/5", duration: "q", lyric: "" },
      { key: "d/5", duration: "qd", lyric: "TER" },
      { key: "c/5", duration: "8", lyric: "CER-" },
      { key: "d/5", duration: "qd", lyric: "TA" },
      { key: "c/5", duration: "8", lyric: "VI-" },
      { key: "d/5", duration: "q", lyric: "RI-", accent: true },
      { key: "d/5", duration: "q", lyric: "LI-", accent: true },
      { key: "c/5", duration: "h", lyric: "TER.", fermata: true },
    ],
  },
];

function durationToBeats(duration: string): number {
  const base = duration.replace("r", "");
  const dotted = base.endsWith("d");
  const core = dotted ? base.slice(0, -1) : base;
  const map: Record<string, number> = { w: 4, h: 2, q: 1, "8": 0.5, "16": 0.25, "32": 0.125 };
  const val = map[core] ?? 1;
  return dotted ? val * 1.5 : val;
}

export function AnthemScore() {
  const containerRef = useRef<HTMLDivElement>(null);
  const renderedRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current || renderedRef.current) return;

    const container = containerRef.current;
    container.innerHTML = "";

    const width = container.clientWidth - 16;

    ANTHEM_LINES.forEach((line) => {
      if (line.section) {
        const label = document.createElement("div");
        label.className = "text-center font-bold text-xs tracking-[2px] mt-5 mb-1 uppercase";
        label.textContent = line.section;
        container.appendChild(label);
      }

      const holder = document.createElement("div");
      holder.className = "mt-1";
      container.appendChild(holder);

      const height = 130;
      const renderer = new Renderer(holder, Renderer.Backends.SVG);
      renderer.resize(width, height);
      const context = renderer.getContext();

      const stave = new Stave(10, 10, width - 20);
      if (line.clef) stave.addClef(line.clef);
      if (line.keySig) stave.addKeySignature(line.keySig);
      if (line.timeSig) stave.addTimeSignature(line.timeSig);
      stave.setContext(context).draw();

      const staveNotes = line.notes.map((n) => {
        const isRest = n.duration.endsWith("r");
        const note = new StaveNote({
          keys: [n.key],
          duration: n.duration,
        });

        if (n.accidental) {
          note.addModifier(new Accidental(n.accidental), 0);
        }
        if (n.accent) {
          note.addModifier(new Articulation("a>").setPosition(3), 0);
        }
        if (n.fermata) {
          note.addModifier(new Articulation("a@a").setPosition(3), 0);
        }
        if (n.lyric) {
          const ann = new Annotation(n.lyric)
            .setVerticalJustification(Annotation.VerticalJustify.BOTTOM)
            .setFont("Georgia", 11);
          note.addModifier(ann, 0);
        }
        return note;
      });

      const totalBeats = line.notes.reduce((sum, n) => sum + durationToBeats(n.duration), 0);
      const voice = new Voice({ num_beats: totalBeats, beat_value: 4 });
      voice.setStrict(false);
      voice.addTickables(staveNotes);

      new Formatter().joinVoices([voice]).format([voice], width - 60);

      const beams = Beam.generateBeams(staveNotes);
      voice.draw(context, stave);
      beams.forEach((b) => b.setContext(context).draw());
    });

    renderedRef.current = true;

    return () => {
      if (container) {
        container.innerHTML = "";
        renderedRef.current = false;
      }
    };
  }, []);

  return <div ref={containerRef} className="overflow-x-auto" />;
}
