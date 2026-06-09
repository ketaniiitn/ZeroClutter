# Testing Documentation

## Test Strategy

The test suite focuses on the highest-risk, most business-critical components: input validation, overdue detection logic, AI prompt correctness, error class behavior, and response formatting utilities. These are pure unit tests that run without a database or external API calls.

## Running Tests

```bash
npm test                  # Run all tests
npm run test:coverage     # Run with coverage report
```

---

## Test Scenarios

### 1. Auth Validation (`tests/auth.test.ts`)

| Scenario | Expected |
|---|---|
| Valid registration data | No validation error |
| Missing `name` | Error: "Name is required" |
| Invalid email format | Error: "Invalid email" |
| Password shorter than 8 chars | Error: "8 characters" |
| Name shorter than 2 chars | Validation error |
| Valid login data | No validation error |
| Missing `password` in login | Error: "Password is required" |

### 2. Meeting Validation (`tests/meetings.test.ts`)

| Scenario | Expected |
|---|---|
| Valid complete meeting | No error |
| Missing `title` | "Meeting title is required" |
| Participant with invalid email | "valid email address" |
| Invalid `meetingDate` format | "ISO 8601" |
| Empty transcript array | "at least one segment" |
| Transcript segment missing `text` | Validation error |
| Title shorter than 2 chars | Validation error |
| List meetings — default pagination | `page=1, limit=10` |
| Invalid `from` date | Validation error |

### 3. Action Item Validation (`tests/action-items.test.ts`)

| Scenario | Expected |
|---|---|
| Valid full action item | No error |
| Action item without dueDate | No error (optional field) |
| Missing `task` | "Task is required" |
| Missing `assignee` | "Assignee is required" |
| Invalid `dueDate` | "ISO 8601" |
| Task shorter than 3 chars | Validation error |
| Status = "PENDING" | Valid |
| Status = "IN_PROGRESS" | Valid |
| Status = "COMPLETED" | Valid |
| Status = "DONE" (invalid) | Error mentioning valid statuses |
| Missing `status` | "Status is required" |
| Filter with valid status | No error |
| Filter with invalid status | Validation error |
| Default pagination | `page=1, limit=10` |

### 4. Overdue Detection (`tests/action-items.test.ts`)

| Scenario | Expected |
|---|---|
| PENDING + past dueDate | `isOverdue = true` |
| IN_PROGRESS + past dueDate | `isOverdue = true` |
| COMPLETED + past dueDate | `isOverdue = false` |
| PENDING + future dueDate | `isOverdue = false` |
| PENDING + null dueDate | `isOverdue = false` |

### 5. AI Prompt (`tests/ai-validation.test.ts`)

| Scenario | Expected |
|---|---|
| Prompt contains transcript text | Transcript segments visible in prompt |
| Prompt includes valid timestamps | All segment timestamps listed |
| Prompt includes meeting title | Title present |
| Prompt has anti-hallucination rules | "NEVER invent" present |
| Prompt requires citations | "citations" and "timestamp" keywords present |
| Empty participants handled | No error thrown |

### 6. Response Utilities (`tests/ai-validation.test.ts`)

| Scenario | Expected |
|---|---|
| 25 items, page 1, limit 10 | `totalPages=3, hasNext=true, hasPrev=false` |
| 25 items, page 2, limit 10 | `hasPrev=true` |
| 10 items, page 1, limit 10 | `hasNext=false` |

### 7. Error Classes (`tests/ai-validation.test.ts`)

| Scenario | Expected |
|---|---|
| `NotFoundError("Meeting")` | status=404, code="NOT_FOUND" |
| `UnauthorizedError()` | status=401, code="UNAUTHORIZED" |
| `ValidationError("...")` | status=400, code="VALIDATION_ERROR" |
| `ConflictError("...")` | status=409, code="CONFLICT" |
| `AppError` is operational | `isOperational=true` |

---

## Edge Cases Considered

- **Empty transcript on analyze:** The service throws `AIError` before calling Gemini if the meeting has no transcript segments.
- **AI returns invalid JSON:** Caught and re-thrown as `AIError` with a user-friendly message.
- **AI returns invalid timestamps in citations:** Filtered out; item rejected if no valid citations remain.
- **User accessing another user's meeting:** `ForbiddenError` (403) — ownership enforced in service layer.
- **Duplicate email registration:** `ConflictError` (409).
- **Invalid ObjectId format in URL params:** Prisma returns null → `NotFoundError` (404).
- **Pagination beyond total pages:** Returns empty items array with correct total.
- **Scheduler crash:** Error is caught and logged; cron job continues on next tick.
- **Telegram API failure:** Error logged and recorded in `ReminderHistory.success=false`; no crash.

---

## Limitations

- **No integration tests:** Database and AI calls are not mocked; the test suite avoids live I/O. Integration tests would require a test MongoDB instance and mock AI/Telegram adapters.
- **No HTTP-level tests:** Supertest-based route tests are not included in this submission due to Prisma requiring a real connection. Adding them would require dependency injection or a test database fixture setup.
- **Telegram not testable in unit tests:** The Telegram service sends real HTTP requests; unit coverage relies on the service being called correctly rather than verifying delivery.
- **AI output variance:** Since Gemini responses are non-deterministic, the prompt tests verify structure and required keywords, not exact output.
