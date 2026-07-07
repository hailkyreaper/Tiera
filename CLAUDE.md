# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

This repository is currently empty of code — it contains only this `CLAUDE.md`. There is no `package.json`, no scaffolding, and no build/lint/test tooling yet. When scaffolding the project, use the tech stack below and follow the design/engineering rules exactly; do not introduce a different stack or deviate from the stated conventions.

## Vision

Tiera helps people discover entertainment they'll actually enjoy through taste-based recommendations.

## Tech stack

- Next.js 15
- TypeScript
- Tailwind
- shadcn/ui
- Supabase (PostgreSQL, Row Level Security)
- Vercel (deployment)

## Design rules

- Mobile-first
- Dark mode is primary; light mode is also supported
- Rounded corners at 20px
- Purple accent color: `#6D5DF6`
- Large cover art
- Premium feel
- Reference the approved Tiera mockups (light and dark mode) for UI decisions

## Navigation structure

Top-level sections: Explore, Lists, Search, Compare, Profile.

## Engineering rules

- Server Components by default; Client Components only when interactivity requires it
- Favor reusable, composable components over duplication
- Keep components under ~200 lines where practical
- Strong TypeScript — avoid `any`, prefer explicit types
- Row Level Security must be enabled on Supabase tables
- Never hardcode secrets

## MVP feature scope

- Authentication
- Goodreads import
- Custom tier lists
- Explore feed
- Compare users
- Recommendations

## Design References

Reference images live in `/design/`. Before building or restyling any screen, look at 
its matching reference image below and match layout, spacing, and styling as closely 
as possible — not just the general rules above.

- `/design/Explorepage.png` — Explore feed (list cards, tabs, tier previews)
- `/design/search.png` — Search page (books/people tabs, recent/popular searches)
- `/design/createlist.png` — Create/edit tier list screen (tiers, unranked books, 
  visibility toggle)
- `/design/profile.png` — Own profile page (stats, top favorites, bio)
- `/design/otheruser.png` — Another user's public profile view (e.g. Follow button 
  instead of Edit Profile)
- `/design/compare.png` — Compare page (match %, Summary/Favorites/Disagreements)
- `/design/rec.png` — Recommendations screen
- `/design/tasteinsights.png` — Taste Insights tab (genre match breakdown)
- `/design/main.png` — Landing/logged-out screen (Get Started/Log In)

When building a feature, always check the matching image above first. If a screen 
doesn't have an exact match, use the closest reference plus the general Design rules 
above.

## Current sprint

Sprint 5 (active): Taste match % algorithm, Compare page (Summary/Favorites/Disagreements), Recommendations.

Do not implement features from future sprints until explicitly instructed.

## Roadmap

### Sprint 1 — Foundation ✅ COMPLETE
Authentication, Database, Deployment

### Sprint 2 — Core Data Model & Tier Lists ✅ COMPLETE
- Book data model + external book API integration
- Create/edit tier list (S/A/B/C/D/F, drag-and-drop)
- Save and view own lists

### Sprint 3 — Explore & Discovery ✅ COMPLETE
- Explore feed (For You/Following/Recent)
- Public list viewing, likes/comments
- Basic search (books + people)

### Sprint 4 — Profile & Taste Insights ✅ COMPLETE
- Profile page with stats
- Top Favorites
- Taste Insights by genre

### Sprint 5 — Compare & Matching (CURRENT)
- Taste match % algorithm
- Compare page (Summary/Favorites/Disagreements)
- Recommendations
- "Taste Roast" comparison blurb (seen in tasteinsights.png) — a two-user
  comparison bit ("You and X agree on 94% of books..."), depends on the
  match % algorithm above

### Sprint 6 — Social Layer
- Follow system
- Comments
- "People you might vibe with"

### Sprint 7 — Import & Search Polish
- Goodreads CSV import
- Search filters/history

### Sprint 8 — Mobile Packaging & Polish
- PWA setup
- Capacitor app wrap (optional)
- Responsive polish

### Sprint 9 — Launch Prep
- Performance, error/empty states
- Final QA

## Sprint Rule
Only work on the sprint marked CURRENT. Do not start future sprints unless explicitly told to. After finishing a sprint, mark it ✅ COMPLETE and wait for the next sprint to be marked CURRENT before proceeding.

## To Do

- No place to view books when added to library except for going into lists and scrolling down to library.