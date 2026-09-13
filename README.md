# Cabinet Santé - Agenda & Gestion Médicale

## Présentation générale
**Cabinet Santé** est un SaaS multi-cabinets conçu pour les professionnels de santé indépendants (notamment adapté à l'exercice libéral et aux contextes médicaux francophones et africains, avec prise en charge du FCFA, Wave, Orange Money, etc.). Chaque praticien crée son propre compte et dispose d'un espace totalement isolé (patients, rendez-vous, consultations, ordonnances) grâce à l'authentification et à l'isolation multi-tenant Supabase.

Elle permet de gérer efficacement le flux quotidien du cabinet : de la prise de rendez-vous jusqu'au suivi post-consultation, en passant par la gestion de la salle d'attente, les dossiers médicaux patients, la rédaction d'ordonnances imprimables et les rappels WhatsApp aux patients.

---

## Fonctionnalités Principales

### 1. 📅 Agenda & Gestion des Rendez-vous
- **Vues multiples** : affichage par jour, par semaine ou par mois, avec navigation fluide.
- **Création & modification rapide** : sélection du patient, de l'horaire, de la durée, du motif et du type d'acte (consultation, suivi, urgence, téléconsultation, bilan, vaccination).
- **Gestion des statuts** : confirmé, en attente, en cours, terminé, annulé, absence non excusée (*no-show*).
- **Tarification & paiement** : gestion du tarif de consultation et suivi du règlement (Espèces, Wave, Orange Money, Carte, Chèque, Mutuelle / IPM, Tiers payant).

### 2. ⏳ Salle d'attente en temps réel
- Suivi visuel des patients actuellement présents au cabinet.
- Horodatage précis de l'heure d'arrivée et calcul du temps d'attente.
- Démarrage direct de la consultation en un clic depuis la salle d'attente.

### 3. 👥 Dossiers Patients complets, Historique RDV & Export PDF
- **Fiche administrative** : identité, coordonnées, date de naissance, contact d'urgence, numéro de sécurité sociale / identifiant (NIN / CNI).
- **Informations médicales clés** : groupe sanguin, allergies connues, antécédents médicaux et chirurgicaux, traitements chroniques.
- **📊 Tableau récapitulatif de l'historique complet des RDV & Statuts de Paiement** :
  - Synthèse financière en en-tête : Total facturé, Total réglé, Reste à recouvrer et Taux de recouvrement en %.
  - Historique chronologique complet de tous les rendez-vous du patient (date, heure, type, motif, statut).
  - Statut de paiement en temps réel avec badge clair (Payé avec méthode de paiement ou En attente de règlement).
  - Filtres interactifs par statut financier (Tous, Réglés, En attente) et tri chronologique.
  - Gestion rapide des encaissements directement depuis le dossier : bascule immédiate payé/impayé et sélection du moyen de règlement (Wave, Orange Money, Espèces, Carte, etc.).
  - Raccourci vers la prise d'un nouveau rendez-vous pour le patient.
- **Historique clinique** : accès direct à toutes les consultations passées avec constantes vitales et notes SOAP, ordonnances délivrées.
- **✉️ Outil de génération de Lettre d'Orientation pour Spécialiste (Courrier confraternel)** :
  - Génération automatique pré-remplie avec l'identité du patient, ses antécédents, ses allergies, ses traitements en cours et le résumé clinique de ses dernières consultations.
  - Sélecteur de la consultation de référence (dernière consultation par défaut ou choix d'une consultation spécifique avec boutons d'accès direct sur chaque fiche d'examen).
  - Préréglages intelligents par spécialité médicale (Cardiologie, Dermatologie, Ophtalmologie, Gastro-entérologie, Neurologie, Endocrinologie, Pneumologie, Rhumatologie, Gynécologie, Pédiatrie, ORL, Psychiatrie, Chirurgie générale, etc.) suggérant un motif d'adressage et une question clinique type.
  - Degré d'urgence paramétrable : *Consultation programmée (standard)*, *Avis prioritaire (< 15 jours)*, *Urgence relative (< 48h)*.
  - Options modulables pour inclure/exclure les antécédents, constantes vitales récentes, notes SOAP et ordonnances.
  - Aperçu interactif A4 haute fidélité avec en-tête officiel du cabinet, mention légale de secret professionnel et bloc signature/cachet.
  - Téléchargement en fichier PDF officiel (`.pdf`), impression directe et copie intégrale du texte dans le presse-papier en un clic.
- **📄 Export PDF complet du dossier** :
  - Génération d'un fichier PDF officiel (`.pdf`) téléchargeable en un clic via `jsPDF`.
  - Aperçu interactif avec impression directe / enregistrement PDF via le navigateur.
  - En-tête professionnel complet du praticien (spécialité, N° Ordre ONMS/RPPS, NINEA, adresse, téléphone, email).
  - Synthèse clinique complète : constantes vitales, notes SOAP détaillées (Subjectif, Objectif, Diagnostic, Plan), tableau récapitulatif des RDV et règlements, ordonnances et posologies.
  - Mentions médico-légales de confidentialité (secret médical) et cachet/signature du praticien.
  - Filtres d'exportation modulables (choix d'inclure ou non les antécédents, constantes, RDV & règlements, notes SOAP, ordonnances).

### 4. 🩺 Consultations & Méthode SOAP
- Prise de constantes vitales : tension artérielle (systolique/diastolique), fréquence cardiaque, poids, taille, température, glycémie.
- Rédaction structurée selon le modèle clinique standard **SOAP** :
  - **S (Subjectif)** : motifs et symptômes rapportés par le patient.
  - **O (Objectif)** : examen clinique, auscultation et observations du médecin.
  - **A (Analyse / Assessment)** : diagnostic ou hypothèses cliniques.
  - **P (Plan)** : conduite à tenir, examens prescrits et recommandations.
- Génération d'ordonnance liée directement à la consultation.

### 5. 💊 Ordonnances & Prescriptions Médicales
- Éditeur structuré de médicaments : nom, posologie, fréquence, durée du traitement et consignes spécifiques de prise.
- Impression prête à l'emploi au format standard d'ordonnance avec en-tête du médecin (nom, spécialité, N° ONMS, NINEA, adresse, téléphone) et signature.
- Historique et réimpression instantanée des ordonnances antérieures.

### 6. 📱 Rappels WhatsApp Automatiques & Manuels
- Détection proactive des rendez-vous prévus dans les prochaines 24 à 48 heures.
- Génération de messages personnalisés pré-formatés avec date, heure, nom du cabinet et instructions.
- Envoi direct en un clic via l'API Web WhatsApp (`https://wa.me/...`).
- Suivi des rappels déjà expédiés et possibilité d'exclure certains patients.

### 7. 📊 Statistiques & Tableau de Bord Financier
- Nombre de consultations réalisées sur différentes périodes.
- Chiffre d'affaires et répartition par moyen de paiement (Espèces, Wave, Orange Money, etc.).
- Taux d'assiduité, d'annulations et d'absences (*no-shows*).
- Répartition par typologie de consultation.

### 8. ⚙️ Profil Praticien & Sauvegarde des Données
- Configuration des coordonnées du médecin (Nom, titre, spécialité, N° ONMS / NINEA / RPPS / ADELI, tarif par défaut).
- Personnalisation du modèle de message de rappel WhatsApp.
- **Sauvegarde et Restauration** : export de toutes les données du cabinet au format JSON et importation sécurisée.
- Réinitialisation avec jeu de données de démonstration pour les tests (avec confirmation avant écrasement des données réelles).
- Déconnexion du compte.

### 9. 🔐 Authentification & Isolation Multi-Cabinets
- Inscription (avec confirmation obligatoire par email) et connexion par email/mot de passe.
- Réinitialisation du mot de passe oublié.
- Chaque compte praticien obtient automatiquement son propre espace à l'inscription, strictement isolé des autres cabinets au niveau de la base de données (Row Level Security).

---

## Architecture Technique & Stack

| Composant | Technologie | Description |
| :--- | :--- | :--- |
| **Framework UI** | React 19 + TypeScript | Interface déclarative, réactive et typée |
| **Build & Dev Tool** | Vite 6 | Compilation ultra-rapide et packaging ESM |
| **Styles** | Tailwind CSS v4 | Design épuré, responsive et adapté aux écrans médicaux |
| **Animations** | Motion (`motion/react`) | Transitions fluides entre vues et modales |
| **Icônes** | Lucide React | Iconographie médicale et fonctionnelle cohérente |
| **Backend** | Supabase (Postgres + Auth) | Authentification, base de données et API générée automatiquement |
| **Isolation des données** | Row Level Security (Postgres) | Chaque praticien ne peut lire/écrire que ses propres données |

> **Important** : Cabinet Santé est un SaaS multi-cabinets. Chaque professionnel de santé crée son propre compte (email + mot de passe, confirmation par email) et toutes ses données (patients, rendez-vous, consultations, ordonnances) sont stockées côté serveur dans une base Postgres Supabase, isolées des autres cabinets par des policies RLS. Un backend Supabase (projet + variables d'environnement) est donc requis pour faire fonctionner l'application — voir la section Démarrage ci-dessous. L'abonnement payant n'est pas encore implémenté à ce stade.

---

## Arborescence du Projet

```text
├── index.html                       # Point d'entrée HTML
├── metadata.json                    # Métadonnées de l'application
├── package.json                     # Dépendances et scripts npm
├── tsconfig.json                    # Configuration TypeScript
├── vite.config.ts                   # Configuration Vite avec Tailwind CSS
├── supabase/
│   └── migrations/
│       └── 0001_init.sql            # Schéma Postgres, RLS et trigger de création de cabinet
├── src/
│   ├── main.tsx                     # Démarrage de l'app + gate d'authentification (session ? App : AuthScreen)
│   ├── App.tsx                      # Composant racine, routage d'état et modales
│   ├── index.css                    # Styles globaux Tailwind
│   ├── types.ts                     # Interfaces TypeScript (Patient, Appointment, Consultation, etc.)
│   ├── constants.ts                 # Constantes partagées (tarif par défaut, etc.)
│   ├── lib/
│   │   ├── supabaseClient.ts        # Instance du client Supabase (Auth + Postgres)
│   │   └── db.ts                    # Couche CRUD (mapping snake_case ↔ camelCase, export/import/reset)
│   ├── hooks/
│   │   └── useSession.ts            # Session Supabase Auth courante (getSession + onAuthStateChange)
│   ├── components/
│   │   ├── AuthScreen.tsx           # Écran de connexion / inscription / mot de passe oublié
│   │   ├── Header.tsx               # En-tête avec indicateurs du jour et actions rapides
│   │   ├── Navigation.tsx           # Barre de navigation principale (Agenda, Attente, Patients, etc.)
│   │   ├── AgendaView.tsx           # Vue planning (jour / semaine / mois)
│   │   ├── WaitingRoomView.tsx      # Gestion de la salle d'attente en temps réel
│   │   ├── PatientsView.tsx         # Liste et dossiers médicaux des patients
│   │   ├── PatientAppointmentsTable.tsx # Tableau récapitulatif des RDV et règlements de paiement
│   │   ├── PatientFormModal.tsx     # Modale d'ajout/édition de patient
│   │   ├── PatientDossierPdfModal.tsx # Modale d'aperçu et d'exportation PDF du dossier
│   │   ├── ReferralLetterModal.tsx  # Modale de génération de lettre d'orientation spécialiste
│   │   ├── AppointmentModal.tsx     # Prise et modification de rendez-vous
│   │   ├── ConsultationModal.tsx    # Saisie d'examen clinique (constantes + SOAP)
│   │   ├── PrescriptionModal.tsx    # Éditeur et impression d'ordonnances
│   │   ├── PrescriptionsListView.tsx# Historique global des ordonnances
│   │   ├── WhatsAppReminderModal.tsx# Centre d'envoi des rappels WhatsApp
│   │   ├── StatsView.tsx            # Métriques d'activité et finances
│   │   └── SettingsModal.tsx        # Paramètres praticien, import/export JSON, déconnexion
│   ├── data/
│   │   └── mockData.ts              # Données de démonstration initiales
│   └── utils/
│       ├── dateUtils.ts             # Fonctions de manipulation et formatage de dates
│       ├── pdfExport.ts             # Moteur de génération vectorielle de PDF (jsPDF)
│       ├── appointmentUtils.ts      # Détection de chevauchement de rendez-vous
│       └── whatsappUtils.ts         # Détection des RDV proches et génération de liens WhatsApp
```

---

## Démarrage et Utilisation

**Prérequis** : Node.js, un compte [Supabase](https://supabase.com) (gratuit).

1. **Créer le backend Supabase** :
   - Créez un projet sur [supabase.com](https://supabase.com).
   - Dans l'éditeur SQL du projet, exécutez le contenu de `supabase/migrations/0001_init.sql` (schéma, RLS et trigger de création automatique du cabinet).
   - Dans *Authentication → Providers → Email*, activez la confirmation d'email obligatoire.
   - Récupérez l'URL du projet et la clé publique `anon` dans *Project Settings → API*.

2. **Configurer les variables d'environnement** :
   ```bash
   cp .env.example .env.local
   ```
   Puis renseignez `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` dans `.env.local`.

3. **Installer les dépendances** :
   ```bash
   npm install
   ```

4. **Lancement en développement** :
   ```bash
   npm run dev
   ```
   L'application s'exécute sur le port `3000`. Créez un compte via l'écran de connexion pour accéder à votre cabinet.

5. **Vérification du code** :
   ```bash
   npm run lint
   npm run typecheck
   ```

6. **Génération de la version de production** :
   ```bash
   npm run build
   ```
