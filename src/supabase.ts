import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://tuxfnllmyqhuxmdbydfm.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_iUuWusznPEzuyXXAWuOxWg_VXYRiD4w';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
