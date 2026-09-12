import {
  Appointment,
  Consultation,
  DoctorProfile,
  Patient,
  Prescription,
} from '../types';
import {
  getInitialAppointments,
  initialConsultations,
  initialDoctorProfile,
  initialPatients,
  initialPrescriptions,
} from '../data/mockData';

export const STORAGE_KEYS = {
  DOCTOR: 'cabinet_sante_doctor_sn_v2',
  PATIENTS: 'cabinet_sante_patients_sn_v2',
  APPOINTMENTS: 'cabinet_sante_appointments_sn_v2',
  PRESCRIPTIONS: 'cabinet_sante_prescriptions_sn_v2',
  CONSULTATIONS: 'cabinet_sante_consultations_sn_v2',
};

export function loadDoctorProfile(): DoctorProfile {
  try {
    const item = localStorage.getItem(STORAGE_KEYS.DOCTOR);
    if (!item) {
      saveDoctorProfile(initialDoctorProfile);
      return initialDoctorProfile;
    }
    return JSON.parse(item);
  } catch (err) {
    console.error('Failed to load doctor profile:', err);
    return initialDoctorProfile;
  }
}

export function saveDoctorProfile(profile: DoctorProfile): void {
  try {
    localStorage.setItem(STORAGE_KEYS.DOCTOR, JSON.stringify(profile));
  } catch (err) {
    console.error('Failed to save doctor profile:', err);
  }
}

export function loadPatients(): Patient[] {
  try {
    const item = localStorage.getItem(STORAGE_KEYS.PATIENTS);
    return item ? JSON.parse(item) : initialPatients;
  } catch (err) {
    console.error('Failed to load patients:', err);
    return initialPatients;
  }
}

export function savePatients(patients: Patient[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(patients));
  } catch (err) {
    console.error('Failed to save patients:', err);
  }
}

export function loadAppointments(): Appointment[] {
  try {
    const item = localStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
    return item ? JSON.parse(item) : getInitialAppointments();
  } catch (err) {
    console.error('Failed to load appointments:', err);
    return getInitialAppointments();
  }
}

export function saveAppointments(appointments: Appointment[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));
  } catch (err) {
    console.error('Failed to save appointments:', err);
  }
}

export function loadPrescriptions(): Prescription[] {
  try {
    const item = localStorage.getItem(STORAGE_KEYS.PRESCRIPTIONS);
    return item ? JSON.parse(item) : initialPrescriptions;
  } catch (err) {
    console.error('Failed to load prescriptions:', err);
    return initialPrescriptions;
  }
}

export function savePrescriptions(prescriptions: Prescription[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PRESCRIPTIONS, JSON.stringify(prescriptions));
  } catch (err) {
    console.error('Failed to save prescriptions:', err);
  }
}

export function loadConsultations(): Consultation[] {
  try {
    const item = localStorage.getItem(STORAGE_KEYS.CONSULTATIONS);
    return item ? JSON.parse(item) : initialConsultations;
  } catch (err) {
    console.error('Failed to load consultations:', err);
    return initialConsultations;
  }
}

export function saveConsultations(consultations: Consultation[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CONSULTATIONS, JSON.stringify(consultations));
  } catch (err) {
    console.error('Failed to save consultations:', err);
  }
}

export function resetToDemoData(): {
  doctor: DoctorProfile;
  patients: Patient[];
  appointments: Appointment[];
  prescriptions: Prescription[];
  consultations: Consultation[];
} {
  const doctor = initialDoctorProfile;
  const patients = initialPatients;
  const appointments = getInitialAppointments();
  const prescriptions = initialPrescriptions;
  const consultations = initialConsultations;

  saveDoctorProfile(doctor);
  savePatients(patients);
  saveAppointments(appointments);
  savePrescriptions(prescriptions);
  saveConsultations(consultations);

  return { doctor, patients, appointments, prescriptions, consultations };
}

export function exportCabinetData(): string {
  const data = {
    exportDate: new Date().toISOString(),
    version: '1.0',
    doctor: loadDoctorProfile(),
    patients: loadPatients(),
    appointments: loadAppointments(),
    prescriptions: loadPrescriptions(),
    consultations: loadConsultations(),
  };
  return JSON.stringify(data, null, 2);
}

export interface ImportResult {
  success: boolean;
  errors: string[];
  imported: { patients: number; appointments: number; prescriptions: number; consultations: number };
}

