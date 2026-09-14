-- Le champ "onms" (Ordre National des Médecins du Sénégal) supposait un
-- médecin ; renommé en un nom neutre car le libellé affiché à l'utilisateur
-- dépend désormais de la spécialité (voir getProfessionalOrderLabel côté app).

alter table public.practitioners rename column onms to professional_order_number;
