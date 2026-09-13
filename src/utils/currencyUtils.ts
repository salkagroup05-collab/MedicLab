/**
 * Formate un montant en Francs CFA (XOF) de façon cohérente dans toute l'application.
 * Utiliser `abbreviated: true` uniquement quand l'espace horizontal disponible est
 * réellement contraint (ex. colonne étroite d'un tableau PDF) — "FCFA" reste la
 * convention par défaut partout ailleurs.
 */
export function formatFCFA(amount: number, options?: { abbreviated?: boolean }): string {
  // toLocaleString('fr-FR') sépare les milliers par une espace fine insécable (code 8239).
  // La police standard de jsPDF (utilisée pour les PDF) ne supporte pas ce caractère et
  // le tronque à son octet bas, ce qui affiche un "/" à la place — d'où la normalisation
  // en espace classique (code 32), sans effet visuel à l'écran.
  const NON_BREAKING_SPACE_CODE = 160;
  const NARROW_NON_BREAKING_SPACE_CODE = 8239;
  const formatted = Math.round(amount)
    .toLocaleString('fr-FR')
    .split('')
    .map((char) => {
      const code = char.charCodeAt(0);
      return code === NON_BREAKING_SPACE_CODE || code === NARROW_NON_BREAKING_SPACE_CODE ? ' ' : char;
    })
    .join('');
  return `${formatted} ${options?.abbreviated ? 'F' : 'FCFA'}`;
}
