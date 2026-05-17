const SUPABASE_URL = 'https://gcxiucosemhekhmllhti.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Dy0lSijIKQhIdebFsJbDVA_0_7Ws_27';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
