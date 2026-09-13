import React from 'react';
import { LogOut, ShieldAlert, Stethoscope } from 'lucide-react';
import { DoctorProfile } from '../types';

interface SubscriptionRequiredScreenProps {
  doctor: DoctorProfile;
  onSignOut: () => void;
}

export const SubscriptionRequiredScreen: React.FC<SubscriptionRequiredScreenProps> = ({
  doctor,
  onSignOut,
}) => {
  const isExpiredTrial = doctor.subscriptionStatus === 'trialing';

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-200 mb-3">
            <Stethoscope className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">MédicLab</h1>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>

          <h2 className="text-base font-bold text-slate-900 mb-2">
            {isExpiredTrial ? "Votre période d'essai est terminée" : 'Abonnement inactif'}
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed mb-6">
            L'accès à votre cabinet est actuellement suspendu. Contactez notre équipe pour réactiver
            votre abonnement et retrouver l'accès à vos patients, rendez-vous et dossiers médicaux.
          </p>

          <button
            type="button"
            onClick={onSignOut}
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Déconnexion</span>
          </button>
        </div>
      </div>
    </div>
  );
};
