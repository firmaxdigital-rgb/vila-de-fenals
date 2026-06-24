const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  console.log("Deleting fake Airbnb reservations...");
  const { data, error } = await supabase
    .from('reservations')
    .delete()
    .like('reservation_code', '%@airbnb.com');

  if (error) {
    console.error("Error deleting reservations:", error);
    process.exit(1);
  }

  console.log("Fake reservations successfully deleted.");
  process.exit(0);
}

run();
