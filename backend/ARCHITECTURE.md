# NexLedger Backend Architecture

## System Overview

```
┌──────────────────────────────────────────────────────────────┐
│                        Bun Runtime                           │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                    Express (v5)                        │  │
│  │  ┌─────────┐  ┌──────────┐  ┌─────────┐  ┌────────┐  │  │
│  │  │ Routes  │→ │Controllers│→ │Services │→ │ Models │  │  │
│  │  └─────────┘  └──────────┘  └─────────┘  └───┬────┘  │  │
│  │       │            │              │           │       │  │
│  │  ┌────▼────┐  ┌────▼────┐  ┌─────▼─────┐  ┌──▼────┐  │  │
│  │  │ Zod     │  │Error    │  │Validators │  │Mongoose│  │  │
│  │  │Validate │  │Middleware│  │(Zod)      │  │ODM     │  │  │
│  │  └─────────┘  └─────────┘  └───────────┘  └───┬───┘  │  │
│  │                                                 │       │
│  └─────────────────────────────────────────────────┼───────┘  │
│                                                    │          │
│  ┌─────────────────────────────────────────────────▼───────┐  │
│  │                    MongoDB                              │  │
│  │  ┌──────────┐  ┌──────────────────┐  ┌──────────────┐  │  │
│  │  │  users   │  │financial_records │  │   sessions   │  │  │
│  │  └──────────┘  └──────────────────┘  └──────────────┘  │  │
│  │  ┌──────────┐                                            │  │
│  │  │audit_logs│                                            │  │
│  │  └──────────┘                                            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
│  External: Resend API (Transactional Email)                    │
└────────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Runtime** | Bun 1.x | Fast startup, built-in TS support, Bun's `bun --hot` for dev reloading |
| **Framework** | Express (v5) | Mature, widely known, minimal overhead, large ecosystem |
| **Database** | MongoDB 7.x | Document model suits flexible financial record schemas; rich aggregation pipeline for analytics |
| **ODM** | Mongoose 8.9.5 | Schema validation, middleware hooks, populate, lean queries |
| **Validation** | Zod 4.x | TypeScript-first schema validation; compile-time type inference |
| **Auth** | JWT (jsonwebtoken) + bcryptjs | Stateless token verification with session-level revocation tracking |
| **Email** | Resend API | Modern transactional email API; no SMTP server management |
| **Logging** | Winston + Morgan | Structured logging with request-level Morgan integration |

---

## Architectural Patterns

### 1. Layered Architecture

The application follows strict separation of concerns with four layers:

```
HTTP Request
    │
    ▼
┌────────────────┐
│    Routes      │  → Define URL mappings and middleware chains
├────────────────┤
│  Controllers   │  → Parse request, delegate to services, format response
├────────────────┤
│   Services     │  → Business logic, validation, orchestration
├────────────────┤
│    Models      │  → Mongoose schemas with indexes and data access
└────────────────┘
    │
    ▼
  MongoDB
```

### 2. Service Layer Pattern

All services are stateless static classes with private constructors:

```typescript
export class RecordService {
  private constructor() {}

  static async create(input: CreateRecordInput) {
    const doc = await FinancialRecord.create({ ... });
    // ...
  }
}
```

- No `new` instantiation — pure static methods
- Private constructor prevents instantiation
- Each method is a self-contained unit of business logic
- Services compose freely (e.g., `AuthService` calls `SessionService`, `EmailService`)

### 3. Middleware Pipeline

Express middleware is used for cross-cutting concerns in a specific order:

```
Request
  │
  ├── helmet()              → Security headers
  ├── cors()                → Cross-origin
  ├── compression()         → Gzip response
  ├── express.json()        → Body parsing
  ├── morganMiddleware      → HTTP request logging (Winston)
  │
  ├── [Route-specific]
  │   ├── authMiddleware    → JWT verification + session check
  │   ├── rbac()            → Role-based access gate
  │   └── validate()        → Zod schema validation (body / query / params)
  │
  └── errorMiddleware       → Global error handler (catch-all)
