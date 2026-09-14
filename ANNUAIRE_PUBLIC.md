# Annuaire public des professionnels ("Trouver un professionnel")

## Contexte

MédicLab est aujourd'hui un SaaS 100% B2B : chaque praticien s'inscrit, se connecte et gère son propre cabinet (agenda, patients, ordonnances) dans un espace totalement isolé (`practitioner_id = auth.uid()`). Il n'existe aucune page publique : tout, y compris la page d'accueil, reste derrière l'authentification (`src/main.tsx`), puis derrière la validation de l'abonnement/essai (`App.tsx`).

Le besoin exprimé : permettre à des **patients (non connectés)** de **rechercher et trouver des professionnels de santé** déjà inscrits sur MédicLab (nom, spécialité, ville, contact). Décisions confirmées avec l'utilisateur :
- Portée = **annuaire public de consultation** (recherche + fiche contact), **pas** de prise de RDV en ligne pour cette phase.
- Visibilité **opt-in explicite** : un praticien est invisible par défaut et doit activer "Être visible dans l'annuaire" + compléter un mini profil public dans ses Paramètres.

Ce changement doit rester additif : ne rien casser du flux authentifié existant, et n'exposer publiquement qu'un sous-ensemble de colonnes sûres (jamais l'email, le N° Ordre, le NINEA, ni les données d'abonnement).

## 1. Migration Supabase — `supabase/migrations/0004_public_directory.sql`

Nouvelle migration (à appliquer via le SQL editor du dashboard Supabase, comme les 3 précédentes — pas de CLI locale configurée dans ce repo) :

- Ajoute 3 colonnes à `public.practitioners` : `is_public_listed boolean not null default false`, `public_bio text not null default ''`, `accepts_new_patients boolean not null default true`.
- Un index partiel `where is_public_listed = true`.
- Un unique point d'accès public : une fonction `security definer` `public.list_public_practitioners()` (même pattern déjà utilisé pour `has_active_subscription()` dans `0002_subscriptions.sql`), qui `returns table` avec uniquement les colonnes sûres (`id, name, title, specialty, phone, address, city, public_bio, accepts_new_patients`), filtrées sur `is_public_listed = true and has_active_subscription(p.id)` (un praticien dont l'abonnement a expiré n'apparaît plus dans l'annuaire — cohérent avec le reste du gating). `grant execute` à `anon, authenticated`.
- `revoke select, insert, update, delete on public.practitioners from anon` en durcissement défensif : la policy `practitioners_self` existante (`using (id = auth.uid())`) reste inchangée et continue de ne servir que le praticien connecté à lui-même — le rôle anonyme ne doit jamais toucher la table brute, seulement la fonction RPC.

Cette approche (RPC `security definer` avec allowlist de colonnes explicite dans le `returns table`) évite tout risque de fuite de colonne — contrairement à une policy `for select using (true)` sur la table brute qui exposerait email/onms/ninea/subscription_status.

## 2. Type et data layer

**`src/types.ts`** : étendre `DoctorProfile` avec `isPublicListed: boolean`, `publicBio: string`, `acceptsNewPatients: boolean`. Ajouter un nouveau type dédié `PublicPractitioner` (volontairement séparé de `DoctorProfile`, pour que le sous-ensemble "sûr" soit explicite dans le code, pas seulement en SQL) avec les 9 champs exposés par le RPC.

**`src/lib/db.ts`** :
- `PractitionerRow` : ajouter les 3 colonnes snake_case.
- `rowToDoctorProfile` / `doctorProfileToRow` : mapper les 3 nouveaux champs.
- `resetToDemoData` : inclure les 3 champs dans le payload de reset.
- Nouveau bloc "annuaire public" : `loadPublicPractitioners()` qui appelle `supabase.rpc('list_public_practitioners')` et mappe le résultat vers `PublicPractitioner[]`.

**`src/data/mockData.ts`** : `initialDoctorProfile` doit fournir les 3 nouveaux champs requis (`isPublicListed: false, publicBio: '', acceptsNewPatients: true`) pour que le typecheck passe.

## 3. Liste des spécialités — `src/constants.ts`

Ajouter une constante exportée `MEDICAL_SPECIALTIES: string[]` (liste française curée, incluant "Médecine Générale") utilisée à la fois par le sélecteur de spécialité dans les Paramètres praticien et par le filtre de l'annuaire public.

Ne **pas** réutiliser/refactorer `SPECIALTY_PRESETS` (local à `src/components/ReferralLetterModal.tsx`) : cette liste associe à chaque spécialité un texte de lettre de correspondance différent et exclut délibérément "Médecine Générale" — la fusionner casserait cette logique. `MEDICAL_SPECIALTIES` est une liste parallèle et indépendante, ajout pur sans toucher `ReferralLetterModal.tsx`.

## 4. Paramètres praticien — `src/components/SettingsModal.tsx`

