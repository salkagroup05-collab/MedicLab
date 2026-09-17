import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Printer,
  FileCheck,
  Pill,
  QrCode,
} from 'lucide-react';
import { DoctorProfile, Medication, Patient, Prescription } from '../types';
import { calculateAge, formatDateFr, getTodayDateString } from '../utils/dateUtils';
import { Modal } from './shared/Modal';
import { getProfessionalOrderLabel } from '../constants';

interface PrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null;
  doctor: DoctorProfile;
  appointmentId?: string;
  onSavePrescription: (prescription: Prescription) => void;
}

const COMMON_DRUGS = [
  { name: 'Paracétamol 1 g', dosage: '1 comprimé', frequency: '3 fois par jour si douleur', duration: '5 jours', instructions: 'Espacer les prises d\'au moins 6h. Max 3g/jour.' },
  { name: 'Ibuprofène 400 mg', dosage: '1 comprimé', frequency: '3 fois par jour au cours des repas', duration: '3 jours', instructions: 'Ne pas associer à d\'autres AINS.' },
  { name: 'Amoxicilline 1 g', dosage: '1 comprimé', frequency: '2 fois par jour', duration: '6 jours', instructions: 'Bien aller au bout du traitement prescrit.' },
  { name: 'Phloroglucinol (Spasfon) 80 mg', dosage: '2 comprimés', frequency: 'au moment des spasmes', duration: '5 jours', instructions: 'Maximum 6 comprimés par jour.' },
  { name: 'Oméprazole 20 mg', dosage: '1 gélule', frequency: '1 fois par jour le soir', duration: '28 jours', instructions: 'À avaler avec un verre d\'eau sans ouvrir.' },
  { name: 'Sérum physiologique 0.9%', dosage: '1 unidose', frequency: '3 à 4 lavages par jour', duration: '7 jours', instructions: 'Lavage nasal soigneux.' },
];

