# Database Design — MongoDB / Mongoose

## Tech Stack

| Layer    | Choice         |
| -------- | -------------- |
| Database | MongoDB 7.x    |
| ODM      | Mongoose 8.9   |
| Runtime  | Bun            |
| Language | TypeScript     |

---

## 1. Collections Overview

| Collection          | Purpose                                    | Document Count Estimate |
| ------------------- | ------------------------------------------ | ----------------------- |
| `users`             | User accounts, roles, authentication       | Low (10s–100s)          |
| `financial_records` | Income/expense transactions                | High (100Ks–millions)   |
| `sessions`          | JWT session tracking                       | Medium (active sessions)|
| `audit_logs`        | Immutable audit trail for sensitive actions| High (append-only)      |

Connection is managed in `src/config/database.config.ts` via `mongoose.connect()` with a `maxPoolSize` of 10.

---

## 2. Schema Details

### 2.1 `users`

**Source:** `src/models/User.ts`

| Field             | Type     | Constraints                           | Notes                        |
| ----------------- | -------- | ------------------------------------- | ---------------------------- |
| `_id`             | ObjectId | Auto-generated                        | Standard MongoDB primary key |
| `email`           | String   | `required`, `unique`, `lowercase`, `trim` | Login identifier         |
| `passwordHash`    | String   | `required`                            | bcrypt hash, never returned  |
| `name`            | String   | `required`, `trim`                    | Display name                 |
| `role`            | String   | `enum: [VIEWER, ANALYST, ADMIN]`, default `VIEWER` | RBAC role       |
| `status`          | String   | `enum: [ACTIVE, INACTIVE, SUSPENDED]`, default `ACTIVE` | Account state  |
| `phoneNumber`     | String   | Optional                              | Contact                      |
| `avatar`          | String   | Optional                              | URL to profile image         |
| `timezone`        | String   | Default `"UTC"`                       | For date display             |
| `resetToken`      | String   | Optional                              | Password reset token         |
| `resetTokenExpires`| Date    | Optional                              | Token expiry                 |
| `lastLoginAt`     | Date     | Optional                              | Last successful login        |
| `createdAt`       | Date     | Auto (`timestamps: true`)             |                              |
| `updatedAt`       | Date     | Auto (`timestamps: true`)             |                              |

**Index:**

```
{ status: 1, role: 1 }
```

Supports admin queries like "find all active analysts" or "list suspended admins". Since the user base is small, a compound index is sufficient without over-indexing.

---

### 2.2 `financial_records`

**Source:** `src/models/FinancialRecord.ts`

| Field         | Type      | Constraints                           | Notes                         |
| ------------- | --------- | ------------------------------------- | ----------------------------- |
| `_id`         | ObjectId  | Auto-generated                        |                               |
| `userId`      | ObjectId  | `required`, `ref: "User"`            | FK-style reference to user    |
| `amount`      | Number    | `required`, `min: 0`                  | Always positive; sign is in `type` |
| `type`        | String    | `required`, `enum: [INCOME, EXPENSE]` | Determines sign in analysis   |
| `category`    | String    | `required`, `enum` (20 values below)  | Classification                |
| `date`        | Date      | `required`                            | When transaction occurred     |
| `description` | String    | Optional                              | Free-text notes               |
| `tags`        | [String]  | Default `[]`                          | User-defined labels           |
| `attachments` | [String]  | Default `[]`                          | URLs to uploaded files        |
| `isDeleted`   | Boolean   | Default `false`                       | Soft-delete flag              |
| `deletedAt`   | Date      | Optional                              | Timestamp of soft delete      |
| `deletedBy`   | String    | Optional                              | Who performed the delete      |
| `createdAt`   | Date      | Auto (`timestamps: true`)             |                               |
| `updatedAt`   | Date      | Auto (`timestamps: true`)             |                               |

**Categories (enum):**
- Income: `SALARY`, `FREELANCE`, `INVESTMENT`, `BUSINESS`, `GIFT`, `OTHER_INCOME`
- Expense: `HOUSING`, `UTILITIES`, `GROCERIES`, `TRANSPORTATION`, `HEALTHCARE`, `ENTERTAINMENT`, `EDUCATION`, `SHOPPING`, `DINING`, `TRAVEL`, `INSURANCE`, `DEBT_PAYMENT`, `SAVINGS`, `OTHER_EXPENSE`

**Indexes:**