- Remplacer le champ libre "Spécialité" (`SettingsModal.tsx:163-173`) par un `<select>` alimenté par `MEDICAL_SPECIALTIES`, avec repli "Autre (préciser)" + `<input>` texte libre pour ne jamais écraser silencieusement une valeur existante qui ne serait pas dans la liste.
- Nouveau bloc "Annuaire Public MédicLab" (carte visuellement distincte, ex. indigo, à la suite des sections existantes, avant les boutons de soumission) : checkbox "Être visible dans l'annuaire", et si activé — checkbox "J'accepte de nouveaux patients" + textarea "Présentation publique" (limite ~500 caractères) avec le texte d'avertissement précisant explicitement quelles données deviennent publiques (nom, titre, spécialité, ville, adresse, téléphone, bio) et lesquelles ne le sont jamais (email, N° Ordre, NINEA, abonnement).
- `handleSubmit` : garde-fou (`alert`, même convention que `PatientFormModal`) exigeant ville + spécialité renseignées si `isPublicListed` est activé ; inclure les 3 nouveaux champs dans l'objet `updated` envoyé à `onSaveDoctor`.

Pas de changement nécessaire dans `App.tsx` : `handleSaveDoctor` transmet déjà l'objet `DoctorProfile` complet à `updateDoctorProfile`.

## 5. Point d'entrée public — `src/main.tsx`, `src/components/AuthScreen.tsx`

Il n'existe aucune librairie de routing dans l'app. Solution minimale et non-invasive :

- Dans `src/main.tsx`, évaluer `window.location.pathname === '/annuaire'` **avant** d'appeler `useSession()` (pour ne pas faire d'aller-retour Supabase Auth inutile sur la page publique, et respecter les rules of hooks). Extraire la logique actuelle de `Root()` dans un composant `AuthenticatedRoot` inchangé, et un nouveau `Root()` qui route entre `PublicDirectoryView` et `AuthenticatedRoot` selon le chemin.
- Dans `AuthScreen.tsx`, ajouter un lien discret sous la carte de connexion : "Vous êtes un patient ? Trouver un professionnel de santé →" (`<a href="/annuaire">`, rechargement complet volontaire puisqu'il n'y a pas de router côté client).
- Dans la nouvelle page publique, un lien retour "Espace praticien" vers `/`.
- **Point de vigilance déploiement** (à signaler, pas à résoudre ici) : aucun `netlify.toml`/`vercel.json`/`_redirects` n'existe dans le repo. Un accès direct ou un rafraîchissement sur `/annuaire` en production nécessitera une règle de fallback SPA (`/* → /index.html`) côté hébergeur — à vérifier avec la personne qui gère le déploiement.

## 6. Nouvelle vue — `src/components/public/PublicDirectoryView.tsx`

Nouveau dossier `src/components/public/` (signale une surface non-authentifiée). Pattern proche de `PatientsView.tsx` (recherche + filtres côté client via `useState`/`.filter()`, carte toolbar `bg-white p-4 rounded-xl border border-slate-200 shadow-2xs`), mais en grille de cartes plutôt qu'en vue maître-détail (audience publique, pas de détail clinique) :

- Header autonome avec le branding MédicLab (logo `Stethoscope` bleu, comme `Header.tsx`) + lien "Espace praticien".
- Chargement de `loadPublicPractitioners()` au montage (`useEffect`), avec états loading / erreur / vide gérés explicitement.
- Barre de recherche texte libre (nom/spécialité/ville) + filtre spécialité (`MEDICAL_SPECIALTIES`) + filtre ville (dérivé dynamiquement des résultats chargés).
- Grille responsive de cartes praticien : nom/titre, badge spécialité, adresse/ville, téléphone (`tel:`), bio, badge "accepte de nouveaux patients" ou non.

## Vérification

1. `npm run typecheck` et `npm run lint` — doivent passer, y compris après l'ajout des 3 champs obligatoires à `DoctorProfile` (vérifier que `mockData.ts` et `db.ts` sont bien les seuls points d'impact).
2. Appliquer `0004_public_directory.sql` via le SQL editor Supabase.
3. Test manuel bout-en-bout :
   - Se connecter avec un compte praticien existant → vérifier que les Paramètres se chargent/sauvegardent toujours correctement (non-régression sur le changement de forme de `PractitionerRow`/`DoctorProfile`), et que le sélecteur de spécialité affiche bien le repli "Autre" pour une valeur libre préexistante.
   - Activer "Être visible dans l'annuaire", renseigner ville + spécialité + bio, sauvegarder, rouvrir les Paramètres pour confirmer la persistance.
   - Se déconnecter, aller sur `/annuaire` (lien depuis l'écran de connexion) : le praticien doit apparaître ; tester la recherche texte et les filtres spécialité/ville.
   - Vérifier qu'un praticien **non** opt-in n'apparaît pas.
   - Désactiver la visibilité, confirmer sa disparition de l'annuaire au rechargement suivant.
   - Dans les DevTools (onglet Réseau) sur `/annuaire` : confirmer que seul l'appel `POST .../rest/v1/rpc/list_public_practitioners` est effectué (aucun `GET .../rest/v1/practitioners`), et que sa réponse ne contient jamais email/onms/ninea/subscription_status/trial_ends_at/whatsapp_*.
   - Confirmer qu'un praticien avec un abonnement expiré déclenche toujours `SubscriptionRequiredScreen` à la connexion, et n'apparaît plus dans l'annuaire.

## Hors périmètre (phases suivantes)

Prise de RDV en ligne, upload de photo de profil, géolocalisation/carte, pagination/recherche côté serveur (le chargement complet côté client suffit au volume attendu), protection anti-abus au-delà des limites par défaut de Supabase/PostgREST, balises SEO dédiées, configuration de fallback SPA côté hébergeur.
