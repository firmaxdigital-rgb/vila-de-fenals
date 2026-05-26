import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Simple in-memory rate limiter for brute-force protection
// In production with multiple instances, use Redis or similar
const failedAttempts = new Map<string, { count: number; lockedUntil: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

function getClientIp(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';
}

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);
    const now = Date.now();

    // Check if IP is locked out
    const record = failedAttempts.get(clientIp);
    if (record && record.lockedUntil > now) {
      const minutesLeft = Math.ceil((record.lockedUntil - now) / 60000);
      return NextResponse.json({
        success: false,
        error: `Demasiados intentos fallidos. Reintente en ${minutesLeft} minutos.`
      }, { status: 429 });
    }

    const { pin } = await request.json();

    if (!pin) {
      return NextResponse.json({ success: false, error: 'PIN requerido.' }, { status: 400 });
    }

    // The ADMIN_PIN is now a server-only variable (no NEXT_PUBLIC_ prefix)
    const correctPin = process.env.ADMIN_PIN;

    if (!correctPin) {
      console.error('SEGURIDAD: Variable de entorno ADMIN_PIN no configurada.');
      return NextResponse.json({ success: false, error: 'Error de configuración del servidor.' }, { status: 500 });
    }

    if (pin === correctPin) {
      // Reset failed attempts on success
      failedAttempts.delete(clientIp);
      return NextResponse.json({ success: true });
    } else {
      // Track failed attempts
      const current = failedAttempts.get(clientIp) || { count: 0, lockedUntil: 0 };
      current.count += 1;

      if (current.count >= MAX_ATTEMPTS) {
        current.lockedUntil = now + LOCKOUT_DURATION_MS;
        current.count = 0;
        failedAttempts.set(clientIp, current);
        console.warn(`SEGURIDAD: IP ${clientIp} bloqueada por ${MAX_ATTEMPTS} intentos fallidos de PIN admin.`);
        return NextResponse.json({
          success: false,
          error: 'Demasiados intentos fallidos. Cuenta bloqueada por 15 minutos.'
        }, { status: 429 });
      }

      failedAttempts.set(clientIp, current);
      return NextResponse.json({
        success: false,
        error: 'PIN incorrecto.',
        attemptsRemaining: MAX_ATTEMPTS - current.count
      }, { status: 401 });
    }
  } catch (error: any) {
    console.error('Error en verify-pin:', error);
    return NextResponse.json({ success: false, error: 'Error interno.' }, { status: 500 });
  }
}
