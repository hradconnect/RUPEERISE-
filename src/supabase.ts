import { createClient } from '@supabase/supabase-js';

const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const DEFAULT_URL = 'https://htcmxldinazyjmgjynaj.supabase.co'.trim();
const DEFAULT_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0Y214bGRpbmF6eWptZ2p5bmFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3NzUzMTYsImV4cCI6MjA5MjM1MTMxNn0.4Lp9b-f9Cmi5tnyuTufkxEf-QBu84PzGlwcbbYkr6NM'.trim();

const isPlaceholder = (val?: string) => 
  !val || 
  val.trim() === '' ||
  val.trim() === 'https://your-project-id.supabase.co' || 
  val.trim() === 'your-anon-key' || 
  val.trim() === 'your-publishable-key' ||
  val.trim() === 'sb_publishable_XEXaLJ5Yja0x-vykWhx_Cg_efWjAcxn';

const supabaseUrl = (isPlaceholder(envUrl) ? DEFAULT_URL : envUrl!).trim();
const supabaseAnonKey = (isPlaceholder(envAnonKey) ? DEFAULT_ANON_KEY : envAnonKey!).trim();

export const isSupabaseConfigured = !isPlaceholder(envUrl) && !isPlaceholder(envAnonKey);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
