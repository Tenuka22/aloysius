/**
 * Single source of truth for homepage content settings.
 *
 * These keys are stored in the `site_settings` table and edited from the
 * admin homepage page (/admin/homepage). The homepage components render
 * purely from these settings — no hardcoded content.
 */

export const HOMEPAGE_KEYS = [
  // Site-wide
  "school_name",
  "school_motto",
  "contact_email",
  "contact_phone",
  "address",

  // Notice strip
  "notice_label",
  "notice_text",
  "notice_url",
  "notice_priority",
  "notice_cta_text",
  "top_announcement_id",

  // Hero
  "hero_badge",
  "hero_title",
  "hero_tagline",
  "hero_location_line",
  "hero_scroll_text",
  "hero_bg_image",
  "hero_cta1_text",
  "hero_cta1_url",
  "hero_cta2_text",
  "hero_cta2_url",

  // Heritage
  "founding_year",
  "heritage_eyebrow",
  "heritage_heading",
  "heritage_intro",
  "heritage_founded_label",
  "heritage_tradition_label",
  "heritage_cta_text",
  "heritage_cta_url",
  "heritage_image_1",
  "heritage_image_2",

  // Principal's message
  "principal_eyebrow",
  "principal_photo",
  "principal_quote",
  "principal_name",
  "principal_title",
  "principal_cta_text",
  "principal_cta_url",

  // Academics
  "academics_eyebrow",
  "academics_heading",
  "academics_cta_text",
  "academics_cta_url",
  "stats_heading",
  "results_eyebrow",
  "results_heading",
  "results_cta_text",
  "results_cta_url",
  "dept1_name",
  "dept1_desc",
  "dept2_name",
  "dept2_desc",
  "dept3_name",
  "dept3_desc",
  "dept4_name",
  "dept4_desc",

  // Quick links
  "quicklinks_eyebrow",
  "quicklinks_heading",
  "quicklinks_cta_text",
  "quicklinks_cta_url",
  "quicklink1_text",
  "quicklink1_url",
  "quicklink2_text",
  "quicklink2_url",
  "quicklink3_text",
  "quicklink3_url",
  "quicklink4_text",
  "quicklink4_url",

  // Student life
  "life_eyebrow",
  "life_heading",
  "life_sports_label",
  "life_sports_image",
  "life_music_label",
  "life_music_image",
  "life_clubs_label",
  "life_clubs_subtext",
  "life_houses_label",
  "life_scouts_label",
  "life_scouts_image",
  "life_faith_label",
  "life_faith_image",
  "life_prefects_label",

  // News & events
  "events_eyebrow",
  "events_heading",
  "events_cta_text",
  "events_cta_url",

  // Achievements
  "achievements_eyebrow",
  "achievements_heading",
  "achievements_description",

  // Alumni
  "alumni_eyebrow",
  "alumni_quote",
  "alumni_description",
  "alumni_photo",
  "alumni_cta1_text",
  "alumni_cta1_url",
  "alumni_cta2_text",
  "alumni_cta2_url",

  // Old Boys
  "ob_archival_image_1",
  "ob_archival_image_2",
  "ob_admin_email",

  // Gallery
  "gallery_eyebrow",
  "gallery_heading",
  "gallery_cta_text",
  "gallery_cta_url",

  // Footer
  "footer_heading",
  "footer_location",
  "footer_tagline",
  "footer_college_heading",
  "footer_community_heading",
  "footer_contact_heading",
  "footer_copyright",
  "footer_credit",
  "footer_social_facebook",
  "footer_social_instagram",
  "footer_social_youtube",
] as const;

export type HomepageSettingKey = (typeof HOMEPAGE_KEYS)[number];

