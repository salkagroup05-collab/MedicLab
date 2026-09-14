import { jsPDF } from 'jspdf';
import { Appointment, DoctorProfile, Patient, Consultation, Prescription, ReferralLetterData } from '../types';
import { calculateAge, formatDateFr, formatDateShortFr, formatTimeFr, getTodayDateString } from './dateUtils';
import { formatFCFA } from './currencyUtils';
import { APPOINTMENT_TYPE_CONFIG } from '../constants';

export interface PdfExportOptions {
  includeVitals?: boolean;
  includeSoapNotes?: boolean;
  includePrescriptions?: boolean;
  includeMedicalHistory?: boolean;
  includeAppointments?: boolean;
}

export function generatePatientDossierPdf(
  patient: Patient,
  doctor: DoctorProfile,
  consultations: Consultation[],
  prescriptions: Prescription[],
  appointments: Appointment[] = [],
  options: PdfExportOptions = {
    includeVitals: true,
    includeSoapNotes: true,
    includePrescriptions: true,
    includeMedicalHistory: true,
    includeAppointments: true,
  }
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let cursorY = margin;

  const checkPageBreak = (neededHeight: number) => {
    if (cursorY + neededHeight > pageHeight - 20) {
      doc.addPage();
      cursorY = margin;
      drawMiniHeader();
    }
  };

  const drawMiniHeader = () => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(130, 140, 155);
    doc.text(
      `Dossier Médical : ${patient.lastName.toUpperCase()} ${patient.firstName} | ${doctor.title} ${doctor.name}`,
      margin,
      10
    );
    doc.setDrawColor(220, 226, 235);
    doc.setLineWidth(0.2);
    doc.line(margin, 12, pageWidth - margin, 12);
  };

  // Suit le contour d'un encadré (carte consultation/ordonnance) dont le contenu peut être
  // interrompu par un saut de page : ferme proprement l'encadré avant de tourner la page et
  // en rouvre un nouveau sur la page suivante, plutôt que de laisser le texte déborder en bas
  // de page ou de dessiner un encadré incohérent à cheval sur deux pages.
  const makeBoxTracker = () => {
    let startY = cursorY;
    const drawBox = (endY: number) => {
      const h = endY - startY + 3;
      if (h > 0) {
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        doc.roundedRect(margin, startY, contentWidth, h, 1.5, 1.5, 'D');
      }
    };
    return {
      reset: () => {
        startY = cursorY;
      },
      breakIfNeeded: (neededHeight: number, continuationLabel?: string) => {
        if (cursorY + neededHeight > pageHeight - 20) {
          drawBox(cursorY);
          doc.addPage();
          cursorY = margin;
          drawMiniHeader();
          if (continuationLabel) {
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(7.5);
            doc.setTextColor(148, 163, 184);
            doc.text(continuationLabel, margin + 4, cursorY + 4);
            cursorY += 7;
          }
          startY = cursorY;
        }
      },
      close: () => drawBox(cursorY),
    };
  };

  // --- 1. En-tête Médical (Cabinet & Praticien) ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(20, 35, 60);
  doc.text(`${doctor.title} ${doctor.name}`, margin, cursorY);
  cursorY += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(70, 90, 120);
  doc.text(doctor.specialty || 'Médecine Générale', margin, cursorY);
  cursorY += 4;

  if (doctor.address) {
    doc.text(`${doctor.address} - ${doctor.city || ''}`, margin, cursorY);
    cursorY += 4;
  }
  doc.text(`Tél : ${doctor.phone || 'Non renseigné'} | Email : ${doctor.email || ''}`, margin, cursorY);
  cursorY += 4;

  // Ordre et Numéros légaux à droite
  const rightColX = pageWidth - margin;
  let rightY = margin;
  doc.setFontSize(8);
  doc.setTextColor(100, 115, 130);
  if (doctor.professionalOrderNumber) {
    doc.text(`N° Ordre : ${doctor.professionalOrderNumber}`, rightColX, rightY, { align: 'right' });
    rightY += 4;
  }
  if (doctor.ninea) {
    doc.text(`N° NINEA : ${doctor.ninea}`, rightColX, rightY, { align: 'right' });
    rightY += 4;
  }
  doc.text(`Édité le : ${formatDateFr(getTodayDateString())}`, rightColX, rightY, { align: 'right' });

  cursorY = Math.max(cursorY, rightY + 3);

  // Ligne de séparation
  doc.setDrawColor(37, 99, 235); // Bleu médical
  doc.setLineWidth(0.8);
  doc.line(margin, cursorY, pageWidth - margin, cursorY);
  cursorY += 6;

  // --- 2. Titre du Document & Mention de Confidentialité ---
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, cursorY, contentWidth, 14, 2, 2, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('DOSSIER MÉDICAL DU PATIENT & HISTORIQUE COMPLET', margin + 4, cursorY + 5.5);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('DOCUMENT MÉDICAL CONFIDENTIEL - SOUMIS AU SECRET PROFESSIONNEL (Art. L. 1110-4)', margin + 4, cursorY + 10.5);
  cursorY += 18;

  // --- 3. Fiche d'identification Patient ---
  checkPageBreak(38);
  const age = calculateAge(patient.birthDate);
  const colWidth = (contentWidth / 2) - 4;
  const col1X = margin + 5;
  const col2X = margin + (contentWidth / 2) + 2;

  // Préparer les textes des colonnes pour éviter tout débordement
  const ssnLabel = `• Identifiant (NIN/CNI) : ${patient.ssn || 'Non renseigné'}`;
  const splitSsn = doc.splitTextToSize(ssnLabel, colWidth);
  
  let emergencyLines: string[] = [];
  if (patient.emergencyContact) {
    const emergText = `• Contact urgence : ${patient.emergencyContact.name} (${patient.emergencyContact.relationship}) - ${patient.emergencyContact.phone}`;
    emergencyLines = doc.splitTextToSize(emergText, colWidth);
  }

  const patientCardHeight = Math.max(34, 26 + emergencyLines.length * 3.8);

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, cursorY, contentWidth, patientCardHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`${patient.lastName.toUpperCase()} ${patient.firstName}`, margin + 5, cursorY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.2);
  doc.setTextColor(51, 65, 85);
  
  doc.text(`• Date de naissance : ${formatDateFr(patient.birthDate)} (${age} ans)`, col1X, cursorY + 13);
  doc.text(`• Sexe : ${patient.gender === 'M' ? 'Masculin' : patient.gender === 'F' ? 'Féminin' : 'Autre'}`, col1X, cursorY + 18);
  doc.text(splitSsn[0], col1X, cursorY + 23);
  if (patient.bloodGroup) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(185, 28, 28);
    doc.text(`• Groupe Sanguin : ${patient.bloodGroup}`, col1X, cursorY + 28);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
  }

  doc.text(`• Téléphone : ${patient.phone || 'Non renseigné'}`, col2X, cursorY + 13);
  doc.text(`• Email : ${patient.email || 'Non renseigné'}`, col2X, cursorY + 18);
  doc.text(`• Adresse : ${patient.address || 'Non renseignée'}`, col2X, cursorY + 23);
  if (emergencyLines.length > 0) {
    doc.text(emergencyLines, col2X, cursorY + 28);
  }
  cursorY += patientCardHeight + 5;

  // --- 4. Alertes Médicales & Antécédents ---
  if (options.includeMedicalHistory) {
    checkPageBreak(32);

    const hasAllergies = Boolean(patient.allergies && patient.allergies.length > 0);
    const allergiesText = hasAllergies ? patient.allergies.join(', ') : 'Aucune allergie connue déclarée';
    const splitAllergies = doc.splitTextToSize(allergiesText, contentWidth / 2 - 10);

    const hasChronic = Boolean(patient.chronicTreatments && patient.chronicTreatments.length > 0);
    const chronicText = hasChronic ? patient.chronicTreatments.join(', ') : 'Aucun traitement de fond actif';
    const splitChronic = doc.splitTextToSize(chronicText, contentWidth / 2 - 10);

    const alertBoxHeight = Math.max(22, 12 + Math.max(splitAllergies.length, splitChronic.length) * 3.8);

    // Allergies
    doc.setFillColor(hasAllergies ? 254 : 248, hasAllergies ? 242 : 250, hasAllergies ? 242 : 252);
    doc.setDrawColor(hasAllergies ? 252 : 226, hasAllergies ? 165 : 232, hasAllergies ? 165 : 240);
    doc.roundedRect(margin, cursorY, contentWidth / 2 - 2, alertBoxHeight, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(hasAllergies ? 153 : 71, hasAllergies ? 27 : 85, hasAllergies ? 27 : 105);
    doc.text('ALLERGIES & INTOLÉRANCES', margin + 4, cursorY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.8);
    doc.setTextColor(hasAllergies ? 185 : 100, hasAllergies ? 28 : 116, hasAllergies ? 28 : 139);
    doc.text(splitAllergies, margin + 4, cursorY + 11);

    // Traitements Chroniques
    doc.setFillColor(hasChronic ? 254 : 248, hasChronic ? 243 : 250, hasChronic ? 199 : 252);
    doc.setDrawColor(hasChronic ? 251 : 226, hasChronic ? 191 : 232, hasChronic ? 36 : 240);
    doc.roundedRect(margin + contentWidth / 2 + 2, cursorY, contentWidth / 2 - 2, alertBoxHeight, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(hasChronic ? 146 : 71, hasChronic ? 64 : 85, hasChronic ? 14 : 105);
    doc.text('TRAITEMENTS AU LONG COURS', margin + contentWidth / 2 + 6, cursorY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.8);
    doc.setTextColor(hasChronic ? 180 : 100, hasChronic ? 83 : 116, hasChronic ? 9 : 139);
    doc.text(splitChronic, margin + contentWidth / 2 + 6, cursorY + 11);

    cursorY += alertBoxHeight + 4;

    // Antécédents Médico-Chirurgicaux
    checkPageBreak(22);
    const historyText =
      patient.medicalHistory && patient.medicalHistory.length > 0
        ? patient.medicalHistory.join(' • ')
        : 'Aucun antécédent particulier répertorié';
    const splitHist = doc.splitTextToSize(historyText, contentWidth - 8);
    const histBoxHeight = Math.max(18, 10 + splitHist.length * 3.8);

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, cursorY, contentWidth, histBoxHeight, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text('ANTÉCÉDENTS MÉDICO-CHIRURGICAUX & FAMILIAUX', margin + 4, cursorY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.8);
    doc.setTextColor(71, 85, 105);
    doc.text(splitHist, margin + 4, cursorY + 11);

    cursorY += histBoxHeight + 5;
  }

  // --- 5. Historique Récapitulatif des Rendez-vous & Statut de Paiement ---
  if (options.includeAppointments && appointments && appointments.length > 0) {
    checkPageBreak(30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(30, 58, 138); // Bleu soutenu
    doc.text(`HISTORIQUE DES RENDEZ-VOUS & RÈGLEMENTS (${appointments.length})`, margin, cursorY);
    cursorY += 5;

    // En-tête du tableau récapitulatif
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, cursorY, contentWidth, 7, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.2);
    doc.line(margin, cursorY + 7, margin + contentWidth, cursorY + 7);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    doc.text('Date & Heure', margin + 3, cursorY + 4.5);
    doc.text('Type & Motif', margin + 34, cursorY + 4.5);
    doc.text('Statut RDV', margin + 86, cursorY + 4.5);
    doc.text('Honoraires', margin + 112, cursorY + 4.5);
    doc.text('Statut Paiement', margin + 140, cursorY + 4.5);
    cursorY += 8;

    const sortedAppointments = [...appointments].sort(
      (a, b) =>
        new Date(`${b.date}T${b.startTime || '00:00'}`).getTime() -
        new Date(`${a.date}T${a.startTime || '00:00'}`).getTime()
    );

    let sumBilled = 0;
    let sumPaid = 0;

    sortedAppointments.forEach((apt, idx) => {
      checkPageBreak(8);
      const fee = apt.fee || doctor.consultationFee || 0;
      sumBilled += fee;
      if (apt.isPaid) sumPaid += fee;

      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, cursorY - 1, contentWidth, 7, 'F');
      }

      // Date & Heure
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`${formatDateShortFr(apt.date)} ${formatTimeFr(apt.startTime)}`, margin + 3, cursorY + 3.8);

      // Type & Motif
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.2);
      doc.setTextColor(51, 65, 85);
      const typeLabel = APPOINTMENT_TYPE_CONFIG[apt.type]?.label ?? apt.type;
      const motifText = `${typeLabel} - ${apt.reason || 'Général'}`;
      const motifLines = doc.splitTextToSize(motifText, 50);
      const motifDisplay = motifLines.length > 1 ? `${doc.splitTextToSize(motifText, 46)[0]}…` : motifLines[0];
      doc.text(motifDisplay, margin + 34, cursorY + 3.8);

      // Statut RDV
      const statusLabel =
        apt.status === 'completed'
          ? 'Terminé'
          : apt.status === 'confirmed'
          ? 'Confirmé'
          : apt.status === 'waiting'
          ? 'Attente'
          : apt.status === 'in_progress'
          ? 'En cours'
          : apt.status === 'cancelled'
          ? 'Annulé'
          : 'Absent';
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(
        apt.status === 'completed'
          ? 22
          : apt.status === 'cancelled'
          ? 148
          : apt.status === 'no_show'
          ? 185
          : 30,
        apt.status === 'completed'
          ? 101
          : apt.status === 'cancelled'
          ? 163
          : apt.status === 'no_show'
          ? 28
          : 58,
        apt.status === 'completed'
          ? 52
          : apt.status === 'cancelled'
          ? 184
          : apt.status === 'no_show'
          ? 28
          : 138
      );
      doc.text(statusLabel, margin + 86, cursorY + 3.8);

      // Honoraires
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(formatFCFA(fee, { abbreviated: true }), margin + 112, cursorY + 3.8);

      // Statut Paiement
      if (apt.isPaid) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(22, 101, 52); // Vert émeraude
        const method =
          apt.paymentMethod === 'wave'
            ? 'Wave'
            : apt.paymentMethod === 'orange_money'
            ? 'OM'
            : apt.paymentMethod === 'especes'
            ? 'Espèces'
            : apt.paymentMethod === 'carte'
            ? 'Carte'
            : apt.paymentMethod === 'cheque'
            ? 'Chèque'
            : apt.paymentMethod === 'mutuelle_ipm'
            ? 'IPM'
            : apt.paymentMethod === 'tiers_payant'
            ? 'Tiers-P'
            : 'Réglé';
        doc.text(`Payé (${method})`, margin + 140, cursorY + 3.8);
      } else {
        doc.setFont('helvetica', 'bold');
        if (apt.status === 'cancelled') {
          doc.setTextColor(148, 163, 184);
          doc.text('Non dû', margin + 140, cursorY + 3.8);
        } else {
          doc.setTextColor(180, 83, 9); // Ambre foncé
          doc.text('En attente', margin + 140, cursorY + 3.8);
        }
      }

      cursorY += 7;
    });

    // Ligne de synthèse financière
    checkPageBreak(9);
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, cursorY, contentWidth, 7.5, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.line(margin, cursorY, margin + contentWidth, cursorY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    doc.text('BILAN FINANCIER :', margin + 3, cursorY + 5);

    doc.setTextColor(71, 85, 105);
    doc.text(`Total facturé : ${formatFCFA(sumBilled)}`, margin + 34, cursorY + 5);

    doc.setTextColor(22, 101, 52);
    doc.text(`Réglé : ${formatFCFA(sumPaid)}`, margin + 84, cursorY + 5);

    const soldeRestant = sumBilled - sumPaid;
    doc.setTextColor(soldeRestant > 0 ? 180 : 71, soldeRestant > 0 ? 83 : 85, soldeRestant > 0 ? 9 : 105);
    doc.text(
      `Solde restant : ${formatFCFA(soldeRestant)}`,
      margin + 128,
      cursorY + 5
    );

    cursorY += 12;
  }

  // --- 6. Historique Chronologique des Consultations ---
  checkPageBreak(25);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(30, 58, 138); // Bleu soutenu
  doc.text(`HISTORIQUE DES CONSULTATIONS CLINIQUE (${consultations.length})`, margin, cursorY);
  cursorY += 5;

  if (consultations.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(148, 163, 184);
    doc.text('Aucune consultation enregistrée à ce jour.', margin + 2, cursorY);
    cursorY += 8;
  } else {
    // Trier par date décroissante
    const sortedConsultations = [...consultations].sort(
      (a, b) => new Date(`${b.date}T${b.time || '00:00'}`).getTime() - new Date(`${a.date}T${a.time || '00:00'}`).getTime()
    );

    sortedConsultations.forEach((c) => {
      // Espace minimal pour démarrer la carte (en-tête + motif) sur la page courante
      checkPageBreak(14);

      const consultationLabel = `Consultation du ${formatDateFr(c.date)} à ${formatTimeFr(c.time || '09:00')}`;
      const box = makeBoxTracker();

      // En-tête de la consultation
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(consultationLabel, margin + 4, cursorY + 5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text(`Motif : ${c.reason || 'Consultation de suivi'}`, margin + 4, cursorY + 9.5);
      cursorY += 12;
      box.reset();

      // Constantes Vitales
      if (options.includeVitals && c.vitals) {
        const vitalsParts: string[] = [];
        if (c.vitals.systolicBp && c.vitals.diastolicBp) {
          vitalsParts.push(`TA: ${c.vitals.systolicBp}/${c.vitals.diastolicBp} mmHg`);
        }
        if (c.vitals.heartRate) vitalsParts.push(`Pouls: ${c.vitals.heartRate} bpm`);
        if (c.vitals.temperature) vitalsParts.push(`T°: ${c.vitals.temperature} °C`);
        if (c.vitals.weight) vitalsParts.push(`Poids: ${c.vitals.weight} kg`);
        if (c.vitals.height) vitalsParts.push(`Taille: ${c.vitals.height} cm`);
        if (c.vitals.bloodSugar) vitalsParts.push(`Glycémie: ${c.vitals.bloodSugar} g/L`);

        if (vitalsParts.length > 0) {
          box.breakIfNeeded(8, `${consultationLabel} (suite)`);
          doc.setFillColor(241, 245, 249);
          doc.rect(margin + 4, cursorY, contentWidth - 8, 6, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.5);
          doc.setTextColor(30, 41, 59);
          doc.text(`Constantes : ${vitalsParts.join('  |  ')}`, margin + 6, cursorY + 4.2);
          cursorY += 8;
        }
      }

      // Notes SOAP - chaque champ vérifie sa propre hauteur réelle avant d'être dessiné,
      // et déclenche un saut de page propre (fermeture/réouverture de l'encadré) si besoin,
      // plutôt qu'une estimation forfaitaire calculée une seule fois pour tout le bloc.
      if (options.includeSoapNotes && c.soap) {
        doc.setFontSize(7.8);

        const renderSoapField = (label: string, text: string | undefined, r: number, g: number, b: number) => {
          if (!text) return;
          const lines = doc.splitTextToSize(text, contentWidth - 36);
          const neededHeight = lines.length * 3.8 + 1.5;
          box.breakIfNeeded(neededHeight, `${consultationLabel} (suite)`);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(r, g, b);
          doc.text(label, margin + 4, cursorY);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(51, 65, 85);
          doc.text(lines, margin + 33, cursorY);
          cursorY += neededHeight;
        };

        renderSoapField('• S (Subjectif) :', c.soap.subjective, 30, 58, 138);
        renderSoapField('• O (Objectif) :', c.soap.objective, 20, 83, 45);
        renderSoapField('• A (Diagnostic) :', c.soap.assessment, 146, 64, 14);
        renderSoapField('• P (Plan soins) :', c.soap.plan, 107, 33, 168);
      }

      box.close();
      cursorY += 5;
    });
  }

  // --- 6. Historique des Ordonnances Délivrées ---
  if (options.includePrescriptions) {
    checkPageBreak(25);
    cursorY += 2;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(79, 70, 229); // Indigo
    doc.text(`ORDONNANCES & TRAITEMENTS DÉLIVRÉS (${prescriptions.length})`, margin, cursorY);
    cursorY += 6;

    if (prescriptions.length === 0) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8.5);
      doc.setTextColor(148, 163, 184);
      doc.text('Aucune ordonnance émise pour ce patient.', margin + 2, cursorY);
      cursorY += 8;
    } else {
      prescriptions.forEach((presc) => {
        checkPageBreak(12);

        const prescLabel = `Ordonnance du ${formatDateFr(presc.date)}`;
        const box = makeBoxTracker();

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(15, 23, 42);
        doc.text(prescLabel, margin + 4, cursorY + 5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text(`(${presc.medications.length} médicament${presc.medications.length > 1 ? 's' : ''})`, margin + 65, cursorY + 5);
        cursorY += 9;
        box.reset();

        presc.medications.forEach((med, mIdx) => {
          box.breakIfNeeded(3.8, `${prescLabel} (suite)`);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(30, 41, 59);
          doc.text(`${mIdx + 1}. ${med.name}`, margin + 6, cursorY);
          cursorY += 3.8;

          const details = [med.dosage, med.frequency, med.duration].filter(Boolean).join('  •  ');
          if (details) {
            const splitDetails = doc.splitTextToSize(`Posologie : ${details}`, contentWidth - 16);
            box.breakIfNeeded(splitDetails.length * 3.5 + 1, `${prescLabel} (suite)`);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7.5);
            doc.setTextColor(71, 85, 105);
            doc.text(splitDetails, margin + 10, cursorY);
            cursorY += splitDetails.length * 3.5 + 1;
          }
          if (med.instructions) {
            const splitInst = doc.splitTextToSize(`Consignes : ${med.instructions}`, contentWidth - 16);
            box.breakIfNeeded(splitInst.length * 3.2 + 1, `${prescLabel} (suite)`);
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(7);
            doc.setTextColor(100, 116, 139);
            doc.text(splitInst, margin + 10, cursorY);
            cursorY += splitInst.length * 3.2 + 1;
          }
          cursorY += 1;
        });

        if (presc.recommendations) {
          const splitRec = doc.splitTextToSize(`Recommandations : ${presc.recommendations}`, contentWidth - 12);
          box.breakIfNeeded(splitRec.length * 3.4 + 2, `${prescLabel} (suite)`);
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(7.2);
          doc.setTextColor(100, 116, 139);
          doc.text(splitRec, margin + 6, cursorY);
          cursorY += splitRec.length * 3.4 + 2;
        }

        box.close();
        cursorY += 5;
      });
    }
  }

  // --- 7. Signature & Cachet du Praticien (En fin de document) ---
  checkPageBreak(30);
  cursorY += 4;
  const signY = cursorY;

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.line(margin, signY, pageWidth - margin, signY);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'Ce document constitue une synthèse médicale officielle extraite du dossier patient informatisé.',
    margin,
    signY + 5
  );

  // Bloc signature à droite
  const stampX = pageWidth - margin - 50;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text('Signature & Cachet du Médecin :', stampX, signY + 6);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(10);
  doc.setTextColor(30, 58, 138);
  doc.text(`${doctor.title} ${doctor.name}`, stampX, signY + 14);

  if (doctor.professionalOrderNumber) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`N° Ordre : ${doctor.professionalOrderNumber}`, stampX, signY + 19);
  }

  // --- Numérotation de toutes les pages ---
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Dossier Médical - ${patient.lastName.toUpperCase()} ${patient.firstName} | Page ${i} sur ${totalPages}`,
      margin,
      pageHeight - 8
    );
    doc.text(
      `Cabinet Médical : ${doctor.title} ${doctor.name} - ${doctor.city || ''}`,
      pageWidth - margin,
      pageHeight - 8,
      { align: 'right' }
    );
  }

  return doc;
}

export function downloadPatientDossierPdf(
  patient: Patient,
  doctor: DoctorProfile,
  consultations: Consultation[],
  prescriptions: Prescription[],
  appointments: Appointment[] = [],
  options?: PdfExportOptions
): void {
  const doc = generatePatientDossierPdf(patient, doctor, consultations, prescriptions, appointments, options);
  const cleanLastName = patient.lastName.replace(/[^a-zA-Z0-9]/g, '_');
  const cleanFirstName = patient.firstName.replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `Dossier_Medical_${cleanLastName}_${cleanFirstName}_${getTodayDateString()}.pdf`;
  doc.save(fileName);
}

/**
 * Générateur PDF pour la lettre d'orientation spécialisée (Courrier confraternel)
 */
export function generateReferralLetterPdf(
  patient: Patient,
  doctor: DoctorProfile,
  letterData: ReferralLetterData,
  referenceConsultation?: Consultation,
  prescriptions: Prescription[] = []
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let cursorY = margin;

  const checkPageBreak = (neededHeight: number) => {
    if (cursorY + neededHeight > pageHeight - 20) {
      doc.addPage();
      cursorY = margin + 8;
      // Entête de report sur les pages suivantes
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(140, 150, 165);
      doc.text(
        `Lettre d'orientation - ${patient.lastName.toUpperCase()} ${patient.firstName} | ${doctor.title} ${doctor.name} -> ${letterData.specialty}`,
        margin,
        10
      );
      doc.setDrawColor(220, 226, 235);
      doc.setLineWidth(0.2);
      doc.line(margin, 12, pageWidth - margin, 12);
    }
  };

  // --- 1. En-tête Cabinet / Médecin Émetteur ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(20, 35, 60);
  doc.text(`${doctor.title} ${doctor.name}`, margin, cursorY);
  cursorY += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(70, 90, 120);
  doc.text(doctor.specialty || 'Médecine Générale', margin, cursorY);
  cursorY += 4;

  if (doctor.address) {
    doc.text(`${doctor.address} - ${doctor.city || ''}`, margin, cursorY);
    cursorY += 4;
  }
  doc.text(`Tél : ${doctor.phone || 'Non renseigné'} | Email : ${doctor.email || ''}`, margin, cursorY);
  cursorY += 4;

  // Colonne droite : Numéros légaux & Date
  const rightColX = pageWidth - margin;
  let rightY = margin;
  doc.setFontSize(8);
  doc.setTextColor(100, 115, 130);
  if (doctor.professionalOrderNumber) {
    doc.text(`N° Ordre : ${doctor.professionalOrderNumber}`, rightColX, rightY, { align: 'right' });
    rightY += 4;
  }
  if (doctor.ninea) {
    doc.text(`N° NINEA : ${doctor.ninea}`, rightColX, rightY, { align: 'right' });
    rightY += 4;
  }
  const dateFormatted = formatDateFr(letterData.date || getTodayDateString());
  const cityText = letterData.doctorCity || doctor.city || 'Dakar';
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(`Fait à ${cityText}, le ${dateFormatted}`, rightColX, rightY, { align: 'right' });

  cursorY = Math.max(cursorY, rightY + 5);

  // Ligne de séparation élégante
  doc.setDrawColor(37, 99, 235); // Bleu primaire
  doc.setLineWidth(0.6);
  doc.line(margin, cursorY, pageWidth - margin, cursorY);
  cursorY += 6;

  // --- 2. Bloc Destinataire (Confrère / Spécialiste) ---
  const destBoxWidth = 92;
  const destBoxX = pageWidth - margin - destBoxWidth;
  const leftColWidth = destBoxX - margin - 4;

  let instLines: string[] = [];
  if (letterData.institution) {
    instLines = doc.splitTextToSize(`Établissement : ${letterData.institution}`, destBoxWidth - 8);
  }
  const destBoxHeight = Math.max(24, 18 + instLines.length * 3.8);

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(destBoxX, cursorY, destBoxWidth, destBoxHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 58, 138); // Bleu soutenu
  doc.text('DESTINATAIRE :', destBoxX + 4, cursorY + 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(letterData.recipientTitle || 'Cher(e) Confrère,', destBoxX + 4, cursorY + 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(`Spécialité : ${letterData.specialty}`, destBoxX + 4, cursorY + 16);
  if (instLines.length > 0) {
    doc.text(instLines, destBoxX + 4, cursorY + 20.5);
  }

  // --- 3. Titre du document & Degré d'urgence (à gauche) ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("LETTRE DE LIAISON CONFRATERNELLE", margin, cursorY + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.8);
  doc.setTextColor(37, 99, 235);
  const splitReq = doc.splitTextToSize(`Demande d'avis en ${letterData.specialty}`, leftColWidth);
  doc.text(splitReq, margin, cursorY + 11.5);

  const urgencyY = cursorY + 11.5 + splitReq.length * 4;

  // Badge d'urgence
  if (letterData.urgency === 'urgence') {
    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(252, 165, 165);
    doc.roundedRect(margin, urgencyY, 58, 5.5, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);
    doc.setTextColor(185, 28, 28); // Rouge
    doc.text('URGENCE RELATIVE (< 48h)', margin + 3, urgencyY + 4);
  } else if (letterData.urgency === 'prioritaire') {
    doc.setFillColor(254, 243, 199);
    doc.setDrawColor(252, 211, 77);
    doc.roundedRect(margin, urgencyY, 58, 5.5, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);
    doc.setTextColor(180, 83, 9); // Ambre
    doc.text('AVIS PRIORITAIRE (< 15 jours)', margin + 3, urgencyY + 4);
  } else {
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(margin, urgencyY, 58, 5.5, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);
    doc.setTextColor(71, 85, 105);
    doc.text('CONSULTATION PROGRAMMÉE', margin + 3, urgencyY + 4);
  }

  cursorY += Math.max(destBoxHeight + 3, urgencyY - cursorY + 9);

  // --- 4. Encadré Patient & Antécédents ---
  const age = calculateAge(patient.birthDate);
  let terrainSummary: string;
  if (letterData.includeHistory) {
    const allergiesStr = patient.allergies && patient.allergies.length > 0 ? patient.allergies.join(', ') : 'Aucune connue';
    const atcdStr = patient.medicalHistory && patient.medicalHistory.length > 0 ? patient.medicalHistory.join(', ') : 'Néant';
    const tttStr = patient.chronicTreatments && patient.chronicTreatments.length > 0 ? patient.chronicTreatments.join(', ') : 'Aucun';
    terrainSummary = `Allergies : ${allergiesStr} | Antécédents : ${atcdStr} | Ttt chroniques : ${tttStr}`;
  } else {
    terrainSummary = 'Antécédents : Voir dossier médical complet';
  }
  const splitTerrain = doc.splitTextToSize(terrainSummary, contentWidth - 8);
  const patientBoxHeight = Math.max(20, 13 + splitTerrain.length * 3.8);

  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, cursorY, contentWidth, patientBoxHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(
    `PATIENT(E) : ${patient.lastName.toUpperCase()} ${patient.firstName} (${patient.gender === 'M' ? 'Homme' : 'Femme'}, ${age} ans)`,
    margin + 4,
    cursorY + 5.5
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(51, 65, 85);
  doc.text(
    `Né(e) le : ${formatDateFr(patient.birthDate)} | Tél : ${patient.phone} | NIN/Identifiant : ${patient.ssn || 'Non renseigné'}`,
    margin + 4,
    cursorY + 9.8
  );

  doc.text(splitTerrain, margin + 4, cursorY + 14);

  cursorY += patientBoxHeight + 4;

  // --- 5. Dernières Constantes Vitales (si demandées) ---
  if (letterData.includeVitals && referenceConsultation?.vitals) {
    const v = referenceConsultation.vitals;
    const vitalsList: string[] = [];
    if (v.systolicBp && v.diastolicBp) vitalsList.push(`TA : ${v.systolicBp}/${v.diastolicBp} mmHg`);
    if (v.heartRate) vitalsList.push(`Pouls : ${v.heartRate} bpm`);
    if (v.temperature) vitalsList.push(`T° : ${v.temperature} °C`);
    if (v.weight) vitalsList.push(`Poids : ${v.weight} kg`);
    if (v.bloodSugar) vitalsList.push(`Glycémie : ${v.bloodSugar} g/L`);

    if (vitalsList.length > 0) {
      doc.setFillColor(254, 252, 232); // Jaune très doux
      doc.setDrawColor(254, 240, 138);
      doc.roundedRect(margin, cursorY, contentWidth, 7.5, 1.5, 1.5, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(133, 77, 14);
      const vLabel = `Constantes (${formatDateShortFr(referenceConsultation.date)}) :`;
      doc.text(vLabel, margin + 3, cursorY + 5);
      
      const vLabelWidth = doc.getTextWidth(vLabel);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
      const splitVitals = doc.splitTextToSize(vitalsList.join('   •   '), contentWidth - vLabelWidth - 8);
      doc.text(splitVitals, margin + vLabelWidth + 6, cursorY + 5);
      cursorY += 10;
    }
  }

  // --- 6. Corps de la Lettre Confraternelle ---
  checkPageBreak(50);

  // Formule d'appel
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`${letterData.recipientTitle || 'Cher(e) Confrère,'}`, margin, cursorY);
  cursorY += 5.5;

  // Texte introductif & Motif
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);

  const introText = `Je vous adresse ce jour en consultation spécialisée ${patient.gender === 'M' ? 'Monsieur' : 'Madame'} ${patient.lastName.toUpperCase()} ${patient.firstName}, âgé(e) de ${age} ans, pour le motif suivant :`;
  const splitIntro = doc.splitTextToSize(introText, contentWidth);
  doc.text(splitIntro, margin, cursorY);
  cursorY += splitIntro.length * 4.5 + 1;

  // Motif mis en valeur
  const reasonText = `MOTIF D'ADRESSAGE : ${letterData.reason || 'Demande d\'avis spécialisé'}`;
  const splitReason = doc.splitTextToSize(reasonText, contentWidth - 8);
  const reasonBoxH = Math.max(7.5, 3.5 + splitReason.length * 4);
  
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, cursorY, contentWidth, reasonBoxH, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 58, 138);
  doc.text(splitReason, margin + 4, cursorY + 4.8);
  cursorY += reasonBoxH + 4;

  // Résumé Clinique / Dernières consultations
  if (letterData.includeSoap && referenceConsultation) {
    checkPageBreak(35);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`RÉSUMÉ CLINIQUE (Consultation du ${formatDateFr(referenceConsultation.date)}) :`, margin, cursorY);
    cursorY += 4.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);

    const soapParts: string[] = [];
    if (referenceConsultation.soap.subjective) {
      soapParts.push(`• Histoire de la maladie / Anamnèse : ${referenceConsultation.soap.subjective}`);
    }
    if (referenceConsultation.soap.objective) {
      soapParts.push(`• Examen clinique : ${referenceConsultation.soap.objective}`);
    }
    if (referenceConsultation.soap.assessment) {
      soapParts.push(`• Hypothèse diagnostique : ${referenceConsultation.soap.assessment}`);
    }
    if (referenceConsultation.soap.plan) {
      soapParts.push(`• Conduite initiale / Traitement d'épreuve : ${referenceConsultation.soap.plan}`);
    }

    soapParts.forEach((part) => {
      const splitPart = doc.splitTextToSize(part, contentWidth - 4);
      checkPageBreak(splitPart.length * 4 + 1);
      doc.text(splitPart, margin + 2, cursorY);
      cursorY += splitPart.length * 4 + 1;
    });
    cursorY += 2;
  }

  // Traitements actuels si demandés
  if (letterData.includeTreatments && prescriptions.length > 0) {
    checkPageBreak(20);
    const lastPrescription = prescriptions[0];
    const medsSummary = lastPrescription.medications.map((m) => `${m.name} (${m.dosage})`).join(', ');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text(`TRAITEMENTS RÉCENTS PRESCRITS (le ${formatDateShortFr(lastPrescription.date)}) :`, margin, cursorY);
    cursorY += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    const splitMeds = doc.splitTextToSize(medsSummary, contentWidth - 4);
    doc.text(splitMeds, margin + 2, cursorY);
    cursorY += splitMeds.length * 4 + 2;
  }

  // Demande / Question posée au spécialiste
  const questionText = letterData.clinicalQuestion || "Je sollicite votre avis confraternel pour confirmation diagnostique, réalisation des explorations nécessaires et adaptation de la prise en charge thérapeutique.";
  const splitQuestion = doc.splitTextToSize(questionText, contentWidth - 4);
  checkPageBreak(4.5 + splitQuestion.length * 4.5 + 4);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text("OBJET PRÉCIS DE LA DEMANDE D'AVIS :", margin, cursorY);
  cursorY += 4.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text(splitQuestion, margin + 2, cursorY);
  cursorY += splitQuestion.length * 4.5 + 4;

  // Notes additionnelles si renseignées
  if (letterData.customNotes) {
    const splitNotes = doc.splitTextToSize(letterData.customNotes, contentWidth - 4);
    checkPageBreak(4 + splitNotes.length * 4 + 3);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text("Observations particulières :", margin, cursorY);
    cursorY += 4;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(splitNotes, margin + 2, cursorY);
    cursorY += splitNotes.length * 4 + 3;
  }

  // Formule de conclusion confraternelle
  checkPageBreak(35);
  cursorY += 2;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  const politeClosing = "Je vous remercie vivement par avance pour l'accueil réservé à notre patient(e) ainsi que pour vos précieuses conclusions confraternelles en retour.";
  const splitClosing = doc.splitTextToSize(politeClosing, contentWidth);
  doc.text(splitClosing, margin, cursorY);
  cursorY += splitClosing.length * 4.5 + 6;

  // --- 7. Signature & Cachet ---
  checkPageBreak(30);
  const signX = pageWidth - margin - 75;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('Confraternellement,', signX, cursorY);
  cursorY += 5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 58, 138);
  doc.text(`${doctor.title} ${doctor.name}`, signX, cursorY);
  cursorY += 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(doctor.specialty || 'Médecin Généraliste', signX, cursorY);
  cursorY += 3.5;
  if (doctor.professionalOrderNumber) {
    doc.text(`N° Ordre : ${doctor.professionalOrderNumber}`, signX, cursorY);
    cursorY += 4;
  } else {
    cursorY += 1;
  }

  // Boîte cachet
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(signX, cursorY + 2, 70, 16, 1.5, 1.5, 'D');
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text('[ Signature & Cachet officiel du praticien ]', signX + 7, cursorY + 11);

  // --- 8. Pieds de page sur toutes les pages ---
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Lettre de liaison confraternelle - Patient : ${patient.lastName.toUpperCase()} ${patient.firstName} | Page ${i} sur ${totalPages}`,
      margin,
      pageHeight - 8
    );
    doc.text(
      `Cabinet Médical : ${doctor.title} ${doctor.name} - ${doctor.city || ''}`,
      pageWidth - margin,
      pageHeight - 8,
      { align: 'right' }
    );
  }

  return doc;
}

export function downloadReferralLetterPdf(
  patient: Patient,
  doctor: DoctorProfile,
  letterData: ReferralLetterData,
  referenceConsultation?: Consultation,
  prescriptions: Prescription[] = []
): void {
  const doc = generateReferralLetterPdf(patient, doctor, letterData, referenceConsultation, prescriptions);
  const cleanLastName = patient.lastName.replace(/[^a-zA-Z0-9]/g, '_');
  const cleanSpecialty = letterData.specialty.replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `Lettre_Orientation_${cleanLastName}_${cleanSpecialty}_${getTodayDateString()}.pdf`;
  doc.save(fileName);
}
