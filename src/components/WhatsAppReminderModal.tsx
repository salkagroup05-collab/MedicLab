import React, { useState } from 'react';
import {
  X,
  MessageCircle,
  Send,
  Check,
  Clock,
  Calendar,
  AlertTriangle,
  Copy,
  ExternalLink,
  Edit3,
  RefreshCw,
  Phone,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import { Appointment, DoctorProfile, Patient } from '../types';
import {
  DEFAULT_WHATSAPP_TEMPLATE,
  buildReminderMessage,
  getApproachingAppointmentsData,
  getWhatsAppLink,
  openWhatsAppReminder,
  sanitizePhoneNumber,
} from '../utils/whatsappUtils';
import { Modal } from './shared/Modal';

interface WhatsAppReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointments: Appointment[];
  patients: Patient[];
  doctor: DoctorProfile;
  onUpdateAppointmentReminder: (appointmentId: string, sent: boolean, timestamp?: string) => void;
  onSaveDoctorProfile: (profile: DoctorProfile) => void;
  initialSelectedAppointmentId?: string | null;
}

export const WhatsAppReminderModal: React.FC<WhatsAppReminderModalProps> = ({
  isOpen,
  onClose,
  appointments,
  patients,
  doctor,
  onUpdateAppointmentReminder,
  onSaveDoctorProfile,
  initialSelectedAppointmentId,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const approachingData = getApproachingAppointmentsData(appointments, patients, todayStr);

  const [activeTab, setActiveTab] = useState<'demain' | 'aujourdhui' | 'j2' | 'template'>('demain');
  const [editingAppointmentId, setEditingAppointmentId] = useState<string | null>(
    initialSelectedAppointmentId || null
  );
  const [customMessages, setCustomMessages] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Template editor state
  const [templateText, setTemplateText] = useState(
    doctor.whatsappCustomTemplate || DEFAULT_WHATSAPP_TEMPLATE
  );
  const [templateSavedToast, setTemplateSavedToast] = useState(false);

  if (!isOpen) return null;

  const currentGroup = approachingData.grouped.find((g) => g.category === activeTab);

  const handleSendWhatsApp = (appointment: Appointment, patient: Patient) => {
    const customMsg = customMessages[appointment.id];
    const { url, validation } = getWhatsAppLink(appointment, patient, doctor, customMsg);
    if (!validation.isValid) {
      alert(`Le numéro de téléphone de ${patient.firstName} ${patient.lastName} est invalide ou incomplet (indicatif manquant). Veuillez le corriger dans la fiche patient avant d'envoyer le rappel.`);
      return;
    }
    openWhatsAppReminder(url);
    onUpdateAppointmentReminder(appointment.id, true, new Date().toISOString());
  };

  const handleCopyText = (appointment: Appointment, patient: Patient) => {
    const customMsg = customMessages[appointment.id];
    const { message } = getWhatsAppLink(appointment, patient, doctor, customMsg);
    navigator.clipboard.writeText(message);
    setCopiedId(appointment.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveTemplate = () => {
    onSaveDoctorProfile({
      ...doctor,
      whatsappCustomTemplate: templateText,
    });
    setTemplateSavedToast(true);
    setTimeout(() => setTemplateSavedToast(false), 2500);
  };

  const handleResetTemplate = () => {
    setTemplateText(DEFAULT_WHATSAPP_TEMPLATE);
  };

  const insertVariable = (variable: string) => {
    setTemplateText((prev) => prev + variable);
  };

  // Find next pending appointment in the active tab for quick progression
  const pendingInActiveTab = currentGroup?.appointments.filter((item) => item.needsReminder) || [];
  const nextPending = pendingInActiveTab[0];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Rappels WhatsApp" maxWidthClassName="max-w-4xl">
        {/* Header with WhatsApp branding */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-xs shadow-inner">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Rappels WhatsApp des Rendez-vous
                </h2>
                <span className="text-[11px] font-semibold bg-white/20 text-white px-2 py-0.5 rounded-full backdrop-blur-xs">
                  À l'approche des consultations
                </span>
              </div>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                Notifications directes et personnalisées pour réduire l'absentéisme médical
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick KPI stats banner */}
        <div className="bg-emerald-50/70 border-b border-emerald-100 px-6 py-3 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-slate-700 font-medium">
                À envoyer pour demain :{' '}
                <strong className="text-slate-900 font-bold">
                  {approachingData.tomorrowPendingCount}
                </strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-slate-700 font-medium">
                Déjà envoyés :{' '}
                <strong className="text-emerald-700 font-bold">
                  {approachingData.sentRemindersCount}
                </strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-slate-700 font-medium">
                Total RDV dans 48h :{' '}
                <strong className="text-slate-900 font-bold">
                  {approachingData.approachingCount}
                </strong>
              </span>
            </div>
          </div>

          {/* Sequential fast-send button */}
          {nextPending && (
            <button
              type="button"
              onClick={() => handleSendWhatsApp(nextPending.appointment, nextPending.patient)}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-xs transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>
                Envoyer le prochain ({nextPending.patient.firstName} {nextPending.patient.lastName})
              </span>
            </button>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-slate-200 px-6 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-x-auto py-2.5">
            <button
              type="button"
              onClick={() => setActiveTab('demain')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'demain'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <span>Demain (J-1 • 24h avant)</span>
              {approachingData.tomorrowPendingCount > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                    activeTab === 'demain' ? 'bg-white text-emerald-800' : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {approachingData.tomorrowPendingCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('aujourdhui')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'aujourdhui'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <span>Aujourd'hui (Jour J)</span>
              {approachingData.todayPendingCount > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                    activeTab === 'aujourdhui' ? 'bg-white text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {approachingData.todayPendingCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('j2')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'j2'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <span>Dans 48h (J-2)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('template')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'template'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Modèle & Personnalisation</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 bg-slate-50/50">
          {activeTab !== 'template' ? (
            <div>
              {/* If no appointments */}
              {!currentGroup || currentGroup.appointments.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm">
                    Aucun rendez-vous programmé pour ce créneau
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Tous les créneaux sont à jour ou aucun rendez-vous n'est encore enregistré pour cette période.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">
                      {currentGroup.appointments.length} patient(s) prévu(s)
                    </span>
                    <span className="text-[11px]">
                      Cliquez sur « Envoyer via WhatsApp » pour ouvrir WhatsApp avec le message pré-rempli
                    </span>
                  </div>

                  {currentGroup.appointments.map(({ appointment, patient, needsReminder }) => {
                    const phoneValidation = sanitizePhoneNumber(patient.phone);
                    const isExpanded = editingAppointmentId === appointment.id;
                    const isSent = appointment.whatsappReminderSent;
                    const currentCustomMsg =
                      customMessages[appointment.id] ||
                      buildReminderMessage(appointment, patient, doctor);

                    return (
                      <div
                        key={appointment.id}
                        className={`bg-white rounded-2xl border transition-all shadow-2xs overflow-hidden ${
                          isSent
                            ? 'border-emerald-200 bg-emerald-50/20'
                            : needsReminder
                            ? 'border-slate-300 hover:border-emerald-300 ring-1 ring-emerald-500/20'
                            : 'border-slate-200'
                        }`}
                      >
                        {/* Main row card */}
                        <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          {/* Left: Patient & Appointment infos */}
                          <div className="flex items-start gap-3.5">
                            <div
                              className={`w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
                                isSent
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {patient.firstName[0]}
                              {patient.lastName[0]}
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-bold text-sm text-slate-900">
                                  {patient.lastName.toUpperCase()} {patient.firstName}
                                </h4>
                                <span className="text-xs text-slate-400">•</span>
                                <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                                  {appointment.startTime} ({appointment.duration} min)
                                </span>
                                <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                                  {appointment.reason}
                                </span>
                              </div>

                              {/* Phone details & mobile alert */}
                              <div className="flex items-center gap-3 text-xs text-slate-600 flex-wrap pt-0.5">
                                <span className="flex items-center gap-1 font-mono font-medium">
                                  <Phone className="w-3 h-3 text-slate-400" />
                                  {patient.phone}
                                </span>

                                {!phoneValidation.isValid ? (
                                  <span className="text-rose-600 text-[11px] font-semibold flex items-center gap-1 bg-rose-50 px-2 py-0.5 rounded-md">
                                    <AlertTriangle className="w-3 h-3" /> Numéro invalide
                                  </span>
                                ) : !phoneValidation.isMobile ? (
                                  <span className="text-amber-700 text-[11px] font-semibold flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-md">
                                    <AlertTriangle className="w-3 h-3" /> Fixe probable
                                  </span>
                                ) : (
                                  <span className="text-emerald-700 text-[11px] font-semibold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md">
                                    <Check className="w-3 h-3" /> Mobile vérifié
                                  </span>
                                )}

                                {/* Status badge */}
                                {isSent ? (
                                  <span className="text-emerald-800 text-[11px] font-bold flex items-center gap-1 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-md">
                                    <Check className="w-3 h-3 text-emerald-700" /> Rappel envoyé{' '}
                                    {appointment.whatsappReminderSentAt
                                      ? `(${new Date(appointment.whatsappReminderSentAt).toLocaleTimeString([], {
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        })})`
                                      : ''}
                                  </span>
                                ) : (
                                  <span className="text-amber-800 text-[11px] font-bold flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                                    <Clock className="w-3 h-3 text-amber-600" /> En attente d'envoi
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Right: Actions */}
                          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                            {/* Toggle message preview button */}
                            <button
                              type="button"
                              onClick={() =>
                                setEditingAppointmentId(isExpanded ? null : appointment.id)
                              }
                              className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                                isExpanded
                                  ? 'bg-slate-200 text-slate-800'
                                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                              }`}
                              title="Voir ou modifier le message"
                              aria-label={isExpanded ? 'Masquer le texte du message' : 'Voir le message'}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span className="hidden md:inline">
                                {isExpanded ? 'Masquer texte' : 'Voir message'}
                              </span>
                            </button>

                            {/* Copy button */}
                            <button
                              type="button"
                              onClick={() => handleCopyText(appointment, patient)}
                              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="Copier le texte du rappel"
                              aria-label="Copier le texte du rappel"
                            >
                              {copiedId === appointment.id ? (
                                <Check className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>

                            {/* Primary WhatsApp Action */}
                            <button
                              type="button"
                              onClick={() => handleSendWhatsApp(appointment, patient)}
                              disabled={!phoneValidation.isValid}
                              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer ${
                                !phoneValidation.isValid
                                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                  : isSent
                                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                              }`}
                            >
                              <MessageCircle className="w-4 h-4" />
                              <span>{isSent ? 'Renvoyer via WhatsApp' : 'Envoyer via WhatsApp'}</span>
                              <ExternalLink className="w-3 h-3 opacity-70" />
                            </button>

                            {/* Manual status toggle */}
                            <button
                              type="button"
                              onClick={() =>
                                onUpdateAppointmentReminder(
                                  appointment.id,
                                  !isSent,
                                  !isSent ? new Date().toISOString() : undefined
                                )
                              }
                              title={isSent ? 'Marquer non envoyé' : 'Marquer déjà envoyé'}
                              aria-label={isSent ? 'Marquer non envoyé' : 'Marquer déjà envoyé'}
                              className={`p-2 rounded-lg transition-colors cursor-pointer text-xs ${
                                isSent
                                  ? 'text-emerald-700 hover:bg-emerald-100'
                                  : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                              }`}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Collapsible custom message preview / editor */}
                        {isExpanded && (
                          <div className="p-4 bg-slate-50 border-t border-slate-200/80 space-y-3">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Aperçu personnalisé du message WhatsApp</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setCustomMessages((prev) => {
                                    const copy = { ...prev };
                                    delete copy[appointment.id];
                                    return copy;
                                  });
                                }}
                                className="text-xs text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                <RefreshCw className="w-3 h-3" />
                                Réinitialiser au modèle par défaut
                              </button>
                            </div>

                            <textarea
                              rows={5}
                              value={currentCustomMsg}
                              onChange={(e) =>
                                setCustomMessages((prev) => ({
                                  ...prev,
                                  [appointment.id]: e.target.value,
                                }))
                              }
                              className="w-full p-3 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono text-slate-800 leading-relaxed resize-y"
                            />

                            <div className="flex items-center justify-between text-[11px] text-slate-500">
                              <span>
                                Destination : +{phoneValidation.cleanPhone} (
                                {phoneValidation.formattedDisplay})
                              </span>
                              <button
                                type="button"
                                onClick={() => handleSendWhatsApp(appointment, patient)}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center gap-1.5 cursor-pointer"
                              >
                                <Send className="w-3 h-3" />
                                <span>Confirmer et Ouvrir WhatsApp</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Template Editor Tab */
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Modèle de Rappel WhatsApp par Défaut
                    </h3>
                    <p className="text-xs text-slate-500">
                      Ce message est généré automatiquement avec les données du praticien et du patient.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetTemplate}
                    className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Rétablir le modèle standard
                  </button>
                </div>

                {/* Variable chips buttons */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    Insérer une variable dynamique dans le texte :
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { code: '{civilite}', desc: 'M. / Mme' },
                      { code: '{nom}', desc: 'Nom de famille' },
                      { code: '{prenom}', desc: 'Prénom' },
                      { code: '{date}', desc: 'Date (ex: mardi 12 sept.)' },
                      { code: '{heure}', desc: 'Heure (ex: 10:30)' },
                      { code: '{docteur}', desc: 'Nom du praticien' },
                      { code: '{specialite}', desc: 'Spécialité' },
                      { code: '{adresse}', desc: 'Adresse du cabinet' },
                      { code: '{telephone}', desc: 'Téléphone secrétariat' },
                      { code: '{motif}', desc: 'Motif consultation' },
                    ].map((v) => (
                      <button
                        key={v.code}
                        type="button"
                        onClick={() => insertVariable(` ${v.code} `)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 border border-slate-200 rounded-lg text-xs font-mono font-medium text-slate-700 transition-colors cursor-pointer"
                        title={v.desc}
                      >
                        {v.code}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {/* Textarea Editor */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Texte du modèle (Markdown et Émojis supportés) :
                    </label>
                    <textarea
                      rows={12}
                      value={templateText}
                      onChange={(e) => setTemplateText(e.target.value)}
                      className="w-full p-3.5 text-xs font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 leading-relaxed resize-none bg-white"
                    />
                  </div>

                  {/* WhatsApp Simulation Bubble */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Rendu visuel simulé dans WhatsApp :
                    </label>
                    <div className="bg-[#ECE5DD] p-4 rounded-xl border border-slate-300 min-h-[260px] flex flex-col justify-end">
                      <div className="bg-white rounded-xl rounded-tr-xs p-3.5 shadow-sm text-xs text-slate-800 max-w-[90%] self-end space-y-2 relative">
                        <p className="whitespace-pre-wrap leading-relaxed font-sans">
                          {templateText
                            .replace(/\{civilite\}/g, 'M.')
                            .replace(/\{nom\}/g, 'MOREAU')
                            .replace(/\{prenom\}/g, 'Alexandre')
                            .replace(/\{patient\}/g, 'Alexandre MOREAU')
                            .replace(/\{date\}/g, 'demain à 09:30')
                            .replace(/\{heure\}/g, '09:30')
                            .replace(/\{docteur\}/g, `${doctor.title} ${doctor.name}`)
                            .replace(/\{specialite\}/g, doctor.specialty)
                            .replace(/\{adresse\}/g, `${doctor.address}, ${doctor.city}`)
                            .replace(/\{telephone\}/g, doctor.phone)
                            .replace(/\{motif\}/g, 'Contrôle tensionnel')}
                        </p>
                        <div className="text-[10px] text-slate-400 text-right flex items-center justify-end gap-1 mt-1">
                          <span>14:30</span>
                          <span className="text-emerald-500 font-bold">✓✓</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    {templateSavedToast && (
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <Check className="w-4 h-4" /> Modèle enregistré !
                      </span>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={handleSaveTemplate}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    Enregistrer le modèle
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-white flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Format international E.164 géré automatiquement (+221 pour le Sénégal)</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>
    </Modal>
  );
};
