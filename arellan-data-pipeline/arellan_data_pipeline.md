# arellan-data-pipeline — Pipelines de Datos y ETL

Pipelines de transformación de datos, queries analíticos y ETL para alimentar los dashboards de Business Intelligence de la Clínica Automotriz Arellan Hnos. Activo en Fase 2.

## Propósito

Transformar los datos transaccionales de `arellan-platform` en información ejecutable para los owners. Los datos brutos de OTs, inventario y finanzas se agregan y transforman en métricas accionables.

## Arquitectura del Pipeline

```
[PostgreSQL — Datos transaccionales]
          ↓ (lectura en réplica o schedule nocturno)
[ETL Jobs — BullMQ Workers]
          ↓
[PostgreSQL — Tablas analíticas desnormalizadas]
          ↓
[Grafana / Dashboard de Reportes]
          ↓
[Owners ven métricas en arellan-frontend-web]
```

## Queries Analíticos Clave

### Rentabilidad por Tipo de Servicio
```sql
SELECT
  order_category,
  COUNT(*) as total_orders,
  AVG(labor_cost) as avg_labor,
  AVG(parts_cost) as avg_parts,
  AVG(total_cost) as avg_revenue,
  AVG(total_cost - parts_cost) as avg_margin,
  ROUND(AVG((total_cost - parts_cost) / NULLIF(total_cost, 0)) * 100, 2) as margin_pct
FROM work_orders
WHERE
  status = 'DELIVERED'
  AND delivered_at >= NOW() - INTERVAL '90 days'
GROUP BY order_category
ORDER BY avg_margin DESC;
```

### Productividad por Mecánico
```sql
SELECT
  a.name as mechanic_name,
  COUNT(wo.id) as orders_completed,
  AVG(EXTRACT(EPOCH FROM (wo.delivered_at - wo.received_at)) / 3600) as avg_hours_per_order,
  SUM(wo.labor_cost) as total_labor_billed,
  AVG(wo.labor_cost) as avg_labor_per_order
FROM work_orders wo
JOIN accounts a ON wo.mechanic_id = a.id
WHERE
  wo.status = 'DELIVERED'
  AND wo.delivered_at >= date_trunc('month', NOW())
GROUP BY a.id, a.name
ORDER BY orders_completed DESC;
```

### Flujo de Caja Diario (últimos 30 días)
```sql
SELECT
  DATE(cs.opened_at) as date,
  SUM(ft.amount) FILTER (WHERE ft.type = 'INFLOW') as total_inflow,
  SUM(ft.amount) FILTER (WHERE ft.type = 'OUTFLOW') as total_outflow,
  SUM(ft.amount) FILTER (WHERE ft.type = 'INFLOW') -
  SUM(ft.amount) FILTER (WHERE ft.type = 'OUTFLOW') as net_cash
FROM cashbox_sessions cs
JOIN financial_transactions ft ON cs.id = ft.session_id
WHERE cs.opened_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(cs.opened_at)
ORDER BY date ASC;
```

### Detección de Patrones de Comisión Anómalos (Importaciones)
```sql
-- Alerta cuando el costo de importación supera el +5% del precio base calculado
SELECT
  ea.id,
  ea.description,
  ea.amount,
  ea.created_at,
  s.name as supplier_name,
  -- Comparar con promedio histórico del mismo proveedor
  AVG(ea2.amount) OVER (
    PARTITION BY ea.supplier_id
    ORDER BY ea.created_at
    ROWS BETWEEN 10 PRECEDING AND 1 PRECEDING
  ) as historical_avg,
  (ea.amount - AVG(ea2.amount) OVER (...)) / NULLIF(AVG(ea2.amount) OVER (...), 0) as deviation_pct
FROM expense_authorizations ea
JOIN suppliers s ON ea.supplier_id = s.id
JOIN expense_authorizations ea2 ON ea.supplier_id = ea2.supplier_id
WHERE
  ea.category = 'IMPORT_PARTS'
  AND deviation_pct > 0.05;  -- Más del 5% sobre el promedio histórico
```

## Jobs ETL Programados

```typescript
// Agregaciones nocturnas (2 AM Lima)
@Cron('0 7 * * *')  // UTC = 2 AM Lima (UTC-5)
async runNightlyAggregations() {
  await Promise.all([
    this.aggregateDailyFinancials(),
    this.aggregateMechanicProductivity(),
    this.updateInventoryValuation(),
    this.detectAnomalousImportCosts(),
  ])
}

// Reporte semanal de gerencia (lunes 8 AM)
@Cron('0 13 * * 1')  // UTC = 8 AM Lima lunes
async weeklyManagementReport() {
  const report = await this.buildWeeklyReport()
  await this.notificationsService.sendWeeklyReport(report)
}
```

## Predicción de Demanda (Fase 3)

En Fase 3, este módulo incorporará modelos de predicción para:
- Anticipar necesidades de reposición de inventario basadas en histórico de OTs
- Predecir períodos de alta demanda (previo a vacaciones, revisiones técnicas)
- Alertar sobre ítems con alta rotación y riesgo de agotamiento
