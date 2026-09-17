export type AppointmentType =
  | 'consultation'
  | 'suivi'
  | 'urgence'
  | 'teleconsultation'
  | 'bilan'
  | 'vaccination'
  | 'soins_dentaires'
  | 'detartrage'
  | 'extraction_dentaire';

export type AppointmentStatus = 
  | 'confirmed' 
  | 'waiting' 
  | 'in_progress' 
  | 'completed' 
  | 'cancelled' 
  | 'no_show';

export type PaymentMethod = 
  | 'wave' 
  | 'orange_money' 
  | 'especes' 
  | 'carte' 
  | 'cheque' 
  | 'mutuelle_ipm' 
  | 'tiers_payant' 
  | 'en_attente';

export type SubscriptionStatus = 'trialing' | 'active' | 'expired' | 'cancelled';

export interface DoctorProfile {
  id: string;
  name: string;
  title: string; // Dr.
  specialty: string;
  professionalOrderNumber?: string; // N° d'inscription à l'ordre professionnel (ONMS, ONCDS...) — libellé dérivé de la spécialité, voir getProfessionalOrderLabel
  ninea?: string; // N° NINEA (Sénégal)
  phone: string;
  email: string;
  address: string;
  city: string;
  consultationFee: number; // Montant en FCFA (ex: 15000)
  defaultDuration: number; // in minutes (e.g. 30)
  whatsappReminderHours?: number; // e.g. 24 or 48 hours before
  whatsappCustomTemplate?: string;
  whatsappAutoPrompt?: boolean;
  subscriptionStatus: SubscriptionStatus;
  trialEndsAt?: string; // ISO timestamp, uniquement pertinent quand subscriptionStatus === 'trialing'
  isPublicListed: boolean; // Opt-in : visible dans l'annuaire public "Trouver un professionnel"
  publicBio: string;
  acceptsNewPatients: boolean;
}

// Sous-ensemble volontairement restreint de DoctorProfile exposé par l'annuaire public
// (RPC list_public_practitioners) : jamais l'email, le N° Ordre, le NINEA, ni les
// données d'abonnement. Séparé de DoctorProfile pour que ce périmètre "sûr" soit
// explicite dans le code, pas seulement au niveau SQL.
export interface PublicPractitioner {
  id: string;
  name: string;
  title: string;
  specialty: string;
  phone: string;
  address: string;
  city: string;
  publicBio: string;
  acceptsNewPatients: boolean;
}

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  gender: 'M' | 'F' | 'Autre';
  birthDate: string; // YYYY-MM-DD
  ssn: string; // N° CNI / Numéro d'Identification Nationale (NIN)
  phone: string;
  email: string;
  address: string;
  bloodGroup?: string;
  allergies: string[];
  medicalHistory: string[];
  chronicTreatments: string[];
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  notes?: string;
  createdAt: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  duration: number; // in minutes (15, 30, 45, 60)
  type: AppointmentType;
  status: AppointmentStatus;
  reason: string;
  notes?: string;
  fee: number;
  isPaid: boolean;
  paymentMethod?: PaymentMethod;
  arrivedAt?: string; // Time entered waiting room HH:MM
  whatsappReminderSent?: boolean;
  whatsappReminderSentAt?: string;
  whatsappReminderOptOut?: boolean;
}

export interface Vitals {
  systolicBp?: number; // mmHg (ex: 120)
  diastolicBp?: number; // mmHg (ex: 80)
  heartRate?: number; // bpm
  weight?: number; // kg
  height?: number; // cm
  temperature?: number; // °C
  bloodSugar?: number; // g/L
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  appointmentId?: string;
  date: string;
  medications: Medication[];
  recommendations?: string;
  createdAt: string;
}

export type ToothStatus = 'sain' | 'carie' | 'obture' | 'couronne' | 'implant' | 'extrait' | 'absent';

export interface ToothRecord {
  status: ToothStatus;
  note?: string;
}

// Odontogramme : clé = numéro de dent en notation FDI ('11'..'48'), une dent
// absente de l'objet = non renseignée. Passthrough JSONB opaque côté DB, même
// schéma que `soap` / `emergencyContact` — aucune validation serveur.
export type Odontogram = Record<string, ToothRecord>;

export interface Consultation {
  id: string;
  appointmentId: string;
  patientId: string;
  date: string;
  time: string;
  reason: string;
  vitals?: Vitals;
  odontogram?: Odontogram;
  soap: {
    subjective: string; // Motif et symptômes rapportés par le patient
    objective: string;  // Examen physique et observations cliniques
    assessment: string; // Hypothèse diagnostique
    plan: string;       // Conduite à tenir, examens complémentaires
  };
  prescriptionId?: string;
  notes?: string;
}

export type ReferralUrgency = 'routine' | 'prioritaire' | 'urgence';

export interface ReferralLetterData {
  id?: string;
  patientId: string;
  date: string; // YYYY-MM-DD
  doctorCity?: string;
  recipientTitle: string; // e.g. "Cher(e) Confrère" or "Dr. Mamadou Fall"
  specialty: string; // e.g. "Cardiologie", "Dermatologie"
  institution?: string; // e.g. "Hôpital Principal de Dakar"
  urgency: ReferralUrgency;
  reason: string; // Motif d'orientation
  clinicalQuestion: string; // Demande / question précise posée au spécialiste
  includeVitals: boolean;
  includeSoap: boolean;
  includeTreatments: boolean;
  includeHistory: boolean;
  selectedConsultationId?: string;
  customNotes?: string;
  fullBodyText?: string;
}