export const HOMEPAGE_DEFAULTS: Record<HomepageSettingKey, string> = {
  // Site-wide
  school_name: "St. Aloysius' College",
  school_motto: "Certa Viriliter",
  contact_email: "info@aloysiuscollege.lk",
  contact_phone: "091 2 333 233",
  address: "St. Aloysius' College\nTemplars' Road\nGalle 80000\nSouthern Province, Sri Lanka",

  // Notice strip
  notice_label: "NOTICE",
  notice_text: "",
  notice_url: "/news-events",
  notice_priority: "standard",
  notice_cta_text: "View all notices",
  top_announcement_id: "",

  // Hero
  hero_badge: "Certa Viriliter",
  hero_title: "St. Aloysius'\nCollege",
  hero_tagline: "Tradition. Excellence. Leadership.",
  hero_location_line: "GALLE \u2022 SRI LANKA",
  hero_scroll_text: "SCROLL",
  hero_bg_image: "",
  hero_cta1_text: "Explore the College",
  hero_cta1_url: "/about",
  hero_cta2_text: "Admissions",
  hero_cta2_url: "/admissions",

  // Heritage
  founding_year: "1862",
  heritage_eyebrow: "OUR HERITAGE",
  heritage_heading: "A Legacy of\nExcellence",
  heritage_intro:
    "For generations, St. Aloysius' College has shaped the minds and character of young men in the Southern Province - grounded in faith, discipline, and the pursuit of excellence.",
  heritage_founded_label: "FOUNDED IN GALLE",
  heritage_tradition_label: "OF ALOYSIAN TRADITION",
  heritage_cta_text: "Explore Our History",
  heritage_cta_url: "/about",
  heritage_image_1: "",
  heritage_image_2: "",

  // Principal's message
  principal_eyebrow: "FROM THE PRINCIPAL",
  principal_photo: "",
  principal_quote:
    "Every Aloysian carries forward a tradition of faith, discipline and excellence - certa viriliter. Our mission is to form men and women who will serve as a light to the world through knowledge, compassion and integrity.",
  principal_name: "The Principal",
  principal_title: "Principal",
  principal_cta_text: "Read the Full Message",
  principal_cta_url: "/principals",

  // Academics
  academics_eyebrow: "ACADEMICS",
  academics_heading: "Academic Excellence",
  academics_cta_text: "All Departments",
  academics_cta_url: "/about",
  stats_heading: "Our Legacy in Numbers",
  results_eyebrow: "TOP SCORES",
  results_heading: "Exam Results",
  results_cta_text: "View All Results",
  results_cta_url: "/exam-results",
  dept1_name: "Science & Mathematics",
  dept1_desc: "Physical sciences, biology and mathematics streams.",
  dept2_name: "Languages & Humanities",
  dept2_desc: "Sinhala, English, Tamil, history and religion.",
  dept3_name: "Commerce",
  dept3_desc: "Accounting, economics and business studies.",
  dept4_name: "Technology & Aesthetics",
  dept4_desc: "ICT, engineering technology, art and music.",

  // Quick links
  quicklinks_eyebrow: "QUICK LINKS",
  quicklinks_heading: "Explore the College",
  quicklinks_cta_text: "View All",
  quicklinks_cta_url: "/about",
  quicklink1_text: "Admissions",
  quicklink1_url: "/admissions",
  quicklink2_text: "Exam Results",
  quicklink2_url: "/exam-results",
  quicklink3_text: "News & Events",
  quicklink3_url: "/news-events",
  quicklink4_text: "Gallery",
  quicklink4_url: "/gallery",

  // Student life
  life_eyebrow: "STUDENT LIFE",
  life_heading: "The Aloysian Experience",
  life_sports_label: "SPORTS",
  life_sports_image: "",
  life_music_label: "MUSIC & DRAMA",
  life_music_image: "",
  life_clubs_label: "CLUBS & SOCIETIES",
  life_clubs_subtext: "Debate \u2022 Science \u2022 Media \u2022 more",
  life_houses_label: "HOUSES",
  life_scouts_label: "SCOUTS & CADETS",
  life_scouts_image: "",
  life_faith_label: "FAITH & SERVICE",
  life_faith_image: "",
  life_prefects_label: "PREFECTS",

  // News & events
  events_eyebrow: "NEWS & EVENTS",
  events_heading: "Life at the College",
  events_cta_text: "View All News",
  events_cta_url: "/news-events",

  // Achievements
  achievements_eyebrow: "HALL OF FAME",
  achievements_heading: "The Achievement Wall",
  achievements_description:
    "Academic, sporting and national honours earned by Aloysians.",

  // Alumni
  alumni_eyebrow: "OLD BOYS' ASSOCIATION",
  alumni_quote: "The Aloysian Legacy Continues.",
  alumni_description:
    "A global network of Aloysians in leadership, service and scholarship - connected by the crest they carried.",
  alumni_photo: "",
  alumni_cta1_text: "Old Boys' Association",
  alumni_cta1_url: "#",
  alumni_cta2_text: "Distinguished Aloysians",
  alumni_cta2_url: "#",

  // Old Boys
  ob_archival_image_1: "",
  ob_archival_image_2: "",
  ob_admin_email: "",

  // Gallery
  gallery_eyebrow: "MEDIA",
  gallery_heading: "Gallery",
  gallery_cta_text: "Full Gallery",
  gallery_cta_url: "/gallery",

  // Footer
  footer_heading: "ST. ALOYSIUS' COLLEGE",
  footer_location: "GALLE, SRI LANKA",
  footer_tagline: "Certa Viriliter",
  footer_college_heading: "COLLEGE",
  footer_community_heading: "COMMUNITY",
  footer_contact_heading: "CONTACT",
  footer_copyright:
    "\u00A9 {year} St. Aloysius' College, Galle. All Rights Reserved.",
  footer_credit: "CERTA VIRILITER",
  footer_social_facebook: "https://facebook.com/aloysiuscollege",
  footer_social_instagram: "https://instagram.com/aloysiuscollege",
  footer_social_youtube: "https://youtube.com/@aloysiuscollege",
};
