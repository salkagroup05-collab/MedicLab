// Date locale au format AAAA-MM-JJ. Ne pas utiliser toISOString() pour ça :
// il convertit en UTC, et à UTC+1 (Cameroun, Bénin, Gabon…) minuit local
// devient 23h la veille, soit la date du jour précédent.
export function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getTodayDateString(): string {
  return toLocalDateString(new Date());
}

export function formatTimeFr(timeStr: string): string {
  if (!timeStr) return '';
  return timeStr.replace(':', 'h');
}

export function formatDateFr(dateStr: string, options?: Intl.DateTimeFormatOptions): string {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  const defaultOptions: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  };
  return new Intl.DateTimeFormat('fr-FR', options || defaultOptions).format(date);
}

export function formatDateShortFr(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
}

export function calculateAge(birthDateStr: string): number {
  if (!birthDateStr) return 0;
  const today = new Date();
  const birthDate = new Date(birthDateStr + 'T00:00:00');
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age < 0 ? 0 : age;
}

export function calculateBmi(weightKg?: number, heightCm?: number): { bmi: number; label: string; color: string } | null {
  if (!weightKg || !heightCm || heightCm <= 0) return null;
  const heightM = heightCm / 100;
  const bmi = Number((weightKg / (heightM * heightM)).toFixed(1));
  
  let label = 'Corpulence normale';
  let color = 'text-emerald-700 bg-emerald-50 border-emerald-200';

  if (bmi < 18.5) {
    label = 'Insuffisance pondérale';
    color = 'text-amber-700 bg-amber-50 border-amber-200';
  } else if (bmi >= 25 && bmi < 30) {
    label = 'Surpoids';
    color = 'text-amber-700 bg-amber-50 border-amber-200';
  } else if (bmi >= 30) {
    label = 'Obésité';
    color = 'text-rose-700 bg-rose-50 border-rose-200';
  }

  return { bmi, label, color };
}

export function getWeekDays(baseDate: Date): Date[] {
  const current = new Date(baseDate);
  const day = current.getDay(); // 0 is Sunday, 1 is Monday...
  // Adjust so Monday is first day (0)
  const diffToMonday = current.getDate() - (day === 0 ? 6 : day - 1);
  const monday = new Date(current.setDate(diffToMonday));
  monday.setHours(0, 0, 0, 0);

  const week: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    week.push(d);
  }
  return week;
}

export function addMinutesToTime(timeStr: string, minutes: number): string {
  const [h, m] = timeStr.split(':').map(Number);
  const totalMinutes = h * 60 + m + minutes;
  const newH = Math.floor(totalMinutes / 60) % 24;
  const newM = totalMinutes % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}

export function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function isSameDay(date1: Date | string, date2: Date | string): boolean {
  const d1 = typeof date1 === 'string' ? date1.split('T')[0] : toLocalDateString(date1);
  const d2 = typeof date2 === 'string' ? date2.split('T')[0] : toLocalDateString(date2);
  return d1 === d2;
}

export function generateHourSlots(startHour = 8, endHour = 19): string[] {
  const slots: string[] = [];
  for (let hour = startHour; hour <= endHour; hour++) {
    slots.push(`${String(hour).padStart(2, '0')}:00`);
    if (hour < endHour) {
      slots.push(`${String(hour).padStart(2, '0')}:30`);
    }
  }
  return slots;
}
