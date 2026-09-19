-- SunuMed — points faibles de l'audit de sécurité
--
-- 1. Limites de taille sur les champs texte, tableaux et jsonb : sans elles, un
--    client pouvait envoyer des valeurs de plusieurs Mo et gonfler le stockage.
--    Les plafonds sont larges, bien au-delà d'un usage normal : ils ne visent
--    que les abus.
-- 2. protect_subscription_fields (0003) n'utilise plus auth.role(), déprécié
--    par Supabase.
-- 3. Journal d'accès aux dossiers (access_log) : qui a créé, modifié,
--    supprimé, consulté ou exporté quoi, et quand. En ajout seul : aucun rôle
--    client ne peut y écrire directement, ni le modifier, ni le vider.

begin;

-- ============================================================================
-- 1. Limites de taille
-- ============================================================================
-- Si une donnée existante dépasse une limite, l'ajout de la contrainte échoue
-- en nommant la contrainte, et la transaction entière est annulée.

alter table public.practitioners
  add constraint practitioners_text_length_check check (
    char_length(name) <= 200 and char_length(title) <= 200 and char_length(specialty) <= 200
    and char_length(coalesce(professional_order_number, '')) <= 200
    and char_length(coalesce(ninea, '')) <= 200
    and char_length(phone) <= 200 and char_length(email) <= 320 and char_length(city) <= 200
    and char_length(address) <= 500
    and char_length(coalesce(whatsapp_custom_template, '')) <= 2000
    and char_length(public_bio) <= 1000
  );

alter table public.patients
  add constraint patients_text_length_check check (
    char_length(first_name) <= 200 and char_length(last_name) <= 200
    and char_length(ssn) <= 200 and char_length(phone) <= 200 and char_length(email) <= 320
    and char_length(address) <= 500 and char_length(coalesce(blood_group, '')) <= 20
    and char_length(coalesce(notes, '')) <= 10000
  ),
  add constraint patients_lists_size_check check (
    coalesce(cardinality(allergies), 0) <= 200
    and coalesce(cardinality(medical_history), 0) <= 200
    and coalesce(cardinality(chronic_treatments), 0) <= 200
    and char_length(array_to_string(allergies, '')) <= 20000
    and char_length(array_to_string(medical_history, '')) <= 20000
    and char_length(array_to_string(chronic_treatments, '')) <= 20000
  ),
  add constraint patients_emergency_contact_size_check check (
    emergency_contact is null or octet_length(emergency_contact::text) <= 4000
  );

alter table public.appointments
  add constraint appointments_text_length_check check (
    char_length(reason) <= 1000 and char_length(coalesce(notes, '')) <= 10000
  );

alter table public.prescriptions
  add constraint prescriptions_size_check check (
    char_length(coalesce(recommendations, '')) <= 10000
    and octet_length(medications::text) <= 100000
  );

alter table public.consultations
  add constraint consultations_size_check check (
    char_length(reason) <= 1000 and char_length(coalesce(notes, '')) <= 10000
    and octet_length(soap::text) <= 200000
    and (odontogram is null or octet_length(odontogram::text) <= 100000)
  );

-- ============================================================================
-- 2. protect_subscription_fields sans auth.role()
-- ============================================================================
-- current_user vaut 'authenticated' (ou 'anon') pour toute requête PostgREST
-- d'un utilisateur final, y compris à l'intérieur de replace_cabinet_data
-- (security invoker). La lecture du rôle dans le JWT couvre en plus un
-- éventuel appel depuis une fonction security definer. Dashboard (postgres)
-- et clé service_role restent autorisés, comme avant.

create or replace function public.protect_subscription_fields()
returns trigger language plpgsql set search_path = public as $$
begin
  if current_user in ('anon', 'authenticated')
     or coalesce(auth.jwt() ->> 'role', '') in ('anon', 'authenticated') then
    new.subscription_status := old.subscription_status;
    new.trial_ends_at := old.trial_ends_at;
  end if;
  return new;
end;
$$;

-- ============================================================================
-- 3. Journal d'accès
-- ============================================================================
-- Pas de clé étrangère : une entrée doit survivre à la suppression du patient
-- ou de la ligne concernée. Le journal d'un cabinet est effacé avec le compte
-- (trigger sur practitioners plus bas). Aucune donnée médicale n'y est
-- recopiée : pour une modification, seuls les noms des champs changés.

create table public.access_log (
  id bigint generated always as identity primary key,
  practitioner_id uuid not null,
  actor_id uuid,  -- auth.uid() ; null si l'action vient du Dashboard ou de service_role
  occurred_at timestamptz not null default now(),
  action text not null check (action in ('insert', 'update', 'delete', 'view', 'export', 'replace')),
  entity text not null check (entity in ('patient', 'appointment', 'prescription', 'consultation', 'cabinet')),
  record_id uuid,
  patient_id uuid,
  details jsonb
);

create index access_log_practitioner_idx on public.access_log (practitioner_id, occurred_at desc);
create index access_log_patient_idx on public.access_log (practitioner_id, patient_id, occurred_at desc);

alter table public.access_log enable row level security;

create policy access_log_select_self on public.access_log
  for select using (practitioner_id = auth.uid());

revoke all on public.access_log from anon, authenticated;
grant select on public.access_log to authenticated;

-- Écriture d'une entrée, réservée aux fonctions ci-dessous (schéma private,
-- non exposé à l'API).
create or replace function private.write_access_log(
  p_action text, p_entity text, p_record_id uuid, p_patient_id uuid, p_details jsonb
)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    raise exception 'Utilisateur non authentifié' using errcode = '42501';
  end if;
  insert into public.access_log (practitioner_id, actor_id, action, entity, record_id, patient_id, details)
  values (auth.uid(), auth.uid(), p_action, p_entity, p_record_id, p_patient_id, p_details);
