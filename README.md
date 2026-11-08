# Note Taker — Secure RBAC & MongoDB Aggregation Platform

A production-grade REST API (`server/`) and interactive verification dashboard (`client/`) built with **Node.js, Express, MongoDB/Mongoose, JWT, and React (Vite + Tailwind CSS)**.

---

## 1. Core Architectural Highlights

* **Strict Database Indexing Strategy (Zero Redundant Indexes):**
  All indexes are explicitly defined via `schema.index()` and follow MongoDB's **ESR (Equality, Sort, Range)** rule to eliminate in-memory blocking sorts (`SORT`) and collection scans (`COLLSCAN`):
  1. `User`: `{ email: 1 }` (Unique) — Sub-millisecond authentication lookups & uniqueness enforcement.
  2. `User`: `{ interests: 1 }` (Multikey) — Powers Scenario 1 (`$match: { interests: { $gt: '' } }`) via `IXSCAN`.
  3. `Note`: `{ author: 1, _id: -1 }` (Compound) — Powers paginated personal note queries, ownership checks, and cascade deletes.
  4. `Post`: `{ author: 1, _id: -1 }` (Compound) — Powers Scenario 2's inner-pipeline `$lookup` join, sorting, pagination, and cascade deletes.
  *(All global list/read queries by ID leverage MongoDB's built-in `_id_` index).*

* **Bulletproof Role-Based Access Control (RBAC):**
  * **`User`:** Full CRUD + pagination on their own notes (`{ _id: noteId, author: req.user.id }`). Public registration strictly forces `role: 'User'`.
  * **`Admin`:** Inherits `User` capabilities, manages all users (`GET`, `POST`, `PUT`, `DELETE /api/v1/users`) with atomic **Cascade Deletion** of a deleted user's notes and posts, and can inspect all notes (`GET /api/v1/notes/admin/all`) while remaining strictly blocked from editing/deleting other users' notes.

* **MongoDB Aggregation Pipelines:**
  * **Scenario 1 (Users Grouped by Interests):** Single `User.aggregate()` call using `{ $match: { interests: { $gt: '' } } }` → `$unwind` → `$group` → `$sort` → `$facet` for single-round-trip pagination and group counting.
  * **Scenario 2 (User Posts via `$lookup`):** Single `User.aggregate()` call with an inner `$lookup` pipeline (`$match` → `$sort: { _id: -1 }` → `$skip` → `$limit`) and strict `$project: { name: 1, email: 1, posts: 1 }` to prevent password hash leaks.

* **Performance & Security Hardening:**
  * `.lean()` chained on all read/list paths to bypass Mongoose document hydration overhead.
  * `estimatedDocumentCount()` ($O(1)$) for unfiltered collection totals; `countDocuments({ author })` for filtered queries.
  * Global `AppError` & `error.middleware.js` normalizing Mongoose `CastError` (`400`), Duplicate Key `11000` (`409`), `ValidationError` (`400`), and JWT errors (`401`).
  * `helmet`, `cors`, `express-mongo-sanitize` (NoSQL injection protection), and `express-rate-limit` on auth endpoints.

---

## 2. Quick Start & Seeding

### Step 1: Configure & Seed the Backend (`server/`)
```bash
cd server
npm install
```
Ensure `server/.env` contains your `MONGODB_URI` and `JWT_SECRET` (see `server/.env.example`), then run the automated seeder and index verifier:
```bash
npm run seed
```
> `npm run seed` synchronizes the 4 schema indexes (`syncIndexes()`), seeds **1 Admin + 4 Users, 16 Notes, and 12 Posts**, and prints live `.explain('executionStats')` proof in the terminal confirming `Winning Plan Stage: IXSCAN` and `COLLSCAN Detected: NO`.

Start the backend server (runs on `http://localhost:5000`):
```bash
npm run dev
```

### Step 2: Start the Verification Frontend (`client/`)
In a second terminal:
```bash
cd client
npm install
npm run dev
```
Open **`http://localhost:5173`**. All `/api/*` requests are proxied to `http://localhost:5000`.

---

## 3. Pre-Seeded Demo Credentials (1-Click Login Available in UI)

| Role | Email | Password | Seeded Data |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@notetaker.com` | `Admin123!` | 4 Notes, 1 Post, full Admin Control Center access |
| **User** | `alice@notetaker.com` | `User123!` | 7 Notes (2 pages), 6 Posts (2 pages in `$lookup`) |
| **User** | `bob@notetaker.com` | `User123!` | 3 Notes, 3 Posts |
| **User** | `charlie@notetaker.com` | `User123!` | 1 Note, 1 Post |
| **User** | `diana@notetaker.com` | `User123!` | 1 Note, 1 Post |

---

## 4. Complete REST API Specification (`/api/v1`)

| Method | Endpoint | Access | Description | Index Used |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Public | Register user (forces `role: 'User'`) | `{ email: 1 }` |
| `POST` | `/auth/login` | Public | Authenticate & return JWT | `{ email: 1 }` |
| `GET` | `/auth/me` | User, Admin | Get current user profile | `_id_` |
| `GET` | `/notes` | User, Admin | List own notes (Paginated) | `{ author: 1, _id: -1 }` |
| `POST` | `/notes` | User, Admin | Create a personal note | N/A |
| `GET` | `/notes/admin/all` | **Admin** | List all users' notes (Paginated) | `_id_` |
| `GET` | `/notes/verify-indexes` | User, Admin | Live `.explain('executionStats')` telemetry | `{ author: 1, _id: -1 }` |
| `GET` | `/notes/:id` | Own / Admin | Fetch a single note by ID | `_id_` |
| `PUT` | `/notes/:id` | **Strict Own** | Update own note (`{ _id, author }`) | `_id_` |
| `DELETE` | `/notes/:id` | **Strict Own** | Delete own note (`{ _id, author }`) | `_id_` |
| `GET` | `/posts` | Public | List public posts feed (Paginated) | `_id_` |
| `POST` | `/posts` | User, Admin | Create a public post | N/A |
| `GET` | `/users/aggregations/interests` | User, Admin | **Scenario 1:** Users grouped by interests (`$facet`) | `{ interests: 1 }` |
| `GET` | `/users/:id/posts` | Public | **Scenario 2:** User & posts via inner `$lookup` | `_id_`, `Post.{author, _id}` |
| `GET` | `/users` | **Admin** | List all users (Paginated) | `_id_` |
| `POST` | `/users` | **Admin** | Admin creates user (can assign role) | `{ email: 1 }` |
| `GET` | `/users/:id` | **Admin** | Fetch single user profile | `_id_` |
| `PUT` | `/users/:id` | **Admin** | Update user details/role | `_id_` |
| `DELETE` | `/users/:id` | **Admin** | Delete user + cascade delete notes & posts | `_id_`, `{ author, _id }` |
