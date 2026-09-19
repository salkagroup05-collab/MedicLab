-- SunuMed — clés étrangères limitées au cabinet (audit de sécurité, point 5)
--
-- appointments.patient_id, prescriptions.patient_id/appointment_id et
-- consultations.appointment_id/patient_id/prescription_id référençaient l'id
-- seul. Les contrôles de FK ignorent la RLS : un praticien qui connaissait
-- l'UUID d'une ligne d'un autre cabinet pouvait créer un RDV sur ce patient
-- (bloquant sa suppression, on delete restrict), occuper l'appointment_id d'un
-- RDV d'autrui dans consultations (index unique) ou tester l'existence d'UUID
-- via les messages d'erreur.
--
-- Correctif : chaque FK inclut désormais practitioner_id. Une référence n'est
-- valide que si la ligne cible appartient au même cabinet, et l'erreur est la
-- même que l'UUID existe ailleurs ou non. Les comportements on delete sont
-- inchangés ; pour les colonnes nullables en "set null", seule la colonne de
-- référence est remise à null (syntaxe PG15+), practitioner_id étant not null.

begin;

-- ============================================================================
-- 0. Contrôle préalable : aucune référence croisée ne doit déjà exister
-- ============================================================================
-- Si ce bloc lève une erreur, la migration est annulée en entier. Lister les
-- lignes fautives avec les mêmes jointures, les corriger, puis relancer.

do $$
declare
  n bigint;
begin
  select
      (select count(*) from public.appointments a
         join public.patients p on p.id = a.patient_id
        where p.practitioner_id <> a.practitioner_id)
    + (select count(*) from public.prescriptions r
         join public.patients p on p.id = r.patient_id
        where p.practitioner_id <> r.practitioner_id)
    + (select count(*) from public.prescriptions r
         join public.appointments a on a.id = r.appointment_id
        where a.practitioner_id <> r.practitioner_id)
    + (select count(*) from public.consultations c
         join public.appointments a on a.id = c.appointment_id
        where a.practitioner_id <> c.practitioner_id)
    + (select count(*) from public.consultations c
         join public.patients p on p.id = c.patient_id
        where p.practitioner_id <> c.practitioner_id)
    + (select count(*) from public.consultations c
         join public.prescriptions r on r.id = c.prescription_id
        where r.practitioner_id <> c.practitioner_id)
  into n;

  if n > 0 then
    raise exception '0010 : % référence(s) inter-cabinets trouvée(s), migration annulée', n;
  end if;
end;
$$;

-- ============================================================================
-- 1. Clés candidates (practitioner_id, id) sur les tables référencées
-- ============================================================================

alter table public.patients
  add constraint patients_practitioner_id_id_key unique (practitioner_id, id);

alter table public.appointments
  add constraint appointments_practitioner_id_id_key unique (practitioner_id, id);

alter table public.prescriptions
  add constraint prescriptions_practitioner_id_id_key unique (practitioner_id, id);

-- ============================================================================
-- 2. appointments
-- ============================================================================

alter table public.appointments
  drop constraint appointments_patient_id_fkey,
  add constraint appointments_patient_id_fkey
    foreign key (practitioner_id, patient_id)
    references public.patients (practitioner_id, id) on delete restrict;

-- ============================================================================
-- 3. prescriptions
-- ============================================================================

alter table public.prescriptions
  drop constraint prescriptions_patient_id_fkey,
  add constraint prescriptions_patient_id_fkey
    foreign key (practitioner_id, patient_id)
    references public.patients (practitioner_id, id) on delete restrict,
  drop constraint prescriptions_appointment_id_fkey,
  add constraint prescriptions_appointment_id_fkey
    foreign key (practitioner_id, appointment_id)
    references public.appointments (practitioner_id, id) on delete set null (appointment_id);

-- ============================================================================
-- 4. consultations
-- ============================================================================

alter table public.consultations
  drop constraint consultations_appointment_id_fkey,
  add constraint consultations_appointment_id_fkey
    foreign key (practitioner_id, appointment_id)
    references public.appointments (practitioner_id, id) on delete cascade,
  drop constraint consultations_patient_id_fkey,
  add constraint consultations_patient_id_fkey
    foreign key (practitioner_id, patient_id)
    references public.patients (practitioner_id, id) on delete restrict,
  drop constraint consultations_prescription_id_fkey,
  add constraint consultations_prescription_id_fkey
    foreign key (practitioner_id, prescription_id)
    references public.prescriptions (practitioner_id, id) on delete set null (prescription_id);

commit;

-- ============================================================================
-- Vérification (à lancer après application, dans le SQL Editor)
-- ============================================================================
-- Les 6 FK doivent être composites (practitioner_id, …) :
--   select conrelid::regclass, conname, pg_get_constraintdef(oid)
--   from pg_constraint
--   where contype = 'f'
--     and conrelid in ('public.appointments'::regclass, 'public.prescriptions'::regclass, 'public.consultations'::regclass)
--   order by 1, 2;
