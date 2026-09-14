import { AppointmentStatus, AppointmentType, PaymentMethod, ToothStatus } from './types';

// Tarif de consultation par défaut en Francs CFA (XOF), utilisé quand le profil du praticien
// ne définit pas encore de tarif personnalisé.
export const DEFAULT_CONSULTATION_FEE_XOF = 15000;

export interface AppointmentStatusConfig {
  label: string;
  bg: string;
  text: string;
  border: string;
  dotColor: string; // classe Tailwind bg-* pour un petit indicateur de statut (pastille)
  badgeClass: string; // style complet pour un badge compact (ex: vue agenda)
}

// Source unique de vérité pour le libellé et les couleurs de chaque statut de rendez-vous,
// utilisée par AgendaView, PatientAppointmentsTable, AppointmentModal, etc.
export const APPOINTMENT_STATUS_CONFIG: Record<AppointmentStatus, AppointmentStatusConfig> = {
  confirmed: {
    label: 'Confirmé',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    dotColor: 'bg-blue-500',
    badgeClass: 'bg-slate-100 text-slate-700',
  },
  waiting: {
    label: "En salle d'attente",
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dotColor: 'bg-amber-500',
    badgeClass: 'bg-amber-100 text-amber-800 font-bold',
  },
  in_progress: {
    label: 'En consultation',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    dotColor: 'bg-purple-500',
    badgeClass: 'bg-blue-600 text-white font-bold animate-pulse',
  },
  completed: {
    label: 'Terminé',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dotColor: 'bg-emerald-500',
    badgeClass: 'bg-emerald-100 text-emerald-800',
  },
  cancelled: {
    label: 'Annulé',
    bg: 'bg-slate-100',
    text: 'text-slate-500 line-through',
    border: 'border-slate-200',
    dotColor: 'bg-slate-400',
    badgeClass: 'bg-slate-200 text-slate-500 line-through',
  },
  no_show: {
    label: 'Absent',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    dotColor: 'bg-rose-500',
    badgeClass: 'bg-rose-100 text-rose-800 font-bold',
  },
};

export interface AppointmentTypeConfig {
  label: string;
  bg: string;
  text: string;
  border: string;
}

// Source unique de vérité pour le libellé et les couleurs de chaque type d'acte.
export const APPOINTMENT_TYPE_CONFIG: Record<AppointmentType, AppointmentTypeConfig> = {
  consultation: { label: 'Consultation', bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' },
  suivi: { label: 'Suivi', bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
  urgence: { label: 'Urgence', bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200' },
  teleconsultation: { label: 'Téléconsult.', bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200' },
  bilan: { label: 'Bilan', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  vaccination: { label: 'Vaccination', bg: 'bg-teal-50', text: 'text-teal-800', border: 'border-teal-200' },
  soins_dentaires: { label: 'Soins dentaires', bg: 'bg-cyan-50', text: 'text-cyan-800', border: 'border-cyan-200' },
  detartrage: { label: 'Détartrage', bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-200' },
  extraction_dentaire: { label: 'Extraction dentaire', bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-200' },
};

// Source unique de vérité pour les libellés des moyens de paiement, utilisée dans les
// sélecteurs de règlement, l'export PDF et les statistiques financières.
export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'wave', label: 'Wave Sénégal' },
  { value: 'orange_money', label: 'Orange Money' },
  { value: 'especes', label: 'Espèces (Cash)' },
  { value: 'carte', label: 'Carte Bancaire' },
  { value: 'cheque', label: 'Chèque bancaire' },
  { value: 'mutuelle_ipm', label: 'Mutuelle / IPM' },
  { value: 'tiers_payant', label: 'Tiers payant' },
];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = PAYMENT_METHODS.reduce(
  (acc, m) => ({ ...acc, [m.value]: m.label }),
  {} as Record<PaymentMethod, string>
);

// Liste curée des spécialités médicales, utilisée à la fois par le sélecteur de spécialité
// dans les Paramètres praticien et par le filtre de l'annuaire public. Indépendante de
// SPECIALTY_PRESETS (ReferralLetterModal.tsx), qui associe à chaque spécialité un texte de
// lettre de correspondance différent et exclut délibérément "Médecine Générale" — ne pas
// fusionner ces deux listes.
export const MEDICAL_SPECIALTIES: string[] = [
  'Médecine Générale',
  'Cardiologie',
  'Dermatologie',
  'Endocrinologie & Diabétologie',
  'Gastro-entérologie',
  'Gynécologie-Obstétrique',
  'Médecine Interne',
  'Néphrologie',
  'Neurologie',
  'Oncologie',
  'Ophtalmologie',
  'ORL (Oto-Rhino-Laryngologie)',
  'Orthopédie & Traumatologie',
  'Pédiatrie',
  'Pneumologie',
  'Psychiatrie',
  'Radiologie & Imagerie médicale',
  'Rhumatologie',
  'Urologie',
  'Chirurgie Générale',
  'Chirurgie Dentaire',
  'Kinésithérapie',
  'Sage-femme',
];

// Sous-ensemble de MEDICAL_SPECIALTIES qui bénéficie de fonctionnalités dédiées
// (odontogramme, types de rendez-vous dentaires, ordre professionnel ONCDS).
// Comme pour SPECIALTY_PRESETS, ne pas fusionner cette liste avec MEDICAL_SPECIALTIES :
// elle sert un besoin différent (activer une logique métier, pas peupler un sélecteur).
export const DENTAL_SPECIALTIES: string[] = ['Chirurgie Dentaire'];

export const isDentalSpecialty = (specialty: string): boolean => DENTAL_SPECIALTIES.includes(specialty);

export interface ProfessionalOrderLabel {
  short: string; // sigle, ex: "ONMS"
  medium: string; // ex: "Ordre des Médecins"
  full: string; // dénomination officielle complète
}

// Le numéro d'inscription à l'ordre professionnel (DoctorProfile.professionalOrderNumber)
// est un champ neutre : son libellé affiché dépend de la spécialité du praticien, car
// médecins et dentistes dépendent d'ordres distincts au Sénégal.
export function getProfessionalOrderLabel(specialty: string): ProfessionalOrderLabel {
  if (isDentalSpecialty(specialty)) {
    return {
      short: 'ONCDS',
      medium: 'Ordre des Chirurgiens-Dentistes',
      full: 'Ordre National des Chirurgiens-Dentistes du Sénégal',
    };
  }
  return {
    short: 'ONMS',
    medium: 'Ordre des Médecins',
    full: 'Ordre National des Médecins du Sénégal',
  };
}

export interface ToothStatusConfig {
  label: string;
  color: string; // classe Tailwind bg-* utilisée pour colorer la dent dans l'odontogramme
}

// Source unique de vérité pour le libellé et la couleur de chaque statut de dent,
// utilisée par OdontogramChart (légende + coloration des dents).
export const TOOTH_STATUS_CONFIG: Record<ToothStatus, ToothStatusConfig> = {
  sain: { label: 'Saine', color: 'bg-white' },
  carie: { label: 'Cariée', color: 'bg-rose-400' },
  obture: { label: 'Obturée', color: 'bg-amber-400' },
  couronne: { label: 'Couronne', color: 'bg-yellow-400' },
  implant: { label: 'Implant', color: 'bg-slate-400' },
  extrait: { label: 'Extraite', color: 'bg-slate-200' },
  absent: { label: 'Absente', color: 'bg-slate-100' },
};
