# Battle Arena V1 · fase II · Toy Garage Kids y tiendas invitadas

Estado: implementado en proyecto piloto. El catálogo fundador conserva su diseño y la tienda de Isi mantiene su inventario; NINGUNA Battle fue activada automáticamente.

## Ciclo de subasta
1. El adulto vendedor entra a «Mis Battles» en su panel (admin.html para fundadora, mi-tienda/ para invitadas).
2. Elige un juguete disponible, establece precio inicial (múltiplos de 100), incremento mínimo y cierre entre 15 min y 14 días.
3. Pulsa «Activar Battle». Un RPC autenticado verifica que la cuenta sea la propietaria y la tienda esté publicada, y protege los valores del juguete mientras la Battle esté abierta.
4. Los adultos de familias invitadas con tienda activada y correo confirmado pueden iniciar sesión en battle.html y hacer ofertas. Queda prohibido pujar en la tienda propia.
5. La oferta se valida y registra de forma atómica mediante `tgk_place_bid`; la base controla mínimo, incremento, concurrencia, fecha del servidor y límites.
6. `pg_cron` procesa los cierres cada minuto: elige la mayor oferta válida, genera avisos privados y marca el juguete reservado si hay ganador.
7. El adulto ganador y el adulto vendedor consultan las notificaciones dentro de sus paneles; no se envían aún correos, SMS, push ni WhatsApp automáticos.
8. La negociación de pago y entrega se coordina fuera de la subasta, entre adultos. La plataforma no captura dinero y la oferta no es un pago.

## Tablas
- `tgk_battles`: subasta, plazo, estado, máximo y número de ofertas; información pública sin identidad del postor.
- `tgk_bids`: ofertas, cuenta oferente, importe y fecha; información privada bajo RLS para postor y propietario vendedor.
- `tgk_battle_notifications`: avisos destinados exclusivamente al ganador y al vendedor. Cada usuario lee sus propios avisos.

## Seguridad
- Las mutaciones no son accesibles directamente: `authenticated` carece de permiso `INSERT` sobre las tres tablas; se usa RPC autenticado con control explícito del dueño y de los participantes.
- Las ofertas usan bloqueos de fila `FOR UPDATE` y reloj del servidor; no dependen del reloj del teléfono.
- Trigger privado protege precio, modalidad, cierre y estado del juguete durante la Battle.
- No aparecen datos personales de postores en el catálogo público.
- Los compradores del PILOTO deben poseer una tienda activada con cuenta de adulto invitado. En la fase comercial deberán habilitarse cuentas compradoras de adultos, independientes de la compra de la app.
- No se ha implementado comprobación documental de edad: el registro piloto utiliza declaración de adulto 18+.

## Pruebas
- Migración aplicada y cierre `pg_cron` activo con ejecuciones registradas como 'succeeded'.
- Transacción de prueba con juguetes de Isi y cuenta fundadora como oferente: inicio, puja, rechazo del vendedor, rechazo de incremento insuficiente, contraoferta, cierre y dos notificaciones; ROLLBACK completo.
- Tras las pruebas reales la base conserva CERO Battles, CERO ofertas y CERO notificaciones, y todos los juguetes sin modificar.
- Página Battle accesible para ver el estado y volver a iniciar sesión después del cierre para consultar avisos privados.
- Pendiente prueba visual manual y del flujo de ofertas desde dos teléfonos independientes.

## Pendiente fase futura
Notificaciones por correo y push (servicio y consentimiento), registro de compradores mayores de edad, módulo de contacto adulto a adulto, resolución de disputas, pagos integrados, anti-spam avanzado, confirmación de entregas.