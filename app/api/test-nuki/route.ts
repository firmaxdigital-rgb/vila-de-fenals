import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const NUKI_API_TOKEN = process.env.NUKI_API_TOKEN;

    if (!NUKI_API_TOKEN) {
      return NextResponse.json({ success: false, error: "NUKI_API_TOKEN is not set in environment variables." }, { status: 400 });
    }

    const NUKI_SMARTLOCK_ID = process.env.NUKI_SMARTLOCK_ID || '18098245244';

    const response = await fetch(`https://api.nuki.io/smartlock/${NUKI_SMARTLOCK_ID}/auth`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${NUKI_API_TOKEN}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ success: false, status: response.status, error: errorText }, { status: 500 });
    }

    const authorizations = await response.json();
    return NextResponse.json({ success: true, authorizations });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
