-- MédicLab — annuaire public des professionnels ("Trouver un professionnel")
-- Ajoute un opt-in de visibilité publique par praticien et un point d'accès en
-- lecture seule (RPC security definer) qui n'expose qu'un sous-ensemble de
-- colonnes sûres, jamais l'email, le N° Ordre, le NINEA ni les données
-- d'abonnement.

-- ============================================================================
-- 1. Colonnes de visibilité publique
-- ============================================================================

alter table public.practitioners
  add column is_public_listed boolean not null default false,
  add column public_bio text not null default '',
  add column accepts_new_patients boolean not null default true;

create index practitioners_public_listed_idx
  on public.practitioners (id)
  where is_public_listed = true;

-- ============================================================================
-- 2. Fonction publique : allowlist explicite de colonnes
-- ============================================================================
-- Un praticien dont l'abonnement n'est plus actif (essai expiré, abonnement
-- résilié) disparaît de l'annuaire, cohérent avec has_active_subscription()
-- déjà utilisée pour le gating applicatif (0002_subscriptions.sql).

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
    and public.has_active_subscription(p.id);
$$;

grant execute on function public.list_public_practitioners() to anon, authenticated;

-- ============================================================================
-- 3. Durcissement défensif : le rôle anonyme ne touche jamais la table brute
-- ============================================================================
-- practitioners_self (0001_init.sql) reste inchangée et continue de ne servir
-- que le praticien connecté à lui-même (using (id = auth.uid())). anon n'a de
-- toute façon jamais eu de policy le concernant, mais on retire explicitement
-- les grants au niveau table pour qu'aucune évolution future de policy ne
-- puisse accidentellement exposer la table brute au rôle anonyme.

revoke select, insert, update, delete on public.practitioners from anon;
