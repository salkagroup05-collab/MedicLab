import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  FileDown,
  Printer,
  Copy,
  Check,
  Stethoscope,
  Sparkles,
  RotateCcw,
  AlertTriangle,
  Clock,
  Send,
  Building2,
  FileText,
  User,
  Heart,
  Info,
} from 'lucide-react';
import {
  Consultation,
  DoctorProfile,
  Patient,
  Prescription,
  ReferralLetterData,
  ReferralUrgency,
} from '../types';
import {
  calculateAge,
  formatDateFr,
  formatDateShortFr,
  getTodayDateString,
} from '../utils/dateUtils';
import { downloadReferralLetterPdf } from '../utils/pdfExport';
import { logPatientAccess } from '../lib/db';
import { Modal } from './shared/Modal';

interface SpecialtyPreset {
  name: string;
  defaultRecipient: string;
  defaultInstitution: string;
  defaultReason: string;
  defaultQuestion: string;
}

const SPECIALTY_PRESETS: SpecialtyPreset[] = [
  {
    name: 'Cardiologie',
    defaultRecipient: 'Cher(e) Confrère Cardiologue,',
    defaultInstitution: 'Cabinet de Cardiologie / Hôpital',
    defaultReason: 'Bilan d’HTA résistante / Évaluation du risque cardiovasculaire',
    defaultQuestion:
      'Réalisation d’un ECG de repos, échocardiographie Doppler transthoracique et avis sur l’ajustement du traitement antihypertenseur.',
  },
  {
    name: 'Dermatologie',
    defaultRecipient: 'Cher(e) Confrère Dermatologue,',
    defaultInstitution: 'Cabinet de Dermatologie / Polyclinique',
    defaultReason: 'Lésion cutanée atypique suspecte / Dermatose persistante rebelle',
    defaultQuestion:
      'Examen dermoscopique spécialisé, biopsie cutanée diagnostique si indiquée et proposition de protocole thérapeutique.',
  },
  {
    name: 'Ophtalmologie',
    defaultRecipient: 'Cher(e) Confrère Ophtalmologiste,',
    defaultInstitution: 'Centre Ophtalmologique',
    defaultReason: 'Bilan ophtalmologique annuel (dépistage rétinopathie) / Baisse d’acuité visuelle',
    defaultQuestion:
      'Mesure de l’acuité visuelle, contrôle du tonus oculaire et réalisation d’un fond d’œil avec évaluation rétinienne.',
  },
  {
    name: 'Gastro-entérologie',
    defaultRecipient: 'Cher(e) Confrère Gastro-entérologue,',
    defaultInstitution: 'Service d’Hépato-Gastro-Entérologie',
    defaultReason: 'Épigastralgies chroniques récidivantes / RGO réfractaire / Troubles du transit',
    defaultQuestion:
      'Avis spécialisé, réalisation d’une endoscopie œso-gastro-duodénale (FOGD) diagnostique avec biopsies et conduite à tenir.',
  },
  {
    name: 'Neurologie',
    defaultRecipient: 'Cher(e) Confrère Neurologue,',
    defaultInstitution: 'Service de Neurologie',
    defaultReason: 'Céphalées chroniques inhabituelles / Épisodes de vertiges / Suspicion de neuropathie',
    defaultQuestion:
      'Examen neurologique approfondi, indication éventuelle d’une imagerie cérébrale (IRM) ou d’un ENMG et avis thérapeutique.',
  },
  {
    name: 'Endocrinologie / Diabétologie',
    defaultRecipient: 'Cher(e) Confrère Endocrinologue,',
    defaultInstitution: 'Centre de Diabétologie et Endocrinologie',
    defaultReason: 'Déséquilibre glycémique persistant / Bilan de dysthyroïdie / Nodules',
    defaultQuestion:
      'Optimisation de la prise en charge métabolique, dépistage des complications micro/macrovasculaires et ajustement thérapeutique.',
  },
  {
    name: 'Pneumologie',
    defaultRecipient: 'Cher(e) Confrère Pneumologue,',
    defaultInstitution: 'Service de Pneumologie',
    defaultReason: 'Dyspnée d’effort / Toux chronique traînante / Suspicion asthme ou BPCO',
    defaultQuestion:
      'Exploration fonctionnelle respiratoire (EFR), analyse de la radiographie/scanner et avis sur la stratégie thérapeutique.',
  },
  {
    name: 'Rhumatologie & Orthopédie',
    defaultRecipient: 'Cher(e) Confrère Rhumatologue / Orthopédiste,',
    defaultInstitution: 'Service de Rhumatologie / Orthopédie',
    defaultReason: 'Rachialgies chroniques invalidantes / Gonarthrose sévère / Arthralgies inflammatoires',
    defaultQuestion:
      'Bilan radioclinique spécialisé, discussion d’infiltrations locales ou évaluation d’une indication chirurgicale.',
  },
  {
    name: 'Gynécologie-Obstétrique',
    defaultRecipient: 'Cher(e) Confrère Gynécologue,',
    defaultInstitution: 'Cabinet de Gynécologie / Maternité',
    defaultReason: 'Métrorragies inhabituelles / Algies pelviennes chroniques / Dépistage col utérin',
    defaultQuestion:
      'Examen gynécologique spécialisé, échographie pelvienne endovaginale et proposition thérapeutique.',
  },
  {
    name: 'ORL',
    defaultRecipient: 'Cher(e) Confrère ORL,',
    defaultInstitution: 'Cabinet ORL / Polyclinique',
    defaultReason: 'Hypoacousie progressive / Acouphènes / Vertiges positionnels / Sinusite chronique',
    defaultQuestion:
      'Audiométrie tonale et vocale, examen nasofibroscopique complet et orientation thérapeutique.',
  },
  {
    name: 'Psychiatrie',
    defaultRecipient: 'Cher(e) Confrère Psychiatre,',
    defaultInstitution: 'Service de Psychiatrie / Cabinet',
    defaultReason: 'Épisode dépressif majeur résistant / Troubles anxieux sévères / Insomnie rebelle',
    defaultQuestion:
      'Évaluation diagnostique spécialisée, suivi psychothérapeutique et réévaluation pharmacologique.',
  },
  {
    name: 'Pédiatrie spécialisée',
    defaultRecipient: 'Cher(e) Confrère Pédiatre,',
    defaultInstitution: 'Service de Pédiatrie',
    defaultReason: 'Ralentissement staturo-pondéral / Infections ORL récidivantes / Bilan d’acquisition',
    defaultQuestion:
      'Bilan pédiatrique approfondi, explorations biologiques et conseils d’orientation spécialisée.',
  },
  {
    name: 'Chirurgie Générale / Viscérale',
    defaultRecipient: 'Cher(e) Confrère Chirurgien,',
    defaultInstitution: 'Service de Chirurgie Générale',
    defaultReason: 'Hernie pariétale symptomatique / Lithiase biliaire / Masse palpable',
    defaultQuestion:
      'Avis chirurgical spécialisé pour évaluation d’une indication opératoire programmée.',
  },
  {
    name: 'Autre spécialité',
    defaultRecipient: 'Cher(e) Confrère,',
    defaultInstitution: 'Cabinet médical / Centre hospitalier',
    defaultReason: 'Demande d’avis diagnostique et prise en charge spécialisée',
    defaultQuestion:
      'Je sollicite votre avis confraternel et vos recommandations spécialisées pour la conduite à tenir.',
  },
];

