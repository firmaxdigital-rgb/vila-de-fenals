# 🔒 SECURITY.md — Vila de Fenals Check-in Portal

> **Última actualización:** 26 de mayo de 2026  
> **Este documento debe leerse ANTES de modificar cualquier endpoint de API o lógica de autenticación.**

---

## 1. Arquitectura de Seguridad

Este proyecto gestiona **datos personales sensibles** (GDPR) y controla **acceso físico** a una propiedad (cerradura Nuki + portal IFTTT). La seguridad se implementa en 3 capas:

```
┌─────────────────────────────────────────────────┐
│            CAPA 1: MIDDLEWARE (middleware.ts)     │
│  • Rate limiting por IP (en memoria)             │
│  • Validación de Origen/CSRF para POST           │
│  • Se aplica automáticamente a todas las /api/*  │
├─────────────────────────────────────────────────┤
│            CAPA 2: ENDPOINTS INDIVIDUALES        │
│  • Validación de firma PayComet (webhook)        │
│  • PIN admin server-side con anti brute-force    │
│  • Verificación de check-in en open-door         │
├─────────────────────────────────────────────────┤
│            CAPA 3: CABECERAS HTTP                │
│  • next.config.js → HSTS, X-Frame-Options, etc. │
│  • Protección contra clickjacking, XSS, sniffing│
└─────────────────────────────────────────────────┘
```

---

## 2. Variables de Entorno — Reglas Críticas

### ⚠️ REGLA DE ORO: Prefijo `NEXT_PUBLIC_`

| Prefijo | Dónde se ejecuta | ¿Visible para el usuario? |
|---|---|---|
| `NEXT_PUBLIC_*` | **Cliente** (navegador) | ✅ SÍ — cualquiera puede verlo en DevTools |
| Sin prefijo | **Servidor** (API routes, middleware) | ❌ NO — solo accesible en el backend |

**NUNCA pongas secretos, contraseñas, tokens de API o PINs con el prefijo `NEXT_PUBLIC_`.** Si necesitas que el cliente acceda a un dato sensible, crea un endpoint de API que lo valide en el servidor.

### Variables actuales y su clasificación

| Variable | Tipo | Lado |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL pública de Supabase | Cliente ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anónima (RLS protege los datos) | Cliente ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave con acceso total a BD | Servidor 🔒 |
| `ADMIN_PIN` | PIN de consola de administración | Servidor 🔒 |
| `NUKI_API_TOKEN` | Token de API de Nuki | Servidor 🔒 |
| `PAYCOMET_API_KEY` | Clave de API de PayComet | Servidor 🔒 |
| `SMTP_PASSWORD` | Contraseña de correo SMTP | Servidor 🔒 |

---

## 3. Middleware de Seguridad (`middleware.ts`)

El middleware se ejecuta automáticamente en TODAS las peticiones a `/api/*` antes de que lleguen al endpoint.

### 3.1 Rate Limiting

- **Tipo:** En memoria, por IP, por ruta
- **Ventana:** 1 minuto
- **Límites por defecto:**

| Endpoint | Límite/min | Razón |
|---|---|---|
| `/api/ocr` | 10 | Consume créditos de Google Cloud |
| `/api/open-door` | 5 | Controla acceso físico |
| `/api/admin/verify-pin` | 6 | Previene brute-force del PIN |
| `/api/travelers` | 30 | Contiene PII de huéspedes |
| Otros | 30 | Límite genérico |

**Nota técnica:** En Vercel serverless, el Map en memoria se reinicia con cada cold start. Esto es aceptable porque:
- Sigue protegiendo contra ráfagas rápidas (el caso más común de ataque)
- No requiere servicios externos de pago (Redis, Upstash)

### 3.2 Protección CSRF (Cross-Site Request Forgery)

Para las peticiones POST, el middleware valida que la cabecera `Origin` o `Referer` coincida con los dominios autorizados del proyecto.

**Dominios permitidos:**
- `viladefenals.activavivienda.es`
- `vila-de-fenals.vercel.app`
- `localhost` (desarrollo local)

**Excepciones:** Los webhooks de PayComet y el cron de sync-ical están excluidos de esta validación porque se originan desde servidores externos.

---

## 4. Protecciones por Endpoint

### `/api/admin/verify-pin` (POST)
- ✅ PIN se compara **solo en el servidor** (nunca se envía al navegador)
- ✅ Anti brute-force: 5 intentos fallidos → bloqueo 15 min por IP
- ✅ Variable `ADMIN_PIN` sin prefijo `NEXT_PUBLIC_`

