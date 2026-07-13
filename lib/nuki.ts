export function generateMemorablePin(): string {
  // Digit 1: 2-9 (Nuki Keypads do not have 0, and user requested not starting with 1)
  const d1 = Math.floor(Math.random() * 8) + 2;
  // Digit 2: 1-9 (Nuki Keypads do not have 0)
  const d2 = Math.floor(Math.random() * 9) + 1;
  // Digit 3: 1-9
  const d3 = Math.floor(Math.random() * 9) + 1;
  
  // Creates a pattern ABC-CBA (e.g. 286682) which is very easy to memorize
  return `${d1}${d2}${d3}${d3}${d2}${d1}`;
}

export function getCleanNukiName(reservationCode: string, summary?: string): string {
  // We want the name to contain "R-[code]" and then as much of the guest name as possible, max 20 chars total.
  const prefix = `R-${reservationCode}`; // e.g. "R-HM12345"
  let guestName = summary ? summary.replace(/^Reserved$/i, '').replace('Reserved - ', '').replace('Reserva ', '').replace('Airbnb (Not available)', '').trim() : '';
  
  if (!guestName) {
    return prefix.substring(0, 20);
  }
  
  // Clean guest name to only contain alphanumeric characters and spaces
  guestName = guestName.replace(/[^a-zA-Z0-9 ]/g, '').trim();
  
  // Total max length is 20. Prefix length + 1 (space) = prefix.length + 1
  const maxGuestNameLen = 20 - (prefix.length + 1);
  if (maxGuestNameLen > 0) {
    const truncatedGuest = guestName.substring(0, maxGuestNameLen).trim();
    return `${prefix} ${truncatedGuest}`.substring(0, 20);
  }
  
  return prefix.substring(0, 20);
}

export async function upsertNukiKeypadCode(reservationCode: string, summary: string | undefined, startDate: Date, endDate: Date, pinCode: string) {
  const NUKI_API_TOKEN = process.env.NUKI_API_TOKEN;
  const NUKI_SMARTLOCK_ID = process.env.NUKI_SMARTLOCK_ID;

  if (!NUKI_API_TOKEN || !NUKI_SMARTLOCK_ID) {
    console.warn("NUKI_API_TOKEN or NUKI_SMARTLOCK_ID not set in environment variables. Skipping Nuki Keypad creation/update.");
    return null;
  }

  const name = getCleanNukiName(reservationCode, summary);

  const payload = {
    name: name,
    allowedFromDate: startDate.toISOString().split('.')[0] + 'Z',
    allowedUntilDate: endDate.toISOString().split('.')[0] + 'Z',
    allowedWeekDays: 127,
    type: 13,
    code: parseInt(pinCode, 10)
  };

  try {
    // 1. Fetch all authorizations for this smartlock
    const response = await fetch(`https://api.nuki.io/smartlock/${NUKI_SMARTLOCK_ID}/auth`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${NUKI_API_TOKEN}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      console.error(`[Nuki Upsert] Failed to fetch auths: ${response.status}`);
      throw new Error(`Nuki API fetch error: ${response.status}`);
    }

    const auths = await response.json();
    if (!Array.isArray(auths)) {
      console.warn("[Nuki Upsert] Response auths is not an array");
      throw new Error("Invalid Nuki API response format");
    }

    // Find any authorizations that contain "R-[reservationCode]" in their name
    const matchStr = `R-${reservationCode}`;
    const existingAuths = auths.filter((auth: any) => auth.name && auth.name.includes(matchStr));

    if (existingAuths.length > 0) {
      // Update existing
      const authToUpdate = existingAuths[0];
      console.log(`[Nuki Upsert] Updating existing auth ID ${authToUpdate.id} for reservation ${reservationCode}`);
      
      const updateResponse = await fetch(`https://api.nuki.io/smartlock/${NUKI_SMARTLOCK_ID}/auth/${authToUpdate.id}`, {
        method: 'POST', // Nuki API uses POST for update
        headers: {
          'Authorization': `Bearer ${NUKI_API_TOKEN}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!updateResponse.ok) {
        const errorData = await updateResponse.text();
        console.error(`[Nuki Upsert] Error updating Nuki auth ${authToUpdate.id}:`, errorData);
        throw new Error(`Nuki API error (update): ${updateResponse.status} - ${errorData}`);
      }

      // Delete duplicates if they exist
      for (let i = 1; i < existingAuths.length; i++) {
         console.log(`[Nuki Upsert] Deleting duplicate auth ID ${existingAuths[i].id}`);
         await fetch(`https://api.nuki.io/smartlock/${NUKI_SMARTLOCK_ID}/auth/${existingAuths[i].id}`, {
           method: 'DELETE',
           headers: { 'Authorization': `Bearer ${NUKI_API_TOKEN}`, 'Accept': 'application/json' }
         });
      }

      return { success: true, action: 'updated', id: authToUpdate.id };

    } else {
      // Create new
      console.log(`[Nuki Upsert] Creating new auth for reservation ${reservationCode}`);
      const createResponse = await fetch(`https://api.nuki.io/smartlock/${NUKI_SMARTLOCK_ID}/auth`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${NUKI_API_TOKEN}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.text();
        console.error("[Nuki Upsert] Error creating Nuki auth:", errorData);
        throw new Error(`Nuki API error (create): ${createResponse.status} - ${errorData}`);
      }
      
      return { success: true, action: 'created' };
    }
  } catch (err) {
    console.error("[Nuki Upsert] Fatal error:", err);
    throw err;
  }
}

export async function deleteNukiKeypadCodesByReservation(reservationCode: string) {
  const NUKI_API_TOKEN = process.env.NUKI_API_TOKEN;
  const NUKI_SMARTLOCK_ID = process.env.NUKI_SMARTLOCK_ID;

  if (!NUKI_API_TOKEN || !NUKI_SMARTLOCK_ID) return;

  try {
    const response = await fetch(`https://api.nuki.io/smartlock/${NUKI_SMARTLOCK_ID}/auth`, {
      headers: { 'Authorization': `Bearer ${NUKI_API_TOKEN}`, 'Accept': 'application/json' }
    });
    if (!response.ok) return;

    const auths = await response.json();
    if (!Array.isArray(auths)) return;

    const toDelete = auths.filter((auth: any) => auth.name && auth.name.includes(`R-${reservationCode}`));

    for (const auth of toDelete) {
      await fetch(`https://api.nuki.io/smartlock/${NUKI_SMARTLOCK_ID}/auth/${auth.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${NUKI_API_TOKEN}`, 'Accept': 'application/json' }
      });
    }
  } catch (err) {
    console.error("[Nuki Delete] Error deleting Nuki keypad codes:", err);
  }
}
