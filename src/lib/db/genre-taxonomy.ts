export type GenreMapping = {
  parent: string;
  subgenre: string | null;
};

export type TagResolution =
  | { type: "mapped"; mappings: GenreMapping[] }
  | { type: "discard" }
  | { type: "unmapped" };

// The canonical taxonomy: specific subgenres, keyed by raw tag text
// (lowercased), and which parent genre each nests under.
const SUBGENRE_MAP: Record<string, GenreMapping> = {
  // Fantasy
  "epic fantasy": { parent: "Fantasy", subgenre: "Epic Fantasy" },
  "high fantasy": { parent: "Fantasy", subgenre: "High Fantasy" },
  "dark fantasy": { parent: "Fantasy", subgenre: "Dark Fantasy" },
  "urban fantasy": { parent: "Fantasy", subgenre: "Urban Fantasy" },
  // Closest match: gaslamp = Victorian-set urban fantasy.
  "gaslamp fantasy": { parent: "Fantasy", subgenre: "Urban Fantasy" },
  "sword & sorcery": { parent: "Fantasy", subgenre: "Sword & Sorcery" },
  "sword and sorcery": { parent: "Fantasy", subgenre: "Sword & Sorcery" },
  grimdark: { parent: "Fantasy", subgenre: "Grimdark" },
  "fairy tale": { parent: "Fantasy", subgenre: "Fairy Tale/Mythic" },
  "mythic fiction": { parent: "Fantasy", subgenre: "Fairy Tale/Mythic" },
  "portal fantasy": { parent: "Fantasy", subgenre: "Portal Fantasy" },
  "military fantasy": { parent: "Fantasy", subgenre: "Military Fantasy" },

  // Science Fiction
  "space opera": { parent: "Science Fiction", subgenre: "Space Opera" },
  "hard science fiction": {
    parent: "Science Fiction",
    subgenre: "Hard Sci-Fi",
  },
  "hard sci-fi": { parent: "Science Fiction", subgenre: "Hard Sci-Fi" },
  dystopian: { parent: "Science Fiction", subgenre: "Dystopian" },
  dystopia: { parent: "Science Fiction", subgenre: "Dystopian" },
  cyberpunk: { parent: "Science Fiction", subgenre: "Cyberpunk" },
  "post-apocalyptic": {
    parent: "Science Fiction",
    subgenre: "Post-Apocalyptic",
  },
  "post apocalyptic": {
    parent: "Science Fiction",
    subgenre: "Post-Apocalyptic",
  },
  "first contact": {
    parent: "Science Fiction",
    subgenre: "First Contact/Alien",
  },
  "alien invasion": {
    parent: "Science Fiction",
    subgenre: "First Contact/Alien",
  },
  "time travel": { parent: "Science Fiction", subgenre: "Time Travel" },
  "military science fiction": {
    parent: "Science Fiction",
    subgenre: "Military Sci-Fi",
  },
  "military sci-fi": {
    parent: "Science Fiction",
    subgenre: "Military Sci-Fi",
  },

  // Romance
  "contemporary romance": {
    parent: "Romance",
    subgenre: "Contemporary Romance",
  },
  "historical romance": { parent: "Romance", subgenre: "Historical Romance" },
  "paranormal romance": { parent: "Romance", subgenre: "Paranormal Romance" },
  "romantic comedy": { parent: "Romance", subgenre: "Romantic Comedy" },
  "dark romance": { parent: "Romance", subgenre: "Dark Romance" },
  romantasy: { parent: "Romance", subgenre: "Romantasy" },

  // Horror
  "gothic horror": { parent: "Horror", subgenre: "Gothic Horror" },
  gothic: { parent: "Horror", subgenre: "Gothic Horror" },
  "psychological horror": {
    parent: "Horror",
    subgenre: "Psychological Horror",
  },
  "supernatural horror": { parent: "Horror", subgenre: "Supernatural Horror" },
  slasher: { parent: "Horror", subgenre: "Slasher/Splatter" },
  splatter: { parent: "Horror", subgenre: "Slasher/Splatter" },
  "cosmic horror": { parent: "Horror", subgenre: "Cosmic Horror" },

  // Mystery & Thriller
  "cozy mystery": { parent: "Mystery & Thriller", subgenre: "Cozy Mystery" },
  "crime thriller": {
    parent: "Mystery & Thriller",
    subgenre: "Crime Thriller",
  },
  "psychological thriller": {
    parent: "Mystery & Thriller",
    subgenre: "Psychological Thriller",
  },
  "legal thriller": {
    parent: "Mystery & Thriller",
    subgenre: "Legal Thriller",
  },
  "spy fiction": { parent: "Mystery & Thriller", subgenre: "Spy/Espionage" },
  espionage: { parent: "Mystery & Thriller", subgenre: "Spy/Espionage" },
  "detective fiction": {
    parent: "Mystery & Thriller",
    subgenre: "Detective Fiction",
  },

  // Historical Fiction
  "war fiction": {
    parent: "Historical Fiction",
    subgenre: "War/Military History",
  },
  "military history": {
    parent: "Historical Fiction",
    subgenre: "War/Military History",
  },
  "period drama": { parent: "Historical Fiction", subgenre: "Period Drama" },
  "alternate history": {
    parent: "Historical Fiction",
    subgenre: "Alternate History",
  },

  // Literary Fiction
  "contemporary literary fiction": {
    parent: "Literary Fiction",
    subgenre: "Contemporary Literary",
  },
  "classic literature": {
    parent: "Literary Fiction",
    subgenre: "Classic Literature",
  },
  "coming-of-age": { parent: "Literary Fiction", subgenre: "Coming-of-Age" },
  "coming of age": { parent: "Literary Fiction", subgenre: "Coming-of-Age" },

  // Young Adult
  "ya fantasy": { parent: "Young Adult", subgenre: "YA Fantasy" },
  "ya contemporary": { parent: "Young Adult", subgenre: "YA Contemporary" },
  "ya dystopian": { parent: "Young Adult", subgenre: "YA Dystopian" },
  "ya romance": { parent: "Young Adult", subgenre: "YA Romance" },

  // Action & Adventure
  survival: { parent: "Action & Adventure", subgenre: "Survival" },
  heist: { parent: "Action & Adventure", subgenre: "Heist" },
  swashbuckler: { parent: "Action & Adventure", subgenre: "Swashbuckler" },

  // Non-Fiction
  memoir: { parent: "Non-Fiction", subgenre: "Memoir/Biography" },
  biography: { parent: "Non-Fiction", subgenre: "Memoir/Biography" },
  "self-help": { parent: "Non-Fiction", subgenre: "Self-Help" },
  history: { parent: "Non-Fiction", subgenre: "History" },
  "science & nature": { parent: "Non-Fiction", subgenre: "Science & Nature" },
  "true crime": { parent: "Non-Fiction", subgenre: "True Crime" },
};

