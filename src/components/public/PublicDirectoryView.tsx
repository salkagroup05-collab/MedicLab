import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Loader2,
  MapPin,
  Phone,
  Search,
  Stethoscope,
  UserCheck,
  UserX,
} from 'lucide-react';
import { PublicPractitioner } from '../../types';
import { loadPublicPractitioners } from '../../lib/db';
import { MEDICAL_SPECIALTIES } from '../../constants';

export const PublicDirectoryView: React.FC = () => {
  const [practitioners, setPractitioners] = useState<PublicPractitioner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    loadPublicPractitioners()
      .then((data) => {
        if (!cancelled) setPractitioners(data);
      })
      .catch((err) => {
        console.error('Failed to load public directory:', err);
        if (!cancelled) setError("Impossible de charger l'annuaire pour le moment. Réessayez plus tard.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const cities = useMemo(
    () => Array.from(new Set(practitioners.map((p) => p.city).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [practitioners]
  );

  const filteredPractitioners = practitioners.filter((p) => {
    const term = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !term ||
      p.name.toLowerCase().includes(term) ||
      p.specialty.toLowerCase().includes(term) ||
      p.city.toLowerCase().includes(term);

    if (!matchesSearch) return false;
    if (specialtyFilter && p.specialty !== specialtyFilter) return false;
    if (cityFilter && p.city !== cityFilter) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs shrink-0">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-slate-900 text-base sm:text-lg leading-none tracking-tight">
                  MédicLab
                </span>
                <p className="text-xs text-slate-500 font-medium">Trouver un professionnel de santé</p>
              </div>
            </div>

            <a
              href="/"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
            >
              Espace praticien →
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Rechercher par nom, spécialité, ville..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-blue-500 outline-hidden"
            />
          </div>

          <select
            value={specialtyFilter}
            onChange={(e) => setSpecialtyFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 font-medium focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Toutes les spécialités</option>
            {MEDICAL_SPECIALTIES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 font-medium focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Toutes les villes</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {loading && (
          <div className="flex items-center justify-center gap-2 text-slate-500 text-sm py-16">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Chargement de l'annuaire...</span>
          </div>
        )}

        {!loading && error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && practitioners.length === 0 && (
          <div className="p-12 text-center text-sm text-slate-500 border border-dashed border-slate-300 rounded-xl bg-white">
            Aucun professionnel n'est actuellement inscrit dans l'annuaire public.
          </div>
        )}

        {!loading && !error && practitioners.length > 0 && filteredPractitioners.length === 0 && (
          <div className="p-12 text-center text-sm text-slate-500 border border-dashed border-slate-300 rounded-xl bg-white">
            Aucun professionnel ne correspond à votre recherche.
          </div>
        )}

        {!loading && !error && filteredPractitioners.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPractitioners.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-900 text-sm truncate">
                      {p.title} {p.name}
                    </h3>
                    <span className="inline-block mt-1 px-2 py-0.5 text-[11px] font-medium text-blue-700 bg-blue-50 rounded-md border border-blue-100">
                      {p.specialty}
                    </span>
                  </div>
                  {p.acceptsNewPatients ? (
                    <span
                      className="shrink-0 flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold text-emerald-800 bg-emerald-100 rounded-full"
                      title="Accepte de nouveaux patients"
                    >
                      <UserCheck className="w-3 h-3" />
                      Nouveaux patients
                    </span>
                  ) : (
                    <span
                      className="shrink-0 flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold text-slate-600 bg-slate-100 rounded-full"
                      title="N'accepte pas de nouveaux patients actuellement"
                    >
                      <UserX className="w-3 h-3" />
                      Complet
                    </span>
                  )}
                </div>

                {(p.address || p.city) && (
                  <div className="flex items-start gap-1.5 text-xs text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>
                      {p.address}
                      {p.address && p.city ? ', ' : ''}
                      {p.city}
                    </span>
                  </div>
                )}

                {p.phone && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <a href={`tel:${p.phone}`} className="hover:text-blue-600 font-mono">
                      {p.phone}
                    </a>
                  </div>
                )}

                {p.publicBio && (
                  <p className="text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-2">
                    {p.publicBio}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