```

### 4. Factory Pattern for Errors

`AppError` uses named static factory methods for descriptive, consistent errors:

```typescript
throw AppError.notFound("Financial record");     // 404
throw AppError.unauthorized("Invalid token");     // 401
throw AppError.forbidden("Insufficient role");    // 403
throw AppError.badRequest("Invalid amount");      // 400
throw AppError.validationError(details);          // 422
throw AppError.conflict("Email already exists");  // 409
throw AppError.internal("Something went wrong");  // 500
```

### 5. Data Access via Mongoose Models

Data access is encapsulated through Mongoose models directly in service methods. There is no separate repository layer — Mongoose models serve as both schema definition and data access API.

**Query patterns used throughout services:**

| Pattern | Example |
|---------|---------|
| Create | `User.create({ ... })`, `FinancialRecord.create({ ... })` |
| Find one | `User.findOne({ email })`, `FinancialRecord.findOne({ _id, isDeleted: false })` |
| Find by ID | `User.findById(id)`, `Session.findById(id)` |
| Find with filters | `FinancialRecord.find({ userId, isDeleted: false, ... }).sort({ date: -1 })` |
| Find and update | `User.findByIdAndUpdate(id, { ... }, { new: true })` |
| Count | `FinancialRecord.countDocuments(query)` |
| Delete | `Session.findByIdAndDelete(id)`, `User.findByIdAndDelete(id)` |
| Bulk delete | `Session.deleteMany({ userId })` |
| Aggregation | `FinancialRecord.aggregate([ { $match }, { $group }, { $sort } ])` |
| Lean queries | All read queries use `.lean()` for plain JS objects (faster, no Mongoose hydration) |
| Populate | `.populate("userId", ["_id", "name", "email"])` for reference resolution |

**No transactions used** — MongoDB replica sets would be required for multi-document transactions. The application uses `Promise.all` for parallel independent operations, accepting eventual consistency for non-critical paths (e.g., fetching records + total count simultaneously).

---

## Layer Breakdown

### Routes (`src/routes/`)

Route files define endpoint → middleware → controller bindings. Each module exports a `Router` instance.

**Route structure:**

```
/api
├── /health        → healthRouter    (public, no auth)
├── /auth          → authRouter      (register/login public, logout/change-password authenticated)
├── /users         → userRouter      (admin CRUD)
├── /me            → userRouter      (self profile — same router, different paths)
├── /records       → recordRouter    (view: all roles, create/update/delete: admin)
├── /analytics     → analyticsRouter (analyst+)
└── /audit         → auditRouter     (admin only)
```

**Middleware binding pattern per route:**

```typescript
router.get(
  "/",
  authMiddleware as any,          // 1. Verify JWT + session
  allRoles as any,                // 2. Check RBAC
  validate({ query: Schema }),    // 3. Validate input
  Controller.list                 // 4. Delegate to controller
);
```

### Controllers (`src/controllers/`)

Controllers handle HTTP concerns only:

- Extract data from `req.params`, `req.query`, `req.body`, `req.user`
- Call the appropriate service method
- Format and send the response via utility helpers (`sendSuccess`, `sendCreated`, `sendPaginated`)
- Pass errors to `next(error)` for the global error middleware

Controller methods are static, following the same pattern as services.

### Services (`src/services/`)

Business logic layer:

| Service | Responsibility |
|---------|---------------|
| `AuthService` | Register, login, token refresh, password management, token verification |
| `SessionService` | Create/find/update/revoke sessions, expired session cleanup |
| `UserService` | User CRUD (admin), profile get/update (self) |
| `RecordService` | Financial record CRUD with soft-delete, filtered listing |
| `AnalyticsService` | Aggregation queries: summary, category breakdown, monthly/weekly trends, recent activity, income/expense ratio |
| `AuditService` | Create audit log entries, list with filters |
| `EmailService` | Send transactional emails via Resend API |
| `HealthService` | System health check (DB ping, memory, uptime) |

**Analytics aggregation examples (MongoDB pipeline):**

```typescript
// Monthly trends via $year/$month extraction
FinancialRecord.aggregate([
  { $match: { isDeleted: false, type: "INCOME", date: { $gte: start, $lte: end } } },
  { $group: { _id: { year: { $year: "$date" }, month: { $month: "$date" }, type: "$type" }, totalAmount: { $sum: "$amount" }, transactionCount: { $sum: 1 } } },
  { $sort: { "_id.year": 1, "_id.month": 1 } },
]);

