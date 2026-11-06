import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://odlhnquliietvrkgjnym.supabase.co";

const supabaseKey = "sb_publishable_pc07o049-8WsjzLfz9I6-g_7Lq3U-tm";

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;