end;
$$;

revoke execute on function private.write_access_log(text, text, uuid, uuid, jsonb) from public, anon;
grant execute on function private.write_access_log(text, text, uuid, uuid, jsonb) to authenticated;

-- Création / modification / suppression : triggers sur les 4 tables métier.
create or replace function private.log_row_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_row jsonb := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  v_practitioner uuid := (v_row ->> 'practitioner_id')::uuid;
  v_changed jsonb;
begin
  -- replace_cabinet_data écrit une seule entrée récapitulative.
  if coalesce(current_setting('sunumed.bulk_replace', true), '') = 'on' then
    return null;
  end if;

  -- Suppression du compte : les lignes partent en cascade, rien à journaliser.
  if not exists (select 1 from public.practitioners where id = v_practitioner) then
    return null;
  end if;

  if tg_op = 'UPDATE' then
    select coalesce(jsonb_agg(n.key order by n.key), '[]'::jsonb)
      into v_changed
    from jsonb_each(to_jsonb(new)) n
    where n.value is distinct from (to_jsonb(old) -> n.key);
    if v_changed = '[]'::jsonb then
      return null;
    end if;
  end if;

  insert into public.access_log (practitioner_id, actor_id, action, entity, record_id, patient_id, details)
  values (
    v_practitioner,
    auth.uid(),
    lower(tg_op),
    tg_argv[0],
    (v_row ->> 'id')::uuid,
    case when tg_table_name = 'patients' then (v_row ->> 'id')::uuid else (v_row ->> 'patient_id')::uuid end,
    case when tg_op = 'UPDATE' then jsonb_build_object('fields', v_changed) end
  );
  return null;
end;
$$;

create trigger patients_access_log after insert or update or delete on public.patients
  for each row execute function private.log_row_change('patient');
create trigger appointments_access_log after insert or update or delete on public.appointments
  for each row execute function private.log_row_change('appointment');
create trigger prescriptions_access_log after insert or update or delete on public.prescriptions
  for each row execute function private.log_row_change('prescription');
create trigger consultations_access_log after insert or update or delete on public.consultations
  for each row execute function private.log_row_change('consultation');

-- Suppression d'un compte : son journal part avec lui.
create or replace function private.purge_access_log()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from public.access_log where practitioner_id = old.id;
  return old;
end;
$$;

create trigger practitioners_purge_access_log before delete on public.practitioners
  for each row execute function private.purge_access_log();

-- Import / réinitialisation : l'ancienne fonction (0011) passe dans private, et
-- une enveloppe de même signature coupe la journalisation ligne par ligne puis
-- écrit une entrée récapitulative. Le client n'a rien à changer.
alter function public.replace_cabinet_data(jsonb, jsonb, jsonb, jsonb, jsonb) set schema private;

create function public.replace_cabinet_data(
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
begin
  perform set_config('sunumed.bulk_replace', 'on', true);
  v_result := private.replace_cabinet_data(p_patients, p_appointments, p_prescriptions, p_consultations, p_doctor);
  perform set_config('sunumed.bulk_replace', 'off', true);
  perform private.write_access_log('replace', 'cabinet', null, null, v_result);
  return v_result;
end;
$$;

revoke execute on function public.replace_cabinet_data(jsonb, jsonb, jsonb, jsonb, jsonb) from public, anon;
grant execute on function public.replace_cabinet_data(jsonb, jsonb, jsonb, jsonb, jsonb) to authenticated;

-- Consultation et export : les lectures (SELECT) ne déclenchent pas de
-- trigger, l'app signale donc elle-même l'ouverture d'un dossier ou un export.
-- Seules ces deux actions sont acceptées, et seulement sur un patient du
-- cabinet de l'appelant : impossible de fabriquer une fausse suppression ou de
-- polluer le journal d'un autre cabinet.
create or replace function public.log_patient_access(p_patient_id uuid, p_action text, p_details jsonb default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_action not in ('view', 'export') then
    raise exception 'Action non autorisée' using errcode = '22023';
  end if;
  if p_details is not null and octet_length(p_details::text) > 1000 then
    raise exception 'Détails trop volumineux' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.patients where id = p_patient_id and practitioner_id = auth.uid()
  ) then
    raise exception 'Patient introuvable' using errcode = '42501';
  end if;
  perform private.write_access_log(p_action, 'patient', p_patient_id, p_patient_id, p_details);
end;
$$;

revoke execute on function public.log_patient_access(uuid, text, jsonb) from public, anon;
grant execute on function public.log_patient_access(uuid, text, jsonb) to authenticated;

-- Lecture pour l'écran Paramètres, avec le nom actuel du patient (null s'il a
-- été supprimé depuis). security invoker : RLS de access_log et patients.
create or replace function public.list_access_log(p_limit int default 100)
returns table (
  occurred_at timestamptz,
  action text,
  entity text,
  record_id uuid,
  patient_id uuid,
  patient_name text,
  details jsonb,
  by_dashboard boolean
)
language sql stable security invoker set search_path = public as $$
  select l.occurred_at, l.action, l.entity, l.record_id, l.patient_id,
         nullif(trim(coalesce(p.first_name, '') || ' ' || coalesce(p.last_name, '')), ''),
         l.details, l.actor_id is null
  from public.access_log l
  left join public.patients p on p.id = l.patient_id
  where l.practitioner_id = auth.uid()
  order by l.occurred_at desc, l.id desc
  limit least(greatest(coalesce(p_limit, 100), 1), 500);
$$;

revoke execute on function public.list_access_log(int) from public, anon;
grant execute on function public.list_access_log(int) to authenticated;

commit;
