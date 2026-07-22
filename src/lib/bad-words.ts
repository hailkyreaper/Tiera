// Hardcoded wordlist, checked against usernames at onboarding (the only
// place a username is ever set — no rename flow exists elsewhere in the
// app). Per the user's own tradeoff call: free and instant, no external
// dependency, but bypassable by a determined user with obfuscation this
// normalization doesn't happen to catch. Not applied to comments (out of
// scope for now — see Ideas Backlog in CLAUDE.md if that gets pulled in
// later).
const BLOCKED_TERMS = [
  "fuck",
  "shit",
  "bitch",
  "cunt",
  "asshole",
  "bastard",
  "dick",
  "pussy",
  "whore",
  "slut",
  "faggot",
  "fag",
  "retard",
  "nigger",
  "nigga",
  "spic",
  "chink",
  "kike",
  "tranny",
  "rape",
  "molest",
  "pedo",
  "nazi",
  "hitler",
  "porn",
  "penis",
  "vagina",
  "cock",
  "cocksucker",
  "motherfucker",
];

// Usernames are already constrained to [A-Za-z0-9_] (see USERNAME_PATTERN),
// so the only obfuscation surface within that charset is leetspeak
// substitution and underscore-as-separator — this undoes both before
// matching, rather than a plain case-insensitive substring check that a
// trivial "b_a_d" or "b4d" would sail through.
const LEET_SUBSTITUTIONS: Record<string, string> = {
  "0": "o",
  "1": "i",
  "3": "e",
  "4": "a",
  "5": "s",
  "7": "t",
  "8": "b",
};

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/_/g, "")
    .replace(/[0134578]/g, (char) => LEET_SUBSTITUTIONS[char] ?? char);
}

export function containsBadWord(value: string): boolean {
  const normalized = normalize(value);
  return BLOCKED_TERMS.some((term) => normalized.includes(term));
}
