import React, { useState } from 'react';
import { Printer, Search, Plus, Pill } from 'lucide-react';
import { DoctorProfile, Patient, Prescription } from '../types';
import { formatDateShortFr } from '../utils/dateUtils';
import { getProfessionalOrderLabel } from '../constants';

interface PrescriptionsListViewProps {
  prescriptions: Prescription[];
  patients: Patient[];
  doctor: DoctorProfile;
  onNewPrescription: (patient: Patient) => void;
  onPreviewPrescription: (prescription: Prescription, patient: Patient) => void;
}

export const PrescriptionsListView: React.FC<PrescriptionsListViewProps> = ({
  prescriptions,
  patients,
  doctor,
  onNewPrescription,
  onPreviewPrescription,
}) => {
  const [search, setSearch] = useState('');
  // Choix explicite du patient avant de rédiger une nouvelle ordonnance.
  const [isPickingPatient, setIsPickingPatient] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');
  const pickablePatients = patients
    .filter((p) => {
      const term = patientSearch.trim().toLowerCase();
      if (!term) return true;
      return `${p.lastName} ${p.firstName}`.toLowerCase().includes(term) || p.phone.includes(term);
    })
    .slice(0, 8);
  const patientMap = new Map<string, Patient>(patients.map((p) => [p.id, p]));

  const filtered = prescriptions.filter((p) => {
    const patient = patientMap.get(p.patientId);
    const patName = patient ? `${patient.lastName} ${patient.firstName}`.toLowerCase() : '';
    const medNames = p.medications.map((m) => m.name.toLowerCase()).join(' ');
    const term = search.toLowerCase();
    return patName.includes(term) || medNames.includes(term);
  });

  return (
    <div className="space-y-4">
      {/* Search & Actions Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par patient ou par nom de médicament..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-blue-500 outline-hidden"
          />
        </div>

        <button
          type="button"
          onClick={() => {
            setPatientSearch('');
            setIsPickingPatient((open) => !open);
          }}
          aria-expanded={isPickingPatient}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle Ordonnance</span>
        </button>
      </div>

      {isPickingPatient && (
        <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-2xs space-y-3">
          <label htmlFor="new-prescription-patient" className="block text-xs font-bold text-slate-700">
            Pour quel patient ?
          </label>
          <input
            id="new-prescription-patient"
            type="text"
            autoFocus
            placeholder="Nom, prénom ou téléphone..."
            value={patientSearch}
            onChange={(e) => setPatientSearch(e.target.value)}
            className="w-full bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-blue-500 outline-hidden"
          />
          {pickablePatients.length === 0 ? (
            <p className="text-xs text-slate-500">Aucun patient trouvé.</p>
          ) : (
            <ul className="divide-y divide-slate-100 border border-slate-100 rounded-lg">
              {pickablePatients.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsPickingPatient(false);
                      onNewPrescription(p);
                    }}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 cursor-pointer flex justify-between gap-2"
                  >
                    <span className="font-semibold text-slate-800">
                      {p.lastName.toUpperCase()} {p.firstName}
                    </span>
                    <span className="text-slate-500">{p.phone}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* List of Prescriptions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-sm">
            Aucune ordonnance trouvée.
          </div>
        ) : (
          filtered.map((presc) => {
            const patient = patientMap.get(presc.patientId);

            return (
              <div
                key={presc.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3 mb-3">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">
                        {patient
                          ? `${patient.lastName.toUpperCase()} ${patient.firstName}`
                          : 'Patient inconnu'}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Délivrée le {formatDateShortFr(presc.date)}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-100">
                      {presc.medications.length} médicament{presc.medications.length > 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {presc.medications.slice(0, 3).map((med, idx) => (
                      <div key={idx} className="text-xs bg-slate-50 p-2 rounded-lg">
                        <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                          <Pill className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span className="truncate">{med.name}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5 pl-5">
                          {med.dosage} • {med.frequency} • {med.duration}
                        </p>
                      </div>
                    ))}
                    {presc.medications.length > 3 && (
                      <p className="text-[10px] text-slate-400 font-semibold pl-1">
                        +{presc.medications.length - 3} autre(s) médicament(s)...
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">Authentifiée {getProfessionalOrderLabel(doctor.specialty).short}</span>
                  {patient && (
                    <button
                      type="button"
                      onClick={() => onPreviewPrescription(presc, patient)}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Aperçu & Imprimer</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
