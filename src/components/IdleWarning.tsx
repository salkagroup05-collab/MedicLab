import React from 'react';
import { Clock } from 'lucide-react';

interface IdleWarningProps {
  secondsLeft: number;
  onStayConnected: () => void;
}

// Prévient une minute avant la déconnexion automatique, pour ne pas perdre une
// saisie en cours. Tout clic ou frappe au clavier prolonge aussi la session.
export const IdleWarning: React.FC<IdleWarningProps> = ({ secondsLeft, onStayConnected }) => (
  <div
    role="alertdialog"
    aria-live="assertive"
    aria-labelledby="idle-warning-title"
    className="no-print fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:w-[360px] z-[100] bg-white border border-amber-300 rounded-xl shadow-lg p-4 flex items-start gap-3"
  >
    <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
      <Clock className="w-4.5 h-4.5" />
    </div>
    <div className="flex-1 min-w-0">
      <p id="idle-warning-title" className="text-sm font-bold text-slate-900">
        Déconnexion dans {secondsLeft} s
      </p>
      <p className="text-xs text-slate-500 mt-0.5">
        Aucune activité depuis bientôt 30 minutes. Vos dossiers seront verrouillés.
      </p>
      <button
        type="button"
        onClick={onStayConnected}
        className="mt-3 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors"
      >
        Rester connecté
      </button>
    </div>
  </div>
);