### `/api/payment/webhook` (POST)
- ✅ Valida la firma criptográfica SHA-512 de PayComet
- ✅ Rechaza con HTTP 403 si la firma es inválida
- ✅ Rechaza si las credenciales no están configuradas (no bypasea)
- ✅ No acepta parámetro `simulated` (eliminado)

### `/api/open-door` (POST)
- ✅ Verifica que la reserva existe y está dentro de las fechas válidas
- ✅ Verifica que el check-in esté completado (`is_registered = true`)
- ✅ Verifica que la tasa turística esté pagada (`is_tax_paid = true`)

### `/api/ocr` (POST)
- ✅ Limita a 3 archivos por petición
- ✅ Rate limiting a 10 peticiones/min por IP

### Endpoints eliminados (eran vulnerabilidades)
- ❌ `/api/paycomet/simulate` — Eliminado. Permitía marcar pagos como completados sin pagar.
- ❌ `/api/test-nuki` — Eliminado. Exponía todos los códigos PIN de la cerradura.

---

## 5. Cabeceras de Seguridad HTTP (`next.config.js`)

| Cabecera | Valor | Protección |
|---|---|---|
| `X-Frame-Options` | `DENY` | Clickjacking |
| `X-Content-Type-Options` | `nosniff` | MIME type sniffing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Fuga de URLs |
| `X-XSS-Protection` | `1; mode=block` | XSS reflejado |
| `Permissions-Policy` | `camera=(self), microphone=()` | Acceso a hardware |
| `Strict-Transport-Security` | `max-age=63072000` | Forzar HTTPS |

---

## 6. Guía para Futuros Desarrolladores / IA

### Al crear un NUEVO endpoint de API:

1. **No necesitas hacer nada especial** — el middleware ya protege automáticamente la ruta con rate limiting y CSRF.
2. Si el endpoint recibe webhooks de servicios externos (como PayComet), añade la ruta al array `EXTERNAL_WEBHOOK_ROUTES` en `middleware.ts`.
3. Si el endpoint es llamado internamente por otros endpoints (server-to-server), añade la ruta al array `INTERNAL_CALL_ROUTES` en `middleware.ts`.
4. **Nunca** uses `NEXT_PUBLIC_` para secretos.
5. **Nunca** crees endpoints de simulación/test en producción.

### Al añadir una nueva variable de entorno:

1. Añádela al `.env.local` (desarrollo) Y a Vercel (producción).
2. Si es un secreto → **sin prefijo** `NEXT_PUBLIC_`.
3. Documéntala en la tabla de la sección 2 de este archivo.

### Al modificar la lógica de pagos:

1. **Siempre** verifica la firma criptográfica de PayComet.
2. **Nunca** aceptes un parámetro del usuario para marcar un pago como completado.
3. Solo el webhook con firma válida debe poder cambiar `is_tax_paid`.

---

## 7. Datos Personales y GDPR

Este sistema procesa las siguientes categorías de datos personales:

| Categoría | Datos | Almacenamiento |
|---|---|---|
| Identidad | Nombre, apellidos, documento ID, fecha nacimiento, sexo, nacionalidad | Supabase (tabla `travelers`) |
| Contacto | Teléfono, email, dirección, código postal | Supabase (tabla `travelers` / campo `firma` serializado) |
| Documentos | Fotos de DNI/Pasaporte (procesadas en memoria por OCR, no almacenadas) | No se almacenan |
| Acceso físico | Códigos PIN Nuki, historial de apertura de puerta | Nuki Cloud API |

**Importante:** Las fotos de documentos de identidad enviadas al OCR se procesan en memoria a través de Google Vertex AI (región EU para cumplimiento GDPR) y **NO se almacenan** en disco ni en base de datos.

---

## 8. Archivos Clave de Seguridad

| Archivo | Función |
|---|---|
| `middleware.ts` | Rate limiting + CSRF para todas las /api/* |
| `next.config.js` | Cabeceras de seguridad HTTP |
| `app/api/admin/verify-pin/route.ts` | Verificación de PIN admin server-side |
| `app/api/payment/webhook/route.ts` | Webhook PayComet con validación de firma |
| `.env.local` | Secretos (desarrollo) — NUNCA commitear |
| `.gitignore` | Excluye `.env*.local` del repositorio |

---

## 9. Contacto en caso de incidente de seguridad

Si detectas un acceso no autorizado o comportamiento sospechoso:
1. Revisa los logs de Vercel (Dashboard → Deployments → Functions)
2. Cambia inmediatamente las credenciales comprometidas en Vercel
3. Si afecta a la cerradura Nuki, desactiva todos los códigos desde la app Nuki