| Index                         | Purpose                                                   |
| ----------------------------- | --------------------------------------------------------- |
| `{ userId: 1, date: -1 }`    | Primary access pattern — load a user's records by date    |
| `{ userId: 1, type: 1 }`     | Filter user's income vs expense                           |
| `{ userId: 1, category: 1 }` | Filter user's records by category                         |
| `{ date: -1 }`                | Global recent-activity queries                            |
| `{ type: 1 }`                 | Global income/expense aggregation                         |
| `{ category: 1 }`             | Global category grouping                                  |
| `{ isDeleted: 1 }`            | Filter out soft-deleted docs (used in every analytics query) |
| `{ userId: 1, isDeleted: 1, date: -1 }` | Covering index for the most common filtered query |

The last compound index is the most important: almost every analytics query starts with `{ userId, isDeleted: false }` and sorts by date descending.

---

### 2.3 `sessions`

**Source:** `src/models/Session.ts`

| Field          | Type     | Constraints                            | Notes                    |
| -------------- | -------- | -------------------------------------- | ------------------------ |
| `_id`          | ObjectId | Auto-generated                         |                          |
| `userId`       | ObjectId | `required`, `ref: "User"`             | Owner of the session     |
| `token`        | String   | `required`, `unique`                   | JWT or opaque token      |
| `refreshToken` | String   | Optional, `unique`, `sparse: true`     | Only set when issued     |
| `ipAddress`    | String   | Optional                               | Request origin           |
| `userAgent`    | String   | Optional                               | Client identification    |
| `expiresAt`    | Date     | `required`                             | Session TTL              |
| `createdAt`    | Date     | Auto (`timestamps: true`)              |                          |
| `updatedAt`    | Date     | Auto (`timestamps: true`)              |                          |

**Indexes:**

| Index                              | Purpose                                               |
| ---------------------------------- | ----------------------------------------------------- |
| `{ userId: 1 }`                    | Lookup all sessions for a user (e.g., revoke all)     |
| `{ expiresAt: 1 }` (TTL index)     | Auto-delete expired sessions — `expireAfterSeconds: 0` |

The TTL index on `expiresAt` is critical — MongoDB automatically removes expired documents, eliminating the need for a cleanup cron job.

---

### 2.4 `audit_logs`

**Source:** `src/models/AuditLog.ts`

| Field       | Type     | Constraints                      | Notes                           |
| ----------- | -------- | -------------------------------- | ------------------------------- |
| `_id`       | ObjectId | Auto-generated                   |                                 |
| `userId`    | ObjectId | Optional, `ref: "User"`          | Who performed the action        |
| `action`    | String   | `required`                       | e.g. `CREATE`, `UPDATE`, `DELETE` |
| `entity`    | String   | `required`                       | e.g. `User`, `FinancialRecord`  |
| `entityId`  | String   | Optional                         | ID of the affected document     |
| `oldValues` | Mixed    | Optional                         | Snapshot before change          |
| `newValues` | Mixed    | Optional                         | Snapshot after change           |
| `ipAddress` | String   | Optional                         | Request origin                  |
| `userAgent` | String   | Optional                         | Client identification           |
| `createdAt` | Date     | Auto (`timestamps: { createdAt: true, updatedAt: false }`) | |

**Indexes:**

| Index                          | Purpose                                              |
| ------------------------------ | ---------------------------------------------------- |
| `{ userId: 1 }`                | Retrieve audit trail for a specific user             |
| `{ entity: 1, entityId: 1 }`  | Lookup changes to a specific document                |
| `{ action: 1 }`                | Filter by action type                                |
| `{ createdAt: -1 }`            | Show most recent audit entries first (default sort)  |

`audit_logs` uses Mongoose's `Mixed` type for `oldValues` / `newValues`, which stores raw BSON objects — ideal for schema-less audit snapshots.

---

## 3. Mongoose Query Patterns

### 3.1 Basic CRUD

**Create a record (admin only):**

```ts
import { FinancialRecord } from "../models";

const record = await FinancialRecord.create({
  userId: req.user.id,
  amount: 1500.00,
  type: "INCOME",
  category: "SALARY",
  date: new Date("2024-01-15"),
  description: "Monthly salary",
});
```

**List records with filtering and pagination:**

