import type { HeroBackground, Notice } from "./home";

/**
 * A single block returned from the CMS API.
 */
export interface CmsBlock {
  id: string;
  hidden: boolean;
  fields: { id: string; value: string }[];
}

/**
 * Extract a field value from a block by its field id.
 */
const field = (
  blocks: CmsBlock[],
  blockId: string,
  fieldId: string
): string | undefined =>
  blocks.find((b) => b.id === blockId)?.fields.find((f) => f.id === fieldId)
    ?.value;

const fieldWithDefault = (
  blocks: CmsBlock[],
  blockId: string,
  fieldId: string,
  fallback: string
): string => field(blocks, blockId, fieldId) ?? fallback;

const parseHeroBackground = (value?: string): HeroBackground | undefined => {
  if (!value) {
    return undefined;
  }
  if (value.startsWith("video:")) {
    return { kind: "video", value: value.slice("video:".length) };
  }
  if (value.startsWith("color:")) {
    return { kind: "color", value: value.slice("color:".length) };
  }
  return {
    kind: "image",
    value: value.startsWith("image:") ? value.slice("image:".length) : value,
  };
};

/**
 * Convert CMS blocks into props that the homepage section components accept.
 */
export const blocksToProps = (blocks: CmsBlock[]) => {
  const isHidden = (blockId: string) =>
    blocks.find((b) => b.id === blockId)?.hidden ?? false;

  const optionalField = (
    blockId: string,
    fieldId: string
  ): string | undefined =>
    isHidden(blockId) ? undefined : field(blocks, blockId, fieldId);

  return {
    notice: isHidden("notice")
      ? undefined
      : ({
          id: "notice",
          text: fieldWithDefault(
            blocks,
            "notice",
            "notice-text",
            "Admissions for the next academic year are now open."
          ),
          href: fieldWithDefault(blocks, "notice", "notice-href", "/notices"),
          priority:
            fieldWithDefault(
              blocks,
              "notice",
              "notice-priority",
              "Standard"
            ).toLowerCase() === "urgent"
              ? ("high" as const)
              : ("standard" as const),
        } satisfies Notice),

    heroTagline: optionalField("hero", "hero-tagline"),
    heroMotto: optionalField("hero", "hero-motto"),
    heroPlace: optionalField("hero", "hero-place"),
    heroCta1: optionalField("hero", "hero-cta-1"),
    heroCta2: optionalField("hero", "hero-cta-2"),
    heroBackground: isHidden("hero")
      ? undefined
      : parseHeroBackground(field(blocks, "hero", "hero-bg")),

    heritageIntro: optionalField("heritage", "heritage-body"),
    heritageEyebrow: optionalField("heritage", "heritage-eyebrow"),
    heritageHeading: optionalField("heritage", "heritage-heading"),
    heritageFounded: optionalField("heritage", "heritage-founded"),

    principalQuote: optionalField("principal", "principal-quote"),
    principalName: optionalField("principal", "principal-name"),

    academicsEyebrow: optionalField("academics", "academics-eyebrow"),
    academicsHeading: optionalField("academics", "academics-heading"),

    lifeHeading: optionalField("life", "life-heading"),
    newsHeading: optionalField("news", "news-heading"),
    achHeading: optionalField("achievements", "ach-heading"),
    alumniHeading: optionalField("alumni", "alumni-heading"),

    // Track which sections are hidden so the preview can skip them
    hidden: {
      notice: isHidden("notice"),
      hero: isHidden("hero"),
      heritage: isHidden("heritage"),
      principal: isHidden("principal"),
      academics: isHidden("academics"),
      life: isHidden("life"),
      news: isHidden("news"),
      achievements: isHidden("achievements"),
      alumni: isHidden("alumni"),
      gallery: isHidden("gallery"),
      footer: isHidden("footer"),
    },
  };
};

export type HomepageBlockProps = ReturnType<typeof blocksToProps>;
