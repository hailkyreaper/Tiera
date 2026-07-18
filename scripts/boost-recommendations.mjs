import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const { data: books, error: booksErr } = await supabase
  .from("books")
  .select("id, title")
  .eq("is_draft", false);
if (booksErr) throw booksErr;
const byTitle = new Map(books.map((b) => [b.title, b.id]));
function id(title) {
  const bookId = byTitle.get(title);
  if (!bookId) throw new Error(`Book not found: "${title}"`);
  return bookId;
}

// Goal: only test_reader_eight currently clears both recommendation floors
// (MIN_RECOMMENDATION_MATCH_PERCENTAGE=65, MIN_RECOMMENDATION_SHARED_BOOKS=8
// in taste-match.ts). Every addition below to existing accounts is a CLOSE
// (0-1 tier gap) shared book pulled from @bookgood's remaining unused
// titles — this can only ever raise or hold their match %, never introduce
// a new disagreement, while pushing shared count toward/past 8.

async function getUserId(username) {
  const { data } = await supabase.from("profiles").select("id").eq("username", username).single();
  return data.id;
}

async function getListId(userId, title) {
  const { data } = await supabase.from("tier_lists").select("id").eq("user_id", userId).eq("title", title).single();
  return data.id;
}

async function addBooks(userId, listTitle, entries) {
  const listId = await getListId(userId, listTitle);
  const { count } = await supabase
    .from("tier_list_items")
    .select("id", { count: "exact", head: true })
    .eq("tier_list_id", listId);
  const rows = entries.map(([title, tier], i) => ({
    tier_list_id: listId,
    book_id: id(title),
    tier,
    position: (count ?? 0) + i,
  }));
  const { error } = await supabase.from("tier_list_items").insert(rows);
  if (error) throw new Error(`${listTitle}: ${error.message}`);
  console.log(`Boosted ${listTitle}: +${rows.length} books`);
}

async function createFakeUser(username) {
  const email = `${username}@fake.tiera.test`;
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: crypto.randomUUID(),
    email_confirm: true,
  });
  if (error) throw new Error(`createUser(${username}): ${error.message}`);
  const { error: profileErr } = await supabase.from("profiles").insert({ id: data.user.id, username });
  if (profileErr) throw new Error(`profile(${username}): ${profileErr.message}`);
  return data.user.id;
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
  const rows = entries.map(([title, tier], index) => ({ tier_list_id: tierListId, book_id: id(title), tier, position: index }));
  const { error } = await supabase.from("tier_list_items").insert(rows);
  if (error) throw new Error(`items(${tierListId}): ${error.message}`);
}

