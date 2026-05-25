# arellan-data-governance — Gobernanza y Política de Datos

Políticas de clasificación, uso, retención y protección de datos para el ecosistema Arellan Hnos. Cumplimiento con Ley N.º 29733 (Ley de Protección de Datos Personales del Perú).

## Marco Legal Aplicable

| Norma | Aplicación |
|-------|-----------|
| **Ley N.° 29733** — Ley de Protección de Datos Personales (Perú) | Datos de clientes (DNI, email, teléfono, dirección) |
| **DS 003-2013-JUS** — Reglamento de la Ley 29733 | Obligación de registro de base de datos ante MINJUS |
| **Ley N.° 30096** — Delitos Informáticos | Protección contra accesos no autorizados |

## Clasificación de Datos

### Nivel 1 — Crítico (máxima protección)
Datos que si se exponen generan impacto financiero o legal inmediato.
- `audit_logs` — registros de auditoría forense
- `refresh_tokens` — sesiones activas de usuarios
- `mfa_secrets` — secretos TOTP de autenticación
- `account.password_hash` — contraseñas hasheadas

**Controles:** Inmutabilidad BD, cifrado AES-256, acceso solo por sistema

### Nivel 2 — Confidencial (acceso restringido por rol)
Datos financieros y de gestión interna.
- `financial_transactions`, `cashbox_sessions`, `expense_authorizations`
- `account.email`, `account.role`, `account.status`

**Controles:** RBAC estricto, audit log en cada acceso, MFA requerido para exportar

### Nivel 3 — Interno (acceso por rol de empleado)
Datos operativos del taller.
- `work_orders`, `inventory`, `vehicles`, `clients`
- `personnel.attendance`

**Controles:** RBAC, datos de clientes enmascarados para mecánicos

### Nivel 4 — Público (sin restricción)
- Estado de OT por código (sin datos personales)
- Uptime de servicios en `status.arellan.pe`

## Retención de Datos

| Tipo de dato | Retención | Justificación |
|-------------|-----------|---------------|
| Audit logs | Indefinida | Requisito legal y forense |
| Transacciones financieras | 7 años | Requisito tributario SUNAT |
| Órdenes de trabajo | 5 años | Historial de servicio del vehículo |
| Historial de clientes | 5 años | Relación comercial |
| Sesiones y tokens | 90 días (expirados) | Análisis de seguridad |
| Logs de aplicación | 90 días | Debugging y análisis |
| Fotos de vehículos | 3 años post-entrega | Evidencia de estado al ingreso/salida |

## Derechos del Titular (ARCO)

Bajo la Ley 29733, los clientes tienen derecho a:
- **Acceso** — solicitar qué datos suyos almacenamos
- **Rectificación** — corregir datos incorrectos
- **Cancelación** — solicitar eliminación (con limitaciones por retención legal)
- **Oposición** — oponerse al tratamiento de sus datos

**Proceso:** El cliente envía solicitud por email a `datos@arellan.pe`. El equipo responde en máximo 20 días hábiles.

## Minimización de Datos

Principios aplicados en el diseño del sistema:
- Los mecánicos **no ven** nombre, teléfono ni DNI del propietario del vehículo — solo placa y modelo
- El portal público de clientes no registra cookies de rastreo ni datos de comportamiento
- No se almacenan números completos de tarjetas de crédito (solo últimos 4 dígitos + token de pasarela)

## Base de Datos MINJUS

Bajo la Ley 29733, el banco de datos de clientes del taller debe inscribirse ante el MINJUS. Esta inscripción es responsabilidad de los owners y debe realizarse antes del lanzamiento del portal de clientes.

Documentación de la inscripción se mantiene en `arellan-security-compliance/arellan-legal-compliance`.
