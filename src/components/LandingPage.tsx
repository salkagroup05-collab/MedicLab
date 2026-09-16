import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import {
  ArrowRight,
  BarChart3,
  Calendar,
  ClipboardList,
  Download,
  FileText,
  Lock,
  Menu,
  MessageCircle,
  Search,
  ShieldCheck,
  User,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { LogoMark } from './Logo';

const NAV_LINKS = [
  { label: 'Fonctionnalités', href: '#fonctionnalites' },
  { label: 'Rappels WhatsApp', href: '#rappels-whatsapp' },
  { label: 'Annuaire', href: '/annuaire' },
  { label: 'Se connecter', href: '/connexion' },
] as const;

const FEATURES = [
  {
    icon: Calendar,
    title: 'Agenda & rendez-vous',
    description:
      'Vues jour, semaine et mois. Statuts confirmé, en attente, en cours, terminé, annulé, absent.',
  },
  {
    icon: Users,
    title: "Salle d'attente",
    description: "Heure d'arrivée, temps d'attente calculé, démarrage de la consultation en un clic.",
  },
  {
    icon: User,
    title: 'Dossiers patients',
    description:
      'Antécédents, allergies, groupe sanguin, historique des RDV et règlements, export PDF.',
  },
  {
    icon: ClipboardList,
    title: 'Consultations SOAP',
    description: 'Constantes vitales et notes structurées Subjectif, Objectif, Analyse, Plan.',
  },
  {
    icon: FileText,
    title: 'Ordonnances & courriers',
    description: "Ordonnances prêtes à imprimer et lettres d'orientation vers un spécialiste.",
  },
  {
    icon: BarChart3,
    title: 'Activité & honoraires',
    description:
      "Chiffre d'affaires par moyen de paiement, taux d'assiduité, annulations et absences.",
  },
] as const;

const STATS = [
  { value: '30 j', label: "d'essai, tout inclus" },
  { value: '7', label: 'moyens de règlement suivis' },
  { value: '3', label: "vues d'agenda : jour, semaine, mois" },
  { value: 'PDF', label: 'dossier patient exportable' },
] as const;

const TRUST_SIGNALS = [
  { icon: ShieldCheck, label: 'Données isolées par cabinet (Postgres RLS)' },
  { icon: Download, label: 'Données exportables à tout moment (JSON)' },
  { icon: Wallet, label: 'Wave, Orange Money, espèces, carte, mutuelle / IPM' },
  { icon: Lock, label: 'Secret médical respecté' },
] as const;

const STEPS = [
  { title: 'Créez votre compte', description: 'Nom, email, mot de passe.' },
  { title: 'Confirmez par email', description: 'Vous recevez le lien tout de suite.' },
  {
    title: 'Renseignez votre profil',
    description: "Spécialité, numéro d'ordre professionnel, tarif de consultation.",
  },
] as const;

const WHATSAPP_EXAMPLE = `Bonjour M. Diallo,

Nous vous confirmons votre rendez-vous médical avec le Dr. Fatou Sow (Médecine générale) :
🗓️ Date : mardi 17 septembre 2026
⏰ Heure : 10:30
🏥 Lieu : Cabinet médical, Dakar
📋 Motif : Consultation de suivi

⚠️ En cas d'empêchement, merci de prévenir au moins 24h à l'avance.`;

const FAQ = [
  {
    question: 'Mes données sont-elles séparées des autres cabinets ?',
    answer: 'Oui. Chaque compte dispose de son espace, isolé au niveau de la base par des règles RLS.',
  },
  {
    question: 'Puis-je récupérer mes données ?',
    answer: 'Export complet du cabinet en JSON, et réimportation quand vous le souhaitez.',
  },
  {
    question: 'Quels moyens de paiement patients sont suivis ?',
    answer: 'Wave, Orange Money, espèces, carte, chèque, mutuelle / IPM et tiers payant.',
  },
] as const;

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
};

