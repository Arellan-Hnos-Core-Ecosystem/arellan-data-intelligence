# arellan-data-intelligence

Repositorio de datos e inteligencia empresarial de la Clínica Automotriz Arellan Hnos. Contiene el schema centralizado de base de datos, pipelines de datos, modelos de BI y (en fases posteriores) modelos de IA para predicción y detección de anomalías.

## Descripción

`arellan-data-intelligence` es el repositorio macro de todo lo relacionado con datos. No tiene código ejecutable propio — sus definiciones (schema Prisma, migraciones, queries analíticos) son consumidos por `arellan-platform` y por las herramientas de BI.

## Estructura

```
arellan-data-intelligence/
├── arellan-database-design/       # Schema Prisma, ERD, diseño de BD
├── arellan-data-pipeline/         # ETL, transformaciones, queries analíticos
├── arellan-data-governance/       # Políticas de datos, clasificación, retención
├── arellan-business-intelligence-lab/  # Dashboards Grafana, queries de negocio
├── arellan-ai-analytics-core/     # Modelos predictivos (Fase 3)
└── arellan-ai-automation/         # Automatizaciones IA (Fase 3)
```

## Fases de Activación

| Fase | Submódulo activo | Descripción |
|------|-----------------|-------------|
| Fase 1 (MVP) | `arellan-database-design` | Schema centralizado + migraciones Prisma |
| Fase 2 (Consolidación) | `arellan-data-pipeline` + `arellan-business-intelligence-lab` | ETL, reportes ejecutivos, dashboards Grafana |
| Fase 2 | `arellan-data-governance` | Políticas de clasificación y retención de datos |
| Fase 3 (Escala) | `arellan-ai-analytics-core` | Detección de fraude, predicción de demanda |
| Fase 3 | `arellan-ai-automation` | Automatizaciones basadas en IA |

## Principios de Datos

1. **Privacy by Design** — los datos de clientes se almacenan con el mínimo necesario
2. **Data Minimization** — no recopilar datos que no tengan una función clara
3. **Audit Trail** — todo cambio en datos críticos queda en `audit_logs`
4. **Clasificación** — cada tabla tiene una clasificación de sensibilidad definida

## Clasificación de Datos

| Clasificación | Tablas | Tratamiento |
|--------------|--------|-------------|
| **Crítico** | `audit_logs`, `financial_transactions`, `expense_authorizations` | Inmutable, cifrado, acceso solo `OWNER` |
| **Confidencial** | `accounts`, `refresh_tokens`, `cashbox_sessions` | Cifrado en reposo, acceso por rol |
| **Interno** | `work_orders`, `inventory`, `vehicles` | Acceso por rol RBAC |
| **Público** | Estado de OT (sin datos personales), uptime de servicios | Sin restricción |

## Repos Relacionados

- `arellan-platform` — consume el schema de BD definido aquí
- `arellan-docs-governance` — ADRs y decisiones técnicas de datos
- `arellan-security-compliance` — políticas de protección de datos

## Licencia

Privado — © 2026 Arellan Hnos. Todos los derechos reservados.
