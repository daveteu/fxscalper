// Singapore timezone session logic

import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import type { Session } from '@/types';

const TIMEZONE = 'Asia/Singapore';

// Session times in SGT (24-hour format)
const SESSIONS = {
  London: {
    start: { hour: 15, minute: 0 }, // 3pm SGT
    end: { hour: 18, minute: 0 },   // 6pm SGT
  },
  NY: {
    start: { hour: 20, minute: 0 }, // 8pm SGT
    end: { hour: 23, minute: 0 },   // 11pm SGT
  },
};

// Get current session information
export function getCurrentSession(): Session {
  const now = toZonedTime(new Date(), TIMEZONE);
  const hour = now.getHours();
  const minute = now.getMinutes();
  const currentMinutes = hour * 60 + minute;

  // Check London session (15:00-18:00 SGT)
  const londonStart = SESSIONS.London.start.hour * 60 + SESSIONS.London.start.minute;
  const londonEnd = SESSIONS.London.end.hour * 60 + SESSIONS.London.end.minute;
  
  if (currentMinutes >= londonStart && currentMinutes < londonEnd) {
    return {
      name: 'London',
      active: true,
      startTime: '15:00',
      endTime: '18:00',
    };
  }

  // Check NY session (20:00-23:00 SGT)
  const nyStart = SESSIONS.NY.start.hour * 60 + SESSIONS.NY.start.minute;
  const nyEnd = SESSIONS.NY.end.hour * 60 + SESSIONS.NY.end.minute;
  
  if (currentMinutes >= nyStart && currentMinutes < nyEnd) {
    return {
      name: 'NY',
      active: true,
      startTime: '20:00',
      endTime: '23:00',
    };
  }

  // Market is closed - determine next session
  let nextSessionStart = '';
  if (currentMinutes < londonStart) {
    // Before London session today
    nextSessionStart = 'London opens at 15:00 SGT';
  } else if (currentMinutes >= londonEnd && currentMinutes < nyStart) {
    // Between London and NY
    nextSessionStart = 'NY opens at 20:00 SGT';
  } else {
    // After NY session - London tomorrow
    nextSessionStart = 'London opens tomorrow at 15:00 SGT';
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
export function formatTimeInSingapore(date: Date = new Date(), formatStr: string = 'HH:mm:ss'): string {
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
