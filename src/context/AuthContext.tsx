import React, {
  createContext, useContext, useEffect, useState, useCallback,
} from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

const GUEST_KEY    = 'dossier_rani_guest_mode';
const MIGRATED_KEY = 'dossier_rani_migrated';

interface AuthContextValue {
  session:    Session | null;
  user:       User | null;
  isGuest:    boolean;
  loading:    boolean;
  signOut:    () => Promise<void>;
  continueAsGuest: () => void;
  migrateLocalDataToSupabase: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  session:  null,
  user:     null,
  isGuest:  false,
  loading:  true,
  signOut:  async () => {},
  continueAsGuest: () => {},
  migrateLocalDataToSupabase: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Check guest mode
    AsyncStorage.getItem(GUEST_KEY).then(v => {
      if (v === 'true') setIsGuest(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) setIsGuest(false);
    });

    // Refresh session when app comes to foreground
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') supabase.auth.startAutoRefresh();
      else supabase.auth.stopAutoRefresh();
    });

    return () => {
      subscription.unsubscribe();
      sub.remove();
    };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    await AsyncStorage.removeItem(GUEST_KEY);
    setIsGuest(false);
  }, []);

  const continueAsGuest = useCallback(() => {
    AsyncStorage.setItem(GUEST_KEY, 'true');
    setIsGuest(true);
  }, []);

  // Migration: copies AsyncStorage checklists → Supabase after sign-in
  const migrateLocalDataToSupabase = useCallback(async () => {
    const userId = session?.user?.id;
    if (!userId) return;

    const already = await AsyncStorage.getItem(MIGRATED_KEY);
    if (already === 'true') return;

    const keys = await AsyncStorage.getAllKeys();
    const checklistKeys = keys.filter(k => k.startsWith('checklist_'));

    for (const key of checklistKeys) {
      const raw = await AsyncStorage.getItem(key);
      if (!raw) continue;
      const demandeId = key.replace('checklist_', '');
      const documentsCoches = JSON.parse(raw);

      await supabase.from('checklists_progress').upsert({
        user_id:          userId,
        demarche_id:      demandeId,
        documents_coches: documentsCoches,
      }, { onConflict: 'user_id,demarche_id' });
    }

    await AsyncStorage.setItem(MIGRATED_KEY, 'true');
  }, [session]);

  return (
    <AuthContext.Provider value={{
      session,
      user:    session?.user ?? null,
      isGuest,
      loading,
      signOut,
      continueAsGuest,
      migrateLocalDataToSupabase,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
