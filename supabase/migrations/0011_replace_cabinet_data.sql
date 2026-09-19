-- SunuMed — import et réinitialisation démo atomiques (audit de sécurité, point 6)
--
-- importCabinetData et resetToDemoData effaçaient toutes les données du cabinet
-- puis réinséraient ligne par ligne depuis le navigateur. Une coupure réseau ou
-- une ligne invalide au milieu laissait le cabinet à moitié vide.
--
-- replace_cabinet_data fait tout dans un seul appel RPC, donc une seule
-- transaction : au moindre échec, Postgres annule tout et les données d'origine
-- restent intactes.
--
-- security invoker : la fonction s'exécute avec le rôle de l'appelant, donc les
-- policies RLS (cabinet = auth.uid(), abonnement actif) et les grants par
-- colonne de practitioners (0009) s'appliquent exactement comme pour des
-- requêtes REST directes. Elle n'ouvre aucun droit nouveau.
--
-- Format attendu : des tableaux de lignes en snake_case, tels que produits par
-- patientToRow/appointmentToRow/... (src/lib/db.ts), chacune avec son "id"
-- d'origine. Les id sont des identifiants libres (texte) du fichier importé :
-- chaque ligne reçoit un nouvel UUID, et les références (patient_id,
-- appointment_id, prescription_id) sont réécrites via une table de
-- correspondance ancien id -> nouvel id. Les lignes qui pointent vers un
-- parent absent sont ignorées, comme le faisait l'ancien code client.

