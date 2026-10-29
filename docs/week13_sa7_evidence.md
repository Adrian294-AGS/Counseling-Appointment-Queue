# Week 13 SA7 Evidence: Counseling Appointment Queue Automation Foundation

## 1. Workflow Boundary
- **In Scope:** Student request intake, availability matching (simulated), confirmation, rescheduling, cancellation, and attendance status.
- **Out of Scope:** Actual counseling session notes, payment processing, real-time chat with counselors.
- **Data Minimization:** Only `studentId` and `reasonCategory` (e.g., Academic, Personal, Career) are collected. No sensitive counseling content is stored or transmitted.

## 2. Trigger Decision
- **Trigger:** User submits the "Request Appointment" form in the Flutter Web interface.
- **Event:** `AppointmentService.requestAppointment()` is invoked.

## 3. Flutter Web Screen Flow
1. `RequestAppointmentScreen`: Form for Student ID, Reason Category, and Requested Date. Includes validation and loading states.
2. `QueueStatusScreen`: Displays the current status of submitted appointments (Confirmed, Manual Review, etc.).

## 4. API Contract (Simulated Backend)
- **Endpoint:** `POST /api/appointments`
- **Request Body:** `{ "id": "string", "studentId": "string", "reasonCategory": "string", "requestedTime": "ISO8601" }`
- **Success Response:** `200 OK` with updated appointment object (`status: "confirmed"`).
- **Failure Response:** `500 Internal Server Error` (simulated for transient/permanent failures).

## 5. Retry and Recovery Policy
- **Transient Failure:** If a network timeout occurs, the system automatically retries up to 3 times with exponential backoff (500ms, 1000ms, 1500ms).
- **Permanent Failure:** If the error is non-transient (e.g., database connection refused) or retries are exhausted, the appointment status is set to `permanent_failure_manual_review`.
- **Recovery Path:** Staff can manually review the `permanent_failure_manual_review` queue and contact the student via alternative, secure channels.

## 6. Structured Logs
Logs are emitted in a structured format: `[TIMESTAMP] [LEVEL] MESSAGE context: {JSON}`.
- Example (Info): `[2023-10-24T10:00:00] [INFO] Appointment request initiated context: {id: 12345}`
- Example (Warn): `[2023-10-24T10:00:01] [WARN] Transient failure detected, initiating retry context: {id: 12345, retry: 1}`
- Example (Alert): `[2023-10-24T10:00:05] [ALERT] Permanent failure reached, routing to manual review context: {id: 12345, retry: 3, error: Database connection refused}`

## 7. Failure Demonstrations (For Instructor Review)
- **Recovered Transient Failure:** Set `_simulateTransientFailure = true` in `AppointmentService`. The console will show 1 retry, followed by a successful confirmation.
- **Permanent Failure Routed for Human Action:** Set `_simulatePermanentFailure = true` in `AppointmentService`. The console will show an immediate alert, and the UI will display a message routing the request to manual staff review with a Reference ID.

## 8. Maintainability Note
- The service layer is decoupled from the UI, allowing the simulated backend to be easily replaced with a real HTTP client (e.g., `http` or `dio`) in Week 14 without modifying the Flutter screens.
- State management is kept simple with `setState` for this bounded prototype, but the architecture supports easy migration to `Provider` or `Riverpod` if the workflow expands.