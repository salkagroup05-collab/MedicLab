import React, { useEffect, useState } from 'react';
import {
  Search,
  UserPlus,
  Phone,
  Mail,
  MapPin,
  AlertTriangle,
  FileText,
  Pill,
  ChevronRight,
  Plus,
  Edit2,
  Printer,
  MessageCircle,
  FileDown,
  Send,
} from 'lucide-react';
import {
  Appointment,
  Consultation,
  DoctorProfile,
  Patient,
  PaymentMethod,
  Prescription,
} from '../types';
import { calculateAge, formatDateFr, formatDateShortFr, formatTimeFr } from '../utils/dateUtils';
import { sanitizePhoneNumber } from '../utils/whatsappUtils';
import { logPatientAccess } from '../lib/db';
import { PatientDossierPdfModal } from './PatientDossierPdfModal';
import { PatientAppointmentsTable } from './PatientAppointmentsTable';
import { ReferralLetterModal } from './ReferralLetterModal';

interface PatientsViewProps {
  patients: Patient[];
  doctor: DoctorProfile;
  appointments: Appointment[];
  consultations: Consultation[];
  prescriptions: Prescription[];
  onSelectPatient: (patient: Patient) => void;
  onNewPatient: () => void;
  onEditPatient: (patient: Patient) => void;
  onScheduleForPatient: (patient: Patient) => void;
  onViewPrescription: (prescription: Prescription, patient: Patient) => void;
  selectedPatient: Patient | null;
  onEditAppointment?: (apt: Appointment) => void;
  onTogglePayment?: (aptId: string, isPaid: boolean, paymentMethod?: PaymentMethod) => void;
}

