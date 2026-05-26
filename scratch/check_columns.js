const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://xvwvwniktgmxuooqkpdc.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2d3Z3bmlrdGdteHVvb3FrcGRjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzY1NDU4NywiZXhwIjoyMDkzMjMwNTg3fQ.O7em5YJiYQ6zSdJIDgfmcyBkO7OorQRMGT_zt9EL5KE";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  const { data, error } = await supabase
    .from('reservations')
    .select('*')
    .limit(1);

  if (error) {
    console.error("Error fetching reservation:", error);
    return;
  }

  if (data && data.length > 0) {
    console.log("Columns in reservations table:", Object.keys(data[0]));
    console.log("Sample reservation data:", data[0]);
  } else {
    console.log("No reservations found in the table.");
  }
}

main();
