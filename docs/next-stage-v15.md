# VoiceForLater – Next Stage (v15)

## 0) Contexto (estado actual)
- Landing v14 en producción (Vercel) estable.
- Hero editorial + CTA pill glossy premium.
- Espaciado simétrico entre bloques.
- Copy actualizado (voseo consistente).
- Repo limpio: feature/rebrand-carry-my-words eliminada, PR #11 mergeada.
- Doc: /docs/landing-v14-summary.md

## 1) Objetivo de etapa (1 frase)
Convertir la landing v14 en un funnel más “premium y claro” + preparar un Admin utilizable (no solo KPIs).

## 2) Principios (guardrails)
- Un cambio por PR (paso a paso).
- Nada de “refactors grandes” sin impacto claro.
- Cada cambio debe tener: (a) hipótesis, (b) métrica/indicador, (c) criterio de aceptación.
- Mantener i18n end-to-end.

## 3) Prioridad de Tracks (orden)
Track A — Optimización de conversión (claridad > belleza)  
Track B — Refinamiento visual premium (ritmo/contraste/consistencia)  
Track C — Evolución Admin (navegación + users)  
Track D — Roadmap estratégico (definir MVP+1 y narrativa)

> Regla: si una mejora visual no mejora claridad/escaneabilidad, va después.

## 4) Backlog v15 (primera tanda, chica)

### A1 — Landing: “Claridad del CTA principal”
Hipótesis: si clarificamos el destino del CTA (qué pasa después), aumenta CTR.  
Cambio: microcopy debajo del CTA + ajuste del label del botón (sin cambiar layout).  
Criterio de aceptación:
- No rompe i18n.
- Visualmente no agrega ruido (1 línea max).
- Medible: CTR del CTA (si hay analytics) o al menos evento trackeado.

### B1 — Sistema visual: “Consistencia Primario vs Secundario”
Hipótesis: botones secundarios hoy compiten o confunden jerarquía.  
Cambio: definir 1 regla de estilo (secundario siempre outline/ghost, primario siempre glossy).  
Criterio de aceptación:
- En landing y auth el primario es inequívoco.
- Contraste AA en ambos.

### C1 — Admin: “Navegación base”
Cambio: sidebar/topnav con secciones: Dashboard (KPIs), Users, Messages (futuro), Settings (futuro).  
Criterio de aceptación:
- Navegación visible en /admin.
- Ruta /admin/users existe (aunque sea placeholder).

### C2 — Admin: “Users list (read-only)”
Cambio: tabla con users básicos + estado de plan (free/pro).  
Criterio de aceptación:
- Carga paginada o límite 50.
- No expone datos sensibles innecesarios.

## 5) Definition of Done (para cada PR)
- 1 cambio / 1 PR.
- Checklist de QA rápido (desktop + mobile).
- Capturas “antes/después”.
- Doc actualizado si aplica.