export const PrescriptionModal: React.FC<PrescriptionModalProps> = ({
  isOpen,
  onClose,
  patient,
  doctor,
  appointmentId,
  onSavePrescription,
}) => {
  const [medications, setMedications] = useState<Medication[]>([
    {
      id: `med-${Date.now()}`,
      name: 'Paracétamol 1 g',
      dosage: '1 comprimé',
      frequency: '3 fois par jour si douleur',
      duration: '5 jours',
      instructions: 'Espacer les prises d’au moins 6 heures.',
    },
  ]);
  const [recommendations, setRecommendations] = useState<string>(
    'Repos recommandé. Bonne hydratation. Consulter en cas d\'aggravation des symptômes.'
  );

  if (!isOpen || !patient) return null;

  const age = calculateAge(patient.birthDate);
  const todayFr = formatDateFr(getTodayDateString());

  const handleAddMedication = () => {
    setMedications((prev) => [
      ...prev,
      {
        id: `med-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        name: '',
        dosage: '',
        frequency: '',
        duration: '',
        instructions: '',
      },
    ]);
  };

  const handleQuickAdd = (drug: typeof COMMON_DRUGS[0]) => {
    setMedications((prev) => [
      ...prev,
      {
        id: `med-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        ...drug,
      },
    ]);
  };

  const handleRemoveMedication = (id: string) => {
    setMedications((prev) => prev.filter((m) => m.id !== id));
  };

  const handleUpdateMedication = (id: string, field: keyof Medication, value: string) => {
    setMedications((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  const handleSave = () => {
    if (medications.length === 0) {
      alert('Veuillez ajouter au moins un médicament à l\'ordonnance.');
      return;
    }

    const prescription: Prescription = {
      id: `presc-${Date.now()}`,
      patientId: patient.id,
      appointmentId,
      date: getTodayDateString(),
      medications: medications.filter((m) => m.name.trim() !== ''),
      recommendations: recommendations.trim(),
      createdAt: getTodayDateString(),
    };

    onSavePrescription(prescription);
    onClose();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Ordonnance - ${patient.lastName} ${patient.firstName}`}
      maxWidthClassName="max-w-5xl"
      maxHeightClassName="max-h-[94vh]"
    >
        {/* Top bar (Modal Controls) */}
        <div className="px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <Pill className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold">Rédaction d'Ordonnance Médicale</h2>
            <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
              Patient : {patient.lastName.toUpperCase()} {patient.firstName} ({age} ans)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="print-prescription-btn"
              onClick={handlePrint}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer l'ordonnance</span>
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

        {/* Content: 2-Column layout on desktop (Form + Live Paper Preview) */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 bg-slate-100">
          {/* Left Column: Form Controls (Hidden in Print) */}
          <div className="lg:col-span-5 p-5 space-y-4 bg-white overflow-y-auto no-print">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-2">
                Suggestions rapides de médicaments
              </span>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_DRUGS.map((drug, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleQuickAdd(drug)}
                    className="text-[11px] px-2.5 py-1 rounded-md bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200 text-slate-700 transition-colors cursor-pointer text-left"
                  >
                    + {drug.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Lignes de prescription ({medications.length})
                </span>
                <button
                  type="button"
                  onClick={handleAddMedication}
                  className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ajouter une ligne</span>
                </button>
              </div>

              <div className="space-y-3">
                {medications.map((med, index) => (
                  <div
                    key={med.id}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 relative text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">Médicament #{index + 1}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveMedication(med.id)}
                        className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                        title="Supprimer la ligne"
                        aria-label="Supprimer ce médicament"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div>
                      <input
                        type="text"
                        placeholder="Dénomination (ex: Paracétamol 1g)"
                        value={med.name}
                        onChange={(e) => handleUpdateMedication(med.id, 'name', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md font-semibold text-slate-900 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Posologie (1 cp)"
                        value={med.dosage}
                        onChange={(e) => handleUpdateMedication(med.id, 'dosage', e.target.value)}
                        className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="Fréquence (3x/jour)"
                        value={med.frequency}
                        onChange={(e) => handleUpdateMedication(med.id, 'frequency', e.target.value)}
                        className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Durée (ex: 5 jours)"
                        value={med.duration}
                        onChange={(e) => handleUpdateMedication(med.id, 'duration', e.target.value)}
                        className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="Conseils (pendant le repas)"
                        value={med.instructions}
                        onChange={(e) => handleUpdateMedication(med.id, 'instructions', e.target.value)}
                        className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Conseils & Recommandations hygiéno-diététiques
              </label>
              <textarea
                rows={2}
                value={recommendations}
                onChange={(e) => setRecommendations(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>

          {/* Right Column: High-fidelity Medical Prescription Sheet (Printable Area) */}
          <div className="lg:col-span-7 p-6 overflow-y-auto flex items-center justify-center print:p-0 print:m-0 print:w-full print:block print:max-w-none">
            <div className="printable-area bg-white text-slate-900 shadow-md border border-slate-300 rounded-xl p-8 max-w-lg w-full min-h-[580px] flex flex-col justify-between font-sans print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none print:min-h-0 print:block">
              {/* Top Doctor Header */}
              <div>
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
                      PRESCRIPTION MÉDICALE
                    </div>
                  </div>
                </div>

                {/* Patient & Date Meta */}
                <div className="my-5 flex justify-between items-end">
                  <div className="text-xs">
                    <p className="text-slate-500 text-[10px] uppercase font-bold">Patient</p>
                    <p className="font-bold text-sm text-slate-900">
                      {patient.lastName.toUpperCase()} {patient.firstName}
                    </p>
                    <p className="text-slate-600 text-[11px]">
                      {age} ans • Né(e) le {formatDateFr(patient.birthDate, { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="text-right text-xs">
                    <p className="text-slate-500 text-[10px] uppercase font-bold">Fait à {doctor.city || 'Dakar'}, le</p>
                    <p className="font-semibold text-slate-800">{todayFr}</p>
                  </div>
                </div>

                {/* Medications List */}
                <div className="space-y-4 my-6">
                  {medications.length === 0 ? (
                    <p className="text-xs italic text-slate-400">Aucun médicament prescrit.</p>
                  ) : (
                    medications.map((med, index) => (
                      <div key={med.id} className="text-xs">
                        <div className="flex items-baseline gap-2 font-bold text-slate-900">
                          <span className="text-blue-600 font-mono">{index + 1}.</span>
                          <span className="text-sm">{med.name || '(Médicament)'}</span>
                          {med.dosage && <span className="font-normal text-slate-700">- {med.dosage}</span>}
                        </div>
                        <div className="ml-5 text-slate-700 text-[11px] mt-0.5 space-y-0.5">
                          {med.frequency && <p>• Posologie : {med.frequency}</p>}
                          {med.duration && <p>• Durée de traitement : {med.duration}</p>}
                          {med.instructions && (
                            <p className="italic text-slate-600">• {med.instructions}</p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Recommendations */}
                {recommendations && (
                  <div className="mt-4 p-3 bg-slate-50 rounded-md border border-slate-200 text-[11px] text-slate-700">
                    <span className="font-semibold text-slate-900 block mb-0.5">
                      Conseils & Surveillance :
                    </span>
                    <p>{recommendations}</p>
                  </div>
                )}
              </div>

              {/* Prescription Footer: Signature & Security Seal */}
              <div className="pt-6 border-t border-slate-200 mt-6 flex justify-between items-end print-avoid-break">
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 bg-slate-100 rounded-md border border-slate-300 flex flex-col items-center justify-center text-slate-600">
                    <QrCode className="w-8 h-8 opacity-80" />
                  </div>
                  <div className="text-[9px] text-slate-500 leading-tight">
                    <p className="font-bold text-slate-700">Ordonnance médicale</p>
                    <p>{getProfessionalOrderLabel(doctor.specialty).medium} ({getProfessionalOrderLabel(doctor.specialty).short})</p>
                    <p>République du Sénégal</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-[10px] text-slate-500">Signature & Cachet du Praticien</p>
                  <div className="mt-2 font-serif italic text-sm text-blue-900 pr-2">
                    {doctor.title} {doctor.name}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions (No Print) */}
        <div className="px-6 py-3.5 bg-white border-t border-slate-200 flex items-center justify-between no-print">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            Fermer
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer</span>
            </button>
            <button
              type="button"
              id="save-prescription-btn"
              onClick={handleSave}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileCheck className="w-4 h-4" />
              <span>Enregistrer l'ordonnance</span>
            </button>
          </div>
        </div>
    </Modal>
  );
};
