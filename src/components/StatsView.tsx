import React from 'react';
import {
  Users,
  CreditCard,
  CalendarCheck,
  Activity,
} from 'lucide-react';
import { Appointment, DoctorProfile, Patient } from '../types';
import { getTodayDateString } from '../utils/dateUtils';
import { formatFCFA } from '../utils/currencyUtils';
import { APPOINTMENT_TYPE_CONFIG, PAYMENT_METHOD_LABELS } from '../constants';

interface StatsViewProps {
  appointments: Appointment[];
  patients: Patient[];
  doctor: DoctorProfile;
}

export const StatsView: React.FC<StatsViewProps> = ({
  appointments,
  patients,
  doctor,
}) => {
  const today = getTodayDateString();

  // Basic counts
  const totalAppointments = appointments.length;
  const completedApts = appointments.filter((a) => a.status === 'completed');
  const cancelledApts = appointments.filter((a) => a.status === 'cancelled');
  const noShowApts = appointments.filter((a) => a.status === 'no_show');

  // Taux de présence : seuls les RDV déjà passés (jusqu'à aujourd'hui) et non
  // annulés comptent ; un RDV futur n'est ni honoré ni manqué.
  const attendanceBase = appointments.filter(
    (a) => a.date <= today && a.status !== 'cancelled'
  ).length;
  const attendanceRate = attendanceBase > 0
    ? Math.round((completedApts.filter((a) => a.date <= today).length / attendanceBase) * 100)
    : 100;

  // Revenue metrics
  const totalPaidRevenue = appointments
    .filter((a) => a.isPaid)
    .reduce((sum, a) => sum + (a.fee || 0), 0);

  // Absences exclues : un patient qui n'est pas venu ne doit rien.
  const pendingRevenue = appointments
    .filter((a) => !a.isPaid && a.status !== 'cancelled' && a.status !== 'no_show')
    .reduce((sum, a) => sum + (a.fee || 0), 0);

  const todayRevenue = appointments
    .filter((a) => a.date === today && a.isPaid)
    .reduce((sum, a) => sum + (a.fee || 0), 0);

  // Type breakdown
  const typeCounts: Record<string, number> = {};
  appointments.forEach((a) => {
    typeCounts[a.type] = (typeCounts[a.type] || 0) + 1;
  });

  const typeLabels: Record<string, string> = Object.fromEntries(
    Object.entries(APPOINTMENT_TYPE_CONFIG).map(([type, config]) => [type, config.label])
  );

  // Payment methods breakdown
  const paymentCounts: Record<string, number> = {};
  appointments
    .filter((a) => a.isPaid && a.paymentMethod)
    .forEach((a) => {
      const pm = a.paymentMethod || 'autre';
      paymentCounts[pm] = (paymentCounts[pm] || 0) + 1;
    });

  const paymentLabels: Record<string, string> = PAYMENT_METHOD_LABELS;

  return (
    <div className="space-y-6">
      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Patients */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              File Active Patients
            </span>
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">{patients.length}</div>
          <p className="text-xs text-slate-500 mt-1">Dossiers médicaux enregistrés</p>
        </div>

        {/* Completed Consultations */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Consultations Réalisées
            </span>
            <CalendarCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">{completedApts.length}</div>
          <p className="text-xs text-slate-500 mt-1">Actes médicaux honorés</p>
        </div>

        {/* Revenue Collected */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Honoraires Encaissés
            </span>
            <CreditCard className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="text-2xl lg:text-3xl font-extrabold text-slate-900 mt-2">
            {formatFCFA(totalPaidRevenue)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Dont <span className="font-semibold text-emerald-700">{formatFCFA(todayRevenue)}</span>{' '}
            aujourd'hui
          </p>
        </div>

        {/* Attendance Rate */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Taux d'Assiduité
            </span>
            <Activity className="w-5 h-5 text-teal-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">{attendanceRate}%</div>
          <p className="text-xs text-slate-500 mt-1">
            {noShowApts.length} non honoré(s) • {cancelledApts.length} annulé(s)
          </p>
        </div>
      </div>

      {/* Visual Analytics Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Breakdown by Consultation Type */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              <span>Ventilation par Type de Consultation</span>
            </h3>
            <span className="text-xs text-slate-500 font-semibold">
              {totalAppointments} actes
            </span>
          </div>

          <div className="space-y-3">
            {Object.entries(typeCounts).map(([type, count]) => {
              const percentage = Math.round((count / totalAppointments) * 100);

              return (
                <div key={type} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-800">{typeLabels[type] || type}</span>
                    <span className="text-slate-500 font-semibold">
                      {count} ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment Methods & Financial Health */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-indigo-600" />
              <span>Modes d'Encaissement & Suivi</span>
            </h3>
            <span className="text-xs text-slate-500 font-semibold">
              En attente : {formatFCFA(pendingRevenue)}
            </span>
          </div>

          <div className="space-y-3">
            {Object.keys(paymentCounts).length === 0 ? (
              <p className="text-xs text-slate-400 italic">Aucun règlement enregistré.</p>
            ) : (
              Object.entries(paymentCounts).map(([method, count]) => {
                const totalPaidCount = Object.values(paymentCounts).reduce((a, b) => a + b, 0);
                const percentage = Math.round((count / (totalPaidCount || 1)) * 100);

                return (
                  <div key={method} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-800">{paymentLabels[method] || method}</span>
                      <span className="text-slate-500 font-semibold">
                        {count} règlement(s) ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick Summary Box */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5 text-slate-700 mt-4">
            <div className="flex justify-between">
              <span>Tarif de consultation standard :</span>
              <span className="font-bold text-slate-900">{formatFCFA(doctor.consultationFee)}</span>
            </div>
            <div className="flex justify-between">
              <span>Durée moyenne d'une consultation :</span>
              <span className="font-bold text-slate-900">{doctor.defaultDuration} minutes</span>
            </div>
            <div className="flex justify-between">
              <span>Praticien référent :</span>
              <span className="font-bold text-slate-900">{doctor.title} {doctor.name}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
