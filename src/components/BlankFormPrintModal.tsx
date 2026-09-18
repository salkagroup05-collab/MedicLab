import React from 'react';
import { X, Printer, Pill, Stethoscope, FileCheck, Mail } from 'lucide-react';
import { DoctorProfile } from '../types';
import { Modal } from './shared/Modal';
import { getProfessionalOrderLabel } from '../constants';

export type BlankFormType = 'ordonnance' | 'fiche-consultation' | 'certificat' | 'courrier';

interface BlankFormPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctor: DoctorProfile;
  formType: BlankFormType | null;
}

const BLANK_FORM_TITLES: Record<BlankFormType, string> = {
  ordonnance: 'Ordonnance vierge',
  'fiche-consultation': 'Fiche de consultation vierge',
  certificat: 'Certificat médical vierge',
  courrier: 'Courrier confraternel vierge',
};

const FORM_ICONS: Record<BlankFormType, React.ReactNode> = {
  ordonnance: <Pill className="w-5 h-5 text-blue-400" />,
  'fiche-consultation': <Stethoscope className="w-5 h-5 text-blue-400" />,
  certificat: <FileCheck className="w-5 h-5 text-blue-400" />,
  courrier: <Mail className="w-5 h-5 text-blue-400" />,
};

// Ligne "label : ______" à remplir au stylo une fois imprimée.
const FieldLine: React.FC<{ label: string; className?: string }> = ({ label, className = '' }) => (
  <div className={`flex items-baseline gap-2 text-xs ${className}`}>
    <span className="text-slate-500 shrink-0">{label} :</span>
    <span className="flex-1 border-b border-dashed border-slate-400 h-4" />
  </div>
);

// Bloc de N lignes vides pour du texte libre (constatations, corps de lettre...).
const RuledLines: React.FC<{ count: number; className?: string }> = ({ count, className = '' }) => (
  <div className={`space-y-4 ${className}`}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="border-b border-dashed border-slate-400 h-4" />
    ))}
  </div>
);

// En-tête praticien commun aux 4 gabarits, identique à celui déjà utilisé dans
// PrescriptionModal/ReferralLetterModal : le N° d'ordre professionnel et le NINEA
// (confidentiels) n'y figurent jamais, ces documents quittent le cabinet.
const DoctorLetterhead: React.FC<{ doctor: DoctorProfile; badge: string }> = ({ doctor, badge }) => (
  <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4">
    <div>
      <h3 className="text-base font-bold tracking-tight text-slate-900">
        {doctor.title} {doctor.name}
      </h3>
      <p className="text-xs font-semibold text-blue-700">{doctor.specialty}</p>
      <p className="text-[11px] text-slate-600 mt-1">{doctor.address}</p>
      <p className="text-[11px] text-slate-600">{doctor.city}</p>
      <p className="text-[11px] text-slate-600">Tél : {doctor.phone}</p>
    </div>
    <div className="text-right text-[11px] text-slate-600 space-y-0.5">
      <div className="inline-block mt-2 px-2 py-0.5 rounded-sm bg-slate-100 border border-slate-300 text-[10px] font-mono text-slate-700">
        {badge}
      </div>
    </div>
  </div>
);

// Pied de page signature/cachet, avec une ligne vide pour la signature manuscrite
// (le nom du praticien est déjà dans l'en-tête, pas besoin de le répéter ici).
const SignatureFooter: React.FC<{ doctor: DoctorProfile; docLabel: string }> = ({ doctor, docLabel }) => {
  const orderLabel = getProfessionalOrderLabel(doctor.specialty);
  return (
    <div className="pt-6 border-t border-slate-200 mt-6 flex justify-between items-end print-avoid-break">
      <div className="text-[9px] text-slate-500 leading-tight">
        <p className="font-bold text-slate-700">{docLabel}</p>
        <p>{orderLabel.medium} ({orderLabel.short})</p>
        <p>République du Sénégal</p>
      </div>
      <div className="text-right">
        <p className="text-[10px] text-slate-500 mb-1">Signature & Cachet du Praticien</p>
        <div className="border-b border-dashed border-slate-400 w-44 h-10" />
      </div>
    </div>
  );
};

