-- MédicLab — corrige une faille découverte en vérifiant 0002_subscriptions.sql :
-- la policy practitioners_self ("for all using (id = auth.uid())") autorisait un
-- praticien authentifié à modifier LUI-MÊME subscription_status/trial_ends_at sur
-- sa propre ligne via un simple appel REST (PATCH /rest/v1/practitioners), ce qui
-- permettait de s'auto-activer gratuitement et annulait tout l'intérêt du blocage
-- RLS mis en place sur patients/appointments/prescriptions/consultations.
--
-- Testé en production le 13/09/2026 : un compte d'essai expiré a pu se remettre
-- 'active' via une simple requête PATCH authentifiée avec son propre token.
--
-- Correctif : un trigger BEFORE UPDATE qui restaure l'ancienne valeur de ces deux
-- colonnes dès que la requête provient d'un utilisateur final (auth.role() =
-- 'authenticated', le rôle que PostgREST attribue aux requêtes clé anonyme + JWT
-- utilisateur). Les écritures faites hors de ce contexte (Table Editor / SQL
-- Editor du Dashboard Supabase, ou une future intégration avec la clé
-- service_role) restent autorisées, donc le flux de gestion manuelle décrit dans
-- Abonnement.md continue de fonctionner normalement.

create or replace function public.protect_subscription_fields()
returns trigger language plpgsql as $$
begin
  if auth.role() = 'authenticated' then
    new.subscription_status := old.subscription_status;
    new.trial_ends_at := old.trial_ends_at;
  end if;
  return new;
end;
$$;

create trigger protect_subscription_fields_trigger
  before update on public.practitioners
  for each row execute function public.protect_subscription_fields();
