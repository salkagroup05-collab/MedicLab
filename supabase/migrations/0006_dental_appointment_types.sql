-- Ajoute des types de rendez-vous spécifiques à l'exercice dentaire.
-- Important : ALTER TYPE ... ADD VALUE doit être commité seul, dans sa propre
-- migration, avant qu'aucune requête ne référence les nouvelles valeurs —
-- ce fichier ne doit contenir que ces trois lignes.

alter type appointment_type add value 'soins_dentaires';
alter type appointment_type add value 'detartrage';
alter type appointment_type add value 'extraction_dentaire';