function isValidPatient(x: unknown): x is Patient {
  if (!x || typeof x !== 'object') return false;
  const p = x as Record<string, unknown>;
  return (
    typeof p.id === 'string' &&
    typeof p.firstName === 'string' &&
    typeof p.lastName === 'string' &&
    typeof p.birthDate === 'string'
  );
}

function isValidAppointment(x: unknown): x is Appointment {
  if (!x || typeof x !== 'object') return false;
  const a = x as Record<string, unknown>;
  return (
    typeof a.id === 'string' &&
    typeof a.patientId === 'string' &&
    typeof a.date === 'string' &&
    typeof a.startTime === 'string'
  );
}

function isValidPrescription(x: unknown): x is Prescription {
  if (!x || typeof x !== 'object') return false;
  const p = x as Record<string, unknown>;
  return typeof p.id === 'string' && typeof p.patientId === 'string';
}

function isValidConsultation(x: unknown): x is Consultation {
  if (!x || typeof x !== 'object') return false;
  const c = x as Record<string, unknown>;
  return (
    typeof c.id === 'string' &&
    typeof c.patientId === 'string' &&
    typeof c.appointmentId === 'string'
  );
}

export function importCabinetData(jsonString: string): ImportResult {
  const errors: string[] = [];
  const imported = { patients: 0, appointments: 0, prescriptions: 0, consultations: 0 };

  let data: unknown;
  try {
    data = JSON.parse(jsonString);
  } catch (err) {
    console.error('Failed to parse cabinet data:', err);
    return { success: false, errors: ["Le fichier sélectionné n'est pas un JSON valide."], imported };
  }

  if (!data || typeof data !== 'object') {
    return {
      success: false,
      errors: ['Structure JSON invalide : les listes "patients" et "appointments" sont requises.'],
      imported,
    };
  }
  const raw = data as Record<string, unknown>;
  if (!Array.isArray(raw.patients) || !Array.isArray(raw.appointments)) {
    return {
      success: false,
      errors: ['Structure JSON invalide : les listes "patients" et "appointments" sont requises.'],
      imported,
    };
  }

  try {
    const validPatients: Patient[] = raw.patients.filter(isValidPatient);
    if (validPatients.length < raw.patients.length) {
      errors.push(`${raw.patients.length - validPatients.length} fiche(s) patient invalide(s) ignorée(s).`);
    }
    const validPatientIds = new Set(validPatients.map((p) => p.id));

    const validAppointments: Appointment[] = raw.appointments.filter(
      (a: unknown) => isValidAppointment(a) && validPatientIds.has(a.patientId)
    );
    if (validAppointments.length < raw.appointments.length) {
      errors.push(
        `${raw.appointments.length - validAppointments.length} rendez-vous invalide(s) ou lié(s) à un patient inconnu ont été ignoré(s).`
      );
    }

    const rawPrescriptions = Array.isArray(raw.prescriptions) ? raw.prescriptions : [];
    const validPrescriptions: Prescription[] = rawPrescriptions.filter(
      (p: unknown) => isValidPrescription(p) && validPatientIds.has(p.patientId)
    );
    if (validPrescriptions.length < rawPrescriptions.length) {
      errors.push(`${rawPrescriptions.length - validPrescriptions.length} ordonnance(s) invalide(s) ignorée(s).`);
    }

    const rawConsultations = Array.isArray(raw.consultations) ? raw.consultations : [];
    const validConsultations: Consultation[] = rawConsultations.filter(
      (c: unknown) => isValidConsultation(c) && validPatientIds.has(c.patientId)
    );
    if (validConsultations.length < rawConsultations.length) {
      errors.push(`${rawConsultations.length - validConsultations.length} consultation(s) invalide(s) ignorée(s).`);
    }

    if (raw.doctor && typeof raw.doctor === 'object') saveDoctorProfile(raw.doctor as DoctorProfile);
    savePatients(validPatients);
    saveAppointments(validAppointments);
    if (Array.isArray(raw.prescriptions)) savePrescriptions(validPrescriptions);
    if (Array.isArray(raw.consultations)) saveConsultations(validConsultations);

    imported.patients = validPatients.length;
    imported.appointments = validAppointments.length;
    imported.prescriptions = validPrescriptions.length;
    imported.consultations = validConsultations.length;

    return { success: true, errors, imported };
  } catch (err) {
    console.error('Failed to import cabinet data:', err);
    return { success: false, errors: ["Erreur inattendue lors de l'import des données."], imported };
  }
}
