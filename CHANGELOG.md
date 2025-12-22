# CHANGELOG

## 2025-08-23
### Security
- Removed `.env` from repository and added `.env.example` with placeholders.
- Added security middlewares: helmet, express-rate-limit, express-mongo-sanitize, xss-clean, hpp, cookie-parser.
- Hardened CORS to allow only `FRONTEND_URL` and `DASHBOARD_URL` origins.
- Unified JWT helpers and fixed auth `protect`/`restrictTo` logic.
- Enabled optional safe `auditLogger` with sensitive-field filtering.

### Database & Models
- Unified MongoDB connection via `config/db.js` using `DATABASE_FULL_URL`.
- User model: fixed `warehouse` reference to `User`, added `passwordChangedAt`, `passwordResetToken`, `passwordResetExpires`, and methods for password reset and change checks.
- Order model: added `driver` field and expanded `status` enum; added useful indexes.
- Invoice model: ensured fields and indexes exist.

### API & Controllers
- Pagination + `.lean()` added to list endpoints (Users, Orders, Invoices).
- Orders: scoped by role (pharmacist/warehouse/driver), transaction-based stock deduction, status updates, driver assignment endpoint.
- Invoices: implemented `getAllInvoices` and `getInvoiceById`.
- AI Service: fixed aggregation using `$unwind` and `$group`.

### Routes
- Users: restricted list, getById, delete to `admin` only.
- Orders: added `assign-driver` route, role-based protections.
- Invoices: wired get/list endpoints and protected by auth.

### Tooling
- Updated `package.json` scripts and dependencies.
- Added `.gitignore` to exclude secrets and build artifacts.
