# V2.4 · Afiches infantiles personalizables por familia

## Mensaje inicial común
**Mis juguetes buscan nuevas aventuras.**

Han sido parte de momentos muy bonitos y ahora están listos para seguir jugando.

**Quizás sus próximas aventuras están contigo.**

Escanea el QR y conócelos.

## Qué personaliza cada familia
1. Título principal.
2. Historia de sus juguetes.
3. Invitación especial.
4. Llamado a escanear el QR.

Todos estos datos quedan en `stores.poster_copy` como objeto JSON, con validaciones de longitud. El trigger privado sincroniza al escaparate público en `storefronts.poster_copy`. **El QR permanece vinculado al slug público**, independiente de la redacción.

La aplicación `/mi-tienda/` y el portal `/familias.html` ofrecen el mismo editor privado en `#posterSettingsPane`, tanto para fundadora como para invitadas. La fundadora conserva su administración de juguetes original.

## Diseño y privacidad
La plantilla pública `afiche-tienda.html?slug=<slug>` imprime en A4, en el tema cromático de cada familia. El logo se encierra con `overflow:hidden` y `object-fit:contain` para evitar que invada títulos; está pensada para teléfonos y papel. El afiche usa datos públicos exclusivamente y `textContent` para el texto editable.

La leyenda de plataforma **«Pequeña feria de juguetes usados y creaciones familiares»** se mantiene fija para que quede explícito el destino del marketplace, aunque una familia adapte su mensaje.

La ruta antigua `afiche.html` dirige al afiche común de la tienda fundadora para evitar formatos inconsistentes.

## Comprobaciones
Se comprobó una transacción con el propietario real de la tienda invitada: cambio de texto, sincronización de `storefronts`, aislamiento de datos privados de la fundadora y `ROLLBACK`, sin alterar los afiches reales. GitHub Pages publicó correctamente la interfaz. Falta revisión visual final con impresora / PDF de navegador en los teléfonos reales.
