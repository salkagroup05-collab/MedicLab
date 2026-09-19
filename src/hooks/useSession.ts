import { useEffect, useState, useSyncExternalStore } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { endPasswordRecovery, getPasswordRecovery, subscribePasswordRecovery } from '../lib/passwordRecovery';

export interface UseSessionResult {
  session: Session | null;
  loading: boolean;
  // Vrai quand la session vient d'un lien "mot de passe oublié" : l'app doit
  // imposer le choix d'un nouveau mot de passe avant tout accès au cabinet.
  isRecovery: boolean;
}

export function useSession(): UseSessionResult {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const isRecovery = useSyncExternalStore(subscribePasswordRecovery, getPasswordRecovery);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      // Lien de réinitialisation expiré ou invalide : aucune session n'a été
      // ouverte, le drapeau ne doit pas forcer l'écran à la prochaine connexion.
      if (!data.session) endPasswordRecovery();
      setSession(data.session);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setLoading(false);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  return { session, loading, isRecovery };
}
