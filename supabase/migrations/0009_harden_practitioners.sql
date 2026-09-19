-- SunuMed — durcissement de la table practitioners (audit de sécurité, points 1 et 7)
--
-- 1. Faille critique : practitioners_self était "for all", et le rôle
--    authenticated gardait les grants INSERT/DELETE par défaut de Supabase. Le
--    trigger de 0003 ne protège que les UPDATE, donc un praticien pouvait
--    supprimer sa propre ligne (DELETE /rest/v1/practitioners?id=eq.<uid>) puis
--    la recréer avec subscription_status = 'active' (POST), ce qui lui donnait
--    un abonnement gratuit et illimité.
--    Correctif : policies limitées à SELECT et UPDATE, INSERT/DELETE retirés au
--    rôle authenticated (la ligne n'est créée que par handle_new_practitioner,
--    security definer), et UPDATE restreint aux colonnes que l'app modifie
--    réellement (doctorProfileToRow et resetToDemoData dans src/lib/db.ts).
--    Le trigger protect_subscription_fields (0003) est conservé en défense en
--    profondeur.
--
-- 2. has_active_subscription(uuid) était exposée par PostgREST dans le schéma
--    public et exécutable par tout le monde : avec les id publiés par
--    l'annuaire, n'importe qui pouvait interroger le statut d'abonnement d'un
--    praticien. Elle est déplacée dans un schéma private non exposé à l'API.
--
-- Les écritures faites depuis le Dashboard Supabase (Table Editor, SQL Editor)
-- ou avec la clé service_role ne sont pas concernées : la gestion manuelle des
-- abonnements décrite dans Abonnement.md continue de fonctionner.

begin;

-- ============================================================================
-- 1. Policies : lecture et mise à jour de sa propre ligne uniquement
-- ============================================================================

drop policy practitioners_self on public.practitioners;

create policy practitioners_select_self on public.practitioners
  for select using (id = auth.uid());

create policy practitioners_update_self on public.practitioners
  for update using (id = auth.uid()) with check (id = auth.uid());

-- ============================================================================
-- 2. Grants : plus d'INSERT/DELETE, UPDATE limité à une liste blanche
-- ============================================================================

revoke insert, update, delete, truncate, references, trigger
  on public.practitioners from authenticated;

grant update (
  name,
  title,
  specialty,
  professional_order_number,
  ninea,
  phone,
  email,
  address,
  city,
  consultation_fee,
  default_duration,
  whatsapp_reminder_hours,
  whatsapp_custom_template,
  whatsapp_auto_prompt,
  is_public_listed,
  public_bio,
  accepts_new_patients
) on public.practitioners to authenticated;

-- ============================================================================
-- 3. has_active_subscription : schéma private, hors de l'API REST
-- ============================================================================
-- Le schéma private n'est pas dans la liste "Exposed schemas" de PostgREST.
-- Les policies RLS s'évaluent avec le rôle de l'appelant, donc authenticated
-- garde USAGE sur le schéma et EXECUTE sur la fonction. anon n'en a pas
-- besoin : list_public_practitioners est security definer.

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create or replace function private.has_active_subscription(p_practitioner_id uuid)
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

revoke execute on function private.has_active_subscription(uuid) from public, anon;
grant execute on function private.has_active_subscription(uuid) to authenticated;

-- Les 4 policies métier pointent désormais vers private.has_active_subscription.

drop policy patients_tenant_isolation on public.patients;
create policy patients_tenant_isolation on public.patients
  for all
  using (practitioner_id = auth.uid() and private.has_active_subscription(practitioner_id))
  with check (practitioner_id = auth.uid() and private.has_active_subscription(practitioner_id));

drop policy appointments_tenant_isolation on public.appointments;
create policy appointments_tenant_isolation on public.appointments
  for all
  using (practitioner_id = auth.uid() and private.has_active_subscription(practitioner_id))
  with check (practitioner_id = auth.uid() and private.has_active_subscription(practitioner_id));

drop policy prescriptions_tenant_isolation on public.prescriptions;
create policy prescriptions_tenant_isolation on public.prescriptions
  for all
  using (practitioner_id = auth.uid() and private.has_active_subscription(practitioner_id))
  with check (practitioner_id = auth.uid() and private.has_active_subscription(practitioner_id));

drop policy consultations_tenant_isolation on public.consultations;
create policy consultations_tenant_isolation on public.consultations
  for all
  using (practitioner_id = auth.uid() and private.has_active_subscription(practitioner_id))
  with check (practitioner_id = auth.uid() and private.has_active_subscription(practitioner_id));

-- L'annuaire public (0004) est recréé à l'identique, en dehors de la référence
-- à la fonction déplacée.

create or replace function public.list_public_practitioners()
returns table (
  id uuid,
  name text,
  title text,
  specialty text,
  phone text,
  address text,
  city text,
  public_bio text,
  accepts_new_patients boolean
)
language sql stable security definer set search_path = public as $$
  select p.id, p.name, p.title, p.specialty, p.phone, p.address, p.city, p.public_bio, p.accepts_new_patients
  from public.practitioners p
  where p.is_public_listed = true
    and private.has_active_subscription(p.id);
$$;

grant execute on function public.list_public_practitioners() to anon, authenticated;

drop function public.has_active_subscription(uuid);

commit;

-- ============================================================================
-- Vérification (à lancer après application, dans le SQL Editor)
-- ============================================================================
-- Policies de practitioners : doit lister practitioners_select_self (SELECT)
-- et practitioners_update_self (UPDATE), et rien d'autre.
--   select policyname, cmd from pg_policies where tablename = 'practitioners';
--
-- Privilèges table de authenticated : doit renvoyer uniquement SELECT.
--   select privilege_type from information_schema.role_table_grants
--   where table_schema = 'public' and table_name = 'practitioners' and grantee = 'authenticated';
--
-- Plus aucune fonction has_active_subscription dans public :
--   select n.nspname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--   where p.proname = 'has_active_subscription';
