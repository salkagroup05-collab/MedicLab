-- SunuMed — corrections issues du diagnostic du code
--
-- 1. save_consultation : la consultation et le rendez-vous associé (statut,
--    paiement) étaient enregistrés en deux appels REST. Si le second échouait,
--    la consultation existait avec un RDV resté « en cours ». Les deux
--    écritures passent désormais dans une seule transaction.
--    prescription_id et notes ne sont modifiés que si la clé est présente dans
--    le JSON : un nouvel enregistrement ne coupe plus le lien vers une
--    ordonnance déjà rattachée.
-- 2. Index sur les clés étrangères composites sans index (0010) : sans eux,
--    supprimer un RDV ou une ordonnance parcourt toute la table pour appliquer
--    le "on delete set null".
-- 3. replace_cabinet_data : plafond sur la taille des tableaux reçus.
-- 4. log_cabinet_export : l'export JSON complet est tracé dans access_log.
-- 5. handle_new_practitioner : nom et spécialité tronqués à 200 caractères,
--    pour qu'une saisie trop longue ne fasse pas échouer l'inscription sur la
--    contrainte de taille (0012).

begin;

-- ============================================================================
-- 1. save_consultation
-- ============================================================================
-- security invoker : RLS (cabinet = auth.uid(), abonnement actif) et clés
-- étrangères composites s'appliquent comme pour des requêtes REST directes.

create or replace function public.save_consultation(p_consultation jsonb, p_appointment jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  c public.consultations;
  a public.appointments;
  v_cons public.consultations;
  v_apt public.appointments;
begin
  if v_uid is null then
    raise exception 'Utilisateur non authentifié' using errcode = '42501';
  end if;
  if jsonb_typeof(p_consultation) <> 'object' or jsonb_typeof(coalesce(p_appointment, '{}'::jsonb)) <> 'object' then
    raise exception 'Paramètres invalides' using errcode = '22023';
  end if;

  c := jsonb_populate_record(null::public.consultations, p_consultation - 'id' - 'practitioner_id');

  insert into public.consultations (
    practitioner_id, appointment_id, patient_id, date, time, reason,
    systolic_bp, diastolic_bp, heart_rate, weight, height, temperature, blood_sugar,
    soap, odontogram, prescription_id, notes
  )
  values (
    v_uid, c.appointment_id, c.patient_id, c.date, c.time, coalesce(c.reason, ''),
    c.systolic_bp, c.diastolic_bp, c.heart_rate, c.weight, c.height, c.temperature, c.blood_sugar,
    c.soap, c.odontogram, c.prescription_id, c.notes
  )
  on conflict (appointment_id) do update set
    patient_id = excluded.patient_id,
    date = excluded.date,
    time = excluded.time,
    reason = excluded.reason,
    systolic_bp = excluded.systolic_bp,
    diastolic_bp = excluded.diastolic_bp,
    heart_rate = excluded.heart_rate,
    weight = excluded.weight,
    height = excluded.height,
    temperature = excluded.temperature,
    blood_sugar = excluded.blood_sugar,
    soap = excluded.soap,
    odontogram = excluded.odontogram,
    prescription_id = case when p_consultation ? 'prescription_id'
                           then excluded.prescription_id else consultations.prescription_id end,
    notes = case when p_consultation ? 'notes' then excluded.notes else consultations.notes end
  returning * into v_cons;

  -- RLS filtre l'upsert : sans ligne retournée, le RDV n'appartient pas au cabinet.
  if v_cons.id is null then
    raise exception 'Consultation refusée' using errcode = '42501';
  end if;

  a := jsonb_populate_record(null::public.appointments, coalesce(p_appointment, '{}'::jsonb));

  update public.appointments set
    status = case when p_appointment ? 'status' then a.status else status end,
    is_paid = case when p_appointment ? 'is_paid' then a.is_paid else is_paid end,
    payment_method = case when p_appointment ? 'payment_method' then a.payment_method else payment_method end,
    fee = case when p_appointment ? 'fee' then a.fee else fee end
  where id = v_cons.appointment_id and practitioner_id = v_uid
  returning * into v_apt;

  if v_apt.id is null then
    raise exception 'Rendez-vous introuvable' using errcode = 'P0002';
  end if;

  return jsonb_build_object('consultation', to_jsonb(v_cons), 'appointment', to_jsonb(v_apt));
end;
$$;

revoke execute on function public.save_consultation(jsonb, jsonb) from public, anon;
grant execute on function public.save_consultation(jsonb, jsonb) to authenticated;

-- ============================================================================
-- 2. Index des clés étrangères composites
-- ============================================================================

create index if not exists prescriptions_appointment_idx
  on public.prescriptions (practitioner_id, appointment_id);
create index if not exists consultations_prescription_idx
  on public.consultations (practitioner_id, prescription_id);

-- ============================================================================
-- 3. replace_cabinet_data : plafond sur la taille des tableaux
-- ============================================================================
-- Même enveloppe que 0012, avec un contrôle de taille avant tout effacement.

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
  v_result jsonb;
  v_max constant int := 50000;
begin
  if (jsonb_typeof(p_patients) = 'array' and jsonb_array_length(p_patients) > v_max)
     or (jsonb_typeof(p_appointments) = 'array' and jsonb_array_length(p_appointments) > v_max)
     or (jsonb_typeof(p_prescriptions) = 'array' and jsonb_array_length(p_prescriptions) > v_max)
     or (jsonb_typeof(p_consultations) = 'array' and jsonb_array_length(p_consultations) > v_max) then
    raise exception 'Fichier trop volumineux : % lignes maximum par type de donnée', v_max
      using errcode = '22023';
  end if;

  perform set_config('sunumed.bulk_replace', 'on', true);
  v_result := private.replace_cabinet_data(p_patients, p_appointments, p_prescriptions, p_consultations, p_doctor);
  perform set_config('sunumed.bulk_replace', 'off', true);
  perform private.write_access_log('replace', 'cabinet', null, null, v_result);
  return v_result;
end;
$$;

revoke execute on function public.replace_cabinet_data(jsonb, jsonb, jsonb, jsonb, jsonb) from public, anon;
grant execute on function public.replace_cabinet_data(jsonb, jsonb, jsonb, jsonb, jsonb) to authenticated;

-- ============================================================================
-- 4. Journalisation de l'export complet
-- ============================================================================

create or replace function public.log_cabinet_export(p_details jsonb default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_details is not null and octet_length(p_details::text) > 1000 then
    raise exception 'Détails trop volumineux' using errcode = '22023';
  end if;
  perform private.write_access_log('export', 'cabinet', null, null, p_details);
end;
$$;

revoke execute on function public.log_cabinet_export(jsonb) from public, anon;
grant execute on function public.log_cabinet_export(jsonb) to authenticated;

-- ============================================================================
-- 5. Inscription : troncature des métadonnées
-- ============================================================================

create or replace function public.handle_new_practitioner()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.practitioners (id, name, email, specialty, subscription_status, trial_ends_at)
  values (
    new.id,
    left(btrim(coalesce(new.raw_user_meta_data->>'name', '')), 200),
    new.email,
    left(btrim(coalesce(new.raw_user_meta_data->>'specialty', '')), 200),
    'trialing',
    now() + interval '30 days'
  );
  return new;
end;
$$;

commit;
