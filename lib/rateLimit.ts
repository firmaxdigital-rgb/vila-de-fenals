import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false }, global: { fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' }) },
});

export async function checkRateLimit(ip: string | null | undefined): Promise<boolean> {
  if (!ip || ip === '::1' || ip === '127.0.0.1') return true; // Don't block localhost or undefined

  const MAX_ATTEMPTS = 30; // 30 attempts
  const TIMEOUT_MINUTES = 5; // within 5 minutes

  try {
    const { data: record, error } = await supabase
      .from('rate_limits')
      .select('*')
      .eq('ip', ip)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error("Rate limit DB error:", error);
      return true; // Fail open to not block legitimate users if DB is slow
    }

    const now = new Date();

    if (!record) {
      await supabase.from('rate_limits').insert([{ ip, attempts: 1, last_attempt: now.toISOString() }]);
      return true;
    }

    const lastAttempt = new Date(record.last_attempt);
    const minutesSinceLast = (now.getTime() - lastAttempt.getTime()) / 60000;

    if (minutesSinceLast > TIMEOUT_MINUTES) {
      // Timeout passed, reset counter
      await supabase.from('rate_limits')
        .update({ attempts: 1, last_attempt: now.toISOString() })
        .eq('ip', ip);
      return true;
    }

    if (record.attempts >= MAX_ATTEMPTS) {
      // Still within timeout and exceeded attempts. Block and extend timeout.
      await supabase.from('rate_limits')
        .update({ last_attempt: now.toISOString() })
        .eq('ip', ip);
      return false; // BLOCKED
    }

    // Increment attempts
    await supabase.from('rate_limits')
      .update({ attempts: record.attempts + 1, last_attempt: now.toISOString() })
      .eq('ip', ip);

    return true;
  } catch (e) {
    console.error("Rate limiter exception:", e);
    return true; // Fail open
  }
}
