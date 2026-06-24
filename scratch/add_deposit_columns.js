// Add deposit columns via Supabase Management API
async function addColumns() {
  const PROJECT_REF = 'xvwvwniktgmxuooqkpdc';
  const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2d3Z3bmlrdGdteHVvb3FrcGRjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzY1NDU4NywiZXhwIjoyMDkzMjMwNTg3fQ.O7em5YJiYQ6zSdJIDgfmcyBkO7OorQRMGT_zt9EL5KE';

  const statements = [
    "ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS has_deposit boolean DEFAULT false",
    "ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS deposit_amount numeric(10,2) DEFAULT 0",
    "ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS deposit_paid numeric(10,2) DEFAULT 0"
  ];

  for (const sql of statements) {
    console.log(`Executing: ${sql}`);
    try {
      const r = await fetch(`https://${PROJECT_REF}.supabase.co/rest/v1/rpc/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({})
      });
      console.log(`  Status: ${r.status}`);
    } catch (e) {
      console.error(`  Error:`, e.message);
    }
  }

  // Alternative: Use the postgREST PATCH to add a test value
  // Try to update a reservation with the new fields - if it works, columns exist
  console.log("\nTesting if columns exist by updating a test record...");
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(`https://${PROJECT_REF}.supabase.co`, SERVICE_KEY);

  // First try to select
  const { data, error } = await supabase
    .from('reservations')
    .select('reservation_code, has_deposit, deposit_amount, deposit_paid')
    .limit(1);

  if (error) {
    console.log("❌ Columns don't exist yet. Error:", error.message);
    console.log("\n========================================");
    console.log("MANUAL ACTION REQUIRED:");
    console.log("Go to https://supabase.com/dashboard/project/xvwvwniktgmxuooqkpdc/sql/new");
    console.log("And paste this SQL:\n");
    console.log("ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS has_deposit boolean DEFAULT false;");
    console.log("ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS deposit_amount numeric(10,2) DEFAULT 0;");
    console.log("ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS deposit_paid numeric(10,2) DEFAULT 0;");
    console.log("========================================");
  } else {
    console.log("✅ All deposit columns exist!", data);
  }
}

addColumns().catch(console.error);
