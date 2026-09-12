import React, { useState, useEffect } from 'react';
import {
  X,
  Stethoscope,
  AlertTriangle,
  FileText,
  CheckCircle2,
  Activity,
  CreditCard,
  Pill,
} from 'lucide-react';
import { Appointment, Consultation, DoctorProfile, Patient, PaymentMethod, Prescription, Vitals } from '../types';
import { calculateAge, calculateBmi, formatDateFr } from '../utils/dateUtils';
import { DEFAULT_CONSULTATION_FEE_XOF, PAYMENT_METHODS } from '../constants';
import { Modal } from './shared/Modal';

interface ConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  patient: Patient | null;
  doctor: DoctorProfile;
  existingConsultation?: Consultation | null;
  onSaveConsultation: (
    consultation: Consultation,
    updatedAppointment: Partial<Appointment>,
    newPrescription?: Prescription
  ) => void;
  onOpenPrescriptionBuilder: (patient: Patient, appointmentId: string) => void;
}

export const ConsultationModal: React.FC<ConsultationModalProps> = ({
  isOpen,
  onClose,
  appointment,
  patient,
  doctor,
  existingConsultation,
  onSaveConsultation,
  onOpenPrescriptionBuilder,
}) => {
  // Vitals
  const [systolicBp, setSystolicBp] = useState<number | ''>('');
  const [diastolicBp, setDiastolicBp] = useState<number | ''>('');
  const [heartRate, setHeartRate] = useState<number | ''>('');
  const [weight, setWeight] = useState<number | ''>('');
  const [height, setHeight] = useState<number | ''>('');
  const [temperature, setTemperature] = useState<number | ''>('');
  const [bloodSugar, setBloodSugar] = useState<number | ''>('');

  // SOAP
  const [subjective, setSubjective] = useState('');
  const [objective, setObjective] = useState('');
  const [assessment, setAssessment] = useState('');
  const [plan, setPlan] = useState('');

  // Payment
  const [isPaid, setIsPaid] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('carte');
  const [fee, setFee] = useState<number>(DEFAULT_CONSULTATION_FEE_XOF);

  useEffect(() => {
    if (existingConsultation) {
      const v = existingConsultation.vitals || {};
      setSystolicBp(v.systolicBp ?? '');
      setDiastolicBp(v.diastolicBp ?? '');
      setHeartRate(v.heartRate ?? '');
      setWeight(v.weight ?? '');
      setHeight(v.height ?? '');
      setTemperature(v.temperature ?? '');
      setBloodSugar(v.bloodSugar ?? '');

      setSubjective(existingConsultation.soap.subjective || '');
      setObjective(existingConsultation.soap.objective || '');
      setAssessment(existingConsultation.soap.assessment || '');
      setPlan(existingConsultation.soap.plan || '');
    } else if (appointment) {
      setSubjective(`Motif: ${appointment.reason}. `);
      setObjective('Examen général : état général conservé. Auscultation cardio-pulmonaire normale.');
      setAssessment('');
      setPlan('');
      setSystolicBp('');
      setDiastolicBp('');
      setHeartRate('');
      setWeight('');
      setHeight('');
      setTemperature('');
      setBloodSugar('');
    }

    if (appointment) {
      setIsPaid(appointment.isPaid);
      setPaymentMethod(appointment.paymentMethod || 'carte');
      setFee(appointment.fee || doctor.consultationFee || DEFAULT_CONSULTATION_FEE_XOF);
    }
  }, [existingConsultation, appointment, doctor, isOpen]);

  if (!isOpen || !patient || !appointment) return null;

  const age = calculateAge(patient.birthDate);
  const bmiInfo = calculateBmi(
    typeof weight === 'number' ? weight : undefined,
    typeof height === 'number' ? height : undefined
  );

  const handleSave = (finishAppointment = true) => {
    if (finishAppointment && (!assessment.trim() || !plan.trim())) {
      alert(
        'Veuillez renseigner au minimum le diagnostic (A - Analyse) et la conduite à tenir (P - Plan) avant de clôturer la consultation. Utilisez "Enregistrer brouillon" pour sauvegarder une consultation en cours.'
      );
      return;
    }

    const vitalsPayload: Vitals = {};
    if (typeof systolicBp === 'number') vitalsPayload.systolicBp = systolicBp;
    if (typeof diastolicBp === 'number') vitalsPayload.diastolicBp = diastolicBp;
    if (typeof heartRate === 'number') vitalsPayload.heartRate = heartRate;
    if (typeof weight === 'number') vitalsPayload.weight = weight;
    if (typeof height === 'number') vitalsPayload.height = height;
    if (typeof temperature === 'number') vitalsPayload.temperature = temperature;
    if (typeof bloodSugar === 'number') vitalsPayload.bloodSugar = bloodSugar;

    const consultationPayload: Consultation = {
      id: existingConsultation?.id || `cons-${Date.now()}`,
      appointmentId: appointment.id,
      patientId: patient.id,
      date: appointment.date,
      time: appointment.startTime,
      reason: appointment.reason,
      vitals: vitalsPayload,
      soap: {
        subjective,
        objective,
        assessment,
        plan,
      },
    };

    const updatedAppointmentPayload: Partial<Appointment> = {
      status: finishAppointment ? 'completed' : 'in_progress',
      isPaid,
      paymentMethod: isPaid ? paymentMethod : undefined,
      fee,
    };

    onSaveConsultation(consultationPayload, updatedAppointmentPayload);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Consultation - ${patient.lastName} ${patient.firstName}`}
      maxWidthClassName="max-w-4xl"
    >
        {/* Header with Patient Card */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white text-base">
              {patient.lastName[0]}
              {patient.firstName[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold">
                  {patient.lastName.toUpperCase()} {patient.firstName}
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-medium">
                  {age} ans ({formatDateFr(patient.birthDate, { day: 'numeric', month: 'short', year: 'numeric' })})
                </span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                  {patient.gender === 'M' ? 'Homme' : patient.gender === 'F' ? 'Femme' : 'Autre'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                NIN : {patient.ssn} • Tél : {patient.phone}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Medical Alerts Bar */}
        {(patient.allergies.length > 0 || patient.chronicTreatments.length > 0) && (
          <div className="px-6 py-2.5 bg-amber-50 border-b border-amber-200 flex flex-wrap items-center gap-4 text-xs">
            {patient.allergies.length > 0 && (
              <div className="flex items-center gap-1.5 text-rose-800 font-semibold">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Allergies :</span>
                <span className="font-normal text-rose-700 bg-rose-100/70 px-2 py-0.5 rounded-md">
                  {patient.allergies.join(', ')}
                </span>
              </div>
            )}
            {patient.chronicTreatments.length > 0 && (
              <div className="flex items-center gap-1.5 text-amber-900 font-semibold">
                <Pill className="w-4 h-4 text-amber-600" />
                <span>Traitements chroniques :</span>
                <span className="font-normal text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-md">
                  {patient.chronicTreatments.join(', ')}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Main Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
          {/* Section 1: Constantes vitales */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                <Activity className="w-4 h-4 text-blue-600" />
                <span>Constantes & Biomécanique du jour</span>
              </div>
              {bmiInfo && (
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${bmiInfo.color}`}>
                  IMC : {bmiInfo.bmi} kg/m² ({bmiInfo.label})
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  TA Systolique
                </label>
                <div className="relative">
                  <input
                    type="number"
                    placeholder="120"
                    value={systolicBp}
                    onChange={(e) => setSystolicBp(e.target.value ? Number(e.target.value) : '')}
                    className="w-full pl-2 pr-8 py-1.5 text-xs font-semibold border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                  />
                  <span className="absolute right-2 top-1.5 text-[10px] text-slate-400">mmHg</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  TA Diastolique
                </label>
                <div className="relative">
                  <input
                    type="number"
                    placeholder="80"
                    value={diastolicBp}
                    onChange={(e) => setDiastolicBp(e.target.value ? Number(e.target.value) : '')}
                    className="w-full pl-2 pr-8 py-1.5 text-xs font-semibold border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                  />
                  <span className="absolute right-2 top-1.5 text-[10px] text-slate-400">mmHg</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Pouls (Cardio)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    placeholder="72"
                    value={heartRate}
                    onChange={(e) => setHeartRate(e.target.value ? Number(e.target.value) : '')}
                    className="w-full pl-2 pr-8 py-1.5 text-xs font-semibold border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                  />
                  <span className="absolute right-2 top-1.5 text-[10px] text-slate-400">bpm</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Température
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    placeholder="37.0"
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value ? Number(e.target.value) : '')}
                    className="w-full pl-2 pr-8 py-1.5 text-xs font-semibold border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                  />
                  <span className="absolute right-2 top-1.5 text-[10px] text-slate-400">°C</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Poids</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    placeholder="70"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value ? Number(e.target.value) : '')}
                    className="w-full pl-2 pr-7 py-1.5 text-xs font-semibold border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                  />
                  <span className="absolute right-2 top-1.5 text-[10px] text-slate-400">kg</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Taille</label>
                <div className="relative">
                  <input
                    type="number"
                    placeholder="175"
                    value={height}
                    onChange={(e) => setHeight(e.target.value ? Number(e.target.value) : '')}
                    className="w-full pl-2 pr-7 py-1.5 text-xs font-semibold border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                  />
                  <span className="absolute right-2 top-1.5 text-[10px] text-slate-400">cm</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: SOAP Clinical Notes */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                <Stethoscope className="w-4 h-4 text-blue-600" />
                <span>Observation médicale (Méthode SOAP)</span>
              </div>
              <button
                type="button"
                onClick={() => onOpenPrescriptionBuilder(patient, appointment.id)}
                className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-semibold border border-indigo-200 transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Rédiger ordonnance</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-blue-900 mb-1">
                  S - Subjectif (Plaintes, anamnèse)
                </label>
                <textarea
                  rows={3}
                  placeholder="Symptômes rapportés par le patient, antériorité, échelle de douleur..."
                  value={subjective}
                  onChange={(e) => setSubjective(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-emerald-900 mb-1">
                  O - Objectif (Examen clinique, auscultation)
                </label>
                <textarea
                  rows={3}
                  placeholder="Examen physique, signes physiques, auscultation, palpation..."
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-amber-900 mb-1">
                  A - Analyse & Diagnostic retenu
                </label>
                <textarea
                  rows={3}
                  placeholder="Hypothèse diagnostique principale ou différentielle..."
                  value={assessment}
                  onChange={(e) => setAssessment(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-purple-900 mb-1">
                  P - Plan (Traitement, prescription, suivi)
                </label>
                <textarea
                  rows={3}
                  placeholder="Thérapeutique prescrite, examens radiologiques/biologiques, arrêt de travail..."
                  value={plan}
                  onChange={(e) => setPlan(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none leading-relaxed"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Facturation & Honoraires */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 mb-3">
              <CreditCard className="w-4 h-4 text-blue-600" />
              <span>Règlement & Honoraires</span>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Montant honoraire (FCFA)
                </label>
                <input
                  type="number"
                  step="500"
                  value={fee}
                  onChange={(e) => setFee(Number(e.target.value))}
                  className="w-32 px-3 py-1.5 text-xs font-bold border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-4">
                <input
                  type="checkbox"
                  id="isPaidCheckbox"
                  checked={isPaid}
                  onChange={(e) => setIsPaid(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="isPaidCheckbox" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Consultation réglée
                </label>
              </div>

              {isPaid && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Mode de règlement
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 bg-white"
                  >
                    {PAYMENT_METHODS.map((method) => (
                      <option key={method.value} value={method.value}>
                        {method.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            Fermer sans valider
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSave(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Enregistrer brouillon
            </button>
            <button
              type="button"
              id="finish-consultation-btn"
              onClick={() => handleSave(true)}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm flex items-center gap-2 transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Valider & Terminer la consultation</span>
            </button>
          </div>
        </div>
    </Modal>
  );
};
