import React, { useState } from 'react';
import { Odontogram, ToothStatus } from '../types';
import { TOOTH_STATUS_CONFIG } from '../constants';

interface OdontogramChartProps {
  value: Odontogram;
  onChange: (next: Odontogram) => void;
}

// Notation FDI, vue "face au patient" : cadrans supérieurs puis inférieurs.
const UPPER_RIGHT = ['18', '17', '16', '15', '14', '13', '12', '11'];
const UPPER_LEFT = ['21', '22', '23', '24', '25', '26', '27', '28'];
const LOWER_RIGHT = ['48', '47', '46', '45', '44', '43', '42', '41'];
const LOWER_LEFT = ['31', '32', '33', '34', '35', '36', '37', '38'];

const TOOTH_STATUSES = Object.keys(TOOTH_STATUS_CONFIG) as ToothStatus[];

export const OdontogramChart: React.FC<OdontogramChartProps> = ({ value, onChange }) => {
  const [selectedTooth, setSelectedTooth] = useState<string | null>(null);

  const setStatus = (tooth: string, status: ToothStatus) => {
    if (status === 'sain') {
      const next = { ...value };
      delete next[tooth];
      onChange(next);
      return;
    }
    onChange({ ...value, [tooth]: { ...value[tooth], status } });
  };

  const setNote = (tooth: string, note: string) => {
    const current = value[tooth];
    if (!current) return;
    onChange({ ...value, [tooth]: { ...current, note: note || undefined } });
  };

  const renderTooth = (tooth: string) => {
    const record = value[tooth];
    const status = record?.status ?? 'sain';
    const config = TOOTH_STATUS_CONFIG[status];
    const isSelected = selectedTooth === tooth;

    return (
      <button
        key={tooth}
        type="button"
        onClick={() => setSelectedTooth(isSelected ? null : tooth)}
        title={`Dent ${tooth} — ${config.label}${record?.note ? ` (${record.note})` : ''}`}
        className={`w-7 h-8 sm:w-8 sm:h-9 rounded-md border text-[10px] font-semibold flex items-center justify-center transition-colors cursor-pointer shrink-0 ${config.color} ${
          status === 'sain' ? 'border-slate-300 text-slate-500' : 'border-slate-400 text-slate-800'
        } ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
      >
        {tooth}
      </button>
    );
  };

  const selectedRecord = selectedTooth ? value[selectedTooth] : undefined;
  const selectedStatus = selectedRecord?.status ?? 'sain';

  return (
    <div className="space-y-3">
      <div className="flex flex-col items-center gap-1 overflow-x-auto pb-1">
        <div className="flex gap-1">
          {UPPER_RIGHT.map(renderTooth)}
          <div className="w-2" />
          {UPPER_LEFT.map(renderTooth)}
        </div>
        <div className="w-full border-t border-dashed border-slate-300 my-1" />
        <div className="flex gap-1">
          {LOWER_RIGHT.map(renderTooth)}
          <div className="w-2" />
          {LOWER_LEFT.map(renderTooth)}
        </div>
      </div>

      {selectedTooth && (
        <div className="bg-blue-50/60 border border-blue-200 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-800">Dent {selectedTooth}</p>
            <button
              type="button"
              onClick={() => setSelectedTooth(null)}
              className="text-[11px] text-slate-500 hover:text-slate-700 cursor-pointer"
            >
              Fermer
            </button>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
            {TOOTH_STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(selectedTooth, s)}
                className={`text-[11px] px-2 py-1.5 rounded-md border flex items-center gap-1.5 cursor-pointer bg-white ${
                  selectedStatus === s ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-200'
                }`}
              >
                <span className={`w-2.5 h-2.5 rounded-full border border-slate-300 shrink-0 ${TOOTH_STATUS_CONFIG[s].color}`} />
                <span className="truncate">{TOOTH_STATUS_CONFIG[s].label}</span>
              </button>
            ))}
          </div>
          {selectedStatus !== 'sain' && (
            <input
              type="text"
              placeholder="Note (facultatif)"
              value={selectedRecord?.note ?? ''}
              onChange={(e) => setNote(selectedTooth, e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500"
            />
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2 justify-center pt-2 border-t border-slate-100">
        {TOOTH_STATUSES.map((s) => (
          <span key={s} className="flex items-center gap-1 text-[10px] text-slate-500">
            <span className={`w-2.5 h-2.5 rounded-full border border-slate-300 ${TOOTH_STATUS_CONFIG[s].color}`} />
            {TOOTH_STATUS_CONFIG[s].label}
          </span>
        ))}
      </div>
    </div>
  );
};
