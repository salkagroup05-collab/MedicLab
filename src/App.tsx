import React, { useState, useEffect, useMemo } from 'react';
import type { Session } from '@supabase/supabase-js';
import {
  Appointment,
  AppointmentStatus,
  Consultation,
  DoctorProfile,
  Patient,
  PaymentMethod,
  Prescription,
} from './types';
import {
  createAppointment,
  createPatient,
  createPrescription,
  deleteAppointment,
  exportCabinetData,
  ImportResult,
  importCabinetData,
  loadAppointments,
  loadConsultations,
  loadDoctorProfile,
  loadPatients,
  loadPrescriptions,
  resetToDemoData,
  updateAppointment,
  updateDoctorProfile,
  updatePatient,
  upsertConsultation,
} from './lib/db';
import { supabase } from './lib/supabaseClient';
import { formatDateFr, getTodayDateString } from './utils/dateUtils';
import { findOverlappingAppointment } from './utils/appointmentUtils';
import { hasActiveSubscription, getTrialDaysRemaining } from './utils/subscriptionUtils';
import { Header } from './components/Header';
import { MainTab, Navigation } from './components/Navigation';
import { AgendaView } from './components/AgendaView';
import { WaitingRoomView } from './components/WaitingRoomView';
import { PatientsView } from './components/PatientsView';
import { PrescriptionsListView } from './components/PrescriptionsListView';
import { BlankFormsView } from './components/BlankFormsView';
import { BlankFormPrintModal, BlankFormType } from './components/BlankFormPrintModal';
import { StatsView } from './components/StatsView';
import { AppointmentModal } from './components/AppointmentModal';
import { ConsultationModal } from './components/ConsultationModal';
import { PrescriptionModal } from './components/PrescriptionModal';
import { PatientFormModal } from './components/PatientFormModal';
import { SettingsModal } from './components/SettingsModal';
import { SubscriptionRequiredScreen } from './components/SubscriptionRequiredScreen';
import { WhatsAppReminderModal } from './components/WhatsAppReminderModal';
import { getApproachingAppointmentsData } from './utils/whatsappUtils';
import { useIdleSignOut } from './hooks/useIdleSignOut';
import { IdleWarning } from './components/IdleWarning';
import { Clock, Loader2 } from 'lucide-react';

interface AppProps {
  session: Session;
}