const OrdonnanceTemplate: React.FC<{ doctor: DoctorProfile }> = ({ doctor }) => (
  <div className="printable-area bg-white text-slate-900 shadow-md border border-slate-300 rounded-xl p-8 max-w-lg w-full min-h-[580px] flex flex-col justify-between font-sans print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none print:min-h-0 print:block mx-auto">
    <div>
      <DoctorLetterhead doctor={doctor} badge="PRESCRIPTION MÉDICALE" />

      <div className="my-5 flex items-end gap-6">
        <FieldLine label="Patient" className="flex-1" />
        <FieldLine label="Âge" className="w-28" />
      </div>
      <FieldLine label={`Fait à ${doctor.city || 'Dakar'}, le`} />

      <div className="space-y-5 my-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-baseline gap-2">
            <span className="text-blue-600 font-mono text-xs">{i + 1}.</span>
            <span className="flex-1 border-b border-dashed border-slate-400 h-5" />
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-slate-50 rounded-md border border-slate-200">
        <span className="font-semibold text-slate-900 text-[11px] block mb-2">
          Conseils & Recommandations :
        </span>
        <RuledLines count={2} />
      </div>
    </div>

    <SignatureFooter doctor={doctor} docLabel="Ordonnance médicale" />
  </div>
);

const FicheConsultationTemplate: React.FC<{ doctor: DoctorProfile }> = ({ doctor }) => (
  <div className="printable-area bg-white text-slate-900 shadow-md border border-slate-300 rounded-xl p-8 max-w-2xl w-full font-sans print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none print:block mx-auto">
    <DoctorLetterhead doctor={doctor} badge="FICHE DE CONSULTATION" />

    <div className="my-5 grid grid-cols-2 gap-x-6 gap-y-3">
      <FieldLine label="Nom" />
      <FieldLine label="Prénom" />
      <FieldLine label="Date de naissance" />
      <FieldLine label="Sexe" />
      <FieldLine label="Téléphone" />
      <FieldLine label="Adresse" />
      <FieldLine label="Groupe sanguin" />
      <FieldLine label="Date de la consultation" />
    </div>

    <div className="my-5">
      <span className="font-semibold text-slate-900 text-[11px] block mb-2">
        Allergies / Antécédents médicaux
      </span>
      <RuledLines count={2} />
    </div>

    <div className="my-5">
      <span className="font-semibold text-slate-900 text-[11px] block mb-2">
        Traitements en cours
      </span>
      <RuledLines count={2} />
    </div>

    <div className="my-5 p-3 bg-slate-50 rounded-md border border-slate-200 print-avoid-break">
      <span className="font-semibold text-slate-900 text-[11px] block mb-2">Constantes</span>
      <div className="grid grid-cols-3 gap-x-4 gap-y-3">
        <FieldLine label="TA (mmHg)" />
        <FieldLine label="Pouls (bpm)" />
        <FieldLine label="Poids (kg)" />
        <FieldLine label="Taille (cm)" />
        <FieldLine label="Température (°C)" />
        <FieldLine label="Glycémie (g/L)" />
      </div>
    </div>

    <div className="my-5">
      <span className="font-semibold text-slate-900 text-[11px] block mb-2">
        Motif de consultation
      </span>
      <RuledLines count={2} />
    </div>

    <div className="my-5">
      <span className="font-semibold text-slate-900 text-[11px] block mb-2">Examen clinique</span>
      <RuledLines count={3} />
    </div>

    <div className="my-5">
      <span className="font-semibold text-slate-900 text-[11px] block mb-2">
        Diagnostic & conduite à tenir
      </span>
      <RuledLines count={3} />
    </div>

    <SignatureFooter doctor={doctor} docLabel="Fiche de consultation" />
  </div>
);

