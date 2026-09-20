import type { HeroBackground, ImageSource, Notice } from "./home";

/**
 * A single block returned from the CMS API.
 */
export interface CmsBlock {
  id: string;
  hidden: boolean;
  fields: { id: string; value: string; aspectRatio?: number }[];
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

const isHidden = (blocks: CmsBlock[], blockId: string): boolean =>
  blocks.find((block) => block.id === blockId)?.hidden ?? false;

const fieldWithDefault = (
  blocks: CmsBlock[],
  blockId: string,
  fieldId: string,
  fallback: string
): string => field(blocks, blockId, fieldId) ?? fallback;

interface CmsImageField {
  id: string;
  value?: string;
  aspectRatio?: number;
}

const imageField = (
  blocks: CmsBlock[],
  blockId: string,
  fieldId: string
): CmsImageField | undefined => {
  const block = blocks.find((candidate) => candidate.id === blockId);
  return block?.fields.find((candidate) => candidate.id === fieldId);
};

const optionalImageField = (
  blocks: CmsBlock[],
  blockId: string,
  fieldId: string
): CmsImageField | undefined =>
  isHidden(blocks, blockId) ? undefined : imageField(blocks, blockId, fieldId);

const imageSource = (
  blocks: CmsBlock[],
  blockId: string,
  fieldId: string,
  alt: string
): ImageSource | undefined => {
  const imgField = optionalImageField(blocks, blockId, fieldId);
  const value = imgField?.value;
  if (!value) {
    return undefined;
  }

  return {
    src: value.startsWith("image:") ? value.slice("image:".length) : value,
    alt,
    ...(imgField.aspectRatio ? { aspectRatio: imgField.aspectRatio } : {}),
  };
};

const parseHeroBackground = (
  value?: string,
  aspectRatio?: number
): HeroBackground | undefined => {
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
    ...(aspectRatio ? { aspectRatio } : {}),
  };
};

/**
 * Convert CMS blocks into props that the homepage section components accept.
 */
export const blocksToProps = (blocks: CmsBlock[]) => {
  const optionalField = (
    blockId: string,
    fieldId: string
  ): string | undefined =>
    isHidden(blocks, blockId) ? undefined : field(blocks, blockId, fieldId);

  return {
    notice: isHidden(blocks, "notice")
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
    heroBackground: isHidden(blocks, "hero")
      ? undefined
      : parseHeroBackground(
          field(blocks, "hero", "hero-bg"),
          imageField(blocks, "hero", "hero-bg")?.aspectRatio
        ),

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

    heritageImages: [
      imageSource(
        blocks,
        "heritage",
        "heritage-image-1",
        "Archival photograph from the college's early years"
      ),
      undefined,
    ] as const,
    principalPortrait: imageSource(
      blocks,
      "principal",
      "principal-portrait",
      "Portrait of the Principal"
    ),
    studentLifePhotos: {
      sports: imageSource(
        blocks,
        "life",
        "life-sports",
        "Students playing sports"
      ),
      music: imageSource(
        blocks,
        "life",
        "life-music",
        "Students participating in music and drama"
      ),
    },
    alumniPhoto: imageSource(
      blocks,
      "alumni",
      "alumni-image",
      "Members of the Old Boys' Association"
    ),

    // Track which sections are hidden so the preview can skip them
    hidden: {
      notice: isHidden(blocks, "notice"),
      hero: isHidden(blocks, "hero"),
      heritage: isHidden(blocks, "heritage"),
      principal: isHidden(blocks, "principal"),
      academics: isHidden(blocks, "academics"),
      life: isHidden(blocks, "life"),
      news: isHidden(blocks, "news"),
      achievements: isHidden(blocks, "achievements"),
      alumni: isHidden(blocks, "alumni"),
      gallery: isHidden(blocks, "gallery"),
      footer: isHidden(blocks, "footer"),
    },
  };
};

export type HomepageBlockProps = ReturnType<typeof blocksToProps>;
