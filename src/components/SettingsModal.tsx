import React, { useState } from 'react';
import { X, Save, Download, Upload, RotateCcw, Stethoscope, Check, MessageCircle, LogOut, BadgeCheck, Globe2 } from 'lucide-react';
import { DoctorProfile } from '../types';
import { DEFAULT_WHATSAPP_TEMPLATE } from '../utils/whatsappUtils';
import { getTrialDaysRemaining } from '../utils/subscriptionUtils';
import { ImportResult } from '../lib/db';
import { MEDICAL_SPECIALTIES } from '../constants';
import { Modal } from './shared/Modal';

const SUBSCRIPTION_STATUS_LABELS: Record<DoctorProfile['subscriptionStatus'], string> = {
  trialing: "Essai gratuit en cours",
  active: 'Actif',
  expired: 'Expiré',
  cancelled: 'Résilié',
};

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctor: DoctorProfile;
  onSaveDoctor: (profile: DoctorProfile) => void;
  onExportData: () => Promise<void>;
  onImportData: (jsonString: string) => Promise<ImportResult>;
  onResetDemo: () => Promise<void>;
  onSignOut: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  doctor,
  onSaveDoctor,
  onExportData,
  onImportData,
  onResetDemo,
  onSignOut,
}) => {
  const [name, setName] = useState(doctor.name);
  const [title, setTitle] = useState(doctor.title);
  const isKnownSpecialty = MEDICAL_SPECIALTIES.includes(doctor.specialty);
  const [specialtySelect, setSpecialtySelect] = useState(isKnownSpecialty ? doctor.specialty : 'Autre');
  const [specialtyOther, setSpecialtyOther] = useState(isKnownSpecialty ? '' : doctor.specialty);
  const specialty = specialtySelect === 'Autre' ? specialtyOther : specialtySelect;
  const [onms, setOnms] = useState(doctor.onms || '');
  const [ninea, setNinea] = useState(doctor.ninea || '');
  const [phone, setPhone] = useState(doctor.phone);
  const [email, setEmail] = useState(doctor.email);
  const [address, setAddress] = useState(doctor.address);
  const [city, setCity] = useState(doctor.city);
  const [consultationFee, setConsultationFee] = useState(doctor.consultationFee);
  const [defaultDuration, setDefaultDuration] = useState(doctor.defaultDuration);
  const [whatsappReminderHours, setWhatsappReminderHours] = useState(doctor.whatsappReminderHours || 24);
  const [whatsappCustomTemplate, setWhatsappCustomTemplate] = useState(
    doctor.whatsappCustomTemplate || DEFAULT_WHATSAPP_TEMPLATE
  );
  const [isPublicListed, setIsPublicListed] = useState(doctor.isPublicListed);
  const [acceptsNewPatients, setAcceptsNewPatients] = useState(doctor.acceptsNewPatients);
  const [publicBio, setPublicBio] = useState(doctor.publicBio);

  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const trialDaysRemaining = getTrialDaysRemaining(doctor);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedCity = city.trim();
    const trimmedSpecialty = specialty.trim();

    if (isPublicListed && (!trimmedCity || !trimmedSpecialty)) {
      alert(
        "Pour apparaître dans l'annuaire public, la ville et la spécialité du cabinet doivent être renseignées."
      );
      return;
    }

    const updated: DoctorProfile = {
      ...doctor,
      name: name.trim(),
      title,
      specialty: trimmedSpecialty,
      onms: onms.trim(),
      ninea: ninea.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      city: trimmedCity,
      consultationFee: Number(consultationFee),
      defaultDuration: Number(defaultDuration),
      whatsappReminderHours: Number(whatsappReminderHours),
      whatsappCustomTemplate,
      isPublicListed,
      publicBio: publicBio.trim(),
      acceptsNewPatients,
    };
    onSaveDoctor(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (content) {
        const result = await onImportData(content);
        if (result.success) {
          const summary = `Données restaurées : ${result.imported.patients} patient(s), ${result.imported.appointments} rendez-vous, ${result.imported.prescriptions} ordonnance(s), ${result.imported.consultations} consultation(s).`;
          const warning = result.errors.length > 0 ? `\n\nAttention :\n- ${result.errors.join('\n- ')}` : '';
          alert(`${summary}${warning}`);
          onClose();
        } else {
          alert(`Erreur lors de l'import :\n- ${result.errors.join('\n- ')}`);
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Paramètres du praticien & du cabinet"
      maxWidthClassName="max-w-2xl"
      maxHeightClassName="max-h-[90vh]"
    >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
              <Stethoscope className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Paramètres du Praticien & Cabinet</h2>
              <p className="text-xs text-slate-500">Configuration de votre exercice et sauvegarde des données</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <span className="font-bold text-slate-800 uppercase tracking-wider block border-b border-slate-100 pb-1">
              Profil Médical Professionnel
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Titre</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Nom complet *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Spécialité *</label>
                <select
                  required
                  value={specialtySelect}
                  onChange={(e) => setSpecialtySelect(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 bg-white"
                >
                  {MEDICAL_SPECIALTIES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                  <option value="Autre">Autre (préciser)</option>
                </select>
                {specialtySelect === 'Autre' && (
                  <input
                    type="text"
                    required
                    placeholder="Précisez votre spécialité"
                    value={specialtyOther}
                    onChange={(e) => setSpecialtyOther(e.target.value)}
                    className="w-full mt-1.5 px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                  />
                )}
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">N° Ordre des Médecins (ONMS) *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: SN-04821 / 2012"
                  value={onms}
                  onChange={(e) => setOnms(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">N° NINEA / Agrément</label>
                <input
                  type="text"
                  placeholder="Ex: 004892150 2Y3"
                  value={ninea}
                  onChange={(e) => setNinea(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Téléphone secrétariat</label>
                <input
                  type="text"
                  placeholder="+221 33 825 40 50"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email professionnel</label>
                <input
                  type="email"
                  placeholder="cabinet@sante.sn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Adresse du cabinet</label>
                <input
                  type="text"
                  placeholder="Ex: Avenue Cheikh Anta Diop, Fann"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ville (Sénégal)</label>
                <input
                  type="text"
                  placeholder="Dakar"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tarif de consultation par défaut (FCFA)
                </label>
                <input
                  type="number"
                  step="500"
                  value={consultationFee}
                  onChange={(e) => setConsultationFee(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 font-bold"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Durée standard d'un créneau (minutes)
                </label>
                <select
                  value={defaultDuration}
                  onChange={(e) => setDefaultDuration(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 bg-white"
                >
                  <option value={15}>15 minutes</option>
                  <option value={20}>20 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>60 minutes</option>
                </select>
              </div>
            </div>

            {/* WhatsApp Notifications Settings */}
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 space-y-3 mt-4">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-emerald-600" />
                <h4 className="font-bold text-slate-900 text-xs">
                  Configuration des Rappels WhatsApp à l'approche des RDV
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Délai standard d'envoi du rappel
                  </label>
                  <select
                    value={whatsappReminderHours}
                    onChange={(e) => setWhatsappReminderHours(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value={24}>24 heures avant (J-1 - Recommandé)</option>
                    <option value={48}>48 heures avant (J-2 - Anticipé)</option>
                    <option value={12}>12 heures avant (Le matin même)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Téléphone du secrétariat dans les rappels
                  </label>
                  <input
                    type="text"
                    placeholder="+221 33 825 40 50"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 text-xs mb-1">
                  Modèle de texte pour les messages WhatsApp :
                </label>
                <textarea
                  rows={4}
                  value={whatsappCustomTemplate}
                  onChange={(e) => setWhatsappCustomTemplate(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:ring-1 focus:ring-emerald-500 leading-relaxed"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Variables disponibles : {'{civilite}'}, {'{nom}'}, {'{prenom}'}, {'{date}'}, {'{heure}'}, {'{docteur}'}, {'{specialite}'}, {'{adresse}'}, {'{telephone}'}, {'{motif}'}
                </p>
              </div>
            </div>

            {/* Annuaire Public MédicLab */}
            <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-4 space-y-3 mt-4">
              <div className="flex items-center gap-2">
                <Globe2 className="w-5 h-5 text-indigo-600" />
                <h4 className="font-bold text-slate-900 text-xs">Annuaire Public MédicLab</h4>
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublicListed}
                  onChange={(e) => setIsPublicListed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-indigo-600 cursor-pointer"
                />
                <span>
                  <span className="font-semibold text-slate-800 block">Être visible dans l'annuaire</span>
                  <span className="text-[11px] text-slate-500">
                    Permet aux patients (non connectés) de trouver votre cabinet depuis la page publique
                    "Trouver un professionnel" de MédicLab.
                  </span>
                </span>
              </label>

              {isPublicListed && (
                <div className="pl-6.5 space-y-3">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acceptsNewPatients}
                      onChange={(e) => setAcceptsNewPatients(e.target.checked)}
                      className="mt-0.5 w-4 h-4 accent-indigo-600 cursor-pointer"
                    />
                    <span className="font-semibold text-slate-800">J'accepte de nouveaux patients</span>
                  </label>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Présentation publique
                    </label>
                    <textarea
                      rows={3}
                      maxLength={500}
                      placeholder="Quelques lignes sur votre pratique, vos horaires, votre approche..."
                      value={publicBio}
                      onChange={(e) => setPublicBio(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 leading-relaxed"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">{publicBio.length} / 500 caractères</p>
                  </div>

                  <div className="p-2.5 bg-white border border-indigo-200 rounded-lg text-[11px] text-slate-600 leading-relaxed">
                    <span className="font-semibold text-slate-700">Deviennent publiques :</span> nom, titre,
                    spécialité, ville, adresse, téléphone, présentation.
                    <br />
                    <span className="font-semibold text-slate-700">Jamais publiées :</span> email, N° Ordre
                    (ONMS), N° NINEA, statut d'abonnement.
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                {savedSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                <span>{savedSuccess ? 'Enregistré avec succès !' : 'Enregistrer le profil'}</span>
              </button>
            </div>
          </form>

          {/* Abonnement (lecture seule, géré manuellement) */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <span className="font-bold text-slate-800 uppercase tracking-wider block">
              Abonnement
            </span>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <BadgeCheck className="w-4.5 h-4.5" />
              </div>
              <div>
                <p className="font-bold text-slate-900 text-xs">
                  Statut : {SUBSCRIPTION_STATUS_LABELS[doctor.subscriptionStatus]}
                </p>
                {doctor.subscriptionStatus === 'trialing' && doctor.trialEndsAt && (
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Fin de l'essai le{' '}
                    {new Date(doctor.trialEndsAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                    {trialDaysRemaining !== null && ` (${trialDaysRemaining} jour${trialDaysRemaining > 1 ? 's' : ''} restant${trialDaysRemaining > 1 ? 's' : ''})`}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Backup, Export & Reset */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <span className="font-bold text-slate-800 uppercase tracking-wider block">
              Gestion des Données & Sauvegarde
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Export */}
              <button
                type="button"
                onClick={onExportData}
                className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left flex flex-col justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2 font-bold text-slate-900 mb-1">
                  <Download className="w-4 h-4 text-blue-600" />
                  <span>Exporter</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Télécharger une copie complète du cabinet (JSON)
                </p>
              </button>

              {/* Import */}
              <label className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left flex flex-col justify-between transition-colors cursor-pointer">
                <div className="flex items-center gap-2 font-bold text-slate-900 mb-1">
                  <Upload className="w-4 h-4 text-indigo-600" />
                  <span>Restaurer</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Importer un fichier JSON sauvegardé
                </p>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {/* Reset to Demo */}
              <button
                type="button"
                onClick={async () => {
                  if (
                    confirm(
                      'Êtes-vous certain de vouloir réinitialiser l\'application avec les données médicales de démonstration ? Toutes vos données réelles (patients, rendez-vous, ordonnances, consultations) seront définitivement supprimées.'
                    )
                  ) {
                    await onResetDemo();
                    alert('Données de démonstration réinitialisées avec succès.');
                    onClose();
                  }
                }}
                className="p-3 bg-rose-50/50 hover:bg-rose-50 border border-rose-200 rounded-xl text-left flex flex-col justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2 font-bold text-rose-800 mb-1">
                  <RotateCcw className="w-4 h-4 text-rose-600" />
                  <span>Réinitialiser</span>
                </div>
                <p className="text-[11px] text-rose-600">
                  Recharger la base patient et agenda de démonstration
                </p>
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onSignOut}
            className="px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Déconnexion</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>
    </Modal>
  );
};