const CertificatTemplate: React.FC<{ doctor: DoctorProfile }> = ({ doctor }) => (
  <div className="printable-area bg-white text-slate-900 shadow-md border border-slate-300 rounded-xl p-8 max-w-2xl w-full font-sans print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none print:block mx-auto">
    <DoctorLetterhead doctor={doctor} badge="CERTIFICAT MÉDICAL" />

    <p className="text-xs leading-relaxed text-slate-800 my-6">
      Je soussigné(e), {doctor.title} {doctor.name}, {doctor.specialty}, certifie avoir
      examiné ce jour :
    </p>

    <div className="space-y-3 my-5">
      <FieldLine label="Nom et prénom du patient" />
      <div className="grid grid-cols-2 gap-6">
        <FieldLine label="Né(e) le" />
        <FieldLine label="à" />
      </div>
      <FieldLine label="Domicilié(e) à" />
    </div>

    <div className="my-6">
      <span className="font-semibold text-slate-900 text-[11px] block mb-2">
        Constatations médicales / Conclusion :
      </span>
      <RuledLines count={7} />
    </div>

    <p className="text-[11px] text-slate-600 italic my-5">
      Certificat délivré à la demande de l'intéressé(e) et remis en main propre, pour
      servir et valoir ce que de droit.
    </p>

    <FieldLine label={`Fait à ${doctor.city || 'Dakar'}, le`} className="my-4" />

    <SignatureFooter doctor={doctor} docLabel="Certificat médical" />
  </div>
);

const CourrierTemplate: React.FC<{ doctor: DoctorProfile }> = ({ doctor }) => (
  <div className="printable-area bg-white text-slate-900 shadow-md border border-slate-300 rounded-xl p-8 max-w-2xl w-full font-sans print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none print:block mx-auto">
    <DoctorLetterhead doctor={doctor} badge="COURRIER CONFRATERNEL" />

    <FieldLine label={`Fait à ${doctor.city || 'Dakar'}, le`} className="my-4" />

    <div className="space-y-3 my-5">
      <FieldLine label="À l'attention du Docteur" />
      <div className="grid grid-cols-2 gap-6">
        <FieldLine label="Spécialité" />
        <FieldLine label="Établissement" />
      </div>
    </div>

    <p className="text-xs text-slate-800 my-4">Cher Confrère, Chère Consœur,</p>

    <RuledLines count={10} className="my-5" />

    <p className="text-[11px] text-slate-700 italic my-4">
      Je vous remercie par avance pour votre confraternelle collaboration et reste à
      votre disposition pour tout renseignement complémentaire.
    </p>

    <SignatureFooter doctor={doctor} docLabel="Courrier confraternel" />
  </div>
);

export const BlankFormPrintModal: React.FC<BlankFormPrintModalProps> = ({
  isOpen,
  onClose,
  doctor,
  formType,
}) => {
  if (!isOpen || !formType) return null;

  const handlePrint = () => {
    window.print();
  };

  const renderTemplate = () => {
    switch (formType) {
      case 'ordonnance':
        return <OrdonnanceTemplate doctor={doctor} />;
      case 'fiche-consultation':
        return <FicheConsultationTemplate doctor={doctor} />;
      case 'certificat':
        return <CertificatTemplate doctor={doctor} />;
      case 'courrier':
        return <CourrierTemplate doctor={doctor} />;
      default:
        return null;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={BLANK_FORM_TITLES[formType]}
      maxWidthClassName="max-w-3xl"
      maxHeightClassName="max-h-[94vh]"
    >
      {/* Top bar (Modal Controls) */}
      <div className="px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between no-print">
        <div className="flex items-center gap-2">
          {FORM_ICONS[formType]}
          <h2 className="text-base font-bold">{BLANK_FORM_TITLES[formType]}</h2>
          <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
            Document vierge, sans donnée patient
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimer</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Printable Area */}
      <div className="flex-1 overflow-y-auto bg-slate-100 p-6 flex justify-center print:p-0 print:m-0 print:w-full print:block print:bg-white">
        {renderTemplate()}
      </div>
    </Modal>
  );
};
