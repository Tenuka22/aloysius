import { drizzle } from "drizzle-orm/d1";
import { faker } from "@faker-js/faker";
import * as schema from "./schema";
import { HOMEPAGE_DEFAULTS } from "./homepage-settings";
import { env } from "@aloysius-web/env/server";

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function daysFromNow(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// Single admin email used across the whole seed: site settings (OB admin),
// every activity's adminEmail, and all staff / OB / donor contact emails.
const ADMIN_EMAIL = "tenukaomaljith2009@gmail.com";

// Thematic photo pools, keyed by subject, so every seeded item gets an image
// that actually matches what it is about instead of a random unrelated one.
// Every id below has been verified reachable (no dead Unsplash links).
function unsplash(id: string, w: number, h: number, extra = ""): string {
  return `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop${extra}`;
}

function pick(pool: string[], index: number): string {
  return pool[index % pool.length]!;
}

const ACADEMIC_PHOTOS = [
  "1580582932707-520aed937b7b", // empty classroom, chalkboard
  "1509062522246-3755977927d7", // teacher lecturing a class
  "1571260899304-425eee4c7efc", // student carrying books
  "1427504494785-3a9ca7044f45", // library aisle
  "1497633762265-9d179a990aa6", // stack of books
  "1577896851231-70ef18881754", // classroom, students' hands raised
  "1524178232363-1fb2b075b655", // seminar / lecture room
];
const HERITAGE_PHOTOS = [
  "1562774053-701939374585", // grand institutional building and lawn
  "1580582932707-520aed937b7b", // classroom interior
];
const TECH_PHOTOS = [
  "1461749280684-dccba630e2f6", // code on screen
  "1516321497487-e288fb19713f", // laptop, hands typing
  "1498050108023-c5249f4df085", // laptop with code on desk
  "1551033406-611cf9a28f67", // code close-up
  "1535378917042-10a22c95931a", // robotics
  "1581091226825-a6a2a5aee158", // student working on electronics
];
const ARTS_PHOTOS = [
  "1513364776144-60967b0f800f", // paintbrushes and paint
  "1511192336575-5a79af67a629", // trumpet close-up
  "1475721027785-f74eccf877e2", // microphone at an event
  "1540575467063-178a50c2df87", // auditorium audience
];
const SPORTS_PHOTOS = [
  "1531415074968-036ba1b575da", // cricket ball on grass
  "1540747913346-19e32dc3e97e", // floodlit cricket stadium
];
const COMMUNITY_PHOTOS = [
  "1542601906990-b4d3fb778b09", // hands holding a sapling
  "1517486808906-6ca8b3f04846", // group of friends outdoors
];
// Portrait-style photos, reserved for people (staff, OB members) - never mixed
// into the content pools above, which is what previously put a code screenshot
// or a paintbrush photo in an alumnus's avatar circle.
const FACE_PHOTOS = [
  "1500648767791-00dcc994a43e",
  "1507003211169-0a1dd7228f2d",
  "1506794778202-cad84cf45f1d",
  "1519085360753-af0119f7cbe7",
  "1472099645785-5658abf4ff4e",
  "1494790108377-be9c29b29330",
  "1438761681033-6461ffad8d80",
];

const GALLERY_PHOTOS = [
  ...ACADEMIC_PHOTOS,
  ...ARTS_PHOTOS,
  ...SPORTS_PHOTOS,
  ...COMMUNITY_PHOTOS,
];

export async function seed() {
  const db = drizzle(env.DB, { schema });

  console.log("Seeding database...");

  // Clear existing data (order matters for foreign keys)
  await db.delete(schema.galleryImages);
  await db.delete(schema.gallery);
  await db.delete(schema.obDonations);
  await db.delete(schema.obEvents);
  await db.delete(schema.obNews);
  await db.delete(schema.obAnnouncements);
  await db.delete(schema.obMembers);
  await db.delete(schema.notifications);
  await db.delete(schema.clubAlbumImages);
  await db.delete(schema.clubAlbums);
  await db.delete(schema.clubMembers);
  await db.delete(schema.eventRecords);
  await db.delete(schema.bigMatches);
  await db.delete(schema.studentWorks);
  await db.delete(schema.achievements);
  await db.delete(schema.events);
  await db.delete(schema.news);
  await db.delete(schema.announcements);
  await db.delete(schema.activities);
  await db.delete(schema.staffMembers);
  await db.delete(schema.examStudents);
  await db.delete(schema.universityAdmissions);
  await db.delete(schema.examResults);
  await db.delete(schema.files);
  await db.delete(schema.stats);
  await db.delete(schema.principals);
  await db.delete(schema.siteSettings);

  const userId = "user_seed_001";
  const now = new Date();

  // ── Stats ──
  const stats = [
    { label: "Students Enrolled", value: "1,240", icon: "users" },
    { label: "Faculty Members", value: "86", icon: "graduation-cap" },
    { label: "Clubs & Societies", value: "24", icon: "users" },
    { label: "Years of Excellence", value: "47", icon: "award" },
    { label: "Events This Year", value: "62", icon: "calendar" },
    { label: "Awards Won", value: "153", icon: "trophy" },
  ];
  for (let i = 0; i < stats.length; i++) {
    await db.insert(schema.stats).values({
      id: faker.string.uuid(),
      label: stats[i]!.label,
      value: stats[i]!.value,
      icon: stats[i]!.icon,
      sortOrder: i,
      createdAt: now,
      updatedAt: now,
    });
  }
  console.log(`Seeded ${stats.length} stats`);

  // ── Site Settings ──
  const settingsMap = new Map<string, string>();
  settingsMap.set(
    "about",
    "Founded in 1862 by the Jesuit Fathers of the Society of Jesus, St. Aloysius' College has been a beacon of academic excellence and holistic development. Our campus in Galle provides state-of-the-art facilities for academics, sports, and the arts.",
  );
  for (const [key, value] of Object.entries(HOMEPAGE_DEFAULTS)) {
    settingsMap.set(key, value);
  }
  settingsMap.set("ob_admin_email", ADMIN_EMAIL);
  settingsMap.set("heritage_image_1", unsplash(pick(HERITAGE_PHOTOS, 0), 800, 600));
  settingsMap.set("heritage_image_2", unsplash(pick(HERITAGE_PHOTOS, 1), 800, 600));
  const settings = Array.from(settingsMap.entries()).map(([key, value]) => ({ key, value }));
  for (const s of settings) {
    await db.insert(schema.siteSettings).values({ key: s.key, value: s.value, updatedAt: now });
  }
  console.log(`Seeded ${settings.length} site settings`);

  // ── Files (placeholder upload records) ──
  const filesData = Array.from({ length: 6 }, (_v, i) => ({
    id: faker.string.uuid(),
    name: `cover-${i + 1}.jpg`,
    size: faker.number.int({ min: 50000, max: 2000000 }),
    type: "image/jpeg",
    key: `uploads/seed/cover-${i + 1}.jpg`,
    userId,
    createdAt: now,
    updatedAt: now,
  }));
  for (const file of filesData) {
    await db.insert(schema.files).values(file);
  }
  console.log(`Seeded ${filesData.length} files`);

  // ── News ──
  const newsItems = [
    {
      title: "Annual Science Exhibition Draws Record Attendance",
      content:
        "Over 800 visitors attended this year's Annual Science Exhibition, showcasing 64 projects from students across all grades. The event was inaugurated by Dr. Malini Gunasekara, a former alumnus and leading researcher at the Arthur C. Clarke Institute for Space and Modern Technology.\n\nProjects ranged from AI-powered crop monitoring systems to sustainable water purification prototypes. The judging panel included industry professionals from Dialog Axiata and WSO2, who praised the innovation and practical application of student projects.\n\nBest Project Award went to 11th-graders Yohan Peiris and Senuri Fonseka for their low-cost air quality monitoring device, which has already been adopted by the Galle Municipal Council for pilot testing.",
      excerpt:
        "Over 800 visitors attended this year's Annual Science Exhibition, showcasing 64 innovative student projects.",
      authorName: "Mr. Rasika Mendis",
      authorType: "faculty",
      tags: ["science", "exhibition", "innovation"],
      coverImage: unsplash(pick(ACADEMIC_PHOTOS, 0), 800, 400),
    },
    {
      title: "Inter-School Cricket Team Reaches State Finals",
      content:
        "Our cricket team, led by captain Rohan Perera, has qualified for the state-level inter-school cricket tournament after a dominant performance in the regional qualifiers.\n\nThe team won 6 out of 7 matches, with standout performances from fast bowler Arjun Rathnayake (14 wickets) and opening batsman Vishwa Jayasinghe (342 runs). The finals will be held in Kandy from March 15-20.\n\nCoach Mr. Sunil Abeywardena credited the team's disciplined training schedule and strong teamwork for their success.",
      excerpt:
        "Our cricket team qualifies for state finals after winning 6 out of 7 regional matches.",
      authorName: "Mr. Sunil Abeywardena",
      authorType: "faculty",
      tags: ["sports", "cricket", "achievement"],
      coverImage: unsplash(pick(SPORTS_PHOTOS, 0), 800, 400),
    },
    {
      title: "Students Win National Coding Competition",
      content:
        "A team of four students from the Coding Club won first place at CodeX national finals held in Colombo, competing against 200 teams from schools across Sri Lanka.\n\nTeam members Kasun Bandara, Ishara Wickramasinghe, Adithya Karunaratne, and Navya Dissanayake built an AI-powered waste sorting system that uses computer vision to identify and categorize recyclable materials.\n\nThe team received a cash prize of Rs. 200,000 and has been invited to present their solution at the International Science Fair in Singapore.",
      excerpt:
        "Coding Club team wins first place at CodeX nationals with their AI-powered waste sorting system.",
      authorName: "Mrs. Priyanka Amarasinghe",
      authorType: "faculty",
      tags: ["coding", "competition", "national"],
      coverImage: unsplash(pick(TECH_PHOTOS, 0), 800, 400),
    },
    {
      title: "Cultural Fest 'Xaviera 2026' Announces Lineup",
      content:
        "Xaviera 2026, our annual cultural festival, will be held from February 20-22. This year's theme is 'Unity in Diversity' and will feature performances by students, guest artists, and alumni.\n\nHighlights include a classical Kandyan dance performance by our alumni dance troupe, a rock concert by student band The Frequencies, and a play directed by drama teacher Mrs. Deepika Wijeratne.\n\nRegistrations for individual and group events are now open through the school app.",
      excerpt:
        "Xaviera 2026 cultural festival scheduled for February 20-22 with the theme 'Unity in Diversity'.",
      authorName: "Anushka Gunawardena",
      authorType: "student",
      tags: ["cultural", "festival", "arts"],
      coverImage: unsplash(pick(ARTS_PHOTOS, 0), 800, 400),
    },
    {
      title: "New Computer Lab Inaugurated with 50 Workstations",
      content:
        "The school inaugurated a new state-of-the-art computer lab equipped with 50 high-performance workstations, each loaded with development tools for AI, data science, and web development.\n\nThe lab was inaugurated by Mr. Nishantha Weerakoon, CTO of TechVista Solutions, Colombo and a proud parent. The facility includes a dedicated server room, high-speed internet, and 3D printers for the robotics team.\n\nAll students will have scheduled lab sessions, and the lab will be open for self-study during lunch breaks and after school hours.",
      excerpt:
        "New computer lab with 50 high-performance workstations inaugurated for coding and AI development.",
      authorName: "Dr. Sunethra Jayakody",
      authorType: "faculty",
      tags: ["infrastructure", "technology", "computers"],
      coverImage: unsplash(pick(TECH_PHOTOS, 1), 800, 400),
    },
    {
      title: "Art Students Exhibit at City Gallery",
      content:
        "Twenty-three students from the Art & Design Club had their work displayed at the National Art Gallery, Colombo as part of a youth art showcase.\n\nThe exhibition, titled 'Perspectives', featured paintings, charcoal drawings, digital art, and mixed-media installations. Themes ranged from environmental conservation to mental health awareness.\n\nMyra de Zoysa's digital series 'Urban Solitude' received special recognition from the gallery curator, who called it 'remarkably mature for a student artist'.",
      excerpt:
        "23 students from Art & Design Club exhibit their work at the National Art Gallery, Colombo.",
      authorName: "Mrs. Deepika Wijeratne",
      authorType: "faculty",
      tags: ["art", "exhibition", "students"],
      coverImage: unsplash(pick(ARTS_PHOTOS, 1), 800, 400),
    },
    {
      title: "Parent-Teacher Meeting Scheduled for January 25",
      content:
        "The quarterly Parent-Teacher Meeting for all grades will be held on Saturday, January 25, from 9:00 AM to 2:00 PM.\n\nParents are requested to collect their child's progress report from the respective class teachers. Career counseling booths will be available for students in grades 10 and 12.\n\nAppointments can be booked through the school portal or by contacting the front office.",
      excerpt:
        "PTM on January 25 from 9 AM to 2 PM. Progress reports and career counseling available.",
      authorName: "Mrs. Kumari Wanigasekara",
      authorType: "faculty",
      tags: ["announcement", "parents", "academic"],
      coverImage: unsplash(pick(ACADEMIC_PHOTOS, 1), 800, 400),
    },
    {
      title: "Eco Warriors Club Plants 500 Trees on Campus",
      content:
        "The Eco Warriors Club, in partnership with the local forestry department, organized a massive tree plantation drive on campus, planting over 500 saplings of native species.\n\nStudents from grades 6-12 participated in the drive, which is part of the school's initiative to achieve carbon neutrality by 2030. The saplings include neem, peepal, and banyan trees, chosen for their environmental benefits.\n\nThe club plans to adopt a monitoring system where each class will be responsible for the care of their planted saplings.",
      excerpt:
        "Eco Warriors plants 500 native species saplings as part of the school's carbon neutrality initiative.",
      authorName: "Ravindu Thennakoon",
      authorType: "student",
      tags: ["eco", "environment", "community"],
      coverImage: unsplash(pick(COMMUNITY_PHOTOS, 0), 800, 400),
    },
  ];
  for (const item of newsItems) {
    await db.insert(schema.news).values({
      id: faker.string.uuid(),
      slug: toSlug(item.title),
      title: item.title,
      content: item.content,
      excerpt: item.excerpt,
      coverImage: item.coverImage,
      authorName: item.authorName,
      authorType: item.authorType as "student" | "faculty" | "club" | "org",
      tags: item.tags,
      status: "published",
      publishedAt: daysAgo(faker.number.int({ min: 1, max: 30 })),
      createdAt: now,
      updatedAt: now,
      userId,
    });
  }
  console.log(`Seeded ${newsItems.length} news`);

  // ── Announcements ──
  const announcements = [
    {
      title: "Mid-Term Examinations Schedule Released",
      content:
        "The mid-term examinations for grades 9-12 will begin from February 3 and conclude on February 14. Detailed timetables have been shared on the school portal.\n\nStudents are advised to complete their revision and submit any pending assignments by January 31. Extra doubt-clearing sessions will be held during the last week of January.",
      excerpt: "Mid-term exams from Feb 3-14. Timetables available on the school portal.",
      authorName: "Dr. Sunethra Jayakody",
      authorType: "faculty",
      tags: ["important", "exams", "academic"],
      audience: "students" as const,
    },
    {
      title: "Sports Day Registrations Closing Soon",
      content:
        "Registrations for the annual Sports Day close on January 28. Events include track and field, relay races, tug-of-war, and house-level competitions.\n\nStudents must register through their house captains. Participation certificates will be given to all participants, and winners will receive medals at the closing ceremony.",
      excerpt: "Sports Day registration closes Jan 28. Register through house captains.",
      authorName: "Mr. Sunil Abeywardena",
      authorType: "faculty",
      tags: ["sports", "deadline"],
      audience: "students" as const,
    },
    {
      title: "Bus Route Changes Effective February 1",
      content:
        "Please note that three bus routes will be modified starting February 1 due to road construction on Residency Road.\n\n- Route 7 (Karapitiya) will now go via Wakwella Road\n- Route 12 (Unawatuna) will have two additional stops\n- Route 15 (Habaraduwa) timing shifted 10 minutes earlier\n\nUpdated route maps are available at the transport office.",
      excerpt: "Bus routes 7, 12, and 15 modified from Feb 1. Check new timings.",
      authorName: "Admin Office",
      authorType: "org",
      tags: ["transport", "important"],
      audience: "parents" as const,
    },
    {
      title: "Library Hours Extended for Exam Preparation",
      content:
        "The school library will remain open until 5:00 PM on weekdays starting January 20 to support students preparing for mid-term exams.\n\nAdditional reference materials and past question papers have been made available. Students must carry their library cards for entry.",
      excerpt: "Library open until 5 PM on weekdays for exam prep from Jan 20.",
      authorName: "Mrs. Kumari Wanigasekara",
      authorType: "faculty",
      tags: ["library", "academic"],
      audience: "students" as const,
    },
    {
      title: "Annual Day Rehearsals Begin Next Week",
      content:
        "All students participating in the Annual Day program must attend rehearsals starting January 27. Rehearsals will be held in the school auditorium from 3:30 PM to 5:30 PM.\n\nA attendance is mandatory for performers. Parents of participating students will receive a separate communication regarding the event schedule.",
      excerpt: "Annual Day rehearsals from Jan 27, 3:30-5:30 PM. Mandatory for performers.",
      authorName: "Mrs. Deepika Wijeratne",
      authorType: "faculty",
      tags: ["cultural", "rehearsal"],
      audience: "students" as const,
    },
  ];
  for (const item of announcements) {
    await db.insert(schema.announcements).values({
      id: faker.string.uuid(),
      slug: toSlug(item.title),
      title: item.title,
      content: item.content,
      excerpt: item.excerpt,
      coverImage: null,
      authorName: item.authorName,
      authorType: item.authorType as "student" | "faculty" | "club" | "org",
      tags: item.tags,
      status: "published",
      audience: item.audience,
      addressedTo: null,
      publishedAt: daysAgo(faker.number.int({ min: 1, max: 14 })),
      createdAt: now,
      updatedAt: now,
      userId,
    });
  }
  console.log(`Seeded ${announcements.length} announcements`);

  // ── Events ──
  const events = [
    {
      title: "Annual Science Exhibition 2026",
      content:
        "Join us for the 28th Annual Science Exhibition featuring innovative projects from students across all grades. Categories include Physics, Chemistry, Biology, Computer Science, and Environmental Science.",
      excerpt: "28th Annual Science Exhibition with student projects across 5 categories.",
      purpose: "Showcase student innovation and scientific research",
      organization: "Science Department",
      organizerName: "Dr. Sunethra Jayakody",
      organizerType: "faculty",
      location: "Main Ground",
      tags: ["science", "exhibition", "annual"],
      coverImage: unsplash(pick(ACADEMIC_PHOTOS, 2), 800, 400),
      bodyImage: unsplash(pick(ACADEMIC_PHOTOS, 3), 800, 400),
    },
    {
      title: "Inter-School Football Tournament",
      content:
        "St. Aloysius' College hosts the 12th Inter-School Football Tournament with 16 teams competing over two days. Cheer for our team as they defend their title.",
      excerpt: "12th Inter-School Football Tournament hosted at our campus.",
      purpose: "Promote sportsmanship and inter-school competition",
      organization: "Sports Department",
      organizerName: "Mr. Sunil Abeywardena",
      organizerType: "faculty",
      location: "Football Ground",
      tags: ["sports", "football", "tournament"],
      coverImage: unsplash(pick(SPORTS_PHOTOS, 1), 800, 400),
      bodyImage: unsplash(pick(SPORTS_PHOTOS, 0), 800, 400),
    },
    {
      title: "Workshop on AI and Machine Learning",
      content:
        "A hands-on workshop conducted by industry experts from TechVista Solutions, Colombo on introduction to AI, machine learning basics, and building your first neural network. Open to grades 9-12.",
      excerpt: "Hands-on AI and ML workshop for grades 9-12 by TechVista Solutions, Colombo.",
      purpose: "Introduce students to emerging technologies",
      organization: "Coding Club",
      organizerName: "Kasun Bandara",
      organizerType: "club",
      location: "Computer Lab 2",
      tags: ["technology", "workshop", "ai"],
      coverImage: unsplash(pick(TECH_PHOTOS, 2), 800, 400),
      bodyImage: unsplash(pick(TECH_PHOTOS, 3), 800, 400),
    },
    {
      title: "Xaviera 2026 - Annual Cultural Festival",
      content:
        "Three days of music, dance, drama, and art celebrating 'Unity in Diversity'. Features student performances, guest artists, alumni reunion, and food stalls.",
      excerpt: "Three-day cultural festival with the theme 'Unity in Diversity'.",
      purpose: "Celebrate cultural diversity and student talent",
      organization: "Cultural Committee",
      organizerName: "Anushka Gunawardena",
      organizerType: "student",
      location: "School Auditorium",
      tags: ["cultural", "festival", "arts"],
      coverImage: unsplash(pick(ARTS_PHOTOS, 2), 800, 400),
      bodyImage: unsplash(pick(ARTS_PHOTOS, 3), 800, 400),
    },
    {
      title: "Career Counseling Session for Grade 12",
      content:
        "Expert career counselors from CareerGuidance Lanka will conduct individual and group sessions for grade 12 students. Topics include engineering, medicine, liberal arts, and overseas education options.",
      excerpt: "Career counseling for grade 12 students covering all major streams.",
      purpose: "Guide students in career planning after school",
      organization: "Academic Council",
      organizerName: "Mrs. Priyanka Amarasinghe",
      organizerType: "faculty",
      location: "Conference Room A",
      tags: ["career", "counseling", "seniors"],
      coverImage: unsplash(pick(ACADEMIC_PHOTOS, 4), 800, 400),
      bodyImage: unsplash(pick(ACADEMIC_PHOTOS, 5), 800, 400),
    },
    {
      title: "Green Campus Drive - Waste Segregation Drive",
      content:
        "The Eco Warriors Club organizes a campus-wide waste segregation awareness drive. Students will set up educational booths and conduct interactive sessions on recycling and composting.",
      excerpt: "Eco Warriors waste segregation drive with educational booths.",
      purpose: "Promote environmental awareness and responsible waste management",
      organization: "Eco Warriors Club",
      organizerName: "Ravindu Thennakoon",
      organizerType: "club" as const,
      location: "Outdoor Amphitheater",
      tags: ["eco", "environment", "community"],
      coverImage: unsplash(pick(COMMUNITY_PHOTOS, 1), 800, 400),
      bodyImage: unsplash(pick(COMMUNITY_PHOTOS, 0), 800, 400),
    },
  ];
  const eventsData: (typeof schema.events.$inferInsert)[] = [];
  for (const item of events) {
    const startDate = daysFromNow(faker.number.int({ min: 5, max: 60 }));
    const endDate = new Date(startDate.getTime() + faker.number.int({ min: 2, max: 5 }) * 86400000);
    const data = {
      id: faker.string.uuid(),
      slug: toSlug(item.title),
      title: item.title,
      content: item.content,
      excerpt: item.excerpt,
      coverImage: item.coverImage,
      bodyImage: item.bodyImage,
      purpose: item.purpose,
      organization: item.organization,
      organizerName: item.organizerName,
      organizerType: item.organizerType as "student" | "faculty" | "club" | "org",
      location: item.location,
      startDate,
      endDate,
      isRecurring: false,
      isAllDay: true,
      recurrenceRule: null,
      tags: item.tags,
      status: "published" as const,
      publishedAt: daysAgo(3),
      createdAt: now,
      updatedAt: now,
      userId,
    };
    eventsData.push(data);
    await db.insert(schema.events).values(data);
  }
  console.log(`Seeded ${eventsData.length} events`);

  // ── Event Records ──
  const eventRecords = [
    {
      eventId: eventsData[0]!.id,
      outcome: "success" as const,
      reason: "Well-attended with over 800 visitors",
      notes: "All exhibits functioned correctly. Three projects received external recognition.",
    },
    {
      eventId: eventsData[1]!.id,
      outcome: "success" as const,
      reason: "Smooth tournament with 16 participating schools",
      notes: "Our team finished as runners-up. Good sportsmanship displayed.",
    },
    {
      eventId: eventsData[5]!.id,
      outcome: "postponed" as const,
      reason: "Heavy rainfall forecast for the scheduled date",
      notes: "Rescheduled to next Friday. Volunteers notified.",
    },
  ];
  for (const item of eventRecords) {
    await db.insert(schema.eventRecords).values({
      id: faker.string.uuid(),
      ...item,
      recordedAt: daysAgo(2),
      createdAt: now,
      userId,
    });
  }
  console.log(`Seeded ${eventRecords.length} event records`);

  // ── Achievements ──
  const achievements = [
    {
      title: "National Science Olympiad - Gold Medal",
      description:
        "Arjun Rathnayake and Ishara Wickramasinghe won gold medals in the National Science Olympiad held in Colombo, competing against 2,000 participants from 300 schools.",
      category: "academic" as const,
      recipientNames: ["Arjun Rathnayake", "Ishara Wickramasinghe"],
      year: 2025,
      coverImage: unsplash(pick(ACADEMIC_PHOTOS, 2), 600, 600),
    },
    {
      title: "State Basketball Championship - Winners",
      description:
        "The school basketball team won the Southern Province Inter-School Championship for the third consecutive year, defeating Rahula College, Matara in the finals 68-52.",
      category: "sports" as const,
      recipientNames: ["Basketball Team"],
      year: 2025,
      coverImage: unsplash(pick(SPORTS_PHOTOS, 0), 600, 600),
    },
    {
      title: "Best School Art Program Award",
      description:
        "St. Aloysius' College received the Sri Lanka National Education Award for Best School Art Program, recognizing our commitment to arts education and student exhibitions.",
      category: "arts" as const,
      recipientNames: ["Art & Design Club"],
      year: 2025,
      coverImage: unsplash(pick(ARTS_PHOTOS, 0), 600, 600),
    },
    {
      title: "National Coding Champions - CodeX 2025",
      description:
        "Team 'ByteForce' won the CodeX National Coding Championship, building an AI-powered waste sorting system that impressed judges from Google and Microsoft.",
      category: "academic" as const,
      recipientNames: ["Kasun Bandara", "Ishara Wickramasinghe", "Adithya Karunaratne", "Navya Dissanayake"],
      year: 2025,
      coverImage: unsplash(pick(TECH_PHOTOS, 4), 600, 600),
    },
    {
      title: "Eco School Green Flag Certification",
      description:
        "The school received the prestigious Green Flag Certification from the Foundation for Environmental Education for our sustainability initiatives including solar panels and rainwater harvesting.",
      category: "community" as const,
      recipientNames: ["Eco Warriors Club"],
      year: 2024,
      coverImage: unsplash(pick(COMMUNITY_PHOTOS, 1), 600, 600),
    },
  ];
  for (const item of achievements) {
    await db.insert(schema.achievements).values({
      id: faker.string.uuid(),
      slug: toSlug(item.title),
      title: item.title,
      description: item.description,
      category: item.category,
      recipientNames: item.recipientNames,
      recipientType: item.category === "sports" ? "student" : "club",
      year: item.year,
      coverImage: item.coverImage,
      tags: [item.category],
      status: "published",
      publishedAt: daysAgo(faker.number.int({ min: 10, max: 60 })),
      createdAt: now,
      updatedAt: now,
      userId,
    });
  }
  console.log(`Seeded ${achievements.length} achievements`);

  // ── Student Works ──
  const studentWorks = [
    {
      title: "Urban Solitude - Digital Art Series",
      description:
        "A series of 8 digital illustrations exploring the feeling of isolation in crowded city spaces. Each piece uses a muted color palette with selective pops of color to represent moments of connection.",
      category: "art" as const,
      studentNames: ["Myra de Zoysa"],
      studentGrade: "12th",
      tags: ["digital art", "illustration", "urban life"],
      coverImage: unsplash(pick(ARTS_PHOTOS, 0), 600, 600),
    },
    {
      title: "EcoSort - AI Waste Classifier",
      description:
        "A machine learning model trained on 10,000+ images to classify waste into recyclable, compostable, and landfill categories. Built with TensorFlow and deployed as a mobile app.",
      category: "code" as const,
      studentNames: ["Kasun Bandara", "Adithya Karunaratne"],
      studentGrade: "11th",
      tags: ["ai", "sustainability", "machine learning"],
      coverImage: unsplash(pick(TECH_PHOTOS, 0), 600, 600),
    },
    {
      title: "Monsoon - Short Film",
      description:
        "A 12-minute short film about a friendship that forms between two students from different backgrounds during a monsoon season. Shot on campus and in the streets of Galle.",
      category: "film" as const,
      studentNames: ["Vishwa Jayasinghe", "Saduni Perera"],
      studentGrade: "12th",
      tags: ["film", "storytelling", "campus life"],
      coverImage: unsplash(pick(ARTS_PHOTOS, 3), 600, 600),
    },
    {
      title: "Echoes of the Past - Historical Research Paper",
      description:
        "A research paper examining the architectural heritage of colonial-era buildings in Galle and their preservation challenges. Includes original photography and interviews with conservation experts.",
      category: "writing" as const,
      studentNames: ["Prisha Gamage", "Senuri Fonseka"],
      studentGrade: "11th",
      tags: ["research", "history", "architecture"],
      coverImage: unsplash(pick(ACADEMIC_PHOTOS, 3), 600, 600),
    },
    {
      title: "Rhythm of Rain - Original Music Composition",
      description:
        "An original composition for piano and flute inspired by the monsoon season. Performed at Xaviera 2025 and recorded in the school music room.",
      category: "music" as const,
      studentNames: ["Anushka Gunawardena"],
      studentGrade: "10th",
      tags: ["music", "composition", "classical"],
      coverImage: unsplash(pick(ARTS_PHOTOS, 1), 600, 600),
    },
    {
      title: "Smart Campus Dashboard",
      description:
        "A full-stack web application that displays real-time data on school bus locations, cafeteria menu, library availability, and event schedules. Built with React and Node.js.",
      category: "code" as const,
      studentNames: ["Arnav Rodrigo", "Dhruv Silva"],
      studentGrade: "12th",
      tags: ["web development", "react", "full stack"],
      coverImage: unsplash(pick(TECH_PHOTOS, 2), 600, 600),
    },
  ];
  const studentWorksData: (typeof schema.studentWorks.$inferInsert)[] = [];
  for (const item of studentWorks) {
    const data = {
      id: faker.string.uuid(),
      slug: toSlug(item.title),
      title: item.title,
      description: item.description,
      category: item.category,
      studentNames: item.studentNames,
      studentGrade: item.studentGrade,
      authorType: "student" as const,
      coverImage: item.coverImage,
      contentUrl: faker.internet.url(),
      tags: item.tags,
      status: "published" as const,
      publishedAt: daysAgo(faker.number.int({ min: 5, max: 45 })),
      createdAt: now,
      updatedAt: now,
      userId,
    };
    studentWorksData.push(data);
    await db.insert(schema.studentWorks).values(data);
  }
  console.log(`Seeded ${studentWorksData.length} student works`);

  // ── Gallery ──
  const galleries = [
    {
      title: "Science Exhibition 2025 Highlights",
      description:
        "Moments from the 27th Annual Science Exhibition held in December 2025, featuring over 50 student projects.",
      eventId: eventsData[0]?.id ?? null,
      tags: ["science", "exhibition"],
      coverImage: unsplash(pick(ACADEMIC_PHOTOS, 4), 600, 600),
      photoPool: ACADEMIC_PHOTOS,
    },
    {
      title: "Sports Day 2025",
      description:
        "Action shots from the annual Sports Day featuring track events, relay races, and house competitions.",
      eventId: eventsData[1]?.id ?? null,
      tags: ["sports", "athletics"],
      coverImage: unsplash(pick(SPORTS_PHOTOS, 1), 600, 600),
      photoPool: SPORTS_PHOTOS,
    },
    {
      title: "Art Exhibition - Perspectives",
      description:
        "Photos from the student art exhibition at the National Art Gallery, Colombo showcasing paintings, digital art, and installations.",
      achievementId: null,
      tags: ["art", "exhibition"],
      coverImage: unsplash(pick(ARTS_PHOTOS, 2), 600, 600),
      photoPool: ARTS_PHOTOS,
    },
    {
      title: "Campus Life 2025-26",
      description:
        "A collection of candid moments from everyday life at St. Aloysius' College - classrooms, corridors, lunch breaks, and celebrations.",
      tags: ["campus", "life", "students"],
      coverImage: unsplash(pick(HERITAGE_PHOTOS, 0), 600, 600),
      photoPool: GALLERY_PHOTOS,
    },
  ];
  const galleryData: (typeof schema.gallery.$inferInsert & { photoPool: string[] })[] = [];
  for (const item of galleries) {
    const { photoPool, ...data } = {
      id: faker.string.uuid(),
      slug: toSlug(item.title),
      title: item.title,
      description: item.description,
      eventId: item.eventId ?? null,
      studentWorkId: null,
      achievementId: item.achievementId ?? null,
      coverImage: item.coverImage,
      photoPool: item.photoPool,
      authorName: faker.helpers.arrayElement([
        "Mr. Rasika Mendis",
        "Mrs. Priyanka Amarasinghe",
        "Dr. Sunethra Jayakody",
        "Mr. Ananda Dharmasena",
        "Mrs. Kumari Wanigasekara",
        "Mr. Sunil Abeywardena",
        "Mrs. Deepika Wijeratne",
        "Dr. Amal Seneviratne",
      ]),
      authorType: "faculty" as const,
      tags: item.tags,
      status: "published" as const,
      publishedAt: daysAgo(faker.number.int({ min: 3, max: 20 })),
      createdAt: now,
      updatedAt: now,
      userId,
    };
    galleryData.push({ ...data, photoPool });
    await db.insert(schema.gallery).values(data);
  }
  console.log(`Seeded ${galleryData.length} gallery entries`);

  // ── Gallery Images ──
  let totalImages = 0;
  let galleryImageIndex = 0;
  for (const g of galleryData) {
    const count = faker.number.int({ min: 3, max: 6 });
    for (let i = 0; i < count; i++) {
      await db.insert(schema.galleryImages).values({
        id: faker.string.uuid(),
        galleryId: g.id!,
        url: unsplash(pick(g.photoPool, galleryImageIndex++), 1200, 800),
        caption: faker.helpers.arrayElement([
          "Students presenting their project",
          "Audience engagement during the event",
          "Winners receiving their certificates",
          "Behind the scenes preparation",
          "Group photo with faculty",
          "Auditorium during the main event",
          "Students working on their exhibits",
          "Closing ceremony highlights",
        ]),
        sortOrder: i,
        createdAt: now,
      });
      totalImages++;
    }
  }
  console.log(`Seeded ${totalImages} gallery images`);

  // ── Big Matches ──
  const bigMatches = [
    {
      name: "Battle of the Two Cities",
      opponent: "Rahula College, Matara",
      type: "Cricket",
      year: 2025,
      coverImage:
        "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&h=500&fit=crop",
    },
    {
      name: "Battle of the Glory of Galle",
      opponent: "Vidyaloka College, Galle",
      type: "Cricket",
      year: 2025,
      coverImage:
        "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&h=500&fit=crop",
    },
    {
      name: "The Battle of Dreams",
      opponent: "Holy Cross College, Kalutara",
      type: "Cricket",
      year: 2026,
      coverImage: unsplash(pick(SPORTS_PHOTOS, 0), 800, 500),
    },
  ];
  for (let i = 0; i < bigMatches.length; i++) {
    await db.insert(schema.bigMatches).values({
      id: faker.string.uuid(),
      slug: toSlug(bigMatches[i]!.name),
      ...bigMatches[i]!,
      eventId: i < eventsData.length ? eventsData[i]!.id : null,
      galleryId: i < galleryData.length ? galleryData[i]!.id : null,
      sortOrder: i,
      status: "published",
      createdAt: now,
      updatedAt: now,
    });
  }
  console.log(`Seeded ${bigMatches.length} big matches`);

  // ── Exam Results ──
  const examResultsData = [
    {
      examType: "scholarship" as const,
      examYear: 2026,
      resultsYear: 2026,
      status: "published" as const,
      students: [
        {
          name: "Sandaru Perera",
          photo:
            "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=faces",
          quote: "Hard work beats talent when talent doesn't work hard.",
          marks: 197,
        },
        {
          name: "Tharindu Silva",
          photo:
            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces",
          quote: "Dream big, study harder.",
          marks: 195,
        },
        {
          name: "Dineth Fernando",
          photo:
            "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=faces",
          quote: "Small steps every day.",
          marks: 193,
        },
        {
          name: "Kavindu Jayasuriya",
          photo:
            "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop&crop=faces",
          quote: "",
          marks: 192,
        },
        {
          name: "Oshan Rathnayake",
          photo:
            "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=faces",
          quote: "Focus on the goal.",
          marks: 190,
        },
        {
          name: "Pasindu Wijesinghe",
          photo:
            "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=faces",
          quote: "",
          marks: 189,
        },
        {
          name: "Lahiru Gunaratne",
          photo:
            "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=faces",
          quote: "Perseverance is key.",
          marks: 188,
        },
        {
          name: "Ravindu Dissanayake",
          photo:
            "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop&crop=faces",
          quote: "",
          marks: 187,
        },
        {
          name: "Nethmi Jayawardena",
          photo:
            "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=faces",
          quote: "Learn something new every day.",
          marks: 186,
        },
        {
          name: "Sachini Karunaratne",
          photo:
            "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=faces",
          quote: "",
          marks: 185,
        },
      ],
    },
    {
      examType: "ol" as const,
      examYear: 2025,
      resultsYear: 2026,
      status: "published" as const,
      students: [
        {
          name: "Kavindu Jayasuriya",
          photo:
            "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop&crop=faces",
          quote: "The future belongs to those who prepare for it.",
          overallGrade: "A",
        },
        {
          name: "Oshan Rathnayake",
          photo:
            "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=faces",
          quote: "",
          overallGrade: "A",
        },
        {
          name: "Dineth Fernando",
          photo:
            "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=faces",
          quote: "Discipline is the bridge between goals and accomplishment.",
          overallGrade: "A",
        },
        {
          name: "Tharindu Silva",
          photo:
            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces",
          quote: "",
          overallGrade: "A",
        },
        {
          name: "Sandaru Perera",
          photo:
            "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=faces",
          quote: "Success is the sum of small efforts.",
          overallGrade: "B",
        },
        {
          name: "Pasindu Wijesinghe",
          photo:
            "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=faces",
          quote: "",
          overallGrade: "A",
        },
        {
          name: "Ravindu Dissanayake",
          photo:
            "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop&crop=faces",
          quote: "Strive for progress, not perfection.",
          overallGrade: "B",
        },
      ],
    },
    {
      examType: "al" as const,
      examYear: 2025,
      resultsYear: 2026,
      status: "published" as const,
      students: [
        {
          name: "Nethmi Jayawardena",
          photo:
            "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=faces",
          quote: "The only way to do great work is to love what you do.",
          stream: "biological_science",
          subjects: [
            { subject: "Biology", grade: "A" },
            { subject: "Chemistry", grade: "A" },
            { subject: "Physics", grade: "A" },
          ],
        },
        {
          name: "Sachini Karunaratne",
          photo:
            "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=faces",
          quote: "",
          stream: "biological_science",
          subjects: [
            { subject: "Biology", grade: "A" },
            { subject: "Chemistry", grade: "A" },
            { subject: "Physics", grade: "B" },
          ],
        },
        {
          name: "Hiruni Bandara",
          photo:
            "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=faces",
          quote: "Believe you can and you're halfway there.",
          stream: "physical_science",
          subjects: [
            { subject: "Combined Mathematics", grade: "A" },
            { subject: "Chemistry", grade: "A" },
            { subject: "Physics", grade: "A" },
          ],
        },
        {
          name: "Isuru Weerasinghe",
          photo:
            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces",
          quote: "",
          stream: "physical_science",
          subjects: [
            { subject: "Combined Mathematics", grade: "A" },
            { subject: "Chemistry", grade: "A" },
            { subject: "Physics", grade: "A" },
          ],
        },
        {
          name: "Malith De Silva",
          photo:
            "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=faces",
          quote: "Commerce is the engine of the economy.",
          stream: "commerce",
          subjects: [
            { subject: "Accounting", grade: "A" },
            { subject: "Business Studies", grade: "A" },
            { subject: "Economics", grade: "A" },
          ],
        },
        {
          name: "Chamath Liyanage",
          photo:
            "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop&crop=faces",
          quote: "",
          stream: "commerce",
          subjects: [
            { subject: "Accounting", grade: "A" },
            { subject: "Business Studies", grade: "A" },
            { subject: "Economics", grade: "B" },
          ],
        },
        {
          name: "Yasas Wickramasinghe",
          photo:
            "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=faces",
          quote: "Art is the most intense mode of individualism.",
          stream: "arts",
          subjects: [
            { subject: "Art", grade: "A" },
            { subject: "Sinhala Literature", grade: "A" },
            { subject: "History", grade: "A" },
          ],
        },
        {
          name: "Gayathri Herath",
          photo:
            "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=faces",
          quote: "",
          stream: "arts",
          subjects: [
            { subject: "Art", grade: "A" },
            { subject: "Sinhala Literature", grade: "A" },
            { subject: "History", grade: "B" },
          ],
        },
      ],
      universityAdmissions: [
        { studentName: "Nethmi Jayawardena", university: "University of Colombo", course: "MBBS (Medicine)", sortOrder: 0 },
        { studentName: "Sachini Karunaratne", university: "University of Peradeniya", course: "BSc Nursing", sortOrder: 1 },
        { studentName: "Hiruni Bandara", university: "University of Moratuwa", course: "BSc (Hons) Engineering", sortOrder: 2 },
        { studentName: "Isuru Weerasinghe", university: "University of Moratuwa", course: "BSc (Hons) Software Engineering", sortOrder: 3 },
        { studentName: "Malith De Silva", university: "University of Kelaniya", course: "BCom (Commerce)", sortOrder: 4 },
        { studentName: "Chamath Liyanage", university: "University of Sri Jayewardenepura", course: "BSc Business Administration", sortOrder: 5 },
        { studentName: "Yasas Wickramasinghe", university: "University of Kelaniya", course: "BA (Arts)", sortOrder: 6 },
        { studentName: "Gayathri Herath", university: "University of the Visual and Performing Arts", course: "BA (Arts)", sortOrder: 7 },
      ],
    },
  ];
  for (const item of examResultsData) {
    const resultId = faker.string.uuid();
    await db.insert(schema.examResults).values({
      id: resultId,
      examType: item.examType,
      examYear: item.examYear,
      resultsYear: item.resultsYear,
      status: item.status,
      createdAt: now,
      updatedAt: now,
      userId,
    });
    for (let i = 0; i < item.students.length; i++) {
      const s = item.students[i]!;
      await db.insert(schema.examStudents).values({
        id: faker.string.uuid(),
        examResultId: resultId,
        name: s.name,
        photo: s.photo ?? null,
        quote: s.quote ?? null,
        marks: (s as any).marks ?? null,
        overallGrade: (s as any).overallGrade ?? null,
        stream: (s as any).stream ?? null,
        subjects: (s as any).subjects ?? [],
        sortOrder: i,
        createdAt: now,
      });
    }
    for (const a of (item as any).universityAdmissions ?? []) {
      await db.insert(schema.universityAdmissions).values({
        id: faker.string.uuid(),
        examResultId: resultId,
        studentName: a.studentName,
        university: a.university,
        course: a.course,
        sortOrder: a.sortOrder ?? 0,
        createdAt: now,
      });
    }
  }
  console.log(`Seeded ${examResultsData.length} exam results`);

  // ── Staff ──
  const principalsData = [
    {
      name: "Fr. Jason Thomas",
      title: "Principal",
      year: "2025",
      quote:
        "Every Aloysian carries forward a tradition of faith, discipline and excellence - certa viriliter. Our mission is to form men and women who will serve as a light to the world through knowledge, compassion and integrity.",
      message:
        "Dear Students, Parents, and Well-Wishers,\n\nIt is with great joy and humility that I welcome you to St. Aloysius' College, a school that has stood on the shores of Galle since 1862 as a beacon of faith, discipline, and academic excellence.\n\nEvery Aloysian carries forward a tradition of faith, discipline and excellence - certa viriliter, which means 'fight manfully'. These two words have guided generations of young men who have walked these corridors and gone on to serve as leaders in every field, both in Sri Lanka and across the world.\n\nOur mission is simple: to form men and women who will serve as a light to the world through knowledge, compassion and integrity. We believe that education is not merely the passing of examinations, but the formation of character. We strive to nurture young minds to think critically, act justly, and serve generously.\n\nTo our students, I say: make the most of every opportunity this great institution offers. Let your studies, your sports, your music and your service all be offered in the spirit of certa viriliter.\n\nTo our parents, I extend my heartfelt gratitude for your trust and partnership. Together, we will form the next generation of Aloysian gentlemen.\n\nMay God bless you all.\n\nCerta Viriliter.",
      bio: "Fr. Jason Thomas was appointed Principal of St. Aloysius' College in 2019. A priest of the Society of Jesus with a deep commitment to Catholic education in Sri Lanka, he has served in Jesuit schools across the island for over two decades, championing holistic formation that balances academics, spirituality, and character.",
      education:
        "B.A. (Hons) - University of Peradeniya\nM.Phil. in Education - University of Colombo\nDiploma in Spiritual Direction - National Seminary, Ampitiya",
      tenure: "2019 - Present",
      portrait:
        "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600&h=800&fit=crop&crop=faces",
      sortOrder: 0,
      status: "published" as const,
    },
    {
      name: "Rev. Fr. Joseph Perera",
      title: "Vice Principal",
      year: "2025",
      quote:
        "A good education is the foundation on which a nation is built; we must build it with faith and fear of God.",
      message:
        "It has been my privilege to walk alongside the young men of St. Aloysius' College during my years as Rector. I have seen the fire of curiosity in their eyes and the strength of character in their actions.\n\nEducation in our tradition is a partnership between the school, the family, and the Church. We must never forget that the child we form today will be the leader, the father, and the citizen of tomorrow. Let us form them with patience, with love, and with the fear of God.\n\nI thank every teacher, every parent, and every old boy who continues to uphold the values of this great college.",
      bio: "Rev. Fr. Joseph Perera served as Rector of St. Aloysius' College from 2009 to 2019, leading the college through a decade of growth and renewal.",
      education: "B.D. - National Seminary, Kandy",
      tenure: "2009 - 2019",
      portrait:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop&crop=faces",
      sortOrder: 1,
      status: "published" as const,
    },
  ];
  for (const item of principalsData) {
    await db.insert(schema.principals).values({
      id: faker.string.uuid(),
      slug: toSlug(item.name),
      name: item.name,
      title: item.title,
      year: item.year,
      quote: item.quote,
      message: item.message,
      bio: item.bio,
      education: item.education,
      tenure: item.tenure,
      portrait: item.portrait,
      sortOrder: item.sortOrder,
      status: item.status,
      createdAt: now,
      updatedAt: now,
      userId,
    });
  }
  console.log(`Seeded ${principalsData.length} staff members`);

  // ── Activities ──
  const activities = [
    {
      name: "Robotics Club",
      description:
        "Design, build, and program robots for competitions and demonstrations. Members learn mechanical engineering, electronics, and programming through hands-on projects.",
      type: "club" as const,
      coverImage:
        "https://images.unsplash.com/photo-1535378917042-10a22c95931a?w=800&h=400&fit=crop",
      logoUrl: "https://images.unsplash.com/photo-1535378917042-10a22c95931a?w=200&h=200&fit=crop",
      bannerUrl:
        "https://images.unsplash.com/photo-1535378917042-10a22c95931a?w=1200&h=400&fit=crop",
      images: [
        "https://images.unsplash.com/photo-1535378917042-10a22c95931a?w=800&h=400&fit=crop",
        "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=400&fit=crop",
      ],
      adminEmail: ADMIN_EMAIL,
      status: "published" as const,
    },
    {
      name: "Cricket Team",
      description:
        "Competitive cricket program with coaching from former state-level players. Teams compete in inter-school tournaments throughout the year.",
      type: "sport" as const,
      coverImage:
        "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&h=400&fit=crop",
      logoUrl: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=200&h=200&fit=crop",
      bannerUrl:
        "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=1200&h=400&fit=crop",
      images: [
        "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&h=400&fit=crop",
        "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&h=400&fit=crop",
      ],
      adminEmail: ADMIN_EMAIL,
      status: "published" as const,
    },
    {
      name: "Debate Society",
      description:
        "Weekly debate sessions, public speaking workshops, and participation in Model United Nations. Open to all grades with beginner and advanced tracks.",
      type: "club" as const,
      coverImage:
        "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&h=400&fit=crop",
      logoUrl: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=200&h=200&fit=crop",
      bannerUrl:
        "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=1200&h=400&fit=crop",
      images: ["https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&h=400&fit=crop"],
      adminEmail: ADMIN_EMAIL,
      status: "published" as const,
    },
    {
      name: "Music Ensemble",
      description:
        "Students learn and perform vocal and instrumental music. The ensemble includes a choir, rock band, and classical group. Performances at all school events.",
      type: "club" as const,
      coverImage:
        "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800&h=400&fit=crop",
      logoUrl: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=200&h=200&fit=crop",
      bannerUrl:
        "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=1200&h=400&fit=crop",
      images: ["https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800&h=400&fit=crop"],
      adminEmail: ADMIN_EMAIL,
      status: "published" as const,
    },
    {
      name: "Eco Warriors Club",
      description:
        "Environmental awareness and action club. Activities include tree plantation drives, waste management campaigns, and sustainability projects across campus.",
      type: "club" as const,
      coverImage:
        "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&h=400&fit=crop",
      logoUrl: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=200&h=200&fit=crop",
      bannerUrl:
        "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=1200&h=400&fit=crop",
      images: ["https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&h=400&fit=crop"],
      adminEmail: ADMIN_EMAIL,
      status: "published" as const,
    },
  ];
  const activitiesData: { id: string; name: string }[] = [];
  for (let i = 0; i < activities.length; i++) {
    const id = faker.string.uuid();
    await db.insert(schema.activities).values({
      id,
      slug: toSlug(activities[i]!.name),
      name: activities[i]!.name,
      description: activities[i]!.description,
      coverImage: activities[i]!.coverImage,
      logoUrl: activities[i]!.logoUrl,
      bannerUrl: activities[i]!.bannerUrl,
      images: activities[i]!.images,
      type: activities[i]!.type,
      adminEmail: activities[i]!.adminEmail,
      sortOrder: i,
      status: i < 3 ? "published" : "draft",
      createdAt: now,
      updatedAt: now,
    });
    activitiesData.push({ id, name: activities[i]!.name });
  }
  console.log(
    `Seeded ${activitiesData.length} activities (${activitiesData.filter((_, i) => i < 3).length} published, ${activitiesData.filter((_, i) => i >= 3).length} draft)`,
  );

  // ── Staff Members ──
  const staffMembers = [
    {
      name: "Rev. Fr. Joseph Perera",
      role: "Vice Principal",
      email: "viceprincipal@aloysiuscollege.lk",
      bio: "Supports the Principal in academic and disciplinary affairs.",
      year: "2026",
      sortOrder: 0,
    },
    {
      name: "Mr. Sunil Abeywardena",
      role: "Head of Sports",
      email: "sports@aloysiuscollege.lk",
      bio: "Coordinates all sports programs and inter-school tournaments.",
      year: "2026",
      sortOrder: 1,
    },
    {
      name: "Mrs. Priyanka Amarasinghe",
      role: "Head of Science",
      email: "science@aloysiuscollege.lk",
      bio: "Leads the Science department and oversees laboratory resources.",
      year: "2026",
      sortOrder: 2,
    },
    {
      name: "Mrs. Deepika Wijeratne",
      role: "Head of Arts",
      email: "arts@aloysiuscollege.lk",
      bio: "Directs cultural programs, drama, and music activities.",
      year: "2026",
      sortOrder: 3,
    },
    {
      name: "Mr. Rasika Mendis",
      role: "Senior Teacher - Mathematics",
      email: "rasika.mendis@aloysiuscollege.lk",
      bio: "Teaches Advanced Mathematics and coaches the Olympiad team.",
      year: "2026",
      sortOrder: 4,
    },
    {
      name: "Mrs. Kumari Wanigasekara",
      role: "Senior Teacher - English",
      email: "kumari.wanigasekara@aloysiuscollege.lk",
      bio: "Leads English language programs and literary activities.",
      year: "2026",
      sortOrder: 5,
    },
    {
      name: "Mr. Ananda Dharmasena",
      role: "Administrative Officer",
      email: "admin@aloysiuscollege.lk",
      bio: "Manages day-to-day administrative operations.",
      year: "2026",
      sortOrder: 6,
    },
    {
      name: "Dr. Amal Seneviratne",
      role: "Counselor",
      email: "counselor@aloysiuscollege.lk",
      bio: "Student counselor and career guidance advisor.",
      year: "2026",
      sortOrder: 7,
    },
    {
      name: "Rev. Fr. Joseph Perera",
      role: "Vice Principal",
      email: "viceprincipal@aloysiuscollege.lk",
      bio: "Supports the Principal in academic and disciplinary affairs.",
      year: "2025",
      sortOrder: 0,
    },
    {
      name: "Mr. Sunil Abeywardena",
      role: "Head of Sports",
      email: "sports@aloysiuscollege.lk",
      bio: "Coordinates all sports programs and inter-school tournaments.",
      year: "2025",
      sortOrder: 1,
    },
    {
      name: "Mrs. Priyanka Amarasinghe",
      role: "Head of Science",
      email: "science@aloysiuscollege.lk",
      bio: "Leads the Science department and oversees laboratory resources.",
      year: "2025",
      sortOrder: 2,
    },
    {
      name: "Mrs. Deepika Wijeratne",
      role: "Head of Arts",
      email: "arts@aloysiuscollege.lk",
      bio: "Directs cultural programs, drama, and music activities.",
      year: "2025",
      sortOrder: 3,
    },
  ];
  for (const member of staffMembers) {
    await db.insert(schema.staffMembers).values({
      id: faker.string.uuid(),
      name: member.name,
      role: member.role,
      email: member.email,
      photo: unsplash(pick(FACE_PHOTOS, member.sortOrder), 400, 400, "&crop=faces"),
      bio: member.bio,
      year: member.year,
      sortOrder: member.sortOrder,
      createdAt: now,
      updatedAt: now,
    });
  }
  console.log(`Seeded ${staffMembers.length} staff members`);

  // ── Club Members ──
  const clubMembersData: {
    id: string;
    activityId: string;
    userId: string;
    name: string;
    role: "admin" | "member";
    status: "pending" | "approved" | "rejected" | "revoked";
    createdAt: Date;
    updatedAt: Date;
  }[] = [];
  const clubMemberNames = [
    "Arjun Rathnayake",
    "Senuri Fonseka",
    "Kasun Bandara",
    "Ishara Wickramasinghe",
    "Adithya Karunaratne",
    "Navya Dissanayake",
    "Rohan Perera",
    "Vishwa Jayasinghe",
    "Myra de Zoysa",
    "Saduni Perera",
    "Prisha Gamage",
    "Anushka Gunawardena",
    "Ravindu Thennakoon",
    "Arnav Rodrigo",
    "Dhruv Silva",
  ];
  const activityIds = activitiesData.map((a) => a.id);
  for (let i = 0; i < clubMemberNames.length; i++) {
    const activityId = activityIds[i % activityIds.length]!;
    clubMembersData.push({
      id: faker.string.uuid(),
      activityId,
      userId: `user_club_${String(i).padStart(3, "0")}`,
      name: clubMemberNames[i]!,
      role: i % 5 === 0 ? "admin" : "member",
      status:
        i === 7 || i === 11 ? "pending" : i === 13 ? "rejected" : i === 14 ? "revoked" : "approved",
      createdAt: now,
      updatedAt: now,
    });
  }
  for (const member of clubMembersData) {
    await db.insert(schema.clubMembers).values(member);
  }
  console.log(`Seeded ${clubMembersData.length} club members`);

  // ── Club Albums ──
  const clubAlbumsData: {
    id: string;
    activityId: string;
    title: string;
    description: string;
    coverImage: string | null;
    status: "draft" | "published" | "archived";
    reviewStatus: "pending" | "approved" | "rejected";
    featuredOnHome: boolean;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
  }[] = [];
  const albumTitles = [
    "Robotics Workshop 2025",
    "Cricket Tournament Highlights",
    "Debate Finals",
    "Music Ensemble Performance",
    "Eco Warriors Tree Plantation",
  ];
  // Robotics/Cricket/Debate/Music/Eco Warriors, in the same order as albumTitles.
  const albumPhotoPools = [TECH_PHOTOS, SPORTS_PHOTOS, ARTS_PHOTOS, ARTS_PHOTOS, COMMUNITY_PHOTOS];
  for (let i = 0; i < albumTitles.length; i++) {
    const activityId = activityIds[i % activityIds.length]!;
    clubAlbumsData.push({
      id: faker.string.uuid(),
      activityId,
      title: albumTitles[i]!,
      description: `Photo album from ${albumTitles[i]!}.`,
      coverImage: unsplash(pick(albumPhotoPools[i]!, 1), 600, 600),
      status: i < 3 ? "published" : "draft",
      reviewStatus: i === 3 ? "pending" : i === 4 ? "rejected" : "approved",
      featuredOnHome: i === 0,
      userId: `user_club_${String(i).padStart(3, "0")}`,
      createdAt: now,
      updatedAt: now,
    });
  }
  for (const album of clubAlbumsData) {
    await db.insert(schema.clubAlbums).values(album);
  }
  console.log(`Seeded ${clubAlbumsData.length} club albums`);

  // ── Club Album Images ──
  let clubImageCount = 0;
  for (let a = 0; a < clubAlbumsData.length; a++) {
    const album = clubAlbumsData[a]!;
    const photoPool = albumPhotoPools[a % albumPhotoPools.length]!;
    const count = faker.number.int({ min: 3, max: 6 });
    for (let i = 0; i < count; i++) {
      await db.insert(schema.clubAlbumImages).values({
        id: faker.string.uuid(),
        albumId: album.id,
        url: unsplash(pick(photoPool, i), 1200, 800),
        caption: faker.helpers.arrayElement([
          "Group photo after the event",
          "Action shot during the activity",
          "Award ceremony moment",
          "Team celebration",
          "Behind the scenes",
        ]),
        sortOrder: i,
        createdAt: now,
      });
      clubImageCount++;
    }
  }
  console.log(`Seeded ${clubImageCount} club album images`);

  // ── Pending Review Content (club-submitted, awaiting site-admin review) ──
  const pendingNewsItems = [
    {
      title: "Robotics Club Wins Regional CodeX Challenge",
      content:
        "Submitted by the club for review: our robotics team placed first in the regional CodeX robotics challenge, competing against 12 schools. The team's autonomous line-following robot outperformed all other entries.\n\nThis submission is pending site admin approval before it appears on the public news feed.",
      excerpt: "Robotics Club submission awaiting review: first place at the regional CodeX challenge.",
      activityIndex: 0,
      coverImage: unsplash(pick(TECH_PHOTOS, 3), 800, 400),
    },
    {
      title: "Eco Warriors Launch Campus Composting Initiative",
      content:
        "Submitted by the club for review: the Eco Warriors Club has set up composting bins across the campus canteen and hostel areas, aiming to divert 60% of food waste from landfill within the first term.\n\nThis submission is pending site admin approval before it appears on the public news feed.",
      excerpt: "Eco Warriors submission awaiting review: new campus composting initiative.",
      activityIndex: 2,
      coverImage: unsplash(pick(COMMUNITY_PHOTOS, 2), 800, 400),
    },
  ];
  for (const item of pendingNewsItems) {
    const activity = activitiesData[item.activityIndex];
    await db.insert(schema.news).values({
      id: faker.string.uuid(),
      slug: toSlug(item.title),
      title: item.title,
      content: item.content,
      excerpt: item.excerpt,
      coverImage: item.coverImage,
      authorName: clubMembersData[item.activityIndex]?.name ?? "Club Member",
      authorType: "club",
      tags: ["club-submission"],
      status: "draft",
      publishedAt: null,
      createdAt: now,
      updatedAt: now,
      userId: clubMembersData[item.activityIndex]?.userId ?? userId,
      activityId: activity?.id ?? null,
      reviewStatus: "pending",
    });
  }
  const pendingEvent = {
    title: "Music Ensemble Winter Concert",
    content:
      "Submitted by the club for review: an evening of choral and instrumental performances by the Music Ensemble, featuring pieces from the winter repertoire.\n\nThis submission is pending site admin approval before it appears on the public events calendar.",
    excerpt: "Music Ensemble submission awaiting review: winter concert evening.",
    activityIndex: 1,
    coverImage: unsplash(pick(ARTS_PHOTOS, 5), 800, 400),
    bodyImage: unsplash(pick(ARTS_PHOTOS, 6), 800, 400),
  };
  {
    const activity = activitiesData[pendingEvent.activityIndex];
    const startDate = daysFromNow(faker.number.int({ min: 10, max: 40 }));
    const endDate = new Date(startDate.getTime() + 2 * 3600000);
    await db.insert(schema.events).values({
      id: faker.string.uuid(),
      slug: toSlug(pendingEvent.title),
      title: pendingEvent.title,
      content: pendingEvent.content,
      excerpt: pendingEvent.excerpt,
      coverImage: pendingEvent.coverImage,
      bodyImage: pendingEvent.bodyImage,
      purpose: "annual",
      organization: "Music Ensemble",
      organizerName: clubMembersData[pendingEvent.activityIndex]?.name ?? "Club Member",
      organizerType: "club",
      location: "School Auditorium",
      startDate,
      endDate,
      isRecurring: false,
      isAllDay: false,
      recurrenceRule: null,
      tags: ["club-submission", "music"],
      status: "draft",
      publishedAt: null,
      createdAt: now,
      updatedAt: now,
      userId: clubMembersData[pendingEvent.activityIndex]?.userId ?? userId,
      activityId: activity?.id ?? null,
      reviewStatus: "pending",
    });
  }
  console.log("Seeded 2 pending news + 1 pending event (club-submitted, awaiting review)");

  // ── Notifications ──
  const notificationsData = [
    {
      userId: "user_ob_000",
      type: "membership_approved" as const,
      title: "OB Membership Approved",
      body: "Your Old Boys' Association membership has been approved.",
      link: "/ob",
      read: false,
    },
    {
      userId: "user_ob_001",
      type: "membership_request" as const,
      title: "OB Membership Pending",
      body: "Your OB membership request is awaiting approval.",
      link: "/ob",
      read: false,
    },
    {
      userId: "user_ob_000",
      type: "content_approved" as const,
      title: "Event Published",
      body: "Your OB event 'Annual OB Reunion Dinner 2026' has been published.",
      link: "/ob",
      read: true,
    },
    {
      userId: "user_ob_000",
      type: "content_rejected" as const,
      title: "Event Rejected",
      body: "Your event submission did not meet the guidelines.",
      link: "/ob",
      read: true,
    },
  ];
  for (const n of notificationsData) {
    await db.insert(schema.notifications).values({
      id: faker.string.uuid(),
      userId: n.userId,
      type: n.type,
      title: n.title,
      body: n.body,
      link: n.link,
      read: n.read,
      createdAt: daysAgo(faker.number.int({ min: 0, max: 7 })),
    });
  }
  console.log(`Seeded ${notificationsData.length} notifications`);
  const obMembers = [
    {
      name: "Ranil Amarasekara",
      role: "President",
      email: "ranil@ob-alloysius.lk",
      bio: "Class of 1978. Attorney-at-law and former President of the OB Association. Leading fundraising initiatives for the college infrastructure.",
      year: "2026",
      sortOrder: 0,
      status: "approved" as const,
    },
    {
      name: "Mahinda Gooneratne",
      role: "Vice President",
      email: "mahinda@ob-alloysius.lk",
      bio: "Class of 1975. Retired senior government official. Active in mentoring current students and organizing career guidance programs.",
      year: "2026",
      sortOrder: 1,
      status: "approved" as const,
    },
    {
      name: "Chandrika Illangakoon",
      role: "Secretary",
      email: "chandrika@ob-alloysius.lk",
      bio: "Class of 1980. Former diplomat. Manages OB communications and coordinates alumni events.",
      year: "2026",
      sortOrder: 2,
      status: "approved" as const,
    },
    {
      name: "Dinesh Kariyawasam",
      role: "Treasurer",
      email: "dinesh@ob-alloysius.lk",
      bio: "Class of 1982. Chartered accountant. Oversees OB Association finances and donation management.",
      year: "2026",
      sortOrder: 3,
      status: "approved" as const,
    },
    {
      name: "Sajith Obeysekera",
      role: "Committee Member",
      email: "sajith@ob-alloysius.lk",
      bio: "Class of 1985. Entrepreneur and philanthropist. Sponsors annual sports awards and student scholarships.",
      year: "2026",
      sortOrder: 4,
      status: "approved" as const,
    },
    {
      name: "Ranil Mathew",
      role: "Committee Member",
      email: "ranil.m@ob-alloysius.lk",
      bio: "Class of 1990. Software engineer based in Melbourne. Coordinates overseas alumni chapter activities.",
      year: "2026",
      sortOrder: 5,
      status: "approved" as const,
    },
    {
      name: "Nimal Fernando",
      role: "Committee Member",
      email: "nimal@ob-alloysius.lk",
      bio: "Class of 1988. Senior architect. Leads campus beautification and infrastructure projects.",
      year: "2026",
      sortOrder: 6,
      status: "approved" as const,
    },
    {
      name: "Kamal Perera",
      role: "Immediate Past President",
      email: "kamal@ob-alloysius.lk",
      bio: "Class of 1976. Retired school principal. Served as OB President from 2018-2024. Now an advisory board member.",
      year: "2026",
      sortOrder: 7,
      status: "approved" as const,
    },
    {
      name: "Amal Suriyaarachchi",
      role: "Committee Member",
      email: "amal@ob-alloysius.lk",
      bio: "Class of 1992. Medical doctor. Coordinates health awareness programs and scholarship fund.",
      year: "2025",
      sortOrder: 0,
      status: "approved" as const,
    },
    {
      name: "Lasantha Jayasuriya",
      role: "President",
      email: "lasantha@ob-alloysius.lk",
      bio: "Class of 1972. Retired judge. Led the 2025 committee with focus on legal aid and mentorship.",
      year: "2025",
      sortOrder: 1,
      status: "approved" as const,
    },
    {
      name: "Priyantha Silva",
      role: "Secretary",
      email: "priyantha@ob-alloysius.lk",
      bio: "Class of 1981. Chartered accountant. Managed OB communications and record-keeping.",
      year: "2025",
      sortOrder: 2,
      status: "approved" as const,
    },
    {
      name: "New Member Request",
      role: "Committee Member",
      email: "newmember@ob-alloysius.lk",
      bio: "Pending approval for 2026 committee.",
      year: "2026",
      sortOrder: 8,
      status: "pending" as const,
    },
  ];
  for (let i = 0; i < obMembers.length; i++) {
    const member = obMembers[i]!;
    await db.insert(schema.obMembers).values({
      id: faker.string.uuid(),
      name: member.name,
      role: member.role,
      email: member.email,
      photo: unsplash(pick(FACE_PHOTOS, i), 400, 400, "&crop=faces"),
      bio: member.bio,
      year: member.year,
      sortOrder: member.sortOrder,
      status: member.status,
      userId: member.status === "approved" ? `user_ob_${String(i).padStart(3, "0")}` : null,
      createdAt: now,
      updatedAt: now,
    });
  }
  console.log(`Seeded ${obMembers.length} OB members`);

  // ── OB Events ──
  const obEvents = [
    {
      title: "Annual OB Reunion Dinner 2026",
      description:
        "Join fellow old boys for an evening of nostalgia, fellowship, and celebration. Dinner, live music, and awards ceremony.",
      coverImage: unsplash(pick(ARTS_PHOTOS, 2), 800, 400),
      location: "Galle Face Hotel, Colombo",
      eventDate: daysFromNow(30),
      endDate: daysFromNow(30),
      isAllDay: false,
    },
    {
      title: "Career Guidance Workshop for Current Students",
      description:
        "Old boys from various professions share their career journeys and provide guidance to students in grades 10-12. Sessions on medicine, engineering, law, IT, and business.",
      coverImage: unsplash(pick(ACADEMIC_PHOTOS, 6), 800, 400),
      location: "College Auditorium",
      eventDate: daysFromNow(14),
      endDate: daysFromNow(14),
      isAllDay: false,
    },
    {
      title: "Sports Day - Old Boys vs Current Students",
      description:
        "Annual friendly cricket and football matches between the old boys team and current students. Come cheer and enjoy the camaraderie.",
      coverImage: unsplash(pick(SPORTS_PHOTOS, 0), 800, 400),
      location: "College Sports Ground",
      eventDate: daysFromNow(45),
      endDate: daysFromNow(45),
      isAllDay: true,
    },
    {
      title: "Fundraising Gala for Library Renovation",
      description:
        "An evening gala to raise funds for the renovation of the college library. Silent auction, dinner, and entertainment.",
      coverImage: unsplash(pick(ARTS_PHOTOS, 3), 800, 400),
      location: "Mount Lavinia Hotel",
      eventDate: daysFromNow(60),
      endDate: daysFromNow(60),
      isAllDay: false,
    },
    {
      title: "Mentorship Program Kickoff",
      description:
        "Launch of the 2026 OB Mentorship Program pairing old boys with current students for academic and career guidance throughout the year.",
      coverImage: unsplash(pick(ACADEMIC_PHOTOS, 4), 800, 400),
      location: "College Conference Hall",
      eventDate: daysFromNow(7),
      endDate: daysFromNow(7),
      isAllDay: false,
    },
  ];
  const obEventsData: { id: string; title: string; status: string }[] = [];
  for (let i = 0; i < obEvents.length; i++) {
    const id = faker.string.uuid();
    const status = i < 3 ? "published" : "draft";
    await db.insert(schema.obEvents).values({
      id,
      slug: toSlug(obEvents[i]!.title),
      title: obEvents[i]!.title,
      description: obEvents[i]!.description,
      coverImage: obEvents[i]!.coverImage,
      location: obEvents[i]!.location,
      eventDate: obEvents[i]!.eventDate,
      endDate: obEvents[i]!.endDate,
      isAllDay: obEvents[i]!.isAllDay,
      status,
      publishedAt: i < 3 ? daysAgo(5) : null,
      userId: `user_ob_000`,
      createdAt: now,
      updatedAt: now,
    });
    obEventsData.push({ id, title: obEvents[i]!.title, status });
  }
  console.log(`Seeded ${obEvents.length} OB events (3 published, 2 draft pending approval)`);

  // ── OB Donations ──
  const obDonations = [
    {
      donorName: "Ranil Amarasekara",
      image: unsplash(pick(FACE_PHOTOS, 0), 200, 200, "&crop=faces"),
      donorEmail: "ranil@ob-alloysius.lk",
      amount: 500000,
      currency: "LKR",
      purpose: "Library Renovation Fund",
      message:
        "Happy to contribute to the library project. Education is the foundation of our college.",
      isAnonymous: false,
      status: "confirmed" as const,
      donatedAt: daysAgo(15),
    },
    {
      donorName: "Mahinda Gooneratne",
      image: unsplash(pick(FACE_PHOTOS, 1), 200, 200, "&crop=faces"),
      donorEmail: "mahinda@ob-alloysius.lk",
      amount: 250000,
      currency: "LKR",
      purpose: "Sports Equipment",
      message: "For the new cricket pavilion project.",
      isAnonymous: false,
      status: "confirmed" as const,
      donatedAt: daysAgo(10),
    },
    {
      donorName: "Anonymous",
      image: null as string | null,
      donorEmail: null,
      amount: 1000000,
      currency: "LKR",
      purpose: "Scholarship Fund",
      message: "In memory of my late father, an old boy of 1965.",
      isAnonymous: true,
      status: "confirmed" as const,
      donatedAt: daysAgo(20),
    },
    {
      donorName: "Nimal Fernando",
      image: unsplash(pick(FACE_PHOTOS, 2), 200, 200, "&crop=faces"),
      donorEmail: "nimal@ob-alloysius.lk",
      amount: 150000,
      currency: "LKR",
      purpose: "Campus Beautification",
      message: "For the new garden project near the main hall.",
      isAnonymous: false,
      status: "confirmed" as const,
      donatedAt: daysAgo(5),
    },
    {
      donorName: "Kamal Perera",
      image: null as string | null,
      donorEmail: "kamal@ob-alloysius.lk",
      amount: 300000,
      currency: "LKR",
      purpose: "Technology Upgrades",
      message: "For the new computer lab equipment.",
      isAnonymous: false,
      status: "confirmed" as const,
      donatedAt: daysAgo(8),
    },
    {
      donorName: "Sajith Obeysekera",
      image: null as string | null,
      donorEmail: "sajith@ob-alloysius.lk",
      amount: 200000,
      currency: "LKR",
      purpose: "Annual Sports Awards",
      message: "Sponsoring this year's sports day prizes.",
      isAnonymous: false,
      status: "pending" as const,
      donatedAt: daysAgo(2),
    },
    {
      donorName: "Ranil Mathew",
      image: null as string | null,
      donorEmail: "ranil.m@ob-alloysius.lk",
      amount: 100,
      currency: "USD",
      purpose: "Library Renovation Fund",
      message: "Contributing from the Melbourne chapter.",
      isAnonymous: false,
      status: "confirmed" as const,
      donatedAt: daysAgo(12),
    },
    {
      donorName: "Chandrika Illangakoon",
      image: null as string | null,
      donorEmail: "chandrika@ob-alloysius.lk",
      amount: 100000,
      currency: "LKR",
      purpose: "Student Welfare",
      message: "For the student lunch program.",
      isAnonymous: false,
      status: "pending" as const,
      donatedAt: daysAgo(1),
    },
  ];
  const obDonationsData: { id: string; donorName: string; purpose: string; status: string }[] = [];
  for (let i = 0; i < obDonations.length; i++) {
    const donation = obDonations[i]!;
    const id = faker.string.uuid();
    await db.insert(schema.obDonations).values({
      id,
      donorName: donation.donorName,
      donorEmail: donation.donorEmail,
      amount: donation.amount,
      currency: donation.currency,
      purpose: donation.purpose,
      message: donation.message,
      image: donation.image,
      isAnonymous: donation.isAnonymous,
      status: donation.status,
      donatedAt: donation.donatedAt,
      userId: `user_ob_${String(i).padStart(3, "0")}`,
      createdAt: now,
      updatedAt: now,
    });
    obDonationsData.push({ id, donorName: donation.donorName, purpose: donation.purpose, status: donation.status });
  }
  console.log(`Seeded ${obDonations.length} OB donations`);

  // ── OB News ──
  const obNewsItems = [
    {
      title: "OB Chapter Raises Record LKR 1.5M for Library Renovation",
      content:
        "The Old Boys' Association is proud to announce that this year's fundraising drive for the library renovation has crossed LKR 1.5 million, the highest total in the chapter's history.\n\nContributions came from alumni across four continents, with the Melbourne and Colombo chapters leading the way. Renovation work begins next month and is expected to be complete before the new academic year.",
      excerpt: "This year's library renovation drive crossed LKR 1.5 million, the highest total yet.",
      coverImage: unsplash(pick(ACADEMIC_PHOTOS, 7), 800, 400),
      status: "published" as const,
    },
    {
      title: "Class of 1995 Announces 30th Reunion Committee",
      content:
        "Old boys from the class of 1995 have formed an organizing committee for their 30th reunion, to be held alongside next year's Annual OB Reunion Dinner.\n\nMembers interested in joining the planning committee or contributing memorabilia for the reunion display should reach out via the OB office.",
      excerpt: "Class of 1995 forms an organizing committee ahead of their milestone reunion.",
      coverImage: unsplash(pick(ARTS_PHOTOS, 6), 800, 400),
      status: "published" as const,
    },
    {
      title: "OB Mentorship Program Pairs 40 Students with Alumni",
      content:
        "The 2026 OB Mentorship Program has matched 40 students in grades 10-12 with alumni mentors across medicine, engineering, law, IT, and business.\n\nMentors commit to monthly check-ins and at least one campus visit per term. Applications for next year's cohort open in January.",
      excerpt: "40 students matched with alumni mentors in this year's mentorship cohort.",
      coverImage: unsplash(pick(ACADEMIC_PHOTOS, 8), 800, 400),
      status: "published" as const,
    },
    {
      title: "Draft: Proposal for an OB Sports Complex",
      content:
        "A preliminary proposal is being drafted for a dedicated OB-funded sports complex adjacent to the college grounds, including an indoor cricket net and multipurpose court.\n\nThis article is still being drafted and is not yet ready for publication.",
      excerpt: "Early-stage proposal for a new OB-funded sports complex.",
      coverImage: unsplash(pick(SPORTS_PHOTOS, 3), 800, 400),
      status: "draft" as const,
    },
  ];
  for (const item of obNewsItems) {
    await db.insert(schema.obNews).values({
      id: faker.string.uuid(),
      slug: toSlug(item.title),
      title: item.title,
      content: item.content,
      excerpt: item.excerpt,
      coverImage: item.coverImage,
      status: item.status,
      publishedAt: item.status === "published" ? daysAgo(faker.number.int({ min: 2, max: 25 })) : null,
      userId: "user_ob_000",
      createdAt: now,
      updatedAt: now,
    });
  }
  console.log(`Seeded ${obNewsItems.length} OB news articles`);

  // ── OB Announcements ──
  const obAnnouncementItems = [
    {
      title: "Annual OB Reunion Dinner — RSVP Deadline Extended",
      content:
        "Due to popular demand, the RSVP deadline for the Annual OB Reunion Dinner has been extended by two weeks. Old boys who have not yet confirmed attendance should do so via the OB portal.\n\nSeating is limited and allocated on a first-confirmed basis.",
      excerpt: "RSVP deadline for the reunion dinner extended by two weeks.",
      coverImage: unsplash(pick(ARTS_PHOTOS, 7), 800, 400),
      audience: "alumni" as const,
      status: "published" as const,
    },
    {
      title: "Volunteers Needed for Career Guidance Workshop",
      content:
        "The OB Association is looking for alumni professionals willing to volunteer as speakers for the upcoming Career Guidance Workshop for current students in grades 10-12.\n\nSessions of 30-45 minutes are needed across medicine, engineering, law, IT, business, and the arts. Contact the OB office to sign up.",
      excerpt: "Alumni volunteers needed as speakers for the Career Guidance Workshop.",
      coverImage: unsplash(pick(ACADEMIC_PHOTOS, 9), 800, 400),
      audience: "alumni" as const,
      status: "published" as const,
    },
    {
      title: "Sports Day: Old Boys vs Current Students — Team Sign-Up Open",
      content:
        "Old boys interested in playing for the alumni team at this year's Sports Day cricket and football matches should register with the OB Sports Committee by the end of the month.\n\nBoth current students and staff are welcome to attend and cheer on the day.",
      excerpt: "Alumni team sign-ups open for the annual Old Boys vs Current Students Sports Day.",
      coverImage: unsplash(pick(SPORTS_PHOTOS, 4), 800, 400),
      audience: "all" as const,
      status: "published" as const,
    },
    {
      title: "Draft: OB Office Relocation Notice",
      content:
        "The OB Association office is being considered for relocation within the campus. This notice is still being drafted pending confirmation of the new location.",
      excerpt: "Draft notice regarding a possible OB office relocation.",
      coverImage: null,
      audience: "alumni" as const,
      status: "draft" as const,
    },
  ];
  for (const item of obAnnouncementItems) {
    await db.insert(schema.obAnnouncements).values({
      id: faker.string.uuid(),
      slug: toSlug(item.title),
      title: item.title,
      content: item.content,
      excerpt: item.excerpt,
      coverImage: item.coverImage,
      audience: item.audience,
      status: item.status,
      publishedAt: item.status === "published" ? daysAgo(faker.number.int({ min: 1, max: 15 })) : null,
      userId: "user_ob_000",
      createdAt: now,
      updatedAt: now,
    });
  }
  console.log(`Seeded ${obAnnouncementItems.length} OB announcements`);

  // ── OB Event Galleries ──
  const obEventGalleries = [
    {
      title: "Annual OB Reunion Dinner 2026 — Photo Highlights",
      description:
        "Snapshots from a memorable evening of fellowship, nostalgia, and celebration with fellow old boys.",
      obEventId: obEventsData[0]?.id ?? null,
      tags: ["ob", "reunion", "alumni"],
      coverImage: unsplash(pick(ARTS_PHOTOS, 4), 600, 600),
      photoPool: ARTS_PHOTOS,
      status: "published" as const,
      authorName: "Ranil Amarasekara",
    },
    {
      title: "Sports Day 2026 — Old Boys vs Current Students",
      description:
        "Action shots from the friendly cricket and football matches between the old boys team and current students.",
      obEventId: obEventsData[2]?.id ?? null,
      tags: ["ob", "sports", "cricket"],
      coverImage: unsplash(pick(SPORTS_PHOTOS, 2), 600, 600),
      photoPool: SPORTS_PHOTOS,
      status: "published" as const,
      authorName: "Mahinda Gooneratne",
    },
    {
      title: "Career Guidance Workshop — Photos",
      description:
        "Old boys sharing their career journeys with students in grades 10-12. Submitted for site admin review.",
      obEventId: obEventsData[1]?.id ?? null,
      tags: ["ob", "career", "mentorship"],
      coverImage: unsplash(pick(ACADEMIC_PHOTOS, 5), 600, 600),
      photoPool: ACADEMIC_PHOTOS,
      status: "draft" as const,
      authorName: "Ranil Amarasekara",
    },
  ];
  const obEventGalleryData: (typeof schema.gallery.$inferInsert & { photoPool: string[] })[] = [];
  for (const item of obEventGalleries) {
    const { photoPool, ...data } = {
      id: faker.string.uuid(),
      slug: toSlug(item.title),
      title: item.title,
      description: item.description,
      obEventId: item.obEventId,
      coverImage: item.coverImage,
      photoPool: item.photoPool,
      authorName: item.authorName,
      authorType: "org" as const,
      tags: item.tags,
      status: item.status,
      publishedAt: item.status === "published" ? daysAgo(3) : null,
      createdAt: now,
      updatedAt: now,
      userId: "user_ob_000",
    };
    obEventGalleryData.push({ ...data, photoPool });
    await db.insert(schema.gallery).values(data);
  }
  console.log(`Seeded ${obEventGalleryData.length} OB event galleries`);

  let obEventGalleryImageCount = 0;
  for (const g of obEventGalleryData) {
    const count = faker.number.int({ min: 3, max: 5 });
    for (let i = 0; i < count; i++) {
      await db.insert(schema.galleryImages).values({
        id: faker.string.uuid(),
        galleryId: g.id!,
        url: unsplash(pick(g.photoPool, i + 10), 1200, 800),
        caption: faker.helpers.arrayElement([
          "Old boys reconnecting",
          "Toast to the college",
          "Group photo of the batch",
          "Presentation of mementos",
          "Candid moment during the evening",
        ]),
        sortOrder: i,
        createdAt: now,
      });
      obEventGalleryImageCount++;
    }
  }
  console.log(`Seeded ${obEventGalleryImageCount} OB event gallery images`);

  // ── OB Donation Galleries ──
  const obDonationGalleries = [
    {
      title: "Library Renovation — Before & After",
      description: "Photos documenting the library renovation made possible by generous OB donations.",
      obDonationId: obDonationsData[0]?.id ?? null,
      tags: ["ob", "donation", "library"],
      coverImage: unsplash(pick(ACADEMIC_PHOTOS, 3), 600, 600),
      photoPool: ACADEMIC_PHOTOS,
      status: "published" as const,
      authorName: "Ranil Amarasekara",
    },
    {
      title: "New Computer Lab Equipment",
      description:
        "The new computer lab funded by OB technology-upgrade donations. Awaiting site admin release.",
      obDonationId: obDonationsData[4]?.id ?? null,
      tags: ["ob", "donation", "technology"],
      coverImage: unsplash(pick(TECH_PHOTOS, 2), 600, 600),
      photoPool: TECH_PHOTOS,
      status: "draft" as const,
      authorName: "Kamal Perera",
    },
  ];
  const obDonationGalleryData: (typeof schema.gallery.$inferInsert & { photoPool: string[] })[] = [];
  for (const item of obDonationGalleries) {
    const { photoPool, ...data } = {
      id: faker.string.uuid(),
      slug: toSlug(item.title),
      title: item.title,
      description: item.description,
      obDonationId: item.obDonationId,
      coverImage: item.coverImage,
      photoPool: item.photoPool,
      authorName: item.authorName,
      authorType: "org" as const,
      tags: item.tags,
      status: item.status,
      publishedAt: item.status === "published" ? daysAgo(2) : null,
      createdAt: now,
      updatedAt: now,
      userId: "user_ob_000",
    };
    obDonationGalleryData.push({ ...data, photoPool });
    await db.insert(schema.gallery).values(data);
  }
  console.log(`Seeded ${obDonationGalleryData.length} OB donation galleries`);

  let obDonationGalleryImageCount = 0;
  for (const g of obDonationGalleryData) {
    const count = faker.number.int({ min: 3, max: 5 });
    for (let i = 0; i < count; i++) {
      await db.insert(schema.galleryImages).values({
        id: faker.string.uuid(),
        galleryId: g.id!,
        url: unsplash(pick(g.photoPool, i + 20), 1200, 800),
        caption: faker.helpers.arrayElement([
          "Before the renovation",
          "New equipment installed",
          "Students using the upgraded facility",
          "Donor plaque unveiling",
          "Handover ceremony",
        ]),
        sortOrder: i,
        createdAt: now,
      });
      obDonationGalleryImageCount++;
    }
  }
  console.log(`Seeded ${obDonationGalleryImageCount} OB donation gallery images`);

  console.log("Database seeded successfully!");
}
