# Essai gratuit + abonnement (gestion manuelle) pour MédicLab

## Contexte

MédicLab n'a aujourd'hui aucune restriction d'accès liée à un abonnement : tout compte inscrit a un accès complet et illimité, gratuitement, pour toujours. La table `practitioners` a bien une colonne `subscription_status` (texte, nullable) réservée dès la migration initiale (`supabase/migrations/0001_init.sql`), mais elle n'est ni lue ni écrite nulle part dans le code (`src/lib/db.ts` ne la mappe pas) : c'était volontairement hors périmètre à l'époque.

Décisions validées avec l'utilisateur pour cette étape :
- **Modèle** : essai gratuit de **30 jours**, puis un **abonnement unique** (pas de paliers Free/Pro/Premium pour l'instant).
- **Paiement** : **gestion manuelle**, pas d'intégration Stripe/Wave/Orange Money dans cette étape (pas de compte marchand créé). Le praticien paie hors-app ; l'utilisateur (admin) active manuellement le compte via le **Table Editor de Supabase** (pas de nouveau panneau d'administration à construire).
- **Restriction d'accès** : quand l'abonnement n'est pas actif (essai expiré, pas encore activé), l'application est **entièrement bloquée** — un écran « Abonnement requis » remplace l'app, avec un message générique (pas de tarif/contact précis à afficher pour l'instant).

Point d'architecture important : pour que le blocage soit réel (et pas seulement une façade côté client contournable via les DevTools), la vérification doit aussi être appliquée au niveau des **policies RLS** sur `patients`, `appointments`, `prescriptions`, `consultations` — pas seulement dans l'UI React. La policy `practitioners_self` reste inchangée (toujours lisible par son propriétaire), pour que l'app puisse lire son propre statut d'abonnement même une fois bloquée, et afficher l'écran adéquat.

## Approche

### 1. Migration SQL — `supabase/migrations/0002_subscriptions.sql` (nouveau)

- Ajouter la colonne `trial_ends_at timestamptz` sur `practitioners`.
- Convertir `subscription_status` (actuellement `text` libre) en enum Postgres `subscription_status_type` (`'trialing' | 'active' | 'expired' | 'cancelled'`), avec **backfill** des comptes existants (le compte démo et le compte de test créés avant cette fonctionnalité) vers `'active'` pour ne pas les bloquer rétroactivement.
- Mettre à jour la fonction trigger `handle_new_practitioner()` (déjà existante) pour initialiser tout nouveau compte avec `subscription_status = 'trialing'` et `trial_ends_at = now() + interval '30 days'`.
- Ajouter une fonction SQL `has_active_subscription(p_practitioner_id uuid) returns boolean` (actif, ou en essai non expiré) réutilisée dans les policies.
- Modifier les 4 policies `*_tenant_isolation` (patients, appointments, prescriptions, consultations) pour exiger en plus `has_active_subscription(practitioner_id)` dans `using` et `with check`. `practitioners_self` n'est pas touchée.

### 2. Types & couche de données

- `src/types.ts` : ajouter à `DoctorProfile` les champs `subscriptionStatus: 'trialing' | 'active' | 'expired' | 'cancelled'` et `trialEndsAt?: string`.
- `src/lib/db.ts` : mapper ces deux champs dans `rowToDoctorProfile` (déjà la fonction centrale de conversion snake_case → camelCase pour `practitioners`).
- Nouveau `src/utils/subscriptionUtils.ts` : fonction pure `hasActiveSubscription(doctor: DoctorProfile): boolean` (même logique que la fonction SQL, côté client) + `getTrialDaysRemaining(doctor: DoctorProfile): number | null`, réutilisées par le gate et par un bandeau d'essai optionnel dans l'app.

### 3. UI

- Nouveau `src/components/SubscriptionRequiredScreen.tsx` : écran plein écran (même style que `AuthScreen.tsx`) affiché quand `!hasActiveSubscription(doctor)`. Message générique (« Votre période d'essai est terminée » / « Abonnement inactif »), pas de tarif ni contact précis, bouton **Déconnexion** (réutilise `supabase.auth.signOut()` comme dans `SettingsModal.tsx`).
- `src/App.tsx` : après le chargement du profil praticien (déjà fait dans le `useEffect` initial), si `!hasActiveSubscription(doctor)`, rendre `<SubscriptionRequiredScreen>` à la place de l'app plutôt que `<AgendaView>` etc. Ajout ponctuel, pas de refonte du composant.
- Bandeau discret optionnel pendant l'essai (ex: « Il vous reste 12 jours d'essai gratuit »), même style que le bandeau rappels WhatsApp déjà présent dans `App.tsx` — affiché seulement si `subscriptionStatus === 'trialing'`.
- `src/components/SettingsModal.tsx` : nouvelle section « Abonnement » en lecture seule affichant le statut courant et, si en essai, la date de fin — pas de bouton de paiement (géré manuellement hors app pour cette étape).

### 4. Fichiers concernés

- Nouveau : `supabase/migrations/0002_subscriptions.sql`, `src/utils/subscriptionUtils.ts`, `src/components/SubscriptionRequiredScreen.tsx`.
- Modifiés : `src/types.ts`, `src/lib/db.ts`, `src/App.tsx`, `src/components/SettingsModal.tsx`.
- Aucun changement côté Vercel/déploiement — le build/déploiement existant (`https://medic-lab-ivory.vercel.app`) reprend automatiquement ces changements au prochain push sur `master`.

## Vérification

1. Appliquer `0002_subscriptions.sql` sur le projet Supabase (SQL Editor, comme pour la migration initiale).
2. Vérifier dans le Table Editor que le compte démo (`salkagroup05@gmail.com`) et le compte de test sont bien passés à `subscription_status = 'active'` (non bloqués par le backfill).
3. `npm run typecheck` et `npm run lint` sans erreur.
4. En local (`npm run dev`) : créer un nouveau compte de test → vérifier qu'il démarre en `trialing` avec `trial_ends_at` à J+30, et qu'il a accès normal à l'app (bandeau d'essai visible).
5. Simuler l'expiration : dans le Table Editor Supabase, mettre manuellement `trial_ends_at` de ce compte de test dans le passé → recharger l'app → l'écran « Abonnement requis » doit s'afficher à la place de l'app.
6. Vérifier le blocage aussi côté base : avec ce même compte expiré, une requête directe (`fetch` vers l'API REST Supabase avec son token) sur `patients` doit renvoyer un résultat vide/refusé grâce à la policy RLS mise à jour — pas seulement un blocage visuel.
7. Réactiver manuellement (`subscription_status = 'active'`) → vérifier que l'accès revient immédiatement.
8. Commit + push (si l'utilisateur le demande) pour déployer sur Vercel, puis revérifier le même scénario en production.
