# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

Actively in development. Sprints 1-6 are complete (Sprint 6 finished incidentally — 
its items were either already done in 5.5, or merged into the Sprint 5 addendum's 
Top Matches work). Waiting to be told to start Sprint 7 (see Sprint Rule).

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

Bottom nav (left to right): Explore, Search, Create List (center), Compare, Profile.

- **Explore**: main discovery feed
- **Search**: books + people
- **Create List** (center): the `/lists` route, repurposed as a create-only 
  screen (see Sprint 5.5 item 4 for the full spec) — NOT a browsable lists 
  page. There is no standalone "browse all lists" screen.
- **Compare**: taste-match comparison tool. Landing view shows a "Your taste score" 
  card, then **All** / **Friends** tabs — All is the ranked "Top Matches" list 
  (people ranked by taste match %, similar to Recommendations' matching logic), 
  Friends is the same ranking restricted to people you follow. The username search 
  bar lives inside the Friends tab (not a separate always-visible element).
- **Profile**: your own profile — includes Top Favorites AND your own created 
  lists, shown directly on the profile page exactly as they display today 
  (full list cards, not a grid)

Tapping a list card (from Explore, Profile, or anywhere else) opens the list detail 
view without switching the active bottom nav tab — the nav stays highlighted on 
whichever tab the user came from, similar to how Reddit keeps you under a feed tab 
when you open a post.

Note: some reference mockups (e.g. topmatches.png) show a different 5-item nav 
(Home/Explore/Discover/Top Matches/Lists) generated from a generic template — this 
does NOT apply. Our nav structure above is the source of truth; only use these 
mockups for the Top Matches list content and Compare detail page content, not their 
nav bar.

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

Note: Taste Insights (genre breakdown page) was built in Sprint 4, then removed in 
Sprint 5.5 — doesn't serve the core mission of comparing taste with others. May 
revisit later as an input to Compare/Recommendations rather than a standalone page.

## Design References

Reference images live in `/design/`. Before building or restyling any screen, look at 
its matching reference image below and match layout, spacing, and styling as closely 
as possible — not just the general rules above.

- `/design/Explorepage.png` — Explore feed (list cards, tabs, tier previews)
- `/design/search.png` — Search page (books/people tabs, recent/popular searches)
- `/design/createlist.png` — the repurposed `/lists` route (center nav "Create" 
  button), owner-only, no social elements. One unified card (cover picker, 
  Title, Description, Tags, Visibility), the tier board (colored-bar style, 
  drag-and-drop), Unranked Books section, and a Search Books / Import / Add 
  from Library action bar.
- `/design/profile.png` — Own profile page (stats, top favorites, bio)
- `/design/otheruser.png` — Another user's public profile view (Follow button 
  instead of Edit Profile) — also used as the reference for the additional 
  creator/profile context that should appear on the list detail page
- `/design/compare.png` — Compare detail page, original version: match %, Summary 
  (You Both Love / You Disagree On)
- `/design/compare-v2.png` — Compare detail page, UPDATED reference (save the new 
  uploaded image here): adds Shared Dislikes count, a 3-stat row (Shared Favorites / 
  Shared Dislikes / Biggest Disagreements), disagreements shown as a You-rated vs. 
  They-rated table, inline "Based on this match, you might like" recommendations 
  with match % and Add buttons, View Full Profile + Save Match buttons at the bottom
- `/design/topmatches.png` — Compare landing screen reference: taste score summary 
  card, ranked list of match cards (avatar, name, @username, match %, books ranked, 
  top genres, top favorites row). IGNORE this image's bottom nav bar (see Navigation 
  structure note above) AND its All/Books/Want to Read tabs — what actually shipped 
  is All/Friends (see Navigation structure), since Books/Want to Read don't map to 
  any real distinction in Tiera's data model.
- `/design/rec.png` — Recommendations screen
- `/design/main.png` — Landing/logged-out screen (Get Started/Log In)

When building a feature, always check the matching image above first. If a screen 
doesn't have an exact match, use the closest reference plus the general Design rules 
above.

## Current sprint

None marked active. Sprints 1-6 are complete — wait to be explicitly told to mark 
Sprint 7 current before starting it.

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

### Sprint 4 — Profile & Taste Insights ✅ COMPLETE (Taste Insights later removed, see Sprint 5.5)
- Profile page with stats
- Top Favorites
- Taste Insights by genre

### Sprint 5 — Compare & Matching ✅ COMPLETE
- Taste match % algorithm
- Compare page — match %, You Both Love / You Disagree On (disagreements require a 
  2+ tier gap to filter out normal variance), Top Recommendation For You card
- Recommendations — standalone screen, draws from the top 5 most-similar users 
  (85%+ preferred, falls back to closest matches), deduped by book/title, excludes 
  anything already ranked or in your library. Linked from Explore.
