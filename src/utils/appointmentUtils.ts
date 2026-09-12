import { Appointment } from '../types';
import { timeToMinutes } from './dateUtils';

/**
 * Recherche un rendez-vous existant (non annulé) qui chevaucherait le créneau donné,
 * sur la même date. Utilisé pour avertir avant un double-booking.
 */
export function findOverlappingAppointment(
  appointments: Appointment[],
  date: string,
  startTime: string,
  duration: number,
  excludeId?: string
): Appointment | null {
  const newStart = timeToMinutes(startTime);
  const newEnd = newStart + duration;

  return (
    appointments.find((a) => {
      if (a.id === excludeId) return false;
      if (a.date !== date) return false;
      if (a.status === 'cancelled') return false;

      const existingStart = timeToMinutes(a.startTime);
      const existingEnd = existingStart + a.duration;

      return newStart < existingEnd && existingStart < newEnd;
    }) || null
  );
}
