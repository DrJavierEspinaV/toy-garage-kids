# Toy Garage Kids · Publicación GitHub (sin tocar Annlie’s Cookies)

## Paso 1 — Crear un repositorio independiente

Accede a https://github.com/new y selecciona tu propia cuenta como propietario.

- Repository name: `toy-garage-kids`
- Description: `Tienda familiar de juguetes de segunda mano · Toy Garage Kids`
- Visibility: **Public** si usarás GitHub Pages en el plan Free.
- Marca **Add a README file** para inicializar la rama `main` y facilitar la carga desde la conexión con GitHub.
- Pulsa **Create repository**.

Esto NO modifica ni depende del repositorio de galletas.

## Paso 2 — Publicar el código

**Opción recomendada (Git local):** en el directorio descomprimido que CONTIENE `index.html`, ejecutar en PowerShell o Git Bash (con Git instalado):

```bash
git init
git branch -M main
git add .
git commit -m "Toy Garage Kids V1.2 - catálogo inicial"
git remote add origin https://github.com/TU_USUARIO/toy-garage-kids.git
git push -u origin main
```

Sustituir `TU_USUARIO` por el identificador real de GitHub. La primera publicación requiere autenticación de GitHub.

**Opción navegador:** en el repositorio nuevo, usar "uploading an existing file" y arrastrar todos los archivos y carpetas de la carpeta V1.2 DESCOMPRIMIDA (no arrastrar el ZIP). Comprobar que `index.html` quede en la raíz, no dentro de otra carpeta.

## Paso 3 — Activar Pages

En el repositorio `toy-garage-kids`: `Settings` → `Pages` → `Source: Deploy from a branch` → `Branch: main` → `Folder: / (root)` → `Save`.

La URL esperada es `https://TU_USUARIO.github.io/toy-garage-kids/` (comprobar la URL final en Pages).

## Paso 4 — Vincular Supabase

Crear un proyecto Supabase NUEVO exclusivo de Toy Garage Kids. Ejecutar `supabase/schema.sql` en SQL Editor. Crear una cuenta ADULTA en Authentication → Users y dar permiso de administrador insertando su UUID en `public.admins`, según el README. En el archivo `config.js`, sólo colocar la URL del proyecto y la clave **publicable** (`sb_publishable_...`). Nunca colocar claves secretas, contraseñas ni service role.

Confirmar desde otro celular que los datos se actualicen. No imprimir QR definitivo antes de realizar esa prueba.

## Conservación de Annlie’s Cookies

- No abrir ni modificar `annliescookies/annliescookies.github.io` para publicar Toy Garage Kids.
- No crear un subdirectorio dentro de galletas.
- Mantener dos repositorios, dos GitHub Pages y dos catálogos completamente separados.