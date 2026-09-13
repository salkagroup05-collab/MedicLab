import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, Lock, Mail, Stethoscope, User } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

type Mode = 'signIn' | 'signUp' | 'forgotPassword';

export const AuthScreen: React.FC = () => {
  const [mode, setMode] = useState<Mode>('signIn');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const resetFeedback = () => {
    setError(null);
    setInfoMessage(null);
  };

  const switchMode = (next: Mode) => {
    resetFeedback();
    setMode(next);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFeedback();
    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signInError) {
      setError(
        signInError.message.includes('Invalid login credentials')
          ? 'Email ou mot de passe incorrect.'
          : signInError.message
      );
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFeedback();
    setLoading(true);
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    setLoading(false);
    if (signUpError) {
      setError(signUpError.message);
      return;
    }
    setInfoMessage(
      'Compte créé avec succès. Vérifiez votre boîte email pour confirmer votre compte avant de vous connecter.'
    );
    setMode('signIn');
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFeedback();
    setLoading(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    setLoading(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setInfoMessage('Si un compte existe avec cet email, un lien de réinitialisation vient de lui être envoyé.');
  };

  const handleSubmit =
    mode === 'signIn' ? handleSignIn : mode === 'signUp' ? handleSignUp : handleForgotPassword;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-200 mb-3">
            <Stethoscope className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Cabinet Santé</h1>
          <p className="text-xs text-slate-500 mt-1">Agenda & gestion médicale pour praticiens indépendants</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6">
          <div className="mb-5">
            <h2 className="text-base font-bold text-slate-900">
              {mode === 'signIn' && 'Connexion'}
              {mode === 'signUp' && 'Créer un compte'}
              {mode === 'forgotPassword' && 'Mot de passe oublié'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {mode === 'signIn' && 'Accédez à votre cabinet.'}
              {mode === 'signUp' && 'Chaque compte dispose de son propre espace, totalement isolé.'}
              {mode === 'forgotPassword' && 'Recevez un lien pour réinitialiser votre mot de passe par email.'}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {infoMessage && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{infoMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signUp' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nom complet *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Dr. Cheikh Oumar Diop"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="cabinet@sante.sn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {mode !== 'forgotPassword' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mot de passe *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            {mode === 'signIn' && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => switchMode('forgotPassword')}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
                >
                  Mot de passe oublié ?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>
                {mode === 'signIn' && 'Se connecter'}
                {mode === 'signUp' && 'Créer mon compte'}
                {mode === 'forgotPassword' && 'Envoyer le lien de réinitialisation'}
              </span>
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-slate-100 text-center text-xs text-slate-600">
            {mode === 'signIn' && (
              <span>
                Pas encore de compte ?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('signUp')}
                  className="font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                >
                  Créer un cabinet
                </button>
              </span>
            )}
            {(mode === 'signUp' || mode === 'forgotPassword') && (
              <span>
                <button
                  type="button"
                  onClick={() => switchMode('signIn')}
                  className="font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                >
                  ← Retour à la connexion
                </button>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
