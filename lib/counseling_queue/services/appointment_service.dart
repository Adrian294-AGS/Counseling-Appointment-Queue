import '../models/appointment.dart';
import '../../auth/auth_service.dart';
import '../../config/app_config.dart';

class AppointmentService {
  // Simulated backend state
  static final List<Appointment> _queue = [];
  static bool _simulateTransientFailure = true;
  static bool _simulatePermanentFailure = false;

  /// Configure failure simulation for Week 13 SA7 demonstration
  static void configureSimulation({
    required bool transientFailure,
    required bool permanentFailure,
  }) {
    _simulateTransientFailure = transientFailure;
    _simulatePermanentFailure = permanentFailure;
  }

  static void _log(String level, String message, {Map<String, dynamic>? context}) {
    final timestamp = DateTime.now().toIso8601String();
    final ctx = context != null ? 'context: $context' : '';
    print('[$timestamp] [$level] $message $ctx');
  }

  static Future<Appointment> requestAppointment(Appointment appointment) async {
    // IA5: Access Control - Verify authentication before processing
    if (!AuthService.isAuthenticated) {
      throw Exception('401 Unauthorized: Authentication required');
    }

    // SA8: Data Minimization in Logs - Never log sensitive PII or full request bodies
    _log('INFO', 'Appointment request initiated', context: {
      'id': appointment.id,
      'role': AuthService.userRole,
    });

    try {
      final result = await _sendToBackend(appointment);
      appointment.status = AppointmentStatus.confirmed;
      _log('INFO', 'Appointment confirmed', context: {'id': appointment.id});
      return appointment;
    } catch (e) {
      _log('ERROR', 'Appointment request failed', context: {'id': appointment.id, 'error': e.toString()});
      return _handleFailure(appointment, e.toString());
    }
  }

  static Future<Appointment> _sendToBackend(Appointment appointment) async {
    // Simulate network delay
    await Future.delayed(const Duration(milliseconds: 800));

    if (_simulatePermanentFailure) {
      throw Exception('Permanent backend error: Database connection refused');
    }

    if (_simulateTransientFailure) {
      _simulateTransientFailure = false; // Recover on next try
      throw Exception('Transient network timeout');
    }

    _queue.add(appointment);
    return appointment;
  }

  static Future<Appointment> _handleFailure(Appointment appointment, String error) async {
    appointment.lastError = error;
    appointment.retryCount++;

    if (appointment.retryCount <= 3 && error.contains('Transient')) {
      _log('WARN', 'Transient failure detected, initiating retry', context: {
        'id': appointment.id,
        'retry': appointment.retryCount,
      });
      
      // Exponential backoff simulation
      await Future.delayed(Duration(milliseconds: 500 * appointment.retryCount));
      return requestAppointment(appointment);
    } else {
      _log('ALERT', 'Permanent failure reached, routing to manual review', context: {
        'id': appointment.id,
        'retry': appointment.retryCount,
        'error': error,
      });
      appointment.status = AppointmentStatus.permanent_failure_manual_review;
      return appointment;
    }
  }

  static List<Appointment> getQueue() {
    return List.unmodifiable(_queue);
  }
}