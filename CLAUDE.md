# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

Actively in development. Sprints 1-7 are complete (Sprint 6 finished incidentally — 
its items were either already done in 5.5, or merged into the Sprint 5 addendum's 
Top Matches work; Sprint 7 finished 2026-07-11 — CSV import was the real remaining 
work, search polish had already landed incidentally in the Post-Sprint-6 round 3 
bug-fix pass). Sprint 8 is next but not yet marked CURRENT — see Sprint Rule.

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

**Goodreads CSV import** ✅ done — first real Sprint 7 work. User's own spec: 
tapping the Create List action bar's "Import" button (previously an inert 
placeholder, per the Ideas Backlog's AI-photo-import note below) now opens a 
bottom sheet with two choices, "Import from Goodreads" and "Import with AI" 
(still a disabled "Coming soon" placeholder — explicitly sequenced by the 
user to come after Goodreads: "when we finish this, then we can move on to 
import with ai"). New `ImportDrawer` 
(`src/components/tier-list/import-drawer.tsx`), same Base UI Drawer bottom- 
sheet pattern as `BookDetailDrawer`.
- "Import from Goodreads" goes to a dedicated page, 
  `/lists/[id]/import/goodreads` — same "action-bar button → own page" 
  convention as Search Books/Add from Library, not a form crammed into the 
  drawer itself. Page has short numbered instructions (Goodreads' own 
  My Books → Import/Export → Export Library flow), a CSV file input, and an 
  "Auto-tier by rating" toggle (`@base-ui/react/switch`, default on).
- Edit-mode (new/unsaved list) wiring needed one new trick: Search Books/Add 
  from Library's existing "save unsaved title first" pattern relies on their 
  buttons being literal `type="submit" formAction={...}` descendants of the 
  edit form — but the Goodreads option now lives inside a `Drawer.Popup`, 
  which Base UI portals to `document.body`, breaking that DOM-descendant 
  requirement. Fixed with the standard HTML answer: gave the edit form an 
  `id="edit-list-details-form"` (`edit-list-details-form.tsx`) and the 
  portaled button a matching `form="edit-list-details-form"` attribute — 
  associates it with that form regardless of where it's portaled to. New 
  `saveAndGoToGoodreadsImport` action (`lists/actions.ts`) mirrors 
  `saveAndGoToSearch`/`saveAndGoToLibrary` exactly. Verified live in both 
  modes (already-saved list, and a brand-new unsaved one).
- CSV parsing: new `papaparse` dependency (+ `@types/papaparse`) — Goodreads 
  titles/authors routinely contain commas inside quoted fields, not safe to 
  hand-roll. New `src/lib/goodreads-csv.ts`: `parseGoodreadsCsv` reads the 
  standard Goodreads export columns (Title, Author, ISBN/ISBN13 — unwrapped 
  from Goodreads' `="..."` Excel-formula escaping, My Rating, Average 
  Rating), and **only keeps rows where `Exclusive Shelf` is `"read"`, or the 
  `Bookshelves` column contains a custom `"dnf"` shelf tag** (both user 
  follow-up instructions — to-read/currently-reading are skipped since a 
  rating/tier doesn't mean anything for a book not yet finished, but DNF 
  books are explicitly let through even though they're rarely on the `read` 
  shelf, since Goodreads has no built-in did-not-finish concept and users 
  almost always track it via a self-made "dnf" shelf while leaving Exclusive 
  Shelf as whatever it already was, often still `to-read`). `tierForRating(
  rating, dnf)` maps My Rating 5→S, 4→A, 3→B, 2→C, 1→D, unrated→`"unranked"` — 
  except `dnf` always wins outright to F regardless of any rating attached 
  (a DNF book with a lingering 4-star rating still goes to F, not A). 
  Verified live: a row on the `to-read` shelf but tagged `dnf` in Bookshelves, 
  with a 4-star rating, correctly both got included (despite not being on 
  `read`) and landed in F (despite the 4 stars).
- Import action (`lists/[id]/import/goodreads/actions.ts`, 
  `importGoodreadsCsv`) deliberately makes **zero external API calls for 
  book data** — a real scale concern ruled out up front, since a Goodreads 
  library can be hundreds of rows and a serverless function doing that many 
  sequential Open-Library round trips risks timing out. Book row created 
  directly from the CSV's own Title/Author/rating data; no description is 
  fetched for CSV-sourced books (would need a real API call) — the existing 
  admin backfill tool picks these up naturally later since it scans every 
  book regardless of source.
- **Cover reliability fix**: the original version constructed the cover URL 
  blindly from the ISBN (`covers.openlibrary.org/b/isbn/{isbn}-L.jpg`, no 
  lookup call) and assumed a missing cover was just normal image-load timing. 
  That assumption was wrong — a malformed/mistyped ISBN in the CSV still 
  resolves to *some* HTTP response, so some imported books ended up with a 
  permanently broken image, not a timing fluke. Fixed with `resolveCoverUrl` 
  (`actions.ts`): a HEAD request to the same URL with `?default=false` 
  appended, which Open Library reliably 404s when nothing really exists at 
  that ISBN (confirmed live: a checksum-invalid ISBN 404s, a 
  checksum-*valid*-but-obscure ISBN correctly still resolves since it's a 
  real catalog entry) — only costs one cheap no-body request per newly 
  *created* book, not per CSV row, since matched/existing books skip past it 
  entirely.
- **Post-import redirect now lands in edit mode** (`?edit=true&imported=N`), 
  not the published/visitor view — user feedback: they want to still be able 
  to set the list's title right after importing, not have to click Edit 
  first. `lists/[id]/page.tsx`'s owner branch now shows the "Imported N 
  books..." banner inside the `edit === "true"` branch (above 
  `EditListDetailsForm`) as well as the existing non-edit branch, since either 
  can now be the landing state after an import.
