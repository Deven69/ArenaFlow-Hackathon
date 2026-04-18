import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Use environment variables or fallback to the provided keys.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ffjuuihwlwskyxuxwtkc.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_3C6d2fGZ4go0Jo7QIoJLbw_TkrCrnvW';

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);
