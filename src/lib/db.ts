import { supabase } from './supabaseClient';
import {
  Appointment,
  Consultation,
  DoctorProfile,
  Patient,
  Prescription,
  PublicPractitioner,
} from '../types';
import {
  getInitialAppointments,
  initialConsultations,
  initialDoctorProfile,
  initialPatients,
  initialPrescriptions,
} from '../data/mockData';

function toHm(time: string | null | undefined): string | undefined {
  if (!time) return undefined;
  return time.slice(0, 5);
}

// ---------------------------------------------------------------------------
// practitioners (DoctorProfile)
// ---------------------------------------------------------------------------

interface PractitionerRow {
  id: string;
  name: string;
  title: string;
  specialty: string;
  professional_order_number: string | null;
  ninea: string | null;
  phone: string;
  email: string;
  address: string;
  city: string;
  consultation_fee: number;
  default_duration: number;
  whatsapp_reminder_hours: number | null;
  whatsapp_custom_template: string | null;
  whatsapp_auto_prompt: boolean | null;
  subscription_status: DoctorProfile['subscriptionStatus'];
  trial_ends_at: string | null;
  is_public_listed: boolean;
  public_bio: string;
  accepts_new_patients: boolean;
}

function rowToDoctorProfile(row: PractitionerRow): DoctorProfile {
  return {
    id: row.id,
    name: row.name,
    title: row.title,
    specialty: row.specialty,
    professionalOrderNumber: row.professional_order_number ?? undefined,
    ninea: row.ninea ?? undefined,
    phone: row.phone,
    email: row.email,
    address: row.address,
    city: row.city,
    consultationFee: Number(row.consultation_fee),
    defaultDuration: row.default_duration,
    whatsappReminderHours: row.whatsapp_reminder_hours ?? undefined,
    whatsappCustomTemplate: row.whatsapp_custom_template ?? undefined,
    whatsappAutoPrompt: row.whatsapp_auto_prompt ?? undefined,
    subscriptionStatus: row.subscription_status,
    trialEndsAt: row.trial_ends_at ?? undefined,
    isPublicListed: row.is_public_listed,
    publicBio: row.public_bio,
    acceptsNewPatients: row.accepts_new_patients,
  };
}

function doctorProfileToRow(patch: Partial<DoctorProfile>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if ('name' in patch) row.name = patch.name;
  if ('title' in patch) row.title = patch.title;
  if ('specialty' in patch) row.specialty = patch.specialty;
  if ('professionalOrderNumber' in patch) row.professional_order_number = patch.professionalOrderNumber ?? null;
  if ('ninea' in patch) row.ninea = patch.ninea ?? null;
  if ('phone' in patch) row.phone = patch.phone;
  if ('email' in patch) row.email = patch.email;
  if ('address' in patch) row.address = patch.address;
  if ('city' in patch) row.city = patch.city;
  if ('consultationFee' in patch) row.consultation_fee = patch.consultationFee;
  if ('defaultDuration' in patch) row.default_duration = patch.defaultDuration;
  if ('whatsappReminderHours' in patch) row.whatsapp_reminder_hours = patch.whatsappReminderHours ?? null;
  if ('whatsappCustomTemplate' in patch) row.whatsapp_custom_template = patch.whatsappCustomTemplate ?? null;
  if ('whatsappAutoPrompt' in patch) row.whatsapp_auto_prompt = patch.whatsappAutoPrompt ?? null;
  if ('isPublicListed' in patch) row.is_public_listed = patch.isPublicListed;
  if ('publicBio' in patch) row.public_bio = patch.publicBio;
  if ('acceptsNewPatients' in patch) row.accepts_new_patients = patch.acceptsNewPatients;
  return row;
}

export async function loadDoctorProfile(practitionerId: string): Promise<DoctorProfile> {
  const { data, error } = await supabase
    .from('practitioners')
    .select('*')
    .eq('id', practitionerId)
    .single();
  if (error) throw error;
  return rowToDoctorProfile(data as PractitionerRow);
}

