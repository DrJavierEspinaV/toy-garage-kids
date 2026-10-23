# V2.0 — Una sola experiencia pública para cada tienda familiar

La tienda fundadora `index.html` y su panel `admin.html` no se modificaron.

## Nuevas tiendas
- `tienda.html?slug=...` ofrece navegación Inicio, Juguetes, Battle Arena, Toy Radar y Cómo funciona.
- Catálogo independiente cargado exclusivamente por `store_id` de la tienda publicada.
- Filtros por categoría, búsqueda por nombre/descripción y orden por precio/nombre/fecha.
- Ficha con imágenes, precio, estado, grado de conservación, descripción y observaciones.
- Cesta por tienda en localStorage; no mezcla juguetes entre dos tiendas.
- El visitante puede consultar disponibilidad y solicitar coordinación mediante WhatsApp del administrador adulto, si éste habilita expresamente el contacto público. Si no, se puede compartir/copiar una consulta. No se afirma que una consulta sea una reserva.
- Venta/entrega son acuerdos externos entre adultos. No hay cobros, órdenes aceptadas, mensajes internos ni ofertas Battle reales.
- Contacto: privado por defecto. Solo se publica en `storefronts.contact_whatsapp` cuando `stores.public_whatsapp_opt_in=true` y la tienda está publicada.
- La nueva tienda permite activar/desactivar la publicación del WhatsApp desde `mi-tienda/`.
- La imagen RX y el producto de prueba no fueron eliminados ni modificados.
- Pendiente: probar navegación y consulta en un teléfono real, comprobar flujo entre visitante y adulto, no confundir la simulación Battle con ofertas reales.

## Seguridad
Mismo origen de tienda, pero selección guardada con clave `tgk-selection-v2:<slug>`. Las imágenes se obtienen mediante URL segura, los textos se agregan con `textContent` para evitar interpretación de HTML, y los contactos públicos requieren opt-in verificable en base de datos.
