import { useEffect, useState } from 'react';
import {
  Appointment,
  AppointmentStatus,
  Consultation,
  DoctorProfile,
  Patient,
  PaymentMethod,
  Prescription,
} from '../types';
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
  saveConsultation,
  updateAppointment,
  updateDoctorProfile,
  updatePatient,
} from '../lib/db';
import { getTodayDateString } from '../utils/dateUtils';

function loadAll(practitionerId: string) {
  return Promise.all([
    loadDoctorProfile(practitionerId),
    loadPatients(practitionerId),
    loadAppointments(practitionerId),
    loadPrescriptions(practitionerId),
    loadConsultations(practitionerId),
  ]);
}

// Horodatage dans le nom de fichier, pour qu'une sauvegarde automatique
// n'écrase pas celle faite plus tôt le même jour.
function backupTimestamp() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `${getTodayDateString()}_${hh}h${mm}`;
}

/**
 * Données du cabinet du praticien connecté (profil, patients, RDV, ordonnances,
 * consultations) et toutes leurs écritures : chargement initial, mises à jour
 * optimistes avec annulation ciblée en cas d'échec, sauvegarde / import /
 * réinitialisation. Les erreurs sont signalées via `showError` ; aucune
 * fonction ne lève d'exception vers l'appelant.
 */
