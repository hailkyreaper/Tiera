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
- Rounded corners: `rounded-sm` on cards (`bg-card` surfaces, incl. the shared 
  `Card`/`Button` components), buttons, and non-tier book covers (`BookCover`, 
  e.g. Top Favorites, search results, recommendations). Tier list book chips/
  covers and tier row backgrounds keep their own smaller, tier-specific radius 
  — unchanged by this rule.
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
- `/design/9aelawu23i981.png` — TierMaker-style reference for tier-row book sizing: 
  every cover is a fixed size in every row and every tier — wrapped rows never grow/
  shrink covers to fill the leftover width, they just left-align and leave empty 
  space. This is what `SortableBookChip`/`TierRowBar` match today (fixed `w-11`/`w-8` 
  etc, `shrink-0`, plain `flex-wrap`) — not flex-grow, which was tried and reverted 
  because it made a wrapped tier's last row render visibly different-sized covers 
  than the row above it whenever the book count differed.
- `/design/profilelisttab.png` / `/design/profilelibrarytab.png` — Profile's Lists/
  Library tab pair: below Top Favorites, a two-icon tab row (list icon / book icon, 
  underline indicator on the active tab) replaces the old plain "Lists" header. 
  Lists tab shows the same list cards as before, unchanged. Library tab shows a 
  "LIBRARY" label with Filter/Sort buttons on the right. NOTE: what actually 
  shipped diverges from this mockup — see "Current sprint" below for why 
  (covers only, no title/author text, no per-book "⋮", a "Select" mode for 
  multi-delete instead, and no Filter button at all — removed after the user 
  saw it live and didn't want it).

When building a feature, always check the matching image above first. If a screen 
doesn't have an exact match, use the closest reference plus the general Design rules 
above.

## Current sprint

None of the numbered sprints are active — Sprint 7 is still waiting to be 
explicitly started (see Sprint Rule).

**Library View screen** ✅ done — user's own request, verbatim: "No place to 
view books when added to library except for going into lists and scrolling down 
to library." Shipped differently than the original plan below (a separate 
`/profile/library` page): partway through, the user supplied two mockups 
(`design/profilelisttab.png`, `design/profilelibrarytab.png`) showing the Lists 
section turned into a tab, with a Library tab beside it, so that became the real 
spec instead of a standalone page.
- Profile's old plain "Lists" header is now `ProfileTabs` 
  (`src/components/profile-tabs.tsx`) — two icon tabs (list/book, underline 
  indicator) driven by `?tab=lists|library` on `/profile`. Lists tab content is 
  unchanged from before.
- Library tab: `getLibraryBooks`/`sortLibraryBooks` (`src/lib/db/library.ts`) 
  fetch `user_books` joined to `books` (title, authors, thumbnail, 
  average_rating) for the signed-in user only — same owner-only RLS reasoning 
  as the original plan.
- **Sort logic** (left to our judgment by the user): four options — Recently 
  Added (default, by `user_books.created_at`), Title (A–Z), Author (A–Z), 
  Highest Rated (by `books.average_rating`). A genre Filter was also built 
  (populated from `books.categories`) but the user asked to remove it entirely 
  once they saw it live — `getLibraryGenres`, the `genre` query param, and the 
  `categories` field on `LibraryBook` were all deleted rather than left as dead 
  code/an unused column selection.