// Bare/parent-level tags: map straight to a parent, no subgenre.
const PARENT_ONLY_MAP: Record<string, string> = {
  fantasy: "Fantasy",
  "fantasy fiction": "Fantasy",
  romance: "Romance",
  "science fiction": "Science Fiction",
  "historical fiction": "Historical Fiction",
  "literary fiction": "Literary Fiction",
  "young adult": "Young Adult",
  "young adult fiction": "Young Adult",
  "action & adventure": "Action & Adventure",
  "action and adventure": "Action & Adventure",
  "adventure fiction": "Action & Adventure",
  mystery: "Mystery & Thriller",
  thriller: "Mystery & Thriller",
  horror: "Horror",
  "fiction, horror": "Horror",
  "non-fiction": "Non-Fiction",
};

// Tags that should count toward more than one parent at once.
const MULTI_PARENT_MAP: Record<string, string[]> = {
  "science fiction & fantasy": ["Science Fiction", "Fantasy"],
  "science fiction and fantasy": ["Science Fiction", "Fantasy"],
};

// Confirmed non-genre tags — classifications or themes, not genre info.
// These are dropped before fallback keyword matching even runs.
const DISCARD_TAGS = new Set([
  "english literature",
  "american literature",
  "places",
  "children's fiction",
  "juvenile fiction",
  "magic",
  "magic, fiction",
]);

// Last resort: if a raw tag matches nothing above, check whether it
// contains one of these keywords and assign it to that parent with no
// subgenre. If nothing matches, the tag is flagged as unmapped rather
// than silently becoming a new top-level genre.
const FALLBACK_KEYWORDS: { keyword: string; parent: string }[] = [
  { keyword: "science fiction", parent: "Science Fiction" },
  { keyword: "sci-fi", parent: "Science Fiction" },
  { keyword: "fantasy", parent: "Fantasy" },
  { keyword: "romance", parent: "Romance" },
  { keyword: "horror", parent: "Horror" },
  { keyword: "mystery", parent: "Mystery & Thriller" },
  { keyword: "thriller", parent: "Mystery & Thriller" },
];

export function resolveTag(rawTag: string): TagResolution {
  const key = rawTag.trim().toLowerCase();

  if (DISCARD_TAGS.has(key)) {
    return { type: "discard" };
  }

  if (key in MULTI_PARENT_MAP) {
    return {
      type: "mapped",
      mappings: MULTI_PARENT_MAP[key].map((parent) => ({
        parent,
        subgenre: null,
      })),
    };
  }

  if (key in SUBGENRE_MAP) {
    return { type: "mapped", mappings: [SUBGENRE_MAP[key]] };
  }

  if (key in PARENT_ONLY_MAP) {
    return {
      type: "mapped",
      mappings: [{ parent: PARENT_ONLY_MAP[key], subgenre: null }],
    };
  }

  const fallback = FALLBACK_KEYWORDS.find((entry) =>
    key.includes(entry.keyword),
  );
  if (fallback) {
    return {
      type: "mapped",
      mappings: [{ parent: fallback.parent, subgenre: null }],
    };
  }

  return { type: "unmapped" };
}
