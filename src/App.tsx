import React, { useState, useEffect, useMemo } from 'react';
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
  exportCabinetData,
  ImportResult,
  importCabinetData,
  loadAppointments,
  loadConsultations,
  loadDoctorProfile,
  loadPatients,
  loadPrescriptions,
  resetToDemoData,
  saveAppointments,
  saveConsultations,
  saveDoctorProfile,
  savePatients,
  savePrescriptions,
} from './utils/storage';
import { formatDateFr, getTodayDateString } from './utils/dateUtils';
import { findOverlappingAppointment } from './utils/appointmentUtils';
import { useStorageSync } from './hooks/useStorageSync';
import { Header } from './components/Header';
import { MainTab, Navigation } from './components/Navigation';
import { AgendaView } from './components/AgendaView';
import { WaitingRoomView } from './components/WaitingRoomView';
import { PatientsView } from './components/PatientsView';
import { PrescriptionsListView } from './components/PrescriptionsListView';
import { StatsView } from './components/StatsView';
import { AppointmentModal } from './components/AppointmentModal';
import { ConsultationModal } from './components/ConsultationModal';
import { PrescriptionModal } from './components/PrescriptionModal';
import { PatientFormModal } from './components/PatientFormModal';
import { SettingsModal } from './components/SettingsModal';
import { WhatsAppReminderModal } from './components/WhatsAppReminderModal';
import { getApproachingAppointmentsData } from './utils/whatsappUtils';