- **Grid + removal, revised**: the first pass showed cover + title + author in a 
  5-column grid with a per-book "⋮" menu (matching `profilelibrarytab.png` 
  literally), but the density truncated titles/authors unreadably. Fixed by 
  dropping to a 3/4-column grid (matching `FavoritesGrid`'s convention) with no 
  text clamp — full titles/authors always wrap and display completely. Then the 
  user asked to drop title/author text entirely and add real multi-select 
  instead of a per-book kebab: `LibrarySection` 
  (`src/components/library-section.tsx`, replaces the old `LibraryControls`/
  `LibraryGrid`/`LibraryBookMenu`, now deleted) is a single client component 
  holding Sort *and* a "Select" mode — tapping Select swaps Sort for 
  Cancel/Delete(N), tapping covers toggles a checkmark overlay, Delete calls 
  the new bulk `removeBooksFromLibrary(bookIds)` server action 
  (`src/app/(app)/profile/actions.ts`, replaces the old single-id 
  `removeFromLibrary`), using the same pre-existing `user_books` DELETE RLS 
  policy. Covers are plain (no text, no per-item menu) outside select mode. 
  Grid went back to 5 columns once text was removed (5 columns only ever caused 
  problems when text needed to fit under each cover).
- Sprint 7 ("Import & Search Polish": Goodreads CSV import, search filters/history) 
  is still not started — most of the *search* half of that scope actually already 
  got done incidentally in the "Post-Sprint-6 bug fixes, round 3" section below 
  (Open Library switch, local-cache search, rating/series ranking), similar to how 
  Sprint 6 finished incidentally. CSV import specifically has not been touched.

**Profile header polish** ✅ done — the user asked to bring everything above the 
Lists/Library tabs (banner, avatar, stats, bio, Top Favorites) closer to 
`design/profile.png`, via a double-pass screenshot review, then a follow-up round 
of manual tweaks. Applied identically to both `/profile` and `/u/[username]` 
(Sprint 5.5 established these two mirror each other) since they share the same 
banner/avatar/stats markup:
- Banner: was a flat `from-primary/60 via-indigo-950 to-purple-950` gradient; 
  added two blurred color-glow circles (fuchsia top-left, primary top-right) plus 
  a radial-vignette overlay for a cosmic-nebula feel closer to the mockup's photo 
  background, without fabricating an actual image asset.
- Avatar: solid `ring-4 ring-primary` replaced with a gradient ring (wrapping 
  `div` with a `from-primary to-pink-500` gradient background + `p-1`, avatar 
  clipped inside), matching the mockup's two-tone ring.
- Display name + `@username` moved from the content area below the banner to 
  inside the banner itself, stacked directly under the avatar (banner switched 
  from a fixed `h-40` centered box to an auto-height `flex-col` with padding, so 
  it grows to fit).
- Stats row spacing: went `justify-around` → `justify-between` during the 
  screenshot-review pass, then the user reverted it back to `justify-around` by 
  hand afterward — leave as `justify-around`, don't re-apply `justify-between`.
- `FavoritesRow` (`src/components/favorites-row.tsx`, shared by both pages): 
  heading changed from the small-caps muted "TOP FAVORITES" label style (matching 
  Lists/Library's convention) to a plain semi-bold "Top Favorites" per the 
  mockup, "View more" → "View all", and the cover row itself now bleeds to the 
  container's right edge (`-mx-6 pl-6` on the scroll strip, cancelling the page's 
  `px-6` on that one row only) instead of stopping short with a visible gap — the 
  heading row above it stays normally inset.
- Deliberately NOT added: the mockup's top-left back arrow and top-right "•••" 
  overflow-menu icon. The back arrow contradicts the app's actual nav model (tabs 
  don't get back buttons, only pushed detail pages do — same reasoning already 
  used to discount `topmatches.png`'s nav bar); the "•••" has no defined 
  destination/feature behind it yet, so adding it would be UI without function. 
  `/u/[username]`'s own back arrow (for navigating out of a visited profile) and 
  Follow button are unrelated pre-existing elements, unchanged.
- Top Favorites still had a visible gap after the 5th cover even once the row 
  could bleed to the container edge (bleeding only helps when content overflows; 
  5 fixed-`w-14` covers never did). Fixed by dropping the fixed width/scroll 
  entirely — each cover is now `flex-1 min-w-0` so however many favorites exist 
  (1–5) always stretch to evenly fill the full row width, no gap regardless of 
  count.

**Book cover "page curl" removed site-wide** ✅ done — user noticed a small 
folded-corner graphic in the bottom-right of covers "across the site" and asked 
where it came from. Root cause: Google's Books content API bakes an actual 
page-curl image overlay onto the cover photo itself whenever the request URL 
has `&edge=curl` — which `imageLinks.thumbnail` includes by default — and this 
is baked into the image bytes, not a CSS effect. Open Library covers never have 
this (confirmed: pulled the real rendered `<img>` `src`s off the page — every 
`covers.openlibrary.org` URL was clean, every affected one was 
`books.google.com/books/content?...edge=curl...`). Fix, in `src/lib/cover-url.ts` 
(new `cleanCoverUrl()`, strips the `edge` query param via `URL`/`searchParams`, 
safe no-op on Open Library URLs or malformed input):
- Applied at every book-cover render site that was bypassing the shared 
  `BookCover` component with its own `next/image`: `TierRowBar` (read-only tier 
  previews), `SortableBookChip` (interactive tier board chips), `tier-board.tsx`'s 
  drag overlay, and `BookCover` itself (covers everywhere else — Favorites, 
  Library, search results, Compare, recommendations). Avatar `<Image>` usages 
  (profile pages, list creator header, comments, top-match card) were checked 
  and are unrelated — not touched.
- Also fixed at the source: `secureThumbnail()` (`src/lib/google-books.ts`) now 
  calls `cleanCoverUrl` too, so `findOrCreateBook`'s insert (the only write path 
  into `books.thumbnail_url`) and the live search dropdown both store/show clean 
  URLs for any book added from now on. The render-layer fix above is what makes 
  *already-stored* dirty rows look clean immediately, with no DB migration 
  needed — this source-level fix is just defense-in-depth for any future code 
  that reads `thumbnail_url` directly instead of through an `<Image>`.