export const PatientsView: React.FC<PatientsViewProps> = ({
  patients,
  doctor,
  appointments,
  consultations,
  prescriptions,
  onSelectPatient,
  onNewPatient,
  onEditPatient,
  onScheduleForPatient,
  onViewPrescription,
  selectedPatient,
  onEditAppointment,
  onTogglePayment,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'allergies' | 'chronic'>('all');
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);
  const [referralConsultationId, setReferralConsultationId] = useState<string | undefined>(undefined);

  const filteredPatients = patients.filter((p) => {
    const term = searchTerm.toLowerCase();
    const fullName = `${p.lastName} ${p.firstName}`.toLowerCase();
    const matchesSearch =
      fullName.includes(term) ||
      p.ssn.toLowerCase().includes(term) ||
      p.phone.includes(term) ||
      p.email.toLowerCase().includes(term);

    if (!matchesSearch) return false;

    if (selectedFilter === 'allergies' && p.allergies.length === 0) return false;
    if (selectedFilter === 'chronic' && p.chronicTreatments.length === 0) return false;

    return true;
  });

  // Current active patient to display in the right panel
  // Aucun dossier ouvert d'office : afficher le premier patient de la liste
  // l'inscrirait au journal d'accès comme consulté sans que personne l'ait choisi.
  const activePatient = selectedPatient;
  const activePatientId = activePatient?.id;

  // Journal d'accès : un dossier affiché compte comme consulté.
  useEffect(() => {
    if (activePatientId) logPatientAccess(activePatientId, 'view');
  }, [activePatientId]);

  // Data for active patient
  const patientAppointments = activePatient
    ? appointments.filter((a) => a.patientId === activePatient.id)
    : [];
  const patientConsultations = activePatient
    ? consultations.filter((c) => c.patientId === activePatient.id)
    : [];
  const patientPrescriptions = activePatient
    ? prescriptions.filter((p) => p.patientId === activePatient.id)
    : [];

  return (
    <div className="space-y-4">
      {/* Top Search & Actions */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, NIN / CNI, téléphone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-blue-500 outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value as 'all' | 'allergies' | 'chronic')}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 font-medium focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">Tous les patients ({patients.length})</option>
            <option value="allergies">Patients avec allergies</option>
            <option value="chronic">Patients sous traitement chronique</option>
          </select>

          <button
            type="button"
            id="add-new-patient-btn"
            onClick={onNewPatient}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Nouveau Patient</span>
          </button>
        </div>
      </div>

      {/* 2-Column Split: Directory on Left + Full Dossier on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Patients List */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col max-h-[750px]">
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-600">
            <span>Annuaire des patients</span>
            <span>{filteredPatients.length} fiches</span>
          </div>

          <div className="overflow-y-auto divide-y divide-slate-100 flex-1">
            {filteredPatients.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                Aucun patient ne correspond à la recherche.
              </div>
            ) : (
              filteredPatients.map((p) => {
                const isSelected = activePatient?.id === p.id;
                const age = calculateAge(p.birthDate);

                return (
                  <div
                    key={p.id}
                    onClick={() => onSelectPatient(p)}
                    className={`p-3.5 text-xs cursor-pointer transition-colors flex items-center justify-between ${
                      isSelected
                        ? 'bg-blue-50/80 border-l-4 border-blue-600'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 truncate">
                          {p.lastName.toUpperCase()} {p.firstName}
                        </span>
                        <span className="text-slate-500 text-[11px] font-medium whitespace-nowrap">
                          {age} ans
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-500 truncate mt-0.5 font-mono">
                        {p.phone}
                      </div>

                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {p.allergies.length > 0 && (
                          <span className="text-[9px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                            {p.allergies.length} allergie{p.allergies.length > 1 ? 's' : ''}
                          </span>
                        )}
                        {p.chronicTreatments.length > 0 && (
                          <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            Traitement chronique
                          </span>
                        )}
                      </div>
                    </div>

                    <ChevronRight
                      className={`w-4 h-4 shrink-0 ${
                        isSelected ? 'text-blue-600' : 'text-slate-300'
                      }`}
                    />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Detailed Patient Dossier */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-2xs p-6 space-y-6">
          {activePatient ? (
            <>
              {/* Header Dossier */}
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white font-extrabold text-xl flex items-center justify-center shadow-md shadow-blue-200">
                    {activePatient.lastName[0]}
                    {activePatient.firstName[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-xl font-bold text-slate-900">
                        {activePatient.lastName.toUpperCase()} {activePatient.firstName}
                      </h2>
                      <span className="px-2.5 py-0.5 text-xs font-semibold rounded-md bg-slate-100 text-slate-700">
                        {calculateAge(activePatient.birthDate)} ans (
                        {formatDateFr(activePatient.birthDate, {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                        )
                      </span>
                      {activePatient.bloodGroup && (
                        <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-red-50 text-red-700 border border-red-200">
                          Groupe {activePatient.bloodGroup}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600 mt-2">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{activePatient.phone}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{activePatient.email || 'Email non renseigné'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 sm:col-span-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{activePatient.address}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Patient Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                  {(() => {
                    const phoneVal = sanitizePhoneNumber(activePatient.phone);
                    return (
                      <button
                        type="button"
                        disabled={!phoneVal.isValid}
                        onClick={() => {
                          window.open(`https://wa.me/${phoneVal.cleanPhone}`, '_blank', 'noopener,noreferrer');
                        }}
                        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Démarrer une conversation WhatsApp avec ce patient"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>WhatsApp</span>
                      </button>
                    );
                  })()}

                  <button
                    type="button"
                    id="export-patient-pdf-btn"
                    onClick={() => setIsPdfModalOpen(true)}
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                    title="Exporter l'historique médical complet et les antécédents au format PDF"
                  >
                    <FileDown className="w-3.5 h-3.5 text-blue-600" />
                    <span>Exporter Dossier (PDF)</span>
                  </button>

                  <button
                    type="button"
                    id="open-referral-letter-btn"
                    onClick={() => {
                      setReferralConsultationId(undefined);
                      setIsReferralModalOpen(true);
                    }}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                    title="Générer automatiquement une lettre d'orientation pour un spécialiste pré-remplie"
                  >
                    <Send className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Lettre d'orientation</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onEditPatient(activePatient)}
                    className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Modifier fiche</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onScheduleForPatient(activePatient)}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Prendre RDV</span>
                  </button>
                </div>
              </div>

              {/* Security & NIN Info */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between text-xs gap-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700">Identification Nationale (NIN / CNI) :</span>
                  <span className="font-mono font-semibold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {activePatient.ssn}
                  </span>
                </div>
                {activePatient.emergencyContact && (
                  <div className="text-slate-600 text-[11px]">
                    <span className="font-semibold text-slate-700">Contact d'urgence :</span>{' '}
                    {activePatient.emergencyContact.name} ({activePatient.emergencyContact.relationship}) -{' '}
                    {activePatient.emergencyContact.phone}
                  </div>
                )}
              </div>

              {/* Medical Alerts (Allergies & Treatments) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Allergies */}
                <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/40 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-rose-900 uppercase tracking-wider">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Allergies & Intolérances</span>
                  </div>
                  {activePatient.allergies.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">Aucune allergie connue déclarée.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {activePatient.allergies.map((allergy, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 rounded-md bg-white border border-rose-300 text-rose-800 text-xs font-semibold shadow-2xs"
                        >
                          {allergy}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Chronic Treatments & History */}
                <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-900 uppercase tracking-wider">
                    <Pill className="w-4 h-4 text-amber-600" />
                    <span>Traitements au long cours</span>
                  </div>
                  {activePatient.chronicTreatments.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">Aucun traitement de fond actif.</p>
                  ) : (
                    <ul className="text-xs text-slate-700 space-y-1">
                      {activePatient.chronicTreatments.map((tr, i) => (
                        <li key={i} className="flex items-baseline gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                          <span className="font-medium text-slate-800">{tr}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Medical History */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                  Antécédents médico-chirurgicaux
                </span>
                {activePatient.medicalHistory.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Aucun antécédent noté.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {activePatient.medicalHistory.map((hist, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-xs font-medium"
                      >
                        {hist}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Tableau Récapitulatif : Historique complet des Rendez-vous & Statut de Paiement */}
              <PatientAppointmentsTable
                appointments={patientAppointments}
                patient={activePatient}
                doctor={doctor}
                onNewAppointment={() => onScheduleForPatient(activePatient)}
                onEditAppointment={onEditAppointment}
                onTogglePayment={onTogglePayment}
              />

              {/* Consultation History & SOAP Notes */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>Historique des consultations ({patientConsultations.length})</span>
                  </h3>
                </div>

                {patientConsultations.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl">
                    Aucune consultation encore enregistrée dans ce dossier.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {patientConsultations.map((c) => (
                      <div
                        key={c.id}
                        className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 text-xs"
                      >
                        <div className="flex items-center justify-between border-b border-slate-200 pb-2 flex-wrap gap-2">
                          <div>
                            <span className="font-bold text-slate-900">
                              Consultation du {formatDateFr(c.date)} à {formatTimeFr(c.time)}
                            </span>
                            <p className="text-slate-600 mt-0.5">Motif : {c.reason}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {c.vitals && (
                              <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                                {c.vitals.systolicBp && (
                                  <span>
                                    TA : {c.vitals.systolicBp}/{c.vitals.diastolicBp} mmHg
                                  </span>
                                )}
                                {c.vitals.heartRate && <span>Pouls : {c.vitals.heartRate} bpm</span>}
                                {c.vitals.weight && <span>Poids : {c.vitals.weight} kg</span>}
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setReferralConsultationId(c.id);
                                setIsReferralModalOpen(true);
                              }}
                              className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1.5 border border-indigo-200 bg-white cursor-pointer"
                              title="Rédiger une lettre d'orientation spécialisée basée sur cette consultation"
                            >
                              <Send className="w-3 h-3 text-indigo-500" />
                              <span>Orienter spécialiste</span>
                            </button>
                          </div>
                        </div>

                        {/* SOAP details */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-700">
                          {c.soap.subjective && (
                            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                              <span className="font-bold text-blue-900 block mb-0.5">Subjectif</span>
                              <p className="text-[11px]">{c.soap.subjective}</p>
                            </div>
                          )}
                          {c.soap.objective && (
                            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                              <span className="font-bold text-emerald-900 block mb-0.5">Objectif</span>
                              <p className="text-[11px]">{c.soap.objective}</p>
                            </div>
                          )}
                          {c.soap.assessment && (
                            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                              <span className="font-bold text-amber-900 block mb-0.5">Diagnostic</span>
                              <p className="text-[11px]">{c.soap.assessment}</p>
                            </div>
                          )}
                          {c.soap.plan && (
                            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                              <span className="font-bold text-purple-900 block mb-0.5">Plan thérapeutique</span>
                              <p className="text-[11px]">{c.soap.plan}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Prescriptions History */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Pill className="w-4 h-4 text-indigo-600" />
                  <span>Ordonnances délivrées ({patientPrescriptions.length})</span>
                </h3>

                {patientPrescriptions.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                    Aucune ordonnance délivrée à ce jour.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {patientPrescriptions.map((presc) => (
                      <div
                        key={presc.id}
                        className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2 text-xs flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between font-bold text-slate-900">
                            <span>Ordonnance du {formatDateShortFr(presc.date)}</span>
                            <span className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                              {presc.medications.length} médicament(s)
                            </span>
                          </div>
                          <ul className="mt-2 space-y-1 text-slate-600 text-[11px]">
                            {presc.medications.map((m, idx) => (
                              <li key={idx} className="truncate">
                                • <span className="font-semibold text-slate-800">{m.name}</span>{' '}
                                ({m.frequency})
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex justify-end">
                          <button
                            type="button"
                            onClick={() => onViewPrescription(presc, activePatient)}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                          >
                            <Printer className="w-3 h-3" />
                            <span>Aperçu & Réimprimer</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-slate-500 text-sm">
              Sélectionnez un patient dans la colonne de gauche.
            </div>
          )}
        </div>
      </div>

      {/* Patient Dossier PDF Export & Print Modal */}
      <PatientDossierPdfModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        patient={activePatient}
        doctor={doctor}
        consultations={patientConsultations}
        prescriptions={patientPrescriptions}
        appointments={patientAppointments}
      />

      {/* Specialist Referral Letter Modal */}
      <ReferralLetterModal
        isOpen={isReferralModalOpen}
        onClose={() => {
          setIsReferralModalOpen(false);
          setReferralConsultationId(undefined);
        }}
        patient={activePatient}
        doctor={doctor}
        consultations={patientConsultations}
        prescriptions={patientPrescriptions}
        initialConsultationId={referralConsultationId}
      />
    </div>
  );
};
