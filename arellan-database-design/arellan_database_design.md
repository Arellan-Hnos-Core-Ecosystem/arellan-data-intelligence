# arellan-database-design — Diseño de Base de Datos

Schema centralizado de PostgreSQL para el ecosistema Arellan Hnos. Definido con Prisma ORM. Fuente de verdad única para la estructura de datos de toda la plataforma.

## Principios de Diseño

- **UUID v4** como Primary Key en todas las tablas (no serial integers) — facilita sharding futuro
- **Soft delete** — registro nunca se elimina físicamente; se marca con `deleted_at`
- **Timestamps auditables** — `created_at` y `updated_at` en todas las tablas
- **Inmutabilidad de audit_logs** — enforced a nivel de BD (ver reglas PostgreSQL)
- **Cifrado de campos sensibles** — cuentas bancarias, MFA secrets con AES-256

## Módulos del Schema (Prisma)

### Identity & Auth
```prisma
model Account {
  id            String    @id @default(uuid())
  email         String    @unique
  passwordHash  String
  mfaSecret     String?   // Cifrado AES-256
  mfaEnabled    Boolean   @default(false)
  role          UserRole
  name          String
  status        AccountStatus @default(ACTIVE)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  deletedAt     DateTime? // Soft delete

  refreshTokens   RefreshToken[]
  workOrders      WorkOrder[]    @relation("MechanicOrders")
  auditLogs       AuditLog[]
  pushSubscriptions PushSubscription[]
}

enum UserRole {
  OWNER ADMIN FINANCE MECHANIC TRAINEE CLIENT
}

enum AccountStatus {
  ACTIVE INACTIVE TERMINATED  // TERMINATED = desvinculado, historial conservado
}
```

### Financial Control
```prisma
model CashboxSession {
  id              String        @id @default(uuid())
  openedById      String
  closedById      String?
  openingBalance  Decimal       @db.Decimal(12, 2)
  closingBalance  Decimal?      @db.Decimal(12, 2)
  actualCash      Decimal?      @db.Decimal(12, 2)
  discrepancy     Decimal?      @db.Decimal(12, 2)
  status          CashboxStatus @default(OPEN)
  notes           String?
  openedAt        DateTime      @default(now())
  closedAt        DateTime?

  transactions    FinancialTransaction[]
  openedBy        Account       @relation("OpenedBy", fields: [openedById], references: [id])
}

model FinancialTransaction {
  id              String        @id @default(uuid())
  sessionId       String
  type            TransactionType
  amount          Decimal       @db.Decimal(12, 2)
  paymentMethod   PaymentMethod
  referenceToken  String?       // Para QR dinámico / POS
  orderId         String?       // OT asociada
  description     String?
  isAudited       Boolean       @default(false)
  createdAt       DateTime      @default(now())
}

model ExpenseAuthorization {
  id              String        @id @default(uuid())
  requesterId     String
  approverId      String?
  amount          Decimal       @db.Decimal(12, 2)
  currency        Currency      @default(PEN)
  category        ExpenseCategory
  description     String
  supplierId      String?
  invoiceUrl      String?       // PDF de factura/proforma
  status          ExpenseStatus @default(PENDING_APPROVAL)
  approvalLevel   ApprovalLevel
  rejectionReason String?
  createdAt       DateTime      @default(now())
  approvedAt      DateTime?
  disbursedAt     DateTime?
}
```

### Work Orders
```prisma
model WorkOrder {
  id                String      @id @default(uuid())
  number            String      @unique  // OT-2026-0001
  vehicleId         String
  clientId          String
  mechanicId        String
  status            OrderStatus @default(RECEIVED)
  description       String
  diagnosis         String?
  laborCost         Decimal?    @db.Decimal(10, 2)
  partsCost         Decimal?    @db.Decimal(10, 2)
  totalCost         Decimal?    @db.Decimal(10, 2)
  receivedAt        DateTime    @default(now())
  estimatedDelivery DateTime?
  deliveredAt       DateTime?
  clientSignature   String?     // URL del archivo de firma digital
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt

  vehicle     Vehicle       @relation(fields: [vehicleId], references: [id])
  client      Client        @relation(fields: [clientId], references: [id])
  mechanic    Account       @relation("MechanicOrders", fields: [mechanicId], references: [id])
  photos      WorkOrderPhoto[]
  parts       WorkOrderPart[]
  statusHistory OrderStatusHistory[]
}
```

### Inventory
```prisma
model InventoryItem {
  id          String    @id @default(uuid())
  sku         String    @unique
  name        String
  category    String
  stock       Int       @default(0)
  minStock    Int       @default(1)
  unitPrice   Decimal   @db.Decimal(10, 2)
  supplierId  String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  movements   InventoryMovement[]
}

model InventoryMovement {
  id          String        @id @default(uuid())
  itemId      String
  type        MovementType  // IN | OUT | ADJUSTMENT
  quantity    Int
  orderId     String?       // Obligatorio para OUT (vinculado a OT)
  authorizedBy String
  justification String?     // Obligatorio para ADJUSTMENT
  unitCost    Decimal?      @db.Decimal(10, 2)
  createdAt   DateTime      @default(now())
}
```

### Audit Log (Inmutable)
```prisma
model AuditLog {
  id          String    @id @default(uuid())
  userId      String
  userName    String
  role        String
  action      String    // FINANCE_EXPENSE_APPROVED, ORDER_STATUS_CHANGED, etc.
  entity      String?
  entityId    String?
  beforeState Json?     // Estado antes del cambio
  afterState  Json?     // Estado después del cambio
  ipAddress   String
  userAgent   String?
  metadata    Json?
  createdAt   DateTime  @default(now())

  // Sin updatedAt ni deletedAt — solo INSERT
  user        Account   @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([action])
  @@index([createdAt])
}
```

## Índices Críticos

```sql
-- Búsqueda de OTs por estado y mecánico (frecuente en mechanic-ui)
CREATE INDEX idx_orders_mechanic_status ON work_orders(mechanic_id, status);

-- Búsqueda por placa (frecuente en client-portal)
CREATE INDEX idx_vehicles_plate ON vehicles(plate);

-- Audit log por usuario y fecha (filtros en admin)
CREATE INDEX idx_audit_user_date ON audit_logs(user_id, created_at DESC);

-- Transacciones financieras por sesión (cierre de caja)
CREATE INDEX idx_transactions_session ON financial_transactions(session_id);

-- Stock bajo mínimo (query frecuente del worker)
CREATE INDEX idx_inventory_stock ON inventory_items(stock) WHERE stock <= min_stock;
```
