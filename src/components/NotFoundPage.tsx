import React from 'react';
import { ArrowLeft, Calendar, Search, User, Users } from 'lucide-react';
import { LogoMark } from './Logo';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="h-16 flex items-center justify-between px-6 sm:px-8 bg-white border-b border-slate-200">
        <a href="/" className="flex items-center gap-3">
          <LogoMark size={36} />
          <span className="text-lg font-bold tracking-tight text-slate-900">
            Médic<span className="text-blue-600">Lab</span>
          </span>
        </a>
        <a
          href="/"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-[13px] font-semibold text-slate-900 hover:bg-slate-50"
        >
          Se connecter
        </a>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 sm:px-8 py-16">
        <div className="max-w-[680px] w-full text-center">
          <div className="flex items-center justify-center gap-3.5">
            <span className="text-7xl sm:text-[96px] font-extrabold tracking-tighter text-slate-900 leading-none">
              4
            </span>
            <svg width="82" height="82" viewBox="0 0 64 64" className="shrink-0 w-[62px] h-[62px] sm:w-[82px] sm:h-[82px]">
              <rect x="0" y="0" width="64" height="64" rx="20" fill="#eff6ff" />
              <rect x="27" y="14" width="10" height="36" rx="5" fill="#2563eb" />
              <rect x="14" y="27" width="36" height="10" rx="5" fill="#2563eb" opacity="0.45" />
            </svg>
            <span className="text-7xl sm:text-[96px] font-extrabold tracking-tighter text-slate-900 leading-none">
              4
            </span>
          </div>

          <h1 className="mt-8 text-2xl sm:text-[32px] font-extrabold tracking-tight text-slate-900 text-balance">
            Cette page n'est pas à son dossier
          </h1>
          <p className="mt-3.5 text-base leading-relaxed text-slate-500 max-w-[480px] mx-auto">
            L'adresse demandée n'existe pas ou a été déplacée. Vos patients, rendez-vous et documents, eux,
            sont bien là où vous les avez laissés.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
            <a
              href="/"
              className="inline-flex items-center gap-2 px-[22px] py-3 rounded-[10px] bg-blue-600 hover:bg-blue-700 text-white text-[15px] font-bold transition-colors"
            >
              <Calendar className="w-4 h-4" />
              Retour à l'agenda
            </a>
            <button
              type="button"
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-[10px] border border-slate-300 bg-white hover:bg-slate-50 text-slate-900 text-[15px] font-semibold cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Page précédente
            </button>
          </div>

          <div className="mt-12 pt-7 border-t border-slate-200">
            <div className="text-[11px] font-bold tracking-[0.12em] uppercase text-slate-500 mb-4">
              Accès rapides
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <a
                href="/"
                className="flex items-center gap-2.5 px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-left hover:border-slate-300 transition-colors"
              >
                <span className="w-8 h-8 rounded-[9px] bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4" />
                </span>
                <span className="text-sm font-semibold text-slate-900">Salle d'attente</span>
              </a>
              <a
                href="/"
                className="flex items-center gap-2.5 px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-left hover:border-slate-300 transition-colors"
              >
                <span className="w-8 h-8 rounded-[9px] bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </span>
                <span className="text-sm font-semibold text-slate-900">Dossiers patients</span>
              </a>
              <a
                href="/annuaire"
                className="flex items-center gap-2.5 px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-left hover:border-slate-300 transition-colors"
              >
                <span className="w-8 h-8 rounded-[9px] bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Search className="w-4 h-4" />
                </span>
                <span className="text-sm font-semibold text-slate-900">Annuaire public</span>
              </a>
            </div>
          </div>

          <p className="mt-7 text-[13px] text-slate-500">
            Le problème persiste ?{' '}
            <a href="mailto:contact@mediclab.sn" className="font-semibold text-blue-600 hover:text-blue-800">
              Écrivez à l'équipe MédicLab
            </a>
          </p>
        </div>
      </main>

      <footer className="px-6 sm:px-8 py-6 bg-slate-900 flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-2.5">
          <LogoMark size={26} />
          <span className="text-sm font-bold text-white">
            Médic<span className="text-blue-400">Lab</span>
          </span>
          <span className="text-xs text-slate-400">Erreur 404</span>
        </div>
        <div className="flex gap-5 text-xs text-slate-400">
          <span>Annuaire</span>
          <span>Confidentialité</span>
          <span>Contact</span>
        </div>
      </footer>
    </div>
  );
};
