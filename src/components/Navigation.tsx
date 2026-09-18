import React from 'react';
import { Calendar, Users, User, FileText, BarChart3, Printer } from 'lucide-react';

export type MainTab = 'agenda' | 'waiting' | 'patients' | 'prescriptions' | 'blank-forms' | 'stats';

interface NavigationProps {
  activeTab: MainTab;
  onTabChange: (tab: MainTab) => void;
  waitingCount: number;
  patientsCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  waitingCount,
  patientsCount,
}) => {
  const tabs = [
    {
      id: 'agenda' as MainTab,
      label: 'Agenda & Planning',
      icon: Calendar,
    },
    {
      id: 'waiting' as MainTab,
      label: "Salle d'Attente",
      icon: Users,
      badge: waitingCount > 0 ? waitingCount : undefined,
      badgeColor: 'bg-amber-500 text-white',
    },
    {
      id: 'patients' as MainTab,
      label: 'Dossiers Patients',
      icon: User,
      badge: patientsCount,
      badgeColor: 'bg-slate-200 text-slate-700',
    },
    {
      id: 'prescriptions' as MainTab,
      label: 'Ordonnances & Documents',
      icon: FileText,
    },
    {
      id: 'blank-forms' as MainTab,
      label: 'Formulaires vierges',
      icon: Printer,
    },
    {
      id: 'stats' as MainTab,
      label: 'Activité & Honoraires',
      icon: BarChart3,
    },
  ];

  return (
    <div className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-2 no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                id={`nav-tab-${tab.id}`}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`ml-1 text-xs px-2 py-0.5 rounded-full font-bold leading-none ${
                      tab.badgeColor || 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
