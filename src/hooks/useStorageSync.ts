import { useEffect } from 'react';
import { STORAGE_KEYS } from '../utils/storage';

type StorageKey = keyof typeof STORAGE_KEYS;

/**
 * Recharge les données du cabinet quand un AUTRE onglet du navigateur modifie le
 * LocalStorage (le navigateur n'émet l'événement `storage` que pour les onglets qui
 * n'ont pas eux-mêmes déclenché l'écriture). Sans cela, deux onglets ouverts en même
 * temps s'écrasent silencieusement l'un l'autre à la prochaine sauvegarde.
 */
export function useStorageSync(onChange: (key: StorageKey) => void): void {
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      const entry = (Object.entries(STORAGE_KEYS) as [StorageKey, string][]).find(
        ([, value]) => value === e.key
      );
      if (entry) onChange(entry[0]);
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [onChange]);
}
