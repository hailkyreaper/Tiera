alter table profiles
  add column if not exists display_name text check (char_length(display_name) <= 50);