- "Taste Roast" comparison blurb — depends on the match % algorithm above

### Sprint 5.5 — Structural Audit Fixes ✅ COMPLETE
Full app audit surfaced these issues — fixing before Sprint 6, since Social Layer 
work would otherwise build on top of broken navigation/linking.

1. **List detail navigation context** ✅ done:
   - Bottom nav stays on the tab the user came from (Explore/Profile), via a 
     `?from=` param read by `NavBar`; no tab lights up if there's no recognized 
     origin (e.g. opened from someone else's `/u/[username]`)
   - Back button (top-left, `router.back()`) on the list detail page (both 
     owner/visitor views) and on `/u/[username]`
   - Follow system built for real (`follows` table + `toggleFollow` action + 
     `FollowButton`), used on both `/u/[username]` and the list detail page
   - `/u/[username]` mirrors `/profile`'s full layout (banner, avatar, stats, 
     bio/location/joined date, Favorites, Lists) — Edit Profile slot becomes 
     Follow; viewing your own username redirects to `/profile`
   - List detail page now shows creator avatar + username (linked) + relative 
     timestamp, list description + tags (new nullable `tier_lists.description`/
     `tags` columns, editable by the owner via an "Edit details" toggle, set at 
     creation via the `/lists` create form), and — for visitors — your taste 
     match % against the creator next to the like/comment counts
   - Comments now show each commenter's avatar + relative timestamp, and the 
     post box uses an icon-only send button
   - The visitor (read-only) tier board now reuses the same `TierRowBar` 
     component as the Explore card, so both render identically. The owner's 
     interactive drag-and-drop board is unchanged (different interaction 
     model — not restyled in this pass).
2. **List card styling** ✅ done — restyled to match Explorepage.png/otheruser.png: 
   creator avatar + username + relative timestamp header, per-tier colored full-height 
   bars (letter cell + shared lighter content-cell background + faint dividers 
   between cover slots, one continuous rounded bar, not a floating badge), real 
   match % per card (computed against each list's creator, omitted on your own 
   lists / when not logged in / below the 3-shared-book minimum).
3. **Profile linking gaps** ✅ done — Explore card @username, comment @username, 
   Compare's Top Recommendation card @username, and Compare header's "them" 
   @username all now link to that user's profile. Left as plain text anywhere a 
   username is the page's own subject (self-referential, e.g. your own `/profile`).