create or replace function public.replace_cabinet_data(
  p_patients jsonb,
  p_appointments jsonb,
  p_prescriptions jsonb,
  p_consultations jsonb,
  p_doctor jsonb default null
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_patient_map jsonb;
  v_appointment_map jsonb;
  v_prescription_map jsonb;
  v_patients int;
  v_appointments int;
  v_prescriptions int;
  v_consultations int;
begin
  if v_uid is null then
    raise exception 'Utilisateur non authentifié' using errcode = '42501';
  end if;

  -- Les policies bloqueraient de toute façon ; ce test donne un message clair.
  if not private.has_active_subscription(v_uid) then
    raise exception 'Abonnement inactif' using errcode = '42501';
  end if;

  if jsonb_typeof(p_patients) is distinct from 'array'
     or jsonb_typeof(p_appointments) is distinct from 'array'
     or jsonb_typeof(p_prescriptions) is distinct from 'array'
     or jsonb_typeof(p_consultations) is distinct from 'array' then
    raise exception 'Les listes patients, appointments, prescriptions et consultations doivent être des tableaux JSON'
      using errcode = '22023';
  end if;

  if p_doctor is not null and jsonb_typeof(p_doctor) <> 'object' then
    raise exception 'Le profil doit être un objet JSON' using errcode = '22023';
  end if;

  -- --------------------------------------------------------------------------
  -- 1. Effacement (ordre inverse des dépendances)
  -- --------------------------------------------------------------------------

  delete from public.consultations where practitioner_id = v_uid;
  delete from public.prescriptions where practitioner_id = v_uid;
  delete from public.appointments where practitioner_id = v_uid;
  delete from public.patients where practitioner_id = v_uid;

  -- --------------------------------------------------------------------------
  -- 2. Patients
  -- --------------------------------------------------------------------------
  -- "materialized" garantit un seul tirage de gen_random_uuid() par ligne,
  -- partagé entre l'insertion et la table de correspondance.

  with src as materialized (
    select e.value as v, gen_random_uuid() as new_id
    from jsonb_array_elements(p_patients) e
  ),
  ins as (
    insert into public.patients (
      id, practitioner_id, first_name, last_name, gender, birth_date, ssn, phone, email, address,
      blood_group, allergies, medical_history, chronic_treatments, emergency_contact, notes, created_at
    )
    select
      s.new_id, v_uid, r.first_name, r.last_name, r.gender, r.birth_date,
      coalesce(r.ssn, ''), coalesce(r.phone, ''), coalesce(r.email, ''), coalesce(r.address, ''),
      r.blood_group, coalesce(r.allergies, '{}'), coalesce(r.medical_history, '{}'),
      coalesce(r.chronic_treatments, '{}'), r.emergency_contact, r.notes, coalesce(r.created_at, now())
    from src s
    cross join lateral jsonb_populate_record(null::public.patients, s.v - 'id' - 'practitioner_id') r
    returning 1
  )
  select coalesce(jsonb_object_agg(s.v ->> 'id', s.new_id) filter (where s.v ? 'id'), '{}'::jsonb),
         (select count(*) from ins)
    into v_patient_map, v_patients
  from src s;

  -- --------------------------------------------------------------------------
  -- 3. Rendez-vous (patient obligatoire)
  -- --------------------------------------------------------------------------

  with src as materialized (
    select e.value as v, gen_random_uuid() as new_id,
           (v_patient_map ->> (e.value ->> 'patient_id'))::uuid as patient_id
    from jsonb_array_elements(p_appointments) e
    where v_patient_map ? (e.value ->> 'patient_id')
  ),
  ins as (
    insert into public.appointments (
      id, practitioner_id, patient_id, date, start_time, duration, type, status, reason, notes, fee,
      is_paid, payment_method, arrived_at, whatsapp_reminder_sent, whatsapp_reminder_sent_at,
      whatsapp_reminder_opt_out
    )
    select
      s.new_id, v_uid, s.patient_id, r.date, r.start_time, r.duration, r.type,
      coalesce(r.status, 'confirmed'), coalesce(r.reason, ''), r.notes, coalesce(r.fee, 0),
      coalesce(r.is_paid, false), r.payment_method, r.arrived_at,
      coalesce(r.whatsapp_reminder_sent, false), r.whatsapp_reminder_sent_at,
      coalesce(r.whatsapp_reminder_opt_out, false)
    from src s
    cross join lateral jsonb_populate_record(
      null::public.appointments, s.v - 'id' - 'practitioner_id' - 'patient_id'
    ) r
    returning 1
  )
  select coalesce(jsonb_object_agg(s.v ->> 'id', s.new_id) filter (where s.v ? 'id'), '{}'::jsonb),
         (select count(*) from ins)
    into v_appointment_map, v_appointments
  from src s;

  -- --------------------------------------------------------------------------
  -- 4. Ordonnances (patient obligatoire, rendez-vous facultatif)
  -- --------------------------------------------------------------------------

  with src as materialized (
    select e.value as v, gen_random_uuid() as new_id,
           (v_patient_map ->> (e.value ->> 'patient_id'))::uuid as patient_id,
           (v_appointment_map ->> (e.value ->> 'appointment_id'))::uuid as appointment_id
    from jsonb_array_elements(p_prescriptions) e
    where v_patient_map ? (e.value ->> 'patient_id')
  ),
  ins as (
    insert into public.prescriptions (
      id, practitioner_id, patient_id, appointment_id, date, medications, recommendations, created_at
    )
    select
      s.new_id, v_uid, s.patient_id, s.appointment_id, r.date, coalesce(r.medications, '[]'::jsonb),
      r.recommendations, coalesce(r.created_at, now())
    from src s
    cross join lateral jsonb_populate_record(
      null::public.prescriptions, s.v - 'id' - 'practitioner_id' - 'patient_id' - 'appointment_id'
    ) r
    returning 1
  )
  select coalesce(jsonb_object_agg(s.v ->> 'id', s.new_id) filter (where s.v ? 'id'), '{}'::jsonb),
         (select count(*) from ins)
    into v_prescription_map, v_prescriptions
  from src s;

  -- --------------------------------------------------------------------------
  -- 5. Consultations (patient et rendez-vous obligatoires, ordonnance facultative)
  -- --------------------------------------------------------------------------
  -- Une seule consultation par rendez-vous (index unique) : en cas de doublon
  -- dans le fichier, la première est gardée.

  with ins as (
    insert into public.consultations (
      id, practitioner_id, appointment_id, patient_id, date, time, reason, systolic_bp, diastolic_bp,
      heart_rate, weight, height, temperature, blood_sugar, soap, odontogram, prescription_id, notes
    )
    select
      gen_random_uuid(), v_uid,
      (v_appointment_map ->> (e.value ->> 'appointment_id'))::uuid,
      (v_patient_map ->> (e.value ->> 'patient_id'))::uuid,
      r.date, r.time, coalesce(r.reason, ''), r.systolic_bp, r.diastolic_bp, r.heart_rate, r.weight,
      r.height, r.temperature, r.blood_sugar, r.soap, r.odontogram,
      (v_prescription_map ->> (e.value ->> 'prescription_id'))::uuid,
      r.notes
    from jsonb_array_elements(p_consultations) e
    cross join lateral jsonb_populate_record(
      null::public.consultations,
      e.value - 'id' - 'practitioner_id' - 'patient_id' - 'appointment_id' - 'prescription_id'
    ) r
    where v_patient_map ? (e.value ->> 'patient_id')
      and v_appointment_map ? (e.value ->> 'appointment_id')
    on conflict (appointment_id) do nothing
    returning 1
  )
  select count(*) into v_consultations from ins;

  -- --------------------------------------------------------------------------
  -- 6. Profil (facultatif)
  -- --------------------------------------------------------------------------
  -- jsonb_populate_record(p, …) part de la ligne actuelle : une clé absente de
  -- p_doctor garde sa valeur. Seules les colonnes du profil sont listées ;
  -- l'abonnement n'est jamais touché (et le grant par colonne de 0009
  -- l'interdirait de toute façon).

  if p_doctor is not null then
    update public.practitioners p
    set (
      name, title, specialty, professional_order_number, ninea, phone, email, address, city,
      consultation_fee, default_duration, whatsapp_reminder_hours, whatsapp_custom_template,
      whatsapp_auto_prompt, is_public_listed, public_bio, accepts_new_patients
    ) = (
      select
        r.name, r.title, r.specialty, r.professional_order_number, r.ninea, r.phone, r.email, r.address,
        r.city, r.consultation_fee, r.default_duration, r.whatsapp_reminder_hours,
        r.whatsapp_custom_template, r.whatsapp_auto_prompt, r.is_public_listed, r.public_bio,
        r.accepts_new_patients
      from jsonb_populate_record(p, p_doctor) r
    )
    where p.id = v_uid;
  end if;

  return jsonb_build_object(
    'patients', v_patients,
    'appointments', v_appointments,
    'prescriptions', v_prescriptions,
    'consultations', v_consultations
  );
end;
$$;

revoke execute on function public.replace_cabinet_data(jsonb, jsonb, jsonb, jsonb, jsonb) from public, anon;
grant execute on function public.replace_cabinet_data(jsonb, jsonb, jsonb, jsonb, jsonb) to authenticated;
