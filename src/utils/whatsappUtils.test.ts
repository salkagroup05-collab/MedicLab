import { describe, expect, it } from 'vitest';
import { Appointment, Patient } from '../types';
import { getApproachingAppointmentsData } from './whatsappUtils';

const patient: Patient = {
  id: 'p1',
  firstName: 'Awa',
  lastName: 'Diop',
  gender: 'F',
  birthDate: '1990-01-01',
  ssn: '',
  phone: '+221771234567',
  email: '',
  address: '',
  allergies: [],
  medicalHistory: [],
  chronicTreatments: [],
  createdAt: '2026-01-01',
};

function apt(id: string, date: string, extra: Partial<Appointment> = {}): Appointment {
  return {
    id,
    patientId: 'p1',
    date,
    startTime: '09:00',
    duration: 30,
    type: 'consultation',
    status: 'confirmed',
    reason: '',
    fee: 0,
    isPaid: false,
    ...extra,
  };
}

describe('getApproachingAppointmentsData', () => {
  const today = '2026-03-10';

  it("classe aujourd'hui, demain, J+2 et la suite dans le bon groupe", () => {
    const data = getApproachingAppointmentsData(
      [apt('a', '2026-03-10'), apt('b', '2026-03-11'), apt('c', '2026-03-12'), apt('d', '2026-03-15')],
      [patient],
      today
    );
    const ids = (category: string) =>
      data.grouped.find((g) => g.category === category)?.appointments.map((i) => i.appointment.id);

    expect(ids('aujourdhui')).toEqual(['a']);
    expect(ids('demain')).toEqual(['b']);
    expect(ids('j2')).toEqual(['c']);
    expect(ids('futur')).toEqual(['d']);
    expect(data.tomorrowPendingCount).toBe(1);
  });

  it('passe correctement une fin de mois', () => {
    const data = getApproachingAppointmentsData([apt('x', '2026-04-01')], [patient], '2026-03-31');
    expect(data.grouped.find((g) => g.category === 'demain')?.appointments).toHaveLength(1);
  });

  it('ignore annulés et absents, et ne relance pas un rappel envoyé ou refusé', () => {
    const data = getApproachingAppointmentsData(
      [
        apt('c', '2026-03-11', { status: 'cancelled' }),
        apt('n', '2026-03-11', { status: 'no_show' }),
        apt('s', '2026-03-11', { whatsappReminderSent: true }),
        apt('o', '2026-03-11', { whatsappReminderOptOut: true }),
        apt('ok', '2026-03-11'),
      ],
      [patient],
      today
    );
    expect(data.tomorrowPendingCount).toBe(1);
    expect(data.sentRemindersCount).toBe(1);
  });

  it('ignore les RDV passés et ceux au-delà de 7 jours', () => {
    const data = getApproachingAppointmentsData(
      [apt('past', '2026-03-09'), apt('far', '2026-03-18')],
      [patient],
      today
    );
    expect(data.grouped.every((g) => g.appointments.length === 0)).toBe(true);
  });
});