4. **Restructure Lists navigation** ✅ done (no Instagram grid — Profile's list 
   display was left exactly as it already showed):
   - Bottom nav reordered to Explore / Search / **Create** (center, circular 
     purple button) / Compare / Profile. "Create" is the `/lists` route, 
     repurposed — not a separate `/lists/new`, and no more browsing page.
   - `/lists` (no id) now just silently creates a blank list and redirects to 
     `/lists/[id]?edit=true&new=true`.
   - The owner's view of a list is now fully separate from the visitor's, and 
     has **no social elements at all** (no creator avatar/username/timestamp, 
     no likes, no comments, no Follow) — that entire header only exists on the 
     visitor-facing view (`otheruser.png` style), unchanged.
   - Owner edit mode (`?edit=true`, shown automatically for new lists): 
     Cancel / "Create List" or "Edit List" / Save header, then **one** unified 
     card (matching createlist.png exactly) with a cover-picker placeholder, 
     List Title (live `20/40` counter), Description, Tags, and a Visibility 
     dropdown (Public/Private) — replaces the old separate Make/Public-Private 
     button.
   - Owner normal mode: title + description/tags + Edit + Delete buttons, then 
     the tier board, then the action bar.
   - Tier board: ranked S–F tiers, then "Unranked Books (N)" as its own 
     section below. The old "add from your library" browsing row and its 
     drag-out-to-remove behavior were removed entirely (superseded by "Add 
     from Library," below).
   - The interactive drag-and-drop board now uses the same colored-bar look 
     as `TierRowBar` (full-height letter cell, shared content-cell background, 
     divider lines between cover slots), sized slightly bigger than the 
     Explore card version (`h-14`/`w-11` vs `h-10`/`w-8`). Old square 
     `BookTile`/`SortableBookCard` tiles removed; new `SortableBookChip` keeps 
     drag-and-drop fully working via the same dnd-kit wiring. The drag 
     overlay preview was resized to match.
   - Bottom action bar is one unified `bg-card` pill (matching the top 
     container), three segments: **Search Books**, **Import** (inert 
     placeholder — future AI photo-import idea, backlog), **Add from Library** 
     (renamed from "Reorder", which was dropped).
   - **Search Books** → dedicated `/lists/[id]/search` page (Goodreads-style): 
     search, tap Add, book goes to Unranked, stays on the page so you can add 
     several in a row.
   - **Add from Library** → dedicated `/lists/[id]/library` page: shows books 
     already in your library not yet in this list, same tap-to-add-and-stay 
     pattern.
   - Deleting a list redirects to `/profile` (no more `/lists` to return to).
5. **Nav label fix** ✅ done — "Home" → "Explore".
6. **Delete Taste Insights** ✅ done — removed /profile/insights (genre breakdown 
   + Taste Roast) and its link from /profile.

### Sprint 5 addendum — Compare enhancements (pull in after Sprint 5.5)
Reference images compare-v2.png and topmatches.png (both cropped from the combined 
upload `comupdate.png`) expand Compare beyond what shipped in Sprint 5:
- Compare detail page ✅ done — Shared Dislikes count (both C-tier or lower, the 
  mirror of the existing "both love it" A-or-higher threshold), a 3-stat summary 
  row (`CompareStatsRow`), "Top Books You Both Love" as a full list (cover/title/
  author/tier badge, not just a cover strip), a You-rated vs. They-rated 
  disagreements table (`DisagreementsTable`, semantic red/green coloring rather 
  than tier-spectrum colors — the point is sentiment, not tier branding), inline 
  match-based recommendations (`getMatchRecommendations`, top 4 of the other 
  user's highest-rated unowned books with a per-book confidence %, reusing the 
  existing `RecommendationRow` from the standalone Recommendations screen), View 
  Full Profile button, and a real working Save Match toggle (`saved_matches` 
  table + `toggleSavedMatch` action — persists, but there's no dedicated "view 
  your saved matches" screen yet).
- Compare landing page's "Top Matches" list ✅ done — decided this IS Sprint 6's 
  "People you might vibe with" (same idea, not two separate features), so it 
  closes both out at once. "Your taste score" card (ring showing your single 
  best match % on the platform, plus "you match with N% of users" coverage 
  stat from `getOtherUserCount`), **All** / **Friends** tabs (`SegmentedTabs`), 
  Friends restricted to who you follow via the existing `follows` table, ranked 
  match cards (avatar, match %, books ranked, top genres aggregated from their 
  ranked books' categories, top favorite covers via the existing 
  `getFavoriteBooks`). The existing username search bar moved into the Friends 
  tab (same `goToCompare` action, unchanged behavior, just relocated). New 
  `lib/db/top-matches.ts` (`getTopMatches`, `getOtherUserCount`). Detail page 
  (compare-v2, above) is unchanged — cards just link into it like before.

### Sprint 6 — Social Layer ✅ COMPLETE
- Follow system ✅ done (built in Sprint 5.5)
- Comments ✅ done (built in Sprint 5.5)
- "People you might vibe with" ✅ done — merged into Top Matches above, not a 
  separate feature

### Post-Sprint-6 bug fixes (user feedback pass) ✅ COMPLETE
Not sprint-scoped work — real bugs surfaced by testing the shipped features above.
- Explore's Following tab was silently reusing the unfiltered "all public lists" 
  query (no actual follows filter existed); fixed, plus added a stable final sort 
  tiebreaker (`id`) so ties don't reorder between requests.
- Create List title/visibility were lost if you navigated to Search Books/Add from 
  Library mid-edit without saving first (those routes are a full page navigation, 
  disconnected from the unsaved client-side form state) — both now auto-save 
  title/visibility before navigating, but deliberately do NOT mark the list as 
  saved (`is_draft` stays untouched) — only the actual Save button does that. 
  Getting this distinction right took two passes; see `saveListFields`'s 
  `markSaved` param in `lists/actions.ts` for the reasoning.
- Search results (general /search and Create List's search) now show a persistent 
  "Added" checkmark (`AddBookButton`, calls the action programmatically) instead 
  of the item seeming to vanish when the page revalidates after adding.
- Ranking a book now revalidates every Compare page too, not just the list itself 
  (`revalidateCompare()` in `lists/actions.ts`) — Compare stats were silently stale 
  otherwise.
- Lock icon on private lists on your own profile (`ExploreListCard`'s `isPublic` 
  prop — only passed on Profile, never on Explore where everything's already public).
- `TierRowBar` (Explore cards, Profile list cards, visitor-facing list detail) was 
  unconditionally hiding any empty tier, so lists showed a different number of 
  visible rows depending on what happened to be ranked — now always shows all 6.
- Favorites pages (own + `/u/[username]`) restyled to use the app's standard 
  `BackButton` header instead of a bare "← Back" text link; covers now show titles.
- Delete List wasn't visibly doing anything: the delete itself worked, but 
  `void deleteTierList(...)` discarded the promise, which broke the 
  redirect-signaling Next.js server actions rely on for `redirect()` to actually 
  navigate when the action is called directly (not via a form) — must be awaited.
- Migration `0014` (`is_draft` flag) had a bug: `default true` applied to every 
  *existing* list too, not just new ones, hiding them all from the profile page — 
  backfilled via migration `0018`.

### Post-Sprint-6 bug fixes, round 2 (user feedback pass) ✅ COMPLETE
Second mobile-testing pass, after the round above shipped.
- Live book search (Create List's Search Books, and general `/search`) had a race 
  condition — a fast-typed earlier keystroke's response could resolve after a later 
  one's and overwrite it, making search seem to randomly stop returning results; 
  fixed with a `latestRequestId` guard in `BookSearchInput` that drops any response 
  that isn't from the most recent request.
- Search relevance: Google Books results skewed toward obscure/old editions over the 
  best-known one (e.g. searching "Harry Potter"). `searchGoogleBooks` now fetches a 
  wider pool and re-sorts by `ratingsCount` before slicing to the requested limit.
- Search Books/Add from Library stacked one browser-history entry per search term, 
  so going back required pressing back once per search performed. Replaced native 
  form-GET submission with `router.replace()` (`ListSearchForm`) so repeated 
  searches update the same history entry instead of pushing new ones.
- Added an info-icon popover (`InfoPopover`, wraps `@base-ui/react/popover`) next to 
  Compare's taste-score explaining what the percentage and "Top Match"/"you match 
  with X%" language means — this was previously unexplained in the UI.
- Tier rows now wrap to multiple lines instead of clipping/hiding books once a tier 
  filled its first row (`TierRow`/`TierRowBar` use `flex-wrap`), with the colored 
  tier badge auto-stretching to match via flex's default `align-items: stretch` — 
  no JS measurement needed. Book chips grow/shrink to fill the row's actual width 
  (`grow basis-N min-w-N max-w-N` in `SortableBookChip`/`TierRowBar`) instead of 
  leaving a gap. The row wrapper needs `shrink-0`, or a sibling tier wrapping to a 
  second line squishes every other (non-wrapped) row shorter to compensate, since 
  flex items shrink by default. Same treatment applied to both the interactive 
  Create List board and the static `TierRowBar` used by Explore/Profile/visitor 
  list-detail previews, for a consistent look everywhere tiers are shown.
- Added drag-to-trash on the Create List board (`TrashDropZone`, only rendered 
  mid-drag) — dropping a book on it removes it from the list via the new 
  `removeBookFromList` action.

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

## Ideas Backlog
Ideas worth remembering but not yet scheduled into a sprint. Pull into a sprint 
explicitly before building.

- V2: Upgrade `current_tier` calculation from flat average to recency-weighted 
  average (Amazon/Netflix-style time-decay). Deferred for MVP simplicity.
- AI photo import: let people add books by taking a photo of the physical book 
  (the Create List action bar's "Import" button is an inert placeholder for this 
  today). Doable for a single cover photo (vision model reads title/author, then 
  match against the existing Google Books lookup for real metadata), much less 
  reliable for a full bookshelf photo (angled/partial spines). Needs a new vision-
  model integration (cost per call, separate from the free Google Books calls 
  already used), photo upload UI, and a review/confirm step before adding, since 
  misreads are expected. Not in the roadmap yet — pull into a real sprint before 
  building.

## To Do

- No place to view books when added to library except for going into lists and 
  scrolling down to library.
- Security: `/admin/backfill-categories` has no admin/role check — any logged-in 
  user can currently trigger it. Needs a role check before Sprint 6. ✅ done — new 
  `profiles.is_admin` column (migration `0017`) + shared `isAdmin()` helper 
  (`lib/auth/admin.ts`), gating both the page (404 for non-admins) and the server 
  action itself. No self-service way to grant admin yet — set your own account 
  manually via `update profiles set is_admin = true where id = auth.uid();` after 
  running the migration.
- Data quality: duplicate book catalog rows for the same title (e.g. "Powerless," 
  "The Fires of Vengeance") — currently defended against with title-based de-dupe 
  in Compare/Recommendations, but source rows were never merged.
- Saved matches have no destination screen. The Save Match toggle on Compare 
  (`saved_matches` table + `toggleSavedMatch` action) works and persists, but 
  there's nowhere to actually browse who you've saved. Needs a simple list page 
  (saved users, linking into their Compare page).
- Bad word filter for comments/usernames — not started. Needs a decision first: 
  simple hardcoded wordlist (free, easy to bypass) vs. a real moderation 
  library/API (better coverage, more setup), and whether it should hard-block 
  submission or just flag for review.
- User feedback: "UI is extremely inconsistent" — flagged without specific 
  examples yet. Revisit once there are concrete screens/elements to point to.