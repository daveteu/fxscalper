// Singapore timezone session logic

import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import type { Session } from '@/types';

const TIMEZONE = 'Asia/Singapore';

// Session times in SGT (24-hour format)
const SESSIONS = {
  Trading: {
    start: { hour: 15, minute: 0 }, // 3pm SGT
    end: { hour: 23, minute: 30 }, // 11:30pm SGT
  },
};

// Get current session information
export function getCurrentSession(): Session {
  const now = toZonedTime(new Date(), TIMEZONE);
  const dayOfWeek = now.getDay();

  // Check if it's weekend (0 = Sunday, 6 = Saturday)
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return {
      name: 'Closed',
      active: false,
      startTime: '',
      endTime: '',
      nextSessionStart: 'Market opens Monday at 15:00 SGT',
    };
  }

  const hour = now.getHours();
  const minute = now.getMinutes();
  const currentMinutes = hour * 60 + minute;

  // Check Trading session (15:00-23:30 SGT)
  const tradingStart =
    SESSIONS.Trading.start.hour * 60 + SESSIONS.Trading.start.minute;
  const tradingEnd =
    SESSIONS.Trading.end.hour * 60 + SESSIONS.Trading.end.minute;

  if (currentMinutes >= tradingStart && currentMinutes < tradingEnd) {
    return {
      name: 'London',
      active: true,
      startTime: '15:00',
      endTime: '23:30',
    };
  }

  // Market is closed - determine next session
  let nextSessionStart = '';
  if (currentMinutes < tradingStart) {
    // Before trading session today
    nextSessionStart = 'Trading opens at 15:00 SGT';
  } else {
    // After trading session - next day
    nextSessionStart = 'Trading opens tomorrow at 15:00 SGT';
  }

  return {
    name: 'Closed',
    active: false,
    startTime: '',
    endTime: '',
    nextSessionStart,
  };
}

// Check if a session is currently active
export function isActiveSession(): boolean {
  const session = getCurrentSession();
  return session.active;
}

// Format time in Singapore timezone
export function formatTimeInSingapore(
  date: Date = new Date(),
  formatStr: string = 'HH:mm:ss'
): string {
  return formatInTimeZone(date, TIMEZONE, formatStr);
}

// Get current time in Singapore
export function getCurrentSingaporeTime(): Date {
  return toZonedTime(new Date(), TIMEZONE);
}

// Format date for display
export function formatDateInSingapore(date: Date = new Date()): string {
  return formatInTimeZone(date, TIMEZONE, 'yyyy-MM-dd HH:mm:ss');
}
