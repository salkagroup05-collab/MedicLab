import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  Check,
  CheckCircle2,
  AlertCircle,
  Play,
  XCircle,
  FileText,
  Search,
  MessageCircle,
} from 'lucide-react';
import {
  Appointment,
  AppointmentStatus,
  DoctorProfile,
  Patient,
} from '../types';
import {
  formatDateFr,
  formatDateShortFr,
  formatTimeFr,
  generateHourSlots,
  getTodayDateString,
  getWeekDays,
  isSameDay,
} from '../utils/dateUtils';
import { getApproachingAppointmentsData } from '../utils/whatsappUtils';
import { formatFCFA } from '../utils/currencyUtils';
import { APPOINTMENT_STATUS_CONFIG as STATUS_CONFIG, APPOINTMENT_TYPE_CONFIG as TYPE_CONFIG } from '../constants';

type AgendaMode = 'semaine' | 'jour' | 'mois' | 'liste';

// Icône distincte par statut : la pastille de couleur seule ne suffit pas à distinguer les
// statuts pour les utilisateurs daltoniens (WCAG 1.4.1) — la forme de l'icône sert de repère
// indépendant de la couleur.
const STATUS_ICONS: Record<AppointmentStatus, React.ComponentType<{ className?: string }>> = {
  confirmed: Check,
  waiting: Clock,
  in_progress: Play,
  completed: CheckCircle2,
  cancelled: XCircle,
  no_show: AlertCircle,
};

interface AgendaViewProps {
  appointments: Appointment[];
  patients: Patient[];
  doctor: DoctorProfile;
  onSelectAppointment: (appointment: Appointment) => void;
  onNewAppointmentSlot: (date: string, time: string) => void;
  onUpdateStatus: (appointmentId: string, newStatus: AppointmentStatus) => void;
  onStartConsultation: (appointment: Appointment) => void;
  onOpenWhatsAppReminders?: (appointmentId?: string) => void;
}

