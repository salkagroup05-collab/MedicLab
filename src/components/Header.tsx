import React from 'react';
import { Clock, Plus, Settings, Stethoscope, Users, MessageCircle } from 'lucide-react';
import { DoctorProfile } from '../types';

interface HeaderProps {
  doctor: DoctorProfile;
  todayAppointmentsCount: number;
  waitingPatientsCount: number;
  pendingRemindersCount: number;
  onNewAppointment: () => void;
  onOpenSettings: () => void;
  onNavigateWaitingRoom: () => void;
  onOpenWhatsAppReminders: () => void;
  currentDateFormatted: string;
}

export const Header: React.FC<HeaderProps> = ({
  doctor,
  todayAppointmentsCount,
  waitingPatientsCount,
  pendingRemindersCount,
  onNewAppointment,
  onOpenSettings,
  onNavigateWaitingRoom,
  onOpenWhatsAppReminders,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3 sm:gap-6 min-w-0">
          {/* LEFT: Logo & Doctor Info */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs shrink-0">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-base sm:text-lg leading-none tracking-tight whitespace-nowrap">
                  MédicLab
                </span>
                <span className="hidden lg:inline-flex items-center px-2 py-0.5 text-[11px] font-medium text-blue-700 bg-blue-50 rounded-md border border-blue-100 shrink-0">
                  {doctor.specialty}
                </span>
              </div>
              <p
                className="text-xs text-slate-500 font-medium truncate mt-1 max-w-[200px] sm:max-w-[340px] md:max-w-[450px]"
                title={`${doctor.title} ${doctor.name} • ${doctor.city} • ONMS : ${doctor.onms}`}
              >
                <span>{doctor.title} {doctor.name}</span>
                <span className="hidden sm:inline"> • {doctor.city}</span>
                <span className="hidden xl:inline"> • ONMS : {doctor.onms}</span>
              </p>
            </div>
          </div>

          {/* RIGHT: Compact Indicators & Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Waiting Room Alert Pill (only when patients are waiting) */}
            {waitingPatientsCount > 0 && (
              <button
                type="button"
                id="header-waiting-room-btn"
                onClick={onNavigateWaitingRoom}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
                title={`${waitingPatientsCount} patient(s) en salle d'attente`}
                aria-label={`${waitingPatientsCount} patient(s) en salle d'attente`}
              >
                <Users className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">{waitingPatientsCount} en attente</span>
                <span className="sm:hidden">{waitingPatientsCount}</span>
              </button>
            )}

            {/* WhatsApp Reminders Unified Button */}
            <button
              type="button"
              id="header-whatsapp-reminders-btn"
              onClick={onOpenWhatsAppReminders}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border shrink-0 ${
                pendingRemindersCount > 0
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
              title="Gérer les rappels WhatsApp des rendez-vous"
              aria-label="Gérer les rappels WhatsApp des rendez-vous"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="hidden md:inline">Rappels WhatsApp</span>
              {pendingRemindersCount > 0 && (
                <span className="bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none shrink-0">
                  {pendingRemindersCount}
                </span>
              )}
            </button>

            {/* Today Appointments Summary (Visible on large screens) */}
            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium shrink-0">
              <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>{todayAppointmentsCount} RDV</span>
            </div>

            {/* New Appointment Primary Button */}
            <button
              type="button"
              id="header-new-appointment-btn"
              onClick={onNewAppointment}
              className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-xs shadow-blue-500/20 transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Nouveau Rendez-vous</span>
              <span className="sm:hidden">Nouveau</span>
            </button>

            {/* Settings Button */}
            <button
              type="button"
              id="header-settings-btn"
              onClick={onOpenSettings}
              title="Paramètres du cabinet"
              aria-label="Paramètres du cabinet"
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer shrink-0"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