- Dedup, learned directly from the migration-0020 work just before this: 
  `findOrCreateGoodreadsBook` checks for an existing book two ways before 
  creating a new row — first an exact match on the synthetic id this import 
  gives a book (`isbn:{isbn}`, so re-importing the same CSV doesn't create 
  duplicates), then a normalized-title+author heuristic (so a book already in 
  the catalog from a search/add elsewhere doesn't get a second row either). 
  Verified live: importing a CSV containing "Mistborn: The Final Empire" 
  correctly reused the existing catalog row (confirmed by its non-synthetic 
  `google_volume_id`) instead of creating a duplicate.
- **Critical bug found on the user's real import: "it duplicated everything."** 
  Root cause — Goodreads' Title column bakes series info directly into the 
  title (e.g. `"Golden Son (Red Rising Saga, #2)"`), which the title+author 
  dedup match above compared byte-for-byte against the plain `"Golden Son"` 
  already in the catalog from an earlier search/add. They never matched, so 
  every already-owned book with a series suffix silently created a fresh 
  duplicate row instead of being recognized — visible on `/profile?tab=library` 
  as the same book appearing twice, once with its real cover and once as a 
  fresh "No cover" duplicate. Fixed at the source in `goodreads-csv.ts`: 
  `stripSeriesSuffix()` strips exactly one trailing `"(...)"` group off the 
  title before it ever reaches the dedup check or gets saved, so this can't 
  recur on future imports. The ~11 duplicate rows already created in the 
  user's real account before this fix (Morning Star, Red Rising, The Poppy 
  War, Children of Blood and Bone, Yumi and the Nightmare Painter, Two 
  Twisted Crowns, The Housemaid, The Fires of Vengeance, Golden Son, One Dark 
  Window, The Rage of Dragons) need a one-time cleanup, written as migration 
  `supabase/migrations/0021_merge_goodreads_series_suffix_dupes.sql` — same 
  single-statement/chained-CTE pattern as `0020`, but asymmetric matching: 
  only CSV-sourced rows (`google_volume_id like 'isbn:%' or 'goodreads:%'`) 
  with the suffix stripped are matched against non-CSV canonical rows; a 
  CSV row with no match (genuinely new, or never had a suffix) is left alone. 
  **Run, user confirmed successful.**
- **Nothing is committed to the user's account until they click Save.** 
  User feedback: importing shouldn't touch their real library until they 
  actually decide to keep the list. Two parts, since a book can land in two 
  different shared places before Save:
  - `user_books` (library): import no longer upserts into it at all — only 
    `tier_list_items` (the list itself). `saveListFields`'s new 
    `commitListBooks` helper (`lists/actions.ts`) is what actually adds 
    them, by backfilling every book currently on the list into `user_books` 
    — but only when `markSaved` is true, i.e. only from the real Save 
    button, never from Search Books/Add from Library/Goodreads' own 
    intermediate "save fields and navigate" actions. Harmless no-op for 
    books added via Search/Add from Library, which already upsert 
    `user_books` at add-time themselves.
  - `books` (the shared, app-wide catalog): a `tier_list_items` row still 
    has to reference a real `books` row, so a genuinely new import row 
    can't wait until Save to be *created* — but it can stay unconfirmed 
    and hidden from everyone else's search results until then. New 
    `books.is_draft` column (migration 
    `supabase/migrations/0022_book_draft_flag.sql`, run and confirmed 
    successful) — `createGoodreadsBook` sets it `true` on genuinely 
    new rows only (matched/existing rows are untouched); `searchLocalBooks` 
    (`lib/db/books.ts`) filters `is_draft = false`; `commitListBooks` 
    clears it back to `false` on Save, same pass as the `user_books` 
    backfill above. Migration grants column-scoped UPDATE on `is_draft` 
    (same pattern as `categories`/`thumbnail_url`/`description` before it) 
    plus a new DELETE policy scoped to `is_draft = true` rows only — a 
    confirmed book can never be deleted by an app-level action, RLS 
    enforces that regardless of application code.
  - Canceling an unsaved draft (`cancelListEdit`) already deleted the whole 
    list (cascading away its `tier_list_items`); now it also calls 
    `deleteOrphanedDraftBooks`, which deletes any of that import's still-
    `is_draft` books that nothing else references anymore (checked against 
    both `tier_list_items` and `user_books` before deleting, so a book 
    another draft also happens to reference isn't yanked out from under 
    it) — otherwise a canceled import would leave dead, unconfirmed rows in 
    the catalog forever with no way to reach them again.
