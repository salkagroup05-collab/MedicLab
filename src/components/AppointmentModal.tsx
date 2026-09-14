import React, { useState, useEffect } from 'react';
import { X, User, Check, Trash2, MessageCircle } from 'lucide-react';
import { Appointment, AppointmentStatus, AppointmentType, DoctorProfile, Patient } from '../types';
import { getTodayDateString } from '../utils/dateUtils';
import { getWhatsAppLink, openWhatsAppReminder, sanitizePhoneNumber } from '../utils/whatsappUtils';
import { APPOINTMENT_STATUS_CONFIG, DEFAULT_CONSULTATION_FEE_XOF, isDentalSpecialty } from '../constants';
import { Modal } from './shared/Modal';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (appointmentData: Partial<Appointment>, newPatientData?: Partial<Patient>) => void;
  onDelete?: (id: string) => void;
  initialAppointment?: Appointment | null;
  defaultDate?: string;
  defaultTime?: string;
  defaultPatientId?: string;
  patients: Patient[];
  doctor: DoctorProfile;
}

const APPOINTMENT_TYPES: { value: AppointmentType; label: string; color: string; dentalOnly?: boolean }[] = [
  { value: 'consultation', label: 'Consultation standard', color: 'bg-blue-100 text-blue-800' },
  { value: 'suivi', label: 'Consultation de suivi', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'urgence', label: 'Urgence médicale', color: 'bg-rose-100 text-rose-800' },
  { value: 'teleconsultation', label: 'Téléconsultation', color: 'bg-purple-100 text-purple-800' },
  { value: 'bilan', label: 'Bilan complet / Prévention', color: 'bg-amber-100 text-amber-800' },
  { value: 'vaccination', label: 'Vaccination / Injection', color: 'bg-teal-100 text-teal-800' },
  { value: 'soins_dentaires', label: 'Soins dentaires', color: 'bg-cyan-100 text-cyan-800', dentalOnly: true },
  { value: 'detartrage', label: 'Détartrage', color: 'bg-indigo-100 text-indigo-800', dentalOnly: true },
  { value: 'extraction_dentaire', label: 'Extraction dentaire', color: 'bg-orange-100 text-orange-800', dentalOnly: true },
];

const STATUS_OPTIONS: { value: AppointmentStatus; label: string }[] = (
  Object.keys(APPOINTMENT_STATUS_CONFIG) as AppointmentStatus[]
).map((value) => ({ value, label: APPOINTMENT_STATUS_CONFIG[value].label }));

