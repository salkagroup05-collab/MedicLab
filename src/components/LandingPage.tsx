import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import {
  ArrowRight,
  Building2,
  Calendar,
  CalendarCheck,
  Check,
  CheckCheck,
  ClipboardList,
  Database,
  Download,
  FileText,
  HeartPulse,
  Lock,
  Menu,
  Search,
  ShieldCheck,
  Stethoscope,
  User,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { LogoMark } from './Logo';

const NAV_LINKS = [
  { label: 'Fonctionnalités', href: '#fonctionnalites' },
  { label: 'Sécurité', href: '#securite' },
  { label: 'Questions', href: '#questions' },
  { label: 'Se connecter', href: '/connexion' },
] as const;

const AUDIENCES = [
  {
    icon: Stethoscope,
    title: 'Médecins généralistes',
    description: 'Le flux complet de la journée, du premier rendez-vous au dossier classé.',
  },
  {
    icon: HeartPulse,
    title: 'Spécialistes',
    description: 'Courriers confraternels pré-remplis et suivi des actes par spécialité.',
  },
  {
    icon: Building2,
    title: 'Petits cabinets',
    description: 'Un espace par praticien, strictement séparé des autres.',
  },
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
    icon: Wallet,
    title: 'Règlements en FCFA',
    description: 'Wave, Orange Money, espèces, carte, chèque, mutuelle / IPM et tiers payant.',
  },
] as const;

const WHATSAPP_CHECKLIST = [
  'Message pré-rempli, modifiable avant envoi',
  'Envoi direct depuis le navigateur, sans logiciel tiers',
  "Patients exclus d'un rappel en un clic",
] as const;

const WHATSAPP_EXAMPLE = `Bonjour M. Diallo,

Nous vous confirmons votre rendez-vous médical avec le Dr. Fatou Sow (Médecine générale) :
🗓️ Date : mardi 17 septembre 2026
⏰ Heure : 10:30
🏥 Lieu : Cabinet médical, Dakar
📋 Motif : Consultation de suivi

⚠️ En cas d'empêchement, merci de prévenir au moins 24h à l'avance.`;

const SECURITY_ITEMS = [
  {
    icon: ShieldCheck,
    title: 'Isolation par cabinet',
    description:
      "Des règles Row Level Security Postgres empêchent tout accès aux données d'un autre praticien, y compris en cas d'erreur applicative.",
  },
  {
    icon: Lock,
    title: 'Secret médical',
    description:
      "Accès par compte nominatif avec confirmation d'email. Les documents générés portent la mention légale de secret professionnel.",
  },
  {
    icon: Download,
    title: 'Export & réversibilité',
    description:
      'Export complet du cabinet au format JSON, réimportable. Dossiers patients exportables en PDF officiel.',
  },
  {
    icon: Database,
    title: 'Hébergement',
    description:
      'Base Postgres managée avec sauvegardes automatiques et connexions chiffrées de bout en bout.',
  },
] as const;

const STEPS = [
  { title: 'Créez votre compte', description: 'Nom, email, mot de passe.' },
  { title: 'Confirmez par email', description: 'Vous recevez le lien tout de suite.' },
  {
    title: 'Renseignez votre profil',
    description: "Spécialité, numéro d'ordre professionnel, tarif de consultation.",
  },
] as const;

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
  {
    question: 'Que se passe-t-il après les 30 jours ?',
    answer:
      "L'équipe vous propose une formule adaptée à votre cabinet. Vos données restent exportables dans tous les cas.",
  },
  {
    question: 'Faut-il installer un logiciel ?',
    answer: 'Non. SunuMed fonctionne dans le navigateur, sur ordinateur comme sur téléphone.',
  },
  {
    question: 'Plusieurs praticiens peuvent-ils partager un cabinet ?',
    answer:
      'Chaque praticien crée son compte et son espace. Écrivez-nous pour une organisation à plusieurs praticiens.',
  },
  {
    question: 'Les rappels WhatsApp sont-ils automatiques ?',
    answer: 'SunuMed détecte les rendez-vous proches et prépare les messages ; vous validez l’envoi.',
  },
  {
    question: 'Les ordonnances sont-elles à mon en-tête ?',
    answer: "Oui : nom, spécialité, adresse et téléphone du cabinet, avec bloc signature.",
  },
] as const;

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
};

