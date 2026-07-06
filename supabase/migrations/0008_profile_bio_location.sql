alter table profiles
  add column if not exists bio text check (char_length(bio) <= 160),
  add column if not exists location text check (char_length(location) <= 100);
