import * as stylex from "@stylexjs/stylex";
import { useState } from "react";

import type {
  AdmissionsDate,
  AdmissionsDownload,
  AdmissionsFaq,
  ApplicationStep,
} from "../../content/admissions";
import type { NavItem } from "../../content/home";
import { color, font, space } from "../../tokens/tokens.stylex";
import { Reveal } from "../primitives/reveal";
import { SiteFooter } from "../site/site-footer";
import type { FooterContact } from "../site/site-footer";
import { SiteHeader } from "../site/site-header";

const MAIN_ID = "main-content";

const styles = stylex.create({
  main: {
    display: "block",
    outline: {
      default: null,
      ":focus": "none",
    },
  },
  hero: {
    paddingBlockStart: space["3xl"],
    paddingBlockEnd: space.xl,
    paddingInline: space.md,
    backgroundColor: color.surfaceInverse,
    color: color.onInverse,
  },
  heroInner: {
    maxWidth: space.measure,
    marginInline: "auto",
  },
  eyebrow: {
    margin: 0,
    fontSize: font.size2xs,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingWidest,
    textTransform: "uppercase",
    color: color.accentOnInverse,
  },
  heading: {
    margin: 0,
    marginBlockStart: space.sm,
    fontFamily: font.display,
    fontSize: font.size4xl,
    fontWeight: font.weightSemibold,
    lineHeight: font.leadingTight,
    textWrap: "balance",
  },
  tagline: {
    margin: 0,
    marginBlockStart: space.sm,
    maxWidth: "56ch",
    fontSize: font.sizeLg,
    lineHeight: font.leadingNormal,
    color: color.onInverseMuted,
    textWrap: "pretty",
  },
  heroActions: {
    display: "flex",
    flexWrap: "wrap",
    gap: space.sm,
    marginBlockStart: space.lg,
  },
  ctaButton: {
    display: "inline-flex",
    alignItems: "center",
    padding: space.sm,
    paddingLeft: space.lg,
    paddingRight: space.lg,
    backgroundColor: color.accent,
    color: color.onAccent,
    fontWeight: font.weightBold,
    fontSize: font.sizeSm,
    textDecoration: "none",
  },
  ctaButtonSecondary: {
    display: "inline-flex",
    alignItems: "center",
    padding: space.sm,
    paddingLeft: space.lg,
    paddingRight: space.lg,
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: color.borderInverse,
    color: color.onInverse,
    fontWeight: font.weightBold,
    fontSize: font.sizeSm,
    textDecoration: "none",
  },
  notice: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: space.sm,
    backgroundColor: color.danger,
    color: color.onInverse,
    paddingBlock: space.sm,
    paddingInline: space.md,
    fontSize: font.sizeSm,
  },
  noticeTag: {
    fontWeight: font.weightBold,
    letterSpacing: font.trackingWide,
    fontSize: font.size2xs,
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: color.borderInverse,
    paddingBlock: "0.2rem",
    paddingInline: space["2xs"],
  },
  section: {
    paddingBlock: space.xl,
    paddingInline: space.md,
    maxWidth: space.measure,
    marginInline: "auto",
  },
  sectionInverse: {
    paddingBlock: space.xl,
    paddingInline: space.md,
    backgroundColor: color.surfaceInverse,
    color: color.onInverse,
  },
  sectionInverseInner: {
    maxWidth: space.measure,
    marginInline: "auto",
  },
  sectionRaised: {
    paddingBlock: space.xl,
    paddingInline: space.md,
    backgroundColor: color.surfaceRaised,
    borderTopWidth: space.px,
    borderTopStyle: "solid",
    borderTopColor: color.border,
  },
  sectionRaisedInner: {
    maxWidth: space.measure,
    marginInline: "auto",
  },
  sectionEyebrow: {
    margin: 0,
    fontSize: font.size2xs,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingWidest,
    textTransform: "uppercase",
    color: color.accentOnSurface,
  },
  sectionEyebrowInverse: {
    margin: 0,
    fontSize: font.size2xs,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingWidest,
    textTransform: "uppercase",
    color: color.accentOnInverse,
  },
  sectionHeading: {
    margin: 0,
    marginBlockStart: space.sm,
    marginBlockEnd: space.lg,
    fontFamily: font.display,
    fontSize: font.size3xl,
    fontWeight: font.weightSemibold,
    lineHeight: font.leadingTight,
  },
  stepsGrid: {
    display: "grid",
    gap: space.lg,
  },
  step: {
    paddingBlockStart: space.sm,
    borderTopWidth: "2px",
    borderTopStyle: "solid",
    borderTopColor: color.accent,
  },
  stepNum: {
    margin: 0,
    fontFamily: font.display,
    fontSize: font.size3xl,
    fontWeight: font.weightSemibold,
    color: color.border,
    lineHeight: 1,
  },
  stepTitle: {
    margin: 0,
    marginBlockStart: space.sm,
    fontWeight: font.weightBold,
    fontSize: font.sizeLg,
  },
  stepBody: {
    margin: 0,
    marginBlockStart: space["2xs"],
    fontSize: font.sizeSm,
    lineHeight: font.leadingRelaxed,
    color: color.onSurfaceMuted,
  },
  twoColumn: {
    display: "grid",
    gap: space.xl,
  },
  requirementList: {
    display: "flex",
    flexDirection: "column",
    margin: 0,
    padding: 0,
    listStyle: "none",
  },
  requirementRow: {
    display: "flex",
    gap: space.sm,
    alignItems: "baseline",
    paddingBlock: space.sm,
    borderBottomWidth: space.px,
    borderBottomStyle: "solid",
    borderBottomColor: color.border,
  },
  requirementMark: {
    flexShrink: 0,
    width: "8px",
    height: "8px",
    backgroundColor: color.accent,
    transform: "rotate(45deg)",
  },
  requirementText: {
    fontSize: font.sizeSm,
    lineHeight: font.leadingRelaxed,
    color: color.onSurfaceMuted,
  },
  dateList: {
    backgroundColor: color.surfaceInverse,
    color: color.onInverse,
  },
  dateRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: space.sm,
    paddingBlock: space.sm,
    paddingInline: space.md,
    borderBottomWidth: space.px,
    borderBottomStyle: "solid",
    borderBottomColor: color.borderInverse,
  },
  dateLabel: {
    fontSize: font.sizeSm,
    fontWeight: font.weightMedium,
  },
  dateValue: {
    fontSize: font.sizeXs,
    color: color.accentOnInverse,
  },
  downloadsGrid: {
    display: "grid",
    gap: space.sm,
  },
  download: {
    display: "flex",
    alignItems: "center",
    gap: space.sm,
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: color.borderAccent,
    padding: space.md,
    color: color.onInverse,
    textDecoration: "none",
  },
  downloadDisabled: {
    opacity: 0.6,
  },
  downloadTag: {
    flexShrink: 0,
    fontWeight: font.weightBold,
    fontSize: font.size2xs,
    color: color.onAccent,
    backgroundColor: color.accent,
    paddingBlock: "0.3rem",
    paddingInline: space["2xs"],
  },
  downloadLabel: {
    display: "block",
    fontWeight: font.weightBold,
    fontSize: font.sizeSm,
  },
  downloadNote: {
    display: "block",
    marginBlockStart: "0.2rem",
    fontSize: font.sizeXs,
    color: color.onInverseSubtle,
  },
  faqItem: {
    borderBottomWidth: space.px,
    borderBottomStyle: "solid",
    borderBottomColor: color.border,
  },
  faqButton: {
    display: "flex",
    width: "100%",
    justifyContent: "space-between",
    alignItems: "center",
    gap: space.md,
    paddingBlock: space.sm,
    background: "none",
    border: "none",
    textAlign: "start",
    font: "inherit",
    color: "inherit",
    cursor: "pointer",
  },
  faqQuestion: {
    fontWeight: font.weightBold,
    fontSize: font.sizeMd,
  },
  faqMark: {
    flexShrink: 0,
    fontFamily: font.display,
    fontSize: font.sizeXl,
    color: color.accent,
    lineHeight: 1,
  },
  faqAnswer: {
    margin: 0,
    paddingBlockEnd: space.sm,
    maxWidth: "64ch",
    fontSize: font.sizeSm,
    lineHeight: font.leadingRelaxed,
    color: color.onSurfaceMuted,
  },
  contactCta: {
    marginBlockStart: space.xl,
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space.md,
    backgroundColor: color.surfaceInverseDeep,
    color: color.onInverse,
    padding: space.lg,
  },
  contactHeading: {
    margin: 0,
    fontFamily: font.display,
    fontSize: font.sizeXl,
    fontWeight: font.weightSemibold,
  },
  contactNote: {
    margin: 0,
    marginBlockStart: "0.3rem",
    fontSize: font.sizeSm,
    color: color.onInverseMuted,
  },
});

