const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://xvwvwniktgmxuooqkpdc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2d3Z3bmlrdGdteHVvb3FrcGRjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzY1NDU4NywiZXhwIjoyMDkzMjMwNTg3fQ.O7em5YJiYQ6zSdJIDgfmcyBkO7OorQRMGT_zt9EL5KE';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  console.log(`[CLEANUP] Fetching reservations to identify trash...`);

  // 1. Fetch all reservations
  const { data: reservations, error } = await supabase
    .from('reservations')
    .select('reservation_code');

  if (error) {
    console.error("❌ Error fetching reservations:", error);
    return;
  }

  const trashCodes = [];
  reservations.forEach(r => {
    const code = r.reservation_code;
    const lowerCode = code.toLowerCase();
    
    // Match "Reserved" or "test" codes
    if (lowerCode === 'reserved' || lowerCode.startsWith('reserved') || lowerCode.startsWith('test')) {
      trashCodes.push(code);
    }
  });

  console.log(`Found ${trashCodes.length} trash reservations:`, trashCodes);

  if (trashCodes.length === 0) {
    console.log("✅ No trash reservations found to delete.");
    return;
  }

  // 2. Delete travelers registered under these trash codes first (due to foreign key constraint / logical cleanliness)
  console.log("Deleting associated travelers for trash reservations...");
  const { error: travDelError } = await supabase
    .from('travelers')
    .delete()
    .in('reservation_code', trashCodes);

  if (travDelError) {
    console.error("❌ Error deleting travelers:", travDelError);
  } else {
    console.log("✅ Associated travelers deleted successfully.");
  }

  // 3. Delete the trash reservations
  console.log("Deleting trash reservations...");
  const { data: deletedRes, error: resDelError } = await supabase
    .from('reservations')
    .delete()
    .in('reservation_code', trashCodes)
    .select();

  if (resDelError) {
    console.error("❌ Error deleting reservations:", resDelError);
  } else {
    console.log("✅ Successfully deleted reservations:", deletedRes.map(r => r.reservation_code));
  }
}

run();
