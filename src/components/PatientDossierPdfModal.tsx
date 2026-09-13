import React, { useState } from 'react';
import {
  X,
  FileDown,
  Printer,
  Shield,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Pill,
  Activity,
  User,
} from 'lucide-react';
import { Appointment, DoctorProfile, Patient, Consultation, Prescription } from '../types';
import { calculateAge, formatDateFr, formatDateShortFr, formatTimeFr, getTodayDateString } from '../utils/dateUtils';
import { downloadPatientDossierPdf, PdfExportOptions } from '../utils/pdfExport';
import { formatFCFA } from '../utils/currencyUtils';
import { Modal } from './shared/Modal';

interface PatientDossierPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null;
  doctor: DoctorProfile;
  consultations: Consultation[];
  prescriptions: Prescription[];
  appointments?: Appointment[];
}

export const PatientDossierPdfModal: React.FC<PatientDossierPdfModalProps> = ({
  isOpen,
  onClose,
  patient,
  doctor,
  consultations,
  prescriptions,
  appointments = [],
}) => {
  const [options, setOptions] = useState<PdfExportOptions>({
    includeMedicalHistory: true,
    includeAppointments: true,
    includeVitals: true,
    includeSoapNotes: true,
    includePrescriptions: true,
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  if (!isOpen || !patient) return null;

  const age = calculateAge(patient.birthDate);
  const todayFr = formatDateFr(getTodayDateString());

  const handleDownloadPdf = () => {
    setIsExporting(true);
    try {
      downloadPatientDossierPdf(patient, doctor, consultations, prescriptions, appointments, options);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3500);
    } catch (err) {
      console.error('Erreur export PDF:', err);
      alert('Une erreur est survenue lors de la génération du fichier PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Export PDF du dossier - ${patient.lastName} ${patient.firstName}`}
      maxWidthClassName="max-w-5xl"
      maxHeightClassName="max-h-[94vh]"
      closeOnOverlayClick
    >
        {/* Header Modal */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between no-print">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/30 text-blue-400 border border-blue-500/30">
              <FileDown className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <span>Export PDF du Dossier Médical</span>
                <span className="text-[11px] font-normal px-2 py-0.5 rounded-md bg-blue-900/60 text-blue-200 border border-blue-700/50">
                  {patient.lastName.toUpperCase()} {patient.firstName}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Générez une synthèse clinique complète conforme avec antécédents, consultations et ordonnances.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="quick-download-pdf-btn"
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="px-4 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              <FileDown className="w-4 h-4" />
              <span>{isExporting ? 'Génération...' : 'Télécharger le PDF (.pdf)'}</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Ouvrir la boîte d'impression du navigateur (permet également 'Enregistrer au format PDF')"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Export Success Notification */}
        {exportSuccess && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2.5 flex items-center gap-2 text-xs font-semibold text-emerald-800 no-print animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Le fichier PDF a été généré et téléchargé avec succès sur votre appareil.</span>
          </div>
        )}

        {/* Content Layout: Options on left + High-res paper preview on right */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 bg-slate-100">
          {/* Controls Panel (Left) */}
          <div className="lg:col-span-4 p-5 space-y-5 bg-white overflow-y-auto no-print">
            {/* Patient Summary Card */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <User className="w-4 h-4 text-blue-600" />
                <span>{patient.lastName.toUpperCase()} {patient.firstName}</span>
              </div>
              <div className="text-slate-600 space-y-1 text-[11px]">
                <p>Né(e) le {formatDateFr(patient.birthDate)} ({age} ans)</p>
                <p className="font-mono">NIN / CNI : {patient.ssn || 'Non renseigné'}</p>
                <p>Tél : {patient.phone}</p>
              </div>
            </div>

            {/* Inclusions Settings */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Éléments à inclure dans le PDF
              </h3>

              <div className="space-y-2">
                <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={options.includeMedicalHistory}
                    onChange={(e) =>
                      setOptions((prev) => ({ ...prev, includeMedicalHistory: e.target.checked }))
                    }
                    className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="font-bold text-slate-800 block">Antécédents & Allergies</span>
                    <span className="text-[11px] text-slate-500">
                      Allergies ({patient.allergies.length}), traitements au long cours ({patient.chronicTreatments.length}) et antécédents médicaux.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={options.includeAppointments}
                    onChange={(e) =>
                      setOptions((prev) => ({ ...prev, includeAppointments: e.target.checked }))
                    }
                    className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="font-bold text-slate-800 block">Historique RDV & règlements</span>
                    <span className="text-[11px] text-slate-500">
                      Tableau complet des {appointments.length} rendez-vous avec motifs, statuts cliniques et règlements d'honoraires.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={options.includeVitals}
                    onChange={(e) =>
                      setOptions((prev) => ({ ...prev, includeVitals: e.target.checked }))
                    }
                    className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="font-bold text-slate-800 block">Constantes vitales</span>
                    <span className="text-[11px] text-slate-500">
                      Tension artérielle, pouls, poids, taille, température et glycémie.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={options.includeSoapNotes}
                    onChange={(e) =>
                      setOptions((prev) => ({ ...prev, includeSoapNotes: e.target.checked }))
                    }
                    className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="font-bold text-slate-800 block">Notes cliniques SOAP</span>
                    <span className="text-[11px] text-slate-500">
                      Motifs, symptômes, examens physiques, diagnostics et plans de soins ({consultations.length} consultation{consultations.length > 1 ? 's' : ''}).
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={options.includePrescriptions}
                    onChange={(e) =>
                      setOptions((prev) => ({ ...prev, includePrescriptions: e.target.checked }))
                    }
                    className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="font-bold text-slate-800 block">Historique des ordonnances</span>
                    <span className="text-[11px] text-slate-500">
                      Médicaments délivrés, posologies, durées et consignes de prise ({prescriptions.length} ordonnance{prescriptions.length > 1 ? 's' : ''}).
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Legal Notice */}
            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 text-[11px] text-blue-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <Shield className="w-3.5 h-3.5 text-blue-600" />
                <span>Valeur médico-légale</span>
              </div>
              <p className="text-blue-800/90 leading-relaxed">
                Ce document PDF est généré avec la numérotation des pages, les mentions ordinales du praticien et la mention de confidentialité médicale.
              </p>
            </div>

            {/* Big Action Button */}
            <div className="pt-2">
              <button
                type="button"
                id="main-download-pdf-action-btn"
                onClick={handleDownloadPdf}
                disabled={isExporting}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                <FileDown className="w-4 h-4" />
                <span>{isExporting ? 'Génération en cours...' : 'Télécharger le fichier PDF'}</span>
              </button>
            </div>
          </div>

          {/* Document Preview (Right Column & Printable Area) */}
          <div className="lg:col-span-8 p-6 overflow-y-auto flex items-start justify-center print:p-0 print:m-0 print:w-full print:block print:max-w-none">
            <div className="printable-area bg-white text-slate-900 shadow-md border border-slate-300 rounded-xl p-8 max-w-2xl w-full min-h-[700px] flex flex-col justify-between font-sans space-y-6 print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none print:min-h-0 print:block">
              {/* Document Content */}
              <div className="space-y-5">
                {/* Clinic & Doctor Letterhead */}
                <div className="flex justify-between items-start border-b-2 border-blue-600 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      {doctor.title} {doctor.name}
                    </h3>
                    <p className="text-xs font-semibold text-blue-700">{doctor.specialty || 'Médecine Générale'}</p>
                    <p className="text-[11px] text-slate-600 mt-1">{doctor.address}</p>
                    <p className="text-[11px] text-slate-600">{doctor.city}</p>
                    <p className="text-[11px] text-slate-600">Tél : {doctor.phone}</p>
                  </div>
                  <div className="text-right text-[11px] text-slate-600 space-y-0.5">
                    <p className="font-semibold text-slate-800">
                      N° Ordre : {doctor.onms || 'SN-04821'}
                    </p>
                    <p>N° NINEA : {doctor.ninea || '004892150'}</p>
                    <p className="font-medium text-slate-700 mt-2">Édité le {todayFr}</p>
                  </div>
                </div>

                {/* Document Banner */}
                <div className="bg-slate-100 p-3 rounded-lg flex items-center justify-between text-xs border border-slate-200">
                  <span className="font-extrabold uppercase tracking-wide text-slate-900">
                    DOSSIER MÉDICAL DU PATIENT & SYNTHÈSE CLINIQUE
                  </span>
                  <span className="text-[10px] text-slate-500 italic">
                    CONFIDENTIEL - SECRET MÉDICAL
                  </span>
                </div>

                {/* Patient Information Card */}
                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-slate-500 text-[10px] uppercase font-bold">Identité du patient</p>
                    <p className="font-bold text-sm text-slate-900">
                      {patient.lastName.toUpperCase()} {patient.firstName}
                    </p>
                    <p className="text-slate-700 mt-0.5">
                      Né(e) le {formatDateFr(patient.birthDate)} ({age} ans)
                    </p>
                    <p className="text-slate-700">
                      Sexe : {patient.gender === 'M' ? 'Masculin' : patient.gender === 'F' ? 'Féminin' : 'Autre'}
                    </p>
                    {patient.bloodGroup && (
                      <p className="font-bold text-rose-700 mt-1">
                        Groupe Sanguin : {patient.bloodGroup}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-500 text-[10px] uppercase font-bold">Coordonnées & Références</p>
                    <p className="font-mono text-slate-800">NIN / CNI : {patient.ssn || 'Non renseigné'}</p>
                    <p className="text-slate-700">Tél : {patient.phone}</p>
                    <p className="text-slate-700">Email : {patient.email || 'Non renseigné'}</p>
                    <p className="text-slate-700">Adresse : {patient.address}</p>
                    {patient.emergencyContact && (
                      <p className="text-[11px] text-slate-600 pt-1 border-t border-slate-200 mt-1">
                        Urgence : {patient.emergencyContact.name} ({patient.emergencyContact.relationship}) - {patient.emergencyContact.phone}
                      </p>
                    )}
                  </div>
                </div>

                {/* Medical History & Alerts */}
                {options.includeMedicalHistory && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      <span>Antécédents & Terrain médical</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {/* Allergies */}
                      <div className="p-2.5 rounded-lg border border-rose-200 bg-rose-50/40">
                        <span className="font-bold text-[11px] text-rose-900 block mb-1">
                          Allergies & Intolérances
                        </span>
                        {patient.allergies.length === 0 ? (
                          <span className="text-slate-500 italic text-[11px]">Aucune allergie connue</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {patient.allergies.map((a, i) => (
                              <span key={i} className="px-1.5 py-0.5 rounded bg-white text-rose-800 border border-rose-200 text-[10px] font-semibold">
                                {a}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Traitements chroniques */}
                      <div className="p-2.5 rounded-lg border border-amber-200 bg-amber-50/40">
                        <span className="font-bold text-[11px] text-amber-900 block mb-1">
                          Traitements au long cours
                        </span>
                        {patient.chronicTreatments.length === 0 ? (
                          <span className="text-slate-500 italic text-[11px]">Aucun traitement de fond</span>
                        ) : (
                          <ul className="text-[11px] text-slate-700 space-y-0.5">
                            {patient.chronicTreatments.map((t, i) => (
                              <li key={i}>• {t}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>

                    {/* Antécédents */}
                    <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs">
                      <span className="font-bold text-[11px] text-slate-800 block mb-1">
                        Antécédents médico-chirurgicaux
                      </span>
                      {patient.medicalHistory.length === 0 ? (
                        <span className="text-slate-500 italic text-[11px]">Aucun antécédent répertorié</span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {patient.medicalHistory.map((h, i) => (
                            <span key={i} className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 text-[10px]">
                              {h}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Rendez-vous & Règlements History */}
                {options.includeAppointments && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-blue-600" />
                        <span>Historique des Rendez-vous & Règlements ({appointments.length})</span>
                      </span>
                      {appointments.length > 0 && (
                        <span className="text-[11px] font-semibold text-slate-500">
                          {appointments.filter((a) => a.isPaid).length} réglé(s) / {appointments.length}
                        </span>
                      )}
                    </h4>

                    {appointments.length === 0 ? (
                      <p className="text-xs text-slate-400 italic p-3 border border-dashed border-slate-200 rounded-lg text-center">
                        Aucun rendez-vous consigné dans le dossier.
                      </p>
                    ) : (
                      <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                        <table className="w-full text-left border-collapse">
                          <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                            <tr>
                              <th className="py-2 px-3">Date</th>
                              <th className="py-2 px-3">Type & Motif</th>
                              <th className="py-2 px-3">Statut</th>
                              <th className="py-2 px-3">Honoraires</th>
                              <th className="py-2 px-3">Paiement</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {appointments.map((a) => (
                              <tr key={a.id} className="hover:bg-slate-50/50">
                                <td className="py-2 px-3 font-semibold text-slate-900 whitespace-nowrap">
                                  {formatDateShortFr(a.date)} {formatTimeFr(a.startTime)}
                                </td>
                                <td className="py-2 px-3 text-slate-700 max-w-[180px] truncate print:max-w-none print:whitespace-normal">
                                  <span className="font-medium text-slate-800">{a.reason || 'Consultation'}</span>
                                </td>
                                <td className="py-2 px-3 whitespace-nowrap">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                                    {a.status === 'completed'
                                      ? 'Terminé'
                                      : a.status === 'confirmed'
                                      ? 'Confirmé'
                                      : a.status === 'waiting'
                                      ? 'En attente'
                                      : a.status === 'cancelled'
                                      ? 'Annulé'
                                      : a.status === 'no_show'
                                      ? 'Absent'
                                      : 'En cours'}
                                  </span>
                                </td>
                                <td className="py-2 px-3 font-bold text-slate-800 whitespace-nowrap">
                                  {formatFCFA(a.fee || doctor.consultationFee)}
                                </td>
                                <td className="py-2 px-3 whitespace-nowrap">
                                  {a.isPaid ? (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                      <span>Réglé {a.paymentMethod ? `(${a.paymentMethod})` : ''}</span>
                                    </span>
                                  ) : (
                                    <span className="text-[11px] font-bold text-amber-700">
                                      {a.status === 'cancelled' ? 'Non dû' : 'En attente'}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* Consultations List */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-blue-600" />
                    <span>Historique des Consultations ({consultations.length})</span>
                  </h4>

                  {consultations.length === 0 ? (
                    <p className="text-xs text-slate-400 italic p-3 border border-dashed border-slate-200 rounded-lg text-center">
                      Aucune consultation enregistrée.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {consultations.map((c) => (
                        <div key={c.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1.5">
                          <div className="flex justify-between items-center font-bold text-slate-900 border-b border-slate-200 pb-1">
                            <span>Le {formatDateFr(c.date)} à {formatTimeFr(c.time)}</span>
                            <span className="text-[11px] font-normal text-slate-600">Motif : {c.reason}</span>
                          </div>

                          {options.includeVitals && c.vitals && (
                            <div className="flex flex-wrap gap-2 text-[10px] font-medium text-slate-700 bg-white p-1.5 rounded border border-slate-200">
                              {c.vitals.systolicBp && <span>TA : {c.vitals.systolicBp}/{c.vitals.diastolicBp} mmHg</span>}
                              {c.vitals.heartRate && <span>Pouls : {c.vitals.heartRate} bpm</span>}
                              {c.vitals.temperature && <span>T° : {c.vitals.temperature} °C</span>}
                              {c.vitals.weight && <span>Poids : {c.vitals.weight} kg</span>}
                            </div>
                          )}

                          {options.includeSoapNotes && c.soap && (
                            <div className="space-y-1 text-[11px] pt-1">
                              {c.soap.subjective && <p><strong className="text-blue-900">S :</strong> {c.soap.subjective}</p>}
                              {c.soap.objective && <p><strong className="text-emerald-900">O :</strong> {c.soap.objective}</p>}
                              {c.soap.assessment && <p><strong className="text-amber-900">A :</strong> {c.soap.assessment}</p>}
                              {c.soap.plan && <p><strong className="text-purple-900">P :</strong> {c.soap.plan}</p>}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Prescriptions List */}
                {options.includePrescriptions && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Pill className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Historique des Ordonnances ({prescriptions.length})</span>
                    </h4>

                    {prescriptions.length === 0 ? (
                      <p className="text-xs text-slate-400 italic p-3 border border-dashed border-slate-200 rounded-lg text-center">
                        Aucune ordonnance délivrée.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {prescriptions.map((p) => (
                          <div key={p.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                            <div className="flex justify-between items-center font-bold text-slate-900">
                              <span>Ordonnance du {formatDateFr(p.date)}</span>
                              <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                                {p.medications.length} médicament(s)
                              </span>
                            </div>
                            <ul className="text-[11px] text-slate-700 space-y-0.5 pl-2">
                              {p.medications.map((m, idx) => (
                                <li key={idx}>
                                  • <strong>{m.name}</strong> - {m.dosage} ({m.frequency}, {m.duration})
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Stamp & Signature */}
              <div className="pt-4 border-t border-slate-300 flex justify-between items-end text-xs print-avoid-break">
                <div className="text-[10px] text-slate-400">
                  <p>Document généré par MédicLab</p>
                  <p>Reproduction réservée à l'usage médical</p>
                </div>

                <div className="text-right">
                  <p className="text-[10px] text-slate-500 font-semibold">Signature & Cachet du Praticien</p>
                  <div className="mt-1.5 font-serif italic text-sm text-blue-900">
                    {doctor.title} {doctor.name}
                  </div>
                  <p className="text-[9px] text-slate-400 mt-0.5">
                    N° Ordre : {doctor.onms || 'SN-04821'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-3 bg-white border-t border-slate-200 flex items-center justify-between no-print">
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
              <span>Imprimer / Aperçu</span>
            </button>
            <button
              type="button"
              id="footer-download-pdf-btn"
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <FileDown className="w-4 h-4" />
              <span>{isExporting ? 'Génération...' : 'Télécharger le PDF'}</span>
            </button>
          </div>
        </div>
    </Modal>
  );
};
