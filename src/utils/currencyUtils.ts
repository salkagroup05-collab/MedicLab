/**
 * Formate un montant en Francs CFA (XOF) de façon cohérente dans toute l'application.
 * Utiliser `abbreviated: true` uniquement quand l'espace horizontal disponible est
 * réellement contraint (ex. colonne étroite d'un tableau PDF) — "FCFA" reste la
 * convention par défaut partout ailleurs.
 */
export function formatFCFA(amount: number, options?: { abbreviated?: boolean }): string {
  const formatted = Math.round(amount).toLocaleString('fr-FR');
  return `${formatted} ${options?.abbreviated ? 'F' : 'FCFA'}`;
}
