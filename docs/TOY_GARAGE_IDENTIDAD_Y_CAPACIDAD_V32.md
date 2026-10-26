# Toy Garage Kids — Identidad comercial y capacidad del piloto

## Identidad
Aplicación y marca de plataforma: **Toy Garage Kids**.
Lema oficial de trabajo: **Juguetes usados, nuevas aventuras**.
Descripción corta propuesta para Google Play: **Crea tu tienda de juguetes usados y comparte nuevas aventuras**.

Tiendas: **El Garage de Cristóbal** (fundadora; logo SVG específico) y **La Tienda de Isi** (invitada; logo y tema propios).
En todas las tiendas la marca Toy Garage Kids se presenta secundaria y el nombre y logo del local son protagonistas.
El Centro de Control de la familia fundadora conserva sus privilegios y diseño.
Los enlaces/QR mantienen los slugs `cristobal-isidora` y `la-tienda-isi`.
El nombre de Play Store y las marcas deben verificarse formalmente antes de publicar; la aplicación comercial aún no está disponible.

## Datos medidos (26 de octubre de 2026)
Supabase: 2 tiendas, 40 juguetes (todos en Isi), 2 cuentas de usuario.
PostgreSQL: 13.334.195 bytes (13,3 MB de base).
Storage `family-media`: 66 archivos, 5.314.738 bytes (5,31 MB), media de 80.526 bytes por archivo.
63 referencias de fotografías en los 40 juguetes de Isi. 40 juguetes con fotos y logo equivalen aproximadamente a 5,3 MB con el patrón actual.

## Plan gratuito de Supabase (límites de referencia, sujetos a cambios)
- Base PostgreSQL: 500 MB por proyecto.
- Archivos: 1 GB por organización.
- Tráfico de salida: 5 GB sin caché más 5 GB cacheados mensuales.
- Usuarios activos mensuales: 50.000.

## Estimación de tiendas por capacidad de archivos
En el patrón observado: 1.000 MB / 5,31 MB por tienda de 40 juguetes = unas 188 tiendas como techo teórico.
Dejando 25–30 % para crecimiento y archivos no utilizados, objetivo de capacidad razonable: **100–140 tiendas de unos 40 juguetes**, condicionado al tráfico.
Para 20 juguetes/tienda: aproximadamente 250–280 con esa reserva.
Para 100 juguetes/tienda: aproximadamente 50–55 con esa reserva.
Esto es cálculo de espacio, NO cantidad garantizada de tiendas funcionando a la vez.

## Riesgos antes que la base llegue a 500 MB
Las fotos y descargas mensuales pueden consumir la cuota de almacenamiento o transferencia.
El número de visitas, subastas simultáneas, autenticaciones y notificaciones afecta el rendimiento.
Los proyectos gratis pueden entrar en pausa tras inactividad y no incluyen copias de seguridad automáticas.
Al llegar a 60–80 tiendas conviene medir consumos y establecer un presupuesto operativo.

Fuentes oficiales: https://supabase.com/pricing | https://supabase.com/docs/guides/storage/serving/bandwidth | https://support.google.com/googleplay/android-developer/answer/9859152 | https://buscadormarcas.inapi.gob.cl/