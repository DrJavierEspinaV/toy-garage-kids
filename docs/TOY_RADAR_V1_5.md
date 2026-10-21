# Toy Radar V1.5 — Diseño técnico y seguridad
Estado: Vista previa navegable. No ofrece descubrimiento real, ni geolocalización, ni chat, ni envía conexiones. La V1.4 familiar NO se modifica.

## Objetivo
Descubrir tiendas familiares cercanas por radio (500 m / 1 km / 3 km), mediante sectores de referencia elegidos expresamente por un adulto, no domicilios ni posición en vivo de niños. Conexiones mediante solicitud aceptada o rechazada por administradores adultos.

## Dependencia de arquitectura
La base actual public.toys y public.store_settings corresponden a una sola tienda; se requiere multitienda aislada por identificador store_id antes de registrar familias externas:
- stores: id, propietario_adulto, alias, fecha.
- store_members: permisos por tienda, únicamente roles adultos.
- toys: store_id, índices y políticas RLS por pertenencia.
- store_settings: store_id, sin configuración compartida.
- radar_locations: store_id, punto de referencia de sector, publicación por consentimiento expreso, siempre privada.
- connection_requests: tienda emisora, receptora, estado; seguridad y control de spam.

## Protección
Un adulto elige un punto público de referencia aproximado que NO identifique hogar, escuela ni rutina. La búsqueda real se hará desde la zona configurada y NO ofrecerá consultas sobre coordenadas arbitrarias o localizaciones GPS de menores. La consulta entre tiendas no devolverá latitud/longitud de otros usuarios; solo alias, categorías, tramos aproximados y eventual solicitud entre adultos. Implementar límites por cuenta, moderación, bloqueo y eliminación de datos.
Se puede usar Supabase PostGIS para radio, con puntos aproximados, índices y RLS. No se activa automáticamente ningún permiso de ubicación del dispositivo.

## Políticas
Una app dirigida exclusivamente a niños no puede solicitar ubicación en Google Play. También son relevantes las restricciones de chat anónimo y aleatorio para menores (políticas 2026). Diseñar función solo en espacio adulto, sin chat abierto entre niños.
- https://support.google.com/googleplay/android-developer/answer/9893335
- https://support.google.com/googleplay/android-developer/answer/17134731
- https://supabase.com/docs/guides/database/extensions/postgis

## Fases
1. Aprobar vista previa Toy Radar y mantener producción V1.4 intacta.
2. Construir multi-tenant y migrar inventario actual a tienda fundadora, con respaldo y pruebas.
3. Opt-in de tiendas y búsqueda por radio sin revelar coordenadas.
4. Solicitudes autenticadas entre adultos, bloqueo, denuncias y moderación.
5. Pilotear 5 a 10 familias antes de distribución comercial.
