import { afterEach, describe, expect, it, vi } from 'vitest';
import { calculateAge, getTodayDateString, getWeekDays, isSameDay, toLocalDateString } from './dateUtils';

afterEach(() => {
  vi.useRealTimers();
});

describe('fuseau de test', () => {
  it('tourne bien en UTC+1', () => {
    expect(new Date(2026, 0, 15).getTimezoneOffset()).toBe(-60);
  });
});

describe('toLocalDateString', () => {
  it('garde le jour local à minuit, là où toISOString donne la veille', () => {
    const midnight = new Date(2026, 2, 10, 0, 0, 0);
    expect(midnight.toISOString().slice(0, 10)).toBe('2026-03-09');
    expect(toLocalDateString(midnight)).toBe('2026-03-10');
  });

  it('complète mois et jour sur deux chiffres', () => {
    expect(toLocalDateString(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});

describe('getTodayDateString', () => {
  it('donne la date locale entre minuit et 1h', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 10, 0, 30));
    expect(getTodayDateString()).toBe('2026-03-10');
  });
});

describe('isSameDay', () => {
  it('compare une Date locale et une chaîne AAAA-MM-JJ', () => {
    expect(isSameDay(new Date(2026, 2, 10, 0, 15), '2026-03-10')).toBe(true);
    expect(isSameDay(new Date(2026, 2, 10, 23, 45), '2026-03-11')).toBe(false);
  });
});

describe('getWeekDays', () => {
  it('commence le lundi et couvre 7 jours consécutifs', () => {
    const week = getWeekDays(new Date(2026, 2, 12)).map(toLocalDateString); // jeudi
    expect(week).toEqual([
      '2026-03-09',
      '2026-03-10',
      '2026-03-11',
      '2026-03-12',
      '2026-03-13',
      '2026-03-14',
      '2026-03-15',
    ]);
  });

  it('rattache le dimanche à la semaine qui se termine', () => {
    const week = getWeekDays(new Date(2026, 2, 15)).map(toLocalDateString);
    expect(week[0]).toBe('2026-03-09');
    expect(week[6]).toBe('2026-03-15');
  });
});

describe('calculateAge', () => {
  it("ne compte l'anniversaire qu'une fois atteint", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 10, 12));
    expect(calculateAge('1990-03-10')).toBe(36);
    expect(calculateAge('1990-03-11')).toBe(35);
    expect(calculateAge('')).toBe(0);
  });
});
