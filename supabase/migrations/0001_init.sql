-- AviHire School Portal: standalone database (NOT the main AviHire project).
-- Multi-tenant by school. Every table has RLS on; a signed-in staff member can
-- only ever see rows for the school(s) they belong to.

create extension if not exists pgcrypto;
create schema if not exists private;

-- ---------------------------------------------------------------- helpers
create or replace function private.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;

-- ---------------------------------------------------------------- schools
create table public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 200),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  logo_url text,
  contact_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.school_members (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  role text not null check (role in ('main_admin','admin')),
  created_at timestamptz not null default now(),
  unique (school_id, user_id)
);
create index on public.school_members (user_id);
-- exactly one main admin per school
create unique index one_main_admin_per_school
  on public.school_members (school_id) where role = 'main_admin';

-- Membership checks used by every policy (security definer so they can read
-- school_members without recursing through its own RLS).
create or replace function private.is_member(sid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.school_members m
                 where m.school_id = sid and m.user_id = (select auth.uid()))
$$;
create or replace function private.is_main_admin(sid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.school_members m
                 where m.school_id = sid and m.user_id = (select auth.uid())
                   and m.role = 'main_admin')
$$;
revoke all on function private.is_member(uuid), private.is_main_admin(uuid) from public, anon;
grant execute on function private.is_member(uuid), private.is_main_admin(uuid) to authenticated;
grant usage on schema private to authenticated;

-- ---------------------------------------------------------------- invites
-- Only the SHA-256 hash of the token is stored. Raw token is emailed/shown once.
create table public.admin_invites (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  email text not null,
  role text not null check (role in ('main_admin','admin')),
  token_hash text not null unique,
  invited_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '7 days',
  accepted_at timestamptz
);

-- ---------------------------------------------------------------- campuses
create table public.campuses (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  name text not null,
  city text,
  state text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, school_id)
);
create index on public.campuses (school_id);

-- ---------------------------------------------------------------- students
create table public.students (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  campus_id uuid,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  program text not null check (program in ('AP_MECHANIC','AIRFRAME','POWERPLANT','DISPATCHER')),
  enrollment_status text not null default 'active'
    check (enrollment_status in ('active','graduated','withdrawn','on_hold')),
  license_status text not null default 'UNLICENSED'
    check (license_status in ('UNLICENSED','AIRFRAME','POWERPLANT','A&P','DISPATCHER')),
  start_date date,
  expected_graduation_date date,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, school_id),
  unique (school_id, email),
  foreign key (campus_id, school_id) references public.campuses (id, school_id)
);
create index on public.students (school_id, campus_id);

-- ---------------------------------------------------------------- courses / progress
create table public.courses (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  program text not null check (program in ('AP_MECHANIC','AIRFRAME','POWERPLANT','DISPATCHER')),
  name text not null,
  required_hours numeric(6,1) not null default 0 check (required_hours >= 0),
  sort_order int not null default 0,
  unique (id, school_id)
);
create index on public.courses (school_id, program);

create table public.student_courses (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null,
  student_id uuid not null,
  course_id uuid not null,
  status text not null default 'not_started'
    check (status in ('not_started','in_progress','completed','failed')),
  hours_completed numeric(6,1) not null default 0 check (hours_completed >= 0),
  completed_at date,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now(),
  unique (student_id, course_id),
  foreign key (student_id, school_id) references public.students (id, school_id) on delete cascade,
  foreign key (course_id, school_id) references public.courses (id, school_id) on delete cascade
);

-- ---------------------------------------------------------------- attendance
create table public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null,
  student_id uuid not null,
  attended_on date not null,
  status text not null check (status in ('present','absent','late','excused')),
  hours numeric(4,1) check (hours >= 0 and hours <= 24),
  note text,
  recorded_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (student_id, attended_on),
  foreign key (student_id, school_id) references public.students (id, school_id) on delete cascade
);
create index on public.attendance_records (school_id, attended_on);

-- ---------------------------------------------------------------- exams
create table public.exams (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null,
  student_id uuid not null,
  exam_type text not null check (exam_type in
    ('FAA_WRITTEN_GENERAL','FAA_WRITTEN_AIRFRAME','FAA_WRITTEN_POWERPLANT',
     'ORAL_PRACTICAL','SCHOOL_FINAL','OTHER')),
  scheduled_at timestamptz not null,
  location text,
  status text not null default 'scheduled'
    check (status in ('scheduled','passed','failed','cancelled','no_show')),
  score numeric(5,2),
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (student_id, school_id) references public.students (id, school_id) on delete cascade
);
create index on public.exams (school_id, scheduled_at);

