import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'dossier_rani_favorites';

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then(raw => {
      if (raw) {
        try { setFavorites(JSON.parse(raw)); } catch {}
      }
    });
  }, []);

  const toggle = useCallback((id: string) => {
    setFavorites(prev => {
      const next = prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id];
      AsyncStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const isFavorite = useCallback((id: string) => favorites.includes(id), [favorites]);

  return { favorites, toggle, isFavorite };
}