**Save Match removed** ✅ done — user's call: "no need for saved matches 
anymore," after the To Do list surfaced that it never got a destination screen. 
Deleted `src/components/save-match-button.tsx` and 
`src/app/(app)/compare/actions.ts` (only held `toggleSavedMatch`, nothing else 
used the file) entirely rather than leaving dead code; removed the button, the 
`saved_matches` lookup query, and the `isSaved` prop from the Compare detail 
page (`src/app/(app)/compare/[username]/page.tsx`) — that page's bottom action 
row is now just a single full-width "View Full Profile" button. The 
`saved_matches` table itself (migrations `0015`/`0016`) was NOT dropped — no 
precedent in this repo for a destructive down-migration, and an unused table is 
harmless; revisit only if DB cleanup is ever explicitly requested.

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
  existing `RecommendationRow` from the standalone Recommendations screen), and a 
  View Full Profile button. (A Save Match toggle also shipped here originally — 
  `saved_matches` table + `toggleSavedMatch` action — but was removed later, see 
  "Current sprint" below: it never got a destination screen to view saved 
  matches, and the user decided there was no reason to keep it once that gap was 
  pointed out.)
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

### Post-Sprint-6 bug fixes, round 3 (user feedback pass) ✅ COMPLETE
Third mobile-testing pass — tier row sizing/spacing refinements, a corner-radius 
pass, and unifying the two book-search implementations into one.
- Tier row book covers went through several iterations before landing: fixed-size 
  grid (`grid-cols-6` ranked / `grid-cols-4` unranked / `grid-cols-8` preview) so 
  every row divides its full width evenly with zero leftover slack, `aspect-[2/3]` 
  as a *cap* (not a forced box) with `overflow-hidden` so a cover close to that 
  ratio (nearly all of them) renders at ~full height while a rare tall/narrow 
  outlier just gets clipped instead of stretching the whole row, and `object-contain` 
  removed in favor of plain `h-auto` sizing (the aspect-ratio cap on the wrapper 
  handles capping, so the image itself doesn't need its own fit mode).
- Known remaining issue: some tier rows still visually overflow past their divider 
  in Chrome desktop's mobile-emulation mode specifically (confirmed NOT reproducible 
  via Playwright at any tested width, nor via the compiled CSS/HTML output — the 
  underlying rule and every automated check are clean). Parked for now per user 
  instruction; revisit if it recurs.