-- ---------------------------------------------------------------- license history
create table public.license_events (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null,
  student_id uuid not null,
  old_status text,
  new_status text not null,
  changed_by uuid,
  changed_at timestamptz not null default now(),
  foreign key (student_id, school_id) references public.students (id, school_id) on delete cascade
);

create or replace function private.log_license_change() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.license_status is distinct from old.license_status then
    insert into public.license_events (school_id, student_id, old_status, new_status, changed_by)
    values (new.school_id, new.id, old.license_status, new.license_status, (select auth.uid()));
  end if;
  return new;
end $$;
create trigger students_license_audit after update on public.students
  for each row execute function private.log_license_change();

-- ---------------------------------------------------------------- documents (files)
create table public.student_documents (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null,
  student_id uuid not null,
  doc_type text not null check (doc_type in
    ('ENROLLMENT','TRANSCRIPT','CERTIFICATE','ID','MEDICAL','OTHER')),
  file_name text not null,
  storage_path text not null unique,   -- <school_id>/<student_id>/<uuid>-<name>
  size_bytes bigint check (size_bytes > 0 and size_bytes <= 26214400),
  uploaded_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  foreign key (student_id, school_id) references public.students (id, school_id) on delete cascade
);

-- Bulk-upload (CSV/Excel) history
create table public.import_batches (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  file_name text not null,
  rows_total int not null default 0,
  rows_imported int not null default 0,
  rows_failed int not null default 0,
  errors jsonb not null default '[]'::jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- job bucket sends
-- The ONLY link to the main AviHire site. Records jobs sent to a student's
-- AviHire job bucket (delivery is done server-side, matched by student email).
create table public.job_sends (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null,
  student_id uuid not null,
  avihire_job_id text not null,
  job_title text,
  company_name text,
  delivery_status text not null default 'pending'
    check (delivery_status in ('pending','delivered','no_avihire_account','failed')),
  error text,
  sent_by uuid references auth.users(id),
  sent_at timestamptz not null default now(),
  foreign key (student_id, school_id) references public.students (id, school_id) on delete cascade
);
create index on public.job_sends (school_id, student_id);

-- ---------------------------------------------------------------- notifications + audit
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  message text not null,
  link text,
  created_at timestamptz not null default now()
);
create table public.notification_reads (
  notification_id uuid not null references public.notifications(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (notification_id, user_id)
);

create table public.audit_log (
  id bigint generated always as identity primary key,
  school_id uuid not null references public.schools(id) on delete cascade,
  actor_id uuid not null,
  action text not null,
  entity text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index on public.audit_log (school_id, created_at desc);

-- updated_at triggers
create trigger t_upd before update on public.schools for each row execute function private.set_updated_at();
create trigger t_upd before update on public.campuses for each row execute function private.set_updated_at();
create trigger t_upd before update on public.students for each row execute function private.set_updated_at();
create trigger t_upd before update on public.exams for each row execute function private.set_updated_at();
create trigger t_upd before update on public.student_courses for each row execute function private.set_updated_at();

-- ================================================================ RLS
alter table public.schools            enable row level security;
alter table public.school_members     enable row level security;
alter table public.admin_invites      enable row level security;
alter table public.campuses           enable row level security;
alter table public.students           enable row level security;
alter table public.courses            enable row level security;
alter table public.student_courses    enable row level security;
alter table public.attendance_records enable row level security;
alter table public.exams              enable row level security;
alter table public.license_events     enable row level security;
alter table public.student_documents  enable row level security;
alter table public.import_batches     enable row level security;
alter table public.job_sends          enable row level security;
alter table public.notifications      enable row level security;
alter table public.notification_reads enable row level security;
alter table public.audit_log          enable row level security;

-- schools: members read; main admin edits. (Schools are created by AviHire staff
-- with the service role, never from the browser.)
create policy schools_select on public.schools for select to authenticated
  using (private.is_member(id));
create policy schools_update on public.schools for update to authenticated
  using (private.is_main_admin(id)) with check (private.is_main_admin(id));

-- members: everyone in the school sees the team; only the main admin removes
-- others (never themselves). Adding happens only through accept_invite().
create policy members_select on public.school_members for select to authenticated
  using (private.is_member(school_id));
create policy members_delete on public.school_members for delete to authenticated
  using (private.is_main_admin(school_id) and user_id <> (select auth.uid()));

create policy invites_select on public.admin_invites for select to authenticated
  using (private.is_main_admin(school_id));
create policy invites_delete on public.admin_invites for delete to authenticated
  using (private.is_main_admin(school_id));

-- Standard "any staff member of the school" policies for the working tables.
do $$
declare t text;
begin
  foreach t in array array['campuses','students','courses','student_courses',
    'attendance_records','exams','student_documents','import_batches','job_sends']
  loop
    execute format('create policy %I_select on public.%I for select to authenticated using (private.is_member(school_id))', t, t);
    execute format('create policy %I_insert on public.%I for insert to authenticated with check (private.is_member(school_id))', t, t);
    execute format('create policy %I_update on public.%I for update to authenticated using (private.is_member(school_id)) with check (private.is_member(school_id))', t, t);
  end loop;
end $$;
-- deletes: students/campuses/courses only by the main admin; records by any staff
create policy students_delete on public.students for delete to authenticated using (private.is_main_admin(school_id));
create policy campuses_delete on public.campuses for delete to authenticated using (private.is_main_admin(school_id));
create policy courses_delete on public.courses for delete to authenticated using (private.is_main_admin(school_id));
create policy exams_delete on public.exams for delete to authenticated using (private.is_member(school_id));
create policy documents_delete on public.student_documents for delete to authenticated using (private.is_member(school_id));

-- read-only history: written by trigger / server only
create policy license_events_select on public.license_events for select to authenticated
  using (private.is_member(school_id));

create policy notifications_select on public.notifications for select to authenticated
  using (private.is_member(school_id));
create policy reads_select on public.notification_reads for select to authenticated
  using (user_id = (select auth.uid()));
create policy reads_insert on public.notification_reads for insert to authenticated
  with check (user_id = (select auth.uid()));

-- audit log: append-only for staff, readable by the main admin only
create policy audit_select on public.audit_log for select to authenticated
  using (private.is_main_admin(school_id));
create policy audit_insert on public.audit_log for insert to authenticated
  with check (private.is_member(school_id) and actor_id = (select auth.uid()));

-- ================================================================ invite functions
create or replace function public.create_invite(p_school uuid, p_email text, p_role text default 'admin')
returns text language plpgsql security definer set search_path = '' as $$
declare raw text := encode(extensions.gen_random_bytes(32), 'hex');
begin
  if not private.is_main_admin(p_school) then raise exception 'not allowed'; end if;
  if p_role <> 'admin' then raise exception 'only admin invites can be created here'; end if;
  insert into public.admin_invites (school_id, email, role, token_hash, invited_by)
  values (p_school, lower(trim(p_email)), p_role,
          encode(extensions.digest(raw, 'sha256'), 'hex'), (select auth.uid()));
  return raw;   -- shown/emailed once; only the hash is stored
end $$;

create or replace function public.accept_invite(p_token text, p_full_name text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare inv public.admin_invites; uid uuid := (select auth.uid()); uemail text;
begin
  if uid is null then raise exception 'sign in first'; end if;
  select email into uemail from auth.users where id = uid;
  select * into inv from public.admin_invites
   where token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
     and accepted_at is null and expires_at > now() for update;
  if not found then raise exception 'invalid or expired invite'; end if;
  if lower(uemail) <> lower(inv.email) then raise exception 'invite was sent to a different email'; end if;
  insert into public.school_members (school_id, user_id, full_name, email, role)
  values (inv.school_id, uid, p_full_name, uemail, inv.role);
  update public.admin_invites set accepted_at = now() where id = inv.id;
  return inv.school_id;
end $$;
revoke all on function public.create_invite(uuid,text,text), public.accept_invite(text,text) from public, anon;
grant execute on function public.create_invite(uuid,text,text), public.accept_invite(text,text) to authenticated;

-- ================================================================ storage (private)
insert into storage.buckets (id, name, public, file_size_limit)
values ('student-documents', 'student-documents', false, 26214400)
on conflict (id) do nothing;

create policy docs_read on storage.objects for select to authenticated
  using (bucket_id = 'student-documents'
         and private.is_member(((storage.foldername(name))[1])::uuid));
create policy docs_write on storage.objects for insert to authenticated
  with check (bucket_id = 'student-documents'
         and private.is_member(((storage.foldername(name))[1])::uuid));
create policy docs_delete on storage.objects for delete to authenticated
  using (bucket_id = 'student-documents'
         and private.is_member(((storage.foldername(name))[1])::uuid));