export default function App() {
  // Main data state
  const [doctor, setDoctor] = useState<DoctorProfile>(loadDoctorProfile);
  const [patients, setPatients] = useState<Patient[]>(loadPatients);
  const [appointments, setAppointments] = useState<Appointment[]>(loadAppointments);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(loadPrescriptions);
  const [consultations, setConsultations] = useState<Consultation[]>(loadConsultations);

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

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [whatsAppInitialAppointmentId, setWhatsAppInitialAppointmentId] = useState<string | null>(null);

  // Save changes to localStorage
  useEffect(() => {
    saveDoctorProfile(doctor);
  }, [doctor]);

  useEffect(() => {
    savePatients(patients);
  }, [patients]);

  useEffect(() => {
    saveAppointments(appointments);
  }, [appointments]);

  useEffect(() => {
    savePrescriptions(prescriptions);
  }, [prescriptions]);

  useEffect(() => {
    saveConsultations(consultations);
  }, [consultations]);

  // Recharge les données depuis LocalStorage quand un autre onglet les modifie
  useStorageSync((key) => {
    switch (key) {
      case 'DOCTOR':
        setDoctor(loadDoctorProfile());
        break;
      case 'PATIENTS':
        setPatients(loadPatients());
        break;
      case 'APPOINTMENTS':
        setAppointments(loadAppointments());
        break;
      case 'PRESCRIPTIONS':
        setPrescriptions(loadPrescriptions());
        break;
      case 'CONSULTATIONS':
        setConsultations(loadConsultations());
        break;
    }
  });

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

  const handleUpdateAppointmentReminder = (
    appointmentId: string,
    sent: boolean,
    timestamp?: string
  ) => {
    setAppointments((prev) =>
      prev.map((a) =>
        a.id === appointmentId
          ? {
              ...a,
              whatsappReminderSent: sent,
              whatsappReminderSentAt: sent ? timestamp || new Date().toISOString() : undefined,
            }
          : a
      )
    );
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

  const handleSaveAppointment = (
    aptData: Partial<Appointment>,
    newPatientData?: Partial<Patient>
  ) => {
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

    let finalPatientId = aptData.patientId;

    // If a new patient was created on the fly
    if (newPatientData) {
      const createdPatient: Patient = {
        id: `pat-${Date.now()}`,
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
        createdAt: today,
      };
      setPatients((prev) => [createdPatient, ...prev]);
      finalPatientId = createdPatient.id;
    }

    if (aptData.id) {
      // Update existing appointment
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === aptData.id
            ? ({
                ...a,
                ...aptData,
                patientId: finalPatientId || a.patientId,
              } as Appointment)
            : a
        )
      );
    } else {
      // Create new appointment
      const newApt: Appointment = {
        id: `apt-${Date.now()}`,
        patientId: finalPatientId || '',
        date: aptData.date || today,
        startTime: aptData.startTime || '09:00',
        duration: aptData.duration || 30,
        type: aptData.type || 'consultation',
        status: aptData.status || 'confirmed',
        reason: aptData.reason || 'Consultation générale',
        notes: aptData.notes,
        fee: aptData.fee ?? doctor.consultationFee,
        isPaid: aptData.isPaid || false,
        paymentMethod: aptData.paymentMethod,
        arrivedAt: aptData.arrivedAt,
      };
      setAppointments((prev) => [...prev, newApt]);
    }
  };

  const handleDeleteAppointment = (id: string) => {
    setAppointments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleTogglePayment = (
    aptId: string,
    isPaid: boolean,
    paymentMethod?: PaymentMethod
  ) => {
    setAppointments((prev) =>
      prev.map((a) => {
        if (a.id !== aptId) return a;
        return {
          ...a,
          isPaid,
          paymentMethod: isPaid ? (paymentMethod || a.paymentMethod || 'especes') : undefined,
        };
      })
    );
  };

  const handleUpdateStatus = (id: string, newStatus: AppointmentStatus) => {
    setAppointments((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        const updated = { ...a, status: newStatus };
        if (newStatus === 'waiting' && !updated.arrivedAt) {
          const now = new Date();
          updated.arrivedAt = `${String(now.getHours()).padStart(2, '0')}:${String(
            now.getMinutes()
          ).padStart(2, '0')}`;
        }
        return updated;
      })
    );
  };

  // Consultation Handlers
  const handleStartConsultation = (apt: Appointment) => {
    setActiveConsultationAppointment(apt);
    setIsConsultationModalOpen(true);
  };

  const handleSaveConsultation = (
    consultation: Consultation,
    updatedAppointment: Partial<Appointment>
  ) => {
    // Add or update consultation
    setConsultations((prev) => {
      const idx = prev.findIndex((c) => c.id === consultation.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = consultation;
        return copy;
      }
      return [consultation, ...prev];
    });

    // Update appointment status and billing
    setAppointments((prev) =>
      prev.map((a) =>
        a.id === consultation.appointmentId
          ? {
              ...a,
              ...updatedAppointment,
            }
          : a
      )
    );
  };

  // Prescription Handlers
  const handleOpenPrescriptionBuilder = (patient: Patient, appointmentId?: string) => {
    setActivePrescriptionPatient(patient);
    setActivePrescriptionAppointmentId(appointmentId);
    setIsPrescriptionModalOpen(true);
  };

  const handleSavePrescription = (prescription: Prescription) => {
    setPrescriptions((prev) => [prescription, ...prev]);
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

  const handleSavePatient = (patient: Patient) => {
    setPatients((prev) => {
      const idx = prev.findIndex((p) => p.id === patient.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = patient;
        return copy;
      }
      return [patient, ...prev];
    });
    setSelectedPatientForDossier(patient);
  };

  const handleScheduleForPatient = (patient: Patient) => {
    setSelectedAppointment(null);
    setAppointmentDefaultDate(today);
    setAppointmentDefaultTime('09:00');
    setAppointmentDefaultPatientId(patient.id);
    setIsAppointmentModalOpen(true);
  };

  // Storage Handlers
  const handleExportData = () => {
    const dataStr = exportCabinetData();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sauvegarde_cabinet_${today}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (jsonString: string): ImportResult => {
    const result = importCabinetData(jsonString);
    if (result.success) {
      setDoctor(loadDoctorProfile());
      setPatients(loadPatients());
      setAppointments(loadAppointments());
      setPrescriptions(loadPrescriptions());
      setConsultations(loadConsultations());
    }
    return result;
  };

  const handleResetDemo = () => {
    const data = resetToDemoData();
    setDoctor(data.doctor);
    setPatients(data.patients);
    setAppointments(data.appointments);
    setPrescriptions(data.prescriptions);
    setConsultations(data.consultations);
  };

  const patientMap = useMemo(() => new Map(patients.map((p) => [p.id, p])), [patients]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900 print:bg-white print:min-h-0">
      {/* Top Header & Navigation - Hidden when printing documents */}
      <div className="no-print">
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
            onNewPrescription={() => {
              if (patients.length > 0) {
                handleOpenPrescriptionBuilder(patients[0]);
              }
            }}
            onPreviewPrescription={handlePreviewPrescription}
          />
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

      {/* Practitioner Settings & Data Backup */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        doctor={doctor}
        onSaveDoctor={setDoctor}
        onExportData={handleExportData}
        onImportData={handleImportData}
        onResetDemo={handleResetDemo}
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
        onSaveDoctorProfile={setDoctor}
        initialSelectedAppointmentId={whatsAppInitialAppointmentId}
      />
    </div>
  );
}
