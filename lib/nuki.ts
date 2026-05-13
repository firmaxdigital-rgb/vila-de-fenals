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

export async function createNukiKeypadCode(name: string, startDate: Date, endDate: Date, pinCode: string) {
  const NUKI_API_TOKEN = process.env.NUKI_API_TOKEN;
  const NUKI_SMARTLOCK_ID = process.env.NUKI_SMARTLOCK_ID;

  if (!NUKI_API_TOKEN || !NUKI_SMARTLOCK_ID) {
    console.warn("NUKI_API_TOKEN or NUKI_SMARTLOCK_ID not set in environment variables. Skipping Nuki Keypad creation.");
    return null;
  }

  // Type 13 = Keypad code in Nuki API
  const payload = {
    name: name,
    allowedFromDate: startDate.toISOString(),
    allowedUntilDate: endDate.toISOString(),
    type: 13,
    code: parseInt(pinCode, 10)
  };

  const response = await fetch(`https://api.nuki.io/smartlock/${NUKI_SMARTLOCK_ID}/auth`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${NUKI_API_TOKEN}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error("Error creating Nuki auth:", errorData);
    throw new Error(`Nuki API error: ${response.status} - ${errorData}`);
  }

  return response.json();
}
