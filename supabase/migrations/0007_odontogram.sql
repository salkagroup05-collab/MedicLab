-- Schéma dentaire (odontogramme) : passthrough JSONB opaque, même schéma que
-- consultations.soap / patients.emergency_contact. Clé = numéro de dent en
-- notation FDI ('11'..'48'), valeur = { status, note? }.

alter table public.consultations add column odontogram jsonb;
