export function formatCurrency(value: number | undefined | null): string {
  const num = typeof value === 'number' && !isNaN(value) ? value : 0;
  return `₱${num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDateToWords(dateStr: string | undefined | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatBorrowerTableDateParts(dateStr: string | undefined | null): { date: string; day: string } {
  if (!dateStr) return { date: '', day: '' };
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return { date: String(dateStr), day: '' };
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
  const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  const month = months[d.getMonth()];
  const dayNum = String(d.getDate()).padStart(2, '0');
  const year = d.getFullYear();
  const dayName = days[d.getDay()];
  return { date: `${month} ${dayNum}, ${year}`, day: dayName };
}

export function formatBorrowerTableDate(dateStr: string | undefined | null): string {
  if (!dateStr) return '';
  const parts = formatBorrowerTableDateParts(dateStr);
  return `${parts.date} ${parts.day}`.trim();
}

export function formatActivityDateTime(dateStr: string | undefined | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const day = String(d.getDate()).padStart(2, '0');
  const year = d.getFullYear();
  const dateFormatted = `${month} ${day}, ${year}`;

  const hasTime = typeof dateStr === 'string' && (dateStr.includes('T') || dateStr.includes(':'));
  if (hasTime) {
    const timeFormatted = d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    return `${dateFormatted} • ${timeFormatted}`;
  }
  return dateFormatted;
}

export function getTodayIsoString(): string {
  return new Date().toISOString().split('T')[0];
}

export function calculateLoanInstallments(
  borrowerId: string,
  principal: number,
  ratePercent: number,
  startDate: string,
  frequency: 'daily' | 'weekly' | 'monthly',
  installmentsCount: number
) {
  const totalInterest = principal * (ratePercent / 100);
  const totalPayable = principal + totalInterest;
  const installmentAmount = installmentsCount > 0 ? totalPayable / installmentsCount : totalPayable;

  const baseDate = new Date(startDate || getTodayIsoString());
  const schedules = [];

  for (let i = 1; i <= installmentsCount; i++) {
    const dueDate = new Date(baseDate);
    let addDays = i * 30;
    if (frequency === 'daily') addDays = i;
    else if (frequency === 'weekly') addDays = i * 7;
    dueDate.setDate(dueDate.getDate() + addDays);

    schedules.push({
      id: `sched_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 5)}`,
      borrower_id: borrowerId,
      installment_no: i,
      due_date: dueDate.toISOString().split('T')[0],
      amount_due: installmentAmount,
      amount_paid: 0,
      status: 'Pending' as const,
      payments: [],
    });
  }

  return {
    totalInterest,
    totalPayable,
    installmentAmount,
    schedules,
  };
}
