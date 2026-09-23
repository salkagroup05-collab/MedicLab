import { Appointment, DoctorProfile, Patient } from '../types';
import { formatDateFr, toLocalDateString } from './dateUtils';

export interface PhoneValidation {
  raw: string;
  cleanPhone: string;
  isValid: boolean;
  isMobile: boolean;
  formattedDisplay: string;
}

/**
 * Nettoie et normalise un numéro de téléphone pour WhatsApp (format E.164 sans le +)
 * Spécialement optimisé pour les numéros sénégalais (+221) et internationaux
 */
export function sanitizePhoneNumber(phone: string): PhoneValidation {
  if (!phone) {
    return { raw: '', cleanPhone: '', isValid: false, isMobile: false, formattedDisplay: 'Non renseigné' };
  }

  const raw = phone.trim();
  // Supprime les espaces, points, tirets, parenthèses
  let digits = raw.replace(/[\s.\-_()]/g, '');

  if (digits.startsWith('+')) {
    digits = digits.substring(1);
  } else if (digits.startsWith('00')) {
    digits = digits.substring(2);
  }

  // Format sénégalais à 9 chiffres : commence par 70, 75, 76, 77, 78, 79 (mobiles) ou 33 (fixe)
  // Ex: 77 123 45 67 -> 221771234567
  if (/^(70|75|76|77|78|79|33)\d{7}$/.test(digits)) {
    digits = '221' + digits;
  } else if (/^0(70|75|76|77|78|79)\d{7}$/.test(digits)) {
    // Numéro mobile sénégalais saisi par erreur avec un 0 initial (habitude du format français)
    // -> on corrige vers le Sénégal, on ne devine jamais un autre pays à partir d'un simple préfixe "0"
    digits = '221' + digits.substring(1);
  }
  // Un numéro commençant par un 0 sans indicatif explicite (+xx / 00xx) reste ambigu (local FR, SN fixe
  // hors format ci-dessus, etc.) : on ne le réattribue plus arbitrairement à un pays, il sera jugé invalide
  // ci-dessous et l'utilisateur devra saisir l'indicatif complet.

  // Détection mobile sénégalais (Orange, Free, Expresso, Promobile)
  const isSenegalMobile = /^221(70|75|76|77|78|79)\d{7}$/.test(digits);
  const isSenegalFixed = /^22133\d{7}$/.test(digits);
  const isFrenchNumber = /^33[1-9]\d{8}$/.test(digits);
  const isFrenchMobile = digits.startsWith('336') || digits.startsWith('337');
  // Repli générique pour les autres indicatifs internationaux (diaspora), à condition que
  // l'indicatif ait bien été fourni explicitement (le numéro ne doit plus commencer par 0 à ce stade).
  const isGenericInternational = !digits.startsWith('0') && digits.length >= 8 && digits.length <= 15;
  const isGenericMobile = isSenegalMobile || isFrenchMobile || isGenericInternational;
  const isValid = /^\d+$/.test(digits) && (isSenegalMobile || isSenegalFixed || isFrenchNumber || isGenericInternational);

  // Format d'affichage clair
  let formattedDisplay = raw;
  if (digits.startsWith('221') && digits.length === 12) {
    // Format sénégalais : +221 77 123 45 67
    formattedDisplay = `+221 ${digits.substring(3, 5)} ${digits.substring(5, 8)} ${digits.substring(8, 10)} ${digits.substring(10, 12)}`;
  }

  return {
    raw,
    cleanPhone: digits,
    isValid,
    isMobile: isGenericMobile,
    formattedDisplay,
  };
}

export const DEFAULT_WHATSAPP_TEMPLATE = `Bonjour {civilite} {nom},

Nous vous confirmons votre rendez-vous médical avec le {docteur} ({specialite}) :
🗓️ Date : {date}
⏰ Heure : {heure}
🏥 Lieu : {adresse}
📋 Motif : {motif}

⚠️ En cas d'empêchement, merci de nous prévenir au moins 24h à l'avance au {telephone} pour permettre à un autre patient de bénéficier de ce créneau.

À très bientôt,
Le secrétariat du {docteur}`;

/**
 * Construit le texte personnalisé du rappel WhatsApp
 */
