# Toy Garage Kids V1.8a · Toy Radar real (piloto por invitación)

## Alcance entregado
- La sección **Toy Radar** sigue integrada en `index.html`, no es una aplicación separada.
- Su diagrama circular con botones **500 m / 1 km / 3 km** sigue siendo solo **simulación ficticia**, sin geolocalización.
- Nuevo directorio **real** por comuna: `public.radar_areas`, una lista inicial de 45 comunas/ciudades de Chile.
- Cada adulto puede activar o desactivar su inclusión voluntaria en la red desde `familias.html`, y elegir comuna general.
- Las tiendas aparecen solo si están publicadas, tienen opt-in y comuna. Ninguna coordenada ni dirección se recopila o muestra.
- `public.tgk_connections`: solicitudes entre tiendas reales, con estados pendiente/aceptada/rechazada/bloqueada/cancelada.
- Los administradores autorizados pueden enviar solicitudes y responderlas en su panel; no se ofrece mensajería directa entre menores.
- Las solicitudes se consultan mediante el botón «Revisar solicitudes». Sin notificaciones push por ahora.
- Protección: RLS por propietario, `INSERT` solo en columnas autorizadas, límite de 10 solicitudes por tienda cada 24 h, unicidad por pareja de tiendas.
- La tienda de Cristóbal e Isidora mantiene el logo/portada V1.4 y no aparece en Toy Radar sin aceptación expresa del adulto.

## Verificación
- Prueba SQL transaccional con dos cuentas adultas y dos tiendas ficticias temporales: lectura pública opt-in, envío y aceptación con roles RLS.
- Se ejecutó `ROLLBACK`: no se crearon tiendas, mensajes ni nuevas cuentas reales.
- La red piloto sigue mostrando cero tiendas mientras ninguna activa expresamente su participación.

## Siguiente hito
- Piloto con segunda familia real.
- Recabar consentimiento informado del adulto participante y revisar mensajes de privacidad para Google Play.
- Construir búsqueda geográfica real opcional SIN exponer domicilios, incluyendo controles de consultas reiteradas / inferencia de zonas privadas.
- Implementar verificación de compra única en Google Play contra servidor, antes de permitir autoalta comercial: **la versión actual solo habilita tiendas mediante invitaciones privadas**.
- Evaluar extensión a localidades adicionales y mejoras de UX.

## Seguridad existente
Los RPC `public.tgk_issue_family_invite` y `public.tgk_redeem_family_invite` emplean `SECURITY DEFINER` intencionalmente y comprueban sesión y correo confirmado. Requieren revisión de seguridad adicional antes de distribución masiva. Activar también la protección contra contraseñas filtradas del proyecto Supabase.