interface ReferralLetterModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null;
  doctor: DoctorProfile;
  consultations: Consultation[];
  prescriptions?: Prescription[];
  initialConsultationId?: string;
}

export const ReferralLetterModal: React.FC<ReferralLetterModalProps> = ({
  isOpen,
  onClose,
  patient,
  doctor,
  consultations,
  prescriptions = [],
  initialConsultationId,
}) => {
  // Consultation selection
  const sortedConsultations = useMemo(() => {
    return [...consultations].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [consultations]);

  const defaultConsultation = useMemo(() => {
    if (initialConsultationId) {
      const found = sortedConsultations.find((c) => c.id === initialConsultationId);
      if (found) return found;
    }
    return sortedConsultations[0] || null;
  }, [sortedConsultations, initialConsultationId]);

  const [selectedConsultationId, setSelectedConsultationId] = useState<string>(
    defaultConsultation?.id || ''
  );

  const activeConsultation = useMemo(() => {
    return sortedConsultations.find((c) => c.id === selectedConsultationId) || defaultConsultation;
  }, [sortedConsultations, selectedConsultationId, defaultConsultation]);

  // Form states
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('Cardiologie');
  const [customSpecialtyName, setCustomSpecialtyName] = useState<string>('');
  const [recipientTitle, setRecipientTitle] = useState<string>(
    SPECIALTY_PRESETS[0].defaultRecipient
  );
  const [institution, setInstitution] = useState<string>(
    SPECIALTY_PRESETS[0].defaultInstitution
  );
  const [urgency, setUrgency] = useState<ReferralUrgency>('routine');
  const [reason, setReason] = useState<string>('');
  const [clinicalQuestion, setClinicalQuestion] = useState<string>(
    SPECIALTY_PRESETS[0].defaultQuestion
  );
  const [customNotes, setCustomNotes] = useState<string>('');
  const [includeVitals, setIncludeVitals] = useState<boolean>(true);
  const [includeSoap, setIncludeSoap] = useState<boolean>(true);
  const [includeTreatments, setIncludeTreatments] = useState<boolean>(true);
  const [includeHistory, setIncludeHistory] = useState<boolean>(true);

  // Export & feedback states
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('preview');

  // Initialize or update fields when patient or active consultation changes
  useEffect(() => {
    if (activeConsultation) {
      const diag = activeConsultation.soap.assessment;
      const initialReason = diag
        ? `Avis spécialisé pour ${diag} (${activeConsultation.reason})`
        : activeConsultation.reason || SPECIALTY_PRESETS[0].defaultReason;
      setReason(initialReason);
    } else {
      setReason(SPECIALTY_PRESETS[0].defaultReason);
    }
  }, [activeConsultation]);

  // When specialty preset changes
  const handleSpecialtyChange = (specName: string) => {
    setSelectedSpecialty(specName);
    const preset = SPECIALTY_PRESETS.find((p) => p.name === specName);
    if (preset) {
      setRecipientTitle(preset.defaultRecipient);
      setInstitution(preset.defaultInstitution);
      if (!reason || reason === SPECIALTY_PRESETS.find((p) => p.name === selectedSpecialty)?.defaultReason) {
        setReason(preset.defaultReason);
      }
      setClinicalQuestion(preset.defaultQuestion);
    }
  };

  // Reset to auto-extracted data
  const handleResetToDefault = () => {
    const preset = SPECIALTY_PRESETS.find((p) => p.name === selectedSpecialty) || SPECIALTY_PRESETS[0];
    setRecipientTitle(preset.defaultRecipient);
    setInstitution(preset.defaultInstitution);
    if (activeConsultation) {
      const diag = activeConsultation.soap.assessment;
      setReason(
        diag
          ? `Avis spécialisé pour ${diag} (${activeConsultation.reason})`
          : activeConsultation.reason || preset.defaultReason
      );
    } else {
      setReason(preset.defaultReason);
    }
    setClinicalQuestion(preset.defaultQuestion);
    setCustomNotes('');
    setIncludeVitals(true);
    setIncludeSoap(true);
    setIncludeTreatments(true);
    setIncludeHistory(true);
    setUrgency('routine');
  };

  if (!isOpen || !patient) return null;

  const age = calculateAge(patient.birthDate);
  const todayFr = formatDateFr(getTodayDateString());
  const effectiveSpecialty =
    selectedSpecialty === 'Autre spécialité' && customSpecialtyName.trim()
      ? customSpecialtyName.trim()
      : selectedSpecialty;

  // Build referral letter data object
  const letterData: ReferralLetterData = {
    patientId: patient.id,
    date: getTodayDateString(),
    doctorCity: doctor.city || 'Dakar',
    recipientTitle,
    specialty: effectiveSpecialty,
    institution,
    urgency,
    reason,
    clinicalQuestion,
    includeVitals,
    includeSoap,
    includeTreatments,
    includeHistory,
    selectedConsultationId: activeConsultation?.id,
    customNotes,
  };

  // Full text format generator for clipboard / text export
  const generatePlainTextLetter = (): string => {
    const lines: string[] = [];
    lines.push(`CABINET MÉDICAL DU ${doctor.title.toUpperCase()} ${doctor.name.toUpperCase()}`);
    lines.push(`${doctor.specialty || 'Médecine Générale'}`);
    if (doctor.address) lines.push(`${doctor.address} - ${doctor.city || 'Dakar'}`);
    lines.push(`Tél : ${doctor.phone}`);
    lines.push(`Fait à ${doctor.city || 'Dakar'}, le ${todayFr}`);
    lines.push('--------------------------------------------------');
    lines.push(`DESTINATAIRE : ${recipientTitle}`);
    lines.push(`Spécialité : ${effectiveSpecialty}`);
    if (institution) lines.push(`Établissement : ${institution}`);
    lines.push('');
    lines.push(`OBJET : Lettre de liaison confraternelle - Avis spécialisé en ${effectiveSpecialty}`);
    if (urgency === 'urgence') lines.push(`[PRIORITÉ : URGENCE RELATIVE (< 48h)]`);
    if (urgency === 'prioritaire') lines.push(`[PRIORITÉ : AVIS PRIORITAIRE (< 15 jours)]`);
    lines.push('');
    lines.push(
      `PATIENT(E) : ${patient.lastName.toUpperCase()} ${patient.firstName} (${patient.gender === 'M' ? 'Homme' : 'Femme'}, ${age} ans)`
    );
    lines.push(`Né(e) le : ${formatDateFr(patient.birthDate)} | Tél : ${patient.phone}`);
    if (patient.ssn) lines.push(`NIN / CNI : ${patient.ssn}`);
    if (includeHistory) {
      lines.push(
        `Allergies : ${patient.allergies?.length ? patient.allergies.join(', ') : 'Aucune connue'}`
      );
      lines.push(
        `Antécédents : ${patient.medicalHistory?.length ? patient.medicalHistory.join(', ') : 'Néant'}`
      );
      lines.push(
        `Traitements au long cours : ${patient.chronicTreatments?.length ? patient.chronicTreatments.join(', ') : 'Aucun'}`
      );
    }
    lines.push('');
    lines.push(`${recipientTitle}`);
    lines.push('');
    lines.push(
      `Je vous adresse ce jour en consultation spécialisée ${patient.gender === 'M' ? 'Monsieur' : 'Madame'} ${patient.lastName.toUpperCase()} ${patient.firstName}, âgé(e) de ${age} ans, pour le motif suivant :`
    );
    lines.push(`>>> MOTIF D'ADRESSAGE : ${reason}`);
    lines.push('');

    if (includeVitals && activeConsultation?.vitals) {
      const v = activeConsultation.vitals;
      lines.push('CONSTANTES VITALES RÉCENTES :');
      if (v.systolicBp && v.diastolicBp) lines.push(`- Tension artérielle : ${v.systolicBp}/${v.diastolicBp} mmHg`);
      if (v.heartRate) lines.push(`- Fréquence cardiaque : ${v.heartRate} bpm`);
      if (v.temperature) lines.push(`- Température : ${v.temperature} °C`);
      if (v.weight) lines.push(`- Poids : ${v.weight} kg`);
      if (v.bloodSugar) lines.push(`- Glycémie : ${v.bloodSugar} g/L`);
      lines.push('');
    }

    if (includeSoap && activeConsultation) {
      lines.push(`RÉSUMÉ CLINIQUE (Consultation du ${formatDateFr(activeConsultation.date)}) :`);
      if (activeConsultation.soap.subjective) {
        lines.push(`- Anamnèse / Symptômes : ${activeConsultation.soap.subjective}`);
      }
      if (activeConsultation.soap.objective) {
        lines.push(`- Examen physique : ${activeConsultation.soap.objective}`);
      }
      if (activeConsultation.soap.assessment) {
        lines.push(`- Hypothèse diagnostique : ${activeConsultation.soap.assessment}`);
      }
      if (activeConsultation.soap.plan) {
        lines.push(`- Conduite initiale / Traitement d'épreuve : ${activeConsultation.soap.plan}`);
      }
      lines.push('');
    }

    if (includeTreatments && prescriptions.length > 0) {
      const p0 = prescriptions[0];
      lines.push(`TRAITEMENTS RÉCEMMENT DÉLIVRÉS (le ${formatDateShortFr(p0.date)}) :`);
      p0.medications.forEach((m) => {
        lines.push(`- ${m.name} : ${m.dosage}, ${m.frequency} (${m.duration})`);
      });
      lines.push('');
    }

    lines.push('DEMANDE PRÉCISE D’AVIS CLINIQUE :');
    lines.push(clinicalQuestion);
    lines.push('');

    if (customNotes) {
      lines.push('OBSERVATIONS PARTICULIÈRES :');
      lines.push(customNotes);
      lines.push('');
    }

    lines.push(
      "Je vous remercie vivement par avance pour l'accueil réservé à notre patient(e) ainsi que pour vos précieuses conclusions confraternelles en retour."
    );
    lines.push('');
    lines.push('Confraternellement,');
    lines.push(`${doctor.title} ${doctor.name}`);
    lines.push(`${doctor.specialty || 'Médecin Généraliste'}`);

    return lines.join('\n');
  };

  const handleDownloadPdf = () => {
    setIsExporting(true);
    try {
      downloadReferralLetterPdf(
        patient,
        doctor,
        letterData,
        activeConsultation || undefined,
        prescriptions
      );
      logPatientAccess(patient.id, 'export', 'lettre_orientation_pdf');
    } catch (err) {
      console.error('Erreur téléchargement lettre orientation:', err);
      alert('Une erreur est survenue lors de la génération du PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    logPatientAccess(patient.id, 'export', 'lettre_orientation_impression');
    window.print();
  };

  const handleCopyText = async () => {
    try {
      const text = generatePlainTextLetter();
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Erreur copie presse-papier:', err);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Lettre d'orientation - ${patient.lastName} ${patient.firstName}`}
      maxWidthClassName="max-w-6xl"
      maxHeightClassName="max-h-[95vh]"
    >
        {/* Modal Top Header */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between no-print border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-600/30 text-indigo-400 border border-indigo-500/30">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold">Lettre d'Orientation pour Spécialiste</h2>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-900/70 text-indigo-200 border border-indigo-700/50">
                  {patient.lastName.toUpperCase()} {patient.firstName} ({age} ans)
                </span>
                {urgency === 'urgence' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Urgence &lt; 48h
                  </span>
                )}
                {urgency === 'prioritaire' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Prioritaire &lt; 15j
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Générez un courrier confraternel officiel pré-rempli avec les constantes, antécédents et notes SOAP.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="copy-referral-text-btn"
              onClick={handleCopyText}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer border ${
                copied
                  ? 'bg-emerald-600 text-white border-emerald-500'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
              title="Copier le texte de la lettre dans le presse-papier"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copié !' : 'Copier le texte'}</span>
            </button>

            <button
              type="button"
              id="download-referral-pdf-top-btn"
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>{isExporting ? 'Génération...' : 'Télécharger PDF'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
              title="Imprimer directement le document A4"
              aria-label="Imprimer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Imprimer</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab switcher for mobile / small screens */}
        <div className="lg:hidden flex items-center border-b border-slate-200 bg-slate-50 px-4 py-2 gap-2 no-print">
          <button
            type="button"
            onClick={() => setActiveTab('editor')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg text-center ${
              activeTab === 'editor'
                ? 'bg-white text-indigo-600 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:bg-slate-200/50'
            }`}
          >
            Paramètres & Contenu
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg text-center ${
              activeTab === 'preview'
                ? 'bg-white text-indigo-600 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:bg-slate-200/50'
            }`}
          >
            Aperçu Document A4
          </button>
        </div>

        {/* Modal Main Body (Two Columns on Desktop) */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          
          {/* Left Column: Form & Preset Controls (5 cols) */}
          <div
            className={`lg:col-span-5 p-5 overflow-y-auto border-r border-slate-200 bg-slate-50/60 space-y-4 text-xs ${
              activeTab === 'preview' ? 'hidden lg:block' : 'block'
            }`}
          >
            {/* Consultation selector */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Stethoscope className="w-4 h-4 text-indigo-600" />
                  <span>Consultation de référence source</span>
                </label>
                <span className="text-[10px] text-slate-400">
                  {sortedConsultations.length} consultation{sortedConsultations.length > 1 ? 's' : ''}
                </span>
              </div>

              {sortedConsultations.length > 0 ? (
                <select
                  value={selectedConsultationId}
                  onChange={(e) => setSelectedConsultationId(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {sortedConsultations.map((c, i) => (
                    <option key={c.id} value={c.id}>
                      {formatDateShortFr(c.date)} - {c.reason} {i === 0 ? '(Dernière en date)' : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-slate-500 italic text-[11px]">
                  Aucune consultation enregistrée. Les données générales du dossier seront utilisées.
                </p>
              )}

              {activeConsultation && (
                <div className="text-[11px] text-slate-600 bg-indigo-50/60 p-2 rounded-lg border border-indigo-100 flex items-start gap-1.5">
                  <Info className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                  <span>
                    Données importées de la consultation du <strong>{formatDateFr(activeConsultation.date)}</strong>{' '}
                    (Motif : {activeConsultation.reason}
                    {activeConsultation.soap.assessment ? ` - Diag : ${activeConsultation.soap.assessment}` : ''}).
                  </span>
                </div>
              )}
            </div>

            {/* Specialty & Destination Presets */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  <span>Spécialité & Destinataire</span>
                </label>
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  className="text-[11px] text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-semibold cursor-pointer"
                  title="Réinitialiser les suggestions automatiques"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Réinitialiser</span>
                </button>
              </div>

              {/* Specialty selector */}
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Spécialité médicale ciblée
                </label>
                <select
                  value={selectedSpecialty}
                  onChange={(e) => handleSpecialtyChange(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                >
                  {SPECIALTY_PRESETS.map((p) => (
                    <option key={p.name} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedSpecialty === 'Autre spécialité' && (
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Nom de la spécialité personnalisée
                  </label>
                  <input
                    type="text"
                    value={customSpecialtyName}
                    onChange={(e) => setCustomSpecialtyName(e.target.value)}
                    placeholder="Ex: Néphrologie, Hématologie..."
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              {/* Recipient Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Titre / Confrère
                  </label>
                  <input
                    type="text"
                    value={recipientTitle}
                    onChange={(e) => setRecipientTitle(e.target.value)}
                    placeholder="Ex: Cher(e) Confrère,"
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Établissement / Structure
                  </label>
                  <input
                    type="text"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    placeholder="Ex: Hôpital Principal..."
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Urgency Level */}
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Degré d'urgence
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setUrgency('routine')}
                    className={`py-1.5 px-2 rounded-lg text-center font-bold text-[11px] border transition-colors cursor-pointer ${
                      urgency === 'routine'
                        ? 'bg-slate-800 text-white border-slate-800'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Standard
                  </button>
                  <button
                    type="button"
                    onClick={() => setUrgency('prioritaire')}
                    className={`py-1.5 px-2 rounded-lg text-center font-bold text-[11px] border transition-colors cursor-pointer ${
                      urgency === 'prioritaire'
                        ? 'bg-amber-500 text-white border-amber-600'
                        : 'bg-white text-amber-800 border-amber-200 hover:bg-amber-50'
                    }`}
                  >
                    Prioritaire (&lt; 15j)
                  </button>
                  <button
                    type="button"
                    onClick={() => setUrgency('urgence')}
                    className={`py-1.5 px-2 rounded-lg text-center font-bold text-[11px] border transition-colors cursor-pointer ${
                      urgency === 'urgence'
                        ? 'bg-rose-600 text-white border-rose-700'
                        : 'bg-white text-rose-800 border-rose-200 hover:bg-rose-50'
                    }`}
                  >
                    Urgent (&lt; 48h)
                  </button>
                </div>
              </div>
            </div>

            {/* Clinical Content Controls */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <label className="font-bold text-slate-800 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>Objet & Demande Clinique</span>
              </label>

              {/* Reason */}
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Motif d'adressage
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ex: Suspicion d'HTA secondaire / Épigastralgies"
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Clinical Question */}
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Question précise / Objectif de l'avis spécialisé
                </label>
                <textarea
                  rows={3}
                  value={clinicalQuestion}
                  onChange={(e) => setClinicalQuestion(e.target.value)}
                  placeholder="Ex: Réalisation d'une échographie, adaptation thérapeutique..."
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Observations complémentaires */}
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Observations particulières / Notes additionnelles (optionnel)
                </label>
                <input
                  type="text"
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  placeholder="Ex: Le patient dispose d'un bilan sanguin récent (NFS/CRP normales)."
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Inclusion Checkboxes */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <label className="font-bold text-slate-800 block">Éléments inclus dans le courrier</label>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-[11px] text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeHistory}
                    onChange={(e) => setIncludeHistory(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Antécédents médicaux, chirurgicaux et allergies connues</span>
                </label>
                <label className="flex items-center gap-2 text-[11px] text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeVitals}
                    onChange={(e) => setIncludeVitals(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Dernières constantes vitales (Tension, Pouls, Poids, Glycémie)</span>
                </label>
                <label className="flex items-center gap-2 text-[11px] text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeSoap}
                    onChange={(e) => setIncludeSoap(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Résumé clinique SOAP (Anamnèse, Examen physique, Diagnostic, Plan)</span>
                </label>
                <label className="flex items-center gap-2 text-[11px] text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeTreatments}
                    onChange={(e) => setIncludeTreatments(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Traitements récents prescrits ({prescriptions.length} ordonnance{prescriptions.length > 1 ? 's' : ''})</span>
                </label>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                id="generate-download-pdf-btn"
                onClick={handleDownloadPdf}
                disabled={isExporting}
                className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <FileDown className="w-4 h-4" />
                <span>{isExporting ? 'Génération...' : 'Télécharger la Lettre (PDF)'}</span>
              </button>

              <button
                type="button"
                onClick={handleCopyText}
                className="py-2.5 px-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Copier le texte complet"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copié' : 'Copier'}</span>
              </button>
            </div>
          </div>

          {/* Right Column: Live Printable A4 Document Preview (7 cols) */}
          <div
            className={`lg:col-span-7 p-4 sm:p-6 overflow-y-auto flex items-start justify-center bg-slate-100/70 print:p-0 print:m-0 print:w-full print:block print:max-w-none ${
              activeTab === 'editor' ? 'hidden lg:flex' : 'flex'
            }`}
          >
            {/* The printable A4 Sheet */}
            <div className="printable-area bg-white text-slate-900 shadow-lg border border-slate-300 rounded-xl p-8 max-w-2xl w-full min-h-[750px] flex flex-col justify-between font-sans space-y-6 print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none print:min-h-0 print:block">
              
              <div className="space-y-5">
                {/* 1. Doctor & Clinic Letterhead */}
                <div className="flex justify-between items-start border-b-2 border-indigo-600 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      {doctor.title} {doctor.name}
                    </h3>
                    <p className="text-xs font-semibold text-indigo-700">{doctor.specialty || 'Médecine Générale'}</p>
                    <p className="text-[11px] text-slate-600 mt-1">{doctor.address}</p>
                    <p className="text-[11px] text-slate-600">{doctor.city || 'Dakar'}</p>
                    <p className="text-[11px] text-slate-600">Tél : {doctor.phone}</p>
                  </div>
                  <div className="text-right text-[11px] text-slate-600 space-y-0.5">
                    <p className="font-bold text-slate-800">
                      Fait à {doctor.city || 'Dakar'}, le {todayFr}
                    </p>
                  </div>
                </div>

                {/* 2. Top Title & Recipient Block */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                  {/* Title & Urgency */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 block">
                      LETTRE DE LIAISON MÉDICALE
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 leading-snug">
                      Demande d'avis spécialisé en {effectiveSpecialty}
                    </h4>
                    {urgency === 'urgence' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        <AlertTriangle className="w-3 h-3 text-rose-600" />
                        URGENCE RELATIVE (&lt; 48h)
                      </span>
                    )}
                    {urgency === 'prioritaire' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        <Clock className="w-3 h-3 text-amber-600" />
                        AVIS PRIORITAIRE (&lt; 15 jours)
                      </span>
                    )}
                    {urgency === 'routine' && (
                      <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-600">
                        Consultation programmée
                      </span>
                    )}
                  </div>

                  {/* Recipient Frame */}
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs space-y-0.5">
                    <p className="text-[10px] font-bold uppercase text-slate-400">À l'attention de :</p>
                    <p className="font-bold text-slate-900 text-sm">{recipientTitle}</p>
                    <p className="font-medium text-slate-700">Spécialité : {effectiveSpecialty}</p>
                    {institution && <p className="text-[11px] text-slate-500">{institution}</p>}
                  </div>
                </div>

                {/* 3. Patient Identity Banner */}
                <div className="bg-slate-100/90 rounded-lg p-3 border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-600" />
                      <span>
                        {patient.lastName.toUpperCase()} {patient.firstName}
                      </span>
                    </span>
                    <span className="text-slate-600 font-semibold text-[11px]">
                      {patient.gender === 'M' ? 'Homme' : 'Femme'}, {age} ans (Né(e) le {formatDateFr(patient.birthDate)})
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-600 flex flex-wrap gap-x-4 gap-y-0.5 pt-0.5">
                    <span>Tél : {patient.phone}</span>
                    {patient.ssn && <span>NIN / CNI : {patient.ssn}</span>}
                    {patient.bloodGroup && <span>Groupe : {patient.bloodGroup}</span>}
                  </div>

                  {includeHistory && (
                    <div className="text-[11px] text-slate-700 border-t border-slate-200/80 pt-1.5 mt-1 space-y-0.5">
                      <p>
                        <strong className="text-slate-800">Allergies :</strong>{' '}
                        {patient.allergies?.length ? patient.allergies.join(', ') : 'Aucune connue'}
                      </p>
                      <p>
                        <strong className="text-slate-800">Antécédents :</strong>{' '}
                        {patient.medicalHistory?.length ? patient.medicalHistory.join(', ') : 'Néant'}
                      </p>
                      <p>
                        <strong className="text-slate-800">Traitements chroniques :</strong>{' '}
                        {patient.chronicTreatments?.length ? patient.chronicTreatments.join(', ') : 'Aucun'}
                      </p>
                    </div>
                  )}
                </div>

                {/* 4. Recent Vitals Banner (if enabled) */}
                {includeVitals && activeConsultation?.vitals && (
                  <div className="bg-amber-50/70 border border-amber-200/80 rounded-lg p-2.5 text-xs text-amber-950 flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-1.5 font-bold text-amber-900">
                      <Heart className="w-3.5 h-3.5 text-amber-700" />
                      <span>Constantes du {formatDateShortFr(activeConsultation.date)} :</span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-800 flex-wrap">
                      {activeConsultation.vitals.systolicBp && activeConsultation.vitals.diastolicBp && (
                        <span>TA : <strong>{activeConsultation.vitals.systolicBp}/{activeConsultation.vitals.diastolicBp}</strong> mmHg</span>
                      )}
                      {activeConsultation.vitals.heartRate && (
                        <span>Pouls : <strong>{activeConsultation.vitals.heartRate}</strong> bpm</span>
                      )}
                      {activeConsultation.vitals.temperature && (
                        <span>T° : <strong>{activeConsultation.vitals.temperature}</strong> °C</span>
                      )}
                      {activeConsultation.vitals.weight && (
                        <span>Poids : <strong>{activeConsultation.vitals.weight}</strong> kg</span>
                      )}
                      {activeConsultation.vitals.bloodSugar && (
                        <span>Glycémie : <strong>{activeConsultation.vitals.bloodSugar}</strong> g/L</span>
                      )}
                    </div>
                  </div>
                )}

                {/* 5. Letter Clinical Narrative Body */}
                <div className="text-xs text-slate-800 space-y-3.5 leading-relaxed">
                  <p className="font-bold text-slate-900">{recipientTitle}</p>

                  <p>
                    Je vous adresse ce jour en consultation spécialisée{' '}
                    <strong>{patient.gender === 'M' ? 'Monsieur' : 'Madame'} {patient.lastName.toUpperCase()} {patient.firstName}</strong>,{' '}
                    âgé(e) de {age} ans, pour le motif suivant :
                  </p>

                  {/* Motif highlight */}
                  <div className="bg-indigo-50/70 border-l-4 border-indigo-600 p-2.5 rounded-r-lg text-xs font-semibold text-indigo-950">
                    Motif d'adressage : <span className="font-bold">{reason || 'Avis spécialisé'}</span>
                  </div>

                  {/* SOAP Summary from Consultation */}
                  {includeSoap && activeConsultation && (
                    <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50 space-y-1.5 text-[11px]">
                      <div className="font-bold text-slate-800 uppercase tracking-wide text-[10px] flex items-center justify-between">
                        <span>Résumé clinique (Consultation du {formatDateFr(activeConsultation.date)})</span>
                      </div>
                      {activeConsultation.soap.subjective && (
                        <p>
                          <strong className="text-slate-900">Anamnèse :</strong> {activeConsultation.soap.subjective}
                        </p>
                      )}
                      {activeConsultation.soap.objective && (
                        <p>
                          <strong className="text-slate-900">Examen physique :</strong> {activeConsultation.soap.objective}
                        </p>
                      )}
                      {activeConsultation.soap.assessment && (
                        <p>
                          <strong className="text-slate-900">Hypothèse diagnostique :</strong> {activeConsultation.soap.assessment}
                        </p>
                      )}
                      {activeConsultation.soap.plan && (
                        <p>
                          <strong className="text-slate-900">Conduite initiale / Traitement :</strong> {activeConsultation.soap.plan}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Treatments list if any */}
                  {includeTreatments && prescriptions.length > 0 && (
                    <div className="text-[11px] p-2 bg-slate-50 rounded-lg border border-slate-200">
                      <strong className="text-slate-800">Traitements récents prescrits (le {formatDateShortFr(prescriptions[0].date)}) : </strong>
                      <span className="text-slate-700">
                        {prescriptions[0].medications.map((m) => `${m.name} (${m.dosage})`).join(', ')}
                      </span>
                    </div>
                  )}

                  {/* Precise question */}
                  <div className="space-y-1 pt-1">
                    <p className="font-bold text-slate-900">Objet de la demande d'avis :</p>
                    <p className="text-slate-700 font-medium italic pl-2 border-l-2 border-slate-300">
                      « {clinicalQuestion || 'Avis spécialisé et conduite à tenir.'} »
                    </p>
                  </div>

                  {/* Custom notes if present */}
                  {customNotes && (
                    <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-200">
                      <strong>Remarque :</strong> {customNotes}
                    </div>
                  )}

                  <p className="pt-1">
                    Je vous remercie vivement par avance pour votre précieux accueil confraternel ainsi que pour vos recommandations spécialisées en retour.
                  </p>
                </div>
              </div>

              {/* 6. Signature & Practitioner Stamp */}
              <div className="pt-4 border-t border-slate-200 flex justify-between items-end text-xs print-avoid-break">
                <div className="text-[10px] text-slate-400 max-w-[260px]">
                  Document confidentiel soumis au secret médical professionnel (Code de Déontologie Médicale).
                </div>

                <div className="text-right space-y-1">
                  <p className="font-bold text-slate-900">Confraternellement,</p>
                  <p className="font-bold text-indigo-900 text-sm">
                    {doctor.title} {doctor.name}
                  </p>
                  <p className="text-[11px] text-slate-600">{doctor.specialty || 'Médecin Généraliste'}</p>
                  <div className="mt-2 w-44 h-14 border border-dashed border-slate-300 rounded-lg flex items-center justify-center text-[10px] text-slate-400 bg-slate-50/50">
                    [ Signature & Cachet ]
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Bar */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between no-print text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span className="hidden sm:inline">Pré-rempli avec le dossier patient et les notes cliniques SOAP.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-medium cursor-pointer"
            >
              Fermer
            </button>
            <button
              type="button"
              id="download-referral-pdf-bottom-btn"
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>{isExporting ? 'Génération...' : 'Télécharger le PDF (.pdf)'}</span>
            </button>
          </div>
        </div>
    </Modal>
  );
};