export default function App({ session }: AppProps) {
  const practitionerId = session.user.id;
  const { secondsLeft: idleSecondsLeft, stayConnected } = useIdleSignOut();

  // Main data state
  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const showError = (message: string) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(null), 5000);
  };

  // Chargement initial des données du cabinet du praticien connecté
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    Promise.all([
      loadDoctorProfile(practitionerId),
      loadPatients(practitionerId),
      loadAppointments(practitionerId),
      loadPrescriptions(practitionerId),
      loadConsultations(practitionerId),
    ])
      .then(([doctorData, patientsData, appointmentsData, prescriptionsData, consultationsData]) => {
        if (cancelled) return;
        setDoctor(doctorData);
        setPatients(patientsData);
        setAppointments(appointmentsData);
        setPrescriptions(prescriptionsData);
        setConsultations(consultationsData);
      })
      .catch((err) => {
        console.error('Failed to load cabinet data:', err);
        if (!cancelled) showError('Erreur lors du chargement des données du cabinet.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [practitionerId]);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<MainTab>('agenda');

  // Modal states
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [appointmentDefaultDate, setAppointmentDefaultDate] = useState<string>('');
  const [appointmentDefaultTime, setAppointmentDefaultTime] = useState<string>('');
  const [appointmentDefaultPatientId, setAppointmentDefaultPatientId] = useState<string>('');

  const [isConsultationModalOpen, setIsConsultationModalOpen] = useState(false);
  const [activeConsultationAppointment, setActiveConsultationAppointment] =
    useState<Appointment | null>(null);

  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const [activePrescriptionPatient, setActivePrescriptionPatient] = useState<Patient | null>(null);
  const [activePrescriptionAppointmentId, setActivePrescriptionAppointmentId] = useState<
    string | undefined
  >(undefined);

  const [isPatientFormModalOpen, setIsPatientFormModalOpen] = useState(false);
  const [patientToEdit, setPatientToEdit] = useState<Patient | null>(null);
  const [selectedPatientForDossier, setSelectedPatientForDossier] = useState<Patient | null>(null);

  const [isBlankFormModalOpen, setIsBlankFormModalOpen] = useState(false);
  const [activeBlankFormType, setActiveBlankFormType] = useState<BlankFormType | null>(null);

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [whatsAppInitialAppointmentId, setWhatsAppInitialAppointmentId] = useState<string | null>(null);

  const today = getTodayDateString();
  const todayAppointments = appointments.filter((a) => a.date === today);
  const waitingPatientsCount = appointments.filter(
    (a) => a.date === today && a.status === 'waiting'
  ).length;

  const approachingData = getApproachingAppointmentsData(appointments, patients, today);
  const pendingRemindersCount =
    approachingData.tomorrowPendingCount > 0
      ? approachingData.tomorrowPendingCount
      : approachingData.pendingRemindersCount;

  // WhatsApp Reminder Handlers
  const handleOpenWhatsAppReminders = (appointmentId?: string) => {
    setWhatsAppInitialAppointmentId(appointmentId || null);
    setIsWhatsAppModalOpen(true);
  };

  const handleUpdateAppointmentReminder = async (
    appointmentId: string,
    sent: boolean,
    timestamp?: string
  ) => {
    const previous = appointments;
    const sentAt = sent ? timestamp || new Date().toISOString() : undefined;
    setAppointments((prev) =>
      prev.map((a) =>
        a.id === appointmentId
          ? { ...a, whatsappReminderSent: sent, whatsappReminderSentAt: sentAt }
          : a
      )
    );
    try {
      const updated = await updateAppointment(appointmentId, {
        whatsappReminderSent: sent,
        whatsappReminderSentAt: sentAt,
      });
      setAppointments((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    } catch (err) {
      console.error('Failed to update reminder status:', err);
      setAppointments(previous);
      showError("Erreur lors de la mise à jour du rappel WhatsApp.");
    }
  };

  // Appointment Handlers
  const handleOpenNewAppointment = (date?: string, time?: string) => {
    setSelectedAppointment(null);
    setAppointmentDefaultDate(date || today);
    setAppointmentDefaultTime(time || '09:00');
    setAppointmentDefaultPatientId('');
    setIsAppointmentModalOpen(true);
  };

  const handleEditAppointment = (apt: Appointment) => {
    setSelectedAppointment(apt);
    setIsAppointmentModalOpen(true);
  };

  const handleSaveAppointment = async (
    aptData: Partial<Appointment>,
    newPatientData?: Partial<Patient>
  ) => {
    if (!doctor) return;

    const conflict = findOverlappingAppointment(
      appointments,
      aptData.date || today,
      aptData.startTime || '09:00',
      aptData.duration || 30,
      aptData.id
    );
    if (conflict) {
      const conflictPatient = patients.find((p) => p.id === conflict.patientId);
      const conflictLabel = conflictPatient
        ? `${conflictPatient.firstName} ${conflictPatient.lastName}`
        : 'un autre patient';
      const proceed = confirm(
        `Ce créneau chevauche déjà un rendez-vous avec ${conflictLabel} à ${conflict.startTime}. Voulez-vous quand même enregistrer ce rendez-vous ?`
      );
      if (!proceed) return;
    }

    try {
      let finalPatientId = aptData.patientId;

      // If a new patient was created on the fly
      if (newPatientData) {
        const createdPatient = await createPatient(practitionerId, {
          firstName: newPatientData.firstName || '',
          lastName: newPatientData.lastName || '',
          gender: newPatientData.gender || 'Autre',
          birthDate: newPatientData.birthDate || '1990-01-01',
          ssn: newPatientData.ssn || 'À renseigner',
          phone: newPatientData.phone || '',
          email: newPatientData.email || '',
          address: newPatientData.address || '',
          allergies: [],
          medicalHistory: [],
          chronicTreatments: [],
        });
        setPatients((prev) => [createdPatient, ...prev]);
        finalPatientId = createdPatient.id;
      }

      if (aptData.id) {
        const updated = await updateAppointment(aptData.id, {
          ...aptData,
          patientId: finalPatientId || undefined,
        });
        setAppointments((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      } else {
        const created = await createAppointment(practitionerId, {
          ...aptData,
          patientId: finalPatientId || '',
          date: aptData.date || today,
          startTime: aptData.startTime || '09:00',
          duration: aptData.duration || 30,
          type: aptData.type || 'consultation',
          status: aptData.status || 'confirmed',
          reason: aptData.reason || 'Consultation générale',
          fee: aptData.fee ?? doctor.consultationFee,
          isPaid: aptData.isPaid || false,
        });
        setAppointments((prev) => [...prev, created]);
      }
    } catch (err) {
      console.error('Failed to save appointment:', err);
      setAppointments(await loadAppointments(practitionerId));
      showError("Erreur lors de l'enregistrement du rendez-vous.");
    }
  };

  const handleDeleteAppointment = async (id: string) => {
    const previous = appointments;
    setAppointments((prev) => prev.filter((a) => a.id !== id));
    try {
      await deleteAppointment(id);
    } catch (err) {
      console.error('Failed to delete appointment:', err);
      setAppointments(previous);
      showError('Erreur lors de la suppression du rendez-vous.');
    }
  };

  const handleTogglePayment = async (
    aptId: string,
    isPaid: boolean,
    paymentMethod?: PaymentMethod
  ) => {
    const previous = appointments;
    const current = appointments.find((a) => a.id === aptId);
    if (!current) return;
    const nextPaymentMethod = isPaid ? paymentMethod || current.paymentMethod || 'especes' : undefined;

    setAppointments((prev) =>
      prev.map((a) => (a.id === aptId ? { ...a, isPaid, paymentMethod: nextPaymentMethod } : a))
    );
    try {
      const updated = await updateAppointment(aptId, { isPaid, paymentMethod: nextPaymentMethod });
      setAppointments((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    } catch (err) {
      console.error('Failed to update payment:', err);
      setAppointments(previous);
      showError('Erreur lors de la mise à jour du paiement.');
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: AppointmentStatus) => {
    const previous = appointments;
    const current = appointments.find((a) => a.id === id);
    if (!current) return;

    let arrivedAt = current.arrivedAt;
    if (newStatus === 'waiting' && !arrivedAt) {
      const now = new Date();
      arrivedAt = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    }

    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: newStatus, arrivedAt } : a))
    );
    try {
      const updated = await updateAppointment(id, { status: newStatus, arrivedAt });
      setAppointments((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    } catch (err) {
      console.error('Failed to update status:', err);
      setAppointments(previous);
      showError('Erreur lors du changement de statut.');
    }
  };

  // Consultation Handlers
  const handleStartConsultation = (apt: Appointment) => {
    setActiveConsultationAppointment(apt);
    setIsConsultationModalOpen(true);
  };

  const handleSaveConsultation = async (
    consultation: Consultation,
    updatedAppointment: Partial<Appointment>
  ) => {
    try {
      const savedConsultation = await upsertConsultation(practitionerId, consultation);
      setConsultations((prev) => {
        const idx = prev.findIndex((c) => c.appointmentId === savedConsultation.appointmentId);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = savedConsultation;
          return copy;
        }
        return [savedConsultation, ...prev];
      });

      const updatedApt = await updateAppointment(consultation.appointmentId, updatedAppointment);
      setAppointments((prev) => prev.map((a) => (a.id === updatedApt.id ? updatedApt : a)));
    } catch (err) {
      console.error('Failed to save consultation:', err);
      setConsultations(await loadConsultations(practitionerId));
      setAppointments(await loadAppointments(practitionerId));
      showError("Erreur lors de l'enregistrement de la consultation.");
    }
  };

  // Prescription Handlers
  const handleOpenPrescriptionBuilder = (patient: Patient, appointmentId?: string) => {
    setActivePrescriptionPatient(patient);
    setActivePrescriptionAppointmentId(appointmentId);
    setIsPrescriptionModalOpen(true);
  };

  const handleSavePrescription = async (prescription: Prescription) => {
    try {
      const created = await createPrescription(practitionerId, prescription);
      setPrescriptions((prev) => [created, ...prev]);
    } catch (err) {
      console.error('Failed to save prescription:', err);
      showError("Erreur lors de l'enregistrement de l'ordonnance.");
    }
  };

  const handlePreviewPrescription = (prescription: Prescription, patient: Patient) => {
    setActivePrescriptionPatient(patient);
    setActivePrescriptionAppointmentId(prescription.appointmentId);
    setIsPrescriptionModalOpen(true);
  };

  // Patient Handlers
  const handleOpenNewPatient = () => {
    setPatientToEdit(null);
    setIsPatientFormModalOpen(true);
  };

  const handleEditPatient = (patient: Patient) => {
    setPatientToEdit(patient);
    setIsPatientFormModalOpen(true);
  };

  const handleSavePatient = async (patient: Patient) => {
    try {
      if (patient.id) {
        const updated = await updatePatient(patient.id, patient);
        setPatients((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        setSelectedPatientForDossier(updated);
      } else {
        const created = await createPatient(practitionerId, patient);
        setPatients((prev) => [created, ...prev]);
        setSelectedPatientForDossier(created);
      }
    } catch (err) {
      console.error('Failed to save patient:', err);
      setPatients(await loadPatients(practitionerId));
      showError("Erreur lors de l'enregistrement du patient.");
    }
  };

  // Blank Forms Handler
  const handleOpenBlankForm = (formType: BlankFormType) => {
    setActiveBlankFormType(formType);
    setIsBlankFormModalOpen(true);
  };

  const handleScheduleForPatient = (patient: Patient) => {
    setSelectedAppointment(null);
    setAppointmentDefaultDate(today);
    setAppointmentDefaultTime('09:00');
    setAppointmentDefaultPatientId(patient.id);
    setIsAppointmentModalOpen(true);
  };

  // Doctor profile handler (SettingsModal + WhatsAppReminderModal template editor)
  const handleSaveDoctor = async (profile: DoctorProfile) => {
    const previous = doctor;
    setDoctor(profile);
    try {
      const updated = await updateDoctorProfile(practitionerId, profile);
      setDoctor(updated);
    } catch (err) {
      console.error('Failed to save doctor profile:', err);
      setDoctor(previous);
      showError('Erreur lors de la mise à jour du profil.');
    }
  };

  // Storage Handlers
  const handleExportData = async () => {
    try {
      const dataStr = await exportCabinetData(practitionerId);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sauvegarde_cabinet_${today}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export data:', err);
      showError("Erreur lors de l'export des données.");
    }
  };

  const handleImportData = async (jsonString: string): Promise<ImportResult> => {
    const result = await importCabinetData(practitionerId, jsonString);
    if (result.success) {
      const [doctorData, patientsData, appointmentsData, prescriptionsData, consultationsData] =
        await Promise.all([
          loadDoctorProfile(practitionerId),
          loadPatients(practitionerId),
          loadAppointments(practitionerId),
          loadPrescriptions(practitionerId),
          loadConsultations(practitionerId),
        ]);
      setDoctor(doctorData);
      setPatients(patientsData);
      setAppointments(appointmentsData);
      setPrescriptions(prescriptionsData);
      setConsultations(consultationsData);
    }
    return result;
  };

  const handleResetDemo = async () => {
    try {
      const data = await resetToDemoData(practitionerId);
      setDoctor(data.doctor);
      setPatients(data.patients);
      setAppointments(data.appointments);
      setPrescriptions(data.prescriptions);
      setConsultations(data.consultations);
    } catch (err) {
      console.error('Failed to reset demo data:', err);
      showError('Erreur lors de la réinitialisation des données de démonstration.');
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const patientMap = useMemo(() => new Map(patients.map((p) => [p.id, p])), [patients]);

  if (isLoading || !doctor) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!hasActiveSubscription(doctor)) {
    return <SubscriptionRequiredScreen doctor={doctor} onSignOut={handleSignOut} />;
  }

  const trialDaysRemaining = getTrialDaysRemaining(doctor);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900 print:bg-white print:min-h-0">
      {/* Top Header & Navigation - Hidden when printing documents */}
      <div className="no-print">
        {errorMessage && (
          <div className="bg-rose-600 text-white text-xs font-semibold text-center py-2 px-4">
            {errorMessage}
          </div>
        )}

        {doctor.subscriptionStatus === 'trialing' && trialDaysRemaining !== null && (
          <div className="bg-amber-50 border-b border-amber-200 text-amber-900 text-xs font-semibold text-center py-2 px-4 flex items-center justify-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>
              {trialDaysRemaining > 0
                ? `Il vous reste ${trialDaysRemaining} jour${trialDaysRemaining > 1 ? 's' : ''} d'essai gratuit`
                : "Votre essai gratuit se termine aujourd'hui"}
            </span>
          </div>
        )}

        <Header
          doctor={doctor}
          todayAppointmentsCount={todayAppointments.length}
          waitingPatientsCount={waitingPatientsCount}
          pendingRemindersCount={pendingRemindersCount}
          onNewAppointment={() => handleOpenNewAppointment()}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
          onNavigateWaitingRoom={() => setActiveTab('waiting')}
          onOpenWhatsAppReminders={() => handleOpenWhatsAppReminders()}
          currentDateFormatted={formatDateFr(today, { weekday: 'long', day: 'numeric', month: 'long' })}
        />

        {/* Tabs Navigation */}
        <Navigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
          waitingCount={waitingPatientsCount}
          patientsCount={patients.length}
        />
      </div>

      {/* Main Content Workspace - Hidden when printing documents */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 no-print">
        {activeTab === 'agenda' && (
          <AgendaView
            appointments={appointments}
            patients={patients}
            doctor={doctor}
            onSelectAppointment={handleEditAppointment}
            onNewAppointmentSlot={handleOpenNewAppointment}
            onUpdateStatus={handleUpdateStatus}
            onStartConsultation={handleStartConsultation}
            onOpenWhatsAppReminders={handleOpenWhatsAppReminders}
          />
        )}

        {activeTab === 'waiting' && (
          <WaitingRoomView
            appointments={appointments}
            patients={patients}
            onStartConsultation={handleStartConsultation}
            onUpdateStatus={handleUpdateStatus}
            onSelectPatient={(p) => {
              setSelectedPatientForDossier(p);
              setActiveTab('patients');
            }}
          />
        )}

        {activeTab === 'patients' && (
          <PatientsView
            patients={patients}
            doctor={doctor}
            appointments={appointments}
            consultations={consultations}
            prescriptions={prescriptions}
            onSelectPatient={setSelectedPatientForDossier}
            onNewPatient={handleOpenNewPatient}
            onEditPatient={handleEditPatient}
            onScheduleForPatient={handleScheduleForPatient}
            onViewPrescription={handlePreviewPrescription}
            selectedPatient={selectedPatientForDossier}
            onEditAppointment={handleEditAppointment}
            onTogglePayment={handleTogglePayment}
          />
        )}

        {activeTab === 'prescriptions' && (
          <PrescriptionsListView
            prescriptions={prescriptions}
            patients={patients}
            doctor={doctor}
            onNewPrescription={() => {
              if (patients.length > 0) {
                handleOpenPrescriptionBuilder(patients[0]);
              }
            }}
            onPreviewPrescription={handlePreviewPrescription}
          />
        )}

        {activeTab === 'blank-forms' && (
          <BlankFormsView onOpenBlankForm={handleOpenBlankForm} />
        )}

        {activeTab === 'stats' && (
          <StatsView
            appointments={appointments}
            patients={patients}
            doctor={doctor}
          />
        )}
      </main>

      {/* MODALS */}

      {/* Appointment Modal */}
      <AppointmentModal
        isOpen={isAppointmentModalOpen}
        onClose={() => setIsAppointmentModalOpen(false)}
        onSave={handleSaveAppointment}
        onDelete={handleDeleteAppointment}
        initialAppointment={selectedAppointment}
        defaultDate={appointmentDefaultDate}
        defaultTime={appointmentDefaultTime}
        defaultPatientId={appointmentDefaultPatientId}
        patients={patients}
        doctor={doctor}
      />

      {/* Consultation Modal */}
      <ConsultationModal
        isOpen={isConsultationModalOpen}
        onClose={() => setIsConsultationModalOpen(false)}
        appointment={activeConsultationAppointment}
        patient={
          activeConsultationAppointment
            ? patientMap.get(activeConsultationAppointment.patientId) || null
            : null
        }
        doctor={doctor}
        existingConsultation={
          activeConsultationAppointment
            ? consultations.find(
                (c) => c.appointmentId === activeConsultationAppointment.id
              ) || null
            : null
        }
        onSaveConsultation={handleSaveConsultation}
        onOpenPrescriptionBuilder={handleOpenPrescriptionBuilder}
      />

      {/* Prescription Builder & Printable Sheet */}
      <PrescriptionModal
        isOpen={isPrescriptionModalOpen}
        onClose={() => setIsPrescriptionModalOpen(false)}
        patient={activePrescriptionPatient}
        doctor={doctor}
        appointmentId={activePrescriptionAppointmentId}
        onSavePrescription={handleSavePrescription}
      />

      {/* Patient Create / Edit Form */}
      <PatientFormModal
        isOpen={isPatientFormModalOpen}
        onClose={() => setIsPatientFormModalOpen(false)}
        onSave={handleSavePatient}
        initialPatient={patientToEdit}
      />

      {/* Blank Forms Preview & Print */}
      <BlankFormPrintModal
        isOpen={isBlankFormModalOpen}
        onClose={() => setIsBlankFormModalOpen(false)}
        doctor={doctor}
        formType={activeBlankFormType}
      />

      {/* Practitioner Settings & Data Backup */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        doctor={doctor}
        onSaveDoctor={handleSaveDoctor}
        onExportData={handleExportData}
        onImportData={handleImportData}
        onResetDemo={handleResetDemo}
        onSignOut={handleSignOut}
      />

      {/* WhatsApp Approaching Reminders Hub */}
      <WhatsAppReminderModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => {
          setIsWhatsAppModalOpen(false);
          setWhatsAppInitialAppointmentId(null);
        }}
        appointments={appointments}
        patients={patients}
        doctor={doctor}
        onUpdateAppointmentReminder={handleUpdateAppointmentReminder}
        onSaveDoctorProfile={handleSaveDoctor}
        initialSelectedAppointmentId={whatsAppInitialAppointmentId}
      />

      {idleSecondsLeft !== null && <IdleWarning secondsLeft={idleSecondsLeft} onStayConnected={stayConnected} />}
    </div>
  );
}
