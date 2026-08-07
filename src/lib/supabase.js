import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://yrolryfsenccnxvieucg.supabase.co";
const supabaseAnonKey = "sb_publishable_RIEHtMSa4rmwq_3t3NY3HQ_ZQGYjReJ";

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);