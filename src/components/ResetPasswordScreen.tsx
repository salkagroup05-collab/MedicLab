import React from 'react';
import { LogOut, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { endPasswordRecovery } from '../lib/passwordRecovery';
import { markFreshSignIn } from '../hooks/useIdleSignOut';
import { LogoMark } from './Logo';
import { PasswordChangeForm } from './PasswordChangeForm';

// Affiché à la place de l'app quand la session vient d'un lien "mot de passe
// oublié" : le praticien doit choisir un nouveau mot de passe avant d'accéder
// à son cabinet.
export const ResetPasswordScreen: React.FC = () => {
  const handleSuccess = () => {
    // Le délai d'inactivité repart de l'accès effectif au cabinet, pas de
    // l'ouverture du lien.
    markFreshSignIn();
    endPasswordRecovery();
  };

  const handleCancel = async () => {
    await supabase.auth.signOut();
    endPasswordRecovery();
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white">
      <div className="hidden lg:flex flex-col justify-between bg-blue-900 p-12">
        <div className="flex items-center gap-3">
          <LogoMark size={36} />
          <span className="text-lg font-bold text-white tracking-tight">
            Sunu<span className="text-blue-300">Med</span>
          </span>
        </div>
        <div>
          <h2 className="text-[34px] leading-[1.12] font-extrabold tracking-tight text-white max-w-[400px]">
            Choisissez un nouveau mot de passe.
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-[#dbe7fb] max-w-[400px]">
            Une fois validé, les autres appareils connectés à votre cabinet sont déconnectés. Vos
            données restent intactes.
          </p>
          <div className="flex items-center gap-2.5 text-sm text-white mt-8">
            <ShieldCheck className="w-4 h-4 text-blue-300 shrink-0" />
            Évitez un mot de passe déjà utilisé sur un autre site
          </div>
        </div>
        <p className="text-xs text-[#a9c3ee]">Besoin d'aide ? contact@sunumed.sn</p>
      </div>

      <div className="flex flex-col justify-center p-6 sm:p-12 lg:p-14">
        <div className="max-w-[400px] w-full mx-auto">
          <h1 className="text-[26px] font-extrabold tracking-tight text-slate-900">Nouveau mot de passe</h1>
          <p className="mt-2 mb-7 text-sm text-slate-500">
            Votre lien de réinitialisation est valide. Définissez votre nouveau mot de passe pour accéder à
            votre cabinet.
          </p>

          <PasswordChangeForm submitLabel="Enregistrer et accéder au cabinet" onSuccess={handleSuccess} />

          <div className="mt-7 pt-5 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={handleCancel}
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-500 hover:text-slate-700 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Annuler et se déconnecter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
