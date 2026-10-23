# Toy Garage Kids / Mi Tienda · V2.3 — Plantilla universal de jugueterías familiares

**Regla de producto:** se venden/intercambian **juguetes usados o reutilizados** y **juguetes de creación familiar**. No se ha abierto un mercado general de artículos ajenos al juego infantil. Las familias no pueden inyectar HTML/CSS arbitrario: mantienen identidad, categorías y un catálogo infantil.

## Arquitectura
- **Toy Garage Kids (Cristóbal e Isidora)** es la **tienda fundadora**. El diseño visual V1.4 de su inicio sigue protegido y no se ha sustituido.
- Cada familia dispone de una cuenta adulta, un nombre, un logotipo, una frase, sus productos, su QR y un panel privado.
- La plantilla pública común mantiene Inicio, Juguetes, Battle Arena, Toy Radar, Cómo funciona, selección y consultas.
- Las tiendas invitadas usan ahora un héroe a pantalla completa con ilustraciones de juguetes y cinco temas de colores controlados: \`galaxia\`, \`caramelo\`, \`menta\`, \`sol\` y \`oceano\`.
- El tema se elige al activar la tienda y puede editarse desde «Personalizar tienda». \`stores.theme_preset\` se sincroniza vía trigger a \`storefronts.theme_preset\`; los visitantes solo consultan la versión pública.
- En \`toys.product_kind\` se distingue \`reutilizado\` (por defecto, incluidos juguetes existentes) y \`creacion\` (juguetes fabricados por la familia).
- Las compras y entregas siguen gestionadas por adultos; no hay pagos, reservas ni ofertas reales automatizados.

## Navegación común
- **Crear mi tienda**: en \`acquisitionMode: 'pilot'\`, abrir la aplicación de familias con registro **solo por invitación**. La invitación solo la genera la fundadora.
- **Mi cuenta**: abrir el panel propio \`mi-tienda/#acceso\`. El acceso requiere inicio de sesión y RLS. La fundadora sigue administrando juguetes desde \`admin.html\`.
- En \`acquisitionMode: 'commercial'\` la CTA de adquisición debe llevar a la **ficha verificada de Google Play** (\`playStoreUrl\`). Si esa URL falta, el botón queda deshabilitado; nunca se inventa un enlace.
- **Importante:** cambiar el enlace no constituye protección de compra; antes de comercializar es obligatorio verificar **licencia de Google Play en servidor** y desactivar altas gratuitas fuera de pruebas autorizadas. Actualmente sigue el piloto, sin pago real.

## Toy Radar real
- El círculo con escalas 500 m / 1 km / 3 km permanece **únicamente ilustrativo**, sin tiendas ficticias ni coordenadas.
- **La lista principal «Tiendas reales descubiertas»** usa la consulta real a \`storefronts\`: publicadas, participantes opt-in y comuna seleccionada, en la **misma sección**.
- Se eliminó la sección duplicada y las tarjetas falsas de tiendas imaginarias.
- Para cada tienda real se ofrece «Ver tienda» y «Conectar» (solicitud supervisada por adultos autenticados, con límites y RLS existentes).
- El directorio requiere selección de comuna, no GPS. Los botones de radio **no filtran** el directorio; no prometen búsqueda de proximidad métrica.

## Estado de verificación
- Prueba transaccional en Supabase: un propietario actualizó el tema; el dato se sincronizó al escaparate público, y pudo identificar un juguete como «creación», con ROLLBACK para no alterar los datos de prueba.
- La consulta pública de Huechuraba encuentra ambas tiendas publicadas y habilitadas en la red al momento de las pruebas.
- Validación estática: sintaxis de módulos, IDs usados por JavaScript, presencia de navegaciones y tema en panel.
- Falta realizar pruebas de navegación completas desde móviles de ambas familias, accesibilidad, licencias Google Play y notificaciones automáticas.

## Archivos principales
\`index.html\`, \`tienda.html\`, \`mi-tienda/index.html\`, \`familias.html\`, \`js/radar-network.js\`, \`js/store-entry.js\`, \`js/familias.js\`, \`js/tienda.js\`, \`css/tienda-public.css\`, \`css/familias.css\`, \`config.js\`.