```ts
const filter: Record<string, unknown> = { userId, isDeleted: false };

if (type) filter.type = type;
if (category) filter.category = category;
if (startDate || endDate) {
  filter.date = {};
  if (startDate) filter.date.$gte = new Date(startDate);
  if (endDate) filter.date.$lte = new Date(endDate);
}

const records = await FinancialRecord.find(filter)
  .sort({ date: -1 })
  .skip((page - 1) * limit)
  .limit(limit)
  .lean();
```

**Update a record:**

```ts
const record = await FinancialRecord.findOneAndUpdate(
  { _id: id, userId, isDeleted: false },
  { $set: { amount, description, category } },
  { new: true, runValidators: true },
);
```

**Soft delete:**

```ts
await FinancialRecord.findOneAndUpdate(
  { _id: id, userId },
  { $set: { isDeleted: true, deletedAt: new Date(), deletedBy: adminId } },
);
```

### 3.2 Analytics Aggregations

All analytics queries build a base `$match` stage:

```ts
const match: Record<string, unknown> = { isDeleted: false };

if (userId) match.userId = new mongoose.Types.ObjectId(userId);
if (startDate || endDate) {
  match.date = {};
  if (startDate) match.date.$gte = new Date(startDate);
  if (endDate) match.date.$lte = new Date(endDate);
}
```

**Summary (income vs expense):**

```ts
const [incomeResult, expenseResult] = await Promise.all([
  FinancialRecord.aggregate([
    { $match: { ...match, type: "INCOME" } },
    { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
  ]),
  FinancialRecord.aggregate([
    { $match: { ...match, type: "EXPENSE" } },
    { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
  ]),
]);
```

**Category breakdown:**

```ts
const breakdown = await FinancialRecord.aggregate([
  { $match: match },
  {
    $group: {
      _id: { category: "$category", type: "$type" },
      totalAmount: { $sum: "$amount" },
      count: { $sum: 1 },
    },
  },
  { $sort: { totalAmount: -1 } },
  {
    $project: {
      _id: 0,
      category: "$_id.category",
      type: "$_id.type",
      totalAmount: 1,
      count: 1,
    },
  },
]);
```

**Monthly trends:**

```ts
const trends = await FinancialRecord.aggregate([
  { $match: match },
  {
    $group: {
      _id: { year: { $year: "$date" }, month: { $month: "$date" }, type: "$type" },
      totalAmount: { $sum: "$amount" },
      transactionCount: { $sum: 1 },
    },
  },
  { $sort: { "_id.year": 1, "_id.month": 1, "_id.type": 1 } },
  {
    $project: {
      _id: 0,
      month: { $concat: [
        { $toString: "$_id.year" },
        "-",
        { $cond: { if: { $lt: ["$_id.month", 10] }, then: { $concat: ["0", { $toString: "$_id.month" }] }, else: { $toString: "$_id.month" } } },
      ]},
      type: "$_id.type",
      totalAmount: 1,
      transactionCount: 1,
    },
  },
]);
```

**Weekly trends (ISO weeks):**

```ts
const trends = await FinancialRecord.aggregate([
  { $match: match },
  {
    $group: {
      _id: { year: { $isoWeekYear: "$date" }, week: { $isoWeek: "$date" }, type: "$type" },
      totalAmount: { $sum: "$amount" },
      transactionCount: { $sum: 1 },
    },
  },
  { $sort: { "_id.year": 1, "_id.week": 1, "_id.type": 1 } },
  // ...projection to format as "2024-W03"
]);
```

**Recent activity (with populated user):**

```ts
const recent = await FinancialRecord.find(match)
  .populate("userId", ["_id", "name", "email"])
  .sort({ createdAt: -1 })
  .limit(limit)
  .lean();
```

### 3.3 Session & Auth Queries

**Find session by token (every authenticated request):**

```ts
const session = await Session.findOne({ token }).populate("userId");
```

**Revoke all sessions for a user:**

```ts
await Session.deleteMany({ userId });
```

**Cleanup is automatic** — the TTL index on `expiresAt` handles expired document removal.

### 3.4 Audit Log Queries

**Log an action:**

```ts
await AuditLog.create({
  userId: adminId,
  action: "DELETE",
  entity: "FinancialRecord",
  entityId: recordId,
  oldValues: { amount: 500, type: "EXPENSE" },
  ipAddress: req.ip,
  userAgent: req.headers["user-agent"],
});
```

**Get audit trail for a user:**

```ts
const logs = await AuditLog.find({ userId })
  .sort({ createdAt: -1 })
  .limit(50)
  .lean();
```

---