export async function updateDoctorProfile(
  practitionerId: string,
  patch: Partial<DoctorProfile>
): Promise<DoctorProfile> {
  const { data, error } = await supabase
    .from('practitioners')
    .update(doctorProfileToRow(patch))
    .eq('id', practitionerId)
    .select()
    .single();
  if (error) throw error;
  return rowToDoctorProfile(data as PractitionerRow);
}

// ---------------------------------------------------------------------------
// patients
// ---------------------------------------------------------------------------

interface PatientRow {
  id: string;
  first_name: string;
  last_name: string;
  gender: Patient['gender'];
  birth_date: string;
  ssn: string;
  phone: string;
  email: string;
  address: string;
  blood_group: string | null;
  allergies: string[];
  medical_history: string[];
  chronic_treatments: string[];
  emergency_contact: Patient['emergencyContact'] | null;
  notes: string | null;
  created_at: string;
}

function rowToPatient(row: PatientRow): Patient {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    gender: row.gender,
    birthDate: row.birth_date,
    ssn: row.ssn,
    phone: row.phone,
    email: row.email,
    address: row.address,
    bloodGroup: row.blood_group ?? undefined,
    allergies: row.allergies ?? [],
    medicalHistory: row.medical_history ?? [],
    chronicTreatments: row.chronic_treatments ?? [],
    emergencyContact: row.emergency_contact ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
  };
}

function patientToRow(patch: Partial<Patient>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if ('firstName' in patch) row.first_name = patch.firstName;
  if ('lastName' in patch) row.last_name = patch.lastName;
  if ('gender' in patch) row.gender = patch.gender;
  if ('birthDate' in patch) row.birth_date = patch.birthDate;
  if ('ssn' in patch) row.ssn = patch.ssn;
  if ('phone' in patch) row.phone = patch.phone;
  if ('email' in patch) row.email = patch.email;
  if ('address' in patch) row.address = patch.address;
  if ('bloodGroup' in patch) row.blood_group = patch.bloodGroup ?? null;
  if ('allergies' in patch) row.allergies = patch.allergies;
  if ('medicalHistory' in patch) row.medical_history = patch.medicalHistory;
  if ('chronicTreatments' in patch) row.chronic_treatments = patch.chronicTreatments;
  if ('emergencyContact' in patch) row.emergency_contact = patch.emergencyContact ?? null;
  if ('notes' in patch) row.notes = patch.notes ?? null;
  if ('createdAt' in patch) row.created_at = patch.createdAt;
  return row;
}

