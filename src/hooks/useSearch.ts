import { useMemo, useState, useEffect, useRef } from 'react';
import Fuse from 'fuse.js';
import { Procedure } from '../types';
import { PROCEDURES } from '../data/procedures';
import { searchByIntent } from '../services/ai';

const fuse = new Fuse(PROCEDURES, {
  keys: [
    { name: 'title',           weight: 2   },
    { name: 'titleDarija',     weight: 1.5 },
    { name: 'category',        weight: 1   },
    { name: 'administrations', weight: 0.5 },
  ],
  threshold: 0.35,
  includeScore: true,
});

export function useSearch() {
  const [query, setQuery]           = useState('');
  const [aiResults, setAiResults]   = useState<Procedure[] | null>(null);
  const [aiLoading, setAiLoading]   = useState(false);
  const debounceRef                 = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Résultats Fuse (synchrones, offline)
  const fuseResults = useMemo<Procedure[]>(() => {
    if (!query.trim()) return PROCEDURES;
    return fuse.search(query).map(r => r.item);
  }, [query]);

  // Recherche IA déclenchée après 700ms de pause (si >3 caractères)
  useEffect(() => {
    setAiResults(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 3) { setAiLoading(false); return; }

    debounceRef.current = setTimeout(async () => {
      setAiLoading(true);
      try {
        const ids = await searchByIntent(query);
        if (ids.length === 0) { setAiLoading(false); return; }
        const matched = ids
          .map(id => PROCEDURES.find(p => p.id === id))
          .filter((p): p is Procedure => !!p);
        setAiResults(matched);
      } catch {
        // Silencieux — Fuse reste affiché en cas d'erreur réseau
      } finally {
        setAiLoading(false);
      }
    }, 700);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  // Priorité : résultats IA si disponibles, sinon Fuse
  const results = aiResults ?? fuseResults;
  const isAiSearch = aiResults !== null;

  return { query, setQuery, results, aiLoading, isAiSearch };
}
