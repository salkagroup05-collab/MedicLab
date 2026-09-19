import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2, Lock } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { MIN_PASSWORD_LENGTH, getPasswordErrorMessage, getPasswordStrength } from '../utils/passwordUtils';

interface PasswordChangeFormProps {
  // Paramètres : on redemande le mot de passe actuel, pour qu'une personne
  // devant une session restée ouverte ne puisse pas s'approprier le compte.
  // Parcours "mot de passe oublié" : impossible, l'utilisateur ne le connaît plus.
  requireCurrentPassword?: boolean;
  submitLabel: string;
  onSuccess?: () => void;
  compact?: boolean;
}

export const PasswordChangeForm: React.FC<PasswordChangeFormProps> = ({
  requireCurrentPassword = false,
  submitLabel,
  onSuccess,
  compact = false,
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const passwordStrength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.`);
      return;
    }
    if (password !== confirmPassword) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    try {
      if (requireCurrentPassword) {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        const email = userData.user?.email;
        if (userError || !email) {
          setError('Votre session a expiré. Reconnectez-vous puis recommencez.');
          return;
        }
        const { error: verifyError } = await supabase.auth.signInWithPassword({ email, password: currentPassword });
        if (verifyError) {
          setError('Mot de passe actuel incorrect.');
          return;
        }
      }

      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(getPasswordErrorMessage(updateError));
        return;
      }

      // Un mot de passe changé parce qu'il a fuité ne sert à rien si les sessions
      // ouvertes ailleurs restent valides : on les révoque, sauf celle-ci.
      await supabase.auth.signOut({ scope: 'others' });

      setCurrentPassword('');
      setPassword('');
      setConfirmPassword('');
      setSuccess(true);
      onSuccess?.();
    } finally {
      setLoading(false);
    }
  };

  const labelClass = compact
    ? 'block font-semibold text-slate-700 mb-1'
    : 'block text-xs font-semibold text-slate-700 mb-1.5';
  const inputClass = compact
    ? 'w-full pl-8 pr-9 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500'
    : 'w-full pl-9 pr-10 py-2.5 text-sm border border-slate-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500';
  const iconClass = compact
    ? 'w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2'
    : 'w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2';

  const renderPasswordInput = (
    id: string,
    label: string,
    value: string,
    onChange: (value: string) => void,
    autoComplete: string,
    withToggle = false
  ) => (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <div className="relative">
        <Lock className={iconClass} />
        <input
          id={id}
          type={showPassword ? 'text' : 'password'}
          required
          autoComplete={autoComplete}
          placeholder="••••••••••"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        />
        {withToggle && (
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            aria-label={showPassword ? 'Masquer les mots de passe' : 'Afficher les mots de passe'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className={compact ? 'space-y-3' : 'space-y-4'}>
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-xs text-rose-800">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2 text-xs text-emerald-800">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>Mot de passe mis à jour. Les autres appareils connectés ont été déconnectés.</span>
        </div>
      )}

      {requireCurrentPassword &&
        renderPasswordInput('current-password', 'Mot de passe actuel *', currentPassword, setCurrentPassword, 'current-password')}

      <div className={compact ? 'grid grid-cols-1 sm:grid-cols-2 gap-3' : 'space-y-4'}>
        <div>
          {renderPasswordInput('new-password', 'Nouveau mot de passe *', password, setPassword, 'new-password', true)}
          <div className="flex items-center gap-1.5 mt-2">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={`h-1 flex-1 rounded-full ${passwordStrength > i ? 'bg-blue-600' : 'bg-slate-200'}`}
              />
            ))}
            <span className="text-[11px] font-semibold text-slate-500 ml-1 whitespace-nowrap">
              {MIN_PASSWORD_LENGTH} caractères minimum
            </span>
          </div>
        </div>
        {renderPasswordInput(
          'confirm-password',
          'Confirmer le nouveau mot de passe *',
          confirmPassword,
          setConfirmPassword,
          'new-password'
        )}
      </div>

      <div className={compact ? 'flex justify-end' : ''}>
        <button
          type="submit"
          disabled={loading}
          className={
            compact
              ? 'px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer transition-colors'
              : 'w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold rounded-[10px] shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer'
          }
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>{submitLabel}</span>
        </button>
      </div>
    </form>
  );
};
