import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { PROCEDURES } from '../data/procedures';

const KEY = 'appointments_v1';

export interface Appointment {
  id: string;
  procedureId: string;
  date: string;   // YYYY-MM-DD
  time: string;   // HH:MM
  location: string;
  notificationId: string | null;
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert:  true,
    shouldShowBanner: true,
    shouldShowList:   true,
    shouldPlaySound:  true,
    shouldSetBadge:   true,
  }),
});

async function requestPermission(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

async function scheduleReminder(appt: Appointment): Promise<string | null> {
  const procedure = PROCEDURES.find(p => p.id === appt.procedureId);
  if (!procedure) return null;

  // Notification la veille à 8h00
  const [year, month, day] = appt.date.split('-').map(Number);
  const reminderDate = new Date(year, month - 1, day - 1, 8, 0, 0);
  if (reminderDate <= new Date()) return null;

  const requiredDocs = procedure.documents
    .filter(d => d.required)
    .map(d => d.label)
    .slice(0, 3)
    .join(', ');

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: `Rendez-vous demain — ${procedure.emoji} ${procedure.title}`,
        body:  `${appt.time} à ${appt.location}. Documents : ${requiredDocs}${procedure.documents.filter(d => d.required).length > 3 ? '...' : '.'}`,
        sound: true,
        data:  { procedureId: appt.procedureId, appointmentId: appt.id },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: reminderDate },
    });
    return id;
  } catch {
    return null;
  }
}

export function useAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then(raw => {
        if (raw) {
          try { setAppointments(JSON.parse(raw)); } catch { /* ignored */ }
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const persist = useCallback(async (list: Appointment[]) => {
    setAppointments(list);
    try { await AsyncStorage.setItem(KEY, JSON.stringify(list)); } catch { /* ignored */ }
  }, []);

  const addAppointment = useCallback(async (
    procedureId: string,
    date: string,
    time: string,
    location: string,
  ): Promise<boolean> => {
    const granted = await requestPermission();
    const appt: Appointment = {
      id: Date.now().toString(),
      procedureId,
      date,
      time,
      location,
      notificationId: null,
    };
    if (granted) {
      appt.notificationId = await scheduleReminder(appt);
    }
    const next = [...appointments, appt];
    await persist(next);
    return granted;
  }, [appointments, persist]);

  const removeAppointment = useCallback(async (id: string) => {
    const appt = appointments.find(a => a.id === id);
    if (appt?.notificationId) {
      await Notifications.cancelScheduledNotificationAsync(appt.notificationId).catch(() => {});
    }
    await persist(appointments.filter(a => a.id !== id));
  }, [appointments, persist]);

  // Trier par date croissante, supprimer les passés de plus de 24h
  const now = Date.now();
  const upcoming = appointments
    .filter(a => {
      const d = new Date(`${a.date}T${a.time}`);
      return d.getTime() > now - 86_400_000;
    })
    .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));

  return { appointments: upcoming, addAppointment, removeAppointment, loaded };
}