// Category breakdown
FinancialRecord.aggregate([
  { $match: { isDeleted: false } },
  { $group: { _id: { category: "$category", type: "$type" }, totalAmount: { $sum: "$amount" }, count: { $sum: 1 } } },
  { $sort: { totalAmount: -1 } },
]);
```

### Models (`src/models/`)

Four Mongoose models with schema-level validation and compound indexes:

**User** (`users` collection)
```
{
  email:        String (unique, lowercase, trim, required)
  passwordHash: String (required)
  name:         String (required)
  role:         Enum [VIEWER, ANALYST, ADMIN] (default: VIEWER)
  status:       Enum [ACTIVE, INACTIVE, SUSPENDED] (default: ACTIVE)
  phoneNumber:  String (optional)
  avatar:       String (optional)
  timezone:     String (default: "UTC")
  resetToken:   String (optional)
  resetTokenExpires: Date (optional)
  lastLoginAt:  Date (optional)
  timestamps:   createdAt, updatedAt (auto)
}
Index: { status: 1, role: 1 }
```

**FinancialRecord** (`financial_records` collection)
```
{
  userId:      ObjectId (ref: User, required)
  amount:      Number (min: 0, required)
  type:        Enum [INCOME, EXPENSE] (required)
  category:    Enum [SALARY, FREELANCE, ..., OTHER_EXPENSE] (required)
  date:        Date (required)
  description: String (optional)
  tags:        [String] (default: [])
  attachments: [String] (default: [])
  isDeleted:   Boolean (default: false)
  deletedAt:   Date (optional)
  deletedBy:   String (optional)
  timestamps:  createdAt, updatedAt (auto)
}
Indexes:
  { userId: 1, date: -1 }
  { userId: 1, type: 1 }
  { userId: 1, category: 1 }
  { date: -1 }
  { type: 1 }
  { category: 1 }
  { isDeleted: 1 }
  { userId: 1, isDeleted: 1, date: -1 }
```

**Session** (`sessions` collection)
```
{
  userId:       ObjectId (ref: User, required)
  token:        String (unique, required)
  refreshToken: String (unique, sparse)
  ipAddress:    String (optional)
  userAgent:    String (optional)
  expiresAt:    Date (required)
  timestamps:   createdAt, updatedAt (auto)
}
Indexes:
  { userId: 1 }
  { expiresAt: 1 } with TTL (expireAfterSeconds: 0) for auto-cleanup
```

**AuditLog** (`audit_logs` collection)
```
{
  userId:    ObjectId (ref: User, optional)
  action:    String (required)
  entity:    String (required)
  entityId:  String (optional)
  oldValues: Mixed (optional)
  newValues: Mixed (optional)
  ipAddress: String (optional)
  userAgent: String (optional)
  createdAt: Date (auto, no updatedAt)
}
Indexes:
  { userId: 1 }
  { entity: 1, entityId: 1 }
  { action: 1 }
  { createdAt: -1 }