export const AgendaView: React.FC<AgendaViewProps> = ({
  appointments,
  patients,
  onSelectAppointment,
  onNewAppointmentSlot,
  onUpdateStatus,
  onStartConsultation,
  onOpenWhatsAppReminders,
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<AgendaMode>('jour');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const patientMap = useMemo(
    () => new Map<string, Patient>(patients.map((p) => [p.id, p])),
    [patients]
  );
  const approachingData = getApproachingAppointmentsData(appointments, patients, getTodayDateString());

  // Navigation handlers
  const handlePrev = () => {
    const nextDate = new Date(currentDate);
    if (viewMode === 'jour') nextDate.setDate(nextDate.getDate() - 1);
    else if (viewMode === 'semaine') nextDate.setDate(nextDate.getDate() - 7);
    else if (viewMode === 'mois') nextDate.setMonth(nextDate.getMonth() - 1);
    setCurrentDate(nextDate);
  };

  const handleNext = () => {
    const nextDate = new Date(currentDate);
    if (viewMode === 'jour') nextDate.setDate(nextDate.getDate() + 1);
    else if (viewMode === 'semaine') nextDate.setDate(nextDate.getDate() + 7);
    else if (viewMode === 'mois') nextDate.setMonth(nextDate.getMonth() + 1);
    setCurrentDate(nextDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const currentDateString = currentDate.toISOString().split('T')[0];

  // Filter appointments
  const filteredAppointments = useMemo(
    () =>
      appointments.filter((apt) => {
        if (selectedTypeFilter !== 'all' && apt.type !== selectedTypeFilter) return false;
        if (selectedStatusFilter !== 'all' && apt.status !== selectedStatusFilter) return false;
        if (searchQuery.trim()) {
          const patient = patientMap.get(apt.patientId);
          const searchTarget = `${patient?.lastName} ${patient?.firstName} ${apt.reason}`.toLowerCase();
          if (!searchTarget.includes(searchQuery.toLowerCase())) return false;
        }
        return true;
      }),
    [appointments, patientMap, selectedTypeFilter, selectedStatusFilter, searchQuery]
  );

  const hourSlots = useMemo(() => generateHourSlots(8, 19), []);
  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate]);

  const monthGridCells = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const offset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

    const cells = [];
    for (let i = 0; i < offset; i++) {
      cells.push(<div key={`empty-${i}`} className="bg-slate-50/40 min-h-[90px] p-1.5" />);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}:${String(d).padStart(
        2,
        '0'
      )}`.replace(':', '-');
      const isToday = isSameDay(dateStr, getTodayDateString());
      const dayApts = filteredAppointments.filter((a) => a.date === dateStr);

      cells.push(
        <div
          key={dateStr}
          onClick={() => {
            setCurrentDate(new Date(dateStr + 'T00:00:00'));
            setViewMode('jour');
          }}
          className={`bg-white min-h-[90px] p-2 hover:bg-blue-50/40 cursor-pointer transition-colors flex flex-col justify-between ${
            isToday ? 'ring-2 ring-blue-500 font-bold' : ''
          }`}
        >
          <div className="flex justify-between items-center text-xs">
            <span
              className={`w-6 h-6 flex items-center justify-center rounded-full ${
                isToday ? 'bg-blue-600 text-white' : 'text-slate-800'
              }`}
            >
              {d}
            </span>
            {dayApts.length > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {dayApts.length}
              </span>
            )}
          </div>

          <div className="space-y-1 my-1">
            {dayApts.slice(0, 2).map((a) => {
              const pat = patientMap.get(a.patientId);
              return (
                <div key={a.id} className="text-[10px] truncate px-1 py-0.5 rounded bg-blue-50 text-blue-800">
                  {a.startTime} {pat?.lastName}
                </div>
              );
            })}
            {dayApts.length > 2 && (
              <div className="text-[9px] text-slate-500 font-semibold pl-1">
                +{dayApts.length - 2} autres...
              </div>
            )}
          </div>
        </div>
      );
    }

    return cells;
  }, [currentDate, filteredAppointments, patientMap]);

  return (
    <div className="space-y-4">
      {/* WhatsApp Approaching Reminders Banner */}
      {approachingData.tomorrowPendingCount > 0 && (
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 p-3 sm:p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-emerald-950">
                  Rappels WhatsApp à l'approche des rendez-vous
                </h4>
                <span className="bg-emerald-200/80 text-emerald-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                  {approachingData.tomorrowPendingCount} à envoyer pour demain
                </span>
              </div>
              <p className="text-xs text-emerald-800/90 mt-0.5">
                Envoyez en un clic les messages personnalisés pré-remplis à vos patients pour confirmer leur venue et éviter les absences.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenWhatsAppReminders && onOpenWhatsAppReminders()}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all shrink-0 flex items-center gap-1.5 cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Ouvrir les rappels WhatsApp</span>
          </button>
        </div>
      )}

      {/* Top Toolbar: Date Navigation + View Switcher + Quick Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        {/* Date Navigation */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToday}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
          >
            Aujourd'hui
          </button>
          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={handlePrev}
              className="p-1.5 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
              title="Précédent"
              aria-label="Période précédente"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="p-1.5 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
              title="Suivant"
              aria-label="Période suivante"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <span className="text-sm sm:text-base font-bold text-slate-800 capitalize ml-1">
            {viewMode === 'jour' && formatDateFr(currentDateString)}
            {viewMode === 'semaine' && (
              <>
                Semaine du {formatDateShortFr(weekDays[0].toISOString().split('T')[0])} au{' '}
                {formatDateShortFr(weekDays[6].toISOString().split('T')[0])}
              </>
            )}
            {viewMode === 'mois' &&
              new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(currentDate)}
            {viewMode === 'liste' && 'Tous les rendez-vous'}
          </span>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1 text-xs font-medium">
          <button
            type="button"
            id="view-mode-jour"
            onClick={() => setViewMode('jour')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              viewMode === 'jour' ? 'bg-white text-blue-700 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Jour
          </button>
          <button
            type="button"
            id="view-mode-semaine"
            onClick={() => setViewMode('semaine')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              viewMode === 'semaine' ? 'bg-white text-blue-700 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Semaine
          </button>
          <button
            type="button"
            id="view-mode-mois"
            onClick={() => setViewMode('mois')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              viewMode === 'mois' ? 'bg-white text-blue-700 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Mois
          </button>
          <button
            type="button"
            id="view-mode-liste"
            onClick={() => setViewMode('liste')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              viewMode === 'liste' ? 'bg-white text-blue-700 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Liste
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher un patient, un motif..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Type :</span>
            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">Tous types</option>
              <option value="consultation">Consultation</option>
              <option value="suivi">Suivi</option>
              <option value="urgence">Urgence</option>
              <option value="teleconsultation">Téléconsultation</option>
              <option value="bilan">Bilan</option>
              <option value="vaccination">Vaccination</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Statut :</span>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">Tous statuts</option>
              <option value="confirmed">Confirmé</option>
              <option value="waiting">En salle d'attente</option>
              <option value="in_progress">En consultation</option>
              <option value="completed">Terminé</option>
              <option value="cancelled">Annulé</option>
            </select>
          </div>

          {/* Quick WhatsApp Reminder trigger */}
          <button
            type="button"
            onClick={() => onOpenWhatsAppReminders && onOpenWhatsAppReminders()}
            className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg font-semibold transition-colors cursor-pointer text-xs"
            title="Ouvrir le centre de rappels WhatsApp"
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>Rappels WhatsApp</span>
            {approachingData.pendingRemindersCount > 0 && (
              <span className="bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {approachingData.pendingRemindersCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* VIEW MODE: JOUR (DAY VIEW) */}
      {viewMode === 'jour' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-slate-900 text-sm">
                Planning du {formatDateFr(currentDateString)}
              </h3>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              {filteredAppointments.filter((a) => a.date === currentDateString).length} rendez-vous
              programmés
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {hourSlots.map((slot) => {
              const slotAppointments = filteredAppointments.filter(
                (a) => a.date === currentDateString && a.startTime === slot
              );

              return (
                <div key={slot} className="flex min-h-[64px] group hover:bg-slate-50/50 transition-colors">
                  {/* Time label */}
                  <div className="w-20 sm:w-24 p-3 border-r border-slate-100 text-xs font-semibold text-slate-500 flex flex-col items-center justify-start bg-slate-50/30">
                    <span>{formatTimeFr(slot)}</span>
                  </div>

                  {/* Slot content */}
                  <div className="flex-1 p-2 flex flex-col gap-2 relative">
                    {slotAppointments.length > 0 ? (
                      slotAppointments.map((apt) => {
                        const patient = patientMap.get(apt.patientId);
                        const typeInfo = TYPE_CONFIG[apt.type];
                        const statusInfo = STATUS_CONFIG[apt.status];

                        return (
                          <div
                            key={apt.id}
                            className={`p-3 rounded-xl border ${typeInfo.border} ${typeInfo.bg} shadow-2xs flex flex-wrap items-center justify-between gap-3 transition-all hover:shadow-xs`}
                          >
                            <div
                              onClick={() => onSelectAppointment(apt)}
                              className="flex items-center gap-3 cursor-pointer flex-1 min-w-[200px]"
                            >
                              <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-800 text-xs shadow-2xs">
                                {patient ? `${patient.lastName[0]}${patient.firstName[0]}` : '?'}
                              </div>

                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-sm text-slate-900">
                                    {patient
                                      ? `${patient.lastName.toUpperCase()} ${patient.firstName}`
                                      : 'Patient inconnu'}
                                  </span>
                                  <span
                                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${statusInfo.badgeClass}`}
                                  >
                                    {statusInfo.label}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-600 mt-0.5">
                                  <span className="font-medium text-slate-800">{typeInfo.label}</span> •{' '}
                                  {apt.reason}
                                </p>
                              </div>
                            </div>

                            {/* Status Quick Action Buttons */}
                            <div className="flex items-center gap-1.5">
                              {/* WhatsApp Reminder Button */}
                              {patient && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenWhatsAppReminders?.(apt.id);
                                  }}
                                  className={`px-2 py-1 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors cursor-pointer border ${
                                    apt.whatsappReminderSent
                                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                                      : 'bg-white hover:bg-emerald-50 text-emerald-700 border-emerald-300'
                                  }`}
                                  title={
                                    apt.whatsappReminderSent
                                      ? `Rappel WhatsApp envoyé le ${
                                          apt.whatsappReminderSentAt
                                            ? new Date(apt.whatsappReminderSentAt).toLocaleDateString()
                                            : ''
                                        }`
                                      : 'Envoyer un rappel WhatsApp'
                                  }
                                  aria-label={apt.whatsappReminderSent ? 'Rappel WhatsApp envoyé' : 'Envoyer un rappel WhatsApp'}
                                >
                                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                                  <span className="hidden sm:inline">
                                    {apt.whatsappReminderSent ? 'Rappel ✓' : 'Rappel WA'}
                                  </span>
                                </button>
                              )}

                              {apt.status === 'confirmed' && (
                                <button
                                  type="button"
                                  onClick={() => onUpdateStatus(apt.id, 'waiting')}
                                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition-colors cursor-pointer shadow-2xs"
                                  title="Marquer comme arrivé en salle d'attente"
                                >
                                  Arrivé en salle
                                </button>
                              )}

                              {(apt.status === 'waiting' || apt.status === 'confirmed') && (
                                <button
                                  type="button"
                                  onClick={() => onStartConsultation(apt)}
                                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                                  title="Démarrer la consultation médicale"
                                >
                                  <Play className="w-3 h-3 fill-current" />
                                  <span>Consulter</span>
                                </button>
                              )}

                              {apt.status === 'in_progress' && (
                                <button
                                  type="button"
                                  onClick={() => onStartConsultation(apt)}
                                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                                  title="Continuer et finaliser la consultation"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>En consultation (Finaliser)</span>
                                </button>
                              )}

                              {apt.status === 'completed' && (
                                <button
                                  type="button"
                                  onClick={() => onStartConsultation(apt)}
                                  className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
                                  title="Consulter le dossier médical de ce RDV"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                  <span>Voir fiche</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <button
                        type="button"
                        onClick={() => onNewAppointmentSlot(currentDateString, slot)}
                        className="w-full h-full min-h-[42px] border border-dashed border-transparent hover:border-blue-300 hover:bg-blue-50/50 rounded-lg text-xs text-blue-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer font-medium"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Nouveau rendez-vous à {formatTimeFr(slot)}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW MODE: SEMAINE (WEEK VIEW) */}
      {viewMode === 'semaine' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-x-auto">
          <div className="min-w-[760px]">
            {/* Week Header Row */}
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
              {weekDays.map((day) => {
                const dayStr = day.toISOString().split('T')[0];
                const isToday = isSameDay(day, new Date());
                const dayName = new Intl.DateTimeFormat('fr-FR', { weekday: 'short' }).format(day);
                const dayNumber = day.getDate();

                return (
                  <div
                    key={dayStr}
                    onClick={() => {
                      setCurrentDate(day);
                      setViewMode('jour');
                    }}
                    className={`p-3 text-center border-r border-slate-200 last:border-r-0 cursor-pointer hover:bg-slate-100 transition-colors ${
                      isToday ? 'bg-blue-50/70 font-bold' : ''
                    }`}
                  >
                    <p className="text-xs uppercase text-slate-500">{dayName}</p>
                    <p
                      className={`text-base font-bold mt-0.5 ${
                        isToday ? 'text-blue-600' : 'text-slate-800'
                      }`}
                    >
                      {dayNumber}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Week Days Columns */}
            <div className="grid grid-cols-7 divide-x divide-slate-200 min-h-[500px]">
              {weekDays.map((day) => {
                const dayStr = day.toISOString().split('T')[0];
                const dayApts = filteredAppointments
                  .filter((a) => a.date === dayStr)
                  .sort((a, b) => a.startTime.localeCompare(b.startTime));

                return (
                  <div key={dayStr} className="p-2 space-y-2 bg-white flex flex-col">
                    <div className="flex-1 space-y-2">
                      {dayApts.map((apt) => {
                        const patient = patientMap.get(apt.patientId);
                        const typeInfo = TYPE_CONFIG[apt.type];
                        const statusInfo = STATUS_CONFIG[apt.status];

                        return (
                          <div
                            key={apt.id}
                            onClick={() => onSelectAppointment(apt)}
                            className={`p-2 rounded-lg border ${typeInfo.border} ${typeInfo.bg} shadow-2xs hover:shadow-xs transition-all cursor-pointer text-xs`}
                          >
                            <div className="flex items-center justify-between font-bold">
                              <span>{formatTimeFr(apt.startTime)}</span>
                              {(() => {
                                const StatusIcon = STATUS_ICONS[apt.status];
                                return (
                                  <span title={statusInfo.label} aria-label={statusInfo.label}>
                                    <StatusIcon className={`w-3 h-3 ${statusInfo.text}`} />
                                  </span>
                                );
                              })()}
                            </div>
                            <p className="font-semibold text-slate-900 mt-1 truncate">
                              {patient ? `${patient.lastName} ${patient.firstName[0]}.` : 'Patient'}
                            </p>
                            <p className="text-[10px] text-slate-600 truncate mt-0.5">{apt.reason}</p>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={() => onNewAppointmentSlot(dayStr, '09:00')}
                      className="w-full py-1.5 border border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-[11px] text-slate-500 hover:text-blue-700 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Ajouter RDV</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE: MOIS (MONTH VIEW) */}
      {viewMode === 'mois' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4">
          <div className="grid grid-cols-7 gap-px bg-slate-200 rounded-lg overflow-hidden border border-slate-200">
            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((d) => (
              <div key={d} className="bg-slate-50 p-2 text-center text-xs font-bold text-slate-600">
                {d}
              </div>
            ))}

            {/* Build calendar days */}
            {monthGridCells}
          </div>
        </div>
      )}

      {/* VIEW MODE: LISTE (LIST VIEW) */}
      {viewMode === 'liste' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Date & Heure</th>
                  <th className="px-4 py-3">Patient</th>
                  <th className="px-4 py-3">Type & Motif</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3">Honoraire</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500 text-sm">
                      Aucun rendez-vous ne correspond aux critères.
                    </td>
                  </tr>
                ) : (
                  filteredAppointments
                    .slice()
                    .sort((a, b) => `${b.date} ${b.startTime}`.localeCompare(`${a.date} ${a.startTime}`))
                    .map((apt) => {
                      const patient = patientMap.get(apt.patientId);
                      const typeInfo = TYPE_CONFIG[apt.type];
                      const statusInfo = STATUS_CONFIG[apt.status];

                      return (
                        <tr key={apt.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="font-semibold text-slate-900">
                              {formatDateShortFr(apt.date)}
                            </span>
                            <span className="text-slate-500 ml-2 font-mono">
                              {formatTimeFr(apt.startTime)}
                            </span>
                          </td>

                          <td className="px-4 py-3">
                            <span className="font-bold text-slate-900 block">
                              {patient
                                ? `${patient.lastName.toUpperCase()} ${patient.firstName}`
                                : 'Patient inconnu'}
                            </span>
                            <span className="text-[11px] text-slate-500">{patient?.phone}</span>
                          </td>

                          <td className="px-4 py-3">
                            <span
                              className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md border ${typeInfo.border} ${typeInfo.bg} ${typeInfo.text} mb-1`}
                            >
                              {typeInfo.label}
                            </span>
                            <p className="text-slate-700 truncate max-w-xs">{apt.reason}</p>
                          </td>

                          <td className="px-4 py-3 whitespace-nowrap">
                            <span
                              className={`text-[11px] px-2.5 py-1 rounded-full font-bold border ${statusInfo.badgeClass}`}
                            >
                              {statusInfo.label}
                            </span>
                          </td>

                          <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-700">
                            {formatFCFA(apt.fee)}
                            {apt.isPaid && (
                              <span className="ml-2 text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">
                                Payé
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-3 text-right whitespace-nowrap space-x-2">
                            {patient && (
                              <button
                                type="button"
                                onClick={() => onOpenWhatsAppReminders && onOpenWhatsAppReminders(apt.id)}
                                className={`px-2 py-1 text-xs rounded-md font-semibold inline-flex items-center gap-1 cursor-pointer border ${
                                  apt.whatsappReminderSent
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : 'bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50'
                                }`}
                                title={apt.whatsappReminderSent ? "Rappel WhatsApp envoyé" : "Envoyer rappel WhatsApp"}
                              >
                                <MessageCircle className="w-3 h-3 text-emerald-600" />
                                <span>{apt.whatsappReminderSent ? 'Rappel ✓' : 'Rappel WA'}</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => onSelectAppointment(apt)}
                              className="px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md font-medium cursor-pointer"
                            >
                              Détails
                            </button>
                            {(apt.status === 'waiting' || apt.status === 'confirmed') && (
                              <button
                                type="button"
                                onClick={() => onStartConsultation(apt)}
                                className="px-2.5 py-1 text-white bg-blue-600 hover:bg-blue-700 rounded-md font-bold cursor-pointer"
                              >
                                Consulter
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
