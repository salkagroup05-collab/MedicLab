import React from 'react';
import { Pill, Stethoscope, FileCheck, Mail, Printer } from 'lucide-react';
import { BlankFormType } from './BlankFormPrintModal';

interface BlankFormsViewProps {
  onOpenBlankForm: (formType: BlankFormType) => void;
}

interface BlankFormCard {
  type: BlankFormType;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const BLANK_FORMS: BlankFormCard[] = [
  {
    type: 'ordonnance',
    title: 'Ordonnance vierge',
    description:
      "Papier à en-tête avec lignes vides pour rédiger une prescription à la main.",
    icon: Pill,
  },
  {
    type: 'fiche-consultation',
    title: 'Fiche de consultation vierge',
    description:
      "Identité, constantes et motif de consultation à remplir au stylo avant saisie informatique.",
    icon: Stethoscope,
  },
  {
    type: 'certificat',
    title: 'Certificat médical vierge',
    description: 'Modèle de certificat médical avec en-tête et lignes à compléter à la main.',
    icon: FileCheck,
  },
  {
    type: 'courrier',
    title: 'Courrier confraternel vierge',
    description: 'Modèle de lettre de correspondance entre confrères, en-tête inclus, corps vide.',
    icon: Mail,
  },
];

export const BlankFormsView: React.FC<BlankFormsViewProps> = ({ onOpenBlankForm }) => {
  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <h2 className="text-sm font-bold text-slate-900">Formulaires vierges à imprimer</h2>
        <p className="text-xs text-slate-500 mt-1">
          Imprimez des documents vides, sans donnée patient, à remplir au stylo au
          cabinet ou en salle de consultation.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {BLANK_FORMS.map((form) => {
          const Icon = form.icon;
          return (
            <div
              key={form.type}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5 text-blue-600" />
                </div>
                <h4 className="font-bold text-sm text-slate-900">{form.title}</h4>
                <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                  {form.description}
                </p>
              </div>

              <button
                type="button"
                onClick={() => onOpenBlankForm(form.type)}
                className="mt-4 flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Aperçu & Imprimer</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
