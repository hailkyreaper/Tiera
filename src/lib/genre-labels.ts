// Book categories come from Open Library/Google Books as raw, uncontrolled
// strings — there was no existing shortening/normalization list anywhere in
// the codebase before this. Checked live against the real catalog: 99
// distinct category strings exist today, and most of them are Open
// Library's topical/setting subject tags ("Schools In Fiction",
// "Washington (State) -- Fiction", "Treasure Hunt (Game) -- Fiction"), not
// real genres — a length cap alone can't tell those apart from a genuine
// short genre, since some noise ("Family", "General") is already short.
//
// So this is an ALLOWLIST, not a blocklist: only categories explicitly
// mapped here count as a real genre for display. Anything unmapped —
// however short — is dropped rather than guessed at. Every value is a
// short (<= 13 char) canonical label, so multiple raw variants that mean
// the same thing ("Science Fiction", "Hard Science Fiction", "American
// Science Fiction") collapse into one consistent tag ("Sci-Fi") instead of
// each showing up as its own separate pill.
const GENRE_LABELS: Record<string, string> = {
  fantasy: "Fantasy",
  "fantasy fiction": "Fantasy",
  "american fantasy fiction": "Fantasy",
  "juvenile fantasy fiction": "Fantasy",
  "english fantasy fiction": "Fantasy",
  "military fantasy": "Fantasy",
  "gaslamp fantasy": "Fantasy",
  "fantasy romance": "Fantasy",
  "high fantasy": "High Fantasy",
  "dark fantasy": "Dark Fantasy",
  "epic fantasy": "Epic Fantasy",
  "epic fiction": "Epic Fantasy",
  "urban fantasy": "Urban Fantasy",

  "science fiction": "Sci-Fi",
  "science fiction & fantasy": "Sci-Fi",
  "american science fiction": "Sci-Fi",
  "hard science fiction": "Sci-Fi",
  "colonization science fiction": "Sci-Fi",
  "space fleet science fiction": "Sci-Fi",
  "space opera": "Space Opera",

  "children's fiction": "YA",
  "juvenile fiction": "YA",
  "children's books - young adult fiction": "YA",
  "ages 9-12 fiction": "YA",
  "young adult fiction": "YA",
  "teen fiction": "YA",
  "american young adult fiction": "YA",

  romance: "Romance",
  "romance fiction": "Romance",
  "love & romance": "Romance",
  "dark romance": "Romance",
  "paranormal romance": "Romance",

  "paranormal fiction": "Paranormal",
  "paranormal, occult & supernatural": "Paranormal",
  "supernatural fiction": "Paranormal",

  mystery: "Mystery",
  "mystery fiction": "Mystery",
  "detective and mystery fiction": "Mystery",
  "detective and mystery stories": "Mystery",
  "mystery & detective fiction": "Mystery",

  "action & adventure": "Adventure",
  adventure: "Adventure",

  horror: "Horror",
  "horror fiction": "Horror",

  gothic: "Gothic",
  "gothic fiction": "Gothic",

  "historical fiction": "Historical",

  thriller: "Thriller",
  "suspense fiction": "Thriller",

  dystopia: "Dystopian",
  "dystopian fiction": "Dystopian",

  drama: "Drama",
};

export function shortenGenre(category: string): string | null {
  return GENRE_LABELS[category.trim().toLowerCase()] ?? null;
}
