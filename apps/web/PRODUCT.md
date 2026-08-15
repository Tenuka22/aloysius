# Product: St. Aloysius' College Website

## Overview

A modern website for St. Aloysius' College, Galle - a prestigious school founded in 1862. The site serves students, parents, faculty, alumni, and the broader community.

## Core Purpose

- Showcase the college's heritage, achievements, and current activities
- Provide information about academic programs, events, and news
- Display student works and achievements
- Enable admin content management

## Design Direction

- **Aesthetic:** Brutalist corners (sharp, angular edges with minimal/no border-radius)
- **Colors:** Dark green (#013405 / #062B0A) primary, gold (#FFB203 / #FFD45A) secondary, cream (#FFF8E7) backgrounds
- **Typography:** Playfair Display Variable (serif) for headings, Manrope Variable for body text
- **Style:** Institutional, traditional, yet modern - reflecting 160+ years of heritage

## Key Sections

1. Hero with "Where Excellence Is Made" tagline
2. Stats section (Heritage, Alumni, Programs, Achievements)
3. Student Works showcase (horizontal scroll)
4. Achievements (featured card + grid)
5. Gallery (masonry layout)
6. Events & Announcements (dark green background)

## Technical Stack

- Monorepo with Vite Plus
- TanStack Router/Start for frontend
- Drizzle ORM + Cloudflare D1 for database
- Clerk for authentication
- GSAP for animations
