import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'dossier_rani_recent';
const MAX = 5;

export function useRecentlyViewed() {
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then(raw => {
      if (raw) {
        try { setRecent(JSON.parse(raw)); } catch {}
      }
    });
  }, []);

  const addRecent = useCallback((id: string) => {
    setRecent(prev => {
      const filtered = prev.filter(i => i !== id);
      const next = [id, ...filtered].slice(0, MAX);
      AsyncStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { recent, addRecent };
}
