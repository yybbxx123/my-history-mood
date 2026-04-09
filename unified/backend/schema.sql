-- Historical figures table (for candidates list in /api/analyze and /api/figures)
create table if not exists public.figures (
  name text primary key,
  era text not null,
  traits jsonb not null default '[]'::jsonb,
  summary text not null default ''
);

