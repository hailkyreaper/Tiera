import { createClient } from "@supabase/supabase-js";

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

// Every addition below is deliberately NOT one of @bookgood's 15 ranked
// titles (Golden Son, Ring shout, The Sword of Kaigen: A Theonite War
// Story, One Dark Window, Two Twisted Crowns, The Poppy War, Children of
// Blood and Bone, Morning Star, The Rage of Dragons, Iron Gold, The Fires
// of Vengeance, Yumi and the Nightmare Painter, Blood Over Bright Haven,
// The Dragon Republic, Red Rising) — so padding these lists up to a
// realistic 15-20 books doesn't shift any of the match percentages already
// engineered in seed-test-profiles.mjs.
const additions = [
  {
    username: "test_reader_eight",
    listTitle: "Sci-Fi Epics",
    books: [["Dark Age", "S"], ["Dune", "A"]],
  },
  {
    username: "test_reader_eight",
    listTitle: "Fantasy Favorites",
    books: [["Throne of Glass", "A"], ["Crown of Midnight", "B"], ["Babel", "S"]],
  },
  {
    username: "test_reader_nine",
    listTitle: "My Ratings",
    books: [
      ["Dune", "B"],
      ["Hyperion", "C"],
      ["Atomic Habits", "A"],
      ["The Silent Patient", "D"],
    ],
  },
  {
    username: "test_reader_ten",
    listTitle: "Fantasy Picks",
    books: [
      ["Throne of Glass", "S"],
      ["Crown of Midnight", "A"],
      ["Empire of Storms", "B"],
      ["Kingdom of Ash", "A"],
      ["Queen of Shadows", "B"],
      ["The Name of the Wind", "S"],
    ],
  },
  {
    username: "test_reader_eleven",
    listTitle: "Currently Reading Fantasy",
    books: [
      ["Nevernight", "B"],
      ["Godsgrave", "A"],
      ["Darkdawn", "S"],
      ["Jade City", "B"],
      ["The Blade Itself", "A"],
      ["Circe", "A"],
      ["Piranesi", "S"],
    ],
  },
  {
    username: "test_reader_eleven",
    listTitle: "Horror Favorites",
    books: [["Beautiful Ugly", "C"]],
  },
  {
    username: "test_reader_twelve",
    listTitle: "Sci-Fi Only",
    books: [
      ["Dark Age", "A"],
      ["The Giver", "B"],
      ["Divergent Movie Tie-in Edition", "B"],
      ["The Fifth Season", "S"],
      ["Atomic Habits", "C"],
      ["Gone Girl", "A"],
      ["The Silent Patient", "B"],
      ["The Picture of Dorian Gray", "C"],
      ["It", "B"],
      ["Beautiful Ugly", "D"],
      ["Piranesi", "A"],
    ],
  },
  {
    username: "test_reader_thirteen",
    listTitle: "A Little Bit of Everything",
    books: [
      ["Hyperion", "A"],
      ["Dune", "B"],
      ["Project Hail Mary", "S"],
      ["The Kingmaker", "B"],
      ["Beautiful Ugly", "C"],
      ["Godsgrave", "A"],
      ["Nevernight", "B"],
      ["Circe", "D"],
    ],
  },
  {
    username: "test_reader_fourteen",
    listTitle: "My Fantasy Rankings",
    books: [
      ["Nevernight", "A"],
      ["Godsgrave", "S"],
      ["Darkdawn", "B"],
      ["Jade City", "A"],
      ["The Blade Itself", "B"],
      ["Throne of Glass", "S"],
      ["Crown of Midnight", "A"],
      ["Mistborn", "B"],
    ],
  },
  {
    username: "test_reader_fifteen",
    listTitle: "Books I've Ranked",
    books: [
      ["Piranesi", "S"],
      ["Circe", "A"],
      ["Godsgrave", "B"],
      ["Darkdawn", "A"],
      ["Kingdom of the Wicked", "B"],
      ["Kingdom of the Cursed", "A"],
      ["Fearless", "S"],
      ["The Blade Itself", "B"],
      ["Jade City", "A"],
    ],
  },
];

async function pad() {
  for (const { username, listTitle, books: entries } of additions) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username)
      .single();

    const { data: list } = await supabase
      .from("tier_lists")
      .select("id")
      .eq("user_id", profile.id)
      .eq("title", listTitle)
      .single();

    const { count: existingCount } = await supabase
      .from("tier_list_items")
      .select("id", { count: "exact", head: true })
      .eq("tier_list_id", list.id);

    const rows = entries.map(([title, tier], index) => ({
      tier_list_id: list.id,
      book_id: id(title),
      tier,
      position: (existingCount ?? 0) + index,
    }));

    const { error } = await supabase.from("tier_list_items").insert(rows);
    if (error) {
      console.error(`${username} / ${listTitle}: ${error.message}`);
    } else {
      console.log(`${username} / ${listTitle}: +${rows.length} books`);
    }
  }
  console.log("\nDone.");
}

await pad();
