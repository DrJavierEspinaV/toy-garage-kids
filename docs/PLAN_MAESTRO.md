# Plan maestro · Toy Garage Kids

**Proyecto familiar** para que los niños participen en la selección, limpieza, fotografía y clasificación de juguetes, y aprendan conceptos de reutilización, precios y ahorro, bajo administración de un adulto.

## Identidad

- **Marca paraguas:** TOY GARAGE KIDS
- **Slogan:** “Un juguete. ¡Mil aventuras!”
- **Subasta / sección competitiva:** BATTLE ARENA
- **Narrativa:** cada juguete es una carta en busca de una nueva misión.
- **Colores:** azul medianoche `#101638`; morado `#7C4DFF`; amarillo `#FFD93E`; cian `#4DE5EB`; rosa `#FF6D9A`.
- **Estética:** cartas coleccionables; gráficos y figuras originales; sin copiar emblemas, personajes ni imágenes de terceros.

## Regla de conservación

| Grado | Significado | Criterio sugerido |
| --- | --- | --- |
| S | Como nuevo | Sin señales relevantes de uso |
| A | Excelente | Muy leves marcas, totalmente funcional |
| B | Bueno | Uso visible leve, completamente funcional |
| C | Con detalles | Desgaste o defecto que debe describirse |
| D | Incompleto | Faltan piezas, desgaste importante o limitación de uso |

Los grados son guía, no reemplazan la descripción honesta de defectos, limpieza o seguridad del producto.

## Flujos

**Publicación:** adulto toma o revisa fotos → asigna categoría, condición, estado y precio → guarda → tarjeta visible inmediatamente en web conectada.

**Compra:** visitante escanea QR → explora por categoría → añade favoritos a selección → solicita disponibilidad → adulto confirma estado, precio y lugar de entrega → adulto marca reservado/vendido.

**Battle futura:** adulto habilita Battle con hora de término y reglas → participantes adultos acreditados envían ofertas → servidor valida incremento, estado y cierre bajo transacción → gana la mayor oferta válida al cierre → administrador confirma. El frontend por sí solo jamás adjudica compras ni almacena ofertas definitivas.

## Fases y criterios de aceptación

| Versión | Entrega | Criterio verificable |
| --- | --- | --- |
| 1.0 Prototipo | Tienda + panel + QR | Filtros, selección, edición de fichas y demo local operativos |
| 1.1 Publicación | GitHub Pages + Supabase | Fotos, estados y precios sincronizados entre dos teléfonos |
| 1.2 Battle | Pujas seguras y supervisadas | Rechazo de ofertas inválidas/concurrentes y cierre verificable |
| 1.3 Kids Finance | Ahorro, recaudación y objetivos | Estadísticas de ventas sin exponer datos privados de compradores |

## Afiche sugerido

**TOY GARAGE KIDS**  
**¡TU PRÓXIMA AVENTURA ESTÁ AQUÍ!**  
Juguetes en excelente estado, tesoros para descubrir y nuevas misiones por comenzar.  
**ESCANEA EL CÓDIGO QR Y EXPLORA**  
⚡ Descubre la Battle Arena  
*Consultas, pagos y entregas coordinados por adultos.*

## Separación tecnológica

- **GitHub Pages:** archivos HTML, CSS y JavaScript visibles. Reutiliza ideas de catálogo y estética responsive del antiguo proyecto de galletas, sin modificarlo.
- **Supabase Postgres + RLS:** catálogo sincronizado y administración sólo por usuario adulto autorizado.
- **Supabase Storage:** fotografías públicas de juguetes; subida sólo por administrador.
- **Subastas:** fase posterior con lógica de servidor transaccional y reglas revisadas antes de abrir ofertas reales.

## Próxima acción de la familia

Hacer inventario real de 5 a 10 juguetes: sacar 2-3 fotos de cada uno, anotar defectos, verificar piezas, decidir precio propuesto y asignar nivel. Publicar primero a un grupo pequeño autorizado y comprobar la experiencia desde otro móvil.