```

### Middleware (`src/middlewares/`)

| Middleware | Purpose |
|-----------|---------|
| `auth.middleware.ts` | Extracts Bearer token, verifies JWT, validates session exists and is not expired, attaches `req.user` |
| `rbac.middleware.ts` | Higher-order function returning middleware that checks `req.user.role` against allowed roles |
| `validate.middleware.ts` | Accepts `{ body?, query?, params? }` Zod schemas; parses and replaces with typed data on success, throws `AppError.validationError` on failure |
| `error.middleware.ts` | Global catch-all: formats `AppError` instances with status/code/details, returns generic 500 for unexpected errors |

---

## Request Flow

### Full Lifecycle

```
Client                    Express                        Mongoose                  MongoDB
  │                         │                              │                        │
  │  POST /api/records      │                              │                        │
  │────────────────────────►│                              │                        │
  │                         │                              │                        │
  │                         │  helmet / cors / compression │                        │
  │                         │─────────────────────────────►│                        │
  │                         │                              │                        │
  │                         │  authMiddleware              │                        │
  │                         │  ├─ Extract Bearer token     │                        │
  │                         │  ├─ jwt.verify(token)        │                        │
  │                         │  ├─ Session.findByToken()    │──► Session.findOne()───►│
  │                         │  │                           │◄── session doc ◄───────│
  │                         │  └─ Attach req.user          │                        │
  │                         │                              │                        │
  │                         │  rbac(ADMIN)                 │                        │
  │                         │  └─ Check role === ADMIN     │                        │
  │                         │                              │                        │
  │                         │  validate({ body })          │                        │
  │                         │  └─ schema.parse(req.body)   │                        │
  │                         │                              │                        │
  │                         │  RecordController.create     │                        │
  │                         │  └─ RecordService.create()   │                        │
  │                         │       ├─ FinancialRecord     │──► create() ──────────►│
  │                         │       │   .create({...})     │◄── new doc ◄───────────│
  │                         │       ├─ FinancialRecord     │──► findById() ────────►│
  │                         │       │   .findById()        │◄── populated doc ◄─────│
  │                         │       │   .populate("userId")│                        │
  │                         │       └─ return record       │                        │
  │                         │                              │                        │
  │                         │  sendCreated(res, record)    │                        │
  │  { success: true,       │◄─────────────────────────────│                        │
  │    data: { ... } }      │                              │                        │
  │◄────────────────────────┤                              │                        │
```

### Error Handling Flow

```
Service throws AppError
  │
  ▼
Controller catches → next(error)
  │
  ▼
errorMiddleware
  │
  ├── Is AppError?
  │     YES → res.status(err.statusCode).json({
  │       success: false,
  │       error: { code, message, details }
  │     })
  │
  └── NO (unhandled)
        → logger.error(err)
        → res.status(500).json({
            success: false,
            error: { code: "INTERNAL_ERROR", message: "Something went wrong" }
          })
```

### Validation Error Flow

```
Zod schema.parse() fails
  │
  ▼
validate.middleware catches ZodError
  │
  ├── Maps issues to: [{ field, message, code }]
  ├── next(AppError.validationError(details))
  │
  ▼
errorMiddleware returns 422 with field-level details
```

**Standard error response shape:**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      { "field": "amount", "message": "Amount must be greater than 0", "code": "too_small" }
    ]
  }
}
```

**Standard success response shape:**

```json
{
  "success": true,
  "message": "Financial record created successfully",
  "data": { "id": "...", "amount": 1500.00, ... }
}
```

**Standard paginated response shape:**

```json
{
  "success": true,
  "message": "Success",
  "data": [ ... ],
  "meta": { "page": 1, "limit": 20, "total": 42, "totalPages": 3 }
}
```

---

## Design Decisions

### Why MongoDB + Mongoose over PostgreSQL/Prisma

