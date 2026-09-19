import type { AuthError } from '@supabase/supabase-js';

// À garder aligné avec le réglage "Minimum password length" du dashboard Supabase
// (Authentication > Providers > Email), qui fait foi côté serveur.
export const MIN_PASSWORD_LENGTH = 10;

// Score de 0 à 3 pour la jauge : 0 tant que le minimum n'est pas atteint.
export const getPasswordStrength = (password: string): number => {
  if (password.length < MIN_PASSWORD_LENGTH) return 0;
  let score = 1;
  if (password.length >= 14) score += 1;
  if (/\d/.test(password) && /[a-zA-Z]/.test(password)) score += 1;
  return Math.min(score, 3);
};

export const getPasswordErrorMessage = (error: AuthError): string => {
  switch (error.code) {
    case 'same_password':
      return "Le nouveau mot de passe doit être différent de l'ancien.";
    case 'weak_password':
      return 'Mot de passe trop faible ou déjà divulgué dans une fuite de données. Choisissez-en un autre.';
    case 'reauthentication_needed':
    case 'session_expired':
    case 'session_not_found':
      return 'Votre session a expiré. Reconnectez-vous puis recommencez.';
    default:
      return error.message;
  }
};
