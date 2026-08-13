import { drizzle } from "drizzle-orm/d1";
import { faker } from "@faker-js/faker";
import * as schema from "./schema";
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

const imageUrls = [
  "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&h=400&fit=crop",
  "https://images.unsplash.com/photo-1562774053-701939374585?w=800&h=400&fit=crop",
  "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&h=400&fit=crop",
  "https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=800&h=400&fit=crop",
  "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=800&h=400&fit=crop",
  "https://images.unsplash.com/photo-1523050854058-8df90110c8f1?w=800&h=400&fit=crop",
  "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&h=400&fit=crop",
  "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=400&fit=crop",
];

const coverImages = [
  "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1551033406-611cf9a28f67?w=600&h=600&fit=crop",
];

const galleryPhotoUrls = [
  "https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=1200&h=800&fit=crop",
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=800&fit=crop",
  "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=1200&h=800&fit=crop",
  "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1200&h=800&fit=crop",
  "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=1200&h=800&fit=crop",
  "https://images.unsplash.com/photo-1491011302612-0984b3eeb098?w=1200&h=800&fit=crop",
  "https://images.unsplash.com/photo-1560523159-6b688e9b1ead?w=1200&h=800&fit=crop",
  "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=1200&h=800&fit=crop",
  "https://images.unsplash.com/photo-1577896851231-70ef18881754?w=1200&h=800&fit=crop",
  "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1200&h=800&fit=crop",
];

