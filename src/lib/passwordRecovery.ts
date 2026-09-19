import { supabase } from './supabaseClient';

// Suivi du parcours "mot de passe oublié". Le lien envoyé par
// resetPasswordForEmail ouvre une session : sans ce drapeau, l'utilisateur
// arriverait directement dans l'app sans jamais choisir de nouveau mot de passe.
//
// Le drapeau est posé au chargement du module, donc avant que React monte :
// - le hash du lien (#...&type=recovery) est encore présent à ce moment-là,
//   supabase-js ne le nettoie qu'après avoir validé le jeton ;
// - l'abonnement à PASSWORD_RECOVERY est enregistré avant la fin de
//   l'initialisation asynchrone du client, donc l'événement n'est pas perdu.
// Il est gardé en sessionStorage pour survivre à un rechargement de l'onglet.

const STORAGE_KEY = 'sunumed:password-recovery';

const readStored = (): boolean => {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
};

let isRecovery = readStored() || /[#&]type=recovery(&|$)/.test(window.location.hash);
const listeners = new Set<() => void>();

const setRecovery = (value: boolean) => {
  if (value === isRecovery) return;
  isRecovery = value;
  try {
    if (value) sessionStorage.setItem(STORAGE_KEY, '1');
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Stockage indisponible (navigation privée stricte) : le drapeau reste en mémoire.
  }
  listeners.forEach((listener) => listener());
};

if (isRecovery) {
  try {
    sessionStorage.setItem(STORAGE_KEY, '1');
  } catch {
    // idem
  }
}

supabase.auth.onAuthStateChange((event) => {
  if (event === 'PASSWORD_RECOVERY') setRecovery(true);
  if (event === 'SIGNED_OUT') setRecovery(false);
});

export const getPasswordRecovery = (): boolean => isRecovery;

export const subscribePasswordRecovery = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const endPasswordRecovery = () => setRecovery(false);
