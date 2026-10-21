# V1.2 — Paquete independiente para GitHub Pages

**Se conserva la interfaz aprobada:** no se modificaron tarjetas, colores, navegación ni logo.

**Seguridad y publicación:** `admin.html` bloquea la edición online hasta configurar Supabase. La tienda muestra una única advertencia de catálogo de demostración cuando no hay Supabase. Se corrigió un aviso redundante que podía aparecer incluso con Supabase configurado.

**Aislamiento de proyectos:** el repositorio `annliescookies/annliescookies.github.io` es sólo una referencia. No se crea ningún archivo ni se realiza ningún cambio en ese repositorio.

**Siguiente requisito externo:** crear un repositorio GitHub independiente, crear un proyecto Supabase, aplicar `supabase/schema.sql`, crear una cuenta administradora adulta y completar `config.js` con URL y clave publicable. No poner contraseñas ni service role en código.

**Verificación de aceptación:** probar `index.html`, `admin.html` y `afiche.html` en servidor local; luego probar en dispositivos distintos, comprobar permisos anónimos y verificar QR real.

---

# TOY GARAGE KIDS · V1.2 / LISTO PARA CONFIGURAR Y PUBLICAR

**Marca:** Toy Garage Kids  
**Sección de subastas:** Battle Arena  
**Estética:** tarjetas coleccionables, niveles S/A/B/C/D, ilustración original no afiliada a Pokémon.  
**Estado:** sitio navegable + administración de prueba + conexión Supabase opcional. **No hay subastas reales ni pagos habilitados.**

## 1. Qué contiene

| Archivo | Función |
| --- | --- |
| `index.html` | Catálogo público responsive, búsqueda, filtros, fichas y selección de juguetes |
| `admin.html` | Panel de administración, carga y edición de juguetes, imágenes, precios y disponibilidad |
| `afiche.html` | Afiche A4 imprimible con generador de QR para URL publicada |
| `css/styles.css` | Identidad visual Toy Garage Kids |
| `js/*.js` | Aplicación, persistencia de demostración y adaptador Supabase |
| `data/juguetes.json` | Seis juguetes de ejemplo, inventados. No representan artículos reales |
| `config.js` | Configuración pública de Supabase (nunca secrets) |
| `supabase/schema.sql` | Base de datos, políticas RLS, administración y almacenamiento de fotografías |
| `docs/PLAN_MAESTRO.md` | Plan funcional y etapas |

## 2. Abrir la demostración inmediatamente

Abre **`DEMO_ABRIR_DIRECTO.html`** con Chrome, Edge o tu navegador: es una vista pública autónoma que incluye estilos, funciones y seis juguetes ficticios. No necesita servidor. Esta página es exclusivamente una demo, no está conectada al panel administrador ni sirve para publicar inventario real.

## 3. Probarlo en el computador SIN backend

1. Descomprime la carpeta.
2. Abre un terminal dentro de `Toy_Garage_Kids_V1_2`.
3. Ejecuta `python -m http.server 8000` (en Windows podría ser `py -m http.server 8000`).
4. Abre `http://localhost:8000/` para ver la tienda.
5. Abre `http://localhost:8000/admin.html` para editar los juguetes.
6. Abre `http://localhost:8000/afiche.html` para previsualizar el afiche.

**Importante:** el modo de prueba guarda cambios en `localStorage`. Aparecerán en la tienda del **mismo navegador**, incluso al recargar, y en otras pestañas de ese navegador. **No** se compartirán por QR ni entre diferentes teléfonos. No exige contraseña porque es una DEMO LOCAL: nunca usarlo como administración pública.

Las fotografías grandes pueden saturar el espacio local. Se comprimen automáticamente, pero para carga cotidiana de fotos la solución correcta es conectar Supabase.

## 4. Publicación REAL con GitHub Pages + Supabase

### A. Supabase (una sola vez)

