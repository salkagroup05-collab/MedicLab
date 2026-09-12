import React, { useState } from 'react';
import {
  Calendar,
  CreditCard,
  CheckCircle2,
  Clock,
  Plus,
  Edit3,
  ArrowUpDown,
  Wallet,
  Check,
  X,
} from 'lucide-react';
import { Appointment, DoctorProfile, Patient, PaymentMethod } from '../types';
import { formatDateFr, formatDateShortFr, formatTimeFr, getTodayDateString } from '../utils/dateUtils';
import { formatFCFA } from '../utils/currencyUtils';
import {
  APPOINTMENT_STATUS_CONFIG as STATUS_CONFIG,
  APPOINTMENT_TYPE_CONFIG as TYPE_CONFIG,
  PAYMENT_METHODS,
} from '../constants';
import { Modal } from './shared/Modal';

interface PatientAppointmentsTableProps {
  appointments: Appointment[];
  patient: Patient;
  doctor: DoctorProfile;
  onNewAppointment?: () => void;
  onEditAppointment?: (apt: Appointment) => void;
  onTogglePayment?: (aptId: string, isPaid: boolean, paymentMethod?: PaymentMethod) => void;
}

export const PatientAppointmentsTable: React.FC<PatientAppointmentsTableProps> = ({
  appointments,
  patient,
  doctor,
  onNewAppointment,
  onEditAppointment,
  onTogglePayment,
}) => {
  const [filter, setFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [sortAsc, setSortAsc] = useState(false); // Default: most recent first
  const [activePaymentModalApt, setActivePaymentModalApt] = useState<Appointment | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('especes');

  const today = getTodayDateString();

  // Financial Metrics
  const totalBilled = appointments.reduce((sum, a) => sum + (a.fee || 0), 0);
  const totalPaid = appointments
    .filter((a) => a.isPaid)
    .reduce((sum, a) => sum + (a.fee || 0), 0);
  const totalRemaining = appointments
    .filter((a) => !a.isPaid && a.status !== 'cancelled')
    .reduce((sum, a) => sum + (a.fee || 0), 0);

  const recoveryRate = totalBilled > 0 ? Math.round((totalPaid / totalBilled) * 100) : 100;

  // Filter & Sort
  const filteredAppointments = appointments
    .filter((apt) => {
      if (filter === 'paid') return apt.isPaid;
      if (filter === 'unpaid') return !apt.isPaid && apt.status !== 'cancelled';
      return true;
    })
    .sort((a, b) => {
      const timeA = new Date(`${a.date}T${a.startTime || '00:00'}`).getTime();
      const timeB = new Date(`${b.date}T${b.startTime || '00:00'}`).getTime();
      return sortAsc ? timeA - timeB : timeB - timeA;
    });

  const handleOpenPaymentModal = (apt: Appointment) => {
    setActivePaymentModalApt(apt);
    setSelectedMethod(apt.paymentMethod || 'especes');
  };

  const handleConfirmPayment = () => {
    if (activePaymentModalApt && onTogglePayment) {
      onTogglePayment(activePaymentModalApt.id, true, selectedMethod);
    }
    setActivePaymentModalApt(null);
  };

  const handleMarkAsUnpaid = () => {
    if (activePaymentModalApt && onTogglePayment) {
      onTogglePayment(activePaymentModalApt.id, false);
    }
    setActivePaymentModalApt(null);
  };

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900">
            Historique des Rendez-vous & Paiements
          </h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200">
            {appointments.length}
          </span>
        </div>

        {onNewAppointment && (
          <button
            type="button"
            onClick={onNewAppointment}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nouveau rendez-vous</span>
          </button>
        )}
      </div>

      {/* KPI Financial Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Billed */}
        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Total Facturé
          </span>
          <div className="text-base sm:text-lg font-extrabold text-slate-900 mt-1">
            {formatFCFA(totalBilled)}
          </div>
          <span className="text-[10px] text-slate-500">
            {appointments.length} rendez-vous
          </span>
        </div>

        {/* Total Paid */}
        <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Total Réglé
          </span>
          <div className="text-base sm:text-lg font-extrabold text-emerald-700 mt-1">
            {formatFCFA(totalPaid)}
          </div>
          <span className="text-[10px] text-emerald-600 font-medium">
            {appointments.filter((a) => a.isPaid).length} acte(s) payé(s)
          </span>
        </div>

        {/* Total Remaining */}
        <div
          className={`p-3 rounded-xl border shadow-2xs ${
            totalRemaining > 0
              ? 'bg-amber-50/60 border-amber-200'
              : 'bg-slate-50 border-slate-200'
          }`}
        >
          <span
            className={`text-[10px] font-bold uppercase tracking-wider block flex items-center gap-1 ${
              totalRemaining > 0 ? 'text-amber-800' : 'text-slate-500'
            }`}
          >
            <Clock className="w-3 h-3 text-amber-600" />
            Solde en Attente
          </span>
          <div
            className={`text-base sm:text-lg font-extrabold mt-1 ${
              totalRemaining > 0 ? 'text-amber-700' : 'text-slate-600'
            }`}
          >
            {formatFCFA(totalRemaining)}
          </div>
          <span className="text-[10px] text-slate-500">
            {appointments.filter((a) => !a.isPaid && a.status !== 'cancelled').length} en attente
          </span>
        </div>

        {/* Recovery Rate */}
        <div className="p-3 bg-blue-50/40 rounded-xl border border-blue-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 block">
            Taux Recouvrement
          </span>
          <div className="text-base sm:text-lg font-extrabold text-blue-700 mt-1">
            {recoveryRate}%
          </div>
          <div className="w-full bg-blue-100 rounded-full h-1.5 mt-1.5 overflow-hidden">
            <div
              className="bg-blue-600 h-1.5 rounded-full"
              style={{ width: `${Math.min(recoveryRate, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filter and Sorting Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
              filter === 'all'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tous ({appointments.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('paid')}
            className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
              filter === 'paid'
                ? 'bg-white text-emerald-700 shadow-2xs'
                : 'text-slate-600 hover:text-emerald-700'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Payés ({appointments.filter((a) => a.isPaid).length})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilter('unpaid')}
            className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
              filter === 'unpaid'
                ? 'bg-white text-amber-700 shadow-2xs'
                : 'text-slate-600 hover:text-amber-700'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>En attente ({appointments.filter((a) => !a.isPaid && a.status !== 'cancelled').length})</span>
          </button>
        </div>

        {/* Sort Order Toggle */}
        <button
          type="button"
          onClick={() => setSortAsc(!sortAsc)}
          className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer shadow-2xs"
          title="Changer l'ordre chronologique"
        >
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
          <span>{sortAsc ? 'Du plus ancien au plus récent' : 'Du plus récent au plus ancien'}</span>
        </button>
      </div>

      {/* Main Table */}
      {filteredAppointments.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-xl border border-dashed border-slate-200 text-slate-500 text-xs space-y-2">
          <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="font-semibold text-slate-700">
            {filter === 'all'
              ? 'Aucun rendez-vous enregistré pour ce patient.'
              : filter === 'paid'
              ? 'Aucun rendez-vous payé répertorié.'
              : 'Aucun paiement en attente. Tous les rendez-vous honorés sont réglés !'}
          </p>
          {filter === 'all' && onNewAppointment && (
            <button
              type="button"
              onClick={onNewAppointment}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 font-semibold transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Programmer le premier rendez-vous</span>
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Date & Horaire</th>
                  <th className="py-3 px-4">Type & Motif</th>
                  <th className="py-3 px-4">Statut RDV</th>
                  <th className="py-3 px-4">Tarif</th>
                  <th className="py-3 px-4">Statut Paiement</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAppointments.map((apt) => {
                  const statusInfo = STATUS_CONFIG[apt.status] || STATUS_CONFIG.confirmed;
                  const typeInfo = TYPE_CONFIG[apt.type] || TYPE_CONFIG.consultation;
                  const isCurrentDay = apt.date === today;

                  return (
                    <tr
                      key={apt.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        apt.status === 'cancelled' ? 'opacity-60 bg-slate-50/40' : ''
                      }`}
                    >
                      {/* Date & Time */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 flex items-center gap-1.5">
                            {formatDateShortFr(apt.date)}
                            {isCurrentDay && (
                              <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 text-[9px] font-bold">
                                Aujourd'hui
                              </span>
                            )}
                          </span>
                          <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {formatTimeFr(apt.startTime)} ({apt.duration} min)
                          </span>
                        </div>
                      </td>

                      {/* Type & Reason */}
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold ${typeInfo.bg} ${typeInfo.text}`}
                          >
                            {typeInfo.label}
                          </span>
                          <p className="font-medium text-slate-800 text-[11px] max-w-xs truncate">
                            {apt.reason || 'Consultation générale'}
                          </p>
                        </div>
                      </td>

                      {/* Appointment Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotColor}`} />
                          {statusInfo.label}
                        </span>
                      </td>

                      {/* Fee */}
                      <td className="py-3 px-4 whitespace-nowrap font-bold text-slate-900">
                        {formatFCFA(apt.fee || doctor.consultationFee)}
                      </td>

                      {/* Payment Status Badge */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {apt.isPaid ? (
                          <div className="inline-flex flex-col">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold shadow-2xs">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Réglé</span>
                            </span>
                            {apt.paymentMethod && (
                              <span className="text-[10px] text-slate-500 mt-0.5 ml-1">
                                {PAYMENT_METHODS.find((m) => m.value === apt.paymentMethod)?.label ||
                                  apt.paymentMethod}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="inline-flex flex-col">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border shadow-2xs ${
                                apt.status === 'cancelled'
                                  ? 'bg-slate-100 text-slate-500 border-slate-200'
                                  : 'bg-amber-50 text-amber-800 border-amber-200'
                              }`}
                            >
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              <span>{apt.status === 'cancelled' ? 'Non dû' : 'En attente'}</span>
                            </span>
                            {apt.status !== 'cancelled' && (
                              <span className="text-[10px] text-amber-700 font-medium mt-0.5 ml-1">
                                À encaisser
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 whitespace-nowrap text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {/* Quick Payment Status Toggle Button */}
                          {onTogglePayment && (
                            <button
                              type="button"
                              onClick={() => handleOpenPaymentModal(apt)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer border shadow-2xs ${
                                apt.isPaid
                                  ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600'
                              }`}
                              title={
                                apt.isPaid
                                  ? 'Modifier le moyen de paiement ou annuler'
                                  : 'Encaisser la consultation'
                              }
                            >
                              <Wallet className="w-3 h-3" />
                              <span>{apt.isPaid ? 'Règlement' : 'Encaisser'}</span>
                            </button>
                          )}

                          {/* Edit Appointment */}
                          {onEditAppointment && (
                            <button
                              type="button"
                              onClick={() => onEditAppointment(apt)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="Modifier les détails du rendez-vous"
                              aria-label="Modifier les détails du rendez-vous"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick Payment Management Modal */}
      {activePaymentModalApt && (
        <Modal
          isOpen={Boolean(activePaymentModalApt)}
          onClose={() => setActivePaymentModalApt(null)}
          title={`Gestion du règlement - ${patient.lastName} ${patient.firstName}`}
          maxWidthClassName="max-w-md"
          scrollableBody={false}
        >
            {/* Modal Header */}
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-600/30 text-emerald-400 border border-emerald-500/30">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold">Gestion du Règlement</h4>
                  <p className="text-[11px] text-slate-400">
                    RDV du {formatDateFr(activePaymentModalApt.date)} à {formatTimeFr(activePaymentModalApt.startTime)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActivePaymentModalApt(null)}
                aria-label="Fermer"
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs">
              {/* Patient & Amount Summary */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                <div>
                  <span className="text-slate-500 text-[11px] block">Patient</span>
                  <span className="font-bold text-slate-900">
                    {patient.lastName.toUpperCase()} {patient.firstName}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 text-[11px] block">Montant à régler</span>
                  <span className="font-extrabold text-base text-blue-700">
                    {formatFCFA(activePaymentModalApt.fee || doctor.consultationFee)}
                  </span>
                </div>
              </div>

              {/* Status Selector */}
              <div className="space-y-2">
                <label className="font-bold text-slate-800 block">Moyen de règlement</label>
                <div className="grid grid-cols-1 gap-1.5">
                  {PAYMENT_METHODS.map((method) => {
                    const isSelected = selectedMethod === method.value;
                    return (
                      <button
                        key={method.value}
                        type="button"
                        onClick={() => setSelectedMethod(method.value)}
                        className={`w-full py-2.5 px-3 rounded-xl border text-left flex items-center justify-between transition-colors cursor-pointer ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900 font-bold'
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isSelected ? 'bg-emerald-500' : 'bg-slate-300'
                            }`}
                          />
                          <span>{method.label}</span>
                        </span>
                        {isSelected && <Check className="w-4 h-4 text-emerald-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Mark as Unpaid Option (if already paid) */}
              {activePaymentModalApt.isPaid && (
                <div className="pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleMarkAsUnpaid}
                    className="w-full py-2 text-center text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  >
                    Marquer ce rendez-vous comme non réglé (en attente)
                  </button>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setActivePaymentModalApt(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmPayment}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Confirmer le paiement</span>
              </button>
            </div>
        </Modal>
      )}
    </div>
  );
};
