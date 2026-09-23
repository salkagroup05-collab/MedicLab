import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Appointment, Patient, Prescription } from './types';
import { supabase } from './lib/supabaseClient';
import { formatDateFr, getTodayDateString } from './utils/dateUtils';
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
import { useCabinetData } from './hooks/useCabinetData';
import { IdleWarning } from './components/IdleWarning';
import { Clock, Loader2 } from 'lucide-react';

interface AppProps {
  session: Session;
}

export default function App({ session }: AppProps) {
  const practitionerId = session.user.id;
  const { secondsLeft: idleSecondsLeft, stayConnected } = useIdleSignOut();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Un seul minuteur à la fois : celui d'une erreur précédente ne doit pas
  // effacer la nouvelle avant ses 5 secondes.
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showError = (message: string) => {
    setErrorMessage(message);
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    errorTimerRef.current = setTimeout(() => setErrorMessage(null), 5000);
  };
  useEffect(() => () => {
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
  }, []);

  // Données du cabinet et leurs écritures (src/hooks/useCabinetData.ts)
  const cabinet = useCabinetData(practitionerId, showError);
  const { doctor, patients, appointments, prescriptions, consultations, isLoading } = cabinet;

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
  const [previewedPrescription, setPreviewedPrescription] = useState<Prescription | null>(null);

  // Clé de chaque modale, incrémentée à son ouverture : la modale est remontée
  // et repart d'un état initialisé depuis ses props, sans reste de la saisie
  // précédente (autre patient, autre RDV). Une clé par modale, car certaines
  // s'empilent (ordonnance ouverte depuis une consultation).
  const [modalKeys, setModalKeys] = useState({
    appointment: 0,
    consultation: 0,
    prescription: 0,
    settings: 0,
    whatsapp: 0,
  });
  const bumpModalKey = (modal: keyof typeof modalKeys) =>
    setModalKeys((keys) => ({ ...keys, [modal]: keys[modal] + 1 }));

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
    bumpModalKey('whatsapp');
    setIsWhatsAppModalOpen(true);
  };

  // Appointment Handlers
  const handleOpenNewAppointment = (date?: string, time?: string) => {
    setSelectedAppointment(null);
    setAppointmentDefaultDate(date || today);
    setAppointmentDefaultTime(time || '09:00');
    setAppointmentDefaultPatientId('');
    bumpModalKey('appointment');
    setIsAppointmentModalOpen(true);
  };

  const handleEditAppointment = (apt: Appointment) => {
    setSelectedAppointment(apt);
    bumpModalKey('appointment');
    setIsAppointmentModalOpen(true);
  };

  // Consultation Handlers
  const handleStartConsultation = (apt: Appointment) => {
    setActiveConsultationAppointment(apt);
    bumpModalKey('consultation');
    setIsConsultationModalOpen(true);
  };

  // Prescription Handlers
  const handleOpenPrescriptionBuilder = (patient: Patient, appointmentId?: string) => {
    setActivePrescriptionPatient(patient);
    setActivePrescriptionAppointmentId(appointmentId);
    setPreviewedPrescription(null);
    bumpModalKey('prescription');
    setIsPrescriptionModalOpen(true);
  };

  const handlePreviewPrescription = (prescription: Prescription, patient: Patient) => {
    setActivePrescriptionPatient(patient);
    setActivePrescriptionAppointmentId(prescription.appointmentId);
    setPreviewedPrescription(prescription);
    bumpModalKey('prescription');
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
    const saved = await cabinet.savePatient(patient);
    if (saved) setSelectedPatientForDossier(saved);
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
    bumpModalKey('appointment');
    setIsAppointmentModalOpen(true);
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
          onOpenSettings={() => {
            bumpModalKey('settings');
            setIsSettingsModalOpen(true);
          }}
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
            onUpdateStatus={cabinet.updateStatus}
            onStartConsultation={handleStartConsultation}
            onOpenWhatsAppReminders={handleOpenWhatsAppReminders}
          />
        )}

        {activeTab === 'waiting' && (
          <WaitingRoomView
            appointments={appointments}
            patients={patients}
            onStartConsultation={handleStartConsultation}
            onUpdateStatus={cabinet.updateStatus}
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
            onTogglePayment={cabinet.togglePayment}
          />
        )}

        {activeTab === 'prescriptions' && (
          <PrescriptionsListView
            prescriptions={prescriptions}
            patients={patients}
            doctor={doctor}
            onNewPrescription={(patient) => handleOpenPrescriptionBuilder(patient)}
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
        key={modalKeys.appointment}
        isOpen={isAppointmentModalOpen}
        onClose={() => setIsAppointmentModalOpen(false)}
        onSave={cabinet.saveAppointment}
        onDelete={cabinet.removeAppointment}
        initialAppointment={selectedAppointment}
        appointments={appointments}
        defaultDate={appointmentDefaultDate}
        defaultTime={appointmentDefaultTime}
        defaultPatientId={appointmentDefaultPatientId}
        patients={patients}
        doctor={doctor}
      />

      {/* Consultation Modal */}
      <ConsultationModal
        key={modalKeys.consultation}
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
        onSaveConsultation={cabinet.recordConsultation}
        onOpenPrescriptionBuilder={handleOpenPrescriptionBuilder}
      />

      {/* Prescription Builder & Printable Sheet */}
      <PrescriptionModal
        key={modalKeys.prescription}
        isOpen={isPrescriptionModalOpen}
        onClose={() => setIsPrescriptionModalOpen(false)}
        patient={activePrescriptionPatient}
        doctor={doctor}
        appointmentId={activePrescriptionAppointmentId}
        existingPrescription={previewedPrescription}
        onSavePrescription={cabinet.savePrescription}
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
        key={modalKeys.settings}
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        doctor={doctor}
        onSaveDoctor={cabinet.saveDoctor}
        onExportData={cabinet.exportData}
        onImportData={cabinet.importData}
        onResetDemo={cabinet.resetDemo}
        onSignOut={handleSignOut}
      />

      {/* WhatsApp Approaching Reminders Hub */}
      <WhatsAppReminderModal
        key={modalKeys.whatsapp}
        isOpen={isWhatsAppModalOpen}
        onClose={() => {
          setIsWhatsAppModalOpen(false);
          setWhatsAppInitialAppointmentId(null);
        }}
        appointments={appointments}
        patients={patients}
        doctor={doctor}
        onUpdateAppointmentReminder={cabinet.updateAppointmentReminder}
        onSaveDoctorProfile={cabinet.saveDoctor}
        initialSelectedAppointmentId={whatsAppInitialAppointmentId}
      />

      {idleSecondsLeft !== null && <IdleWarning secondsLeft={idleSecondsLeft} onStayConnected={stayConnected} />}
    </div>
  );
}
