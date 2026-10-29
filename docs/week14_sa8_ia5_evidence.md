# Week 14 SA8 & IA5 Evidence: Secure Integration and Data Exchange

## 1. Protected Configuration
- **Implementation**: `lib/config/app_config.dart` uses `String.fromEnvironment` and `bool.fromEnvironment` to load configuration values (e.g., `API_BASE_URL`, `JWT_SECRET`).
- **Security Control**: Prevents hardcoding of secrets in source control. In production, these are injected securely via CI/CD pipelines or secure environment variable managers.

## 2. Authentication and Role-Based Access Control (RBAC)
- **Implementation**: `lib/auth/auth_service.dart` provides a mock authentication flow. 
- **Access Control**: `AppointmentService.requestAppointment` explicitly checks `AuthService.isAuthenticated` before processing any request, throwing a `401 Unauthorized` exception if the check fails.
- **Adverse Behavior Demonstrated**: The UI (`request_appointment_screen.dart`) intercepts unauthenticated states and displays a login prompt. Attempting to submit without a token is blocked at the service layer.

## 3. Secure Data Exchange (HTTPS & Cryptography)
- **HTTPS Enforcement**: The `AppConfig.apiBaseUrl` defaults to an `https://` scheme. In a real deployment, the backend would enforce HSTS (HTTP Strict Transport Security) and reject plain HTTP connections.
- **Cryptography**: The mock service references a `JWT_SECRET`. In production, the backend would sign JSON Web Tokens (JWT) using HS256 or RS256, and the Flutter client would attach this token to the `Authorization: Bearer <token>` header for all API requests.

## 4. Safe Logging and Data Minimization (IA5)
- **Implementation**: The `_log` method in `AppointmentService` is explicitly designed to exclude sensitive Personally Identifiable Information (PII) or full request payloads.
- **Evidence**: Logs only record the `id` and `role`, never the `studentId` or `reasonCategory` in plain text, complying with data minimization principles for counseling contexts.

## 5. Input Validation
- **Implementation**: The Student ID field in `RequestAppointmentScreen` enforces a strict regular expression (`^S-\d{5}$`).
- **Adverse Test**: Entering "12345" or "S-123" triggers an immediate UI validation error, preventing malformed data from ever reaching the service layer or backend.

## 6. Residual Risk Documentation
| Risk | Mitigation | Residual Risk Level |
|---|---|---|
| Mock credentials in source code | Clearly marked as demo-only; production uses secure env vars and real identity provider. | Low (Confined to dev environment) |
| Client-side role checking | UI checks are for UX only; the backend must independently validate the JWT and role for every request. | Medium (Requires backend enforcement verification) |
| Token storage | Mock token is held in static memory. Production should use secure storage (e.g., `flutter_secure_storage`). | Low (Addressed in Week 15/16 hardening) |

## 7. Maintainability Note
- The `AuthService` is decoupled from the UI. Migrating from this mock implementation to a real HTTP-based authentication provider (e.g., OAuth2 or Firebase Auth) will only require updating the `AuthService` methods, leaving the appointment workflow screens untouched.