| Concern | Decision | Rationale |
|---------|----------|-----------|
| **Schema flexibility** | MongoDB | Financial records may have varying fields per category (e.g., mileage for transportation, biller info for utilities). Document model accommodates this naturally without migrations. |
| **Analytics workload** | MongoDB Aggregation | The `$group`, `$year`, `$month`, `$isoWeek` pipeline stages map directly to the required analytics. No mapping layer needed — aggregation runs natively. |
| **Development speed** | Mongoose | Schema validation at the application layer + lean queries for read performance. No ORM impedance mismatch — documents map 1:1 to JSON. |
| **Index management** | Mongoose schema indexes | Declarative `.index()` calls in schema definition. No separate migration files needed. |
| **Data relationships** | Manual refs + `.populate()` | Simple reference pattern for user→records. Two simple queries or a populate call vs. JOINs. Acceptable at expected data volumes. |

### JWT + Session Hybrid

- **Access tokens** (15m TTL) are stateless JWT — verified without DB lookup on every request
- **Refresh tokens** (7d TTL) enable silent re-authentication
- **Session documents** in MongoDB track active tokens and enable server-side revocation
- On password change, all sessions for the user are revoked (`SessionService.revokeAllForUser`)
- The `authMiddleware` validates both the JWT signature AND the session document existence, combining the speed of stateless JWT with the control of server-side sessions

### Soft Deletes for Financial Records

- `FinancialRecord` uses `isDeleted: false` as a query filter, not physical deletion
- Deleted records retain `deletedAt` and `deletedBy` for audit trail
- All list/get operations filter `{ isDeleted: false }` by default
- Rationale: Financial data must never be permanently lost; soft deletes enable recovery and audit compliance

### RBAC at the Route Level

- Role checks are applied as middleware (`rbac(role1, role2, ...)`) at route definition time
- Pre-built guards: `allRoles`, `analystAndAbove`, `adminOnly`
- Permission matrix is visible directly in route files — no external policy configuration needed
- This approach is simpler and more transparent than decorators or centralized policy registries

### Static Classes over Dependency Injection

- All services and controllers are static classes with private constructors
- No DI container, no constructor injection
- Simplicity over abstraction: at this scale, DI adds ceremony without proportional benefit
- Services are pure functions grouped by domain — easy to test, easy to reason about

### Resend over SMTP/Nodemailer

- Resend is a modern transactional email API (similar to SendGrid, Postmark)
- No SMTP server configuration, no mail transport management
- Simple HTTP API call via the Resend SDK (`resend.emails.send(...)`)
- Graceful fallback: if `RESEND_API_KEY` is not set, the application logs a warning and continues without email

### Winston + Morgan for Logging

- Winston provides structured JSON logging with configurable transports
- Morgan integrates with Winston to capture HTTP request/response cycle as structured log entries
- Log levels: `error`, `warn`, `info`, `debug` — configured via `NODE_ENV`

### Timezone and Date Handling

- All dates stored as UTC in MongoDB (Mongoose default)
- `date` field on FinancialRecord is the transaction date (user-facing, no time component)
- `createdAt`/`updatedAt` are server timestamps (UTC)
- Filtering uses `$gte`/`$lte` comparisons on Date objects
- No timezone conversion at the API layer — the frontend handles display-timezone formatting

---

## Security Architecture

### Authentication Flow

