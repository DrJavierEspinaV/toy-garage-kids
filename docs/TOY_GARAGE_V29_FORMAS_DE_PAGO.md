# Toy Garage Kids · V2.9: Formas de pago aceptadas

## Objetivo
Cada familia indica las modalidades que acepta para vender juguetes usados o creaciones familiares. No hay pasarela de cobro ni solicitud de datos bancarios.

## Métodos
- transfer: transferencia bancaria. Los datos se comparten PRIVADAMENTE entre adultos después de acordar la venta.
- cash_on_delivery: efectivo al entregar, bajo supervisión adulta.
- arrange_with_adult: a convenir entre adultos responsables.
- Debe quedar seleccionada al menos una modalidad.

## Arquitectura y seguridad
- Tabla public.store_payment_options, clave store_id a public.stores.id, columnas booleanas y updated_at.
- RLS: visitante solo lee opciones de tiendas publicadas; propietario puede leer, insertar o actualizar únicamente su tienda.
- No se solicitan números de cuenta, tarjetas, RUT ni correos bancarios.
- js/payment-data.js centraliza lectura y guardado; js/payment-public.js muestra las modalidades públicas.
- La fundadora conserva su Centro de Control original admin.html, con un bloque adicional de pagos.
- Las familias invitadas editan opciones desde mi-tienda/ y familias.html.
- Todos los catálogos indican modalidades sin enviar pagos ni confirmar reservas.

## Verificación
- Alta y consulta simuladas con ROLLBACK: propietario invitado edita y visitante lee tienda publicada.
- RLS bloqueó el intento de la familia invitada de configurar la tienda fundadora.
- No se han modificado inventarios, cuentas ni medios de pago de las tiendas. Estado inicial: a convenir.
- Falta revisión visual final en los dispositivos reales.

## Pendiente para fase comercial
Licencias de Google Play, pasarela de pago real, confirmación de transferencias, conciliación y antifraude requieren desarrollo separado.