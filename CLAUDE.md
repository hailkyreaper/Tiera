# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

Actively in development. Sprints 1-8 are complete (Sprint 6 finished incidentally — 
its items were either already done in 5.5, or merged into the Sprint 5 addendum's 
Top Matches work; Sprint 7 finished 2026-07-11 — CSV import was the real remaining 
work, search polish had already landed incidentally in the Post-Sprint-6 round 3 
bug-fix pass; Sprint 8 finished 2026-07-20 — PWA setup + responsive polish, both 
done; Capacitor stayed explicitly out of scope the whole sprint, user's call). In 
practice, real feature work beyond Sprint 8's stated scope also landed alongside 
it (in-app notifications, desktop discovery panels, recommendation feedback 
tracking, a To Be Read shelf, Library custom ordering — see the "Current sprint" 
section's undocumented-work catch-up for the full list) rather than being 
deferred to a later sprint. No sprint is currently marked CURRENT — per the 
Sprint Rule, wait for Sprint 9 to be explicitly started before beginning it.

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
- **`MAX_BOOKS_PER_PHOTO` raised 50 → 150** (`src/lib/gemini.ts`) — user's own 
  request, for larger full-shelf photos. Single constant drives the Gemini 
  prompt text, the response schema's `maxItems`, and the import page's own 
  copy, so nothing else needed changing beyond two stale "50 books"/"50 
  selections" code comments in `import/ai/actions.ts`.

**Abandoning an unsaved draft via the bottom nav now deletes it** ✅ done — 
previously, tapping another bottom-nav tab (Explore/Search/Compare/Profile) 
while still in the create/edit flow (`?edit=true`, always a still-unsaved 
draft per `lists/[id]/page.tsx`'s own comment) just navigated away and left 
the draft row sitting in the database untouched — not deleted, but also 
never explicitly kept. User's call: treat that the same as Cancel (delete 
the list entirely); the explicit way to keep a draft is Publish → Save Draft.
- `lists/actions.ts`: extracted `cancelListEdit`'s delete logic into a shared 
  `discardDraftList` helper (deletes the `tier_lists` row only if still 
  `is_draft`, cleans up orphaned draft books, revalidates `/profile`) plus a 
  new non-redirecting `discardUnsavedDraft(tierListId)` for NavBar to call — 
  `cancelListEdit` itself is unchanged behavior, just now built on the shared 
  helper.
- `NavBar` derives the currently-being-edited draft's id straight from the 
  URL (`pathname` + `?edit=true`, no extra context/prop plumbing needed since 
  `edit=true` is only ever a draft). Nav `Link` clicks call 
  `event.preventDefault()` + `discardUnsavedDraft(...).then(() => 
  router.push(href))` when a draft is being edited — awaited before 
  navigating so the tab being landed on (e.g. Profile) never has a chance to 
  render the about-to-be-discarded draft. Applies to all five nav items, 
  Create included (so tapping Create again mid-draft cleans up the 
  abandoned one instead of leaving two).
- Verified live end-to-end via Playwright against the real dev server/account 
  (`scripts/draft-discard-check.mjs`, `scripts/draft-save-check.mjs`, same 
  convention as the existing `scripts/library-*-check.mjs`): tapping Profile 
  mid-draft correctly 404s the list on direct revisit and never shows it on 
  `/profile`; Publish → Save Draft still correctly keeps it (200 on revisit, 
  visible on `/profile` tagged "DRAFT"). Test drafts created during 
  verification were cleaned up afterward via Cancel.

**Sprint 8 — Mobile Packaging & Polish** ✅ COMPLETE (started 2026-07-11, 
finished 2026-07-20 — see Sprint Rule). Capacitor was explicitly out of scope 
the whole round (user's call, asked directly) — scope was PWA setup + 
responsive polish only, both done.

**PWA setup** ✅ done:
- App icons regenerated from `design/Tiera Logov2.png` (the user's updated 
  logo — purple bottom bar instead of v1's blue, matching the app's actual 
  `#6D5DF6` accent) via a one-off `sharp` script (not kept — swapping the 
  source logo again later is just re-running the same resize commands): 
  `public/icons/icon-192.png` + `icon-512.png` (used twice each in the 
  manifest, once `purpose: "any"` and once `"maskable"` — the logo's mark is 
  small and centered enough to already sit safely inside a maskable icon's 
  circular safe zone with no extra padding needed), `src/app/icon.png` (512, 
  Next's auto favicon convention) and `src/app/apple-icon.png` (180, flattened 
  onto the app's `#03090f` background since Apple touch icons don't support 
  transparency).
- `src/app/manifest.ts` (Next's App Router manifest convention — auto-emits 
  `/manifest.webmanifest` and the `<link rel="manifest">` tag, no manual 
  wiring needed): name/short_name "Tiera", `start_url: "/"` (root already 
  branches correctly for logged-in vs. logged-out, see `src/app/page.tsx`), 
  `display: "standalone"`, `background_color: "#03090f"`, 
  `theme_color: "#6D5DF6"`.
- `layout.tsx`: added `viewport.themeColor` and `metadata.appleWebApp` 
  (capable/statusBarStyle/title) — Next auto-emits the modern 
  `mobile-web-app-capable` meta tag from this, but iOS versions before 17.4 
  only honor the older apple-prefixed tag, so `metadata.other` adds 
  `apple-mobile-web-app-capable` explicitly alongside it.
- Minimal service worker (`public/sw.js`), registered by a new 
  `ServiceWorkerRegistration` client component mounted in `layout.tsx`, 
  **production-only** (`process.env.NODE_ENV !== "production"` bails out) — 
  registering it under `next dev`'s constant hot-reloading risked exactly the 
  kind of confusing stale-state bug that got the light-mode toggle reverted 
  earlier (see that entry above). Deliberately does NOT cache app JS/CSS/data 
  — this app deploys frequently, and aggressively caching build assets risks 
  silently serving a stale build after a deploy. Its only job is to satisfy 
  PWA installability (a registered SW with a fetch handler is one of the 
  criteria) and give navigations a graceful offline fallback: network-first, 
  falling back to one pre-cached static page (`src/app/offline/page.tsx`, new 
  `/offline` route, no auth/data fetching so it can render with zero network) 
  when a navigation's `fetch()` fails.
- Verified live: production build (`npm run build` + `npm run start`, since 
  dev mode intentionally skips registration), confirmed via Playwright that 
  the service worker actually reaches `active`/`controller: true` 
  (`navigator.serviceWorker.ready`), and that simulating offline 
  (`context.setOffline(true)`) and navigating correctly renders the "You're 
  offline" fallback page instead of the browser's own network-error page. 
  Manifest, icons, and both apple/standard `*-web-app-capable` meta tags 
  confirmed present in the rendered HTML.
- Responsive polish (the other half of Sprint 8's scope) — see below.

**Responsive polish** ✅ done — every item checked off below, only the 
parked/optional tier-row overflow item left unresolved (see the checklist):
- **Mobile edge-case audit** ✅ done, no bugs found. Checked real small/short 
  viewports (iPhone SE 375px, small Android 360px, a landscape-short 812×375) 
  across Explore/Search/Profile/Compare/Create List — fixed-width book covers 
  wrap correctly without squishing, the profile 3-stat row and Top Favorites 
  stay readable even at 360px, no overflow or text-wrap breakage anywhere. 
  One apparent bug (bottom nav rendering mid-page, overlapping content) 
  turned out to be a Playwright `fullPage`-screenshot artifact with 
  `position: fixed` elements, not real — confirmed via an actual 
  scroll-to-bottom capture, which cleared the nav bar correctly. No code 
  changes needed for this half.
- **Desktop layout, phase 1 (sidebar nav)** ✅ done — reference: 
  `design/Desktop.png`. Scope explicitly agreed with the user first, since 
  the mockup includes several things that don't exist yet (notifications, 
  Messages, a Recent Activity feed, profile tags, tier-row subtitles) and 
  one that directly conflicts with an earlier decision (its third profile 
  stat is "Avg Match," which CLAUDE.md already documents as replaced by 
  "Following" since no avg-match algorithm exists) — user chose "layout 
  only, existing features" over building those new subsystems now, and 
  confirmed the sidebar should replace the bottom tab bar at desktop widths 
  while mobile keeps the bottom nav unchanged.
  - Extracted `useAppNav` (`src/components/use-app-nav.ts`) out of `NavBar` — 
    both the bottom bar and the new sidebar need identical active-tab logic 
    and the discard-unsaved-draft-on-navigate behavior, so it's shared in one 
    hook rather than copy-pasted (avoids the two nav UIs silently drifting 
    apart on a future fix to either).
  - New `Sidebar` (`src/components/sidebar.tsx`, server component — fetches 
    the current user's username/display_name/avatar_url directly for the 
    bottom mini user-card) + `SidebarNav` (`src/components/sidebar-nav.tsx`, 
    client, the interactive nav links + a standout "Create List" button, 
    matching the mockup's separated-CTA treatment rather than NavBar's inline 
    circular button). Reuses only the 4 existing nav destinations (Explore/
    Search/Compare/Profile) — not the mockup's extra Home/Library/Lists/
    Activity/Messages/Settings items, none of which map to a real distinct 
    route today.
  - `NavBar` gained `lg:hidden`; `Sidebar` is `hidden lg:flex` — pure CSS 
    breakpoint swap, no conditional mounting, so there's no hydration risk. 
    `(app)/layout.tsx` restructured to a flex row (`Sidebar` + content), 
    content's `pb-16` (bottom-nav clearance) becomes `lg:pb-0` since there's 
    no bottom bar to clear at that width.
  - Verified live: screenshotted Explore/Profile/Search/Compare at both 
    1440px and the original 412px mobile width, zero console errors either 
    way, and — since "mobile must stay exactly the same" was an explicit 
    requirement — did a byte-level pixel diff of the mobile Explore capture 
    against the pre-sidebar screenshot: **0.000% difference**, confirming the 
    mobile view is untouched, not just visually similar.
  - Deliberately NOT built yet: the mockup's right-rail "Top Matches" panel — 
    left as an explicit next increment rather than folded into this same 
    pass, since it raises its own questions (which pages get it, full 
    Top-Matches data or a trimmed preview) worth its own discussion.

**Desktop layout, phase 2 (fuller sidebar item set)** ✅ done — user's 
follow-up: expand the sidebar to Explore, Search, Compare, Library, Lists, 
Profile, Settings ("Home" dropped — no distinct destination from Explore, 
user's call when asked; Settings confirmed to just link to `/profile` for 
now rather than build a new page). `SIDEBAR_ITEMS` 
(`src/components/use-app-nav.ts`) is a separate list from the mobile bar's 
`NAV_ITEMS` — Library/Lists reuse `ProfileTabs`' exact hrefs/icons 
(`BookOpen`/`List`) rather than new pages.
- **Bug found and fixed**: Lists, Profile, and Settings all resolve to the 
  identical URL (bare `/profile` — Settings has no real page yet, Lists is 
  just Profile's default tab), so a first pass had all three highlighting 
  simultaneously — user caught this live ("only the one that's clicked 
  should have a highlight"). Fixed in `SidebarNav` by tracking whichever of 
  the three was actually clicked last (client state, `AMBIGUOUS_PROFILE_
  LABELS`), falling back to "Lists" — the page's real default tab — before 
  any click or after navigating there some other way (back button, a direct 
  link elsewhere). New `isProfileTabActive(tab)` in `useAppNav` handles 
  Library/Lists' own tab-aware matching (`pathname.startsWith(href)` alone 
  can't tell them apart, since `usePathname()` never includes the query 
  string). Verified via direct navigation to every route 
  (`/profile`, `/profile?tab=library`, `/profile?tab=lists`, `/explore`, 
  `/search`, `/compare`): exactly one sidebar item highlighted every time, 
  zero duplicates.
- Also hit, purely as a testing artifact (not a real bug — user confirmed 
  manual clicks worked fine throughout): Playwright clicks on sidebar links 
  intermittently failed to navigate during verification. Root cause was 
  Next.js's own dev-mode build-activity indicator (`<nextjs-portal>`) 
  intercepting pointer events, compounded by on-demand route compilation 
  being slower than the test's wait times — confirmed by Playwright's own 
  actionability log ("subtree intercepts pointer events") and by direct-
  navigation tests working reliably every time. Not fixed (would mean 
  disabling Next's `devIndicators`, a real dev-workflow change not asked 
  for) — flagged to the user as optional, not applied.

**Desktop layout, phase 3 (right-rail Top Matches panel)** ✅ done — the 
mockup's other deferred piece. Scope agreed first: Explore only (not 
app-wide like Sidebar). Went through four iterations before landing here — 
worth reading since the lesson (crop/zoom the reference image directly 
rather than eyeballing it at full size) is the real takeaway:
1. First pass: a compact avatar/username/match%-only row, reasoning that 
   `TopMatchCard`'s richer version (genres, top-favorite covers) costs 2 
   extra per-candidate queries a narrow rail has no room for. User feedback: 
   "the current one looks weak."
2. Second pass: switched to reusing the real `TopMatchCard` as-is, widened 
   the rail `w-72` → `w-96` to fit it (that card was originally sized for 
   Compare's own `max-w-md`/448px container). User feedback: "the card is 
   not complete. its one full card" — asked for an actual screenshot 
   comparison against `design/Desktop.png`, which showed the real mockup 
   is a **plain divided list** (no per-row card background/border), each 
   row just an avatar + stacked name/@username + a match% pill top-right — 
   nowhere near as tall as `TopMatchCard`. Cropping and zooming the mockup 
   image directly (rather than eyeballing the full 1536px-wide reference) is 
   what actually revealed this.
3. Third pass: a dedicated compact row (not `TopMatchCard`) matching the 
   cropped reference almost exactly — avatar (40px) + stacked `displayName`/
   `@username` (falls back to bold `@username` alone when no display name is 
   set) + a `bg-primary/15` match% pill, rows separated by `divide-y 
   divide-border` inside one `bg-card` panel, not individually boxed. Rail 
   back down to `w-80`, `includeDetails: false` (no genres/favorites 
   rendered at this point). The mockup also shows small lettered tier-color 
   badges (S/A/B/D) under each name, which appear to vary slightly per 
   person — **deliberately not built**: it isn't backed by any real 
   computed value in the app today, and the user's call was to skip it 
   rather than invent meaning for data that doesn't exist, once asked 
   directly.
4. Final version: user noticed the top-favorite book covers were gone 
   entirely ("wait what happened to the Top favorites??") — asked back in, 
   even though the literal mockup doesn't show them in this panel. Each row 
   is now `flex-col`: the same avatar/name/match%-pill line on top, plus a 
   second line below (`pl-[52px]` to align under the name, not the avatar) 
   showing up to 3 small (40px) `BookCover`s via `includeDetails: true` 
   (back to the default). Still deliberately skips the genres text line and 
   the tier-letter badges — the goal was restoring the one specific thing 
   asked for, not reverting all the way back to `TopMatchCard`.
- `getTopMatches` (`src/lib/db/top-matches.ts`) gained `includeDetails` and 
  `limit` options rather than a separate parallel function (every candidate 
  still has to be matched to know who ranks in the top N, so `limit` only 
  slices the final sorted list — it doesn't reduce that part of the cost). 
  Fully backward-compatible, Compare's existing calls unaffected. Also added 
  `displayName` to `TopMatchPerson` (was missing entirely) — used by both 
  the new rail and `TopMatchCard` itself (Compare's own page benefits too).
- Added a "Find more matches" button (`Users` icon, `outline` variant, links 
  to `/compare`) below the list, matching the mockup — shown even when the 
  match list is empty, as a next-step prompt.
- `TopMatchesRail` (`src/components/top-matches-rail.tsx`, server 
  component): `sticky top-4`, `hidden xl:flex` (wider than Sidebar's `lg`, so 
  there's a graceful sidebar-but-no-rail middle ground between 1024–1279px). 
  Wired into `explore/page.tsx` only, restructured from a single centered 
  column into a flex row (outer cap `max-w-2xl` → `max-w-6xl`; inner content 
  kept its own `max-w-2xl mx-auto` so it still self-centers whenever the 
  rail isn't rendered, rather than going flush-left once the outer cap 
  widened).
- Verified live at every stage, across mobile/tablet/1100px/1440px/1680px, 
  zero console errors throughout. Pixel-diffed mobile against the 
  pre-change capture after each iteration (0.026% → 0.162% → 0.026% → 0.162% 
  again once favorites came back) — confirmed via visual inspection each 
  time to be live-data drift (timestamps etc.), never a real layout 
  regression. Also confirmed 
  Compare's own page (shares `TopMatchCard`/`displayName`) still renders 
  correctly on both desktop and mobile.
- "Recent Activity" (the mockup's other right-rail panel) remains explicitly 
  out of scope — real feature, not built.

**Dark mode toggle, rebuilt properly** ✅ done — user wanted to preview a 
`:root` (light theme) edit live, which needs a real way to switch themes. 
The original version of this (see "Light mode preview toggle" further down) 
was deleted after it broke navigation: a raw `classList` mutation with no 
persistence and no visible indicator, so toggling light then navigating via 
the bottom nav left the whole app stuck in light mode with no explanation 
("why do the colors keep randomly changing"). Fixed both root causes this 
time rather than repeating the same shortcut:
- `ThemeToggleButton` (`src/components/theme-toggle-button.tsx`) persists 
  the choice to `localStorage` and always shows which mode is active (sun/
  moon icon + "Light mode"/"Dark mode" label + "Tap to switch") — never 
  ambiguous which state you're in, unlike the bare-icon original.
- `layout.tsx` gained a small inline `<script>` in a real `<head>` tag, 
  running before hydration/paint: reads `localStorage`, strips the `dark` 
  class if set to `"light"`. This is what actually fixes the reload case — 
  the previous version's other failure mode was a real page reload always 
  re-running SSR, which hardcodes `dark`, silently reverting the toggle. 
  `suppressHydrationWarning` added to `<html>` (className legitimately 
  differs between server output and what the script produces).
- Placed back on `/profile`, same spot as before (above Log out).
- Verified live via Playwright: toggled light on `/profile`, navigated to 
  `/explore` via a real navigation (not just internal state) — still light, 
  zero page errors. Then a hard reload on top of that — still light, still 
  zero errors. Both are the exact two failure modes that killed the 
  original version.

**Light mode card shadow** ✅ done — follow-up, same session: user noticed 
cards blend into the background in light mode once they could actually see 
it. Root cause: light mode's `--background` (`#fafaf9`) and `--card` 
(`#ffffff`) are only 5 RGB units apart — the same category of problem dark 
mode hit earlier (see the `--background`/`--card` entries under "UI is 
extremely inconsistent" below), just never noticed since light mode had no 
way to preview it until the toggle above existed.
- New `--shadow-card` custom property (`globals.css`) rather than a flat 
  black shadow, per the user's own suggestion — a two-layer shadow tinted 
  with `color-mix(in oklch, var(--foreground) N%, transparent)`, so it's 
  theme-derived instead of a hardcoded color. Set to `none` in `.dark` — 
  dark mode's card/background gap is already sufficient, doesn't need it.
- Applied via a plain `.bg-card { box-shadow: var(--shadow-card); }` rule 
  (not threaded through the shared `Card` component specifically) — most 
  card surfaces across the app are raw `bg-card` divs, not all routed 
  through one shared component, so a selector-level rule is what actually 
  reaches all of them, matching how `bg-card`/`rounded-sm` are already 
  treated as a flat utility convention rather than a component API.
- Verified live: cropped/zoomed a light-mode screenshot to confirm the 
  shadow is actually visible along a list card's edges, and confirmed dark 
  mode's rendering is byte-identical to before (shadow correctly `none` 
  there).

**App icon updated to v4** ✅ done — logo swapped again, `design/Tiera Logo 
V4.png` (bottom bar back to blue rather than v2's purple; softer/lighter 
tier-color tones). Same regeneration process as the v1→v2 swap: a one-off 
`sharp` script re-resizing into `public/icons/icon-{192,512}.png`, 
`src/app/icon.png`, and `src/app/apple-icon.png` — confirms that pipeline is 
genuinely reusable, not just a one-time thing. Verified live via a Sidebar 
screenshot. `design/Tier LogoV3.png` also exists (an intermediate iteration, 
never used for the app icon) — kept alongside the others as historical 
design record, same as v1 after v2 replaced it.

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

**Desktop Profile redesign + Explore Recent fixes** ✅ done (2026-07-14):
- Fixed `TopBar`'s search input auto-focusing on every desktop page load 
  (and colliding with `/search`'s own input) — `BookSearchInput`/
  `BookSearchForm` gained an opt-in `autoFocus` prop, `TopBar` passes 
  `false`. Also the source of a recurring hydration-mismatch warning.
- Profile page restyled for desktop to match `design/Desktop.png`: header 
  is now one horizontal card (avatar + name + bio/location + stats aligned 
  right), container widened at `lg`/`xl`, new `RecommendationsRail` (reuses 
  `getRecommendations`) fills the right column. Kept "Following" as the 
  third stat rather than the mockup's "Avg Match" and skipped its 
  personality-tag pills (no real data for either) — intentional, matches 
  prior decisions.
- Own list cards on Profile gained a desktop-only Edit + `•••` menu 
  (`ListCardOwnerControls`, reuses the existing manage view + 
  `ListOptionsMenu`) and hide the redundant creator-avatar header row 
  (`showOwnerControls` prop on `ExploreListCard`) — scoped so Explore/
  `u/[username]` are unaffected.
- Desktop sidebar trimmed to the mobile nav's 4 destinations (Explore/
  Search/Compare/Profile) — Library is reached via Profile's own Lists/
  Library tab toggle again, same as mobile, not a separate sidebar item. 
  Removed the Lists/Profile/Settings URL-disambiguation logic in 
  `SidebarNav` that only existed for the removed items.
- Library tab: 10 covers per row on desktop (`grid-cols-5 lg:grid-cols-10`), 
  still 5 on mobile.
- Explore: dropped the "Recent" top-level tab for a Popular/Recent toggle 
  nested under "For You" (`SegmentedTabs` gained `extraParams` to carry 
  `tab=for-you` through the nested toggle's links).
- **Bug fixed**: `tier_lists.updated_at` existed since the original schema 
  but nothing ever set it, so "Recent" was really just sorting by creation 
  date forever. Migration `0024` triggers a bump whenever `tier_list_items` 
  change; `saveListFields` bumps it directly for title/description/
  visibility edits.
- **Bug fixed**: even with `updated_at` correct, Explore kept serving stale 
  results after an edit — none of the book-ranking actions revalidated 
  `/explore`. Added `revalidatePath("/explore")` to all of them 
  (`moveBookToTier`, `addBookToTier`, `removeBookFromList`, 
  `reorderTierItems`, Search Books, Add from Library, Goodreads/AI import); 
  renamed `revalidateCompare()` → `revalidateFeeds()`. Verified live: adding 
  a book moved that list straight to #1 under Recent with no delay.
- **Anti-gaming cooldown** (migration `0025`): the `updated_at` bump (both 
  the trigger and `saveListFields`'s direct write) is capped to once per 15 
  minutes per list, so scripting repeated edits can't keep a list pinned at 
  the top of Recent. Real rate-limiting/bot-detection on the mutation 
  actions themselves is a deeper fix, not done — logged to Ideas Backlog.

**This whole block below was previously undocumented** — built across a 
session that ended before CLAUDE.md could be updated (same interrupted-
session pattern as the AI photo import catch-up above); this is that 
catch-up, in commit order.

**Desktop discovery panels + in-app notifications + Compare match rework** 
✅ done (design2/ mockups: `01_Explore_Desktop.png`, `02_Search_Desktop.png`, 
`03_Top_Matches_Desktop.png`, `04_Compare_Detail_Desktop.png`):
- Desktop-only discovery rails added to Explore/Search/Compare: 
  `TrendingThisWeekRail`, `TrendingSearchesRail`, `PopularGenresRail` (all 
  new, backed by new `src/lib/db/discovery.ts` and `src/lib/db/search-
  queries.ts`), a `SearchFiltersPanel` (Genre/Rating/Published filters on 
  desktop Search), `CompareSortSelect`, and on Compare's detail page a 
  right-rail `DisagreementsRail` + `MatchRecommendationsRail` (both new, 
  replacing the inline `DisagreementsTable`, now deleted). `top-bar.tsx` 
  reworked to host a new `NotificationsBell`/`NotificationsPopover`.
- New in-app notifications (follow/comment/like) — new `notifications` 
  migration + `src/lib/db/notifications.ts`, `notifications/actions.ts`, 
  backed by DB triggers on the existing `follows`/`list_likes`/
  `list_comments` tables, surfaced via the bell dropdown on desktop and a 
  new `MobileTopBar` component on mobile.
- Real bugs found via live testing during this pass: Goodreads-imported 
  books were missing `categories`/`published_date`, silently breaking 
  Search's new filters (fixed in `lists/[id]/import/goodreads/actions.ts`); 
  "Trending This Week" was reading a table its own RLS policy made 
  invisible outside the viewer's own rows; abandoned draft lists (created 
  the instant "Create List" is tapped, before Save) now get swept after 24h 
  if never touched.
- **Compare's match/recommendation logic reworked end to end** 
  (`src/lib/db/taste-match.ts`):
  - `getMatchRecommendations`'s badge used to be `score / TIER_SCORES.S` 
    (how highly the *other person* personally rated one book) — now takes 
    the real, already-computed pair `matchPercentage` instead, so every 
    recommendation from a given person shows the actual match %, not an 
    unrelated per-book number.
  - Every summary panel and recommendation now requires an actual computed 
    match (3+ shared books) rather than running on "some overlap" — 
    previously a 1-shared-book pair could show a confident "Top Shared 
    Genre" tile and a populated disagreements panel right next to a 
    headline saying "not enough shared books yet."
  - `computeMatch` now penalizes real disagreements (2+ tier gap) 
    proportionally to how much of the shared evidence they represent, on 
    top of the plain mean-agreement score — so "18 books agreed, 2 
    disagreed" now scores meaningfully higher than "2 agreed, 2 
    disagreed," which a flat average couldn't tell apart.
  - Top Matches ranking now weighs shared-book volume, not just raw 
    percentage.
  - New `MIN_PANEL_BOOKS` (2) gates whether Both Love/Shared Dislikes 
    render as populated vs. "Nothing here yet."

**Create List tier board fixed: empty-row collapse, column count, desktop 
text sizing** ✅ done:
- The interactive board's empty-tier "Drop books here" placeholder used 
  `col-span-full`, which CSS Grid's auto-placement couldn't fit alongside 
  the tier badge already occupying column 1 — it got pushed to a second 
  row, collapsing row 1 down to just the badge's own text height. Fixed in 
  `tier-row.tsx`.
- Column count brought back in line with the read-only preview 
  (`TierRowBar`) it's supposed to match: 10 columns on desktop instead of 
  6 (which made the editable board look noticeably more "zoomed in" than 
  everywhere else a list is shown). Mobile stays at 6 via a new 
  `useIsDesktop` hook (`tier-list/use-is-desktop.ts`) — needed because the 
  grid's column count feeds a dynamically-computed inline style that can't 
  itself respond to a Tailwind breakpoint.
- Added `lg:` text-size bumps across the page (headers, labels, button 
  text) so desktop doesn't render with the same small mobile-sized type in 
  a much larger layout.

**Fixed Search Books silently adding to the wrong place; batched 
getTopMatches queries** ✅ done:
- `TopBar`'s global search box was still showing on `/lists/[id]/*` pages, 
  duplicating the list page's own "add to this list" search directly 
  above it. Its Add button bound to `addBookToLibrary` (no `tierListId`), 
  so tapping it looked identical to the list's own Add but silently added 
  the book to the library instead of the list. Fixed by adding `/lists` to 
  `NO_SEARCH_PREFIXES` in `top-bar.tsx`.
- `getTopMatches` (`src/lib/db/top-matches.ts`) now batch-fetches every 
  candidate's `tier_lists`/`tier_list_items` in 2 queries instead of up to 
  6 sequential round-trips per candidate.

**Fixed site-wide mobile horizontal overflow; Vercel build fix** ✅ done:
- `AppLayout`'s content div (sibling of the desktop `Sidebar`) was missing 
  `min-w-0` — its default `min-width: auto` refused to shrink below its 
  deepest content's natural width once the sidebar was hidden on mobile, 
  so every page rendered wider than the viewport and needed zooming out to 
  reach anything off-screen. Fixed in `(app)/layout.tsx`.
- Same class of bug, smaller scope: Compare's sort-select labels shortened 
  and its header stacked on mobile (`compare-sort-select.tsx`, 
  `compare/page.tsx`).
- Removed the mobile notification bell bar added in the previous commit, 
  per request (desktop's bell is untouched) — `mobile-top-bar.tsx`'s bell 
  usage deleted.
- Fixed the Vercel build failure from the previous push: `top-matches.ts`'s 
  `topFavorites` was declared with `let` but never reassigned, tripping 
  `prefer-const` as a lint error under Next's build-time ESLint pass.

**Restored Top Favorites row to Compare's Top Matches cards on mobile** 
✅ done — `top-match-card.tsx` had favorites hidden below `sm` (only shown 
in the desktop horizontal layout), which left mobile cards clumped into 
one tight row. Mobile now shows Top Favorites as its own full-width row 
below the name/match line, matching `comupdate.png`'s reference layout; 
desktop's existing side-by-side row is unchanged.

**Test account data expanded** — new `scripts/seed-test-profile-
details.mjs` (same convention as the existing `seed-test-profiles.mjs`/
`pad-test-profiles.mjs`, kept as a readable record of seeded test data) 
fills in display name/bio/avatar/location for all test accounts, so 
Compare/Explore show realistic-looking data instead of bare `@usernames` 
while reviewing the UI.

**Compare: recommendations now show on mobile; match badge repositioned** 
✅ done:
- `DisagreementsRail`/`MatchRecommendationsRail` previously only rendered 
  inside a desktop-only (`xl:flex`) right-rail aside, so mobile never saw 
  them at all — both now also render in the main column on 
  `compare/[username]/page.tsx`, hidden at `xl` where the rail takes over.
- Top Matches list: match badge moved to its own line below `@username` 
  (was inline next to the name), matching `comupdate.png` 
  (`top-match-card.tsx`).
- Compare detail page's You/percentage/them header row used 
  `justify-center` on 3 unequal-width children, which only centers the 
  group, not each item — same bug already fixed on Profile's 3-stat row. 
  Switched to equal `flex-1` thirds so the percentage actually sits 
  centered.

**Recommendation feedback tracking, To Be Read shelf, and Library custom 
ordering** ✅ done:
- **Genre-scoped recommendations** (`taste-match.ts`, `recommendations.ts`): 
  recommendations used to be the other person's single highest-rated book 
  regardless of topic, which could surface an unrelated genre riding on a 
  match built mostly on a different shared genre. New `getAlignedGenres` 
  scopes candidates to genres both people actually agree on (based on 
  similarly-scored shared books), falling back to unfiltered when category 
  data is too sparse to filter on.
- **Recommendation outcome tracking** (migrations `0028`–`0029`, 
  `src/lib/db/recommendation-outcomes.ts`, new admin-only `/admin/
  recommendation-outcomes` report): logs every recommendation impression 
  (match %, shared-book count, ranked counts) across all 3 surfaces 
  (Compare detail, standalone Recommendations, Profile rail), tracks 
  clicked/opened-detail-page, and auto-fills the eventual outcome (final 
  tier, when) via a DB trigger on `tier_list_items` whenever the viewer 
  ranks a recommended book — works regardless of which app path did the 
  ranking. The bucketed admin report shows match %/shared-book-count 
  against real read-rate and S/A-rate outcomes, meant to ground future 
  matching-algorithm changes in actual data instead of assumptions.
- Book detail view tracking: `RecommendationRow` now opens 
  `BookDetailDrawer` (reused from the tier-list detail view) instead of 
  just an Add button, giving a real funnel stage between "shown" and 
  "added."
- **To Be Read shelf** (migration `0029`, new `library-tab.tsx`): clicking 
  "Add" on a recommendation now sets `user_books.want_to_read` instead of 
  adding straight to the read library, surfaced as a new TBR section on 
  Profile's Library tab. Clicking a TBR cover (or dragging it into the 
  Library grid) asks for confirmation before moving it to read.
- **Library custom ordering** (migration `0030`, adds `user_books.
  position`): new "Custom Order" sort option with real drag-to-reorder, 
  same `position`-column pattern `tier_list_items` already used. TBR and 
  Library are both real dnd-kit sortable containers sharing one 
  `DndContext`, so dragging a TBR cover into Library live-shifts the other 
  covers to preview the drop position (dnd-kit's "multiple containers" 
  pattern), with a `DragOverlay` so the dragged cover renders above 
  everything instead of behind it.
- `LibrarySection` (`src/components/library-section.tsx`, documented 
  earlier in this file under "Library View screen") was replaced outright 
  by a new, larger `LibraryTab` (`src/components/library-tab.tsx`) to hold 
  the TBR shelf, custom ordering, and all the sort/select logic together — 
  any earlier reference in this file to `LibrarySection` now means 
  `LibraryTab`.

**Removed the desktop top bar search box entirely** ✅ done — it was still 
showing on `/search` (never added to `NO_SEARCH_PREFIXES`), duplicating 
that page's own dedicated search input. Removed the box outright 
(`top-bar.tsx`) rather than extending the exclusion list further — 
`/search` is already the one place for this, and the box's presence 
anywhere else only risked the same add-to-wrong-place confusion already 
fixed once on `/lists` (see above).

**Backfill and new-book description fetch fixed for books with a known 
Open Library work key** ✅ done — two related follow-ups to "Book 
descriptions were all empty" above:
- `runBackfill` (`/admin/backfill-categories/actions.ts`) always 
  re-searched Open Library by title+author, even for books whose exact 
  work id was already stored in `google_volume_id` (e.g. 
  `ol:OL25870671W`). A fresh text search can fail to surface the right 
  work for short/common titles — confirmed live: "It," "Circe," 
  "Piranesi," and 7 others all had a known work key on file but never got 
  a description via the search-based lookup, despite Open Library clearly 
  having real description text once fetched directly by key. New 
  `extractOpenLibraryWorkKey`/`fetchOpenLibraryDataByWorkKey` 
  (`open-library.ts`) fetch that work directly (one exact request, no 
  relevance ranking) when a work id is already known, falling back to the 
  existing search-based path otherwise.
- Same root cause on the create path: `findOrCreateBook` (`src/lib/db/
  books.ts`) enriched every new book via an independent title+author 
  search even though `fields.googleVolumeId` already IS the exact search 
  result the user picked. Open Library carries multiple duplicate work 
  records for many popular titles (confirmed live: several "Gone Girl" 
  results, only the first richly populated) — the independent re-search 
  had no way to know which one the user meant. Now uses the same 
  fetch-by-known-key shortcut, which should stop new sparse-description 
  duplicates from being created going forward.

**Deduped search results by real description check; added book detail 
view to Library tab** ✅ done:
- Open Library carries multiple duplicate work records for many popular 
  books (confirmed live: a "Gone Girl" search returning both a 
  fully-populated record and a bare 2022 stub with no description — the 
  stub still carried its own `ratings_average`, so a cheap ratings/cover- 
  based proxy for "which one is real" was actively wrong here). New 
  `dedupeByTitleAuthor` (`open-library.ts`) instead checks each 
  duplicate's actual description directly, but only for genuine 
  title+author collisions (rare) to keep the cost bounded. Applied at 
  `searchBooks`' final merge (`books.ts`) so it catches local-vs-live 
  duplicates too. Verified live: the "Gone Girl" search now shows one 
  entry, with genuinely different editions (Japanese translation, an 
  omnibus, a study guide) still shown separately as they should be.
- Library tab covers (and TBR) previously had no way to view a book's 
  synopsis — only Search, Recommendations, and other users' lists did. 
  Wired in the same `BookDetailDrawer`, gated so it doesn't interfere with 
  Select mode or Custom Order dragging (`library-tab.tsx`).

**Duplicate book catalog rows — prevention added; round 2 and 3 cleanup** 
✅ done and run — follow-ups to "Duplicate book catalog rows merged" 
(migration `0020`) above:
- **Round 2** (migration `0031_delete_orphaned_duplicate_books.sql`): 
  confirmed 7 real orphaned duplicates live (Red Rising saga books added 
  once via Google Books and again via this session's own test-account 
  seeding scripts under a separate Open Library work id, plus a sparse 
  "Gone Girl" duplicate from ad-hoc testing) — every one had zero real 
  references, so none were splitting anyone's match/shared-book 
  calculations, but they were dead catalog clutter. Migration deletes the 
  7 confirmed-orphaned rows (verified zero references in both 
  `user_books` and `tier_list_items` for each before writing it). 
  `findOrCreateBook` (`src/lib/db/books.ts`) now also checks a normalized 
  title+first-author match before creating a new row, closing the gap 
  going forward — this also covers Goodreads/AI-photo import, which call 
  `findOrCreateBook` directly and never went through the search-results 
  dedup fix above.
- **Round 3** (migration `0032_merge_duplicate_books_round2.sql`): found 
  while auditing the catalog for anything similar — `0020`'s normalized- 
  title+author query only caught exact string matches, missing pairs that 
  differ by author-name spacing ("J.K. Rowling" vs "J. K. Rowling" — 
  Half-Blood Prince, Sorcerer's Stone) or a title subtitle/series suffix 
  (Mistborn's 3 variants, A Court of Mist and Fury, The Sword of Kaigen). 
  Unlike round 1 (all orphaned), every row on both sides of these 5 pairs 
  had real `user_books`/`tier_list_items` references from different 
  accounts — these were actively splitting shared-book counts between 
  people who'd ranked the "same" book under different catalog rows. 
  Written as an explicit mapping (not a fuzzy query) since only 5 pairs, 
  already verified by hand; migration repoints references to one 
  canonical row per title (same description-then-thumbnail-then-oldest 
  pick as `0020`) rather than deleting outright. Verified live: the one 
  tier list that had two Mistborn variants placed in it now correctly has 
  exactly one entry, no constraint violations.

**Added book detail view to Compare's Both Love/Dislikes/Disagreements 
rows** ✅ done — found while auditing for consistency after the Library 
tab fix: `SharedBook` (backing all three of Compare's book-row panels, 
`taste-match.ts`) didn't even fetch `description`/`average_rating`, so 
the data wasn't available at all, on top of missing the tap-to-view 
wiring. Extended `getComparisonSummary`'s query for both fields and wired 
`BookDetailDrawer` into `MatchedBookRow` (Top Books You Both Love, Shared 
Dislikes) and `DisagreementsRail` (Biggest Differences) — the last 
remaining book-rendering spots inconsistent with Search, Recommendations, 
and Library, which all already supported this.

**Unified sort/filter dropdowns across Compare, Search, and Library** 
✅ done — found while auditing for UI inconsistencies: the same "pick one 
of these options" interaction used two different patterns depending on 
the page — Compare's sort and Search's Genre/Rating/Published filters 
were native `<select>` elements, while Library's Sort was a pill-button + 
Base UI Menu with a checkmark on the active option. User's call: 
standardize on Library's look everywhere. New shared `DropdownSelect` 
(`dropdown-select.tsx`) extracts that pattern into one reusable component, 
showing the current selection as the trigger label (unlike Library's 
original, which always showed the fixed word "Sort") — a pure visual 
upgrade, not a loss of information. Applied to `CompareSortSelect`, 
`SearchFiltersPanel`'s three filters, and Library's own Sort control 
(removing its now-duplicated inline Menu implementation).

**Styled Library's delete confirmation as an in-app dialog** ✅ done — 
replaced `window.confirm()` with a themed `AlertDialog`-based 
`ConfirmDialog` (new `confirm-dialog.tsx`) matching the app's dropdown 
styling, instead of a jarring native browser prompt. Applied in 
`library-tab.tsx`.

**Fixed empty-state text-size drift and awkward Explore copy** ✅ done — 
Explore, Search (books/people), and Recommendations empty states were 
missing `text-sm`, unlike every other empty state in the app. Also 
reworded Explore's "be the first to make one public" line, which read 
awkwardly.

**Unified empty-state wording onto one "No X yet." template** ✅ done — 
Library, Profile Lists, Profile Following, and Compare's Both Love/Shared 
Dislikes panels each used different phrasing ("X is empty," "You don't 
have any X yet," a generic "Nothing here yet." for two different panels). 
Converged on one consistent, impersonal template, and made Compare's two 
panels say what's actually missing instead of both showing the same 
generic line.

**Comment count label fixed to text-xs** ✅ done — `comments-section.tsx`'s 
"N Comments" header was the one outlier still at `text-sm`; every other 
uppercase small-caps label (Library tab, Add from Library, Top Match card) 
already uses `text-xs`.

**UI consistency pass (mobile/desktop)** ✅ done (2026-07-19) — user asked 
to check for UI inconsistencies across mobile and desktop, after spotting a 
button rendering outside its card on Compare's list.
- **Root cause of the reported bug**: `BookDetailDrawer`'s `Drawer.Trigger` 
  (`book-detail-drawer.tsx`) had no `min-w-0`. As a flex sibling next to 
  Compare's recommendation "Add" button or a tier badge, its default 
  `min-width: auto` refused to shrink below a long book title's untruncated 
  width, pushing the sibling past the card's edge on narrow screens 
  (confirmed live at 320px against a real long title, "The Name of the 
  Wind"). One-line fix — since `BookDetailDrawer` is shared, this also 
  silently protects every other place it's used next to a sibling (Library, 
  Search, tier rows).
- **Card treatment on Compare's mobile-inline Biggest Differences/
  Recommendations panels** — these had a `bg-card p-6` box while "Top Books 
  You Both Love"/"Shared Dislikes" right above them never did. 
  `DisagreementsRail`/`MatchRecommendationsRail` gained a `bare` prop; 
  Compare's mobile-inline instance uses it (flush with the page now, 
  matching the two sections above it), the desktop right-rail `<aside>` 
  keeps its card (consistent with every other desktop rail panel — 
  Explore's `TrendingThisWeekRail`/`TopMatchesRail`).
- **Systematic audit**: screenshotted Explore, Search, Compare (landing + 2 
  detail pages), Profile (+ Library tab, + Following), Recommendations, and 
  list-detail pages at 320/412/1440px. Found and fixed one more real drift: 
  `/recommendations`'s "View More Recommendations" button was a raw `Link` 
  with hardcoded `rounded-md bg-primary` instead of going through 
  `buttonVariants` like every other primary action — wrong radius. 
  Everything else checked out clean.
- **`CompareStatsRow` contradicting its own panels** — `sharedDislikesCount`/
  `sharedFavoritesCount` are raw counts, but "Top Books You Both Love"/
  "Shared Dislikes" required 2+ shared books (`MIN_PANEL_BOOKS`) before 
  rendering anything, so a pair with exactly 1 shared dislike saw "1" in the 
  stat tile and "No shared dislikes yet" right below it — found by the user 
  testing a real pairing (`test_reader_sixteen`). Fixed: those two panels 
  now render at 1+ (matching the stat); `MIN_PANEL_BOOKS` still gates 
  `topSharedGenre` only, since a genre tag off one book is a misleading 
  inference in a way a literal 1-book list isn't.
- **Compare detail header restructured** — the You/percentage/Them row 
  (avatars + taste-match %) went from three bare `flex-1` columns to an 
  explicit 3-column grid, through a few rounds of visual iteration per 
  direct feedback: card with `bg-card` + ring first, then border-only 
  (background dropped), then bare (border dropped too, spacing-only via the 
  grid). Along the way, fixed a second overflow bug the restructure 
  exposed: the name/username text sat inside nested `flex-col items-center` 
  wrappers with no `w-full`, so `truncate` had no constrained box to clip 
  against, and a long username (`@test_reader_twelve`) overflowed 
  symmetrically past both edges of its column — same underlying issue as 
  the `BookDetailDrawer` fix, one layer deeper, fixed by adding `w-full` to 
  the text elements themselves (`items-center` doesn't stretch children the 
  way default `flex-col` alignment does).
- **Grep-based follow-up sweep**: after the fixes above, searched the 
  codebase directly for the same two bug shapes (a flex item wrapping 
  truncated text missing `min-w-0`; a `flex-col items-center` wrapper 
  breaking the default stretch that `truncate` depends on) across every 
  other file using `truncate` or `flex-col items-center`. Nothing else was 
  broken — the two bug classes found on Compare didn't recur elsewhere.

**Responsive polish remaining checklist** (drafted 2026-07-19):
- [x] **Tablet/mid-width range (~768–1023px)** ✅ checked, no bugs found — 
  screenshotted Explore, Search, Compare (landing + detail), Profile at 
  768/834/1023px. The app gracefully keeps the same capped-width 
  (`max-w-md`, expanding to `max-w-3xl`/`max-w-4xl` only at `lg:`/1024px+) 
  mobile-style single-column layout with the bottom nav retained the whole 
  way up to the sidebar breakpoint — confirmed via direct bounding-box 
  measurement (not just eyeballing, which initially misread the Compare 
  header's actual width at 1023px). No overflow, no dead-space bugs, no 
  awkward squeeze anywhere checked.
- [x] **Light mode** — first real look at it (user's own note: "I have 
  never looked at light mode"). Confirmed working via `localStorage` 
  toggle across Explore/Search/Compare/Profile/Recommendations at mobile 
  and desktop widths — no layout bugs. But user's reaction to seeing it 
  live: "too much, blinding" — light mode was still the stock 
  near-white-`#fafaf9`-background/white-`#ffffff`-card shadcn defaults, 
  never actually tuned (only dark mode ever got real color work, see 
  "UI is extremely inconsistent" below). Fixed the specific complaint with 
  user-supplied shadow values rather than repicking background/card colors 
  themselves: `--shadow-card` (`globals.css`) replaced (was a `color-mix`-
  based two-layer shadow, now flatter user-given values), plus a new 
  `--shadow-popover` (didn't exist before — `bg-popover` had no shadow 
  rule at all) wired the same way (`--shadow-popover: none` in `.dark`, 
  matching `--shadow-card`'s existing dark-mode no-op). Verified live: 
  Explore's cards and Compare's notifications popover both show a visible, 
  soft shadow now instead of reading as flat stark white. Background/card 
  base colors themselves not touched — only the shadow, per what was 
  actually asked for.
- [x] **Very wide desktop (1920px+)** ✅ checked (2026-07-20) — measured 
  directly at 1920px and 2560px. At 1920px the `max-w-[1650px]` app-shell 
  cap (`(app)/layout.tsx`) leaves ~135px empty on each side, reads as 
  normal centered-content margin. At 2560px that grows to ~455px per 
  side, which does start to read as genuine dead space rather than 
  intentional margin. User's call when shown both: leave the cap as-is 
  (a deliberate reading-width limit, same as most content apps) rather 
  than widen it for ultrawide monitors — no code change.
- [x] **Mobile landscape (812×375)** ✅ checked (2026-07-20), no bugs 
  found — re-audited Explore, Search, Compare (landing + detail), 
  Profile (both Lists/Library tabs), `/u/[username]`. The fixed bottom 
  nav overlapping content at the top of a short viewport is expected 
  (that's what a fixed bar does); confirmed via scroll-to-bottom on 
  Explore/Profile/Compare that the `pb-16` clearance correctly reveals 
  every page's final content above the nav, nothing trapped behind it.
- [x] **Drawers/dialogs on a short viewport** ✅ checked (2026-07-20), no 
  bug — tested `BookDetailDrawer` at 812×375, 1280×600, and 1440×500. Its 
  `overflow-y-auto` correctly makes the sheet internally scrollable; at 
  the shortest height only the cover+title+author fit before needing to 
  scroll, but scrolling to the end reliably reveals the full synopsis 
  with nothing clipped or lost. No fix needed.
- [x] **Touch target sizes on mobile** ✅ checked and one fixed 
  (2026-07-20) — measured every icon-only tap target directly (not 
  eyeballed). Bottom nav tabs, Create button, and Profile's Lists/Library 
  tabs all comfortably clear 44px. `BackButton` (36×36) and the comment 
  post button (32×32) are below the ideal 44px but above the 24px WCAG AA 
  floor — left alone per user's call. The one real outlier: Compare's 
  taste-score "ⓘ" info trigger (`InfoPopover`) was only **16×16px**, 
  under any reasonable guideline. Fixed in `info-popover.tsx` — trigger 
  box grown to `size-8` (32px) with a matching `-m-2` negative margin so 
  the *visual* footprint and surrounding layout are unchanged (verified 
  via screenshot diff), only the actual clickable/hoverable area grew.
- [x] **iOS input zoom** ✅ checked and one fixed (2026-07-20) — audited 
  every `<input>`/`<select>` in the app. The shared `Input` component and 
  both custom search inputs (`book-search-input.tsx`, 
  `username-autocomplete.tsx`) were already safe (`text-base` on mobile, 
  only shrinking to `text-sm` at `md:`/desktop, where the zoom behavior 
  doesn't apply). Found one real bug: the Visibility (`Public`/`Private`) 
  native `<select>` in `edit-list-details-form.tsx` used the page's usual 
  `text-sm lg:text-base` scale — inverted from the safe pattern, meaning 
  14px on every actual phone. Fixed to a flat `text-base` (16px at all 
  widths) — a deliberate, commented exception to that page's normal type 
  scale, since this is the one control on the page a mobile user actually 
  taps into edit mode. Confirmed via computed style: `16px` on mobile 
  now, and confirmed the visual size next to its "Visibility" label still 
  reads fine (2px difference, not visually jarring).
- [ ] The parked Chrome-desktop-mobile-emulation-only tier-row overflow 
  from the Post-Sprint-6 round-3 bug-fix pass — attempted again 
  (2026-07-20) via real Chrome (the `claude-in-chrome` extension, not 
  just Playwright), specifically because the original report was from 
  Chrome DevTools' own device-emulation mode, which Playwright's plain 
  viewport resize doesn't perfectly replicate. Blocked by tooling, not 
  by the app: the extension's window-resize call reported success but 
  never actually changed `window.innerWidth` (checked directly, 3 
  attempts at different sizes, no change) — window was maximized and the 
  resize didn't take. No new evidence either way; still parked.

**Profile/Compare stuck narrow on landscape phones and portrait tablets** 
✅ done (2026-07-20) — user's own report: rotating a phone to landscape, 
Profile and Compare "don't expand like how it would in say iPad width." 
Root cause: both pages capped their outer container at `max-w-md` 
(448px) all the way up to the `lg` (1024px) breakpoint, while Explore 
(`max-w-2xl`/672px) and Search (`max-w-3xl`/768px) already scaled wider 
in that same range — so on any landscape phone or portrait tablet 
(roughly 667–1023px), those two pages visibly stayed pinned at 448px 
while the rest of the app used the available width.
- First pass misdiagnosed this as a broken Tailwind rule — a quick 
  `document.styleSheets` text search for `.max-w-md` found nothing 
  anywhere and `getComputedStyle` briefly reported `maxWidth: "none"` 
  on the live element, looking like the utility wasn't generating CSS 
  at all. Both were artifacts of a sloppy first script (the stylesheet 
  search didn't recurse into `@layer`/`@media`-nested rules, and the 
  computed-style check grabbed the wrong element via a hardcoded array 
  index). Re-verified properly with `getComputedStyle` across four 
  widths (412/812/1024/1440px) using an element found by matching its 
  actual className rather than by index — confirmed `max-w-md` was 
  applying exactly as written the whole time. The real cause was 
  purely the mismatched breakpoint value, not a build/CSS bug.
- Measured all four pages directly (667/812/932/1023px) before fixing: 
  Profile and Compare flat at 448px across the whole range; Explore 
  635–672px; Search 635–768px. Confirmed the fix target with the user 
  (matching Search's `max-w-3xl` ceiling) rather than picking a value 
  unilaterally.
- `profile/page.tsx` and `compare/page.tsx`: outer container 
  `max-w-md ... lg:max-w-3xl xl:max-w-4xl` → `max-w-3xl ... xl:max-w-4xl` 
  (the old `lg:max-w-3xl` became redundant once the base value already 
  equals it). First pass scoped to exactly these two pages, not 
  `/compare/[username]` or `/u/[username]` — not asked for at the time.
- Verified live: landscape screenshots at 812×375 for both pages now 
  fill the available width properly; mobile portrait (412px) and 
  desktop (1440px) screenshots confirmed unchanged, since the new cap 
  only binds in the previously-broken 448–768px range.
- **Follow-up same day**: user asked to check `/compare/[username]` and 
  `/u/[username]` too — same measurement approach found the identical 
  448px-flat gap on both (667–1023px). `/compare/[username]` at least 
  widened at 1440px desktop (`xl:max-w-4xl` already existed there); 
  `/u/[username]` didn't widen at *any* width, including full desktop, 
  since it has no `lg:`/`xl:` treatment at all (consistent with it never 
  having gotten a real desktop redesign, noted earlier in this file). 
  Same fix applied to both — `max-w-md` → `max-w-3xl` (kept 
  `/compare/[username]`'s existing `xl:max-w-4xl`; `/u/[username]` gets a 
  flat `max-w-3xl` with no `xl:` bump, since adding one would mean 
  designing real desktop behavior for a page that's never had any, which 
  wasn't asked for here — just closing the same landscape/tablet gap). 
  `/u/[username]`'s desktop rendering incidentally improved too (768px 
  column instead of a permanent 448px one), still just the plain 
  single-column mobile layout, not a real desktop redesign. Verified 
  live the same way: landscape fills correctly on both, mobile portrait 
  and desktop unchanged (or incidentally improved) with no regressions.

**Mobile profile header redesign** ✅ done (2026-07-20) — user's own 
complaint: "I don't like the banner. I like the desktop profile card 
rather than the mobile one." Scoped to mobile only throughout; desktop's 
existing header (gradient banner, blur orbs, `hidden lg:flex` blocks) was 
never touched — verified via byte-identical/near-identical desktop 
screenshots after every step.
- Used the newly-installed `frontend-design` plugin/skill properly this 
  time: built an actual mockup (a published Artifact, three toggleable 
  variants — Before / a plain contained "desktop-style" card / the same 
  card plus a tier-color spine) before writing any real code, after an 
  initial attempt to jump straight to code got corrected by the user 
  ("what are you doing?? I want to use the plugin"). User picked the 
  tier-spine variant from the mockup first, then iterated further live 
  against the real app past what the mockup showed.
- Final mobile header, in the order it was actually reached (each step 
  was a direct user request against the live result, not planned upfront):
  1. Contained `bg-card` panel + a left-edge spine of the six real 
     S/A/B/C/D/F tier colors (`TIER_BADGE_COLORS` from `lib/tiers.ts`) — 
     the mockup's recommended pick.
  2. User then asked to remove both the card background and the spine 
     entirely, "make it edge to edge like top favorites" — header now 
     sits directly on the page background at the same `px-4` inset as 
     every other section (no card, no border, no rounded corners, no 
     spine), reading as one continuous page rather than a boxed unit.
  3. Added a hairline `border-b` under the stats row specifically (the 
     one divider kept) once the edge-to-edge version felt like it needed 
     *something* separating stats from Top Favorites below.
  4. Restructured bio/location/joined: originally nested next to the 
     avatar in the name column; moved to sit full-width below the entire 
     avatar+name row instead (bio on its own line, then location and 
     "Joined X" sharing one line) — matches the original published 
     mockup's layout, which the first live pass had drifted from.
  5. Avatar bumped 56px → 64px (`size-14` → `size-16`), "just a bit 
     bigger."
  6. Stat numbers (Tier Lists/Books Ranked/Following) dropped `text-xl` 
     → `text-lg` on mobile — read "massive" against their labels at the 
     original size. Desktop kept `text-xl` via `lg:text-xl`.
- Once bio/location needed to render identically in two places (own 
  profile and `/u/[username]`), extracted the local `ProfileBio` function 
  out of `profile/page.tsx` into a shared `src/components/profile-bio.tsx` 
  — gained a `metaInline` prop (location + "Joined X" on one line vs. 
  stacked) so `/u/[username]` can opt in without disturbing anything else 
  using the component.
- Same redesign then applied to `/u/[username]` on request ("update the 
  /u/[username] page to match"). That page never had a desktop-specific 
  layout (no `lg:` classes at all, before or after), so the change applies 
  at every width there — confirmed live at 1440px: renders correctly 
  (Back/Follow relocated from floating-over-the-banner to a plain top row, 
  avoiding the collision a left-aligned avatar would've had with a 
  floating top-left back button), just still in the same narrow `max-w-md` 
  column desktop always rendered there, which is pre-existing and out of 
  scope for this pass. Two things checked and confirmed *not* bugs while 
  verifying that desktop render: Top Favorites correctly disappearing for 
  a test account with zero favorites, and a Playwright-only hydration 
  console warning traced to Chrome's autofill heuristics tagging a hidden 
  `name="username"` input in `FollowButton` (a plain, deterministic server 
  component untouched by this work) — not a real app bug.
- Verified throughout via Playwright screenshots (mobile 412px + desktop 
  1440px) after every step, plus `tsc --noEmit` clean each time. Desktop 
  `/profile` confirmed byte-identical or near-identical (sub-0.3% diff, 
  consistent with the live-data-timestamp drift already established as 
  harmless elsewhere in this file) at every single step.

**Explore's warm light-mode palette + serif headings taken site-wide** 
✅ done (2026-07-20) — user's own note: "we did that last night and was 
supposed to do it site wide," referring to the previous session's 
`.explore-warm`-scoped work (warm paper background, serif display font 
on the page heading, both light-mode only) which had only ever shipped 
on Explore itself.
- `globals.css`: moved the warm palette tokens (`--foreground`, 
  `--muted-foreground`, `--border`, `--shadow-card`/`--shadow-popover`, 
  `--font-display`) out of the `html:not(.dark) .explore-warm` scoped 
  rule and into the base `:root` light theme, then deleted the 
  now-redundant scoped block entirely. Explore's page wrapper no longer 
  needs (or has) the `explore-warm` class.
- Applied `font-display` to the other primary, app-authored page 
  headings — Search ("Search"), Compare landing ("Top Matches"), 
  Recommendations ("Recommendations") — following the exact rule already 
  established when the serif treatment was tried on Explore's own list 
  card titles and reverted: static, app-authored titles get serif; 
  user-generated text (list titles, usernames, book titles) never does. 
  `TopNav`'s small breadcrumb-style titles (e.g. "Compare" on the 
  Compare detail page) were deliberately left plain too — different UI 
  role (a compact nav bar paired with a back button, not a page hero), 
  not one of the primary headings this pass targeted.
- Dark mode is completely unaffected — `--font-display` is only ever 
  defined in the light theme, `.dark` keeps its own separate token 
  values untouched. Confirmed via a dark-mode Explore screenshot showing 
  zero visual change.
- Verified live across Explore, Search, Compare (landing, both All/
  Friends tabs, and the `/compare/[username]` detail page), 
  Recommendations, Profile, and `/u/[username]` — mobile and desktop, 
  full-page scrolls included. Two non-issues ruled out along the way: a 
  Compare-detail pairing correctly showing an empty right-rail when it 
  has 0 disagreements/no recommendations (data-dependent, not a bug), 
  and the same Chrome-autofill hydration console warning from the 
  `/u/[username]` work above recurring on other pages with a 
  `FollowButton` — confirmed non-deterministic (reproduces on some runs, 
  not others, same page, same code) and unrelated to any of this work.
- **Follow-up same session**: user liked the extended palette except the 
  background itself — `--background` reverted from the warm `#f5f3ed` 
  back to a near-white `#fafafa` (the original pre-warm-palette value 
  was `#fafaf9`; user asked for `#fafafa` specifically). Every other 
  warm-palette token (`--foreground`, `--border`, `--shadow-card`, 
  `--font-display`) stays as shipped above. Verified live: cards still 
  read as elevated white panels against the new neutral background, 
  serif headings/warm ink/borders all intact.

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

### Sprint 8 — Mobile Packaging & Polish ✅ COMPLETE
- PWA setup ✅ done (see "Current sprint" section above for full spec)
- Capacitor app wrap (optional) — explicitly skipped for this sprint, user's 
  call when asked directly
- Responsive polish ✅ done (see "Current sprint" section above)

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
- Real rate-limiting / bot-pattern detection on the tier-list mutation actions 
  (moveBookToTier, addBookToTier, etc.), not just the blunt updated_at cooldown 
  added 2026-07-14 (migration 0025 + lists/actions.ts `UPDATED_AT_COOLDOWN_MS`) 
  to stop scripted edits from gaming Explore's Recent sort. The cooldown only 
  caps how often the *ranking benefit* can refresh — it can't tell "a few 
  legitimate edits" from "a script hammering the endpoint," and does nothing to 
  protect the DB itself from abuse. Not started; needs a decision on approach 
  (e.g. a request-count table + short window, or an existing rate-limit 
  service/library).

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

## Session Tooling Rule
Playwright is already set up and verified working (`scripts/*.mjs`, saved 
login session at `scripts/.auth/state.json`) — don't reinstall or reconfigure 
it, just reuse it. The test account's password is never stored in this repo 
(see "Never hardcode secrets" above) — if a fresh login is ever needed, look 
for it in prior chat/session history instead of asking the user to repeat it.