1. Crea un proyecto en [Supabase](https://supabase.com).
2. En `SQL Editor` ejecuta el archivo `supabase/schema.sql` completo.
3. En `Authentication > Users`, crea una cuenta **adulta administradora**. No usar cuentas personales de los niños.
4. Copia el **User UID**, y en el SQL Editor ejecuta:

   ```sql
   insert into public.admins (user_id)
   values ('AQUI-EL-UUID-DEL-ADULTO')
   on conflict do nothing;
   ```

5. En `Project Settings > API` copia la URL del proyecto y la **publishable/anon key**. En `config.js` escribe:

   ```javascript
   window.TGK_CONFIG = {
     supabaseUrl: 'https://TU-PROYECTO.supabase.co',
     supabasePublishableKey: 'TU-CLAVE-PUBLICABLE',
     brand: 'Toy Garage Kids',
     demoStorageKey: 'tgk-demo-v1'
   };
   ```

**Seguridad:** la clave publicable puede estar en el frontend **sólo** porque las políticas RLS protegen las operaciones. JAMÁS pegues la `service_role`, `secret key`, contraseña ni un token privado en `config.js` o en GitHub. La página `admin.html` es técnicamente pública pero el panel conectado requiere autenticación y privilegios RLS; no confiar en esconder la URL.

### B. GitHub Pages

1. Crea un repositorio nuevo llamado, por ejemplo, `toy-garage-kids` en la cuenta GitHub donde publicarás la tienda; marca **Add a README file** para crear la rama `main`. **No modifiques el repositorio de galletas.**
2. Sube todos los archivos del paquete conservando la estructura.
3. Ve a `Settings > Pages`, elige **Deploy from a branch**, `main` y `/ (root)`.
4. La dirección normalmente será `https://USUARIO.github.io/toy-garage-kids/`.
5. Abre `admin.html` agregándolo a esa dirección, inicia sesión con la cuenta administradora y agrega los juguetes reales.
6. Abre `afiche.html`, verifica que la URL corresponda a la tienda publicada, pulsa **Actualizar QR** y luego **Imprimir afiche**.
7. Prueba el código con la cámara de un teléfono ajeno al computador antes de imprimir en cantidad.

**Importante:** después de activar Supabase, los juguetes ficticios del JSON local **no se importan automáticamente**. El catálogo conectado parte vacío: publica tus juguetes reales con el panel.

## 5. Acciones que sí funcionan en V1.0

- Buscar juguetes por nombre, categoría y descripción.
- Filtrar por categoría y ordenar por precio / nombre / fecha.
- Consultar la ficha, estado, condición y precio de cada juguete.
- Agregar a una selección y generar un mensaje para consultar disponibilidad.
- Abrir WhatsApp del adulto si está configurado; si no, usar compartir/copiar.
- Crear y actualizar juguetes desde `admin.html`.
- Adjuntar hasta tres fotos por juguete, comprimidas en formato JPEG.
- Cambiar estado: disponible, reservado, vendido u oculto.
- Configurar el eslogan y WhatsApp de contacto adulto.
- Marcar juguetes como futuros participantes de Battle y definir precio de salida.
- Generar el QR imprimible cuando se conozca la URL publicada.

## 6. Funciones pendientes (NO confundir con funciones listas)

- **Battle Arena en vivo:** NO permite ofertas todavía. Los elementos Battle son una previsualización. Faltan registro de participantes adultos, pujas transaccionales en servidor, bloqueo de concurrencia, límites de ofertas, cierre automático, auditoría y confirmación adulta.
- **Reservas transaccionales:** la selección sólo produce un mensaje. Marcar como reservado se hace en administración; no hay checkout ni bloqueo automático de inventario.
- **Pagos:** NO se reciben pagos en el sitio. Sólo coordinación entre adultos.
- **Analítica y metas de ahorro:** reservadas para V1.3.

## 7. Seguridad infantil

- No publicar nombre completo, curso, colegio, rostro, domicilio ni ubicación de los niños.
- Las imágenes deben mostrar únicamente el juguete; evita reflejos, etiquetas escolares y metadatos sensibles.
- Los compradores contactan **a un adulto responsable**, nunca directamente a un menor.
- No publicar domicilio exacto ni crear encuentros sin adulto.
- Mostrar estado de conservación real y fotografías de defectos, piezas o accesorios faltantes.
- No activar subastas automáticas hasta tener una política de ofertas y privacidad, y verificación de participación adulta.

## 8. Referencias técnicas oficiales

- GitHub Pages: https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages
- Supabase seguridad / RLS: https://supabase.com/docs/guides/database/secure-data
- Supabase Storage acceso: https://supabase.com/docs/guides/storage/security/access-control
- Supabase JS: https://supabase.com/docs/reference/javascript/start

## 9. Verificaciones realizadas para V1.2

- La interfaz y el logo no fueron modificados.
- Se quitó el aviso público duplicado que se ejecutaba antes de cargar `config.js`.
- El catálogo conectado actualiza su lectura periódicamente cada 20 segundos mientras está visible (además, en un mismo navegador las pestañas de prueba reciben cambios por `storage`).
- Se agregó `.nojekyll` para alojar el proyecto estático sin procesamiento Jekyll.
- Debes crear un repositorio NUEVO: no subir archivos al proyecto de galletas ni a ORION.