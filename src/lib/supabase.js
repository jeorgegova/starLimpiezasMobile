import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

// Configuración directa (más simple y confiable)
const SUPABASE_URL = 'https://gvivprtrbphfvedbiice.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2aXZwcnRyYnBoZnZlZGJpaWNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxMzA1NjUsImV4cCI6MjA3MjcwNjU2NX0.BPJI-HnSRRSkKxBo15X52HtViUxI3G6hhO53jnoAcko';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});