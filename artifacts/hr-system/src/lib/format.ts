import { differenceInYears, differenceInMonths, differenceInDays } from "date-fns";

export function formatDuration(startDateStr: string): string {
  if (!startDateStr) return "-";
  
  const start = new Date(startDateStr);
  const now = new Date();
  
  const years = differenceInYears(now, start);
  // Get date strictly at same year/month but earlier if needed to calculate remaining months
  const monthsDate = new Date(start);
  monthsDate.setFullYear(monthsDate.getFullYear() + years);
  const months = differenceInMonths(now, monthsDate);
  
  if (years > 0) {
    return `${years}년 ${months}개월`;
  }
  if (months > 0) {
    return `${months}개월`;
  }
  
  const days = differenceInDays(now, start);
  return `${days}일`;
}
