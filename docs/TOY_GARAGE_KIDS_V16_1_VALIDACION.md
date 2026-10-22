# Toy Garage Kids V1.6.1 · Endurecimiento de consultas
Se complementa `sql/tgk_multifamily_v16.sql` con `sql/tgk_multifamily_v16_1_rls_optimizations.sql`.
- Se creó índice del responsable de tienda.
- SELECT de juguetes se unificó en una política: público puede ver solamente juguetes no ocultos del fundador; dueños autenticados también pueden ver sus propios juguetes, incluidos ocultos.
- El frontend de Cristóbal e Isidora usa siempre `FOUNDER_STORE_ID` en lectura, creación, edición y eliminación de juguetes.
- Se actualizaron las versiones de los módulos JavaScript de la portada y del panel para que el navegador no siga usando versiones almacenadas.
- La interfaz, el nombre y el logo no cambian.
- Altas públicas, radar real, chat, pagos y fotos de otras familias continúan inactivos.
