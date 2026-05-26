function parseGuests(summary, description) {
  const textToSearch = `${summary || ''} | ${description || ''}`;
  let totalGuests = 2; // Default fallback

  const adultsMatch = textToSearch.match(/(\d+)\s*(?:adults?|adultos?)/i);
  const childrenMatch = textToSearch.match(/(\d+)\s*(?:children|niños?|niñas?|child|infants?|bebés?)/i);
  
  if (adultsMatch) {
    const adultsCount = parseInt(adultsMatch[1], 10);
    const childrenCount = childrenMatch ? parseInt(childrenMatch[1], 10) : 0;
    totalGuests = adultsCount + childrenCount;
  } else {
    const directLabelMatch = textToSearch.match(/(?:Number of guests|Guests|Huéspedes|Hospedes|Viajeros|Pax):\s*(\d+)/i);
    if (directLabelMatch) {
      totalGuests = parseInt(directLabelMatch[1], 10);
    } else {
      const unitMatch = textToSearch.match(/(\d+)\s*(?:guests?|huéspedes?|hospedes?|viajeros?|pax)/i);
      if (unitMatch) {
        totalGuests = parseInt(unitMatch[1], 10);
      }
    }
  }
  return totalGuests;
}

const testCases = [
  { summary: "Reserved - John Doe", description: "Guests: 5\nPhone: 123", expected: 5 },
  { summary: "Reserved - Jane Smith (5 adults, 1 child)", description: "", expected: 6 },
  { summary: "Airbnb - Reserved - Rose (2 adultos, 2 niños)", description: "", expected: 4 },
  { summary: "Reserva #12345 (5 pax)", description: undefined, expected: 5 },
  { summary: "Reserved", description: "Number of guests: 4", expected: 4 },
  { summary: "Bloqueo de calendario", description: "No guest info", expected: 2 }
];

testCases.forEach((tc, idx) => {
  const res = parseGuests(tc.summary, tc.description);
  console.log(`Test #${idx + 1}: Expected: ${tc.expected}, Got: ${res} -> ${res === tc.expected ? 'PASS' : 'FAIL'}`);
});
