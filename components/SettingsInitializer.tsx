'use client';

import { useEffect } from 'react';
import { initializeSettings } from '@/lib/store';

/**
 * Component to initialize settings from MongoDB on app startup
 * Must be client component to use useEffect
 */
export function SettingsInitializer() {
  useEffect(() => {
    initializeSettings();
  }, []);

  return null;
}
