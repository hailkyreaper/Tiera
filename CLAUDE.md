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

Sprint 1 (active): project setup, authentication, deployment.

Do not implement features from future sprints until explicitly instructed.
