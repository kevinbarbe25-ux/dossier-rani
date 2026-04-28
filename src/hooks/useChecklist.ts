import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_PREFIX = 'checklist_';

export function useChecklist(procedureId: string, documentIds: string[]) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY_PREFIX + procedureId)
      .then((raw) => {
        if (raw) {
          try {
            setChecked(JSON.parse(raw));
          } catch {
            // donnée corrompue — on repart de zéro
          }
        }
      })
      .catch(() => {
        // stockage inaccessible — mode dégradé sans persistance
      })
      .finally(() => setLoaded(true));
  }, [procedureId]);

  const toggle = useCallback(
    (docId: string) => {
      setChecked((prev) => {
        const next = { ...prev, [docId]: !prev[docId] };
        AsyncStorage.setItem(KEY_PREFIX + procedureId, JSON.stringify(next));
        return next;
      });
    },
    [procedureId],
  );

  const reset = useCallback(() => {
    setChecked({});
    AsyncStorage.removeItem(KEY_PREFIX + procedureId);
  }, [procedureId]);

  const total = documentIds.length;
  const done = documentIds.filter((id) => checked[id]).length;

  return { checked, toggle, reset, loaded, done, total };
}