## 4. Schema Synchronization

Unlike Prisma/PostgreSQL, Mongoose does not require explicit migrations. The schema is defined **in code** via Mongoose schemas at application startup. When the application boots:

1. Mongoose compiles the schema definitions into models.
2. MongoDB auto-creates collections on first document insert.
3. Indexes are auto-created via `schema.index()` calls when Mongoose connects (using `autoIndex: true`, the default in development).

**To apply schema changes in production:**

- Add or remove fields in the schema file — existing documents are not affected.
- Add new indexes — they will be built in the background.
- Remove indexes — delete the `schema.index()` call and manually drop the index via `db.collection.dropIndex()` or use a one-time migration script.

A seed script is available at `src/scripts/seed.ts` (run via `bun run db:seed`) to populate the database with sample users and records for development.

---

## 5. Design Rationale

### 5.1 Why MongoDB?

- **Flexible schema** — The `audit_logs` collection stores arbitrary old/new value snapshots via `Mixed` types, which would require JSONB columns or EAV patterns in PostgreSQL.
- **Embedded arrays** — `tags` and `attachments` on `financial_records` are stored naturally as arrays, avoiding join tables.
- **Aggregation pipeline** — Analytics queries (category breakdown, monthly trends, weekly trends) are expressed as a single pipeline executed server-side, without transferring raw data to the application.
- **TTL indexes** — Session expiry is handled natively by MongoDB, no cron job needed.
- **Operational simplicity** — No migration files to manage; schema evolves with the code.

### 5.2 Soft Deletes

Financial records use a soft-delete pattern (`isDeleted: true`, not physically removed). Rationale:

- **Audit compliance** — Deleted records must be recoverable for a retention period.
- **Analytics integrity** — Analytics queries universally filter `{ isDeleted: false }`, so soft-deleted records do not skew aggregates.
- **Undo support** — A soft delete can be reverted by flipping the flag.

The `sessions` collection, by contrast, uses **hard deletes** (TTL-based removal) since expired sessions have no business value.

### 5.3 Indexing Strategy

The `financial_records` collection carries the heaviest indexing load because it is the largest and most-queried collection. The compound index `{ userId: 1, isDeleted: 1, date: -1 }` serves the primary query pattern: "fetch my non-deleted records sorted by date." Individual field indexes (`type`, `category`, `date`) support the analytics aggregation `$match` stages, where MongoDB can use index intersection if needed.

### 5.4 Relationship Modeling

MongoDB does not enforce foreign-key constraints. Relationships are expressed via `ObjectId` references:

```
financial_records.userId  →  users._id  (via ref: "User")
sessions.userId           →  users._id  (via ref: "User")
audit_logs.userId         →  users._id  (via ref: "User")
```

Application-level validation (in the service layer) ensures referential integrity. The `mongoose.Schema.Types.ObjectId` type paired with Mongoose's `populate()` provides the developer experience of a join without the runtime cost unless explicitly requested.

---

## 6. Connection Configuration

**File:** `src/config/database.config.ts`

```ts
await mongoose.connect(url, {
  dbName: "NexLedger",
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  retryWrites: true,
});
```

- Connection string is sourced from environment variables via `getEnv.database.mongo()`.
- Event listeners log `connected`, `error`, and `disconnected` events.
- A `healthCheck()` method pings the database for health endpoint integration.

---

## 7. Seed Data

Run with:

```bash
bun run db:seed
```

The seed script at `src/scripts/seed.ts` creates:

- 3 users (one per role: admin, analyst, viewer) with known credentials.
- A batch of sample financial records across several months.
- An initial session for each user.

---

## 8. Assumptions & Trade-offs

| Assumption | Rationale |
|---|---|
| Single-currency (USD) | Amount is stored as a raw `Number`. Multi-currency would require a `currency` field and exchange-rate logic. |
| Soft deletes on records only | Users and sessions are hard-deleted (or TTL-expired) because recovery is not required. |
| No $lookup in analytics | Analytics aggregates work on `financial_records` alone. If user-level joins were needed (e.g., "records grouped by user role"), a `$lookup` stage would be added. |
| `date` is user-supplied | The `date` field is when the transaction occurred, not when it was recorded (`createdAt` serves that purpose). This allows back-dating entries. |
| Indexes built by Mongoose | In production with large datasets, index builds should be managed manually (using `autoIndex: false` and running `createIndexes` during maintenance windows) to avoid performance impact. |
