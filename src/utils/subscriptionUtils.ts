import { DoctorProfile } from '../types';

// Même logique que la fonction SQL has_active_subscription() côté base :
// actif, ou en essai non expiré.
export function hasActiveSubscription(doctor: DoctorProfile): boolean {
  if (doctor.subscriptionStatus === 'active') return true;
  if (doctor.subscriptionStatus === 'trialing') {
    return !!doctor.trialEndsAt && new Date(doctor.trialEndsAt).getTime() > Date.now();
  }
  return false;
}

// Nombre de jours restants avant la fin de l'essai (arrondi au jour supérieur),
// ou null si le compte n'est pas en essai.
export function getTrialDaysRemaining(doctor: DoctorProfile): number | null {
  if (doctor.subscriptionStatus !== 'trialing' || !doctor.trialEndsAt) return null;
  const msRemaining = new Date(doctor.trialEndsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(msRemaining / (24 * 60 * 60 * 1000)));
}
