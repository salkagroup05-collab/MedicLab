import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Patient } from '../types';
import { getTodayDateString } from '../utils/dateUtils';
import { Modal } from './shared/Modal';

interface PatientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (patient: Patient) => void;
  initialPatient?: Patient | null;
}

export const PatientFormModal: React.FC<PatientFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialPatient,
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState<'M' | 'F' | 'Autre'>('M');
  const [birthDate, setBirthDate] = useState('1990-01-01');
  const [ssn, setSsn] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [bloodGroup, setBloodGroup] = useState('A+');
  const [allergiesText, setAllergiesText] = useState('');
  const [medicalHistoryText, setMedicalHistoryText] = useState('');
  const [chronicTreatmentsText, setChronicTreatmentsText] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyRelation, setEmergencyRelation] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (initialPatient) {
      setFirstName(initialPatient.firstName);
      setLastName(initialPatient.lastName);
      setGender(initialPatient.gender);
      setBirthDate(initialPatient.birthDate);
      setSsn(initialPatient.ssn);
      setPhone(initialPatient.phone);
      setEmail(initialPatient.email);
      setAddress(initialPatient.address);
      setBloodGroup(initialPatient.bloodGroup || 'A+');
      setAllergiesText(initialPatient.allergies.join(', '));
      setMedicalHistoryText(initialPatient.medicalHistory.join(', '));
      setChronicTreatmentsText(initialPatient.chronicTreatments.join(', '));
      setEmergencyName(initialPatient.emergencyContact?.name || '');
      setEmergencyRelation(initialPatient.emergencyContact?.relationship || '');
      setEmergencyPhone(initialPatient.emergencyContact?.phone || '');
      setNotes(initialPatient.notes || '');
    } else {
      setFirstName('');
      setLastName('');
      setGender('M');
      setBirthDate('1990-01-01');
      setSsn('');
      setPhone('');
      setEmail('');
      setAddress('');
      setBloodGroup('A+');
      setAllergiesText('');
      setMedicalHistoryText('');
      setChronicTreatmentsText('');
      setEmergencyName('');
      setEmergencyRelation('');
      setEmergencyPhone('');
      setNotes('');
    }
  }, [initialPatient, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!lastName.trim() || !firstName.trim()) {
      alert('Veuillez renseigner le nom et le prénom.');
      return;
    }

    if (birthDate > getTodayDateString()) {
      alert('La date de naissance ne peut pas être dans le futur.');
      return;
    }

    const allergies = allergiesText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const medicalHistory = medicalHistoryText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const chronicTreatments = chronicTreatmentsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const savedPatient: Patient = {
      id: initialPatient?.id || '',
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      gender,
      birthDate,
      ssn: ssn.trim() || 'À renseigner',
      phone: phone.trim() || 'Non renseigné',
      email: email.trim(),
      address: address.trim() || 'Non renseignée',
      bloodGroup,
      allergies,
      medicalHistory,
      chronicTreatments,
      emergencyContact: emergencyName
        ? {
            name: emergencyName.trim(),
            relationship: emergencyRelation.trim() || 'Proche',
            phone: emergencyPhone.trim(),
          }
        : undefined,
      notes: notes.trim(),
      createdAt: initialPatient?.createdAt || new Date().toISOString().split('T')[0],
    };

    onSave(savedPatient);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialPatient ? 'Modifier le dossier patient' : 'Créer une fiche patient'}
      maxWidthClassName="max-w-2xl"
      maxHeightClassName="max-h-[90vh]"
    >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {initialPatient ? 'Modifier le dossier patient' : 'Créer une fiche patient'}
            </h2>
            <p className="text-xs text-slate-500">
              Informations administratives et antécédents médicaux
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/50 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* Civil Identity */}
          <div className="space-y-3">
            <span className="font-bold text-slate-800 uppercase tracking-wider block border-b border-slate-100 pb-1">
              1. État Civil & Coordonnées
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label htmlFor="pf-lastName" className="block font-semibold text-slate-700 mb-1">Nom de famille *</label>
                <input
                  id="pf-lastName"
                  type="text"
                  required
                  placeholder="Ex: Martin"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="pf-firstName" className="block font-semibold text-slate-700 mb-1">Prénom *</label>
                <input
                  id="pf-firstName"
                  type="text"
                  required
                  placeholder="Ex: Julie"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="pf-gender" className="block font-semibold text-slate-700 mb-1">Genre</label>
                <select
                  id="pf-gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value as Patient['gender'])}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 bg-white"
                >
                  <option value="M">Homme</option>
                  <option value="F">Femme</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label htmlFor="pf-birthDate" className="block font-semibold text-slate-700 mb-1">
                  Date de naissance *
                </label>
                <input
                  id="pf-birthDate"
                  type="date"
                  required
                  max={getTodayDateString()}
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="pf-ssn" className="block font-semibold text-slate-700 mb-1">N° CNI / NIN (Identification)</label>
                <input
                  id="pf-ssn"
                  type="text"
                  placeholder="1 751 1995 02418"
                  value={ssn}
                  onChange={(e) => setSsn(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>
              <div>
                <label htmlFor="pf-bloodGroup" className="block font-semibold text-slate-700 mb-1">Groupe Sanguin</label>
                <select
                  id="pf-bloodGroup"
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 bg-white font-semibold"
                >
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="pf-phone" className="block font-semibold text-slate-700 mb-1">Téléphone (WhatsApp)</label>
                <input
                  id="pf-phone"
                  type="tel"
                  placeholder="+221 77 123 45 67"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="pf-email" className="block font-semibold text-slate-700 mb-1">Email</label>
                <input
                  id="pf-email"
                  type="email"
                  placeholder="patient@exemple.sn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="pf-address" className="block font-semibold text-slate-700 mb-1">Adresse (Quartier, Ville)</label>
              <input
                id="pf-address"
                type="text"
                placeholder="Ex: Mermoz Pyrotechnie, Dakar"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Medical Alerts & Profile */}
          <div className="space-y-3 pt-2">
            <span className="font-bold text-slate-800 uppercase tracking-wider block border-b border-slate-100 pb-1">
              2. Profil Médical & Alertes
            </span>

            <div>
              <label htmlFor="pf-allergies" className="block font-semibold text-rose-800 mb-1">
                Allergies & Intolérances (séparées par une virgule)
              </label>
              <input
                id="pf-allergies"
                type="text"
                placeholder="Ex: Pénicilline, Pollen, Aspirine, Arachides..."
                value={allergiesText}
                onChange={(e) => setAllergiesText(e.target.value)}
                className="w-full px-3 py-2 border border-rose-300 rounded-lg focus:ring-1 focus:ring-rose-500 bg-rose-50/20"
              />
            </div>

            <div>
              <label htmlFor="pf-chronicTreatments" className="block font-semibold text-slate-700 mb-1">
                Traitements de fond / chroniques (séparés par une virgule)
              </label>
              <input
                id="pf-chronicTreatments"
                type="text"
                placeholder="Ex: Lévothyrox 50µg, Ramipril 5mg, Metformine 1000mg..."
                value={chronicTreatmentsText}
                onChange={(e) => setChronicTreatmentsText(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="pf-medicalHistory" className="block font-semibold text-slate-700 mb-1">
                Antécédents médicaux et chirurgicaux (séparés par une virgule)
              </label>
              <input
                id="pf-medicalHistory"
                type="text"
                placeholder="Ex: Appendicectomie 2010, Diabète de type 2, Asthme d'effort..."
                value={medicalHistoryText}
                onChange={(e) => setMedicalHistoryText(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="space-y-3 pt-2">
            <span className="font-bold text-slate-800 uppercase tracking-wider block border-b border-slate-100 pb-1">
              3. Contact d'Urgence
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label htmlFor="pf-emergencyName" className="block font-semibold text-slate-700 mb-1">Nom & Prénom</label>
                <input
                  id="pf-emergencyName"
                  type="text"
                  placeholder="Ex: Sophie Martin"
                  value={emergencyName}
                  onChange={(e) => setEmergencyName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="pf-emergencyRelation" className="block font-semibold text-slate-700 mb-1">Lien de parenté</label>
                <input
                  id="pf-emergencyRelation"
                  type="text"
                  placeholder="Ex: Conjoint, Mère, Tuteur..."
                  value={emergencyRelation}
                  onChange={(e) => setEmergencyRelation(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="pf-emergencyPhone" className="block font-semibold text-slate-700 mb-1">Numéro de téléphone</label>
                <input
                  id="pf-emergencyPhone"
                  type="tel"
                  placeholder="06 99 88 77 66"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <label htmlFor="pf-notes" className="block font-semibold text-slate-700 mb-1">
              Remarques médicales & annotations libres
            </label>
            <textarea
              id="pf-notes"
              rows={2}
              placeholder="Notes spécifiques au patient..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm cursor-pointer"
            >
              {initialPatient ? 'Enregistrer les modifications' : 'Créer le patient'}
            </button>
          </div>
        </form>
    </Modal>
  );
};
