# Toy Garage Kids · Hito V1.6 — Infraestructura multifamiliar

## Estado
Esquema listo para gestionar identidades de múltiples tiendas familiares, con **tienda fundadora protegida y sin altas públicas todavía**.

### Identidad
- **Tienda fundadora:** Toy Garage Kids — Cristóbal e Isidora.
- **ID fundador:** d4549710-8c53-4901-bbee-f70fdb060f03
- El sitio \`index.html\` y el panel \`admin.html\` continúan mostrando **solo la tienda fundadora**.
- La futura aplicación comercial tendrá marca general independiente, y cada familia podrá dar nombre y logo a su tienda.

### Tablas
- \`public.stores\`: una fila por tienda, dueño adulto, nombre, logo, configuración y consentimiento del radar desactivado inicialmente.
- \`public.store_members\`: asociaciones de usuarios y tiendas, inicialmente únicamente el adulto dueño.
- \`public.toys.store_id\`: columna obligatoria que identifica el dueño del juguete y se valida con clave foránea.

### Seguridad inicial
- RLS en \`stores\` y \`store_members\`, solo SELECT propio; **sin autoalta pública**.
- Inventario: cada dueño puede leer/crear/editar/eliminar únicamente juguetes de su tienda; tienda fundadora sigue visible públicamente salvo estado \`hidden\`.
- Se conserva \`public.store_settings(id=1)\` y un trigger seguro sincroniza los ajustes del fundador.
- Las fotografías en \`toy-photos\` y las políticas originales de Storage son exclusivas de la tienda fundadora. No habilitar otras tiendas con fotos hasta implementar bucket/rutas por tienda y sus políticas.
- Toy Radar sigue siendo simulación ficticia; no hay ubicaciones reales ni mensajería entre niños.

### Siguiente etapa
1. Registro/admisión segura de familias adultas y alta de tienda nueva.
2. Panel multi-tienda, catálogo personalizado, logos y QR independientes.
3. Storage por tienda con RLS de rutas, comprobación de permisos.
4. Publicación de catálogos de otras familias sin revelar datos internos.
5. Radar de sectores aproximados opt-in, solicitudes entre adultos, bloqueo/moderación, auditoría de privacidad.
6. Validar Google Play con modalidad de pago único.

### Instalación
El SQL canónico está en \`sql/tgk_multifamily_v16.sql\`. Cambios diseñados para aplicarse atómicamente y ser compatibles con clientes anteriores.
