const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkUnconfiguredReservations() {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('reservations')
    .select('*')
    .gte('check_in', today)
    .order('check_in', { ascending: true });

  if (error) {
    console.error("Error fetching data:", error);
    process.exit(1);
  }

  const unconfigured = data.filter(r => !r.total_guests || r.total_guests === 0);
  
  console.log(JSON.stringify(unconfigured, null, 2));
}

checkUnconfiguredReservations();
