import React from 'react';
import { Users, Clock, Play, AlertTriangle, UserCheck, XCircle } from 'lucide-react';
import { Appointment, AppointmentStatus, Patient } from '../types';
import { calculateAge, formatTimeFr, getTodayDateString } from '../utils/dateUtils';

interface WaitingRoomViewProps {
  appointments: Appointment[];
  patients: Patient[];
  onStartConsultation: (appointment: Appointment) => void;
  onUpdateStatus: (appointmentId: string, status: AppointmentStatus) => void;
  onSelectPatient: (patient: Patient) => void;
}

export const WaitingRoomView: React.FC<WaitingRoomViewProps> = ({
  appointments,
  patients,
  onStartConsultation,
  onUpdateStatus,
  onSelectPatient,
}) => {
  const today = getTodayDateString();
  const patientMap = new Map<string, Patient>(patients.map((p) => [p.id, p]));

  // Waiting appointments
  const waitingAppointments = appointments
    .filter((a) => a.date === today && a.status === 'waiting')
    .sort((a, b) => (a.arrivedAt || a.startTime).localeCompare(b.arrivedAt || b.startTime));

  // In progress appointment
  const currentInProgress = appointments.find((a) => a.date === today && a.status === 'in_progress');
  const currentPatient = currentInProgress ? patientMap.get(currentInProgress.patientId) : null;

  // Next scheduled appointments for today not yet arrived
  const upcomingToday = appointments
    .filter((a) => a.date === today && a.status === 'confirmed')
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Currently in consultation */}
        <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-2xs relative overflow-hidden bg-gradient-to-br from-blue-50/50 to-white">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-800 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping" />
              <span>En consultation actuelle</span>
            </span>
            <span className="text-xs font-mono text-blue-600 font-bold bg-blue-100/60 px-2 py-0.5 rounded-md">
              Cabinet Dr
            </span>
          </div>

          {currentInProgress && currentPatient ? (
            <div>
              <h4 className="font-bold text-base text-slate-900">
                {currentPatient.lastName.toUpperCase()} {currentPatient.firstName}
              </h4>
              <p className="text-xs text-slate-600 mt-1">{currentInProgress.reason}</p>
              <div className="mt-4 flex items-center justify-between pt-3 border-t border-blue-100/80">
                <span className="text-xs text-slate-500">
                  Débuté à {formatTimeFr(currentInProgress.startTime)}
                </span>
                <button
                  type="button"
                  onClick={() => onStartConsultation(currentInProgress)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  Finaliser la séance
                </button>
              </div>
            </div>
          ) : (
            <div className="py-4 text-center">
              <p className="text-xs text-slate-500 font-medium">
                Aucune consultation en cours actuellement.
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Le praticien est disponible pour appeler le prochain patient.
              </p>
            </div>
          )}
        </div>

        {/* Patients in waiting room */}
        <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-2xs bg-gradient-to-br from-amber-50/40 to-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
              Patients en attente
            </span>
            <Users className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl font-extrabold text-amber-700">{waitingAppointments.length}</div>
          <p className="text-xs text-slate-500 mt-1">
            {waitingAppointments.length === 0
              ? 'La salle d\'attente est calme et vide.'
              : 'Patients actuellement assis en salle d\'attente.'}
          </p>
        </div>

        {/* Remaining today */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Reste à venir aujourd'hui
            </span>
            <Clock className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{upcomingToday.length}</div>
          <p className="text-xs text-slate-500 mt-1">
            Rendez-vous programmés attendant l'arrivée du patient.
          </p>
        </div>
      </div>

      {/* Main List: Patients in Waiting Room */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              File d'attente active ({waitingAppointments.length} patient{waitingAppointments.length > 1 ? 's' : ''})
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">Ordre d'arrivée en salle</span>
        </div>

        {waitingAppointments.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <UserCheck className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">Aucun patient en salle d'attente</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Dès qu'un patient arrive au cabinet, marquez son rendez-vous comme « Arrivé en salle »
              dans l'agenda ou ci-dessous.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {waitingAppointments.map((apt, index) => {
              const patient = patientMap.get(apt.patientId);
              if (!patient) return null;

              const age = calculateAge(patient.birthDate);

              return (
                <div
                  key={apt.id}
                  className="p-5 flex flex-wrap items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors"
                >
                  <div className="flex items-center gap-4 min-w-[260px] flex-1">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-sm">
                      #{index + 1}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onSelectPatient(patient)}
                          className="font-bold text-base text-slate-900 hover:text-blue-600 hover:underline text-left cursor-pointer"
                        >
                          {patient.lastName.toUpperCase()} {patient.firstName}
                        </button>
                        <span className="text-xs text-slate-500">({age} ans)</span>
                        {patient.allergies.length > 0 && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                            <AlertTriangle className="w-3 h-3" />
                            Allergique
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 mt-1">
                        <span className="font-semibold text-slate-800">{apt.reason}</span>
                      </p>

                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1.5 font-medium">
                        <span>Créneau initial : {formatTimeFr(apt.startTime)}</span>
                        <span>•</span>
                        <span className="text-amber-700 font-bold">
                          Arrivé à {formatTimeFr(apt.arrivedAt || apt.startTime)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onStartConsultation(apt)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs shadow-blue-500/20 transition-all cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Appeler en consultation</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onUpdateStatus(apt.id, 'cancelled')}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Annuler / Défection"
                      aria-label="Annuler le rendez-vous ou marquer comme défection"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Arrival check-in from upcoming scheduled appointments today */}
      {upcomingToday.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
            Enregistrement rapide des arrivées prévues aujourd'hui
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {upcomingToday.map((apt) => {
              const patient = patientMap.get(apt.patientId);

              return (
                <div
                  key={apt.id}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-900 block">
                      {formatTimeFr(apt.startTime)} - {patient ? `${patient.lastName} ${patient.firstName}` : 'Patient'}
                    </span>
                    <span className="text-[11px] text-slate-500 truncate block max-w-[180px]">
                      {apt.reason}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onUpdateStatus(apt.id, 'waiting')}
                    className="px-2.5 py-1.5 bg-white border border-slate-300 hover:border-amber-400 hover:bg-amber-50 hover:text-amber-800 text-slate-700 font-semibold rounded-lg text-xs transition-colors cursor-pointer shadow-2xs"
                  >
                    Arrivé !
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
