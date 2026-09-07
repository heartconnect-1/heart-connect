import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://zzhzkikezjtbntaqiurk.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_HB0Irz6bxug1hHs518oPZQ_LC83i4qT';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
