import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

// Déconnexion automatique après une période d'inactivité, pour les postes
// partagés d'un cabinet (accueil, salle de consultation).
//
// L'heure de la dernière activité est gardée en localStorage, pour que :
// - l'activité dans un onglet compte pour tous les onglets ouverts ;
// - un navigateur fermé puis rouvert après le délai soit déconnecté au
//   chargement (le jeton Supabase, lui, reste valide indéfiniment).
// Elle est effacée à chaque déconnexion : la prochaine connexion repart donc
// de zéro. On ne peut pas se fier à l'événement SIGNED_IN pour ça, supabase-js
// l'émet aussi à chaque rechargement de page.

export const IDLE_TIMEOUT_MS = 60 * 60 * 1000;
const WARNING_BEFORE_MS = 60 * 1000;
const CHECK_INTERVAL_MS = 1000;
// Évite d'écrire en localStorage à chaque frappe ou défilement.
const WRITE_THROTTLE_MS = 5000;
const STORAGE_KEY = 'sunumed:last-activity';
export const IDLE_SIGN_OUT_REDIRECT = '/connexion?raison=inactivite';

const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll'] as const;

let memoryLastActivity: number | null = null;

const readLastActivity = (): number | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const value = raw === null ? NaN : Number(raw);
    return Number.isFinite(value) ? value : memoryLastActivity;
  } catch {
    return memoryLastActivity;
  }
};

const writeLastActivity = (value: number) => {
  memoryLastActivity = value;
  try {
    localStorage.setItem(STORAGE_KEY, String(value));
  } catch {
    // Stockage indisponible : on garde la valeur en mémoire pour cet onglet.
  }
};

const clearLastActivity = () => {
  memoryLastActivity = null;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // idem
  }
};

// Une connexion explicite repart de zéro, même si une ancienne valeur a
// survécu (session précédente jamais déconnectée proprement).
export const markFreshSignIn = () => writeLastActivity(Date.now());

// Connexion par lien email (confirmation d'inscription, réinitialisation) :
// le jeton est encore dans le hash au chargement du module.
if (/[#&]access_token=/.test(window.location.hash)) markFreshSignIn();

supabase.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_OUT') clearLastActivity();
  if (event === 'PASSWORD_RECOVERY') markFreshSignIn();
});

export interface UseIdleSignOutResult {
  // Secondes restantes avant la déconnexion, ou null hors de la fenêtre d'avertissement.
  secondsLeft: number | null;
  stayConnected: () => void;
}

export function useIdleSignOut(): UseIdleSignOutResult {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  const stayConnected = useCallback(() => {
    writeLastActivity(Date.now());
    setSecondsLeft(null);
  }, []);

  useEffect(() => {
    let signingOut = false;

    const signOut = async () => {
      if (signingOut) return;
      signingOut = true;
      clearLastActivity();
      // scope local : seule la session de ce navigateur est fermée, pas celle
      // du téléphone du praticien par exemple.
      await supabase.auth.signOut({ scope: 'local' });
      // Rechargement complet : les dossiers patients chargés en mémoire sont
      // effacés avec la page, pas seulement masqués.
      window.location.replace(IDLE_SIGN_OUT_REDIRECT);
    };

    const check = () => {
      const last = readLastActivity();
      if (last === null) {
        // Première ouverture après une connexion.
        writeLastActivity(Date.now());
        setSecondsLeft(null);
        return;
      }
      const remaining = IDLE_TIMEOUT_MS - (Date.now() - last);
      if (remaining <= 0) {
        void signOut();
      } else if (remaining <= WARNING_BEFORE_MS) {
        setSecondsLeft(Math.ceil(remaining / 1000));
      } else {
        setSecondsLeft(null);
      }
    };

    let lastWrite = 0;
    const onActivity = () => {
      const now = Date.now();
      if (now - lastWrite < WRITE_THROTTLE_MS) return;
      lastWrite = now;
      // Ne pas prolonger une session déjà expirée (ex. : retour sur un onglet
      // resté ouvert toute la nuit) : on vérifie avant d'enregistrer l'activité.
      const last = readLastActivity();
      if (last !== null && now - last >= IDLE_TIMEOUT_MS) {
        void signOut();
        return;
      }
      writeLastActivity(now);
      setSecondsLeft(null);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') check();
    };

    check();
    const interval = window.setInterval(check, CHECK_INTERVAL_MS);
    ACTIVITY_EVENTS.forEach((name) =>
      window.addEventListener(name, onActivity, { passive: true, capture: true })
    );
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.clearInterval(interval);
      ACTIVITY_EVENTS.forEach((name) =>
        window.removeEventListener(name, onActivity, { capture: true })
      );
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  return { secondsLeft, stayConnected };
}
