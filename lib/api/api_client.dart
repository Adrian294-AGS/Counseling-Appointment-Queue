import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';
import '../auth/auth_service.dart';
import '../counseling_queue/models/appointment.dart';

class ApiClient {
  static final String baseUrl = AppConfig.apiBaseUrl;

  static Map<String, String> get _headers {
    final headers = <String, String>{
      'Content-Type': 'application/json',
    };
    if (AuthService.token != null) {
      headers['Authorization'] = 'Bearer ${AuthService.token}';
    }
    return headers;
  }

  static Future<Map<String, dynamic>> login(String username, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'username': username, 'password': password}),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Login failed: ${response.statusCode}');
    }
  }

  static Future<List<Appointment>> getAppointments() async {
    final response = await http.get(
      Uri.parse('$baseUrl/api/appointments'),
      headers: _headers,
    );

    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body);
      return data.map((json) => Appointment.fromJson(json)).toList();
    } else {
      throw Exception('Failed to fetch appointments: ${response.statusCode}');
    }
  }

  static Future<Appointment> createAppointment(Appointment appointment) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/appointments'),
      headers: _headers,
      body: jsonEncode({
        'studentId': appointment.studentId,
        'reasonCategory': appointment.reasonCategory,
        'requestedTime': appointment.requestedTime.toIso8601String(),
      }),
    );

    if (response.statusCode == 201) {
      return Appointment.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Failed to create appointment: ${response.statusCode}');
    }
  }

  static Future<Appointment> updateAppointment(String id, Map<String, dynamic> updates) async {
    final response = await http.patch(
      Uri.parse('$baseUrl/api/appointments/$id'),
      headers: _headers,
      body: jsonEncode(updates),
    );

    if (response.statusCode == 200) {
      return Appointment.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Failed to update appointment: ${response.statusCode}');
    }
  }
}