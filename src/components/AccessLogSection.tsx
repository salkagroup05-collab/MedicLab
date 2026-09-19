import React, { useState } from 'react';
import { History, Loader2, RefreshCw } from 'lucide-react';
import { AccessLogEntry, loadAccessLog } from '../lib/db';

const ACTION_LABELS: Record<AccessLogEntry['action'], string> = {
  insert: 'Création',
  update: 'Modification',
  delete: 'Suppression',
  view: 'Consultation',
  export: 'Export / impression',
  replace: 'Remplacement complet',
};

const ENTITY_LABELS: Record<AccessLogEntry['entity'], string> = {
  patient: 'Fiche patient',
  appointment: 'Rendez-vous',
  prescription: 'Ordonnance',
  consultation: 'Consultation',
  cabinet: 'Cabinet (import ou démo)',
};

const DOCUMENT_LABELS: Record<string, string> = {
  dossier_pdf: 'Dossier PDF',
  dossier_impression: 'Dossier imprimé',
  lettre_orientation_pdf: "Lettre d'orientation PDF",
  lettre_orientation_impression: "Lettre d'orientation imprimée",
  ordonnance_impression: 'Ordonnance imprimée',
};

const describe = (entry: AccessLogEntry): string => {
  if (entry.action === 'export' && typeof entry.details?.document === 'string') {
    return DOCUMENT_LABELS[entry.details.document] ?? entry.details.document;
  }
  if (entry.action === 'update' && Array.isArray(entry.details?.fields)) {
    const count = entry.details.fields.length;
    return `${ENTITY_LABELS[entry.entity]} · ${count} champ${count > 1 ? 's' : ''}`;
  }
  if (entry.action === 'replace' && entry.details) {
    const d = entry.details as Record<string, number>;
    return `${d.patients ?? 0} patient(s), ${d.appointments ?? 0} RDV`;
  }
  return ENTITY_LABELS[entry.entity];
};

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

// Journal des accès aux dossiers, alimenté par la base (voir
// 0012_limits_and_access_log.sql). Chargé à la demande seulement.
export const AccessLogSection: React.FC = () => {
  const [entries, setEntries] = useState<AccessLogEntry[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setEntries(await loadAccessLog(100));
    } catch (err) {
      console.error('Failed to load access log:', err);
      setError("Impossible de charger le journal d'accès.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-4 border-t border-slate-200 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="font-bold text-slate-800 uppercase tracking-wider block">Journal d'accès</span>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-60 text-slate-700 font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : entries ? (
            <RefreshCw className="w-3.5 h-3.5" />
          ) : (
            <History className="w-3.5 h-3.5" />
          )}
          <span>{entries ? 'Actualiser' : 'Afficher'}</span>
        </button>
      </div>
      <p className="text-[11px] text-slate-500">
        Les 100 dernières opérations sur les dossiers : créations, modifications, suppressions, consultations et
        exports. Ce journal ne peut être ni modifié ni effacé depuis l'application.
      </p>

      {error && <p className="text-[11px] text-rose-700">{error}</p>}

      {entries && entries.length === 0 && (
        <p className="text-[11px] text-slate-500 italic">Aucune opération enregistrée pour l'instant.</p>
      )}

      {entries && entries.length > 0 && (
        <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-lg">
          <table className="w-full text-[11px]">
            <thead className="bg-slate-50 text-slate-500 sticky top-0">
              <tr>
                <th className="text-left font-semibold px-2.5 py-1.5">Date</th>
                <th className="text-left font-semibold px-2.5 py-1.5">Action</th>
                <th className="text-left font-semibold px-2.5 py-1.5">Élément</th>
                <th className="text-left font-semibold px-2.5 py-1.5">Patient</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {entries.map((entry, i) => (
                <tr key={`${entry.occurredAt}-${i}`} className="text-slate-700">
                  <td className="px-2.5 py-1.5 whitespace-nowrap font-mono">{formatDateTime(entry.occurredAt)}</td>
                  <td className="px-2.5 py-1.5 whitespace-nowrap">
                    {ACTION_LABELS[entry.action]}
                    {entry.byDashboard && <span className="text-slate-400"> (administration)</span>}
                  </td>
                  <td
                    className="px-2.5 py-1.5"
                    title={Array.isArray(entry.details?.fields) ? entry.details.fields.join(', ') : undefined}
                  >
                    {describe(entry)}
                  </td>
                  <td className="px-2.5 py-1.5">
                    {entry.patientName ?? (entry.patientId ? <span className="text-slate-400">Patient supprimé</span> : '—')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
