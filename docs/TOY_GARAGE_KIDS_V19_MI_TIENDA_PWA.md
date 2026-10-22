# Toy Garage Kids V1.9 · Mi Tienda (PWA multifamiliar independiente)

## Objetivo
Permitir a otra familia crear y usar **su propia tienda en otro teléfono**, sin acceder a la cuenta ni a los juguetes de la familia fundadora.

## Enlaces de trabajo
- App instalable para familias: `https://drjavierespinav.github.io/toy-garage-kids/mi-tienda/`
- Invitaciones (adulto fundador): `https://drjavierespinav.github.io/toy-garage-kids/familias.html`
- Catálogo privado de cada familia una vez publicado: `https://drjavierespinav.github.io/toy-garage-kids/tienda.html?slug=NOMBRE`
- Tienda fundadora: `https://drjavierespinav.github.io/toy-garage-kids/` (NO modificada en esta versión).

## Cómo probar con otro adulto real
1. Desde `familias.html`, el fundador genera el código de invitación exclusivo para el correo del adulto de la nueva familia.
2. Envía por WhatsApp o correo **Copiar invitación completa**. El enlace abre directamente `mi-tienda/#registro`.
3. El invitado abre el enlace **en Chrome normal** (no dentro del navegador de WhatsApp/ChatGPT). Escribe **su propio correo y contraseña**.
4. Comprueba el mensaje de registro. Confirma el correo recibido. Regresa a `mi-tienda/`, inicia sesión y canjea el código de un solo uso.
5. Agrega nombre, logo, juguetes y publica el catálogo. Comprueba que tiene un QR distinto.
6. En Chrome Android selecciona ⋮ → **Instalar aplicación** o **Añadir a pantalla principal**, según las opciones disponibles.
7. Cierra y abre la app desde su icono: debería mantenerse la sesión propia sin iniciar sesión en la tienda fundadora.

## Condición necesaria en Supabase Auth → URL Configuration
- **Site URL**: `https://drjavierespinav.github.io/toy-garage-kids/mi-tienda/`
- **Redirect URLs** autorizadas, al menos:
  - `https://drjavierespinav.github.io/toy-garage-kids/mi-tienda/`
  - `https://drjavierespinav.github.io/toy-garage-kids/familias.html`

Estas URL se deben verificar manualmente en la consola de Supabase antes de probar la confirmación por correo. No se modifican mediante SQL.

## Separación técnica
- App PWA instalada solo bajo `/mi-tienda/`; service worker limitado a ese subdirectorio.
- Almacenamiento de sesión independiente (`tgk-mi-tienda-auth-v1`).
- Un único proyecto Supabase permite Toy Radar; las políticas RLS separan propietarios, juguetes e imágenes por `store_id`.
- La app móvil no contiene logo, redirecciones ni navegación a la tienda fundadora. Un adulto fundador registrado en ella no obtiene acceso al panel fundador desde esta PWA.
- La tienda fundadora y su panel quedan sin alteraciones en `index.html` y `admin.html`.
- Registro piloto solo mediante correo verificado e invitación privada; **no se habilita alta comercial gratuita**.

## Límites pendientes
- Es una **PWA instalable**, no un archivo APK ni una app publicada en Google Play.
- El paso de confirmación por correo y la creación de una familia real necesitan un segundo correo/dispositivo del adulto invitado. No crear cuentas ficticias en producción.
- En modo sin conexión se puede abrir el cascarón de la aplicación, pero las funciones que usan Supabase requieren Internet.
- Toy Radar por comuna permite visibilidad voluntaria y solicitudes; todavía no está implementado el descubrimiento de comercios desde la PWA, ni un sistema de licencias de pago único de Google Play.
- Para licencia comercial, validar la compra en servidor antes de activar la tienda; el código de invitación es solo para el piloto.

## Diagnóstico del cierre reportado
En los registros revisados el 22-10-2026 no hay llamadas a `POST /signup` desde el registro fallido; la segunda tienda ni la segunda cuenta habían sido creadas. El navegador Android de la captura era una pestaña integrada. No se ha podido reproducir la causa exacta del cierre. La V1.9 muestra el resultado del registro junto al botón y usa una PWA independiente para eliminar la dependencia de esa pestaña integrada.