export const AppointmentModal: React.FC<AppointmentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialAppointment,
  defaultDate,
  defaultTime,
  defaultPatientId,
  patients,
  doctor,
}) => {
  const [mode, setMode] = useState<'existing' | 'new'>('existing');
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');

  // New patient state
  const [newPatientFirstName, setNewPatientFirstName] = useState('');
  const [newPatientLastName, setNewPatientLastName] = useState('');
  const [newPatientPhone, setNewPatientPhone] = useState('');
  const [newPatientBirthDate, setNewPatientBirthDate] = useState('');
  const [newPatientEmail, setNewPatientEmail] = useState('');

  // Appointment state
  const [date, setDate] = useState(defaultDate || getTodayDateString());
  const [startTime, setStartTime] = useState(defaultTime || '09:00');
  const [duration, setDuration] = useState<number>(doctor.defaultDuration || 30);
  const [type, setType] = useState<AppointmentType>('consultation');
  const [status, setStatus] = useState<AppointmentStatus>('confirmed');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [fee, setFee] = useState<number>(doctor.consultationFee || DEFAULT_CONSULTATION_FEE_XOF);
  const [whatsappReminderSent, setWhatsappReminderSent] = useState(false);
  const [whatsappReminderSentAt, setWhatsappReminderSentAt] = useState<string | undefined>(undefined);
  const [whatsappReminderOptOut, setWhatsappReminderOptOut] = useState(false);

  useEffect(() => {
    if (initialAppointment) {
      setSelectedPatientId(initialAppointment.patientId);
      setDate(initialAppointment.date);
      setStartTime(initialAppointment.startTime);
      setDuration(initialAppointment.duration);
      setType(initialAppointment.type);
      setStatus(initialAppointment.status);
      setReason(initialAppointment.reason);
      setNotes(initialAppointment.notes || '');
      setFee(initialAppointment.fee);
      setWhatsappReminderSent(!!initialAppointment.whatsappReminderSent);
      setWhatsappReminderSentAt(initialAppointment.whatsappReminderSentAt);
      setWhatsappReminderOptOut(!!initialAppointment.whatsappReminderOptOut);
      setMode('existing');
    } else {
      setSelectedPatientId(defaultPatientId || patients[0]?.id || '');
      setDate(defaultDate || getTodayDateString());
      setStartTime(defaultTime || '09:00');
      setDuration(doctor.defaultDuration || 30);
      setType('consultation');
      setStatus('confirmed');
      setReason('');
      setNotes('');
      setFee(doctor.consultationFee || DEFAULT_CONSULTATION_FEE_XOF);
      setWhatsappReminderSent(false);
      setWhatsappReminderSentAt(undefined);
      setWhatsappReminderOptOut(false);
      setMode('existing');
      setNewPatientFirstName('');
      setNewPatientLastName('');
      setNewPatientPhone('');
      setNewPatientBirthDate('');
      setNewPatientEmail('');
    }
  }, [initialAppointment, defaultDate, defaultTime, defaultPatientId, doctor, patients, isOpen]);

  if (!isOpen) return null;

  const filteredPatients = patients.filter((p) => {
    const term = patientSearch.toLowerCase();
    const fullName = `${p.lastName} ${p.firstName}`.toLowerCase();
    return fullName.includes(term) || p.phone.includes(term) || p.ssn.includes(term);
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'existing' && !selectedPatientId) {
      alert('Veuillez sélectionner un patient.');
      return;
    }

    if (mode === 'new') {
      if (!newPatientFirstName.trim() || !newPatientLastName.trim()) {
        alert('Veuillez renseigner le nom et le prénom du patient.');
        return;
      }
    }

    const appointmentPayload: Partial<Appointment> = {
      id: initialAppointment?.id,
      patientId: mode === 'existing' ? selectedPatientId : '',
      date,
      startTime,
      duration,
      type,
      status,
      reason: reason.trim() || 'Consultation générale',
      notes: notes.trim(),
      fee: Number(fee),
      isPaid: initialAppointment?.isPaid || false,
      paymentMethod: initialAppointment?.paymentMethod,
      whatsappReminderSent,
      whatsappReminderSentAt,
      whatsappReminderOptOut,
    };

    if (status === 'waiting' && !initialAppointment?.arrivedAt) {
      const now = new Date();
      appointmentPayload.arrivedAt = `${String(now.getHours()).padStart(2, '0')}:${String(
        now.getMinutes()
      ).padStart(2, '0')}`;
    }

    let newPatientPayload: Partial<Patient> | undefined = undefined;
    if (mode === 'new') {
      newPatientPayload = {
        firstName: newPatientFirstName.trim(),
        lastName: newPatientLastName.trim(),
        phone: newPatientPhone.trim() || 'Non renseigné',
        birthDate: newPatientBirthDate || '1990-01-01',
        email: newPatientEmail.trim() || '',
        gender: 'Autre',
        ssn: 'À renseigner',
        address: 'Non renseignée',
        allergies: [],
        medicalHistory: [],
        chronicTreatments: [],
      };
    }

    onSave(appointmentPayload, newPatientPayload);
    onClose();
  };

  const isEditing = !!initialAppointment;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Modifier le rendez-vous' : 'Nouveau rendez-vous'}
      maxWidthClassName="max-w-xl"
      scrollableBody={false}
    >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {isEditing ? 'Modifier le rendez-vous' : 'Nouveau rendez-vous'}
            </h2>
            <p className="text-xs text-slate-500">
              {isEditing ? 'Mise à jour des informations du créneau' : 'Programmer une consultation dans l’agenda'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Patient Selection Toggle */}
          {!isEditing && (
            <div className="p-1 bg-slate-100 rounded-xl flex gap-1">
              <button
                type="button"
                onClick={() => setMode('existing')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  mode === 'existing'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Patient existant ({patients.length})
              </button>
              <button
                type="button"
                onClick={() => setMode('new')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  mode === 'new'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                + Nouveau patient
              </button>
            </div>
          )}

          {/* Mode 1: Existing patient search & select */}
          {mode === 'existing' && (
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Patient concerné *
              </label>
              <input
                type="text"
                placeholder="Rechercher par nom, prénom ou téléphone..."
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
                {filteredPatients.length === 0 ? (
                  <div className="p-3 text-xs text-slate-500 text-center">
                    Aucun patient trouvé. Créez un nouveau patient ci-dessus.
                  </div>
                ) : (
                  filteredPatients.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedPatientId(p.id)}
                      className={`w-full px-3 py-2 text-left flex items-center justify-between text-xs cursor-pointer transition-colors ${
                        selectedPatientId === p.id
                          ? 'bg-blue-50 text-blue-900 font-medium'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div>
                        <span className="font-semibold text-slate-900">
                          {p.lastName.toUpperCase()} {p.firstName}
                        </span>
                        <span className="text-slate-500 ml-2">({p.phone})</span>
                      </div>
                      {selectedPatientId === p.id && <Check className="w-4 h-4 text-blue-600" />}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Mode 2: Quick new patient inputs */}
          {mode === 'new' && (
            <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-100 space-y-3">
              <div className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                <User className="w-4 h-4 text-blue-600" />
                <span>Création rapide du dossier patient</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Nom *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Dupont"
                    value={newPatientLastName}
                    onChange={(e) => setNewPatientLastName(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Prénom *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Marie"
                    value={newPatientFirstName}
                    onChange={(e) => setNewPatientFirstName(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Téléphone mobile</label>
                  <input
                    type="tel"
                    placeholder="06 00 00 00 00"
                    value={newPatientPhone}
                    onChange={(e) => setNewPatientPhone(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Date de naissance</label>
                  <input
                    type="date"
                    value={newPatientBirthDate}
                    onChange={(e) => setNewPatientBirthDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Date, Time & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Date *</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Heure de début *</label>
              <input
                type="time"
                required
                step="900"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Durée</label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>1 heure</option>
              </select>
            </div>
          </div>

          {/* Type & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Type d'acte</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as AppointmentType)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {APPOINTMENT_TYPES.filter((t) => !t.dentalOnly || isDentalSpecialty(doctor.specialty)).map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Statut du RDV</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as AppointmentStatus)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Reason & Fee */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Motif de consultation *</label>
              <input
                type="text"
                required
                placeholder="Ex: Douleurs abdominales, renouvellement traitement..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tarif consultation (FCFA)</label>
              <input
                type="number"
                step="500"
                min="0"
                value={fee}
                onChange={(e) => setFee(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Internal notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Notes du praticien (confidentiel)
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Amener anciens bilans, patient anxieux, premier créneau du matin..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* WhatsApp Reminder Section */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-bold text-slate-900">
                  Rappels WhatsApp à l'approche de la consultation
                </h4>
              </div>
              {whatsappReminderSent ? (
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-600" />
                  Rappel envoyé
                </span>
              ) : (
                <span className="text-[11px] font-medium text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                  En attente
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700">
                <input
                  type="checkbox"
                  checked={!whatsappReminderOptOut}
                  onChange={(e) => setWhatsappReminderOptOut(!e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                />
                <span className="font-medium">
                  Activer le rappel automatique WhatsApp (J-1)
                </span>
              </label>

              {/* Direct send button if patient selected */}
              {selectedPatientId && (
                (() => {
                  const patient = patients.find((p) => p.id === selectedPatientId);
                  if (!patient) return null;
                  const phoneVal = sanitizePhoneNumber(patient.phone);

                  return (
                    <button
                      type="button"
                      disabled={!phoneVal.isValid}
                      onClick={() => {
                        const tempApt: Appointment = {
                          id: initialAppointment?.id || 'temp',
                          patientId: patient.id,
                          date,
                          startTime,
                          duration,
                          type,
                          status,
                          reason: reason || 'Consultation',
                          fee,
                          isPaid: false,
                        };
                        const { url, validation } = getWhatsAppLink(tempApt, patient, doctor);
                        if (!validation.isValid) {
                          alert('Le numéro de téléphone du patient est invalide ou incomplet (indicatif manquant). Veuillez le corriger dans sa fiche avant d\'envoyer le rappel.');
                          return;
                        }
                        openWhatsAppReminder(url);
                        setWhatsappReminderSent(true);
                        setWhatsappReminderSentAt(new Date().toISOString());
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
                      title="Ouvre WhatsApp Web / Mobile avec le rappel pré-rempli"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>{whatsappReminderSent ? 'Renvoyer via WhatsApp' : 'Envoyer rappel immédiat'}</span>
                    </button>
                  );
                })()
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            {isEditing && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Voulez-vous vraiment supprimer ce rendez-vous ?')) {
                    onDelete(initialAppointment.id);
                    onClose();
                  }
                }}
                className="px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Supprimer</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                {isEditing ? 'Mettre à jour' : 'Enregistrer le rendez-vous'}
              </button>
            </div>
          </div>
        </form>
    </Modal>
  );
};