const FaqAccordion = ({ faqs }: { faqs: readonly AdmissionsFaq[] }) => {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div>
      {faqs.map((faq) => {
        const open = openId === faq.id;
        return (
          <div key={faq.id} {...stylex.props(styles.faqItem)}>
            <button
              aria-expanded={open}
              onClick={() => setOpenId(open ? null : faq.id)}
              type="button"
              {...stylex.props(styles.faqButton)}
            >
              <span {...stylex.props(styles.faqQuestion)}>{faq.question}</span>
              <span {...stylex.props(styles.faqMark)}>
                {open ? "\u2212" : "+"}
              </span>
            </button>
            {open && <p {...stylex.props(styles.faqAnswer)}>{faq.answer}</p>}
          </div>
        );
      })}
    </div>
  );
};

export interface AdmissionsPageProps {
  eyebrow?: string;
  heading?: string;
  tagline?: string;
  noticeText?: string;
  contactNote?: string;
  steps: readonly ApplicationStep[];
  requirements: readonly string[];
  dates: readonly AdmissionsDate[];
  downloads: readonly AdmissionsDownload[];
  faqs: readonly AdmissionsFaq[];
  contact?: FooterContact;
  extraNavItems?: readonly NavItem[];
}

export const AdmissionsPage = ({
  eyebrow,
  heading = "Admissions",
  tagline,
  noticeText,
  contactNote,
  steps,
  requirements,
  dates,
  downloads,
  faqs,
  contact,
  extraNavItems,
}: AdmissionsPageProps) => (
  <>
    <SiteHeader activeHref="/admissions" extraNavItems={extraNavItems} />
    <main id={MAIN_ID} tabIndex={-1} {...stylex.props(styles.main)}>
      <section {...stylex.props(styles.hero)}>
        <div {...stylex.props(styles.heroInner)}>
          {eyebrow && <p {...stylex.props(styles.eyebrow)}>{eyebrow}</p>}
          <h1 {...stylex.props(styles.heading)}>{heading}</h1>
          {tagline && <p {...stylex.props(styles.tagline)}>{tagline}</p>}
          <div {...stylex.props(styles.heroActions)}>
            <a href="#process" {...stylex.props(styles.ctaButton)}>
              Application Process
            </a>
            <a href="#downloads" {...stylex.props(styles.ctaButtonSecondary)}>
              Downloads
            </a>
          </div>
        </div>
      </section>

      {noticeText && (
        <div {...stylex.props(styles.notice)}>
          <span {...stylex.props(styles.noticeTag)}>IMPORTANT</span>
          <span>{noticeText}</span>
        </div>
      )}

      <section id="process" {...stylex.props(styles.section)}>
        <p {...stylex.props(styles.sectionEyebrow)}>How to apply</p>
        <h2 {...stylex.props(styles.sectionHeading)}>
          The Application Process
        </h2>
        <div {...stylex.props(styles.stepsGrid)}>
          {steps.map((step, index) => (
            <Reveal
              delay={Math.min(index, 2) as 0 | 1 | 2}
              direction="up"
              key={step.id}
            >
              <div {...stylex.props(styles.step)}>
                <p {...stylex.props(styles.stepNum)}>{step.num}</p>
                <h3 {...stylex.props(styles.stepTitle)}>{step.title}</h3>
                <p {...stylex.props(styles.stepBody)}>{step.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section {...stylex.props(styles.sectionRaised)}>
        <div {...stylex.props(styles.sectionRaisedInner, styles.twoColumn)}>
          <div>
            <p {...stylex.props(styles.sectionEyebrow)}>Requirements</p>
            <h2 {...stylex.props(styles.sectionHeading)}>
              What You&apos;ll Need
            </h2>
            <ul {...stylex.props(styles.requirementList)}>
              {requirements.map((requirement) => (
                <li key={requirement} {...stylex.props(styles.requirementRow)}>
                  <span {...stylex.props(styles.requirementMark)} />
                  <span {...stylex.props(styles.requirementText)}>
                    {requirement}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div id="dates">
            <p {...stylex.props(styles.sectionEyebrow)}>Important dates</p>
            <h2 {...stylex.props(styles.sectionHeading)}>Key Dates</h2>
            <div {...stylex.props(styles.dateList)}>
              {dates.map((date) => (
                <div key={date.id} {...stylex.props(styles.dateRow)}>
                  <span {...stylex.props(styles.dateLabel)}>{date.label}</span>
                  <span {...stylex.props(styles.dateValue)}>
                    {date.date ?? "To be announced"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="downloads" {...stylex.props(styles.sectionInverse)}>
        <div {...stylex.props(styles.sectionInverseInner)}>
          <p {...stylex.props(styles.sectionEyebrowInverse)}>Downloads</p>
          <h2 {...stylex.props(styles.sectionHeading)}>
            Forms &amp; Documents
          </h2>
          <div {...stylex.props(styles.downloadsGrid)}>
            {downloads.map((item) =>
              item.href ? (
                <a
                  href={item.href}
                  key={item.id}
                  rel="noopener noreferrer"
                  target="_blank"
                  {...stylex.props(styles.download)}
                >
                  <span {...stylex.props(styles.downloadTag)}>PDF</span>
                  <span>
                    <span {...stylex.props(styles.downloadLabel)}>
                      {item.label}
                    </span>
                  </span>
                </a>
              ) : (
                <div
                  key={item.id}
                  {...stylex.props(styles.download, styles.downloadDisabled)}
                >
                  <span {...stylex.props(styles.downloadTag)}>PDF</span>
                  <span>
                    <span {...stylex.props(styles.downloadLabel)}>
                      {item.label}
                    </span>
                    <span {...stylex.props(styles.downloadNote)}>
                      Available from the College office
                    </span>
                  </span>
                </div>
              )
            )}
          </div>
        </div>
      </section>

      <section {...stylex.props(styles.section)}>
        <p {...stylex.props(styles.sectionEyebrow)}>FAQs</p>
        <h2 {...stylex.props(styles.sectionHeading)}>
          Frequently Asked Questions
        </h2>
        <FaqAccordion faqs={faqs} />
        <div {...stylex.props(styles.contactCta)}>
          <div>
            <p {...stylex.props(styles.contactHeading)}>
              Still have questions?
            </p>
            {contactNote && (
              <p {...stylex.props(styles.contactNote)}>{contactNote}</p>
            )}
          </div>
          <a href="/contact" {...stylex.props(styles.ctaButton)}>
            Contact the College
          </a>
        </div>
      </section>
    </main>
    <SiteFooter contact={contact} />
  </>
);