- **Cleanup of test data created while diagnosing the above**: 12 rows from 
  earlier test CSV imports (explicit markers like "DNF Test Book"/"Bad ISBN 
  Test Book," plus the two already flagged in this file as fake test data — 
  "The Way of Kings," "Some Unrated Book" — and a handful more from a mixed 
  test run) were sitting in the live `books` catalog, pre-dating the 
  `is_draft` column so the new delete policy couldn't reach them. One-time 
  migration `supabase/migrations/0023_delete_test_goodreads_import_books.sql` 
  deletes them by exact `google_volume_id` (not title, so it can't catch a 
  real book) — `books.id` cascades to both `user_books` and 
  `tier_list_items`, so the single delete statement is enough on its own. 
  **Run, user confirmed successful** — verified after via a direct query: 
  `is_draft` column present, 0 CSV-sourced rows remaining in the catalog.
- Matches book-search's established "add to list" convention for 
  `tier_list_items` specifically (library commitment is now deferred, see 
  above): each imported book is upserted into the current list's 
  `tier_list_items` — same as `addToUnrankedAndStay` already does for 
  Search Books.
- List page shows an inline `Imported N books from Goodreads` message after 
  redirect (`?imported=N&importFailed=M` query params, read by 
  `lists/[id]/page.tsx`'s owner view).
- Verified live end-to-end twice: a 3-row sample CSV (5★, 4★, unrated-but-
  shelved-to-read) imported correctly with the right tiers before the 
  read-only filter existed; after adding the filter, a second sample with one 
  `read` row and one each of `currently-reading`/`to-read` correctly imported 
  only the one `read` row (`?imported=1`).
- **Round 2 of real-import bugs, found and fixed against the user's actual 
  `goodreads_library_export.csv` (19 read + 2 DNF) — all now verified fixed 
  live, full library imported correctly end-to-end**:
  - **DNF detection matched the wrong shelf name.** The original `isDnf` 
    only checked for the substring `"dnf"`, but the user's export uses 
    Goodreads' own `did-not-finish` Exclusive Shelf value, not a custom 
    `dnf` tag — so both DNF rows were silently dropped from the import 
    entirely (not misfiled, just never included at all), which is what 
    "18 books, none in F tier" actually was. Every other row's tier 
    placement was independently re-verified correct against the user's 
    real My Rating values at the time — the S/A/B/C mapping itself was 
    never broken. Fixed: `isDnf()` (`goodreads-csv.ts`) now checks both 
    `"dnf"` and `"did-not-finish"`, in either the shelf or bookshelves 
    column.
  - **The ISBN-based cover fix from the previous round was itself 
    unreliable.** Re-tested live: the exact same ISBN flipped between 
    "has a cover" (200) and "doesn't" (404 under `?default=false`) across 
    two checks minutes apart — Open Library's default-image-suppression 
    flag turned out not to be a trustworthy signal in either direction, 
    and several of the user's real books had no ISBN in the export at all 
    (nothing for an ISBN-only strategy to work with regardless). Replaced 
    with a three-step `resolveCoverUrl` (`import/goodreads/actions.ts`): 
    (1) if there's an ISBN, ask Open Library's edition endpoint directly 
    (`openlibrary.org/isbn/{isbn}.json` → `covers[0]`) — an exact key 
    lookup, no relevance ranking involved; (2) otherwise (or if that finds 
    nothing), a title+author text search, with the title truncated at the 
    first colon first — confirmed live that a long marketing subtitle 
    (e.g. "Atomic Habits: An Easy & Proven Way to...") drags Open 
    Library's relevance ranking down badly enough to surface unrelated 
    "Summary of..."/study-guide editions with no cover ahead of the real 
    book, and the plain "Atomic Habits" query finds it immediately; 
    (3) new shared fallback inside `getOpenLibraryData` itself 
    (`open-library.ts`) — if the combined title+author query returns 
    nothing, retry with the title alone, since some author-name formats 
    (confirmed live: unspaced initials like "M.L. Wang") can zero out an 
    otherwise-findable combined query. Step 3 lives in the shared 
    function, so it also improves the regular Search Books cover-matching 
    path, not just CSV import. New `fetchCoverUrlByIsbn` export in 
    `open-library.ts` backs step 1.
  - **Import was fully sequential — one row at a time, each fully awaited 
    before the next started** — flagged by the user as a real timeout risk 
    for a 50-book library, since several rows needing the Open Library 
    search fallback in sequence could add up to real time against a 
    serverless function's execution limit. Restructured into three phases 
    (`importGoodreadsCsv`): (1) match every row against the existing 
    catalog — kept sequential on purpose, DB-only so it's fast regardless, 
    and has to stay ordered or two rows for the same not-yet-created book 
    could both see "doesn't exist yet" at once and each create a 
    duplicate (new `dedupKey`/`findExistingBookId` split out from the old 
    combined `findOrCreateGoodreadsBook`, which no longer exists as one 
    function); (2) create genuinely new books — the actual slow part 
    (Open Library calls), now run 6 at a time via a small 
    `mapWithConcurrency` pool instead of one at a time; (3) place every 
    resolved book on the list — also 6 at a time, independent per row. Net 
    effect: a run where most books need a real Open Library lookup should 
    take roughly 1/6th the wall-clock time of the old sequential version.
  - All three fixes verified together against the user's real 20-row 
    export: correct tier counts (S=5/A=6/B=4/C=3/D=0/F=2, matching their 
    actual ratings and both DNF books), and — after the colon-strip and 
    title-only-retry fixes — every single book resolved a real cover, 
    including the two hardest cases (no ISBN in the export at all, author 
    name format that broke the combined search query). User confirmed 
    "the import worked!" after this round.

**AI photo import** ✅ done — the "Import with AI" option in `ImportDrawer` 
(previously a disabled "Coming soon" placeholder, explicitly sequenced by the 
user to come after Goodreads import above) is now fully built and live, not a 
placeholder. Own page, `/lists/[id]/import/ai` (same "action-bar button → own 
page" convention as Goodreads/Search Books/Add from Library), with 
`AiPhotoImportForm` (`src/components/tier-list/ai-photo-import-form.tsx`) and 
server actions in `lists/[id]/import/ai/actions.ts`.
- Uses Gemini (`identifyBooksInImage`, `src/lib/gemini.ts`) as the vision-model 
  integration flagged as needed in the original Ideas Backlog note — reads a 
  photo of a book cover, spine, or full shelf and returns guessed title/author 
  text per book. Vision output is text only, never real metadata/cover art, so 
  every guess is matched against `searchBooks` afterward — `isTitleMatch` 
  requires the search result's own title to actually contain (or be contained 
  by) the guessed title before accepting it, rather than blindly trusting 
  `searchBooks`'s top-ranked hit (confirmed live this was pulling wrong 
  covers/foreign-language editions without the check).
