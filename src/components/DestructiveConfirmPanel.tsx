import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, AlertTriangle, Download, Loader2 } from 'lucide-react';

export const DESTRUCTIVE_CONFIRM_WORD = 'SUPPRIMER';

interface DestructiveConfirmPanelProps {
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
  isRunning: boolean;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

// Confirmation renforcée pour les opérations qui effacent tout le cabinet :
// il faut taper un mot précis, un simple clic réflexe ne suffit pas.
export const DestructiveConfirmPanel: React.FC<DestructiveConfirmPanelProps> = ({
  title,
  description,
  confirmLabel,
  isRunning,
  error,
  onConfirm,
  onCancel,
}) => {
  const [typed, setTyped] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Le panneau s'ouvre en bas des paramètres : on l'amène à l'écran.
  useEffect(() => {
    inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    inputRef.current?.focus({ preventScroll: true });
  }, []);

  const canConfirm = typed.trim() === DESTRUCTIVE_CONFIRM_WORD && !isRunning;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (canConfirm) onConfirm();
      }}
      className="p-4 bg-rose-50 border border-rose-300 rounded-xl space-y-3"
    >
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
        <div>
          <p className="font-bold text-rose-900 text-sm">{title}</p>
          <div className="text-[11px] text-rose-800 mt-1 leading-relaxed">{description}</div>
        </div>
      </div>

      <div className="flex items-start gap-2 p-2.5 bg-white border border-rose-200 rounded-lg text-[11px] text-slate-600">
        <Download className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-px" />
        <span>
          Une sauvegarde JSON de vos données actuelles sera téléchargée automatiquement avant l'opération. Si
          elle échoue, rien n'est effacé.
        </span>
      </div>

      {error && (
        <div className="p-2.5 bg-white border border-rose-300 rounded-lg flex items-start gap-2 text-[11px] text-rose-800">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-px" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <label htmlFor="destructive-confirm" className="block font-semibold text-rose-900 mb-1">
          Tapez <span className="font-mono font-bold">{DESTRUCTIVE_CONFIRM_WORD}</span> pour confirmer
        </label>
        <input
          ref={inputRef}
          id="destructive-confirm"
          type="text"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          disabled={isRunning}
          className="w-full px-3 py-2 bg-white border border-rose-300 rounded-lg font-mono focus:ring-1 focus:ring-rose-500"
        />
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isRunning}
          className="px-4 py-2 font-semibold text-slate-700 hover:bg-white rounded-lg transition-colors cursor-pointer disabled:opacity-50"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={!canConfirm}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 text-white font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          {isRunning && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>{confirmLabel}</span>
        </button>
      </div>
    </form>
  );
};
