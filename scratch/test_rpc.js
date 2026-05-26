const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://xvwvwniktgmxuooqkpdc.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2d3Z3bmlrdGdteHVvb3FrcGRjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzY1NDU4NywiZXhwIjoyMDkzMjMwNTg3fQ.O7em5YJiYQ6zSdJIDgfmcyBkO7OorQRMGT_zt9EL5KE";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  console.log("Attempting to add columns check_in_time and check_out_time using RPC...");
  
  // Try running an ALTER TABLE query via RPC
  const { data, error } = await supabase.rpc('exec_sql', {
    sql_query: "ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS check_in_time text DEFAULT '14:00', ADD COLUMN IF NOT EXISTS check_out_time text DEFAULT '12:00';"
  });

  if (error) {
    console.error("RPC exec_sql failed or did not exist:", error);
    
    // Let's try another parameter name 'query' or 'sql'
    const { data: data2, error: error2 } = await supabase.rpc('exec_sql', {
      sql: "ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS check_in_time text DEFAULT '14:00', ADD COLUMN IF NOT EXISTS check_out_time text DEFAULT '12:00';"
    });
    
    if (error2) {
      console.error("RPC exec_sql (with 'sql' param) failed too:", error2);
    } else {
      console.log("Success! Columns added successfully via sql param.");
    }
  } else {
    console.log("Success! Columns added successfully via sql_query param.");
  }
}

main();
