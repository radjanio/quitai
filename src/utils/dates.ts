/**
 * Date manipulation and formatting utilities for Brazilian Portuguese
 */

export function getTodayIso(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDate(dateString?: string): string {
  if (!dateString) return '-';
  try {
    // If it's already YYYY-MM-DD
    const parts = dateString.split('T')[0].split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
    }
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  } catch {
    return dateString;
  }
}

export function formatDateTime(isoString?: string): string {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

export function getDaysDifference(targetDateIso: string): number {
  if (!targetDateIso) return 0;
  const today = new Date(getTodayIso());
  const target = new Date(targetDateIso.split('T')[0]);
  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function isOverdue(dueDateIso: string, status: string): boolean {
  if (status === 'paga' || status === 'cancelada') return false;
  return getDaysDifference(dueDateIso) < 0;
}

export function getUpcomingCategory(dueDateIso: string): 'overdue' | 'next7days' | 'next30days' | 'future' {
  const diff = getDaysDifference(dueDateIso);
  if (diff < 0) return 'overdue';
  if (diff <= 7) return 'next7days';
  if (diff <= 30) return 'next30days';
  return 'future';
}

export function getDaysRemainingLabel(dueDateIso: string): { label: string; isPast: boolean; days: number } {
  const diff = getDaysDifference(dueDateIso);
  if (diff === 0) {
    return { label: 'Vence hoje', isPast: false, days: 0 };
  }
  if (diff === 1) {
    return { label: 'Vence amanhã', isPast: false, days: 1 };
  }
  if (diff > 1) {
    return { label: `Vence em ${diff} dias`, isPast: false, days: diff };
  }
  const pastDays = Math.abs(diff);
  return {
    label: pastDays === 1 ? 'Venceu ontem' : `Vencida há ${pastDays} dias`,
    isPast: true,
    days: pastDays,
  };
}

/**
 * Generates an array of sequential monthly due dates given a start date and due day
 */
export function generateInstallmentDueDates(firstDueDateIso: string, dueDay: number, count: number): string[] {
  const dates: string[] = [];
  const [initialYear, initialMonth] = firstDueDateIso.split('-').map(Number);
  
  let currentYear = initialYear;
  let currentMonthIndex = initialMonth - 1; // 0-indexed

  for (let i = 0; i < count; i++) {
    // Calculate the target month and year
    const targetDate = new Date(currentYear, currentMonthIndex + i, 1);
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();
    
    // Find the max days in this target month
    const maxDaysInMonth = new Date(year, month + 1, 0).getDate();
    const effectiveDay = Math.min(dueDay, maxDaysInMonth);
    
    const yStr = String(year);
    const mStr = String(month + 1).padStart(2, '0');
    const dStr = String(effectiveDay).padStart(2, '0');
    
    dates.push(`${yStr}-${mStr}-${dStr}`);
  }

  return dates;
}

export function getMonthYearName(dateIso: string): string {
  try {
    const [year, month] = dateIso.split('-');
    const months = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ];
    const mIndex = parseInt(month, 10) - 1;
    return `${months[mIndex] || month}/${year.slice(2)}`;
  } catch {
    return dateIso;
  }
}
