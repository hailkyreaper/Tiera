import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

// book_id lookup by title, built from the real catalog so every fake list
// references real books (required for match-logic overlap to mean anything)
const { data: books, error: booksErr } = await supabase
  .from("books")
  .select("id, title")
  .eq("is_draft", false);
if (booksErr) throw booksErr;

const byTitle = new Map(books.map((b) => [b.title, b.id]));
function id(title) {
  const bookId = byTitle.get(title);
  if (!bookId) throw new Error(`Book not found in catalog: "${title}"`);
  return bookId;
}

const { data: meProfile } = await supabase
  .from("profiles")
  .select("id")
  .eq("username", "bookgood")
  .single();
const meId = meProfile.id;

async function createFakeUser(username) {
  const email = `${username}@fake.tiera.test`;
  const password = crypto.randomUUID();

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw new Error(`createUser(${username}): ${error.message}`);

  const userId = data.user.id;

  const { error: profileErr } = await supabase
    .from("profiles")
    .insert({ id: userId, username });
  if (profileErr) throw new Error(`profile(${username}): ${profileErr.message}`);

  return userId;
}

async function createList(userId, title) {
  const { data, error } = await supabase
    .from("tier_lists")
    .insert({ user_id: userId, title, is_public: true, is_draft: false })
    .select("id")
    .single();
  if (error) throw new Error(`list(${title}): ${error.message}`);
  return data.id;
}

async function rankBooks(tierListId, entries) {
  const rows = entries.map(([title, tier], index) => ({
    tier_list_id: tierListId,
    book_id: id(title),
    tier,
    position: index,
  }));
  const { error } = await supabase.from("tier_list_items").insert(rows);
  if (error) throw new Error(`items(${tierListId}): ${error.message}`);
}

// My own (@bookgood) 15 ranked books, for reference when engineering overlap:
// S: Golden Son, Sword of Kaigen, Morning Star, The Rage of Dragons
// A: The Fires of Vengeance, Yumi and the Nightmare Painter
// B: Ring shout, One Dark Window, Two Twisted Crowns, Iron Gold, Red Rising
// C: The Poppy War
// D: Children of Blood and Bone
// F: Blood Over Bright Haven, The Dragon Republic