export function buildReminderMessage(
  appointment: Appointment,
  patient: Patient,
  doctor: DoctorProfile,
  customTemplate?: string
): string {
  const template = customTemplate || doctor.whatsappCustomTemplate || DEFAULT_WHATSAPP_TEMPLATE;

  const civilite = patient.gender === 'M' ? 'M.' : patient.gender === 'F' ? 'Mme' : '';
  const dateFormatted = formatDateFr(appointment.date, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const fullDoctorName = `${doctor.title} ${doctor.name}`;
  const fullAddress = `${doctor.address}, ${doctor.city}`;

  return template
    .replace(/\{civilite\}/g, civilite)
    .replace(/\{nom\}/g, patient.lastName.toUpperCase())
    .replace(/\{prenom\}/g, patient.firstName)
    .replace(/\{patient\}/g, `${patient.firstName} ${patient.lastName.toUpperCase()}`)
    .replace(/\{date\}/g, dateFormatted)
    .replace(/\{heure\}/g, appointment.startTime)
    .replace(/\{docteur\}/g, fullDoctorName)
    .replace(/\{specialite\}/g, doctor.specialty)
    .replace(/\{adresse\}/g, fullAddress)
    .replace(/\{telephone\}/g, doctor.phone)
    .replace(/\{motif\}/g, appointment.reason || 'Consultation');
}

/**
 * Construit le lien direct wa.me
 */
export function getWhatsAppLink(
  appointment: Appointment,
  patient: Patient,
  doctor: DoctorProfile,
  customMessage?: string
): { url: string; validation: PhoneValidation; message: string } {
  const validation = sanitizePhoneNumber(patient.phone);
  const message = customMessage || buildReminderMessage(appointment, patient, doctor);
  const encodedText = encodeURIComponent(message);
  const url = validation.isValid ? `https://wa.me/${validation.cleanPhone}?text=${encodedText}` : '';

  return { url, validation, message };
}

/**
 * Ouvre le lien WhatsApp dans un nouvel onglet sécurisé
 */
export function openWhatsAppReminder(url: string): void {
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Détermine les rendez-vous à l'approche nécessitant un rappel WhatsApp
 * (Aujourd'hui et dans les 2 prochains jours, non annulés)
 */
export interface ApproachingAppointmentGroup {
  category: 'demain' | 'aujourdhui' | 'j2' | 'futur';
  label: string;
  badgeColor: string;
  appointments: {
    appointment: Appointment;
    patient: Patient;
    daysDiff: number;
    isApproaching: boolean;
    needsReminder: boolean;
  }[];
}

export function getApproachingAppointmentsData(
  appointments: Appointment[],
  patients: Patient[],
  todayStr: string
): {
  approachingCount: number;
  pendingRemindersCount: number;
  sentRemindersCount: number;
  grouped: ApproachingAppointmentGroup[];
  tomorrowPendingCount: number;
  todayPendingCount: number;
} {
  const patientMap = new Map(patients.map((p) => [p.id, p]));
  const todayDate = new Date(todayStr + 'T00:00:00');

  const tomorrowDate = new Date(todayDate);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStr = toLocalDateString(tomorrowDate);

  const in2DaysDate = new Date(todayDate);
  in2DaysDate.setDate(in2DaysDate.getDate() + 2);
  const in2DaysStr = toLocalDateString(in2DaysDate);

  const items: {
    appointment: Appointment;
    patient: Patient;
    daysDiff: number;
    isApproaching: boolean;
    needsReminder: boolean;
  }[] = [];

  appointments
    .filter((a) => a.status !== 'cancelled' && a.status !== 'no_show')
    .forEach((apt) => {
      const patient = patientMap.get(apt.patientId);
      if (!patient) return;

      const aptDate = new Date(apt.date + 'T00:00:00');
      const diffTime = aptDate.getTime() - todayDate.getTime();
      const daysDiff = Math.round(diffTime / (1000 * 60 * 60 * 24));

      // On s'intéresse aux rendez-vous d'aujourd'hui, demain et après-demain
      if (daysDiff >= 0 && daysDiff <= 7) {
        const isApproaching = daysDiff <= 2;
        const needsReminder = isApproaching && !apt.whatsappReminderSent && !apt.whatsappReminderOptOut;

        items.push({
          appointment: apt,
          patient,
          daysDiff,
          isApproaching,
          needsReminder,
        });
      }
    });

  // Tri par date puis heure
  items.sort((a, b) => {
    if (a.appointment.date !== b.appointment.date) {
      return a.appointment.date.localeCompare(b.appointment.date);
    }
    return a.appointment.startTime.localeCompare(b.appointment.startTime);
  });

  const tomorrowItems = items.filter((i) => i.appointment.date === tomorrowStr);
  const todayItems = items.filter((i) => i.appointment.date === todayStr);
  const in2DaysItems = items.filter((i) => i.appointment.date === in2DaysStr);
  const otherItems = items.filter(
    (i) => i.appointment.date !== todayStr && i.appointment.date !== tomorrowStr && i.appointment.date !== in2DaysStr
  );

  const grouped: ApproachingAppointmentGroup[] = [
    {
      category: 'demain',
      label: 'Demain (J-1 • Rappels prioritaires 24h)',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      appointments: tomorrowItems,
    },
    {
      category: 'aujourdhui',
      label: "Aujourd'hui (Jour J • Confirmations)",
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
      appointments: todayItems,
    },
    {
      category: 'j2',
      label: 'Dans 48h (J-2 • Rappels anticipés)',
      badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      appointments: in2DaysItems,
    },
  ];

  if (otherItems.length > 0) {
    grouped.push({
      category: 'futur',
      label: 'Prochains jours (J+3 à J+7)',
      badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
      appointments: otherItems,
    });
  }

  const approachingCount = items.filter((i) => i.isApproaching).length;
  const pendingRemindersCount = items.filter((i) => i.needsReminder).length;
  const sentRemindersCount = items.filter((i) => i.appointment.whatsappReminderSent).length;
  const tomorrowPendingCount = tomorrowItems.filter((i) => i.needsReminder).length;
  const todayPendingCount = todayItems.filter((i) => i.needsReminder).length;

  return {
    approachingCount,
    pendingRemindersCount,
    sentRemindersCount,
    grouped,
    tomorrowPendingCount,
    todayPendingCount,
  };
}
