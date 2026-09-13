-- MédicLab — essai gratuit (30 jours) + abonnement à gestion manuelle
-- Ajoute trial_ends_at, convertit subscription_status en enum, et fait respecter
-- l'abonnement actif au niveau des policies RLS (pas seulement côté UI).

-- ============================================================================
-- 1. Colonne de fin d'essai
-- ============================================================================

alter table public.practitioners add column trial_ends_at timestamptz;

-- ============================================================================
-- 2. subscription_status : text libre -> enum
-- ============================================================================

create type subscription_status_type as enum ('trialing', 'active', 'expired', 'cancelled');

-- Backfill : tout compte existant (démo + comptes de test créés avant cette
-- fonctionnalité) passe à 'active' pour ne pas être bloqué rétroactivement.
update public.practitioners
set subscription_status = 'active'
where subscription_status is null
   or subscription_status not in ('trialing', 'active', 'expired', 'cancelled');

alter table public.practitioners
  alter column subscription_status type subscription_status_type using subscription_status::subscription_status_type,
  alter column subscription_status set default 'trialing',
  alter column subscription_status set not null;

-- ============================================================================
-- 3. Nouveau compte = essai de 30 jours
-- ============================================================================

create or replace function public.handle_new_practitioner()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.practitioners (id, name, email, subscription_status, trial_ends_at)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', ''), new.email, 'trialing', now() + interval '30 days');
  return new;
end;
$$;

-- ============================================================================
-- 4. Fonction d'abonnement actif (réutilisée par les policies)
-- ============================================================================

create or replace function public.has_active_subscription(p_practitioner_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.practitioners
    where id = p_practitioner_id
      and (
        subscription_status = 'active'
        or (subscription_status = 'trialing' and trial_ends_at > now())
      )
  );
$$;

-- ============================================================================
-- 5. Policies : bloquer patients/appointments/prescriptions/consultations
--    quand l'abonnement n'est pas actif. practitioners_self n'est pas touchée
--    (l'app doit pouvoir lire son propre statut même bloquée).
-- ============================================================================

drop policy patients_tenant_isolation on public.patients;
create policy patients_tenant_isolation on public.patients
  for all
  using (practitioner_id = auth.uid() and public.has_active_subscription(practitioner_id))
  with check (practitioner_id = auth.uid() and public.has_active_subscription(practitioner_id));

drop policy appointments_tenant_isolation on public.appointments;
create policy appointments_tenant_isolation on public.appointments
  for all
  using (practitioner_id = auth.uid() and public.has_active_subscription(practitioner_id))
  with check (practitioner_id = auth.uid() and public.has_active_subscription(practitioner_id));

drop policy prescriptions_tenant_isolation on public.prescriptions;
create policy prescriptions_tenant_isolation on public.prescriptions
  for all
  using (practitioner_id = auth.uid() and public.has_active_subscription(practitioner_id))
  with check (practitioner_id = auth.uid() and public.has_active_subscription(practitioner_id));

drop policy consultations_tenant_isolation on public.consultations;
create policy consultations_tenant_isolation on public.consultations
  for all
  using (practitioner_id = auth.uid() and public.has_active_subscription(practitioner_id))
  with check (practitioner_id = auth.uid() and public.has_active_subscription(practitioner_id));
