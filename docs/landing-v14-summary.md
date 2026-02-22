# Landing v14 - Estado Final

Este documento resume los cambios técnicos y estéticos implementados en la iteración de rebranding **"Carry My Words"** (v14).

## Cambios Implementados

### 1. Hero Editorial
- **Nueva Estructura:** Se eliminaron los márgenes negativos (`-mt-*`) para lograr un posicionamiento natural y estable.
- **Centrado:** El contenido del Hero (título y subtítulo) está centrado visualmente sobre la imagen editorial, proporcionando un look más limpio y premium.
- **Multilingüe:** Adaptación completa en `/es` y `/en`.

### 2. CTA Glossy Pill
- **Estilo:** Nuevo diseño tipo "píldora" (`rounded-full`) con gradiente vertical sutil.
- **Efecto Glossy:** Implementación de brillo superior mediante pseudo-elementos (`::after`) para un acabado táctil y premium.
- **Interacciones:** Micro-elevación en hover y feedback visual en estado activo.
- **Unificación:** Se consolidó un único CTA principal en la zona de opciones de entrega.

### 3. Espaciado Simétrico
- **Balance Visual:** Se igualaron los espacios verticales entre los bloques de entrega (cards) y el inicio de la sección inferior, centrando el CTA de forma equidistante.
- **Layout Aireado:** Incremento general de paddings para reforzar la estética editorial.

### 4. Actualización de Microcopy
- **Sección Formato:** Cambio de "Tu voz y tu imagen" a **"Elegí el formato"**.
- **Descripción:** Actualizada para incluir mensajes de texto, audio o video, manteniendo el **voseo** solicitado ("Enviá").

## Estado Técnico
- **PR:** #11 Mergeada y cerrada.
- **Entorno:** Producción estable en Vercel.
- **Repositorio:** `main` sincronizado, branch de feature eliminada, working tree limpio.

---
*Fecha: 21 de Febrero, 2026*
