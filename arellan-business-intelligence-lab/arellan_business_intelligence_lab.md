# arellan-business-intelligence-lab — Dashboards y BI

Laboratorio de Business Intelligence para la Clínica Automotriz Arellan Hnos. Dashboards ejecutivos en Grafana, KPIs de negocio y visualizaciones para toma de decisiones gerenciales. Activo en Fase 2.

## Stack BI

| Herramienta | Propósito | Fase |
|-----------|---------|------|
| **Grafana** | Dashboards ejecutivos | Fase 2 |
| **PostgreSQL views** | Agregaciones para dashboards | Fase 2 |
| **Metabase** (alternativa) | Self-service BI más simple | Fase 2 |
| **Superset** (si escala) | BI avanzado con SQL editor | Fase 3 |

## KPIs Principales

### KPIs Financieros (Dashboard de Owners)
| KPI | Descripción | Alerta |
|-----|-------------|--------|
| Ingresos del día | Total facturado vs. promedio histórico | <80% del promedio |
| Caja neta | Ingresos - Egresos autorizados | Negativo |
| Descuadres del mes | Número de cierres con discrepancia | >2 en el mes |
| Gastos de importación | % de comisión promedio vs. límite | >5% del precio base |
| Tasa de aprobación de gastos | Gastos aprobados vs. rechazados | >30% rechazados |

### KPIs Operativos
| KPI | Descripción | Meta |
|-----|-------------|------|
| OTs completadas por día | Vehículos entregados | ≥ promedio histórico |
| Tiempo promedio por OT | Desde ingreso hasta entrega | Tendencia decreciente |
| Tasa de reingreso | Vehículos que regresan por el mismo problema | <5% |
| Stock crítico | Items bajo nivel mínimo | 0 |
| Satisfacción del cliente | NPS promedio (Fase 2) | >70 |

## Dashboards Grafana

### Dashboard 1 — Resumen Ejecutivo del Día
Pantalla principal para owners. Se actualiza cada 5 minutos.

```json
{
  "panels": [
    {
      "title": "Ingresos del Día",
      "type": "stat",
      "colorMode": "background",
      "thresholds": { "steps": [
        { "color": "red", "value": 0 },
        { "color": "yellow", "value": 500 },
        { "color": "green", "value": 1000 }
      ]}
    },
    {
      "title": "OTs Activas en Taller",
      "type": "gauge"
    },
    {
      "title": "Alertas Pendientes de Acción",
      "type": "table",
      "dataSource": "PostgreSQL",
      "query": "SELECT type, created_at, description FROM alerts WHERE status = 'PENDING' ORDER BY created_at DESC LIMIT 10"
    },
    {
      "title": "Flujo de Caja — Últimos 7 días",
      "type": "timeseries"
    }
  ]
}
```

### Dashboard 2 — Operaciones del Taller
Para Ana (admin) y owners.
- Timeline de OTs activas por mecánico
- Vehículos en espera vs. en reparación vs. listos para recoger
- Inventario crítico (alertas de stock mínimo)
- Asistencia de mecánicos del día

### Dashboard 3 — Finanzas Mensuales
Para Finance y owners.
- Comparativo ingresos mes actual vs. mes anterior
- Breakdown de gastos por categoría
- Estado de gastos pendientes de aprobación
- Historial de importaciones con márgenes

## Vistas Materializadas PostgreSQL

```sql
-- Vista materializada: resumen diario de caja
CREATE MATERIALIZED VIEW mv_daily_cashbox_summary AS
SELECT
  DATE(cs.opened_at) as business_date,
  SUM(ft.amount) FILTER (WHERE ft.type = 'INFLOW') as total_inflow,
  SUM(ft.amount) FILTER (WHERE ft.type = 'OUTFLOW') as total_outflow,
  COUNT(DISTINCT cs.id) as cashbox_sessions,
  BOOL_OR(cs.discrepancy > 5) as has_discrepancy
FROM cashbox_sessions cs
LEFT JOIN financial_transactions ft ON cs.id = ft.session_id
GROUP BY DATE(cs.opened_at);

-- Refrescar nightly
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_cashbox_summary;
```