- Corner radius: cards (`bg-card` surfaces incl. the shared `Card`/`Button` 
  components) and non-tier book covers (`BookCover`) moved from the old 20px-based 
  `rounded-xl`/`rounded-2xl` to `rounded-sm`. Tier list book chips/badges and tier 
  row backgrounds were deliberately left untouched — see the Design rules entry 
  above.
- Unified Create List's and the general Search page's book search into one shared 
  implementation (`BookSearchInput`/`BookSearchForm`/`AddBookButton`) — previously 
  Create List had a live typeahead dropdown and general Search was a plain 
  type-and-press-Enter form with no suggestions at all. `BookSearchInput` now takes 
  a caller-supplied `action`/`extraFields` so the same dropdown can add to a tier 
  list or straight to the library. New "single continuous bar" styling (search.png 
  reference): the separate Search button is gone, replaced by a trailing 
  magnifying-glass icon inside the same bordered pill as the input. Both pages' 
  full-search results now render as the same divided list (`SearchResultCard`'s 
  now-sole layout — the unused "grid" variant was deleted).
- Found and fixed why the live search dropdown could silently never open: the 
  input's `autoFocus` can fire the browser's native focus event before React 
  finishes hydrating and attaches the `onFocus` handler that sets it open, leaving 
  it stuck closed forever even once results came back correctly — `onChange` now 
  also opens it, since typing always fires reliably.
- Found (while debugging the above) that Google's Books API intermittently returns 
  `503 backendFailed` on otherwise-valid requests (confirmed live, ~50% failure 
  rate at the time), and `searchGoogleBooks` was silently swallowing any non-ok 
  response into an empty result with no logging at all. Added a couple of quick 
  retries (clears it almost every time) plus a server-side error log.
- Added `searchLocalBooks`/`searchBooks` (`lib/db/books.ts`) — every book anyone 
  adds already lives in our own `books` table via `findOrCreateBook`, but search 
  never actually queried it, only ever hit the live API. Local matches now lead 
  (a book someone's already added stays reliably searchable even if the live API 
  is down), live results merge in after, deduped by id. Also fixed a fairness bug 
  in the merge: local results have no `ratingsCount` of their own, so sorting the 
  whole combined pool by it together buried exact local matches under any live 
  result with a few ratings, however irrelevant (a special-edition sheet-music 
  book, say) — local and live results now each sort internally by the best rating 
  signal they actually have, local first.
- Added rating-based ranking + series clustering: the merged pool sorts by rating 
  so the single most well-known book leads regardless of source, and every other 
  result sharing the top result's author gets pulled up right behind it (a series' 
  later entries often have far fewer ratings than a breakout first book, so pure 
  rating-sort alone scatters them) — `harry potter` now returns 6 different books 
  across the series instead of 6 editions of book 1.
