# Toy Garage Kids · V3.3 — Compradores gratuitos

## Lógica vigente
- **Explorar** tiendas y juguetes: siempre gratis, sin cuenta, sin instalar la app.
- **Comprar**: consultar disponibilidad y coordinar con el adulto de cada tienda; por ahora no hay compra online ni pagos integrados.
- **Battle Arena**: ofertar requiere una cuenta adulta (correo confirmado + perfil comprador gratuito) o una cuenta adulta propietaria existente. No se exige tener tienda ni pagar por la aplicación.
- **Vendedor**: crear y administrar una tienda continúa por invitación privada durante el piloto. En la versión comercial requerirá licencia de Google Play verificada por servidor (todavía pendiente).
- La cuenta compradora NO otorga acceso a tiendas ni herramientas de administración.

## Implementación
- Página pública de compradores: `comprador.html`, JS `js/comprador.js`, estilos `css/comprador.css`.
- Registro Supabase Auth por correo y contraseña con `emailRedirectTo` canónico; sigue siendo obligatorio confirmar el correo.
- Activación tras autenticación y casilla de **18 años o más**: una fila personal en `public.tgk_buyer_profiles`. Es una autodeclaración, no validación documental de edad.
- RLS de perfil de comprador: cada usuario solo puede leer e insertar su fila. Sin permisos públicos ni de actualización.
- `tgk_place_bid` permite ofertar a adultos con perfil comprador propio (o propietario existente), revalida correo confirmado, restricción contra ofertas del vendedor, mínimos, plazo y disponibilidad dentro del servidor.
- Avisos privados de cierre y ofertas personales mostrados en el panel de comprador, sin correos ni WhatsApp automáticos.
- La página Battle Arena muestra el enlace al registro gratuito y permite regresar a la batalla después del ingreso; el estado autentificado de compradores se conserva entre páginas. Los paneles de vendedores continúan solicitando contraseña en cada acceso.

## Ajuste necesario para confirmar correos
Comprobar en Supabase Dashboard > Authentication > URL Configuration que esta URL figura entre **Redirect URLs**:

`https://drjavierespinav.github.io/toy-garage-kids/comprador.html`

Es distinta de la redirección de familias invitadas (`.../mi-tienda/`). Si no está permitida, la confirmación puede terminar en Site URL/localhost. **No se ha podido verificar la lista de redirecciones actual del servicio GoTrue desde el conector disponible.** Al probar una cuenta por primera vez, validar manualmente el correo.

## Pruebas realizadas
- SQL en una única transacción `BEGIN/ROLLBACK`: se creó un usuario de prueba confirmado sin tienda, se insertó su perfil con RLS y pudo ofertar en una Battle temporal de otra tienda.
- La misma cuenta no pudo leer tiendas ajenas ni tenía permiso SQL de INSERT sobre tiendas.
- Ninguna cuenta ni oferta de prueba quedó persistida.
- Se verificó con comprobaciones estáticas la existencia de los controles UI, las llamadas RPC, las rutas y la distinción entre cuenta de comprador y panel vendedor.
- Pendiente: prueba manual de entrega de correo/confirmación en dos dispositivos reales y verificación de redirección permitida.
