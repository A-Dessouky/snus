-- ============================================================
-- Sigma Nu Stanford — Chapter Management Platform
-- Run this in Supabase → SQL Editor
-- ============================================================

-- Profiles: exec pre-populates this with member emails + roles.
-- user_id is null until the member first logs in via Google OAuth.
create table public.profiles (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete set null unique,
  email      text unique not null,
  full_name  text,
  role       text not null check (role in ('member', 'social_chair', 'rush_chair', 'exec')),
  avatar_url text,
  phone      text,
  created_at timestamptz default now()
);

-- Announcements
create table public.announcements (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  content    text not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

-- Announcement comments
create table public.announcement_comments (
  id              uuid primary key default gen_random_uuid(),
  announcement_id uuid references public.announcements(id) on delete cascade not null,
  content         text not null,
  created_by      uuid references public.profiles(id) on delete set null,
  created_at      timestamptz default now()
);

-- Social calendar events
create table public.events (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  location    text,
  start_time  timestamptz not null,
  end_time    timestamptz,
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz default now()
);

-- Task board
create table public.tasks (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  assigned_to uuid references public.profiles(id) on delete set null,
  created_by  uuid references public.profiles(id) on delete set null,
  status      text not null default 'pending' check (status in ('pending', 'in_progress', 'complete')),
  due_date    date,
  created_at  timestamptz default now()
);

-- House point requests
create table public.house_point_requests (
  id               uuid primary key default gen_random_uuid(),
  member_id        uuid references public.profiles(id) on delete cascade not null,
  description      text not null,
  image_url        text,
  points_requested integer not null default 0,
  points_awarded   integer,
  status           text not null default 'pending' check (status in ('pending', 'approved', 'denied')),
  reviewed_by      uuid references public.profiles(id) on delete set null,
  reviewed_at      timestamptz,
  created_at       timestamptz default now()
);

-- Dues
create table public.dues (
  id         uuid primary key default gen_random_uuid(),
  member_id  uuid references public.profiles(id) on delete cascade not null,
  amount     numeric(10,2) not null,
  due_date   date not null,
  paid       boolean not null default false,
  paid_date  date,
  semester   text not null,
  created_at timestamptz default now()
);

-- Chapter finances — transactions
create table public.transactions (
  id          uuid primary key default gen_random_uuid(),
  type        text not null check (type in ('income', 'expense')),
  amount      numeric(10,2) not null,
  description text not null,
  date        date not null,
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz default now()
);

-- Financial requests (Social Chair submits; Exec approves/denies)
create table public.financial_requests (
  id           uuid primary key default gen_random_uuid(),
  submitted_by uuid references public.profiles(id) on delete set null,
  amount       numeric(10,2) not null,
  reason       text not null,
  status       text not null default 'pending' check (status in ('pending', 'approved', 'denied')),
  reviewed_by  uuid references public.profiles(id) on delete set null,
  reviewed_at  timestamptz,
  created_at   timestamptz default now()
);

-- Rush prospects
create table public.rush_prospects (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  photo_url  text,
  email      text,
  phone      text,
  notes      text,
  status     text not null default 'prospect' check (status in ('prospect', 'invited', 'bid', 'pledge', 'member')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

-- Chapter documents
create table public.documents (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  file_url    text not null,
  file_name   text not null,
  file_size   integer,
  category    text,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at  timestamptz default now()
);

-- In-app notifications
create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.profiles(id) on delete cascade not null,
  type       text not null,
  title      text not null,
  message    text not null,
  link       text,
  read       boolean not null default false,
  created_at timestamptz default now()
);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.profiles              enable row level security;
alter table public.announcements         enable row level security;
alter table public.announcement_comments enable row level security;
alter table public.events                enable row level security;
alter table public.tasks                 enable row level security;
alter table public.house_point_requests  enable row level security;
alter table public.dues                  enable row level security;
alter table public.transactions          enable row level security;
alter table public.financial_requests    enable row level security;
alter table public.rush_prospects        enable row level security;
alter table public.documents             enable row level security;
alter table public.notifications         enable row level security;

-- Authenticated members can read everything (role enforcement is in Next.js)
create policy "authenticated read" on public.profiles              for select to authenticated using (true);
create policy "authenticated read" on public.announcements         for select to authenticated using (true);
create policy "authenticated read" on public.announcement_comments for select to authenticated using (true);
create policy "authenticated read" on public.events                for select to authenticated using (true);
create policy "authenticated read" on public.tasks                 for select to authenticated using (true);
create policy "authenticated read" on public.house_point_requests  for select to authenticated using (true);
create policy "authenticated read" on public.dues                  for select to authenticated using (true);
create policy "authenticated read" on public.transactions          for select to authenticated using (true);
create policy "authenticated read" on public.financial_requests    for select to authenticated using (true);
create policy "authenticated read" on public.rush_prospects        for select to authenticated using (true);
create policy "authenticated read" on public.documents             for select to authenticated using (true);
create policy "authenticated read" on public.notifications         for select to authenticated using (true);

-- Users can update their own profile
create policy "own profile update" on public.profiles for update to authenticated
  using (auth.uid() = user_id);

-- Users can mark their own notifications read
create policy "own notifications update" on public.notifications for update to authenticated
  using (auth.uid() = (select user_id from public.profiles where id = user_id));

-- Service role (used in server actions) bypasses RLS automatically — no extra policies needed.

-- ============================================================
-- Storage buckets
-- ============================================================

-- Run these in Supabase → Storage → New Bucket
-- 1. "documents"   — private, for chapter documents
-- 2. "avatars"     — public,  for member profile photos
-- 3. "house-points"— private, for house point submission images
-- 4. "rush-photos" — private, for rush prospect photos