async function main() {
  // --- Boost existing thin-shared-count accounts over the rec floors ---
  const ten = await getUserId("test_reader_ten");
  await addBooks(ten, "Fantasy Picks", [
    ["Ring shout", "B"],               // mine B, diff0
    ["Two Twisted Crowns", "A"],       // mine B, diff1
    ["Iron Gold", "C"],                // mine B, diff1
    ["Yumi and the Nightmare Painter", "B"], // mine A, diff1
  ]);

  const thirteen = await getUserId("test_reader_thirteen");
  await addBooks(thirteen, "A Little Bit of Everything", [
    ["Golden Son", "A"],                                    // mine S, diff1
    ["The Sword of Kaigen: A Theonite War Story", "S"],      // mine S, diff0
    ["The Fires of Vengeance", "A"],                         // mine A, diff0
    ["Two Twisted Crowns", "C"],                             // mine B, diff1
    ["Morning Star", "A"],                                   // mine S, diff1
  ]);

  const eleven = await getUserId("test_reader_eleven");
  await addBooks(eleven, "Currently Reading Fantasy", [
    ["Golden Son", "S"],                                // mine S, diff0
    ["Ring shout", "B"],                                // mine B, diff0
    ["The Sword of Kaigen: A Theonite War Story", "A"], // mine S, diff1
    ["One Dark Window", "B"],                           // mine B, diff0
    ["The Fires of Vengeance", "A"],                    // mine A, diff0
    ["Two Twisted Crowns", "C"],                        // mine B, diff1
  ]);

  const fifteen = await getUserId("test_reader_fifteen");
  await addBooks(fifteen, "Books I've Ranked", [
    ["Golden Son", "S"],                                     // mine S, diff0
    ["The Sword of Kaigen: A Theonite War Story", "A"],      // mine S, diff1
    ["One Dark Window", "A"],                                // mine B, diff1
    ["The Fires of Vengeance", "A"],                         // mine A, diff0
    ["The Poppy War", "B"],                                  // mine C, diff1
  ]);

  // --- Two new profiles, deliberately: only 2 true S-S shared matches,
  // otherwise close-but-not-S agreement on ~10 shared books (clears both
  // rec floors comfortably), PLUS a large personal library of unshared
  // A/S-tier books so recommendations have real depth to draw from. ---

  const sixteen = await createFakeUser("test_reader_sixteen");
  const sixteenShared = await createList(sixteen, "Shared Favorites");
  await rankBooks(sixteenShared, [
    ["Golden Son", "S"],                             // mine S — S-S match #1
    ["Morning Star", "S"],                           // mine S — S-S match #2
    ["Red Rising", "A"],                             // mine B, diff1
    ["Iron Gold", "B"],                              // mine B, diff0
    ["The Fires of Vengeance", "A"],                 // mine A, diff0
    ["Yumi and the Nightmare Painter", "B"],         // mine A, diff1
    ["One Dark Window", "C"],                        // mine B, diff1
    ["Two Twisted Crowns", "B"],                     // mine B, diff0
    ["The Poppy War", "B"],                          // mine C, diff1
    ["Children of Blood and Bone", "C"],             // mine D, diff1
  ]);
  const sixteenLibrary = await createList(sixteen, "My Library");
  await rankBooks(sixteenLibrary, [
    ["Throne of Glass", "S"],
    ["Crown of Midnight", "S"],
    ["Empire of Storms", "A"],
    ["Queen of Shadows", "A"],
    ["Heir of Fire", "S"],
    ["Kingdom of Ash", "A"],
    ["Tower of Dawn", "B"],
    ["The Assassin's Blade", "A"],
    ["Circe", "S"],
    ["Piranesi", "A"],
    ["Babel", "S"],
    ["Godsgrave", "A"],
    ["Nevernight", "S"],
    ["Darkdawn", "A"],
    ["The Blade Itself", "B"],
    ["Jade City", "A"],
    ["Mistborn", "S"],
    ["The Final Empire", "A"],
    ["The Name of the Wind", "S"],
    ["Dune", "A"],
  ]);
  console.log("Created test_reader_sixteen (10 shared, ~90% expected, 19-book unshared library)");

  const seventeen = await createFakeUser("test_reader_17");
  const seventeenShared = await createList(seventeen, "Shared Favorites");
  await rankBooks(seventeenShared, [
    ["The Rage of Dragons", "S"],                            // mine S — S-S match #1
    ["The Sword of Kaigen: A Theonite War Story", "S"],      // mine S — S-S match #2
    ["Yumi and the Nightmare Painter", "A"],                 // mine A, diff0
    ["The Fires of Vengeance", "B"],                         // mine A, diff1
    ["Ring shout", "B"],                                     // mine B, diff0
    ["One Dark Window", "A"],                                // mine B, diff1
    ["Two Twisted Crowns", "C"],                             // mine B, diff1
    ["Iron Gold", "B"],                                      // mine B, diff0
    ["Red Rising", "A"],                                     // mine B, diff1
    ["Golden Son", "A"],                                     // mine S, diff1
  ]);
  const seventeenLibrary = await createList(seventeen, "My Library");
  await rankBooks(seventeenLibrary, [
    ["A Court of Thorns and Roses", "S"],
    ["A Court of Mist and Fury", "S"],
    ["A Court of Wings and Ruin", "A"],
    ["A Court of Silver Flames", "A"],
    ["Caraval", "S"],
    ["Legendary", "A"],
    ["Finale", "A"],
    ["Kingdom of the Wicked", "S"],
    ["Kingdom of the Cursed", "A"],
    ["Fearless", "S"],
    ["Powerful", "A"],
    ["Reckless", "A"],
    ["The Fifth Season", "S"],
    ["Hyperion", "A"],
    ["Project Hail Mary", "S"],
  ]);
  console.log("Created test_reader_17 (10 shared, ~90% expected, 15-book unshared library)");

  console.log("\nDone.");
}

await main();
