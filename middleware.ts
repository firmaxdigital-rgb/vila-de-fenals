import { NextRequest, NextResponse } from 'next/server';

// =============================================================================
// MIDDLEWARE DE SEGURIDAD — Vila de Fenals Check-in Portal
// =============================================================================
// Este middleware protege TODAS las rutas /api/* con:
//   1. Rate Limiting por IP (previene abuso y fuerza bruta)
//   2. Validación de Origen (CSRF) para peticiones POST desde navegador
//   3. Protección extra contra acceso directo a endpoints sensibles
//
// NO requiere servicios externos, NO añade fricción al huésped, coste CERO.
// =============================================================================

// --- Rate Limiting en memoria ---
// Nota: En Vercel serverless, cada instancia tiene su propio Map.
// No persiste entre cold starts, pero sí protege contra ráfagas rápidas.
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minuto
const RATE_LIMITS: Record<string, number> = {
  '/api/ocr':                  10,   // OCR con Vertex AI (consume créditos)
  '/api/open-door':            5,    // Apertura de puerta física
  '/api/admin/verify-pin':     6,    // Login admin (el endpoint ya tiene su propio lockout)
  '/api/travelers':            30,   // Registro de viajeros
  '/api/registro-final':       10,   // Finalización de check-in
  '/api/payment/generate-link':15,   // Generación de enlaces de pago
  '/api/payment/confirm':      10,   // Confirmación de pago
  '/api/payment/confirm-deposit': 10,  // Confirmación de pago de fianza
  '/api/reservations/update-guests': 10,
  DEFAULT:                     30,   // Límite genérico
};

function getClientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || req.ip
    || 'unknown';
}

function getRateLimit(pathname: string): number {
  for (const [route, limit] of Object.entries(RATE_LIMITS)) {
    if (route !== 'DEFAULT' && pathname.startsWith(route)) {
      return limit;
    }
  }
  return RATE_LIMITS.DEFAULT;
}

function checkRateLimit(ip: string, pathname: string): { allowed: boolean; remaining: number } {
  const key = `${ip}:${pathname}`;
  const now = Date.now();
  const limit = getRateLimit(pathname);

  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: limit - 1 };
  }

  record.count++;
  if (record.count > limit) {
    return { allowed: false, remaining: 0 };
  }

  return { allowed: true, remaining: limit - record.count };
}

// Limpieza periódica del Map para evitar memory leak
// Se ejecuta cada ~100 peticiones
let cleanupCounter = 0;
function cleanupRateLimitMap() {
  cleanupCounter++;
  if (cleanupCounter % 100 === 0) {
    const now = Date.now();
    const keysToDelete: string[] = [];
    rateLimitMap.forEach((record, key) => {
      if (now > record.resetTime) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => rateLimitMap.delete(key));
  }
}

// --- Rutas que admiten webhooks externos (sin validación de Origin) ---
const EXTERNAL_WEBHOOK_ROUTES = [
  '/api/payment/webhook',  // PayComet envía webhooks desde sus servidores
  '/api/sync-ical',        // Vercel Cron llama a este endpoint
];

// --- Rutas internas que se llaman entre sí (server-to-server) ---
const INTERNAL_CALL_ROUTES = [
  '/api/registro-final',   // Llamado internamente desde webhook y travelers
  '/api/payment/confirm',  // Llamado internamente desde el flujo de pago
  '/api/payment/confirm-deposit', // Llamado al retornar del pago de fianza
];

// --- Dominios permitidos para validación de Origin ---
function isAllowedOrigin(origin: string | null, host: string | null): boolean {
  if (!origin) return false;

  try {
    const originUrl = new URL(origin);
    // Permitir si el Origin coincide con el Host de la petición
    if (host && originUrl.host === host) return true;

    // Permitir dominios conocidos del proyecto
    const allowedDomains = [
      'viladefenals.activavivienda.es',
      'vila-de-fenals.vercel.app',
      'localhost',
    ];

    return allowedDomains.some(d => originUrl.hostname === d || originUrl.hostname.endsWith('.' + d));
  } catch {
    return false;
  }
}

// =============================================================================
// MIDDLEWARE PRINCIPAL
// =============================================================================
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;
  const ip = getClientIp(request);

  // Solo aplicar a rutas /api/*
  if (!pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // 1. Rate Limiting
  cleanupRateLimitMap();
  const { allowed, remaining } = checkRateLimit(ip, pathname);

  if (!allowed) {
    console.warn(`RATE LIMIT: IP ${ip} excedió el límite para ${pathname}`);
    return NextResponse.json(
      { success: false, error: 'Demasiadas peticiones. Inténtelo de nuevo en un minuto.' },
      {
        status: 429,
        headers: {
          'Retry-After': '60',
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }

  // 2. Validación de Origen (CSRF) para peticiones POST
  if (method === 'POST') {
    // Los webhooks externos no envían Origin del navegador
    const isExternalWebhook = EXTERNAL_WEBHOOK_ROUTES.some(r => pathname.startsWith(r));
    // Las llamadas internas server-to-server tampoco envían Origin
    const isInternalCall = INTERNAL_CALL_ROUTES.some(r => pathname.startsWith(r));

    if (!isExternalWebhook && !isInternalCall) {
      const origin = request.headers.get('origin');
      const referer = request.headers.get('referer');
      const host = request.headers.get('host');

      // En navegadores modernos, las peticiones POST siempre incluyen Origin.
      // Si no hay Origin NI Referer, es probablemente un curl/script externo.
      const hasValidOrigin = isAllowedOrigin(origin, host);
      const hasValidReferer = referer && isAllowedOrigin(new URL(referer).origin, host);

      if (!hasValidOrigin && !hasValidReferer) {
        console.warn(`CSRF: Petición POST a ${pathname} desde origen no autorizado. IP: ${ip}, Origin: ${origin}, Referer: ${referer}`);
        return NextResponse.json(
          { success: false, error: 'Origen no autorizado.' },
          { status: 403 }
        );
      }
    }
  }

  // 3. Añadir cabeceras de rate limit a la respuesta
  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Remaining', String(remaining));
  return response;
}

// Configurar el middleware para que solo se aplique a rutas /api/*
export const config = {
  matcher: '/api/:path*',
};
