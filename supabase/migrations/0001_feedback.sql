-- Loopline feedback table.
-- Write-only for anon users (rate-limited by Supabase). Read restricted to
-- authenticated admins (add policies in Phase 1 when we have auth).

create table if not exists public.feedback (
  id          bigserial primary key,
  rating      smallint  not null check (rating between 1 and 5),
  comment     text      not null default '' check (char_length(comment) <= 2000),
  session_id  text      not null,
  user_agent  text      not null default '',
  created_at  timestamptz not null default now()
);

create index if not exists feedback_created_at_idx on public.feedback (created_at desc);
create index if not exists feedback_rating_idx on public.feedback (rating);

-- RLS on: no one reads via anon; anyone can insert (abuse-guarded by rate limit)
alter table public.feedback enable row level security;

drop policy if exists "anon can insert feedback" on public.feedback;
create policy "anon can insert feedback"
  on public.feedback
  for insert
  to anon, authenticated
  with check (true);

-- Reads: Phase 1 adds an admin policy. For now, only service_role (automatic)
-- can read via the REST API.