export const LandingPage: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showExample, setShowExample] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-white">
        {/* Top navigation */}
        <div className="sticky top-0 z-50 bg-blue-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 gap-4">
              <a href="/" className="flex items-center gap-3 shrink-0">
                <LogoMark size={36} />
                <span className="text-lg font-bold tracking-tight text-white">
                  Médic<span className="text-blue-300">Lab</span>
                </span>
              </a>
              <nav className="hidden md:flex items-center gap-7">
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="text-[13px] font-medium text-hero-nav-link hover:text-white"
                  >
                    {link.label}
                  </a>
                ))}
                <a
                  href="/inscription"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-semibold transition-colors"
                >
                  Créer mon cabinet
                </a>
              </nav>
              <div className="md:hidden flex items-center gap-2 shrink-0">
                <a
                  href="/inscription"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-semibold transition-colors"
                >
                  <span className="sm:hidden">S'inscrire</span>
                  <span className="hidden sm:inline">Créer mon cabinet</span>
                </a>
                <button
                  type="button"
                  onClick={() => setMenuOpen((open) => !open)}
                  aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
                  aria-expanded={menuOpen}
                  aria-controls="mobile-nav-panel"
                  className="inline-flex items-center justify-center w-11 h-11 rounded-lg text-white hover:bg-white/10 transition-colors"
                >
                  {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
          <AnimatePresence initial={false}>
            {menuOpen && (
              <motion.nav
                id="mobile-nav-panel"
                aria-label="Menu mobile"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="md:hidden overflow-hidden border-t border-white/10"
              >
                <div className="px-4 sm:px-6 lg:px-8 py-2 flex flex-col">
                  {NAV_LINKS.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      className="min-h-11 flex items-center text-[15px] font-medium text-hero-nav-link hover:text-white"
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              </motion.nav>
            )}
          </AnimatePresence>
        </div>

        {/* Patient strip */}
        <div className="bg-slate-50 border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <span className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Search className="w-5 h-5" />
              </span>
              <div>
                <div className="text-[15px] font-bold text-slate-900">Vous êtes un patient ?</div>
                <div className="text-[13px] text-slate-500">
                  Trouvez un professionnel de santé près de vous dans l'annuaire public.
                </div>
              </div>
            </div>
            <a
              href="/annuaire"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-[13px] font-semibold text-slate-900 hover:bg-slate-50 transition-colors shrink-0 self-start sm:self-auto"
            >
              Ouvrir l'annuaire <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Hero */}
        <div className="bg-blue-900 px-4 sm:px-6 lg:px-8 pt-16 pb-14 sm:pt-[72px] sm:pb-16">
          <div className="max-w-7xl mx-auto">
            <div className="max-w-[760px]">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/12 border border-white/25 text-white text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" /> Données isolées par cabinet · Postgres RLS
              </span>
              <h1 className="mt-5 text-[34px] sm:text-[44px] lg:text-[52px] leading-[1.08] sm:leading-[1.06] font-extrabold tracking-tight text-white text-pretty">
                L'agenda et les dossiers de votre cabinet, tenus au même endroit.
              </h1>
              <p className="mt-5 text-base sm:text-[17px] leading-relaxed text-hero-body max-w-[620px]">
                MédicLab gère le flux quotidien du praticien indépendant : prise de rendez-vous, salle
                d'attente, consultations SOAP, ordonnances imprimables, règlements en FCFA et rappels
                WhatsApp.
              </p>
              <div className="flex flex-wrap items-center gap-3.5 sm:gap-4 mt-8">
                <a
                  href="/inscription"
                  className="inline-flex items-center gap-2 px-[22px] py-3.5 rounded-xl bg-white text-blue-900 text-[15px] font-bold hover:bg-blue-50 transition-colors"
                >
                  Créer mon cabinet gratuitement <ArrowRight className="w-4 h-4" />
                </a>
                <a
                  href="mailto:contact@mediclab.sn"
                  className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl border border-white/35 text-white text-[15px] font-semibold hover:bg-white/10 transition-colors"
                >
                  Parler à l'équipe
                </a>
                <span className="text-[13px] text-hero-microcopy">
                  30 jours d'essai gratuit · sans carte bancaire
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-px mt-12 sm:mt-14 bg-white/18 border border-white/18 rounded-xl overflow-hidden">
              {STATS.map((stat) => (
                <div key={stat.label} className="p-5 sm:p-[22px] bg-blue-900">
                  <div className="text-2xl sm:text-[28px] font-extrabold text-white">{stat.value}</div>
                  <div className="text-xs font-medium text-hero-stat-label mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Trust / security strip */}
        <div className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-5 sm:gap-6">
            {TRUST_SIGNALS.map((item, i) => (
              <motion.div
                key={item.label}
                {...fadeUp}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="flex items-center gap-2.5"
              >
                <item.icon className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="text-[13px] leading-snug text-slate-600">{item.label}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Product screenshot */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-12 sm:py-14">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-6">
              <div>
                <h2 className="text-2xl sm:text-[28px] font-bold tracking-tight text-slate-900">
                  Votre journée, en une vue
                </h2>
                <p className="mt-2 text-[15px] text-slate-500">
                  Planning, statuts de rendez-vous, salle d'attente et rappels dans une seule interface.
                </p>
              </div>
              <a
                href="#fonctionnalites"
                className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-blue-600 hover:text-blue-800 shrink-0"
              >
                Voir toutes les vues <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-soft">
              <img
                src="/images/landing-agenda-preview.png"
                alt="Agenda MédicLab"
                width={1887}
                height={910}
                loading="lazy"
                decoding="async"
                className="block w-full h-auto"
              />
            </div>
          </div>
        </div>

        {/* Feature grid */}
        <div id="fonctionnalites" className="px-4 sm:px-6 lg:px-8 py-12 sm:py-14 scroll-mt-20">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl sm:text-[28px] font-bold tracking-tight text-slate-900 mb-7">
              Ce que couvre MédicLab
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {FEATURES.map((feature, i) => (
                <motion.div
                  key={feature.title}
                  {...fadeUp}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className="border border-slate-200 rounded-xl p-[22px] bg-white"
                >
                  <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <feature.icon className="w-[18px] h-[18px]" />
                  </div>
                  <h3 className="mt-3.5 mb-1.5 text-base font-bold text-slate-900">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-500">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* WhatsApp callout */}
        <div id="rappels-whatsapp" className="px-4 sm:px-6 lg:px-8 mb-12 sm:mb-14 scroll-mt-20">
          <div className="max-w-7xl mx-auto border border-emerald-200 bg-emerald-50 rounded-2xl p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-8">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <MessageCircle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="mb-1.5 text-lg sm:text-xl font-bold text-emerald-900">
                  Moins d'absences, grâce aux rappels WhatsApp
                </h3>
                <p className="text-sm leading-relaxed text-emerald-800 max-w-[640px]">
                  MédicLab repère les rendez-vous des 24 à 48 prochaines heures, prépare un message
                  personnalisé avec la date, l'heure et le nom du cabinet, et l'envoie en un clic. Les
                  rappels déjà expédiés sont suivis.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowExample((v) => !v)}
                aria-expanded={showExample}
                aria-controls="whatsapp-example-message"
                className="inline-flex items-center gap-2 px-[18px] py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shrink-0 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
              >
                {showExample ? 'Masquer l’exemple' : 'Voir un exemple de message'}
              </button>
            </div>
            <AnimatePresence initial={false}>
              {showExample && (
                <motion.div
                  id="whatsapp-example-message"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22 }}
                  className="overflow-hidden"
                >
                  <div className="mt-6 rounded-xl bg-[#ECE5DD] p-4 sm:p-5">
                    <div className="max-w-[420px] bg-white rounded-lg rounded-tl-none shadow-sm p-3.5">
                      <p className="text-[13px] leading-relaxed text-slate-800 whitespace-pre-line">
                        {WHATSAPP_EXAMPLE}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* How it works */}
        <div className="px-4 sm:px-6 lg:px-8 mb-12 sm:mb-14">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl sm:text-[28px] font-bold tracking-tight text-slate-900 mb-7">
              Comment ça marche
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
              {STEPS.map((step, i) => (
                <motion.div key={step.title} {...fadeUp} transition={{ duration: 0.3, delay: i * 0.05 }}>
                  <span className="w-[26px] h-[26px] rounded-full bg-blue-600 text-white text-xs font-extrabold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <h3 className="mt-3 mb-1 text-base font-bold text-slate-900">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-500">{step.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Trial + FAQ */}
        <div className="bg-slate-50 border-t border-slate-200 px-4 sm:px-6 lg:px-8 py-12 sm:py-14">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-10">
            <div className="flex-1">
              <h2 className="mb-2 text-2xl sm:text-[28px] font-bold tracking-tight text-slate-900">
                Essayez sans engagement
              </h2>
              <p className="mb-5 text-[15px] leading-relaxed text-slate-500 max-w-[420px]">
                30 jours d'essai gratuit avec toutes les fonctionnalités. Pour l'abonnement, notre
                équipe vous propose une formule adaptée à votre cabinet.
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="/inscription"
                  className="inline-flex items-center gap-2 px-5 py-[13px] rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[15px] font-bold transition-colors"
                >
                  Créer mon cabinet gratuitement
                </a>
                <a
                  href="mailto:contact@mediclab.sn"
                  className="inline-flex items-center gap-2 px-5 py-[13px] rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-900 text-[15px] font-semibold transition-colors"
                >
                  Contacter l'équipe
                </a>
              </div>
            </div>
            <div className="w-full lg:w-[400px] shrink-0 bg-white border border-slate-200 rounded-2xl p-6">
              <h3 className="mb-3.5 text-sm font-bold text-slate-900">Questions fréquentes</h3>
              <div className="flex flex-col gap-3">
                {FAQ.map((item, i) => (
                  <div
                    key={item.question}
                    className={i < FAQ.length - 1 ? 'pb-3 border-b border-slate-100' : ''}
                  >
                    <div className="text-[13px] font-semibold text-slate-900">{item.question}</div>
                    <div className="text-[13px] leading-relaxed text-slate-500 mt-1">{item.answer}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-slate-900 px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-5 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              <div className="flex items-center gap-2.5">
                <LogoMark size={28} />
                <span className="text-sm font-bold text-white">
                  Médic<span className="text-blue-400">Lab</span>
                </span>
              </div>
              <span className="text-xs text-slate-400">
                Agenda &amp; gestion médicale pour praticiens indépendants
              </span>
            </div>
            <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-slate-400">
              <a href="/annuaire" className="hover:text-white">
                Annuaire
              </a>
              <span>Confidentialité</span>
              <span>Secret médical</span>
              <a href="mailto:contact@mediclab.sn" className="hover:text-white">
                Contact
              </a>
            </div>
          </div>
        </footer>
      </div>
    </MotionConfig>
  );
};