export const LandingPage: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);

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
      <div className="min-h-screen bg-[#faf8f5] text-[#1b2436]">
        {/* Top navigation */}
        <div className="sticky top-0 z-50 bg-[rgba(250,248,245,0.92)] backdrop-blur-[10px] border-b border-[#e9e3da]">
          <div className="max-w-[1180px] mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between h-[68px] gap-4">
              <a href="/" className="flex items-center gap-[11px] shrink-0 text-[#14294d]">
                <LogoMark size={32} />
                <span className="text-[22px] font-bold tracking-tight text-[#14294d]">
                  Sunu<span className="text-[#2563eb]">Med</span>
                </span>
              </a>
              <nav className="hidden md:flex items-center gap-[26px]">
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="text-sm font-medium text-[#4a5568] hover:text-[#14294d]"
                  >
                    {link.label}
                  </a>
                ))}
                <a
                  href="/inscription"
                  className="inline-flex items-center gap-[7px] px-[17px] py-2.5 rounded-[10px] bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-sm font-semibold transition-colors"
                >
                  Essayer 30 jours
                </a>
              </nav>
              <div className="md:hidden flex items-center gap-2 shrink-0">
                <a
                  href="/inscription"
                  className="inline-flex items-center gap-[7px] px-[17px] py-2.5 rounded-[10px] bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-sm font-semibold transition-colors"
                >
                  <span className="sm:hidden">S'inscrire</span>
                  <span className="hidden sm:inline">Essayer 30 jours</span>
                </a>
                <button
                  type="button"
                  onClick={() => setMenuOpen((open) => !open)}
                  aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
                  aria-expanded={menuOpen}
                  aria-controls="mobile-nav-panel"
                  className="inline-flex items-center justify-center w-11 h-11 rounded-lg text-[#14294d] hover:bg-black/5 transition-colors"
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
                className="md:hidden overflow-hidden border-t border-[#e9e3da]"
              >
                <div className="px-4 sm:px-6 py-2 flex flex-col">
                  {NAV_LINKS.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      className="min-h-11 flex items-center text-[15px] font-medium text-[#4a5568] hover:text-[#14294d]"
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
        <div className="bg-[#f1ece4] border-b border-[#e9e3da]">
          <div className="max-w-[1180px] mx-auto px-4 sm:px-6 py-[11px] flex flex-wrap items-center gap-2.5 text-[13px] text-[#5b6472]">
            <Search className="w-[15px] h-[15px] text-[#2563eb] shrink-0" />
            <span>Vous êtes un patient ? Trouvez un professionnel de santé près de chez vous.</span>
            <a
              href="/annuaire"
              className="font-semibold text-[#2563eb] hover:text-[#1d4ed8] inline-flex items-center gap-[5px]"
            >
              Ouvrir l'annuaire <ArrowRight className="w-[13px] h-[13px]" />
            </a>
          </div>
        </div>

        {/* Hero */}
        <section className="max-w-[1180px] mx-auto px-4 sm:px-6 pt-14 sm:pt-[72px] pb-12 sm:pb-16">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(340px,1fr))] gap-10 sm:gap-12 items-center">
            <div>
              <span className="inline-flex items-center gap-2 px-3.5 py-[7px] rounded-full bg-white border border-[#e4ddd2] text-[12.5px] font-semibold text-[#14294d]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#2563eb]" />
                Dossiers isolés par cabinet · secret médical respecté
              </span>
              <h1 className="mt-[26px] font-['Newsreader',_Georgia,_serif] font-normal text-[38px] sm:text-[48px] lg:text-[56px] leading-[1.08] tracking-tight text-[#14294d] text-pretty">
                Tout votre cabinet, tenu <span className="italic text-[#2563eb]">au même endroit</span>.
              </h1>
              <p className="mt-[22px] text-[16px] sm:text-[17.5px] leading-[1.7] text-[#5b6472] max-w-[520px]">
                Rendez-vous, salle d'attente, dossiers patients, consultations SOAP, ordonnances
                imprimables et suivi des règlements. Un seul outil pour la journée du praticien
                indépendant.
              </p>
              <div className="flex flex-wrap items-center gap-3.5 mt-8">
                <a
                  href="/inscription"
                  className="inline-flex items-center gap-[9px] px-6 py-[15px] rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[15.5px] font-bold transition-colors"
                >
                  Essayer 30 jours <ArrowRight className="w-[17px] h-[17px]" />
                </a>
                <a
                  href="mailto:contact@sunumed.sn"
                  className="inline-flex items-center gap-2 px-[22px] py-[15px] rounded-xl border border-[#d9d1c5] bg-white hover:bg-[#f5f1ea] text-[#14294d] text-[15.5px] font-semibold transition-colors"
                >
                  Parler à l'équipe
                </a>
              </div>
              <div className="mt-4 text-[13.5px] text-[#6b6255]">
                Sans carte bancaire · toutes les fonctionnalités
              </div>
            </div>

            <div className="relative min-w-0">
              <img
                src="/images/landing-hero-praticien.webp"
                alt="Médecin en consultation dans son cabinet"
                width={1100}
                height={733}
                loading="eager"
                decoding="async"
                className="w-full h-[300px] sm:h-[380px] lg:h-[440px] object-cover rounded-[20px]"
              />
              <div className="absolute left-3 sm:-left-[18px] bottom-6 bg-white border border-[#e4ddd2] rounded-2xl px-[18px] py-3.5 shadow-soft flex items-center gap-3 max-w-[280px]">
                <span className="w-[34px] h-[34px] rounded-[10px] bg-[#eff4fe] text-[#2563eb] flex items-center justify-center shrink-0">
                  <CalendarCheck className="w-[18px] h-[18px]" />
                </span>
                <div>
                  <div className="text-[13.5px] font-bold text-[#14294d]">Consultation de suivi</div>
                  <div className="text-[12.5px] text-[#6b6255]">10:30 · confirmé</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-14 sm:mt-16 border-t border-[#e4ddd2] pt-7 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-x-10 gap-y-6 items-start">
            <div className="text-[13px] font-bold tracking-[0.09em] uppercase text-[#6b6255] leading-relaxed">
              Pensé pour
              <br />
              l'exercice libéral
            </div>
            {AUDIENCES.map((audience, i) => (
              <motion.div
                key={audience.title}
                {...fadeUp}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="flex items-start gap-[11px]"
              >
                <audience.icon className="w-[18px] h-[18px] text-[#2563eb] shrink-0 mt-0.5" />
                <div>
                  <div className="text-[14.5px] font-bold text-[#14294d]">{audience.title}</div>
                  <div className="text-[13px] leading-relaxed text-[#5b6472] mt-[3px]">
                    {audience.description}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Agenda screenshot */}
        <section className="max-w-[1180px] mx-auto px-4 sm:px-6 pb-14 sm:pb-[72px]">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-[22px]">
            <div>
              <div className="text-xs font-bold tracking-[0.09em] uppercase text-[#6b6255]">
                L'agenda
              </div>
              <h2 className="mt-2.5 font-['Newsreader',_Georgia,_serif] font-normal text-[30px] sm:text-4xl leading-[1.15] text-[#14294d]">
                Votre journée, d'un seul regard
              </h2>
            </div>
            <p className="text-[14.5px] leading-relaxed text-[#5b6472] max-w-[380px]">
              Jour, semaine ou mois. Chaque rendez-vous porte son statut, son motif, son tarif et son
              règlement.
            </p>
          </div>
          <div className="border border-[#e4ddd2] rounded-[18px] overflow-hidden bg-white shadow-soft">
            <img
              src="/images/landing-agenda-preview.png"
              alt="Vue agenda de SunuMed"
              width={1887}
              height={910}
              loading="lazy"
              decoding="async"
              className="block w-full h-auto"
            />
          </div>
        </section>

        {/* Feature grid */}
        <section
          id="fonctionnalites"
          className="bg-white border-y border-[#eee7dd] scroll-mt-20"
        >
          <div className="max-w-[1180px] mx-auto px-4 sm:px-6 py-14 sm:py-[72px]">
            <div className="text-xs font-bold tracking-[0.09em] uppercase text-[#6b6255]">
              Le cabinet au complet
            </div>
            <h2 className="mt-2.5 mb-9 font-['Newsreader',_Georgia,_serif] font-normal text-[32px] sm:text-[40px] leading-[1.12] text-[#14294d] max-w-[620px]">
              De la prise de rendez-vous au dossier archivé
            </h2>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(290px,1fr))] gap-x-11 gap-y-[34px]">
              {FEATURES.map((feature, i) => (
                <motion.div
                  key={feature.title}
                  {...fadeUp}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                >
                  <div className="w-[38px] h-[38px] rounded-[10px] bg-[#eff4fe] text-[#2563eb] flex items-center justify-center">
                    <feature.icon className="w-[19px] h-[19px]" />
                  </div>
                  <h3 className="mt-4 mb-[7px] text-[17px] font-bold text-[#14294d]">
                    {feature.title}
                  </h3>
                  <p className="text-[14.5px] leading-relaxed text-[#5b6472]">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* WhatsApp callout */}
        <section id="rappels-whatsapp" className="max-w-[1180px] mx-auto px-4 sm:px-6 py-14 sm:py-[72px] scroll-mt-20">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-11 items-center">
            <div>
              <div className="text-xs font-bold tracking-[0.09em] uppercase text-[#059669]">
                Rappels WhatsApp
              </div>
              <h2 className="mt-2.5 mb-4 font-['Newsreader',_Georgia,_serif] font-normal text-[32px] sm:text-[40px] leading-[1.12] text-[#14294d]">
                Moins de patients qui ne viennent pas
              </h2>
              <p className="mb-[22px] text-base leading-[1.75] text-[#5b6472] max-w-[480px]">
                SunuMed repère les rendez-vous des 24 à 48 prochaines heures, prépare un message avec
                la date, l'heure et le nom du cabinet, et l'envoie en un clic. Les rappels déjà expédiés
                restent suivis.
              </p>
              <div className="flex flex-col gap-3">
                {WHATSAPP_CHECKLIST.map((item) => (
                  <div key={item} className="flex items-start gap-2.5 text-[14.5px] leading-snug text-[#14294d]">
                    <Check className="w-[17px] h-[17px] text-[#059669] shrink-0 mt-0.5" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-[#ECE5DD] rounded-[18px] p-6 border border-[#e0d8cc]">
              <div className="max-w-[420px] bg-white rounded-xl rounded-tl-[2px] shadow-sm px-[18px] py-4">
                <p className="text-[13.5px] leading-[1.75] text-slate-800 whitespace-pre-line m-0">
                  {WHATSAPP_EXAMPLE}
                </p>
                <div className="flex justify-end items-center gap-[5px] mt-2 text-[11px] text-slate-400">
                  10:24 <CheckCheck className="w-3.5 h-3.5 text-[#34b7f1]" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Activity / earnings screenshot */}
        <section className="bg-white border-y border-[#eee7dd]">
          <div className="max-w-[1180px] mx-auto px-4 sm:px-6 py-14 sm:py-[72px]">
            <div className="flex flex-wrap items-end justify-between gap-4 mb-[26px]">
              <div>
                <div className="text-xs font-bold tracking-[0.09em] uppercase text-[#6b6255]">
                  Activité & honoraires
                </div>
                <h2 className="mt-2.5 font-['Newsreader',_Georgia,_serif] font-normal text-[30px] sm:text-4xl leading-[1.15] text-[#14294d]">
                  Ce que le cabinet a réellement encaissé
                </h2>
              </div>
              <p className="text-[14.5px] leading-relaxed text-[#5b6472] max-w-[380px]">
                Chiffre d'affaires par moyen de paiement, taux d'assiduité, annulations et absences,
                répartition par type de consultation.
              </p>
            </div>
            <div className="border border-[#e4ddd2] rounded-[18px] overflow-hidden bg-[#faf8f5]">
              <img
                src="/images/landing-stats-preview.png"
                alt="Aperçu de la vue Activité & honoraires de SunuMed"
                width={1663}
                height={723}
                loading="lazy"
                decoding="async"
                className="block w-full h-auto"
              />
            </div>
          </div>
        </section>

        {/* Security */}
        <section id="securite" className="bg-[#14294d] scroll-mt-20">
          <div className="max-w-[1180px] mx-auto px-4 sm:px-6 py-16 sm:py-[78px]">
            <div className="text-xs font-bold tracking-[0.09em] uppercase text-[#93b4e8]">
              Sécurité & conformité
            </div>
            <h2 className="mt-2.5 mb-3.5 font-['Newsreader',_Georgia,_serif] font-normal text-[32px] sm:text-[40px] leading-[1.12] text-white max-w-[640px]">
              Les dossiers de vos patients restent les vôtres
            </h2>
            <p className="mb-11 text-base leading-[1.75] text-[#dbe7fb] max-w-[620px]">
              Chaque cabinet dispose de son espace, séparé des autres au niveau de la base de données,
              et peut récupérer l'intégralité de ses données à tout moment.
            </p>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-px bg-white/[0.16] border border-white/[0.16] rounded-2xl overflow-hidden">
              {SECURITY_ITEMS.map((item, i) => (
                <motion.div
                  key={item.title}
                  {...fadeUp}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className="bg-[#14294d] p-7"
                >
                  <item.icon className="w-5 h-5 text-[#93b4e8]" />
                  <h3 className="mt-4 mb-2 text-base font-bold text-white">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-[#c7d7f5]">{item.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="max-w-[1180px] mx-auto px-4 sm:px-6 py-14 sm:py-[72px]">
          <div className="text-xs font-bold tracking-[0.09em] uppercase text-[#6b6255]">
            Démarrage
          </div>
          <h2 className="mt-2.5 mb-9 font-['Newsreader',_Georgia,_serif] font-normal text-[30px] sm:text-4xl leading-[1.15] text-[#14294d]">
            Opérationnel le jour même
          </h2>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-8">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.title}
                {...fadeUp}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className={`pt-[18px] border-t-2 ${i === 0 ? 'border-[#2563eb]' : 'border-[#e4ddd2]'}`}
              >
                <span
                  className={`font-['Newsreader',_Georgia,_serif] text-[26px] ${
                    i === 0 ? 'text-[#2563eb]' : 'text-[#6b6255]'
                  }`}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-2.5 mb-1.5 text-[16.5px] font-bold text-[#14294d]">{step.title}</h3>
                <p className="text-[14.5px] leading-relaxed text-[#5b6472]">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section id="questions" className="bg-white border-t border-[#eee7dd] scroll-mt-20">
          <div className="max-w-[1180px] mx-auto px-4 sm:px-6 py-14 sm:py-[72px]">
            <h2 className="mb-9 font-['Newsreader',_Georgia,_serif] font-normal text-[30px] sm:text-4xl leading-[1.15] text-[#14294d]">
              Questions fréquentes
            </h2>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-x-12 gap-y-7">
              {FAQ.map((item) => (
                <div key={item.question}>
                  <h3 className="mb-[7px] text-[15.5px] font-bold text-[#14294d]">{item.question}</h3>
                  <p className="text-[14.5px] leading-relaxed text-[#5b6472]">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-[#f1ece4] border-t border-[#e9e3da]">
          <div className="max-w-[1180px] mx-auto px-4 sm:px-6 py-14 sm:py-[72px] flex flex-wrap items-center justify-between gap-7">
            <div>
              <h2 className="mb-2.5 font-['Newsreader',_Georgia,_serif] font-normal text-[28px] sm:text-[38px] leading-[1.12] text-[#14294d] max-w-[520px]">
                Ouvrez votre cabinet SunuMed aujourd'hui
              </h2>
              <p className="text-[15.5px] leading-relaxed text-[#5b6472] max-w-[480px]">
                30 jours d'essai, toutes les fonctionnalités, sans carte bancaire.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a
                href="/inscription"
                className="inline-flex items-center gap-[9px] px-6 py-[15px] rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[15.5px] font-bold transition-colors"
              >
                Essayer 30 jours <ArrowRight className="w-[17px] h-[17px]" />
              </a>
              <a
                href="mailto:contact@sunumed.sn"
                className="inline-flex items-center gap-2 px-[22px] py-[15px] rounded-xl border border-[#d9d1c5] bg-white hover:bg-[#faf8f5] text-[#14294d] text-[15.5px] font-semibold transition-colors"
              >
                Contacter l'équipe
              </a>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-[#14294d] px-4 sm:px-6 py-[34px]">
          <div className="max-w-[1180px] mx-auto flex flex-wrap items-center justify-between gap-[18px]">
            <div className="flex flex-wrap items-center gap-3">
              <LogoMark size={24} />
              <span className="text-base font-bold text-white">
                Sunu<span className="text-[#93b4e8]">Med</span>
              </span>
              <span className="text-[12.5px] text-[#93a4c0]">
                Agenda &amp; gestion médicale pour praticiens indépendants
              </span>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-[12.5px] text-[#93a4c0]">
              <a href="/annuaire" className="hover:text-white">
                Annuaire
              </a>
              <span>Confidentialité</span>
              <span>Secret médical</span>
              <a href="mailto:contact@sunumed.sn" className="hover:text-white">
                Contact
              </a>
            </div>
          </div>
        </footer>
      </div>
    </MotionConfig>
  );
};