```
┌─────────┐     ┌──────────────┐     ┌──────────┐     ┌─────────────┐
│  POST   │     │   Auth       │     │  User    │     │   Session   │
│ /login  │────►│   Service    │────►│  Model   │────►│   Model     │
│         │     │              │     │          │     │             │
│         │     │  1. Find user│     │ findBy   │     │             │
│         │     │     by email │────►│ email()  │     │             │
│         │     │              │     │          │     │             │
│         │     │  2. Compare  │     │          │     │             │
│         │     │     password │     │          │     │             │
│         │     │     (bcrypt) │     │          │     │             │
│         │     │              │     │          │     │             │
│         │     │  3. Check    │     │          │     │             │
│         │     │     status   │     │          │     │             │
│         │     │              │     │          │     │             │
│         │     │  4. Generate │     │          │     │             │
│         │     │     JWT      │     │          │     │             │
│         │     │              │     │          │     │             │
│         │     │  5. Create   │     │          │     │             │
│         │     │     session  │────►│          │────►│ create()    │
│         │     │              │     │          │     │             │
│         │     │  6. Update   │     │          │     │             │
│         │     │  lastLoginAt │────►│findById  │     │             │
│         │     │              │     │+Update   │     │             │
│◄────────┤     │              │     │          │     │             │
│ {user,  │     │  7. Return   │     │          │     │             │
│ tokens, │     │  {user,      │     │          │     │             │
│session} │     │  accessToken,│     │          │     │             │
│         │     │  refreshToken│     │          │     │             │
│         │     │  sessionId}  │     │          │     │             │
└─────────┘     └──────────────┘     └──────────┘     └─────────────┘
```

### Token Verification (per-request)

```
Request with Authorization: Bearer <token>
  │
  ▼
authMiddleware
  ├── 1. Extract token from header
  ├── 2. jwt.verify(token, ACCESS_TOKEN_SECRET) → decoded payload
  │       Payload: { userId, email, role, status, iat, exp }
  ├── 3. Session.findByToken(token) → session doc
  ├── 4. Check session.expiresAt > now
  ├── 5. Attach to req.user: { userId, email, role, status, sessionId }
  │
  ▼
  next() → downstream middleware / controller
```

### RBAC Enforcement

```typescript
// Usage in routes:
router.delete("/:id", authMiddleware, adminOnly, RecordController.delete);
router.get("/analytics/summary", authMiddleware, analystAndAbove, AnalyticsController.getSummary);

// Guard definitions:
export const adminOnly = rbac(UserRole.ADMIN);
export const analystAndAbove = rbac(UserRole.ANALYST, UserRole.ADMIN);
export const allRoles = rbac(UserRole.VIEWER, UserRole.ANALYST, UserRole.ADMIN);
```

Visual permission matrix:

| Action | VIEWER | ANALYST | ADMIN |
|--------|--------|---------|-------|
| View dashboard | ✓ | ✓ | ✓ |
| View records | ✓ | ✓ | ✓ |
| View analytics | ✗ | ✓ | ✓ |
| Create records | ✗ | ✗ | ✓ |
| Update records | ✗ | ✗ | ✓ |
| Delete records | ✗ | ✗ | ✓ |
| Manage users | ✗ | ✗ | ✓ |
| View audit logs | ✗ | ✗ | ✓ |

### Password Reset Flow

```
1. POST /auth/forgot-password { email }
   │
   ├── Find user by email (silent on not-found — no email enumeration)
   ├── Generate crypto.randomBytes(32) token
   ├── Store token + 1hr expiry on user document
   └── Send email via Resend API with reset link

2. POST /auth/reset-password { token, newPassword }
   │
   ├── Find user by { resetToken, resetTokenExpires: { $gt: now } }
   ├── Hash new password (bcryptjs, 12 rounds)
   ├── Update user: passwordHash, resetToken=null, resetTokenExpires=null
   └── Revoke all sessions for user
```

### Security Measures

- Passwords hashed with bcryptjs (12 salt rounds)
- JWT signed with separate access/refresh secrets
- Session TTL enforcement (7 days) + TTL index on `sessions.expiresAt` for automatic cleanup
- `helmet()` for security headers (HSTS, XSS, etc.)
- CORS configurable via `CORS_ORIGIN` env var
- No password hashes or sensitive data returned in API responses
- `email` is case-insensitive (stored lowercase via Mongoose `lowercase: true`)
- Rate limiting is expected at the infrastructure/reverse-proxy level

---

## Scalability Considerations

### Connection Pooling

Mongoose uses a built-in connection pool:

```typescript
await mongoose.connect(url, {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
});
```

- Pool size is configurable via `maxPoolSize`
- Each connection is multiplexed across all model operations
- In a multi-instance deployment, each process maintains its own pool

