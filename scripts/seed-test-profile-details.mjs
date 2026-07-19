import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

// Accounts that already have bio/avatar/location (set in an earlier
// session) — just need a display_name added, everything else untouched.
const DISPLAY_NAME_ONLY = {
  test_reader_five: "Maya Chen",
  test_reader_four: "Jordan Blake",
  test_reader_one: "Ethan Cole",
  test_reader_seven: "Priya Nair",
  test_reader_six: "Marcus Webb",
  test_reader_three: "Riley Ortiz",
  test_reader_two: "Sofia Reyes",
};

// Accounts with nothing set yet — full profile: display name, bio,
// location, and a downloaded placeholder photo uploaded through the same
// avatars storage path the app itself uses.
const FULL_PROFILES = [
  {
    username: "test_reader_eight",
    displayName: "Grace Kim",
    bio: "Slow burns, found family, and a body count. That's the whole pitch.",
    location: "Minneapolis, MN",
    avatarImg: 5,
  },
  {
    username: "test_reader_nine",
    displayName: "Devon Marsh",
    bio: "Honestly? I just like rating things low. Don't take it personally.",
    location: "Phoenix, AZ",
    avatarImg: 12,
  },
  {
    username: "test_reader_ten",
    displayName: "Lena Ford",
    bio: "Book club refugee. Now I just read what I want and no one can stop me.",
    location: "Nashville, TN",
    avatarImg: 23,
  },
  {
    username: "test_reader_eleven",
    displayName: "Owen Patel",
    bio: "If the map isn't hand-drawn on the inside cover, I'm not interested.",
    location: "Raleigh, NC",
    avatarImg: 31,
  },
  {
    username: "test_reader_twelve",
    displayName: "Zoe Bennett",
    bio: "Audiobooks at 1.5x speed, always. Currently 40+ books into the year.",
    location: "Salt Lake City, UT",
    avatarImg: 44,
  },
  {
    username: "test_reader_thirteen",
    displayName: "Caleb Nguyen",
    bio: "Grimdark or nothing. Life's too short for happy endings.",
    location: "New Orleans, LA",
    avatarImg: 15,
  },
  {
    username: "test_reader_fourteen",
    displayName: "Ava Torres",
    bio: "Enemies to lovers is a personality trait at this point.",
    location: "San Diego, CA",
    avatarImg: 52,
  },
  {
    username: "test_reader_fifteen",
    displayName: "Noah Fischer",
    bio: "I read the ending first. Fight me.",
    location: "Kansas City, MO",
    avatarImg: 8,
  },
  {
    username: "test_reader_sixteen",
    displayName: "Isla Grant",
    bio: "Recovering literary-fiction snob, now fully converted to fantasy.",
    location: "Columbus, OH",
    avatarImg: 65,
  },
  {
    username: "test_reader_17",
    displayName: "Miles Carter",
    bio: "Sci-fi purist. If it doesn't have a spaceship I'm skeptical.",
    location: "Pittsburgh, PA",
    avatarImg: 33,
  },
  {
    username: "bloodoverbrightbitch",
    displayName: "Harper Quinn",
    bio: "Named my account after the one book that broke me. No regrets.",
    location: "Richmond, VA",
    avatarImg: 47,
  },
];

async function uploadAvatar(userId, imgNum) {
  const res = await fetch(`https://i.pravatar.cc/300?img=${imgNum}`);
  if (!res.ok) throw new Error(`pravatar fetch failed: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const path = `${userId}/avatar.jpg`;
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, buf, { upsert: true, contentType: "image/jpeg" });
  if (uploadError) throw uploadError;
  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`;
}

async function main() {
  for (const [username, displayName] of Object.entries(DISPLAY_NAME_ONLY)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username)
      .maybeSingle();
    if (!profile) {
      console.log(`SKIP (not found): ${username}`);
      continue;
    }
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName })
      .eq("id", profile.id);
    console.log(`display_name only: ${username} -> ${displayName}`, error ?? "ok");
  }

  for (const entry of FULL_PROFILES) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", entry.username)
      .maybeSingle();
    if (!profile) {
      console.log(`SKIP (not found): ${entry.username}`);
      continue;
    }
    const avatarUrl = await uploadAvatar(profile.id, entry.avatarImg);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: entry.displayName,
        bio: entry.bio,
        location: entry.location,
        avatar_url: avatarUrl,
      })
      .eq("id", profile.id);
    console.log(`full profile: ${entry.username} -> ${entry.displayName}`, error ?? "ok");
  }
}

main();
