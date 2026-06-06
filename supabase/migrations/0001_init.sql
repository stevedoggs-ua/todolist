-- profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  onboarding_done boolean not null default false,
  timezone text not null default 'Europe/Kyiv',
  created_at timestamptz not null default now()
);

-- projects
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  color text not null default 'gray',
  is_inbox boolean not null default false,
  created_at timestamptz not null default now()
);

-- tasks
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  title text not null,
  priority int not null default 4 check (priority between 1 and 4),
  duration_min int,
  due_date date,
  due_time time,
  is_done boolean not null default false,
  is_focus boolean not null default false,
  focus_date date,
  recurrence text,
  source text not null default 'manual' check (source in ('voice','text','manual')),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index tasks_user_due on public.tasks(user_id, due_date);
create index tasks_user_focus on public.tasks(user_id, focus_date, is_focus);

-- RLS
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;

create policy "own profile" on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());
create policy "own projects" on public.projects
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own tasks" on public.tasks
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- on signup: create profile + default Inbox project
create function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', new.email));
  insert into public.projects (user_id, name, is_inbox, color)
  values (new.id, 'Inbox', true, 'gray');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