export async function seed() {
  const db = drizzle(env.DB, { schema });

  console.log("Seeding database...");

  // Clear existing data (order matters for foreign keys)
  await db.delete(schema.galleryImages);
  await db.delete(schema.gallery);
  await db.delete(schema.eventRecords);
  await db.delete(schema.bigMatches);
  await db.delete(schema.studentWorks);
  await db.delete(schema.achievements);
  await db.delete(schema.events);
  await db.delete(schema.news);
  await db.delete(schema.announcements);
  await db.delete(schema.activities);
  await db.delete(schema.files);
  await db.delete(schema.stats);
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
  const settings = [
    { key: "school_name", value: "St. Xavier's High School" },
    { key: "school_motto", value: "Knowledge, Virtue, Service" },
    { key: "contact_email", value: "info@stxaviers.edu" },
    { key: "contact_phone", value: "+91 98765 43210" },
    { key: "address", value: "14 MG Road, Bangalore, Karnataka 560001" },
    {
      key: "about",
      value:
        "Founded in 1979, St. Xavier's High School has been a beacon of academic excellence and holistic development. Our campus spans 12 acres with state-of-the-art facilities for academics, sports, and the arts.",
    },
  ];
  for (const s of settings) {
    await db.insert(schema.siteSettings).values({ key: s.key, value: s.value, updatedAt: now });
  }
  console.log(`Seeded ${settings.length} site settings`);

  // ── Files (placeholder upload records) ──
  const filesData = coverImages.map((_url, i) => ({
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
        "Over 800 visitors attended this year's Annual Science Exhibition, showcasing 64 projects from students across all grades. The event was inaugurated by Dr. Meena Krishnamurthy, a former alumnus and leading researcher at ISRO.\n\nProjects ranged from AI-powered crop monitoring systems to sustainable water purification prototypes. The judging panel included industry professionals from Bosch and Wipro, who praised the innovation and practical application of student projects.\n\nBest Project Award went to 11th-graders Aarav Mehta and Diya Sharma for their low-cost air quality monitoring device, which has already been adopted by the local municipal council for pilot testing.",
      excerpt:
        "Over 800 visitors attended this year's Annual Science Exhibition, showcasing 64 innovative student projects.",
      authorName: "Mr. Rajesh Menon",
      authorType: "faculty",
      tags: ["science", "exhibition", "innovation"],
    },
    {
      title: "Inter-School Cricket Team Reaches State Finals",
      content:
        "Our cricket team, led by captain Rohan Patel, has qualified for the state-level inter-school cricket tournament after a dominant performance in the regional qualifiers.\n\nThe team won 6 out of 7 matches, with standout performances from fast bowler Arjun Nair (14 wickets) and opening batsman Vivaan Joshi (342 runs). The finals will be held in Mysore from March 15-20.\n\nCoach Mr. Sanjay Mishra credited the team's disciplined training schedule and strong teamwork for their success.",
      excerpt:
        "Our cricket team qualifies for state finals after winning 6 out of 7 regional matches.",
      authorName: "Mr. Sanjay Mishra",
      authorType: "faculty",
      tags: ["sports", "cricket", "achievement"],
    },
    {
      title: "Students Win National Coding Competition",
      content:
        "A team of four students from the Coding Club won first place at CodeX national finals held in Mumbai, competing against 200 teams from across India.\n\nTeam members Kabir Singh, Ishita Verma, Aditya Kumar, and Navya Pillai built an AI-powered waste sorting system that uses computer vision to identify and categorize recyclable materials.\n\nThe team received a cash prize of ₹2,00,000 and has been invited to present their solution at the International Science Fair in Singapore.",
      excerpt:
        "Coding Club team wins first place at CodeX nationals with their AI-powered waste sorting system.",
      authorName: "Mrs. Priya Kapoor",
      authorType: "faculty",
      tags: ["coding", "competition", "national"],
    },
    {
      title: "Cultural Fest 'Xaviera 2026' Announces Lineup",
      content:
        "Xaviera 2026, our annual cultural festival, will be held from February 20-22. This year's theme is 'Unity in Diversity' and will feature performances by students, guest artists, and alumni.\n\nHighlights include a classical dance performance by alumni group Nritya, a rock concert by student band The Frequencies, and a play directed by drama teacher Mrs. Deepa Nair.\n\nRegistrations for individual and group events are now open through the school app.",
      excerpt:
        "Xaviera 2026 cultural festival scheduled for February 20-22 with the theme 'Unity in Diversity'.",
      authorName: "Ananya Gupta",
      authorType: "student",
      tags: ["cultural", "festival", "arts"],
    },
    {
      title: "New Computer Lab Inaugurated with 50 Workstations",
      content:
        "The school inaugurated a new state-of-the-art computer lab equipped with 50 high-performance workstations, each loaded with development tools for AI, data science, and web development.\n\nThe lab was inaugurated by Mr. Vikram Sharma, CTO of TechVista Solutions and a proud parent. The facility includes a dedicated server room, high-speed internet, and 3D printers for the robotics team.\n\nAll students will have scheduled lab sessions, and the lab will be open for self-study during lunch breaks and after school hours.",
      excerpt:
        "New computer lab with 50 high-performance workstations inaugurated for coding and AI development.",
      authorName: "Dr. Sunita Iyer",
      authorType: "faculty",
      tags: ["infrastructure", "technology", "computers"],
    },
    {
      title: "Art Students Exhibit at City Gallery",
      content:
        "Twenty-three students from the Art & Design Club had their work displayed at the Karnataka Chitrakala Parishath as part of a youth art showcase.\n\nThe exhibition, titled 'Perspectives', featured paintings, charcoal drawings, digital art, and mixed-media installations. Themes ranged from environmental conservation to mental health awareness.\n\nMyra Joshi's digital series 'Urban Solitude' received special recognition from the gallery curator, who called it 'remarkably mature for a student artist'.",
      excerpt:
        "23 students from Art & Design Club exhibit their work at Karnataka Chitrakala Parishath.",
      authorName: "Mrs. Deepa Nair",
      authorType: "faculty",
      tags: ["art", "exhibition", "students"],
    },
    {
      title: "Parent-Teacher Meeting Scheduled for January 25",
      content:
        "The quarterly Parent-Teacher Meeting for all grades will be held on Saturday, January 25, from 9:00 AM to 2:00 PM.\n\nParents are requested to collect their child's progress report from the respective class teachers. Career counseling booths will be available for students in grades 10 and 12.\n\nAppointments can be booked through the school portal or by contacting the front office.",
      excerpt:
        "PTM on January 25 from 9 AM to 2 PM. Progress reports and career counseling available.",
      authorName: "Mrs. Kavitha Rao",
      authorType: "faculty",
      tags: ["announcement", "parents", "academic"],
    },
    {
      title: "Eco Warriors Club Plants 500 Trees on Campus",
      content:
        "The Eco Warriors Club, in partnership with the local forestry department, organized a massive tree plantation drive on campus, planting over 500 saplings of native species.\n\nStudents from grades 6-12 participated in the drive, which is part of the school's initiative to achieve carbon neutrality by 2030. The saplings include neem, peepal, and banyan trees, chosen for their environmental benefits.\n\nThe club plans to adopt a monitoring system where each class will be responsible for the care of their planted saplings.",
      excerpt:
        "Eco Warriors plants 500 native species saplings as part of the school's carbon neutrality initiative.",
      authorName: "Reyansh Bhat",
      authorType: "student",
      tags: ["eco", "environment", "community"],
    },
  ];
  for (const item of newsItems) {
    await db.insert(schema.news).values({
      id: faker.string.uuid(),
      slug: toSlug(item.title),
      title: item.title,
      content: item.content,
      excerpt: item.excerpt,
      coverImage: faker.helpers.arrayElement(coverImages),
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
      authorName: "Dr. Sunita Iyer",
      authorType: "faculty",
      tags: ["important", "exams", "academic"],
      audience: "students" as const,
    },
    {
      title: "Sports Day Registrations Closing Soon",
      content:
        "Registrations for the annual Sports Day close on January 28. Events include track and field, relay races, tug-of-war, and house-level competitions.\n\nStudents must register through their house captains. Participation certificates will be given to all participants, and winners will receive medals at the closing ceremony.",
      excerpt: "Sports Day registration closes Jan 28. Register through house captains.",
      authorName: "Mr. Sanjay Mishra",
      authorType: "faculty",
      tags: ["sports", "deadline"],
      audience: "students" as const,
    },
    {
      title: "Bus Route Changes Effective February 1",
      content:
        "Please note that three bus routes will be modified starting February 1 due to road construction on Residency Road.\n\n- Route 7 (Jayanagar) will now go via 9th Main\n- Route 12 (Whitefield) will have two additional stops\n- Route 15 (Koramangala) timing shifted 10 minutes earlier\n\nUpdated route maps are available at the transport office.",
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
      authorName: "Mrs. Kavitha Rao",
      authorType: "faculty",
      tags: ["library", "academic"],
      audience: "students" as const,
    },
    {
      title: "Annual Day Rehearsals Begin Next Week",
      content:
        "All students participating in the Annual Day program must attend rehearsals starting January 27. Rehearsals will be held in the school auditorium from 3:30 PM to 5:30 PM.\n\nA attendance is mandatory for performers. Parents of participating students will receive a separate communication regarding the event schedule.",
      excerpt: "Annual Day rehearsals from Jan 27, 3:30-5:30 PM. Mandatory for performers.",
      authorName: "Mrs. Deepa Nair",
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
      organizerName: "Dr. Sunita Iyer",
      organizerType: "faculty",
      location: "Main Ground",
      tags: ["science", "exhibition", "annual"],
    },
    {
      title: "Inter-School Football Tournament",
      content:
        "St. Xavier's hosts the 12th Inter-School Football Tournament with 16 teams competing over two days. Cheer for our team as they defend their title.",
      excerpt: "12th Inter-School Football Tournament hosted at our campus.",
      purpose: "Promote sportsmanship and inter-school competition",
      organization: "Sports Department",
      organizerName: "Mr. Sanjay Mishra",
      organizerType: "faculty",
      location: "Football Ground",
      tags: ["sports", "football", "tournament"],
    },
    {
      title: "Workshop on AI and Machine Learning",
      content:
        "A hands-on workshop conducted by industry experts from TechVista Solutions on introduction to AI, machine learning basics, and building your first neural network. Open to grades 9-12.",
      excerpt: "Hands-on AI and ML workshop for grades 9-12 by TechVista Solutions.",
      purpose: "Introduce students to emerging technologies",
      organization: "Coding Club",
      organizerName: "Kabir Singh",
      organizerType: "club",
      location: "Computer Lab 2",
      tags: ["technology", "workshop", "ai"],
    },
    {
      title: "Xaviera 2026 - Annual Cultural Festival",
      content:
        "Three days of music, dance, drama, and art celebrating 'Unity in Diversity'. Features student performances, guest artists, alumni reunion, and food stalls.",
      excerpt: "Three-day cultural festival with the theme 'Unity in Diversity'.",
      purpose: "Celebrate cultural diversity and student talent",
      organization: "Cultural Committee",
      organizerName: "Ananya Gupta",
      organizerType: "student",
      location: "School Auditorium",
      tags: ["cultural", "festival", "arts"],
    },
    {
      title: "Career Counseling Session for Grade 12",
      content:
        "Expert career counselors from CareerGuidance India will conduct individual and group sessions for grade 12 students. Topics include engineering, medicine, liberal arts, and overseas education options.",
      excerpt: "Career counseling for grade 12 students covering all major streams.",
      purpose: "Guide students in career planning after school",
      organization: "Academic Council",
      organizerName: "Mrs. Priya Kapoor",
      organizerType: "faculty",
      location: "Conference Room A",
      tags: ["career", "counseling", "seniors"],
    },
    {
      title: "Green Campus Drive - Waste Segregation Drive",
      content:
        "The Eco Warriors Club organizes a campus-wide waste segregation awareness drive. Students will set up educational booths and conduct interactive sessions on recycling and composting.",
      excerpt: "Eco Warriors waste segregation drive with educational booths.",
      purpose: "Promote environmental awareness and responsible waste management",
      organization: "Eco Warriors Club",
      organizerName: "Reyansh Bhat",
      organizerType: "club" as const,
      location: "Outdoor Amphitheater",
      tags: ["eco", "environment", "community"],
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
      coverImage: faker.helpers.arrayElement(imageUrls),
      bodyImage: faker.helpers.arrayElement(imageUrls),
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
        "Arjun Nair and Ishita Verma won gold medals in the National Science Olympiad held in Delhi, competing against 2,000 participants from 300 schools.",
      category: "academic" as const,
      recipientNames: ["Arjun Nair", "Ishita Verma"],
      year: 2025,
    },
    {
      title: "State Basketball Championship - Winners",
      description:
        "The school basketball team won the Karnataka State Inter-School Championship for the third consecutive year, defeating Bishop Cotton School in the finals 68-52.",
      category: "sports" as const,
      recipientNames: ["Basketball Team"],
      year: 2025,
    },
    {
      title: "Best School Art Program Award",
      description:
        "St. Xavier's received the Karnataka State Education Award for Best School Art Program, recognizing our commitment to arts education and student exhibitions.",
      category: "arts" as const,
      recipientNames: ["Art & Design Club"],
      year: 2025,
    },
    {
      title: "National Coding Champions - CodeX 2025",
      description:
        "Team 'ByteForce' won the CodeX National Coding Championship, building an AI-powered waste sorting system that impressed judges from Google and Microsoft.",
      category: "academic" as const,
      recipientNames: ["Kabir Singh", "Ishita Verma", "Aditya Kumar", "Navya Pillai"],
      year: 2025,
    },
    {
      title: "Eco School Green Flag Certification",
      description:
        "The school received the prestigious Green Flag Certification from the Foundation for Environmental Education for our sustainability initiatives including solar panels and rainwater harvesting.",
      category: "community" as const,
      recipientNames: ["Eco Warriors Club"],
      year: 2024,
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
      coverImage: faker.helpers.arrayElement(coverImages),
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
      studentNames: ["Myra Joshi"],
      studentGrade: "12th",
      tags: ["digital art", "illustration", "urban life"],
    },
    {
      title: "EcoSort - AI Waste Classifier",
      description:
        "A machine learning model trained on 10,000+ images to classify waste into recyclable, compostable, and landfill categories. Built with TensorFlow and deployed as a mobile app.",
      category: "code" as const,
      studentNames: ["Kabir Singh", "Aditya Kumar"],
      studentGrade: "11th",
      tags: ["ai", "sustainability", "machine learning"],
    },
    {
      title: "Monsoon - Short Film",
      description:
        "A 12-minute short film about a friendship that forms between two students from different backgrounds during a monsoon season. Shot on campus and in the streets of Bangalore.",
      category: "film" as const,
      studentNames: ["Vivaan Joshi", "Saanvi Das"],
      studentGrade: "12th",
      tags: ["film", "storytelling", "campus life"],
    },
    {
      title: "Echoes of the Past - Historical Research Paper",
      description:
        "A research paper examining the architectural heritage of colonial-era buildings in Bangalore and their preservation challenges. Includes original photography and interviews with conservation experts.",
      category: "writing" as const,
      studentNames: ["Prisha Iyer", "Diya Sharma"],
      studentGrade: "11th",
      tags: ["research", "history", "architecture"],
    },
    {
      title: "Rhythm of Rain - Original Music Composition",
      description:
        "An original composition for piano and flute inspired by the monsoon season. Performed at Xaviera 2025 and recorded in the school music room.",
      category: "music" as const,
      studentNames: ["Ananya Gupta"],
      studentGrade: "10th",
      tags: ["music", "composition", "classical"],
    },
    {
      title: "Smart Campus Dashboard",
      description:
        "A full-stack web application that displays real-time data on school bus locations, cafeteria menu, library availability, and event schedules. Built with React and Node.js.",
      category: "code" as const,
      studentNames: ["Arnav Tiwari", "Dhruv Malhotro"],
      studentGrade: "12th",
      tags: ["web development", "react", "full stack"],
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
      coverImage: faker.helpers.arrayElement(coverImages),
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
    },
    {
      title: "Sports Day 2025",
      description:
        "Action shots from the annual Sports Day featuring track events, relay races, and house competitions.",
      eventId: eventsData[1]?.id ?? null,
      tags: ["sports", "athletics"],
    },
    {
      title: "Art Exhibition - Perspectives",
      description:
        "Photos from the student art exhibition at Karnataka Chitrakala Parishath showcasing paintings, digital art, and installations.",
      achievementId: null,
      tags: ["art", "exhibition"],
    },
    {
      title: "Campus Life 2025-26",
      description:
        "A collection of candid moments from everyday life at St. Xavier's - classrooms, corridors, lunch breaks, and celebrations.",
      tags: ["campus", "life", "students"],
    },
  ];
  const galleryData: (typeof schema.gallery.$inferInsert)[] = [];
  for (const item of galleries) {
    const data = {
      id: faker.string.uuid(),
      slug: toSlug(item.title),
      title: item.title,
      description: item.description,
      eventId: item.eventId ?? null,
      studentWorkId: null,
      achievementId: item.achievementId ?? null,
      coverImage: faker.helpers.arrayElement(coverImages),
      authorName: faker.helpers.arrayElement([
        "Mr. Rajesh Menon",
        "Mrs. Priya Kapoor",
        "Dr. Sunita Iyer",
        "Mr. Anil Deshmukh",
        "Mrs. Kavitha Rao",
        "Mr. Sanjay Mishra",
        "Mrs. Deepa Nair",
        "Dr. Amit Saxena",
      ]),
      authorType: "faculty" as const,
      tags: item.tags,
      status: "published" as const,
      publishedAt: daysAgo(faker.number.int({ min: 3, max: 20 })),
      createdAt: now,
      updatedAt: now,
      userId,
    };
    galleryData.push(data);
    await db.insert(schema.gallery).values(data);
  }
  console.log(`Seeded ${galleryData.length} gallery entries`);

  // ── Gallery Images ──
  let totalImages = 0;
  for (const g of galleryData) {
    const count = faker.number.int({ min: 3, max: 6 });
    for (let i = 0; i < count; i++) {
      await db.insert(schema.galleryImages).values({
        id: faker.string.uuid(),
        galleryId: g.id!,
        url: faker.helpers.arrayElement(galleryPhotoUrls),
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
      coverImage: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&h=500&fit=crop",
    },
    {
      name: "Battle of the Glory of Galle",
      opponent: "Vidyaloka College, Galle",
      type: "Cricket",
      year: 2025,
      coverImage: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&h=500&fit=crop",
    },
    {
      name: "The Battle of Dreams",
      opponent: "Holy Cross College, Kalutara",
      type: "Cricket",
      year: 2026,
      coverImage: "https://images.unsplash.com/photo-1589801258579-18e091f4ca24?w=800&h=500&fit=crop",
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

  // ── Activities ──
  const activities = [
    {
      name: "Robotics Club",
      description:
        "Design, build, and program robots for competitions and demonstrations. Members learn mechanical engineering, electronics, and programming through hands-on projects.",
      type: "club" as const,
      images: ["https://images.unsplash.com/photo-1535378917042-10a22c95931a?w=800&h=400&fit=crop"],
    },
    {
      name: "Cricket Team",
      description:
        "Competitive cricket program with coaching from former state-level players. Teams compete in inter-school tournaments throughout the year.",
      type: "sport" as const,
      images: ["https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&h=400&fit=crop"],
    },
    {
      name: "Debate Society",
      description:
        "Weekly debate sessions, public speaking workshops, and participation in Model United Nations. Open to all grades with beginner and advanced tracks.",
      type: "club" as const,
      images: ["https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&h=400&fit=crop"],
    },
    {
      name: "Music Ensemble",
      description:
        "Students learn and perform vocal and instrumental music. The ensemble includes a choir, rock band, and classical group. Performances at all school events.",
      type: "club" as const,
      images: ["https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800&h=400&fit=crop"],
    },
    {
      name: "Eco Warriors Club",
      description:
        "Environmental awareness and action club. Activities include tree plantation drives, waste management campaigns, and sustainability projects across campus.",
      type: "club" as const,
      images: ["https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&h=400&fit=crop"],
    },
  ];
  for (let i = 0; i < activities.length; i++) {
    await db.insert(schema.activities).values({
      id: faker.string.uuid(),
      slug: toSlug(activities[i]!.name),
      ...activities[i]!,
      coverImage: activities[i]!.images[0],
      sortOrder: i,
      status: "published",
      createdAt: now,
      updatedAt: now,
    });
  }
  console.log(`Seeded ${activities.length} activities`);

  console.log("Database seeded successfully!");
}
