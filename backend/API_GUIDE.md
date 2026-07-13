# 📖 NexLedger API Documentation

Detailed REST API reference for the NexLedger Finance Dashboard. All endpoints return a consistent JSON response format.

---

## 🏗️ Global Response Format

### Success Response (200, 201)
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response (400, 401, 403, 404, 500)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      { "field": "email", "message": "Invalid email format" }
    ]
  }
}
```

---

## 🔐 Authentication Endpoints

### Register User
**POST** `/api/auth/register` | Public
- **Body**: `{ "email", "password", "name", "role" }`
- **Roles**: `VIEWER` (default), `ANALYST`, `ADMIN`.

### Login
**POST** `/api/auth/login` | Public
- **Body**: `{ "email", "password" }`
- **Returns**: `accessToken`, `refreshToken`, `user`.

### Refresh Access Token 
**POST** `/api/auth/refresh` | Public
- **Body**: `{ "refreshToken" }`
- **Returns**: `accessToken`.

### Logout
**POST** `/api/auth/logout` | Auth Required
- **Returns**: Revokes current session.

### Forgot Password
**POST** `/api/auth/forgot-password` | Public
- **Body**: `{ "email" }`
- **Returns**: Sends 1-hour reset token via email (Resend API).

### Reset Password
**POST** `/api/auth/reset-password` | Public
- **Body**: `{ "token", "newPassword" }`
- **Returns**: Updates password and revokes all active sessions.

---

## 📈 Financial Records (CRUD)

### List Records
**GET** `/api/records` | Auth Required
- **Query Params**:
  - `type`: `income` | `expense`
  - `category`: String
  - `startDate`: `YYYY-MM-DD`
  - `endDate`: `YYYY-MM-DD`
  - `minAmount`, `maxAmount`: Number
  - `search`: String (Notes/Tags)
  - `page`, `limit`: Pagination
- **Access**: All Roles (Viewer/Analyst read, Admin full).

### Create Record
**POST** `/api/records` | Admin Only
- **Body**: `{ "amount", "type", "category", "date", "description", "tags" }`

### Update Record
**PUT** `/api/records/:id` | Admin Only
- **Body**: Partial update supported.

### Delete Record
**DELETE** `/api/records/:id` | Admin Only
- **Legacy**: Soft-delete support.

---

## 📊 Analytics & Insights

### Overall Summary
**GET** `/api/analytics/summary` | Analyst/Admin
- **Returns**: Total Income, Expenses, Balance, and Category stats.

### By Category
**GET** `/api/analytics/by-category` | Analyst/Admin
- **Returns**: Net balance per Category.

### Time-Series Trends
**GET** `/api/analytics/trends` | Analyst/Admin
- **Query Param**: `view` (`monthly` | `weekly`)
- **Returns**: Chronological income/expense totals.

### Recent Activity
**GET** `/api/analytics/recent` | Analyst/Admin
- **Query Param**: `limit` (default 5)
- **Returns**: Last N records added.

---

## 👥 User Management (Admin Only)

### List Users
**GET** `/api/users` | Admin Only
- **Query Params**: `role`, `status`, `page`, `limit`.

### Update User Role
**PATCH** `/api/users/:id/role` | Admin Only
- **Body**: `{ "role" }`

### Update User Status
**PATCH** `/api/users/:id/status` | Admin Only
- **Body**: `{ "status": "ACTIVE" | "INACTIVE" | "SUSPENDED" }`

---

## 📋 Security Policies
- **Role Permissions**:
    - **Viewer**: Read-only Records.
    - **Analyst**: Read-only Records + Analytics.
    - **Admin**: Full access to all resources.
- **Audit Logs**: All sensitive operations are recorded in the background for security trails.
