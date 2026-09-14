import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Eye,
  EyeOff,
  FileText,
  Loader2,
  Lock,
  Mail,
  MessageCircle,
  ShieldCheck,
  Stethoscope,
  User,
} from 'lucide-react';
import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import { supabase } from '../lib/supabaseClient';
import { LogoMark } from './Logo';
import { MEDICAL_SPECIALTIES } from '../constants';

type Mode = 'signIn' | 'signUp' | 'forgotPassword';

const getPasswordStrength = (password: string): number => {
  if (password.length < 6) return 0;
  let score = 1;
  if (password.length >= 10) score += 1;
  if (/\d/.test(password) && /[a-zA-Z]/.test(password)) score += 1;
  return Math.min(score, 3);
};

interface AuthScreenProps {
  initialMode?: Mode;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ initialMode = 'signIn' }) => {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState(MEDICAL_SPECIALTIES[0]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      options: { data: { name, specialty } },
    });
    setLoading(false);
    if (signUpError) {
      setError(signUpError.message);
      return;
    }
    setInfoMessage(
      'Compte créé. Vérifiez votre boîte email pour confirmer votre compte avant de vous connecter.'
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
    setInfoMessage('Si un compte existe avec cet email, nous venons de lui envoyer un lien de réinitialisation.');
  };

  const passwordStrength = getPasswordStrength(password);

  let leftHeader: React.ReactNode;
  let leftFooter: React.ReactNode;
  let rightContent: React.ReactNode;

  if (mode === 'signIn') {
    leftHeader = (
      <>
        <h2 className="text-[34px] leading-[1.12] font-extrabold tracking-tight text-white max-w-[400px]">
          Votre cabinet vous attend.
        </h2>
        <p className="mt-4 text-[15px] leading-relaxed text-[#dbe7fb] max-w-[400px]">
          Agenda, salle d'attente, dossiers patients, ordonnances et règlements en FCFA, dans un
          espace qui n'appartient qu'à vous.
        </p>
        <div className="flex flex-col gap-3 mt-8">
          <div className="flex items-center gap-2.5 text-sm text-white">
            <ShieldCheck className="w-4 h-4 text-blue-300 shrink-0" />
            Données isolées par cabinet (RLS)
          </div>
          <div className="flex items-center gap-2.5 text-sm text-white">
            <MessageCircle className="w-4 h-4 text-blue-300 shrink-0" />
            Rappels WhatsApp intégrés
          </div>
          <div className="flex items-center gap-2.5 text-sm text-white">
            <FileText className="w-4 h-4 text-blue-300 shrink-0" />
            Ordonnances et dossiers en PDF
          </div>
        </div>
      </>
    );
    leftFooter = 'Secret professionnel · Données hébergées et chiffrées';

    rightContent = (
      <>
        <h1 className="text-[26px] font-extrabold tracking-tight text-slate-900">Connexion</h1>
        <p className="mt-2 mb-7 text-sm text-slate-500">Accédez à votre cabinet.</p>

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

        <form onSubmit={handleSignIn} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email *</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="cabinet@sante.sn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Mot de passe *</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-10 py-2.5 text-sm border border-slate-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600">
              <input
                type="checkbox"
                defaultChecked
                className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
              />
              <span className="text-[13px]">Rester connecté</span>
            </label>
            <button
              type="button"
              onClick={() => switchMode('forgotPassword')}
              className="text-[13px] font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
            >
              Mot de passe oublié ?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold rounded-[10px] shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>Se connecter</span>
          </button>
        </form>

        <div className="mt-7 pt-5 border-t border-slate-100 text-center text-[13px] text-slate-600">
          Pas encore de compte ?{' '}
          <button
            type="button"
            onClick={() => switchMode('signUp')}
            className="font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
          >
            Créer un cabinet
          </button>
        </div>
        <p className="mt-6 text-center text-[13px] text-slate-500">
          Vous êtes un patient ?{' '}
          <a href="/annuaire" className="font-semibold text-blue-600 hover:text-blue-800">
            Trouver un professionnel de santé →
          </a>
        </p>
      </>
    );
  } else if (mode === 'signUp') {
    leftHeader = (
      <>
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.12] border border-white/25 text-white text-xs font-semibold">
          30 jours d'essai gratuit
        </span>
        <h2 className="mt-[18px] text-[34px] leading-[1.12] font-extrabold tracking-tight text-white max-w-[420px]">
          Ouvrez votre espace en quelques minutes.
        </h2>
        <div className="flex flex-col gap-[18px] mt-8">
          <div className="flex gap-3.5">
            <span className="w-[26px] h-[26px] rounded-full bg-white text-blue-900 text-xs font-extrabold flex items-center justify-center shrink-0">
              1
            </span>
            <div>
              <div className="text-sm font-bold text-white">Créez votre compte</div>
              <div className="text-[13px] text-[#c7d7f5] mt-0.5">Nom, email, mot de passe.</div>
            </div>
          </div>
          <div className="flex gap-3.5">
            <span className="w-[26px] h-[26px] rounded-full bg-white/[0.18] text-white text-xs font-extrabold flex items-center justify-center shrink-0">
              2
            </span>
            <div>
              <div className="text-sm font-bold text-white">Confirmez par email</div>
              <div className="text-[13px] text-[#c7d7f5] mt-0.5">Vous recevez le lien tout de suite.</div>
            </div>
          </div>
          <div className="flex gap-3.5">
            <span className="w-[26px] h-[26px] rounded-full bg-white/[0.18] text-white text-xs font-extrabold flex items-center justify-center shrink-0">
              3
            </span>
            <div>
              <div className="text-sm font-bold text-white">Renseignez votre profil</div>
              <div className="text-[13px] text-[#c7d7f5] mt-0.5">
                Spécialité, numéro d'ordre professionnel, tarif de consultation.
              </div>
            </div>
          </div>
        </div>
      </>
    );
    leftFooter = 'Aucune carte bancaire demandée';

    rightContent = (
      <>
        <h1 className="text-[26px] font-extrabold tracking-tight text-slate-900">Créer un compte</h1>
        <p className="mt-2 mb-6 text-sm text-slate-500">
          Chaque compte dispose de son propre espace, totalement isolé.
        </p>

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

        <form onSubmit={handleSignUp} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Nom complet *</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="Dr. Cheikh Oumar Diop"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Spécialité *</label>
            <div className="relative">
              <Stethoscope className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                required
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="w-full pl-9 pr-9 py-2.5 text-sm border border-slate-300 rounded-[10px] bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {MEDICAL_SPECIALTIES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email *</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="cabinet@sante.sn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Mot de passe *</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-10 py-2.5 text-sm border border-slate-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className={`h-1 flex-1 rounded-full ${
                    passwordStrength > i ? 'bg-blue-600' : 'bg-slate-200'
                  }`}
                />
              ))}
              <span className="text-[11px] font-semibold text-slate-500 ml-1 whitespace-nowrap">
                6 caractères minimum
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold rounded-[10px] shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>Créer mon compte</span>
          </button>
          <p className="text-[12px] leading-relaxed text-slate-500 text-center">
            En créant un compte, vous acceptez les conditions d'utilisation et la politique de
            confidentialité.
          </p>
        </form>

        <div className="mt-5 pt-4 border-t border-slate-100 text-center text-[13px] text-slate-600">
          Déjà un cabinet ?{' '}
          <button
            type="button"
            onClick={() => switchMode('signIn')}
            className="font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
          >
            Se connecter
          </button>
        </div>
      </>
    );
  } else {
    leftHeader = (
      <>
        <h2 className="text-[34px] leading-[1.12] font-extrabold tracking-tight text-white max-w-[400px]">
          Reprenez la main sur votre compte.
        </h2>
        <p className="mt-4 text-[15px] leading-relaxed text-[#dbe7fb] max-w-[400px]">
          Nous envoyons un lien de réinitialisation à l'adresse associée à votre cabinet. Vos données
          restent intactes.
        </p>
      </>
    );
    leftFooter = 'Besoin d\'aide ? contact@mediclab.sn';

    rightContent = (
      <>
        <button
          type="button"
          onClick={() => switchMode('signIn')}
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Retour à la connexion
        </button>

        <h1 className="mt-4 text-[26px] font-extrabold tracking-tight text-slate-900">Mot de passe oublié</h1>
        <p className="mt-2 mb-5 text-sm text-slate-500">
          Recevez un lien pour réinitialiser votre mot de passe par email.
        </p>

        {error && (
          <div className="mb-4 flex items-start gap-2 p-3 rounded-[10px] bg-rose-50 border border-rose-200">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-px" />
            <span className="text-[13px] leading-relaxed text-rose-800">{error}</span>
          </div>
        )}

        {infoMessage && (
          <div className="mb-4 flex items-start gap-2 p-3 rounded-[10px] bg-emerald-50 border border-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-px" />
            <span className="text-[13px] leading-relaxed text-emerald-800">{infoMessage}</span>
          </div>
        )}

        <form onSubmit={handleForgotPassword} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email *</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="cabinet@sante.sn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold rounded-[10px] shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>Envoyer le lien de réinitialisation</span>
          </button>
        </form>
      </>
    );
  }

  const fadeTransition = { duration: 0.18, ease: 'easeOut' as const };

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white">
        <div className="hidden lg:flex flex-col justify-between bg-blue-900 p-12">
          <div className="flex items-center gap-3">
            <LogoMark size={36} />
            <span className="text-lg font-bold text-white tracking-tight">
              Médic<span className="text-blue-300">Lab</span>
            </span>
          </div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={fadeTransition}
            >
              {leftHeader}
            </motion.div>
          </AnimatePresence>
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={mode}
              className="text-xs text-[#a9c3ee]"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={fadeTransition}
            >
              {leftFooter}
            </motion.p>
          </AnimatePresence>
        </div>

        <div className="flex flex-col justify-center p-6 sm:p-12 lg:p-14">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={mode}
              className="max-w-[400px] w-full mx-auto"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={fadeTransition}
            >
              {rightContent}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </MotionConfig>
  );
};
