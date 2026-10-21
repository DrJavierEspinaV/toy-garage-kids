# Toy Garage Kids — Fase 2: publicación y administración compartida

## Objetivo
Publicar en GitHub Pages desde un repositorio NUEVO llamado `toy-garage-kids`, sin tocar Annlie’s Cookies. Conectar datos a un proyecto nuevo de Supabase para que el catálogo cambie en todos los teléfonos.

## Secuencia
1. Crear un repositorio GitHub **público** `toy-garage-kids` desde la web de GitHub. Subir el CONTENIDO de esta carpeta a la raíz de la rama `main` (no la carpeta contenedora).
2. Configurar Settings → Pages → Deploy from branch → main / root.
3. Crear proyecto Supabase. Ejecutar `supabase/schema.sql` desde SQL Editor.
4. Crear usuario adulto en Authentication → Users. Con su UID ejecutar: `insert into public.admins(user_id) values ('UUID_DEL_ADMIN') on conflict do nothing;`.
5. Editar solamente URL y clave **publishable/anon** en `config.js`, nunca una secret/service_role key.
6. Subir nueva versión de `config.js` al repositorio. Abrir `admin.html`, iniciar sesión y cargar **un** juguete real con foto.
7. Verificar desde otro celular que aparece en `index.html`, revisar la foto, el precio, cambio de estado y que solo admin autorizado pueda editar.
8. Generar QR en `afiche.html` con URL pública real. Escanear con teléfono distinto antes de imprimir.

## Restricciones
- Los juguetes incluidos en `data/juguetes.json` son demostrativos. No son inventario real.
- Los pagos y subastas siguen DESACTIVADOS: Battle Arena es previsualización.
- Los compradores se comunican con un adulto; no registrar nombres, rostros, colegios ni domicilios de menores.
- Publicar desde GitHub Pages requiere mantener un repositorio adecuado para publicación pública. No subir respaldos con datos privados.