### Index Strategy

FinancialRecord indexes are designed for the query patterns:

- `{ userId: 1, date: -1 }` — Most common list query: "show my records sorted by date"
- `{ userId: 1, type: 1, date: -1 }` — Filter by type within a user's records
- `{ userId: 1, category: 1, date: -1 }` — Filter by category
- `{ userId: 1, isDeleted: 1, date: -1 }` — Soft-delete filtered queries
- `{ date: -1 }` — Global analytics queries across users
- Session TTL index auto-deletes expired documents

### Aggregation Optimization

- All analytics queries use server-side MongoDB aggregation pipeline — no data is fetched into application memory for computation
- `$match` stages are pushed first in every pipeline to leverage indexes
- Parallel independent aggregations with `Promise.all` (e.g., income + expense totals in `getSummary`)

### Stateless Horizon

- Access tokens are stateless JWT — no DB lookup needed for token verification itself
- Session lookup is the only DB hit per authenticated request
- If scale demands, sessions could be moved to Redis without changing the authentication pattern

### Future Horizontal Scaling

- Application is stateless (all state in MongoDB)
- Multiple instances can be deployed behind a load balancer
- MongoDB connection pool per instance
- Aggregation pipeline is CPU-bound on MongoDB — scaling reads is achieved by adding MongoDB secondaries or sharding the `financial_records` collection by `userId`

---

## Key Directories

```
src/
├── app.ts                    Express app setup, middleware registration
├── server.ts                 Entry point: DB connect, email init, start server
├── config/
│   ├── database.config.ts    Mongoose connection management (connect/disconnect/health)
│   ├── env.config.ts         Environment variable access (required/optional/typed)
│   └── resend.config.ts      Resend API client singleton
├── controllers/              Request handlers (6 controllers)
│   ├── auth.controller.ts
│   ├── user.controller.ts
│   ├── record.controller.ts
│   ├── analytics.controller.ts
│   ├── audit.controller.ts
│   └── health.controller.ts
├── services/                 Business logic (8 services)
│   ├── auth.service.ts       Register, login, tokens, passwords
│   ├── session.service.ts    Session CRUD, revocation, cleanup
│   ├── user.service.ts       User CRUD, profile management
│   ├── record.service.ts     Financial record CRUD with soft-delete
│   ├── analytics.service.ts  Aggregation summaries, trends, breakdowns
│   ├── audit.service.ts      Audit log creation and querying
│   ├── email.service.ts      Transactional email via Resend
│   └── health.service.ts     System health checks
├── models/                   Mongoose schemas (4 models)
│   ├── User.ts
│   ├── FinancialRecord.ts
│   ├── Session.ts
│   └── AuditLog.ts
├── middlewares/              Express middleware (4 files)
│   ├── auth.middleware.ts    JWT verification + session validation
│   ├── rbac.middleware.ts    Role-based access control
│   ├── validate.middleware.ts Zod schema validation
│   └── error.middleware.ts   Global error handler
├── routes/                   Route definitions (7 routers)
├── validations/              Zod schemas (5 files)
├── types/                    TypeScript interfaces and utility types
├── utils/                    Helpers (AppError, logger, response format, morgan)
└── scripts/                  Database seed scripts
```

---

## Environment Variables

```
# App
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL=mongodb://localhost:27017/NexLedger

# JWT
ACCESS_TOKEN_SECRET=<random>
REFRESH_TOKEN_SECRET=<random>
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# Client
CLIENT_URL=http://localhost:3000

# CORS
CORS_ORIGIN=*

# Email (Resend)
RESEND_API_KEY=re_...
EMAIL_FROM=NexLedger <onboarding@resend.dev>

# Pagination
DEFAULT_PAGE=1
DEFAULT_LIMIT=20
MAX_LIMIT=100

# Features
FEATURE_SEED_ON_START=false
```
