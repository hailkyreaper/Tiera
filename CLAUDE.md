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
   See /design/explore-wireframe.png for the Explore screen layout.

## Current sprint

Sprint 3 (active): Explore feed, public list viewing, likes/comments, basic search.

Do not implement features from future sprints until explicitly instructed.

## Roadmap

### Sprint 1 — Foundation ✅ COMPLETE
Authentication, Database, Deployment

### Sprint 2 — Core Data Model & Tier Lists ✅ COMPLETE
- Book data model + external book API integration
- Create/edit tier list (S/A/B/C/D/F, drag-and-drop)
- Save and view own lists

### Sprint 3 — Explore & Discovery (CURRENT)
- Explore feed (Trending/Recent/Most Matches)
- Public list viewing, likes/comments
- Basic search

### Sprint 4 — Profile & Taste Insights
- Profile page with stats
- Top Favorites
- Taste Insights by genre

### Sprint 5 — Compare & Matching
- Taste match % algorithm
- Compare page (Summary/Favorites/Disagreements)
- Recommendations

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