async function seed() {
  console.log("Seeding test profiles...\n");

  // 1. Near-identical taste (~high match): same 15 books, mostly same tier,
  // a few off-by-one so it isn't a suspicious 100%. Split across two
  // genre lists to prove list-splitting doesn't affect matching.
  const eight = await createFakeUser("test_reader_eight");
  const eightSciFi = await createList(eight, "Sci-Fi Epics");
  await rankBooks(eightSciFi, [
    ["Golden Son", "S"],
    ["Morning Star", "S"],
    ["The Rage of Dragons", "S"],
    ["Iron Gold", "C"], // off-by-one from my B
    ["Red Rising", "B"],
  ]);
  const eightFantasy = await createList(eight, "Fantasy Favorites");
  await rankBooks(eightFantasy, [
    ["The Sword of Kaigen: A Theonite War Story", "S"],
    ["One Dark Window", "B"],
    ["Two Twisted Crowns", "C"], // off-by-one from my B
    ["The Poppy War", "C"],
    ["Children of Blood and Bone", "D"],
    ["The Fires of Vengeance", "A"],
    ["Yumi and the Nightmare Painter", "S"], // off-by-one from my A
    ["Blood Over Bright Haven", "F"],
    ["The Dragon Republic", "F"],
    ["Ring shout", "B"],
  ]);
  console.log("Created test_reader_eight (near-identical taste, 2 lists)");

  // 2. Opposite taste (~very low match): same 15 books, inverted tier
  // (score' = 7 - score).
  const nine = await createFakeUser("test_reader_nine");
  const nineList = await createList(nine, "My Ratings");
  await rankBooks(nineList, [
    ["Golden Son", "F"],
    ["Morning Star", "F"],
    ["The Rage of Dragons", "F"],
    ["Iron Gold", "C"],
    ["Red Rising", "C"],
    ["The Sword of Kaigen: A Theonite War Story", "F"],
    ["One Dark Window", "C"],
    ["Two Twisted Crowns", "C"],
    ["The Poppy War", "B"],
    ["Children of Blood and Bone", "A"],
    ["The Fires of Vengeance", "D"],
    ["Yumi and the Nightmare Painter", "D"],
    ["Blood Over Bright Haven", "S"],
    ["The Dragon Republic", "S"],
    ["Ring shout", "C"],
  ]);
  console.log("Created test_reader_nine (opposite taste, 1 list)");

  // 3. Moderate/mixed match: partial overlap with real tier disagreement,
  // plus two entirely non-overlapping genre lists (self-help, thriller) to
  // prove those don't affect the match at all.
  const ten = await createFakeUser("test_reader_ten");
  const tenFantasy = await createList(ten, "Fantasy Picks");
  await rankBooks(tenFantasy, [
    ["Golden Son", "A"], // mine: S
    ["Red Rising", "B"], // mine: B (exact)
    ["The Fires of Vengeance", "B"], // mine: A
    ["The Poppy War", "A"], // mine: C
    ["Children of Blood and Bone", "B"], // mine: D
    ["One Dark Window", "D"], // mine: B
  ]);
  const tenSelfHelp = await createList(ten, "Self Help Shelf");
  await rankBooks(tenSelfHelp, [["Atomic Habits", "S"]]);
  const tenThrillers = await createList(ten, "Thriller Nights");
  await rankBooks(tenThrillers, [
    ["Gone Girl", "A"],
    ["The Silent Patient", "B"],
  ]);
  console.log("Created test_reader_ten (moderate match, 3 lists incl. self-help/thriller)");

  // 4. Another moderate/mixed candidate with a different overlap set and a
  // horror list layered in.
  const eleven = await createFakeUser("test_reader_eleven");
  const elevenFantasy = await createList(eleven, "Currently Reading Fantasy");
  await rankBooks(elevenFantasy, [
    ["Morning Star", "B"], // mine: S
    ["The Rage of Dragons", "C"], // mine: S
    ["Iron Gold", "S"], // mine: B
    ["Yumi and the Nightmare Painter", "F"], // mine: A
    ["Blood Over Bright Haven", "A"], // mine: F
  ]);
  const elevenHorror = await createList(eleven, "Horror Favorites");
  await rankBooks(elevenHorror, [
    ["It", "S"],
    ["The Picture of Dorian Gray", "B"],
  ]);
  console.log("Created test_reader_eleven (lower-moderate match, 2 lists incl. horror)");

  // 5. Below the 3-shared-book threshold — tests the "not enough shared
  // books yet" empty state.
  const twelve = await createFakeUser("test_reader_twelve");
  const twelveList = await createList(twelve, "Sci-Fi Only");
  await rankBooks(twelveList, [
    ["Dune", "S"],
    ["Hyperion", "A"],
    ["Project Hail Mary", "S"],
    ["Golden Son", "B"], // only 1 book shared with me — stays under MIN_SHARED_BOOKS
  ]);
  console.log("Created test_reader_twelve (below match threshold)");

  // 6. Genre-diverse, low-but-defined match — exercises Popular Genres /
  // search filters with non-fantasy categories, small real overlap with me.
  const thirteen = await createFakeUser("test_reader_thirteen");
  const thirteenMixed = await createList(thirteen, "A Little Bit of Everything");
  await rankBooks(thirteenMixed, [
    ["Atomic Habits", "S"],
    ["Gone Girl", "A"],
    ["The Silent Patient", "A"],
    ["It", "B"],
    ["The Picture of Dorian Gray", "C"],
    ["Red Rising", "D"], // mine: B
    ["Children of Blood and Bone", "F"], // mine: D
    ["The Poppy War", "F"], // mine: C
  ]);
  console.log("Created test_reader_thirteen (genre-diverse, low match)");

  // 7 & 8: two more mid-range accounts, purely for Explore/Compare volume
  // and Friends-tab testing (bookgood follows both below).
  const fourteen = await createFakeUser("test_reader_fourteen");
  const fourteenList = await createList(fourteen, "My Fantasy Rankings");
  await rankBooks(fourteenList, [
    ["Golden Son", "S"], // exact
    ["Morning Star", "A"], // mine: S
    ["Red Rising", "S"], // mine: B
    ["The Fires of Vengeance", "A"], // exact
    ["One Dark Window", "C"], // mine: B
    ["Babel", "S"],
    ["Circe", "A"],
  ]);
  console.log("Created test_reader_fourteen (mid-high match)");

  const fifteen = await createFakeUser("test_reader_fifteen");
  const fifteenList = await createList(fifteen, "Books I've Ranked");
  await rankBooks(fifteenList, [
    ["The Rage of Dragons", "A"], // mine: S
    ["Iron Gold", "D"], // mine: B
    ["Yumi and the Nightmare Painter", "B"], // mine: A
    ["Ring shout", "F"], // mine: B
    ["Mistborn: The Final Empire", "S"],
    ["The Name of the Wind", "S"],
  ]);
  console.log("Created test_reader_fifteen (mid match)");

  // Follow a couple of the new accounts so the Compare "Friends" tab isn't
  // empty for @bookgood.
  const { error: followErr } = await supabase.from("follows").insert([
    { follower_id: meId, following_id: fourteen },
    { follower_id: meId, following_id: fifteen },
  ]);
  if (followErr) console.error("follows error:", followErr.message);
  else console.log("bookgood now follows test_reader_fourteen and test_reader_fifteen");

  console.log("\nDone.");
}

await seed();
