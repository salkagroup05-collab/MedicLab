# Cabinet Santé - Agenda & Gestion Médicale

## Présentation générale
**Cabinet Santé** est une application web complète et moderne conçue pour les professionnels de santé et cabinets médicaux (notamment adaptée à l'exercice libéral et aux contextes médicaux francophones et africains, avec prise en charge du FCFA, Wave, Orange Money, etc.).

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
- Réinitialisation avec jeu de données de démonstration pour les tests.

---

## Architecture Technique & Stack

| Composant | Technologie | Description |
| :--- | :--- | :--- |
| **Framework UI** | React 19 + TypeScript | Interface déclarative, réactive et typée |
| **Build & Dev Tool** | Vite 6 | Compilation ultra-rapide et packaging ESM |
| **Styles** | Tailwind CSS v4 | Design épuré, responsive et adapté aux écrans médicaux |
| **Animations** | Motion (`motion/react`) | Transitions fluides entre vues et modales |
| **Icônes** | Lucide React | Iconographie médicale et fonctionnelle cohérente |
| **Persistance** | LocalStorage | Sauvegarde locale immédiate, hors-ligne et sans latence |

> **Important** : Cabinet Santé est une application **100% cliente**, sans backend ni base de données. Toutes les données (patients, rendez-vous, consultations, ordonnances) sont stockées dans le `LocalStorage` du navigateur. Cela signifie qu'il n'y a actuellement ni authentification, ni chiffrement des données, ni synchronisation entre appareils — à garder à l'esprit pour un usage en conditions réelles avec des données médicales sensibles.

---

## Arborescence du Projet

```text
├── index.html                       # Point d'entrée HTML
├── metadata.json                    # Métadonnées de l'application
├── package.json                     # Dépendances et scripts npm
├── tsconfig.json                    # Configuration TypeScript
├── vite.config.ts                   # Configuration Vite avec Tailwind CSS
├── src/
│   ├── main.tsx                     # Démarrage de l'application React
│   ├── App.tsx                      # Composant racine, routage d'état et modales
│   ├── index.css                    # Styles globaux Tailwind
│   ├── types.ts                     # Interfaces TypeScript (Patient, Appointment, Consultation, etc.)
│   ├── constants.ts                 # Constantes partagées (tarif par défaut, etc.)
│   ├── components/
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
│   │   └── SettingsModal.tsx        # Paramètres praticien, import/export JSON
│   ├── data/
│   │   └── mockData.ts              # Données de démonstration initiales
│   └── utils/
│       ├── dateUtils.ts             # Fonctions de manipulation et formatage de dates
│       ├── pdfExport.ts             # Moteur de génération vectorielle de PDF (jsPDF)
│       ├── storage.ts               # Couche d'accès et persistance LocalStorage
│       ├── appointmentUtils.ts      # Détection de chevauchement de rendez-vous
│       └── whatsappUtils.ts         # Détection des RDV proches et génération de liens WhatsApp
```

---

## Démarrage et Utilisation

**Prérequis** : Node.js

1. **Installer les dépendances** :
   ```bash
   npm install
   ```

2. **Lancement en développement** :
   ```bash
   npm run dev
   ```
   L'application s'exécute sur le port `3000`.

3. **Vérification du code** :
   ```bash
   npm run lint
   ```

4. **Génération de la version de production** :
   ```bash
   npm run build
   ```

Aucune variable d'environnement n'est requise pour faire fonctionner l'application (voir `.env.example`).