- **Replaced Google Books with Open Library as the primary live search source** 
  (`searchOpenLibraryBooks` in `lib/open-library.ts`, used by `searchBooks`). 
  Google's API had two persistent problems — the ~50% 503 rate above, and 
  relevance loose enough that a short/partial query (e.g. "harry po", typed 
  mid-search) could surface a mix of sheet music, cookbooks, and study guides 
  ahead of the real books — and needed an `intitle:` workaround that only 
  partially fixed the second one. Open Library's default relevance already ranks 
  title matches sensibly, returns real ratings data far more consistently, and 
  was 100% reliable across repeated testing. The now-fully-dead Google search code 
  (the `intitle:` workaround, retry loop, fetch helper) was removed from 
  `google-books.ts`; `GoogleBookVolume`/`bookFormFields`/`byPopularity` etc. stay 
  since they're still the shared shape/utilities, just populated from a different 
  source now. `books.google_volume_id` holds whichever source's id a book came 
  from (Open Library keys going forward, existing Google volume ids for books 
  already in the table) — both are just opaque unique strings to the rest of the 
  app, so no migration was needed. `GOOGLE_BOOKS_API_KEY` is still used by the 
  unrelated `/admin/backfill-categories` script (fetches a specific already-known 
  Google volume id, not search) — not dead, don't remove it.

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
- Bad word filter for comments/usernames (moved here from To Do 2026-07-10, not 
  started). Needs a decision first: simple hardcoded wordlist (free, easy to 
  bypass) vs. a real moderation library/API (better coverage, more setup), and 
  whether it should hard-block submission or just flag for review.

## To Do

- Library View screen ✅ done — see Current sprint section above for the full spec.
- Security: `/admin/backfill-categories` has no admin/role check — any logged-in 
  user can currently trigger it. Needs a role check before Sprint 6. ✅ done — new 
  `profiles.is_admin` column (migration `0017`) + shared `isAdmin()` helper 
  (`lib/auth/admin.ts`), gating both the page (404 for non-admins) and the server 
  action itself. No self-service way to grant admin yet — set your own account 
  manually via `update profiles set is_admin = true where id = auth.uid();` after 
  running the migration.
- Data quality: duplicate book catalog rows for the same title (e.g. "Powerless," 
  "The Fires of Vengeance") — currently defended against with title-based de-dupe 
  in Compare/Recommendations, but source rows were never merged. Cause: every 
  distinct edition a user adds gets its own `books` row (matched by 
  `google_volume_id`/Open Library key, which differs per edition/printing, not 
  per title) via `findOrCreateBook` — so "The Fires of Vengeance" the paperback 
  and "The Fires of Vengeance" the ebook can each create a separate row with 
  their own `id`, own rating, own thumbnail, instead of sharing one canonical 
  book. Compare/Recommendations paper over it by de-duping on title text at 
  query time, but nothing has ever gone back and merged the underlying 
  duplicate rows (repointing `user_books`/`tier_list_items` to one canonical id 
  and deleting the rest) — that's the "source rows were never merged" part.
- Saved matches ✅ removed — see "Current sprint" above (no destination screen, 
  user decided to just delete the feature rather than build one).
- Bad word filter for comments/usernames — moved to Ideas Backlog (not being 
  scheduled into a sprint right now); see that section for the open questions.
- User feedback: "UI is extremely inconsistent" — user's plan (2026-07-10): not 
  a dedicated pass, addressed incrementally as they hand over specific color 
  values. Don't proactively restyle colors beyond what's given. Applied so far, 
  dark mode only (`src/app/globals.css` `.dark` block; light untouched — user: 
  "I have never looked at light mode"):
  - `--background: #030a10`, `--card: #0c1115`.
  - Buttons matched to card color: `Button`'s `outline` variant now uses 
    `dark:bg-card` (was `dark:bg-input/30`) — this is the shared secondary-button 
    style used almost everywhere (Edit Profile, Cancel, View Full Profile, etc.), 
    so fixing it there covers most of the app. Also added explicit `bg-card` to 
    the bare (non-`Button`-component) Filter/Sort/Select pill triggers in 
    `library-section.tsx`, which previously had no background at all. Left 
    `ghost`-variant buttons (Cancel in select mode, Log out) alone — they're 
    deliberately chromeless, not meant to read as a card surface.
  - Same treatment for the shared `SegmentedTabs` component's *inactive* pill 
    (`bg-muted` → `bg-card`) — active stays `bg-primary`/purple, unchanged. 
    `SegmentedTabs` is reused by Explore (For You/Following/Recent), Compare 
    (All/Friends), and Search (Books/People), so this one change covers all 
    three screens' tab rows at once.