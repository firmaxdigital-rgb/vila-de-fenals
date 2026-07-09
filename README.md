# Vila de Fenals - Check-in Automático & Sync (Bitácora del Proyecto)

Este documento sirve como bitácora y control de arquitectura para que cualquier Inteligencia Artificial (o desarrollador) entienda rápidamente el estado actual del proyecto, las integraciones activas y los flujos de trabajo personalizados.

## Arquitectura General
- **Framework:** Next.js (App Router).
- **Base de Datos:** Supabase (PostgreSQL). Tabla principal: `reservations`, `travelers`.
- **Despliegue:** Vercel.
- **Integraciones de Hardware:** Nuki (Cerraduras inteligentes) vía API.
- **Integraciones de Autoridades:** Partee / Mossos d'Esquadra (vía generación de archivo de texto).

## Flujo de Sincronización de Calendarios (iCal)
Las reservas se importan automáticamente leyendo los archivos iCal de **Airbnb, VRBO y Booking.com**.

### Horarios y Cron Jobs (`vercel.json`)
- La sincronización está programada para ejecutarse en Vercel a las **19:45 UTC** (que equivale a las **21:45** en horario de verano de España).
- El objetivo es atrapar las reservas de última hora antes de dormir y gestionarlas de forma concentrada.

### Scripts y Lógica (`app/api/sync-ical/route.ts`)
- **Airbnb:** Se extrae el código oficial de reserva (HM...).
- **VRBO / Booking.com:** Sus iCals no proveen el número de reserva ni los apellidos del huésped por motivos de privacidad. Por tanto, se genera un identificador interno (ej. `BKG...` o un UUID).
- Cuando entra una reserva nueva, se ejecuta la provisión en **Nuki** (se le asigna un código PIN de acceso automático).
- Se envía un correo de notificación a **asesorweb@firmax.es** (configurado en el script). Este correo contiene:
  1. El enlace de administración (`/admin`) para definir los datos faltantes (huéspedes, precio).
  2. El enlace del viajero (`/acceso/[codigo]`) para copiárselo al cliente.

## Flujo de Envío de Accesos (Automatización vs Manual)
- **Airbnb:** Las URLs se envían 100% de forma automática usando las plantillas de Airbnb y la variable `[reservation_code]`.
- **Booking y VRBO (Gestión Manual):** Dado que Booking y VRBO ocultan el código de reserva en su iCal, sus URLs no se pueden automatizar en sus respectivas plantillas. Cuando llega la notificación al correo (a las 21:45h o por sincronización manual), el administrador debe copiar el "Enlace para el viajero" del email y pegarlo manualmente en el chat del cliente en la plataforma correspondiente.

## Registro y Mossos (Arquitectura Desacoplada)
Para asegurar el cumplimiento legal sin bloquear la experiencia del usuario, el sistema separa la comunicación con las autoridades de la generación de accesos físicos. El orden en el que el huésped realiza las acciones es **irrelevante**; el sistema evalúa y dispara cada evento de forma independiente:

- **1. Envío Inmediato a Mossos (`app/api/mossos-send/route.ts`)**: 
  - Se genera el archivo TXT oficial y se envía el correo a **asesorweb@firmax.es**.
    - **Mejoras de formato (TXT)**: El sistema implementa una estricta normalización de caracteres, eliminando acentos (ej. Ń -> N, Ś -> S) y reemplazando caracteres especiales (ej. Ł -> L, Ø -> O) para evitar errores de validación por "caracteres no imprimibles" en el portal policial.
    - **Mejoras del correo (Resumen y Tasa)**: El correo incluye ahora un aviso resaltado sobre la presencia de menores (para control de autorizaciones) y un desglose detallado de la **Tasa Turística** (mostrando noches computables, tarifa aplicable, y exenciones de menores de 16 años) vinculado al huésped titular para facilitar la facturación desde administración.
  - **Condición**: Ocurre automática e instantáneamente *tan pronto como todos los viajeros han completado sus formularios*.
  - **Nota**: No espera a que los pagos estén completados. Si el huésped edita un viajero posteriormente, se volverá a disparar para enviar la versión actualizada.

- **2. Desbloqueo y Código Nuki (`app/api/registro-final/route.ts`)**:
  - Genera el PIN de la cerradura Nuki y marca la reserva como `is_registered = true` (lo cual es requisito para que la web app muestre la llave virtual).
  - **Condición**: Ocurre única y exclusivamente cuando se cumplen **TODAS** las condiciones:
    1. Formularios de viajero al 100% (igual o mayor al `total_guests`).
    2. Tasa turística pagada (`is_tax_paid = true`).
    3. Fianza pagada en su totalidad (o reserva marcada sin fianza).
  - **Independencia del Orden**: 
    - *Si paga primero y rellena después*: El sistema guarda los pagos. Al terminar el último formulario, se dispara `mossos-send` e inmediatamente después `registro-final`.
    - *Si rellena primero y paga después*: Al terminar el último formulario, se dispara `mossos-send`. Luego, cuando realiza el último pago necesario (webhook/confirm), el sistema detecta que los formularios ya estaban listos y dispara `registro-final`.

## Variables de Entorno Clave (`.env.local`)
- `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`
- `NUKI_API_TOKEN` / `NUKI_SMARTLOCK_ID` / `IFTTT_WEBHOOK_URL`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`

## Notas para IAs Futuras
Si vas a modificar la lógica de sincronización, **no alteres el destinatario (asesorweb@firmax.es)** ni modifiques la estructura de `app/api/registro-final/route.ts` sin autorización expresa, ya que hay automatizaciones externas (Zapiers/IFTTT) que dependen de esos correos.
