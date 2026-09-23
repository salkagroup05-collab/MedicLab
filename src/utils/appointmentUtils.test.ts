import { describe, expect, it } from 'vitest';
import { Appointment } from '../types';
import { findOverlappingAppointment } from './appointmentUtils';

function apt(id: string, startTime: string, duration: number, extra: Partial<Appointment> = {}): Appointment {
  return {
    id,
    patientId: 'p1',
    date: '2026-03-10',
    startTime,
    duration,
    type: 'consultation',
    status: 'confirmed',
    reason: '',
    fee: 0,
    isPaid: false,
    ...extra,
  };
}

describe('findOverlappingAppointment', () => {
  const existing = [apt('a', '09:00', 30)];

  it('détecte un chevauchement partiel', () => {
    expect(findOverlappingAppointment(existing, '2026-03-10', '09:15', 30)?.id).toBe('a');
  });

  it('accepte un créneau qui commence à la fin du précédent', () => {
    expect(findOverlappingAppointment(existing, '2026-03-10', '09:30', 30)).toBeNull();
  });

  it("ignore un autre jour, un RDV annulé et le RDV qu'on modifie", () => {
    expect(findOverlappingAppointment(existing, '2026-03-11', '09:00', 30)).toBeNull();
    expect(
      findOverlappingAppointment([apt('c', '09:00', 30, { status: 'cancelled' })], '2026-03-10', '09:00', 30)
    ).toBeNull();
    expect(findOverlappingAppointment(existing, '2026-03-10', '09:00', 30, 'a')).toBeNull();
  });
});