- Both phases (identify's per-guess search match, and confirm's per-selection 
  add) run bounded-concurrent (6 at a time via `mapWithConcurrency`) rather 
  than sequential — same reasoning as Goodreads import, since a full shelf 
  photo can identify up to ~50 books at once.
- Two-step review flow: `identifyBooksFromPhoto` returns candidates to the 
  client for review (not a redirect-on-submit), user unchecks any misreads, 
  then `confirmAiBooks` adds only the selected ones. Mirrors Goodreads' 
  `is_draft` treatment — `findOrCreateBook(..., { isDraft: true })`, so an 
  unverified photo-identified book doesn't hit the shared catalog/library for 
  real until the list itself is saved.
- Large photos (>8MB) are downscaled client-side before upload (max 4096px, 
  0.92 JPEG quality) — tuned live: too aggressive a downscale measurably hurt 
  identification count on a packed 64-book shelf photo (distant spine text 
  needs the detail), so this only compresses the rare oversized photo rather 
  than resizing on principle.
- Open Library work-level matches can carry the wrong (non-English) edition's 
  cover even when the title matched correctly (confirmed live on "Red Rising" — 
  correct title, Spanish-edition cover art) — fixed with 
  `fetchEnglishEditionCoverUrl`, only invoked for matches with a `/works/...` 
  id shape (local-catalog and synthetic-id matches already have a resolved or 
  nonexistent cover, so this doesn't apply to them).
- Confirming does NOT redirect away from the page — someone scanning a whole 
  library series-by-series or shelf-by-shelf needs to take several photos in a 
  row; the form resets back to its own upload step after each successful add, 
  and the existing `TopNav` back button is how they leave once actually done.
- **This was previously undocumented** — built in a session that ended before 
  CLAUDE.md could be updated; this entry (and the corresponding Ideas Backlog 
  removal below) is that catch-up.
- **Camera capture** ✅ done — the photo input only offered a generic file/
  gallery picker on mobile, no direct way to take a photo. Added 
  `capture="environment"` to the input in `AiPhotoImportForm` (opens the rear 
  camera directly on mobile; no-op on desktop, which ignores the attribute). 
  User confirmed live on their phone: camera opens correctly.

**Sprint 7 — Import & Search Polish** ✅ COMPLETE (started 2026-07-13, finished 
2026-07-11 — see Sprint Rule). Scope: Goodreads CSV import, search filters/history. 
The *search* half was already effectively done before Sprint 7 formally started — 
see the "Post-Sprint-6 bug fixes, round 3" entry further down in the Roadmap 
section (Open Library switch, local-cache search, rating/series ranking) — and 
Goodreads CSV import (above) is now done and verified live end-to-end. The entries 
immediately below this paragraph are the backlog of ad-hoc To Do items worked 
before Sprint 7 was formally started (Library View, book detail view, TopNav, 
etc.) — kept as historical record, not part of Sprint 7 itself.

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
  ✅ COMPLETE as of 2026-07-11 — the *search* half of that scope got done 
  incidentally in the "Post-Sprint-6 bug fixes, round 3" section below (Open 
  Library switch, local-cache search, rating/series ranking), similar to how 
  Sprint 6 finished incidentally; Goodreads CSV import (see "Current sprint" 
  above) was the real remaining work and is now done and verified live.

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

**Light mode preview toggle** ✅ done, then ❌ removed — temporary, dev-only. The 
`:root` block in `globals.css` has always had complete light-theme values, but 
`layout.tsx` hardcodes `dark` on `<html>` with no way to switch — so light mode 
has never actually been visible despite being "supported" per the Design 
rules. `ThemeToggleButton` toggled the `dark` class on 
`document.documentElement` directly (no persistence, no system-preference 
detection) — placed on `/profile` just above Log out. Removed later the same 
day: since the toggle was a raw DOM classList mutation rather than React 
state, and Next.js's App Router preserves the root `<html>` element across 
client-side navigation, tapping it once and then navigating via the bottom 
nav left the *entire app* stuck in light mode indefinitely (only a hard 
refresh reset it, since SSR always emits `dark` fresh) — user reported this 
as "why do the colors keep randomly changing," which is exactly what that 
looks like from the outside with no visible indicator of which mode you're 
in. Deleted `theme-toggle-button.tsx` and its one usage entirely rather than 
trying to fix the persistence — it had already served its one-time purpose 
(letting the user actually see light mode once) and a proper toggle (if ever 
wanted) would need real state, not a bare classList flip.

**Add from Library restyled to match the Library tab** ✅ done — 
`/lists/[id]/library` (Create List's "Add from Library" picker) previously had 
its own bespoke UI: a 2/3-column grid with title text and a per-book "Add" 
button. Rebuilt as `AddFromLibrarySection` 
(`src/components/add-from-library-section.tsx`) to match `LibrarySection`'s look 
(covers-only 5-col grid, Sort menu, Select mode) almost exactly, but Select mode 
has *two* bulk actions instead of one, per the user's spec:
- **Delete (N)** (destructive) — removes the selected books from the user's 
  actual library (reuses `removeBooksFromLibrary` from `profile/actions.ts` 
  directly, since it's already generic/not list-specific), gated behind a 
  `window.confirm()` warning that it deletes from their library entirely, not 
  just this list (same `window.confirm` pattern already used by 
  `DeleteListButton`). Its `revalidatePath` only covers `/profile`, so this 
  screen also calls `router.refresh()` after, to pick up the change locally.
- **Add (N)** (primary) — adds the selected books to this list's Unranked tier 
  via a new bulk `addBooksToUnranked(tierListId, bookIds)` server action 
  (`lists/[id]/library/actions.ts`), replacing the old single-book 
  `addFromLibraryAndStay` (deleted, no longer used anywhere).
The page itself now sources its data from the same `getLibraryBooks`/
`sortLibraryBooks` (`src/lib/db/library.ts`) the profile Library tab uses, 
filtered down to books not already in this list, instead of a separate bespoke 
query — also picked up Sort (`?sort=` on this route) for free. Verified live: 
Add correctly moves books into Unranked (confirmed via the list's own edit view, 
`Unranked Books (N)` count went up), and dismissing the Delete confirm leaves 
the library untouched.

**TopNav for back-arrow pages** ✅ done — the user felt back arrows looked out 
of place with no surrounding chrome. New `TopNav` (`src/components/top-nav.tsx`) 
wraps `BackButton` in a full-width bordered bar (`-mx-6 ... border-b 
border-border`, bleeding past the page's own `px-6` the same way `FavoritesRow`'s 
cover strip does, so the border spans edge to edge like the bottom `NavBar`'s 
`border-t`). Takes an optional `title` (left-aligned next to the arrow) and a 
`center` flag (3-column grid, arrow/title/spacer, for Compare's "Compare" 
header). Rolled out to every plain back-arrow page: `lists/[id]/library`, 
`lists/[id]/search`, `profile/favorites`, `u/[username]/favorites`, both 
branches of `lists/[id]` (owner + visitor — owner's is title-less since the 
real heading follows below it), and `compare/[username]` (`center`, and this 
also switched its back arrow from a hardcoded `Link href="/compare"` to the 
same `router.back()` `BackButton` everything else uses). Deliberately NOT 
touched: `u/[username]`'s `BackButton`, which floats top-left over the cosmic 
banner — different, intentional design (matches the banner treatment from the 
earlier profile-header polish pass), not "out of place" the way a bare 
unstyled back arrow on a plain background is.

Page top padding on these (and every other) page is still each page's original 
`py-12`/`py-8` — untouched on purpose. First pass also shrank these pages' top 
padding to sit closer to the bar, but the user wanted that scoped differently: 
not a per-page tweak, but a single new site-wide top-padding value (between the 
original `py-12`/48px and that attempt's `pt-6`/24px) applied consistently 
everywhere, TopNav or not — a decision to make deliberately, not something to 
just also change while doing something else. Reverted at the time.

**Site-wide page padding** ✅ done — the follow-up to the above. User picked 
`p-4` (16px, all four sides — not just vertical) as the one new standard, "let's 
see how it looks" rather than a locked-in final decision. Applied to every 
page's outer wrapper `<div>` that previously used `px-6 py-12` or `px-6 py-8` 
(`explore`, `search`, `compare` landing + detail, `recommendations`, 
`admin/backfill-categories`, `lists/[id]` both branches, `lists/[id]/library`, 
`lists/[id]/search`, `profile/favorites`, `u/[username]/favorites`) — all now 
plain `p-4`. Also brought `/profile` and `/u/[username]` in line even though 
they don't share that exact wrapper pattern (banner + separate content-below 
div, from the earlier header-polish work): both divs' `px-6` → `px-4`, and the 
content-below-banner div's `pt-5 pb-12` → `pt-4 pb-4` to match the new 16px 
standard; the banner's own `pt-5 pb-6` was left as-is since that's tuned for 
avatar/name layout inside the banner, not page-edge padding. 
`TopNav`'s edge-bleed (`-mx-6 ... px-6`, sized to cancel exactly the old `px-6`) 
had to be updated to `-mx-4 ... px-4` to match, or its border would've 
overshot past the new narrower padding. `FavoritesRow` needed no equivalent fix 
— its own edge-bleed attempt was already superseded earlier by the `flex-1` 
fill approach (see above), so it was never coupled to the `px-6` value.

**Profile "Following" stat + list, and 3-stat-row centering fix** ✅ done — 
two related asks. First: the always-empty "Avg Match" third stat on `/profile` 
(no avg-match algorithm exists) is now "Following" — a real count 
(`follows` where `follower_id = you`), linking to a new `/profile/following` 
page. That page lists everyone you follow (avatar, display name/`@username`, 
each linking to `/u/[username]`) with an inline `FollowButton` to unfollow 
right from the list — reused as-is, no new button component needed. 
`toggleFollow` (`src/app/(app)/u/actions.ts`) previously only revalidated the 
*target* user's `/u/[username]`, which left both `/profile` (stat) and 
`/profile/following` (list) stale after unfollowing from this new page — now 
also revalidates both of those unconditionally. `/u/[username]`'s own third 
stat is UNCHANGED (still "Avg Match") — the user asked for this on "profile" 
(their own), not for a general "view anyone's following list" feature.

Second: both profile pages' 3-stat row used `justify-around`/`justify-between` 
on unequal-width items — with 3 flex children of different widths, that 
math means the *middle* item's visual center only lines up with the row's true 
center when the two side items happen to be equal width, which "Tier Lists" 
vs "Following" (or "Books Ranked") never are. Fixed by dropping the 
justify-* trick entirely: each stat is now `flex-1` with its own `items-center`, 
so all three columns are equal-width thirds and each stat centers within its 
own column — the middle one lands on the row's true center as a side effect, 
and the outer two are each centered in their own even share rather than 
crammed toward the middle or flush to the edges.

**Book detail view** ✅ done — user's spec: tapping a book cover should only 
work after you've clicked into someone else's list from Explore (not on the 
Explore feed's card previews themselves), and opens a bottom sheet at ~2/3 
screen height with the cover + a synopsis, dismissed by tapping outside it 
(back to the same list, no navigation). Built with `@base-ui/react/drawer` 
(bundled but previously unused in this repo — bottom-sheet gestures, snap 
points, and outside-press-to-dismiss all come for free), in a new 
`BookDetailDrawer` (`src/components/tier-list/book-detail-drawer.tsx`, client 
component — cover via the existing `BookCover`, then title/authors/rating/
`books.description`).
- Scoping this to "someone else's list, once you're already viewing it" 
  landed on `TierRowBar` (`src/components/tier-list/tier-row-bar.tsx`) getting 
  a new opt-in `interactive` prop, rather than making it clickable everywhere 
  it's used. `TierRowBar` is shared by two very different contexts: Explore's 
  `ExploreListCard` (a card preview where the *entire card* is already one big 
  `Link` to the list — covers must stay inert there, and don't pass the prop) 
  and `ReadOnlyTierBoard` (the actual visitor-facing list detail page, the 
  only place `interactive` is set). The owner's own interactive drag-and-drop 
  board (`SortableBookChip`/`TierBoard`) was deliberately left alone — the 
  request was specifically about *someone else's* list.
- `ReadOnlyTierBoard` used to take the same `Columns`/`Card` shape as the 
  interactive board (just `bookId`/`title`/`thumbnail`, no synopsis data) — 
  now takes a new richer `DetailedColumns`/`DetailedBook` (adds `description`, 
  `authors`, `averageRating`), defined in `read-only-board.tsx`. The 
  interactive board's own `Columns`/`Card` type (`tier-list/types.ts`) was 
  deliberately NOT touched/bloated with synopsis fields it doesn't need — 
  `lists/[id]/page.tsx` now builds both an `initialColumns` (unchanged, for 
  the owner's board) and a separate `detailedColumns` from the same already- 
  fetched `tier_list_items` query (just widened the existing `books(...)` 
  select to include `description, authors, average_rating` — no extra 
  round-trip).
- Verified live: opening the drawer on a real list shows cover/title/author/
  rating/full synopsis correctly, tapping the backdrop closes it back to the 
  exact same list (no page navigation), and confirmed 0 drawer triggers 
  render on the Explore feed itself.

**Book descriptions were all empty — root cause + fix** ✅ done — user noticed 
in the new drawer above that every book showed "No synopsis available." Root 
cause: `books.description` is a real, correct column, but nothing has 
populated it since the Open Library search switch — `openLibraryDocToVolume` 
(`src/lib/open-library.ts`) only ever mapped title/authors/date/pages/rating/
cover, never description, because Open Library's `search.json` doesn't return 
synopsis text at all; that only lives on a separate per-book "Works" endpoint 
(`openlibrary.org/works/OL...W.json`), keyed by the `key` a search result 
already gives you. Google-sourced books (pre-switch, or any future path that 
still touches Google) were never affected — `volumeInfo.description` populates 
directly.
- Fix: new `fetchOpenLibraryDescription(workKey)` in `open-library.ts` hits 
  the Works endpoint and normalizes the response (Open Library returns 
  `description` as either a plain string or `{ type, value }`). Wired into 
  `getOpenLibraryData` behind a new opt-in `{ includeDescription: true }` 
  option (default off) — added as an option rather than always-on so the 
  extra network round-trip only happens when actually needed (i.e. never for 
  a Google-sourced book that already has `fields.description`).
- New books: `findOrCreateBook` (`src/lib/db/books.ts`) now stores 
  `fields.description || openLibrary.description || null`, requesting 
  `includeDescription: !fields.description`. This needed no new DB grant — 
  it's an INSERT, covered by the existing "Authenticated users can add books" 
  policy. Verified live: searched for and added a brand-new book ("The Fifth 
  Season," not previously in the catalog), confirmed a full synopsis landed 
  in its row immediately.
- Existing books: extended the existing `/admin/backfill-categories` action 
  (`runBackfill`, `src/app/(app)/admin/backfill-categories/actions.ts`) rather 
  than building a separate one-off script — it already loops every book 
  calling `getOpenLibraryData` for genre/cover backfill, so filling in a 
  missing description in the same pass (`!book.description` → request 
  `includeDescription`, write it if returned) was a natural extension, not a 
  new page. Page copy at that route updated to describe the broader scope. 
  This path *did* need a new grant — `books` UPDATE is column-scoped (see 
  migration `0010`'s revoke + narrow re-grants, and `0011` for the same 
  pattern with `thumbnail_url`) — so added migration 
  `0019_book_description_update_grant.sql` 
  (`grant update (description) on books to authenticated;`). Verified live by 
  actually running the backfill: 74 books updated, 12 descriptions filled in 
  on existing rows.

**TopNav made borderless and compact** ✅ done — follow-up to the earlier 
`TopNav` work above. `border-b border-border` removed, along with its 
`-mx-4 ... px-4` bleed pair (which existed solely to let that border span 
full width — pointless once there's no border to bleed) and the `pb-3` 
internal bottom padding. `TopNav` itself now has no padding/border of its 
own at all; each page's existing wrapper `gap-*`/`p-4` is what spaces it from 
the content below. Since every back-arrow page already goes through this one 
shared component, this single change applies everywhere a back button 
appears with no per-page edits needed.

**Book detail drawer raised to 4/5 height; empty tier rows fixed** ✅ done — 
two quick follow-ups. `BookDetailDrawer`'s popup went `h-[67vh]` → `h-[80vh]` 
to show more synopsis text before scrolling. Separately, empty tier rows in 
`TierRowBar` (Explore feed previews, Profile Lists tab previews, visitor list 
detail) were visually shrinking relative to rows with covers — the old fix 
was a flat `min-h-10` (40px) on the row's grid container, which only 
coincidentally matched a populated row's real height (itself just whatever 
height an `aspect-[2/3]` cover works out to at that particular container's 
column width — different per context, and not actually 40px in most of 
them). A CSS grid row with zero items has nothing to size itself from, so it 
was collapsing toward that guessed fallback instead of matching. Fixed by 
dropping `min-h-10` and, when a tier has 0 books, rendering one 
`invisible aspect-[2/3]` placeholder cell instead — same sizing mechanism a 
real cover uses, so an empty row's height always matches a populated one 
exactly, in every context, with no hardcoded guess.

**Duplicate book catalog rows merged** ✅ done and run — SQL migration, not 
application code, since the actual merge needs to touch every affected user's 
`user_books`/`tier_list_items` rows, and both tables are strictly owner-scoped 
by RLS (no public-read/write policy on either, unlike `tier_lists` itself, 
which got a public-read policy for `is_public` lists back in migration 
`0004`) — an app-level admin action running under the admin's own session 
couldn't touch other users' rows at all, so this had to be a migration the 
user runs directly (same pattern as `0018`'s data-only backfill, which also 
needed to bypass RLS this way).
- Scope checked directly against the live `books` table before writing 
  anything: 86 books total, 5 duplicate groups (matched on normalized 
  `lower(trim(title))` + `lower(trim(authors[1]))` — requiring author 
  agreement, not just title, to avoid merging two unrelated books that happen 
  to share a title), all pairs, matching the exact titles CLAUDE.md already 
  called out ("Powerless," "The Fires of Vengeance") plus 3 more. Small, 
  well-understood blast radius.
- Migration `0020_merge_duplicate_books.sql` went through two failed attempts 
  before landing on a working shape, both hitting `relation "book_merge_map" 
  does not exist` — first with a `TEMP` table, then with a real one. Root 
  cause: whatever runs this SQL (Supabase's pooler, transaction mode by 
  default) apparently executes each semicolon-separated statement in full 
  isolation, so nothing created by an earlier statement — even a real, 
  committed table — was visible to a later one. Fixed by rewriting the whole 
  thing as ONE statement: multiple chained writable CTEs (a read-only 
  `dupe_map` CTE, then delete/update CTEs per table), which Postgres always 
  runs to completion against one consistent snapshot regardless of whether 
  anything later references their output. The delete/update pair on each 
  table use mirror-image `EXISTS`/`NOT EXISTS` conditions so they provably 
  never target the same row — safe as sibling CTEs with no ordering 
  dependency between them. This single-statement shape is the one actually 
  in the file now.
- Canonical pick per duplicate group: prefers a row with a description, then 
  one with a thumbnail, then oldest `created_at` — moot for this batch 
  specifically since every duplicate already had both a description and 
  thumbnail, so it actually resolved on "oldest" for all 5 pairs.
- Known, accepted edge case (documented in the migration's own comments): if 
  a user had *both* duplicate editions in their library, or both placed in 
  the *same* tier list, the duplicate's entry/tier placement is deleted 
  outright rather than merged — the canonical book's existing placement wins, 
  and whatever tier the duplicate was ranked in in that one specific case is 
  lost. Given the batch is 5 pairs, this was judged an acceptable tradeoff 
  rather than something worth a more complex conflict-resolution rule.
- Verified live after the user ran it: `books` count went 86 → 81, exactly 
  the 5 duplicate pairs. Compare/Recommendations' existing title-based 
  de-dupe was left in place (harmless — it just correctly no-ops now that 
  there's one row per title).
- This is cleanup only, not prevention — `findOrCreateBook` still matches 
  strictly on `google_volume_id` before inserting, so nothing stops a new 
  duplicate from being created the same way these were (most likely cause: 
  Open Library itself has duplicate/un-merged "work" records for some books, 
  or a book added via the old Google Books path and separately via Open 
  Library ends up with two unrelated source ids — not really an "editions" 
  thing). Adding a title+author fallback check to `findOrCreateBook` (same 
  matching heuristic the migration used) would prevent future recurrences, 
  but wasn't asked for and hasn't been built.

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

### Sprint 7 — Import & Search Polish ✅ COMPLETE
- Goodreads CSV import ✅ done (see "Current sprint" section above for full spec)
- Search filters/history ✅ done — landed incidentally in "Post-Sprint-6 bug fixes, 
  round 3" (Open Library switch, local-cache search, rating/series ranking)

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
- Data quality: duplicate book catalog rows ✅ done — see "Current sprint" below 
  for the full spec. Migration `0020` has been run; verified live (book count 
  went 86 → 81, exactly the 5 duplicate pairs found). Cleanup only — nothing 
  prevents new duplicates from being created going forward; that'd be a 
  separate change to `findOrCreateBook`'s matching logic, not yet done.
- Saved matches ✅ removed — see "Current sprint" above (no destination screen, 
  user decided to just delete the feature rather than build one).
- Bad word filter for comments/usernames — moved to Ideas Backlog (not being 
  scheduled into a sprint right now); see that section for the open questions.
- User feedback: "UI is extremely inconsistent" — user's plan (2026-07-10): not 
  a dedicated pass, addressed incrementally as they hand over specific color 
  values. Don't proactively restyle colors beyond what's given. Applied so far, 
  dark mode only (`src/app/globals.css` `.dark` block; light untouched — user: 
  "I have never looked at light mode"):
  - `--background: #030a10`, `--card: #0c1115` — reverted 2026-07-14. The two 
    values were only 9 RGB units apart, so cards stopped reading as an 
    elevated surface against the background at all ("everything's just 
    black"); the original stock defaults (`--background: oklch(0.145 0 0)`, 
    `--card: oklch(0.205 0 0)`, a 6-point lightness gap) are back in place. 
    Everything else in this list (buttons, `SegmentedTabs`) still correctly 
    reads `bg-card`, so it inherited the fix automatically — no other files 
    needed touching.
  - Re-requested later the same sprint with new values: `--background: 
    #03090f`, `--card`/`--popover: #0d1115` — same ~9-10-unit-gap problem 
    recurred ("looks just a bit flat"). Rather than reverting again (the 
    user clearly wants a much darker background than stock this time, not 
    the original defaults), widened just the gap: `--card`/`--popover` 
    bumped to `#141a21`, background left at `#03090f`. Not yet re-confirmed 
    live by the user.
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
- Book detail view ✅ done — see "Current sprint" below for the full spec.
- Site-wide page padding ✅ done — see "Current sprint" below for the full spec.