export function useCabinetData(practitionerId: string, showError: (message: string) => void) {
  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const applyAll = ([doctorData, patientsData, appointmentsData, prescriptionsData, consultationsData]: Awaited<
    ReturnType<typeof loadAll>
  >) => {
    setDoctor(doctorData);
    setPatients(patientsData);
    setAppointments(appointmentsData);
    setPrescriptions(prescriptionsData);
    setConsultations(consultationsData);
  };

  // Chargement initial des données du cabinet du praticien connecté
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    loadAll(practitionerId)
      .then((data) => {
        if (!cancelled) applyAll(data);
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
    // showError vient du parent et change à chaque rendu : seul le praticien
    // doit déclencher un rechargement.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [practitionerId]);

  const reloadCabinetData = async () => applyAll(await loadAll(practitionerId));

  const replaceAppointment = (updated: Appointment) =>
    setAppointments((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));

  // Annule une mise à jour optimiste d'un seul RDV. Restaurer toute la liste
  // effacerait les autres modifications réussies entre-temps.
  const restoreAppointment = (original: Appointment) => replaceAppointment(original);

  // Mise à jour optimiste d'un RDV : affichée tout de suite, confirmée par la
  // réponse du serveur, annulée pour ce seul RDV en cas d'échec.
  const patchAppointment = async (id: string, patch: Partial<Appointment>, errorMessage: string) => {
    const current = appointments.find((a) => a.id === id);
    if (!current) return;
    replaceAppointment({ ...current, ...patch });
    try {
      replaceAppointment(await updateAppointment(id, patch));
    } catch (err) {
      console.error('Failed to update appointment:', err);
      restoreAppointment(current);
      showError(errorMessage);
    }
  };

  const updateAppointmentReminder = (appointmentId: string, sent: boolean, timestamp?: string) => {
    const sentAt = sent ? timestamp || new Date().toISOString() : undefined;
    return patchAppointment(
      appointmentId,
      { whatsappReminderSent: sent, whatsappReminderSentAt: sentAt },
      'Erreur lors de la mise à jour du rappel WhatsApp.'
    );
  };

  const togglePayment = (aptId: string, isPaid: boolean, paymentMethod?: PaymentMethod) => {
    const current = appointments.find((a) => a.id === aptId);
    if (!current) return Promise.resolve();
    const nextPaymentMethod = isPaid ? paymentMethod || current.paymentMethod || 'especes' : undefined;
    return patchAppointment(
      aptId,
      { isPaid, paymentMethod: nextPaymentMethod },
      'Erreur lors de la mise à jour du paiement.'
    );
  };

  const updateStatus = (id: string, newStatus: AppointmentStatus) => {
    const current = appointments.find((a) => a.id === id);
    if (!current) return Promise.resolve();
    let arrivedAt = current.arrivedAt;
    if (newStatus === 'waiting' && !arrivedAt) {
      const now = new Date();
      arrivedAt = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    }
    return patchAppointment(id, { status: newStatus, arrivedAt }, 'Erreur lors du changement de statut.');
  };

  const saveAppointment = async (aptData: Partial<Appointment>, newPatientData?: Partial<Patient>) => {
    if (!doctor) return;
    try {
      let finalPatientId = aptData.patientId;

      // Patient créé à la volée depuis la modale de RDV
      if (newPatientData) {
        const createdPatient = await createPatient(practitionerId, {
          firstName: newPatientData.firstName || '',
          lastName: newPatientData.lastName || '',
          gender: newPatientData.gender || 'Autre',
          birthDate: newPatientData.birthDate || '',
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
        replaceAppointment(
          await updateAppointment(aptData.id, { ...aptData, patientId: finalPatientId || undefined })
        );
      } else {
        const created = await createAppointment(practitionerId, {
          ...aptData,
          patientId: finalPatientId || '',
          date: aptData.date || getTodayDateString(),
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
      // Resynchronise avec la base (le patient créé à la volée a pu être enregistré).
      await loadAppointments(practitionerId)
        .then(setAppointments)
        .catch((reloadErr) => console.error('Failed to reload appointments:', reloadErr));
      showError("Erreur lors de l'enregistrement du rendez-vous.");
    }
  };

  const removeAppointment = async (id: string) => {
    const removed = appointments.find((a) => a.id === id);
    if (!removed) return;
    setAppointments((prev) => prev.filter((a) => a.id !== id));
    try {
      await deleteAppointment(id);
    } catch (err) {
      console.error('Failed to delete appointment:', err);
      setAppointments((prev) => (prev.some((a) => a.id === id) ? prev : [...prev, removed]));
      showError('Erreur lors de la suppression du rendez-vous.');
    }
  };

  const recordConsultation = async (consultation: Consultation, updatedAppointment: Partial<Appointment>) => {
    try {
      // Une seule transaction : en cas d'échec, rien n'a été écrit et l'état
      // en mémoire est toujours juste.
      const saved = await saveConsultation(consultation, updatedAppointment);
      setConsultations((prev) => {
        const idx = prev.findIndex((c) => c.appointmentId === saved.consultation.appointmentId);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = saved.consultation;
          return copy;
        }
        return [saved.consultation, ...prev];
      });
      replaceAppointment(saved.appointment);
    } catch (err) {
      console.error('Failed to save consultation:', err);
      showError("Erreur lors de l'enregistrement de la consultation.");
    }
  };

  const savePrescription = async (prescription: Prescription) => {
    try {
      const created = await createPrescription(practitionerId, prescription);
      setPrescriptions((prev) => [created, ...prev]);
    } catch (err) {
      console.error('Failed to save prescription:', err);
      showError("Erreur lors de l'enregistrement de l'ordonnance.");
    }
  };

  // Renvoie le patient tel qu'enregistré, ou null en cas d'échec.
  const savePatient = async (patient: Patient): Promise<Patient | null> => {
    try {
      if (patient.id) {
        const updated = await updatePatient(patient.id, patient);
        setPatients((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        return updated;
      }
      const created = await createPatient(practitionerId, patient);
      setPatients((prev) => [created, ...prev]);
      return created;
    } catch (err) {
      console.error('Failed to save patient:', err);
      await loadPatients(practitionerId)
        .then(setPatients)
        .catch((reloadErr) => console.error('Failed to reload patients:', reloadErr));
      showError("Erreur lors de l'enregistrement du patient.");
      return null;
    }
  };

  // Profil praticien (SettingsModal + éditeur de modèle WhatsApp)
  const saveDoctor = async (profile: DoctorProfile) => {
    const previous = doctor;
    setDoctor(profile);
    try {
      setDoctor(await updateDoctorProfile(practitionerId, profile));
    } catch (err) {
      console.error('Failed to save doctor profile:', err);
      setDoctor(previous);
      showError('Erreur lors de la mise à jour du profil.');
    }
  };

  // Télécharge une copie JSON complète du cabinet. Lève une erreur en cas d'échec.
  const downloadCabinetBackup = async (fileLabel: string) => {
    const dataStr = await exportCabinetData(practitionerId);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileLabel}.json`;
    link.click();
    // Révocation différée : certains navigateurs annulent le téléchargement si
    // l'URL disparaît dans la foulée du clic.
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  };

  const exportData = async () => {
    try {
      await downloadCabinetBackup(`sauvegarde_cabinet_${getTodayDateString()}`);
    } catch (err) {
      console.error('Failed to export data:', err);
      showError("Erreur lors de l'export des données.");
    }
  };

  // Import et réinitialisation remplacent toutes les données du cabinet : on
  // télécharge toujours une sauvegarde d'abord, et on n'efface rien si elle
  // échoue.
  const importData = async (jsonString: string): Promise<ImportResult> => {
    try {
      await downloadCabinetBackup(`sauvegarde_avant_import_${backupTimestamp()}`);
    } catch (err) {
      console.error('Failed to back up before import:', err);
      return {
        success: false,
        errors: ["La sauvegarde préalable a échoué : import annulé, aucune donnée n'a été modifiée."],
        imported: { patients: 0, appointments: 0, prescriptions: 0, consultations: 0 },
      };
    }

    const result = await importCabinetData(practitionerId, jsonString);
    // On réaffiche l'état réel de la base plutôt que l'ancien état en mémoire.
    try {
      await reloadCabinetData();
    } catch (err) {
      console.error('Failed to reload cabinet data after import:', err);
      showError('Erreur lors du rechargement des données du cabinet.');
    }
    return result;
  };

  const resetDemo = async (): Promise<boolean> => {
    try {
      await downloadCabinetBackup(`sauvegarde_avant_reinitialisation_${backupTimestamp()}`);
    } catch (err) {
      console.error('Failed to back up before reset:', err);
      showError("La sauvegarde préalable a échoué : réinitialisation annulée, aucune donnée n'a été modifiée.");
      return false;
    }

    try {
      const data = await resetToDemoData(practitionerId);
      setDoctor(data.doctor);
      setPatients(data.patients);
      setAppointments(data.appointments);
      setPrescriptions(data.prescriptions);
      setConsultations(data.consultations);
      return true;
    } catch (err) {
      console.error('Failed to reset demo data:', err);
      showError('Erreur lors de la réinitialisation des données de démonstration.');
      await reloadCabinetData().catch((reloadErr) =>
        console.error('Failed to reload cabinet data after reset:', reloadErr)
      );
      return false;
    }
  };

  return {
    doctor,
    patients,
    appointments,
    prescriptions,
    consultations,
    isLoading,
    updateAppointmentReminder,
    togglePayment,
    updateStatus,
    saveAppointment,
    removeAppointment,
    recordConsultation,
    savePrescription,
    savePatient,
    saveDoctor,
    exportData,
    importData,
    resetDemo,
  };
}
