import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Trouve ces valeurs sur :
// https://supabase.com/dashboard/project/wraiduedpwqbcplaghml/settings/api
export const SUPABASE_URL  = 'https://wraiduedpwqbcplaghml.supabase.co';
export const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYWlkdWVkcHdxYmNwbGFnaG1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0MDMyNjgsImV4cCI6MjA5Mjk3OTI2OH0.PqcRkVJrY7tN41pIo8CAVrqlGU1jzDYlROcU5ZIEZ7U';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    storage:            AsyncStorage,
    autoRefreshToken:   true,
    persistSession:     true,
    detectSessionInUrl: false,
  },
});