export async function loadPatients(practitionerId: string): Promise<Patient[]> {
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('practitioner_id', practitionerId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return ((data ?? []) as PatientRow[]).map(rowToPatient);
}

export async function createPatient(practitionerId: string, patient: Partial<Patient>): Promise<Patient> {
  const row = { ...patientToRow(patient), practitioner_id: practitionerId };
  const { data, error } = await supabase.from('patients').insert(row).select().single();
  if (error) throw error;
  return rowToPatient(data as PatientRow);
}

export async function updatePatient(id: string, patch: Partial<Patient>): Promise<Patient> {
  const { data, error } = await supabase
    .from('patients')
    .update(patientToRow(patch))
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return rowToPatient(data as PatientRow);
}

export async function deletePatient(id: string): Promise<void> {
  const { error } = await supabase.from('patients').delete().eq('id', id);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// appointments
// ---------------------------------------------------------------------------

interface AppointmentRow {
  id: string;
  patient_id: string;
  date: string;
  start_time: string;
  duration: number;
  type: Appointment['type'];
  status: Appointment['status'];
  reason: string;
  notes: string | null;
  fee: number;
  is_paid: boolean;
  payment_method: Appointment['paymentMethod'] | null;
  arrived_at: string | null;
  whatsapp_reminder_sent: boolean;
  whatsapp_reminder_sent_at: string | null;
  whatsapp_reminder_opt_out: boolean;
}

function rowToAppointment(row: AppointmentRow): Appointment {
  return {
    id: row.id,
    patientId: row.patient_id,
    date: row.date,
    startTime: toHm(row.start_time) || '00:00',
    duration: row.duration,
    type: row.type,
    status: row.status,
    reason: row.reason,
    notes: row.notes ?? undefined,
    fee: Number(row.fee),
    isPaid: row.is_paid,
    paymentMethod: row.payment_method ?? undefined,
    arrivedAt: toHm(row.arrived_at),
    whatsappReminderSent: row.whatsapp_reminder_sent,
    whatsappReminderSentAt: row.whatsapp_reminder_sent_at ?? undefined,
    whatsappReminderOptOut: row.whatsapp_reminder_opt_out,
  };
}

function appointmentToRow(patch: Partial<Appointment>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if ('patientId' in patch) row.patient_id = patch.patientId;
  if ('date' in patch) row.date = patch.date;
  if ('startTime' in patch) row.start_time = patch.startTime;
  if ('duration' in patch) row.duration = patch.duration;
  if ('type' in patch) row.type = patch.type;
  if ('status' in patch) row.status = patch.status;
  if ('reason' in patch) row.reason = patch.reason;
  if ('notes' in patch) row.notes = patch.notes ?? null;
  if ('fee' in patch) row.fee = patch.fee;
  if ('isPaid' in patch) row.is_paid = patch.isPaid;
  if ('paymentMethod' in patch) row.payment_method = patch.paymentMethod ?? null;
  if ('arrivedAt' in patch) row.arrived_at = patch.arrivedAt ?? null;
  if ('whatsappReminderSent' in patch) row.whatsapp_reminder_sent = patch.whatsappReminderSent;
  if ('whatsappReminderSentAt' in patch) row.whatsapp_reminder_sent_at = patch.whatsappReminderSentAt ?? null;
  if ('whatsappReminderOptOut' in patch) row.whatsapp_reminder_opt_out = patch.whatsappReminderOptOut;
  return row;
}

export async function loadAppointments(practitionerId: string): Promise<Appointment[]> {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('practitioner_id', practitionerId)
    .order('date', { ascending: true })
    .order('start_time', { ascending: true });
  if (error) throw error;
  return ((data ?? []) as AppointmentRow[]).map(rowToAppointment);
}

export async function createAppointment(
  practitionerId: string,
  apt: Partial<Appointment>
): Promise<Appointment> {
  const row = { ...appointmentToRow(apt), practitioner_id: practitionerId };
  const { data, error } = await supabase.from('appointments').insert(row).select().single();
  if (error) throw error;
  return rowToAppointment(data as AppointmentRow);
}

export async function updateAppointment(id: string, patch: Partial<Appointment>): Promise<Appointment> {
  const { data, error } = await supabase
    .from('appointments')
    .update(appointmentToRow(patch))
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return rowToAppointment(data as AppointmentRow);
}

export async function deleteAppointment(id: string): Promise<void> {
  const { error } = await supabase.from('appointments').delete().eq('id', id);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// prescriptions
// ---------------------------------------------------------------------------

interface PrescriptionRow {
  id: string;
  patient_id: string;
  appointment_id: string | null;
  date: string;
  medications: Prescription['medications'];
  recommendations: string | null;
  created_at: string;
}

function rowToPrescription(row: PrescriptionRow): Prescription {
  return {
    id: row.id,
    patientId: row.patient_id,
    appointmentId: row.appointment_id ?? undefined,
    date: row.date,
    medications: row.medications ?? [],
    recommendations: row.recommendations ?? undefined,
    createdAt: row.created_at,
  };
}

export async function loadPrescriptions(practitionerId: string): Promise<Prescription[]> {
  const { data, error } = await supabase
    .from('prescriptions')
    .select('*')
    .eq('practitioner_id', practitionerId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return ((data ?? []) as PrescriptionRow[]).map(rowToPrescription);
}

export async function createPrescription(
  practitionerId: string,
  presc: Partial<Prescription>
): Promise<Prescription> {
  const row = {
    practitioner_id: practitionerId,
    patient_id: presc.patientId,
    appointment_id: presc.appointmentId ?? null,
    date: presc.date,
    medications: presc.medications ?? [],
    recommendations: presc.recommendations ?? null,
  };
  const { data, error } = await supabase.from('prescriptions').insert(row).select().single();
  if (error) throw error;
  return rowToPrescription(data as PrescriptionRow);
}

// ---------------------------------------------------------------------------
// consultations
// ---------------------------------------------------------------------------

interface ConsultationRow {
  id: string;
  appointment_id: string;
  patient_id: string;
  date: string;
  time: string;
  reason: string;
  systolic_bp: number | null;
  diastolic_bp: number | null;
  heart_rate: number | null;
  weight: number | null;
  height: number | null;
  temperature: number | null;
  blood_sugar: number | null;
  soap: Consultation['soap'];
  odontogram: Consultation['odontogram'] | null;
  prescription_id: string | null;
  notes: string | null;
}

function rowToConsultation(row: ConsultationRow): Consultation {
  const vitals: Consultation['vitals'] = {};
  if (row.systolic_bp !== null) vitals!.systolicBp = row.systolic_bp;
  if (row.diastolic_bp !== null) vitals!.diastolicBp = row.diastolic_bp;
  if (row.heart_rate !== null) vitals!.heartRate = row.heart_rate;
  if (row.weight !== null) vitals!.weight = Number(row.weight);
  if (row.height !== null) vitals!.height = Number(row.height);
  if (row.temperature !== null) vitals!.temperature = Number(row.temperature);
  if (row.blood_sugar !== null) vitals!.bloodSugar = Number(row.blood_sugar);

  return {
    id: row.id,
    appointmentId: row.appointment_id,
    patientId: row.patient_id,
    date: row.date,
    time: toHm(row.time) || '00:00',
    reason: row.reason,
    vitals: Object.keys(vitals!).length > 0 ? vitals : undefined,
    soap: row.soap,
    odontogram: row.odontogram ?? undefined,
    prescriptionId: row.prescription_id ?? undefined,
    notes: row.notes ?? undefined,
  };
}

export async function loadConsultations(practitionerId: string): Promise<Consultation[]> {
  const { data, error } = await supabase
    .from('consultations')
    .select('*')
    .eq('practitioner_id', practitionerId)
    .order('date', { ascending: false });
  if (error) throw error;
  return ((data ?? []) as ConsultationRow[]).map(rowToConsultation);
}

export async function upsertConsultation(
  practitionerId: string,
  consultation: Consultation
): Promise<Consultation> {
  const vitals = consultation.vitals;
  const row = {
    practitioner_id: practitionerId,
    appointment_id: consultation.appointmentId,
    patient_id: consultation.patientId,
    date: consultation.date,
    time: consultation.time,
    reason: consultation.reason,
    systolic_bp: vitals?.systolicBp ?? null,
    diastolic_bp: vitals?.diastolicBp ?? null,
    heart_rate: vitals?.heartRate ?? null,
    weight: vitals?.weight ?? null,
    height: vitals?.height ?? null,
    temperature: vitals?.temperature ?? null,
    blood_sugar: vitals?.bloodSugar ?? null,
    soap: consultation.soap,
    odontogram: consultation.odontogram ?? null,
    prescription_id: consultation.prescriptionId ?? null,
    notes: consultation.notes ?? null,
  };
  const { data, error } = await supabase
    .from('consultations')
    .upsert(row, { onConflict: 'appointment_id' })
    .select()
    .single();
  if (error) throw error;
  return rowToConsultation(data as ConsultationRow);
}

// ---------------------------------------------------------------------------
// Export / Import / Reset (sauvegarde JSON & données de démonstration)
// ---------------------------------------------------------------------------

export async function exportCabinetData(practitionerId: string): Promise<string> {
  const [doctor, patients, appointments, prescriptions, consultations] = await Promise.all([
    loadDoctorProfile(practitionerId),
    loadPatients(practitionerId),
    loadAppointments(practitionerId),
    loadPrescriptions(practitionerId),
    loadConsultations(practitionerId),
  ]);
  const data = {
    exportDate: new Date().toISOString(),
    version: '1.0',
    doctor,
    patients,
    appointments,
    prescriptions,
    consultations,
  };
  return JSON.stringify(data, null, 2);
}

async function deleteAllCabinetData(practitionerId: string): Promise<void> {
  const tables = ['consultations', 'prescriptions', 'appointments', 'patients'] as const;
  for (const table of tables) {
    const { error } = await supabase.from(table).delete().eq('practitioner_id', practitionerId);
    if (error) throw error;
  }
}

interface CabinetSnapshot {
  patients: Patient[];
  appointments: Appointment[];
  prescriptions: Prescription[];
  consultations: Consultation[];
}

// Réinsère un instantané de cabinet (démo ou import JSON) avec des ids serveur frais,
// en respectant l'ordre des dépendances FK et en reliant chaque entité importée à ses
// parents via une table de correspondance ancien-id -> nouveau-id.
async function bulkInsertSnapshot(
  practitionerId: string,
  snapshot: CabinetSnapshot
): Promise<CabinetSnapshot> {
  const patientIdMap = new Map<string, string>();
  const appointmentIdMap = new Map<string, string>();
  const prescriptionIdMap = new Map<string, string>();

  const insertedPatients: Patient[] = [];
  for (const patient of snapshot.patients) {
    const created = await createPatient(practitionerId, patient);
    patientIdMap.set(patient.id, created.id);
    insertedPatients.push(created);
  }

  const insertedAppointments: Appointment[] = [];
  for (const apt of snapshot.appointments) {
    const newPatientId = patientIdMap.get(apt.patientId);
    if (!newPatientId) continue;
    const created = await createAppointment(practitionerId, { ...apt, patientId: newPatientId });
    appointmentIdMap.set(apt.id, created.id);
    insertedAppointments.push(created);
  }

  const insertedPrescriptions: Prescription[] = [];
  for (const presc of snapshot.prescriptions) {
    const newPatientId = patientIdMap.get(presc.patientId);
    if (!newPatientId) continue;
    const newAppointmentId = presc.appointmentId ? appointmentIdMap.get(presc.appointmentId) : undefined;
    const created = await createPrescription(practitionerId, {
      ...presc,
      patientId: newPatientId,
      appointmentId: newAppointmentId,
    });
    prescriptionIdMap.set(presc.id, created.id);
    insertedPrescriptions.push(created);
  }

  const insertedConsultations: Consultation[] = [];
  for (const cons of snapshot.consultations) {
    const newPatientId = patientIdMap.get(cons.patientId);
    const newAppointmentId = appointmentIdMap.get(cons.appointmentId);
    if (!newPatientId || !newAppointmentId) continue;
    const newPrescriptionId = cons.prescriptionId ? prescriptionIdMap.get(cons.prescriptionId) : undefined;
    const created = await upsertConsultation(practitionerId, {
      ...cons,
      patientId: newPatientId,
      appointmentId: newAppointmentId,
      prescriptionId: newPrescriptionId,
    });
    insertedConsultations.push(created);
  }

  return {
    patients: insertedPatients,
    appointments: insertedAppointments,
    prescriptions: insertedPrescriptions,
    consultations: insertedConsultations,
  };
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

export async function importCabinetData(practitionerId: string, jsonString: string): Promise<ImportResult> {
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
      (a: unknown) => isValidAppointment(a) && validPatientIds.has((a as Appointment).patientId)
    );
    if (validAppointments.length < raw.appointments.length) {
      errors.push(
        `${raw.appointments.length - validAppointments.length} rendez-vous invalide(s) ou lié(s) à un patient inconnu ignoré(s).`
      );
    }

    const rawPrescriptions = Array.isArray(raw.prescriptions) ? raw.prescriptions : [];
    const validPrescriptions: Prescription[] = rawPrescriptions.filter(
      (p: unknown) => isValidPrescription(p) && validPatientIds.has((p as Prescription).patientId)
    );
    if (validPrescriptions.length < rawPrescriptions.length) {
      errors.push(`${rawPrescriptions.length - validPrescriptions.length} ordonnance(s) invalide(s) ignorée(s).`);
    }

    const rawConsultations = Array.isArray(raw.consultations) ? raw.consultations : [];
    const validConsultations: Consultation[] = rawConsultations.filter(
      (c: unknown) => isValidConsultation(c) && validPatientIds.has((c as Consultation).patientId)
    );
    if (validConsultations.length < rawConsultations.length) {
      errors.push(`${rawConsultations.length - validConsultations.length} consultation(s) invalide(s) ignorée(s).`);
    }

    await deleteAllCabinetData(practitionerId);
    const inserted = await bulkInsertSnapshot(practitionerId, {
      patients: validPatients,
      appointments: validAppointments,
      prescriptions: validPrescriptions,
      consultations: validConsultations,
    });

    if (raw.doctor && typeof raw.doctor === 'object') {
      await updateDoctorProfile(practitionerId, raw.doctor as Partial<DoctorProfile>);
    }

    imported.patients = inserted.patients.length;
    imported.appointments = inserted.appointments.length;
    imported.prescriptions = inserted.prescriptions.length;
    imported.consultations = inserted.consultations.length;

    return { success: true, errors, imported };
  } catch (err) {
    console.error('Failed to import cabinet data:', err);
    return { success: false, errors: ["Erreur inattendue lors de l'import des données."], imported };
  }
}

export async function resetToDemoData(practitionerId: string): Promise<{
  doctor: DoctorProfile;
  patients: Patient[];
  appointments: Appointment[];
  prescriptions: Prescription[];
  consultations: Consultation[];
}> {
  await deleteAllCabinetData(practitionerId);
  const { patients, appointments, prescriptions, consultations } = await bulkInsertSnapshot(practitionerId, {
    patients: initialPatients,
    appointments: getInitialAppointments(),
    prescriptions: initialPrescriptions,
    consultations: initialConsultations,
  });

  const { data, error } = await supabase
    .from('practitioners')
    .update({
      name: initialDoctorProfile.name,
      title: initialDoctorProfile.title,
      specialty: initialDoctorProfile.specialty,
      professional_order_number: initialDoctorProfile.professionalOrderNumber ?? null,
      ninea: initialDoctorProfile.ninea ?? null,
      phone: initialDoctorProfile.phone,
      email: initialDoctorProfile.email,
      address: initialDoctorProfile.address,
      city: initialDoctorProfile.city,
      consultation_fee: initialDoctorProfile.consultationFee,
      default_duration: initialDoctorProfile.defaultDuration,
      whatsapp_reminder_hours: initialDoctorProfile.whatsappReminderHours ?? null,
      whatsapp_custom_template: null,
      whatsapp_auto_prompt: null,
      is_public_listed: initialDoctorProfile.isPublicListed,
      public_bio: initialDoctorProfile.publicBio,
      accepts_new_patients: initialDoctorProfile.acceptsNewPatients,
    })
    .eq('id', practitionerId)
    .select()
    .single();
  if (error) throw error;

  return { doctor: rowToDoctorProfile(data as PractitionerRow), patients, appointments, prescriptions, consultations };
}

// ---------------------------------------------------------------------------
// Annuaire public (accès anonyme, lecture seule via RPC security definer)
// ---------------------------------------------------------------------------

interface PublicPractitionerRow {
  id: string;
  name: string;
  title: string;
  specialty: string;
  phone: string;
  address: string;
  city: string;
  public_bio: string;
  accepts_new_patients: boolean;
}

function rowToPublicPractitioner(row: PublicPractitionerRow): PublicPractitioner {
  return {
    id: row.id,
    name: row.name,
    title: row.title,
    specialty: row.specialty,
    phone: row.phone,
    address: row.address,
    city: row.city,
    publicBio: row.public_bio,
    acceptsNewPatients: row.accepts_new_patients,
  };
}

export async function loadPublicPractitioners(): Promise<PublicPractitioner[]> {
  const { data, error } = await supabase.rpc('list_public_practitioners');
  if (error) throw error;
  return ((data ?? []) as PublicPractitionerRow[]).map(rowToPublicPractitioner);
}
