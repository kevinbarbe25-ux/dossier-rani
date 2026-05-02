import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

const STORAGE_KEY  = 'dossier_rani_expirations';
const NOTIF_PERM_KEY = 'dossier_rani_notif_permission_denied';

export type ExpiryStatus = 'expired' | 'warning' | 'valid' | 'no-expiry';

export interface ExpirationEntry {
  completedAt: string;
  expiresAt:   string | null;
}

export interface ExpirationStore {
  [procedureId: string]: ExpirationEntry;
}

// Days from completion before expiration per procedure (null = no expiry)
const EXPIRY_YEARS: Record<string, number | null> = {
  'cin':                    10,
  'passeport-ma':            5,
  'permis-conduire-ma':     10,
  'visite-technique':        1,  // annually
  'acte-naissance-ma':       null,
  'livret-famille':          null,
  'acte-mariage-ma':         null,
  'certificat-residence':    null,
  'carte-grise-ma':          null,
  'titre-foncier':           null,
  'contrat-bail':            null,
  'casier-judiciaire-ma':    null,
  'legalisation-signature':  null,
  'cnss-salarie':            null,
  'anapec':                  null,
  'inscription-scolaire-ma': null,
  'equivalence-diplome':     null,
  'ouverture-compte-ma':     null,
  'declaration-ir':          null, // special: next Feb 28 — see getIrExpiry()
};

function getExpiresAt(procedureId: string, completedAt: Date): Date | null {
  if (procedureId === 'declaration-ir') {
    return getNextFeb28(completedAt);
  }
  const years = EXPIRY_YEARS[procedureId];
  if (years == null) return null;
  const d = new Date(completedAt);
  d.setFullYear(d.getFullYear() + years);
  return d;
}

function getNextFeb28(from: Date): Date {
  const feb28 = new Date(from.getFullYear(), 1, 28, 9, 0, 0);
  return feb28 > from
    ? feb28
    : new Date(from.getFullYear() + 1, 1, 28, 9, 0, 0);
}

export function getStatus(entry: ExpirationEntry): ExpiryStatus {
  if (!entry.expiresAt) return 'no-expiry';
  const now    = Date.now();
  const expiry = new Date(entry.expiresAt).getTime();
  const days   = Math.ceil((expiry - now) / 86_400_000);
  if (days <= 0)  return 'expired';
  if (days <= 90) return 'warning';
  return 'valid';
}

async function scheduleExpiryNotifications(
  procedureId: string,
  procedureTitle: string,
  expiresAt: Date,
): Promise<void> {
  // Web: notifications not supported
  if (Platform.OS === 'web') return;

  // Permission check
  const permDenied = await AsyncStorage.getItem(NOTIF_PERM_KEY);
  if (permDenied === 'true') return;

  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    await AsyncStorage.setItem(NOTIF_PERM_KEY, 'true');
    return;
  }

  // Double-trigger guard: check if already scheduled
  const existing = await Notifications.getAllScheduledNotificationsAsync();
  const alreadyScheduled = existing.some(n =>
    n.identifier.startsWith(`expiry-${procedureId}-`)
  );
  if (alreadyScheduled) return;

  const daysBefore = [90, 30, 7];

  for (const days of daysBefore) {
    const targetDate = new Date(expiresAt.getTime() - days * 86_400_000);
    targetDate.setHours(9, 0, 0, 0);

    // Past-date guard
    if (targetDate <= new Date()) continue;

    await Notifications.scheduleNotificationAsync({
      identifier: `expiry-${procedureId}-${days}d`,
      content: {
        title:  `${procedureTitle} expire bientôt`,
        body:   `Ton ${procedureTitle.toLowerCase()} expire dans ${days} jours. Prépare tes documents.`,
        data:   { procedureId, screen: 'mon-dossier' },
      },
      trigger: { date: targetDate } as any,
    });
  }
}

export function useExpirations() {
  const [store, setStore]   = useState<ExpirationStore>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (raw) {
        try { setStore(JSON.parse(raw)); } catch {}
      }
    }).finally(() => setLoaded(true));
  }, []);

  const addExpiration = useCallback(async (
    procedureId: string,
    procedureTitle: string,
  ) => {
    const existing = store[procedureId];
    const completedAt = new Date();
    const expiresAt   = getExpiresAt(procedureId, completedAt);

    // Idempotent: if entry already has expiresAt, don't overwrite or re-schedule
    if (existing?.expiresAt) return;

    const entry: ExpirationEntry = {
      completedAt: completedAt.toISOString(),
      expiresAt:   expiresAt?.toISOString() ?? null,
    };

    const next = { ...store, [procedureId]: entry };
    setStore(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));

    if (expiresAt) {
      await scheduleExpiryNotifications(procedureId, procedureTitle, expiresAt);
    }
  }, [store]);

  const clearExpiration = useCallback(async (procedureId: string) => {
    const next = { ...store };
    delete next[procedureId];
    setStore(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));

    // Cancel scheduled notifications
    if (Platform.OS !== 'web') {
      for (const days of [90, 30, 7]) {
        await Notifications.cancelScheduledNotificationAsync(
          `expiry-${procedureId}-${days}d`
        ).catch(() => {});
      }
    }
  }, [store]);

  return { store, loaded, addExpiration, clearExpiration };
}
