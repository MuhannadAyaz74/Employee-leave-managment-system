# Milestone 3 — Dataset Preprocessing & Dataflow

## Data Generation Method

Since this project uses no external real-world dataset, **synthetic data was generated** using Python with the `Faker` library. The data is realistic and logically consistent with the application domain (employee leave management).

### Generated CSV Files (in `data/csv/`)

| File | Rows | Description |
|---|---|---|
| `leave_types.csv` | 4 | The four leave categories supported by the system |
| `users.csv` | 103 | 1 admin + 2 managers + 100 employees with hashed passwords |
| `leave_balance.csv` | 408 | Leave quota and usage per employee per leave type (4 rows × 102 users) |
| `leaves.csv` | 282 | Realistic leave applications with random statuses, dates, and reasons |
| `leave_logs.csv` | 437 | Action history per leave (applied + manager decisions) |
| `notifications.csv` | 373 | In-app notifications per user |
| `leave_attachments.csv` | 92 | File reference records for ~30% of leave applications |

### Preprocessing Steps Applied

- **Duplicate removal:** Faker's `unique.email()` was used to guarantee no duplicate emails in `users`.
- **Foreign key integrity:** Employee `user_id` values in all tables are constrained to valid user IDs (4–103). Manager references point to IDs 2 or 3.
- **Null handling:** `manager_comment` in `leaves.csv` is NULL for pending/cancelled rows — matching real business logic.
- **Date consistency:** `end_date` is always ≥ `start_date`; `total_days` = `end_date - start_date + 1`.
- **Data types:** All dates are `YYYY-MM-DD`, all datetimes are `YYYY-MM-DD HH:MM:SS`, booleans are `0`/`1`.
- **Realistic values:** Leave reasons, notification messages, and comments are contextually appropriate for an HR system.

---

## Dataflow Description

This section describes how data flows through the ELMS database, specific to this project.

### 1. Data Entry Points

Data enters the system through two channels:

**A — Initial Load (Milestone 5):**  
CSV files are loaded via `LOAD DATA INFILE` into the MySQL database in dependency order (leaf tables last):
```
leave_types → users → leave_balance → leaves → leave_logs → notifications → leave_attachments
```

**B — Live Application (Runtime):**  
Data enters via the Node.js REST API (`/server`) when:
- A new user registers or is created by admin → `INSERT INTO users`
- An employee submits a leave request → `INSERT INTO leaves` + `INSERT INTO leave_logs` (action='applied') + `INSERT INTO notifications` (for manager)
- A manager approves/rejects → `UPDATE leaves SET status=...` + `INSERT INTO leave_logs` + `UPDATE leave_balance SET used_leaves=...` + `INSERT INTO notifications` (for employee)
- An employee uploads a document → `INSERT INTO leave_attachments`

### 2. How Data Moves Through the Database

```
users ──────────────────────────────────────────────────────┐
  │ (manager_id FK)                                         │
  ▼                                                         │
leave_balance ← (user_id FK, leave_type_id FK) ←──────┐    │
                                                       │    │
leave_types ──── (leave_type_id FK) ────► leaves ──────┤    │
                                           │           │    │
                                           │    leave_logs   │
                                           │    (leave_id FK,│
                                           │    action_by FK)│
                                           │                 │
                                           ▼                 │
                                    leave_attachments        │
                                    (leave_id FK)            │
                                                             │
notifications ◄─────────────────── (user_id FK) ────────────┘
```

**Dependency chain (load order):**
1. `leave_types` — no dependencies
2. `users` — self-referencing (`manager_id`)
3. `leave_balance` — depends on `users` + `leave_types`
4. `leaves` — depends on `users` + `leave_types`
5. `leave_logs` — depends on `leaves` + `users`
6. `notifications` — depends on `users`
7. `leave_attachments` — depends on `leaves`

### 3. What Comes Out

| Output Type | How It's Produced |
|---|---|
| Leave status updates | `SELECT` on `leaves` filtered by `user_id` or `status` |
| Leave balance summary | `SELECT` on `leave_balance` joined with `leave_types` |
| Manager dashboard | `SELECT` on `leaves JOIN users` where `users.manager_id = ?` |
| Audit trail | `SELECT` on `leave_logs JOIN users` for a given `leave_id` |
| Notification feed | `SELECT` on `notifications` where `user_id = ?` and `is_read = 0` |
| Reports | `COUNT(*)` and `GROUP BY` queries on `leaves` by date, type, and status |

---

*Commit: M3: Synthetic data generated (Faker); dataflow documented; CSV files exported*
