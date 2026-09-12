import React, { useEffect, useRef } from 'react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Nom accessible de la boîte de dialogue, annoncé par les lecteurs d'écran. */
  title: string;
  /** Classe Tailwind max-w-* pour la largeur de la carte (ex: 'max-w-xl'). */
  maxWidthClassName?: string;
  /**
   * Quand true (par défaut), la carte a une hauteur maximale (voir `maxHeightClassName`) et
   * son contenu défile en interne (flex-col + overflow-hidden) ; utile pour les modales à
   * contenu long et en-tête/pied fixes. Quand false, la carte grandit avec son contenu et
   * c'est l'overlay qui défile.
   */
  scrollableBody?: boolean;
  /** Classe Tailwind max-h-* appliquée uniquement quand `scrollableBody` est true. */
  maxHeightClassName?: string;
  /**
   * Ferme la modale au clic sur le fond. Désactivé par défaut pour éviter de perdre une
   * saisie en cours dans un formulaire ; à activer explicitement pour les modales sans
   * risque de perte de données (aperçus, sélections simples).
   */
  closeOnOverlayClick?: boolean;
  /** Ferme la modale avec la touche Échap (activé par défaut). */
  closeOnEscape?: boolean;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Coquille de modale partagée par toutes les modales de l'application : gère l'overlay,
 * le centrage de la carte, le blocage du scroll de la page pendant l'ouverture, et
 * l'accessibilité clavier (rôle ARIA, piège de focus, fermeture Échap/clic-fond, restauration
 * du focus à la fermeture). Le contenu (en-tête, corps, pied) reste entièrement défini par
 * chaque modale appelante.
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  title,
  maxWidthClassName = 'max-w-xl',
  scrollableBody = true,
  maxHeightClassName = 'max-h-[92vh]',
  closeOnOverlayClick = false,
  closeOnEscape = true,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  // Ouverture : bloque le scroll de la page, mémorise l'élément actif et déplace le focus
  // dans la modale. Fermeture : restaure le scroll et rend le focus à l'élément déclencheur.
  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    const card = cardRef.current;
    const firstFocusable = card?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    (firstFocusable || card)?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      previouslyFocusedRef.current?.focus?.();
    };
  }, [isOpen]);

  // Échap pour fermer + piège de focus (Tab/Shift+Tab bouclent entre le premier et le
  // dernier élément focusable de la carte, sans jamais laisser le focus s'échapper vers
  // le reste de la page tant que la modale est ouverte).
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (closeOnEscape) onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const card = cardRef.current;
      if (!card) return;
      const focusable: HTMLElement[] = Array.from(card.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (focusable.length === 0) return;
      const first: HTMLElement = focusable[0];
      const last: HTMLElement = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeOnEscape, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={(e) => {
        if (closeOnOverlayClick && e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={`bg-white rounded-2xl shadow-2xl w-full ${maxWidthClassName} border border-slate-200 overflow-hidden outline-none ${
          scrollableBody ? `${maxHeightClassName} flex flex-col` : ''
        }`}
      >
        {children}
      </div>
    </div>
  );
};
