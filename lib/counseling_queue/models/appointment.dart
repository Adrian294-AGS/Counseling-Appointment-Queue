enum AppointmentStatus {
  pending,
  confirmed,
  rescheduled,
  cancelled,
  transient_failure,
  permanent_failure_manual_review,
}

class Appointment {
  final String id;
  final String studentId; // Controlled data only
  final String reasonCategory; // e.g., 'Academic', 'Personal', 'Career' - no sensitive details
  final DateTime requestedTime;
  AppointmentStatus status;
  int retryCount;
  String? lastError;

  Appointment({
    required this.id,
    required this.studentId,
    required this.reasonCategory,
    required this.requestedTime,
    this.status = AppointmentStatus.pending,
    this.retryCount = 0,
    this.lastError,
  });

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'studentId': studentId,
      'reasonCategory': reasonCategory,
      'requestedTime': requestedTime.toIso8601String(),
      'status': status.name,
      'retryCount': retryCount,
      'lastError': lastError,
    };
  }

  factory Appointment.fromJson(Map<String, dynamic> json) {
    return Appointment(
      id: json['id'],
      studentId: json['studentId'],
      reasonCategory: json['reasonCategory'],
      requestedTime: DateTime.parse(json['requestedTime']),
      status: AppointmentStatus.values.firstWhere(
        (e) => e.name == json['status'],
        orElse: () => AppointmentStatus.pending,
      ),
      retryCount: json['retryCount'] ?? 0,
      lastError: json['lastError'],
    );
  }
}