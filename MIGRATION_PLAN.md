# Migration Cabinet Santé vers un SaaS multi-cabinets (Supabase Auth + Postgres)

## Contexte

**Cabinet Santé** est aujourd'hui une application 100% cliente (React 19 + Vite + TypeScript) : aucune authentification, aucun backend, toutes les données (praticien, patients, rendez-vous, consultations, ordonnances) sont stockées dans le `LocalStorage` du navigateur. C'est un mono-cabinet local, pas un SaaS.

L'objectif exprimé par l'utilisateur est de transformer ce projet en un véritable SaaS où **plusieurs professionnels de santé indépendants peuvent s'abonner (créer un compte) et gérer chacun leurs propres rendez-vous, patients et données**, de façon totalement isolée les uns des autres.

Décisions déjà validées avec l'utilisateur :
- **Backend : Supabase** (Postgres + Auth + client JS), pour aller vite avec un minimum de code serveur à écrire/maintenir.
- **Paiement / abonnement réel : hors périmètre** de cette étape. On prépare seulement le terrain (une colonne `subscription_status` nullable) sans construire de page tarifs ni de logique de facturation — ce sera une étape suivante.
- **Priorité de cette étape : authentification + isolation multi-cabinets (multi-tenant)**, pas encore l'abonnement payant.
- Confirmation email obligatoire à l'inscription.
- Le bouton « Réinitialiser avec données de démo » est conservé mais avec une confirmation explicite avant d'écraser des données réelles.
- Pas de fonctionnalité de migration automatique des anciennes données LocalStorage — les nouveaux comptes démarrent vides (l'export/import JSON existant reste disponible comme sauvegarde générale, réutilisable manuellement si un utilisateur le souhaite).

Chaque praticien qui s'inscrit doit obtenir son propre espace isolé (aucune fuite de données entre cabinets), appliqué au niveau base de données via Row Level Security (RLS), pas seulement au niveau de l'interface.

---

## Conception du schéma Postgres (Supabase)

### Table `practitioners` (remplace `DoctorProfile`, une ligne = un compte = un cabinet)

Clé primaire = `auth.users.id` (lien 1:1 structurel avec Supabase Auth, pas un simple FK) :

```sql
create table public.practitioners (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  title text not null default 'Dr.',
  specialty text not null default '',
  onms text,
  ninea text,
  phone text not null default '',
  email text not null default '',
  address text not null default '',
  city text not null default '',
  consultation_fee numeric(10,2) not null default 0,
  default_duration int not null default 30,
  whatsapp_reminder_hours int,
  whatsapp_custom_template text,
  whatsapp_auto_prompt boolean default false,
  subscription_status text, -- colonne de compatibilité future, non utilisée dans cette phase
  created_at timestamptz not null default now()
);
```

### Enums

```sql
create type appointment_type as enum ('consultation','suivi','urgence','teleconsultation','bilan','vaccination');
create type appointment_status as enum ('confirmed','waiting','in_progress','completed','cancelled','no_show');
create type payment_method as enum ('wave','orange_money','especes','carte','cheque','mutuelle_ipm','tiers_payant','en_attente');
create type gender_type as enum ('M','F','Autre');
```

### `patients`

```sql
create table public.patients (
  id uuid primary key default gen_random_uuid(),
  practitioner_id uuid not null references public.practitioners(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  gender gender_type not null,
  birth_date date not null,
  ssn text not null default '',
  phone text not null default '',
  email text not null default '',
  address text not null default '',
  blood_group text,
  allergies text[] not null default '{}',
  medical_history text[] not null default '{}',
  chronic_treatments text[] not null default '{}',
  emergency_contact jsonb, -- {name, relationship, phone}
  notes text,
  created_at timestamptz not null default now()
);
create index patients_practitioner_idx on public.patients(practitioner_id);
```

### `appointments`

```sql
create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  practitioner_id uuid not null references public.practitioners(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete restrict,
  date date not null,
  start_time time not null,
  duration int not null,
  type appointment_type not null,
  status appointment_status not null default 'confirmed',
  reason text not null default '',
  notes text,
  fee numeric(10,2) not null default 0,
  is_paid boolean not null default false,
  payment_method payment_method,
  arrived_at time,
  whatsapp_reminder_sent boolean not null default false,
  whatsapp_reminder_sent_at timestamptz,
  whatsapp_reminder_opt_out boolean not null default false
);
create index appointments_practitioner_idx on public.appointments(practitioner_id);
create index appointments_date_idx on public.appointments(practitioner_id, date);
create index appointments_patient_idx on public.appointments(patient_id);
```

`patient_id ... on delete restrict` : il n'existe aujourd'hui aucune suppression de patient dans l'UI — ce choix évite d'orpheliner silencieusement l'historique médical si une suppression est ajoutée plus tard sans décision explicite.

### `prescriptions`

```sql
create table public.prescriptions (
  id uuid primary key default gen_random_uuid(),
  practitioner_id uuid not null references public.practitioners(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete restrict,
  appointment_id uuid references public.appointments(id) on delete set null,
  date date not null,
  medications jsonb not null default '[]', -- [{id,name,dosage,frequency,duration,instructions}]
  recommendations text,
  created_at timestamptz not null default now()
);
create index prescriptions_practitioner_idx on public.prescriptions(practitioner_id);
create index prescriptions_patient_idx on public.prescriptions(patient_id);
```

`medications` reste en JSONB : toujours lu/écrit comme un bloc atomique lié à une seule ordonnance, jamais interrogé médicament par médicament — une table enfant n'apporterait aucun bénéfice actuellement.

### `consultations`

```sql
create table public.consultations (
  id uuid primary key default gen_random_uuid(),
  practitioner_id uuid not null references public.practitioners(id) on delete cascade,
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete restrict,
  date date not null,
  time time not null,
  reason text not null default '',
  systolic_bp int,
  diastolic_bp int,
  heart_rate int,
  weight numeric(5,2),
  height numeric(5,2),
  temperature numeric(4,1),
  blood_sugar numeric(5,2),
  soap jsonb not null, -- {subjective, objective, assessment, plan}
  prescription_id uuid references public.prescriptions(id) on delete set null,
  notes text
);
create unique index consultations_appointment_unique on public.consultations(appointment_id);
create index consultations_practitioner_idx on public.consultations(practitioner_id);
create index consultations_patient_idx on public.consultations(patient_id);
```

Les constantes vitales (`vitals`) sont normalisées en colonnes réelles (et non JSONB) car ce sont des mesures numériques structurées qu'il est plausible de vouloir tracer dans le temps par patient plus tard (StatsView existe déjà) — coût identique aujourd'hui, évite une migration future. Le bloc `soap` reste en JSONB car toujours lu/écrit comme une seule unité clinique.

`practitioner_id` est délibérément dénormalisé sur `appointments`/`prescriptions`/`consultations` (même s'il est dérivable via `patient_id`) : cela rend les policies RLS simples et rapides (filtre direct sur une colonne de la ligne, pas de jointure), et l'intégrité est garantie par les policies `with check` ci-dessous — un praticien ne peut jamais écrire une ligne avec un `practitioner_id` différent du sien.

### Row Level Security (même schéma sur les 5 tables)

```sql
alter table public.practitioners enable row level security;
alter table public.patients enable row level security;
alter table public.appointments enable row level security;
alter table public.prescriptions enable row level security;
alter table public.consultations enable row level security;

create policy practitioners_self on public.practitioners
  for all using (id = auth.uid()) with check (id = auth.uid());

create policy patients_tenant_isolation on public.patients
  for all using (practitioner_id = auth.uid()) with check (practitioner_id = auth.uid());

create policy appointments_tenant_isolation on public.appointments
  for all using (practitioner_id = auth.uid()) with check (practitioner_id = auth.uid());

create policy prescriptions_tenant_isolation on public.prescriptions
  for all using (practitioner_id = auth.uid()) with check (practitioner_id = auth.uid());

create policy consultations_tenant_isolation on public.consultations
  for all using (practitioner_id = auth.uid()) with check (practitioner_id = auth.uid());
```

### Création automatique du cabinet à l'inscription

Trigger `SECURITY DEFINER` sur `auth.users` qui crée la ligne `practitioners` correspondante dès l'inscription (évite toute race condition côté client) :

```sql
create function public.handle_new_practitioner()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.practitioners (id, name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', ''), new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_practitioner();
```

Le formulaire d'inscription transmet le nom du praticien via `options.data.name` (métadonnées utilisateur Supabase Auth). Les autres champs du profil (spécialité, ONM, NINEA, tarif...) sont ensuite complétés via `SettingsModal` après la première connexion — pas d'assistant d'onboarding séparé pour cette phase.

---

## Authentification (sans routeur, gate minimal)

Le projet n'a actuellement aucun routeur (`react-router` etc.) ni bibliothèque de state — le changement de vue se fait déjà par `useState` local + rendu conditionnel dans `App.tsx`. On garde ce style plutôt que d'introduire un routeur.

- **`src/lib/supabaseClient.ts`** (nouveau) : instancie `createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)`.
- **`src/hooks/useSession.ts`** (nouveau) : encapsule `supabase.auth.getSession()` + `supabase.auth.onAuthStateChange()`, retourne `{ session, loading }`. La persistance de session est gérée nativement par le SDK Supabase (LocalStorage interne), pas de code custom nécessaire.
- **`src/components/AuthScreen.tsx`** (nouveau) : écran unique login/inscription (bascule entre les deux modes), avec `supabase.auth.signInWithPassword` / `supabase.auth.signUp`. Inclut aussi le mot de passe oublié (`supabase.auth.resetPasswordForEmail`), peu coûteux à ajouter dès maintenant. Message clair après inscription : « vérifiez votre email pour confirmer votre compte » (confirmation email obligatoire, configurée côté projet Supabase).
- **`src/main.tsx`** (modifié) : devient le gate d'authentification :
  ```tsx
  function Root() {
    const { session, loading } = useSession();
    if (loading) return <SplashScreen />;
    return session ? <App session={session} /> : <AuthScreen />;
  }
  ```
- **Déconnexion** : nouveau bouton « Déconnexion » dans `SettingsModal.tsx` (déjà l'écran des données du cabinet), appelant `supabase.auth.signOut()`.

`App` reçoit `session.user.id` et l'utilise comme `practitionerId` implicite pour toutes les écritures (jamais fourni par le client sans contrôle — RLS `with check` est le garde-fou réel).

---

## Remplacement de la couche `storage.ts` (LocalStorage → Supabase)

### Principe

`src/utils/storage.ts` est remplacé par `src/lib/db.ts`. On garde le vocabulaire `loadX()` mais on abandonne le pattern « tableau complet sauvegardé à chaque changement » (non viable en réseau/Postgres) au profit d'un **CRUD par ligne**, asynchrone :

```ts
// Profil praticien
loadDoctorProfile(practitionerId): Promise<DoctorProfile>
updateDoctorProfile(practitionerId, patch): Promise<DoctorProfile>

// Patients
loadPatients(practitionerId): Promise<Patient[]>
createPatient(practitionerId, data): Promise<Patient>
updatePatient(id, patch): Promise<Patient>
deletePatient(id): Promise<void> // exposé pour complétude, pas encore branché dans l'UI

// Rendez-vous
loadAppointments(practitionerId): Promise<Appointment[]>
createAppointment(practitionerId, data): Promise<Appointment>
updateAppointment(id, patch): Promise<Appointment>
deleteAppointment(id): Promise<void>

// Ordonnances
loadPrescriptions(practitionerId): Promise<Prescription[]>
createPrescription(practitionerId, data): Promise<Prescription>

// Consultations
loadConsultations(practitionerId): Promise<Consultation[]>
upsertConsultation(practitionerId, data): Promise<Consultation> // create-or-update par appointment_id
```

Chaque fonction assure le mapping snake_case (DB) ↔ camelCase (TS, `src/types.ts` reste inchangé — seule la couche de persistance change).

### Changements dans `src/App.tsx`

- Les **5 `useEffect` de sauvegarde automatique** (`saveDoctorProfile`, `savePatients`, etc. déclenchés à chaque changement d'état) sont **supprimés** : la persistance se fait désormais explicitement dans chaque handler, pas en réaction au changement d'état.
- Chargement initial : chaque `useState(loadX)` synchrone devient un `useEffect` asynchrone qui charge les données au montage (une fois la session connue), avec un état de chargement simple.
- Chaque handler (`handleSaveAppointment`, `handleSavePatient`, `handleSaveConsultation`, `handleSavePrescription`, `handleTogglePayment`, `handleUpdateStatus`, `handleDeleteAppointment`, etc.) devient `async` : mise à jour optimiste de l'état local (`setX(prev => ...)`) pour un retour instantané, suivie d'un appel à la fonction CRUD correspondante ; en cas d'erreur, on recharge l'état depuis Supabase et on affiche un message d'erreur simple (pas de nouvelle dépendance de type toast — un simple bandeau/texte suffit, cohérent avec le style actuel de l'app).
- Les `id` des nouvelles entités sont désormais générés côté serveur (`gen_random_uuid()`) au lieu de `` `apt-${Date.now()}` `` côté client. Dans `handleSaveAppointment`, la création de patient à la volée doit `await createPatient(...)` pour obtenir le vrai id avant de l'utiliser.
- `useStorageSync` (synchronisation multi-onglets via l'événement `storage`) est **supprimé** (`src/hooks/useStorageSync.ts` + son usage dans `App.tsx`) : il n'a plus de raison d'être une fois Postgres comme source de vérité.

---

## Sauvegarde / restauration & réinitialisation démo

- **Export/Import JSON** (`exportCabinetData` / `importCabinetData`) : **conservés**, devenus plus utiles (seul moyen pour un praticien d'obtenir une sauvegarde de ses données hébergées). Deviennent asynchrones (lecture/écriture Supabase au lieu de LocalStorage), même format JSON. L'import réassigne des ids serveur frais (au lieu de faire confiance aux ids du JSON) avec une table de correspondance ancien-id → nouveau-id construite en insérant d'abord les patients, puis les entités qui les référencent.
- **Réinitialiser avec données de démo** : conservé dans `SettingsModal`, mais avec une **boîte de dialogue de confirmation explicite** avant d'écraser les données réelles du praticien (changement demandé). Implémenté comme suppression + réinsertion scopée à `practitioner_id = auth.uid()` (RLS garantit qu'on ne touche jamais qu'à ses propres données).

---

## Séquencement des phases

**Phase 0 — Provisioning Supabase (côté utilisateur, bloquant pour les tests réels)**
L'utilisateur doit créer un projet sur supabase.com, exécuter le script SQL du schéma (via l'éditeur SQL du dashboard ou la CLI Supabase), activer la confirmation email, et fournir l'URL + la clé anonyme du projet. Ceci ne peut pas être fait par l'agent (nécessite le compte Supabase de l'utilisateur).

**Phase 1 — Schéma & RLS**
- Nouveau : `supabase/migrations/0001_init.sql` avec enums, 5 tables, index, trigger, policies RLS ci-dessus.
- Vérification : deux comptes de test distincts, confirmer qu'aucun ne voit les données de l'autre.

**Phase 2 — Dépendances & configuration**
- `package.json` : ajout de `@supabase/supabase-js`.
- `.env.example` : remplace la note « aucune variable requise » par `VITE_SUPABASE_URL=` / `VITE_SUPABASE_ANON_KEY=`.
- Nouveau : `.env.local` (gitignored, valeurs fournies par l'utilisateur), `src/lib/supabaseClient.ts`.

**Phase 3 — Écran d'authentification & gate de session**
- Nouveau : `src/hooks/useSession.ts`, `src/components/AuthScreen.tsx`.
- Modifié : `src/main.tsx`.
- Vérification : inscription → email de confirmation → connexion → session persistée après rechargement → déconnexion fonctionnent ; un utilisateur non connecté ne voit jamais `<App/>`.

**Phase 4 — Migration de la couche de données, entité par entité** (ordre imposé par les dépendances FK : patients avant tout ce qui les référence)
1. `practitioners` (profil praticien) → `SettingsModal`.
2. `patients` → `handleSavePatient` + création inline dans `handleSaveAppointment`.
3. `appointments` → `handleSaveAppointment`, `handleDeleteAppointment`, `handleTogglePayment`, `handleUpdateStatus`, `handleUpdateAppointmentReminder`.
4. `prescriptions` → `handleSavePrescription`.
5. `consultations` → `handleSaveConsultation`.
- Suppression des 5 `useEffect` de sauvegarde et de `useStorageSync` dans `App.tsx`.
- Suppression de `src/hooks/useStorageSync.ts`.

**Phase 5 — Sauvegarde/restauration & réinitialisation démo**
- `src/lib/db.ts` : `exportCabinetData`/`importCabinetData` asynchrones avec réassignation d'ids ; `resetToDemoData` scopé par tenant.
- `SettingsModal.tsx` : handlers export/import async, bouton confirmation pour le reset démo, bouton déconnexion.

**Phase 6 — Nettoyage & tests**
- Suppression de `src/utils/storage.ts` (entièrement remplacé).
- Ajout d'états de chargement/erreur simples sur les vues (les lectures LocalStorage étaient synchrones, les lectures Supabase sont asynchrones — nouveauté réelle à couvrir).
- Test manuel multi-tenant : deux comptes distincts, vérifier l'absence de fuite de données dans toutes les vues (agenda, salle d'attente, patients, ordonnances, stats).
- `npm run lint` / vérification TypeScript (`tsc --noEmit`) sur tous les fichiers modifiés.

---

## Fichiers critiques

- `src/utils/storage.ts` → remplacé par `src/lib/db.ts` (toute la surface de persistance).
- `src/App.tsx` → ~20 handlers convertis en async + suppression des 5 `useEffect` de sauvegarde (fichier le plus modifié).
- `src/types.ts` → référence du modèle de domaine, inchangé, sert de contrat pour le mapping snake_case/camelCase.
- `src/main.tsx` → devient le gate d'authentification (`session ? <App/> : <AuthScreen/>`).
- `src/hooks/useStorageSync.ts` → supprimé.
- `src/components/SettingsModal.tsx` → ajout déconnexion, confirmation reset démo, export/import async.
- Nouveau : `src/lib/supabaseClient.ts`, `src/hooks/useSession.ts`, `src/components/AuthScreen.tsx`, `supabase/migrations/0001_init.sql`.

## Vérification de bout en bout

1. Appliquer la migration SQL sur le projet Supabase de l'utilisateur (Phase 0/1).
2. `npm install` (nouvelle dépendance `@supabase/supabase-js`), configurer `.env.local`.
3. `npm run dev` puis dans le navigateur : créer un compte A, confirmer l'email, se connecter, créer un patient + un rendez-vous + une consultation + une ordonnance.
4. Se déconnecter, créer un compte B, vérifier qu'il ne voit aucune donnée du compte A (agenda vide, liste patients vide).
5. Se reconnecter en tant que A, vérifier que toutes les données créées à l'étape 3 sont toujours là.
6. Tester export JSON, import JSON, réinitialisation démo (avec confirmation), déconnexion/reconnexion (persistance de session après rechargement de page).
7. `npm run lint` et `tsc --noEmit` sans erreur.
