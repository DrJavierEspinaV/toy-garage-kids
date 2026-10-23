# Tiendas familiares — UI unificada V2.0

## Problema resuelto
La tienda invitada tenía portada y listado propios, pero carecía de navegación equivalente a la tienda fundadora.

## Implementación
- `tienda.html?slug=...` pasa a ser una **plantilla pública compartida** por todas las familias invitadas.
- Encabezado y navegación móvil/escritorio: Inicio, Juguetes, Battle Arena, Toy Radar, Cómo funciona.
- La identidad (nombre, logo y frase) se obtiene exclusivamente de la tienda `storefronts` publicada elegida mediante `slug`. No se importan imágenes o productos de la familia fundadora.
- El catálogo muestra filtros de categoría, búsqueda, orden, fotos, estado, detalles y selección.
- «Mi selección» permite crear y compartir una lista local para coordinar con un adulto; no transmite pedidos a la tienda ni confirma compras.
- Battle Arena conserva estatus **Próxima fase**; no se abren apuestas u ofertas.
- Toy Radar conserva tanto la demostración circular *explícitamente ficticia* como el directorio real *por comuna*, con las mismas restricciones por adulto de la fundadora.
- CSS independiente `css/tienda-public.css`; `index.html` y `admin.html` **no se modificaron**. Supabase y sus datos tampoco.
- La administración permanece en `mi-tienda/`. Se conservan logotipo y URL QR de cada familia.
