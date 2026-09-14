-- MédicLab — capture de la spécialité dès l'inscription
-- Le formulaire de création de compte demande désormais la spécialité du
-- praticien ; on la propage depuis auth.users.raw_user_meta_data vers
-- practitioners.specialty, comme c'est déjà le cas pour "name".

create or replace function public.handle_new_practitioner()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.practitioners (id, name, email, specialty, subscription_status, trial_ends_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    new.email,
    coalesce(new.raw_user_meta_data->>'specialty', ''),
    'trialing',
    now() + interval '30 days'
  );
  return new;
end;
$$;
