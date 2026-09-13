-- MédicLab — schéma initial multi-cabinets (Supabase Auth + Postgres + RLS)
-- Chaque praticien qui s'inscrit obtient un espace isolé : toutes les tables métier
-- sont scopées par practitioner_id et protégées par des policies RLS strictes.

-- ============================================================================
-- Enums
-- ============================================================================

create type appointment_type as enum ('consultation','suivi','urgence','teleconsultation','bilan','vaccination');
create type appointment_status as enum ('confirmed','waiting','in_progress','completed','cancelled','no_show');
create type payment_method as enum ('wave','orange_money','especes','carte','cheque','mutuelle_ipm','tiers_payant','en_attente');
create type gender_type as enum ('M','F','Autre');

-- ============================================================================
-- practitioners (id = auth.users.id, une ligne = un compte = un cabinet)
-- ============================================================================

create table public.practitioners (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  title text not null default 'Dr.',
  specialty text not null default '',
  onms text,
  ninea text,
  phone text not null default '',
  email text not null default '',
  address text not null default '',
  city text not null default '',
  consultation_fee numeric(10,2) not null default 0,
  default_duration int not null default 30,
  whatsapp_reminder_hours int,
  whatsapp_custom_template text,
  whatsapp_auto_prompt boolean default false,
  subscription_status text, -- colonne de compatibilité future, non utilisée dans cette phase
  created_at timestamptz not null default now()
);

-- ============================================================================
-- patients
-- ============================================================================

create table public.patients (
  id uuid primary key default gen_random_uuid(),
  practitioner_id uuid not null references public.practitioners(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  gender gender_type not null,
  birth_date date not null,
  ssn text not null default '',
  phone text not null default '',
  email text not null default '',
  address text not null default '',
  blood_group text,
  allergies text[] not null default '{}',
  medical_history text[] not null default '{}',
  chronic_treatments text[] not null default '{}',
  emergency_contact jsonb, -- {name, relationship, phone}
  notes text,
  created_at timestamptz not null default now()
);
create index patients_practitioner_idx on public.patients(practitioner_id);

-- ============================================================================
-- appointments
-- ============================================================================

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  practitioner_id uuid not null references public.practitioners(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete restrict,
  date date not null,
  start_time time not null,
  duration int not null,
  type appointment_type not null,
  status appointment_status not null default 'confirmed',
  reason text not null default '',
  notes text,
  fee numeric(10,2) not null default 0,
  is_paid boolean not null default false,
  payment_method payment_method,
  arrived_at time,
  whatsapp_reminder_sent boolean not null default false,
  whatsapp_reminder_sent_at timestamptz,
  whatsapp_reminder_opt_out boolean not null default false
);
create index appointments_practitioner_idx on public.appointments(practitioner_id);
create index appointments_date_idx on public.appointments(practitioner_id, date);
create index appointments_patient_idx on public.appointments(patient_id);

-- ============================================================================
-- prescriptions
-- ============================================================================

create table public.prescriptions (
  id uuid primary key default gen_random_uuid(),
  practitioner_id uuid not null references public.practitioners(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete restrict,
  appointment_id uuid references public.appointments(id) on delete set null,
  date date not null,
  medications jsonb not null default '[]', -- [{id,name,dosage,frequency,duration,instructions}]
  recommendations text,
  created_at timestamptz not null default now()
);
create index prescriptions_practitioner_idx on public.prescriptions(practitioner_id);
create index prescriptions_patient_idx on public.prescriptions(patient_id);

-- ============================================================================
-- consultations
-- ============================================================================

create table public.consultations (
  id uuid primary key default gen_random_uuid(),
  practitioner_id uuid not null references public.practitioners(id) on delete cascade,
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete restrict,
  date date not null,
  time time not null,
  reason text not null default '',
  systolic_bp int,
  diastolic_bp int,
  heart_rate int,
  weight numeric(5,2),
  height numeric(5,2),
  temperature numeric(4,1),
  blood_sugar numeric(5,2),
  soap jsonb not null, -- {subjective, objective, assessment, plan}
  prescription_id uuid references public.prescriptions(id) on delete set null,
  notes text
);
create unique index consultations_appointment_unique on public.consultations(appointment_id);
create index consultations_practitioner_idx on public.consultations(practitioner_id);
create index consultations_patient_idx on public.consultations(patient_id);

-- ============================================================================
-- Row Level Security
-- ============================================================================

alter table public.practitioners enable row level security;
alter table public.patients enable row level security;
alter table public.appointments enable row level security;
alter table public.prescriptions enable row level security;
alter table public.consultations enable row level security;

create policy practitioners_self on public.practitioners
  for all using (id = auth.uid()) with check (id = auth.uid());

create policy patients_tenant_isolation on public.patients
  for all using (practitioner_id = auth.uid()) with check (practitioner_id = auth.uid());

create policy appointments_tenant_isolation on public.appointments
  for all using (practitioner_id = auth.uid()) with check (practitioner_id = auth.uid());

create policy prescriptions_tenant_isolation on public.prescriptions
  for all using (practitioner_id = auth.uid()) with check (practitioner_id = auth.uid());

create policy consultations_tenant_isolation on public.consultations
  for all using (practitioner_id = auth.uid()) with check (practitioner_id = auth.uid());

-- ============================================================================
-- Création automatique du cabinet à l'inscription
-- ============================================================================

create function public.handle_new_practitioner()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.practitioners (id, name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', ''), new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_practitioner();
