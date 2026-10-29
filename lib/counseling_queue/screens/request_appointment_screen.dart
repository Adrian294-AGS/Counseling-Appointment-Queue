import 'package:flutter/material.dart';
import '../models/appointment.dart';
import '../services/appointment_service.dart';
import 'queue_status_screen.dart';
import '../../auth/auth_service.dart';

class RequestAppointmentScreen extends StatefulWidget {
  const RequestAppointmentScreen({super.key});

  @override
  State<RequestAppointmentScreen> createState() => _RequestAppointmentScreenState();
}

class _RequestAppointmentScreenState extends State<RequestAppointmentScreen> {
  final _formKey = GlobalKey<FormState>();
  String _studentId = '';
  String _reasonCategory = 'Academic';
  DateTime _requestedTime = DateTime.now().add(const Duration(days: 1));
  bool _isLoading = false;
  String? _errorMessage;
  bool _isLoggedIn = false;

  Future<void> _selectDate() async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _requestedTime,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 30)),
    );
    if (picked != null && picked != _requestedTime) {
      setState(() {
        _requestedTime = picked;
      });
    }
  }

  Future<void> _submitRequest() async {
    if (!_formKey.currentState!.validate()) return;
    _formKey.currentState!.save();

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final appointment = Appointment(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      studentId: _studentId,
      reasonCategory: _reasonCategory,
      requestedTime: _requestedTime,
    );

    try {
      final result = await AppointmentService.requestAppointment(appointment);
      
      if (!mounted) return;
      setState(() {
        _isLoading = false;
      });

      if (result.status == AppointmentStatus.confirmed) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Appointment requested successfully!')),
        );
        Navigator.push(
          context,
          MaterialPageRoute(builder: (context) => const QueueStatusScreen()),
        );
      } else if (result.status == AppointmentStatus.permanent_failure_manual_review) {
        setState(() {
          _errorMessage = 'System error: Your request could not be processed automatically and has been routed for manual staff review. Reference ID: ${result.id}';
        });
      }
    } catch (e) {
      setState(() {
        _isLoading = false;
        _errorMessage = 'An unexpected error occurred.';
      });
    }
  }

  @override
  void initState() {
    super.initState();
    _isLoggedIn = AuthService.isAuthenticated;
  }

  @override
  Widget build(BuildContext context) {
    if (!_isLoggedIn) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Counseling Appointment Request'),
          backgroundColor: Theme.of(context).colorScheme.inversePrimary,
        ),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Text(
                  'Authentication Required',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 16),
                const Text(
                  'Please log in to request an appointment.\n(Demo credentials: student1 / password123)',
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: () async {
                    setState(() => _isLoading = true);
                    final success = await AuthService.login('student1', 'password123');
                    setState(() {
                      _isLoading = false;
                      _isLoggedIn = success;
                      if (!success) _errorMessage = 'Invalid credentials';
                    });
                  },
                  child: _isLoading 
                    ? const CircularProgressIndicator() 
                    : const Text('Mock Login (student1)'),
                ),
                if (_errorMessage != null) ...[
                  const SizedBox(height: 16),
                  Text(_errorMessage!, style: const TextStyle(color: Colors.red)),
                ],
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Counseling Appointment Request'),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: 'Logout',
            onPressed: () {
              AuthService.logout();
              setState(() => _isLoggedIn = false);
            },
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              TextFormField(
                decoration: const InputDecoration(
                  labelText: 'Student ID',
                  border: OutlineInputBorder(),
                  helperText: 'Format: S-XXXXX',
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter your Student ID';
                  }
                  // IA5: Input Validation - Enforce strict format
                  if (!RegExp(r'^S-\d{5}$').hasMatch(value)) {
                    return 'Invalid format. Use S-XXXXX (e.g., S-12345)';
                  }
                  return null;
                },
                onSaved: (value) => _studentId = value!,
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                value: _reasonCategory,
                decoration: const InputDecoration(
                  labelText: 'Reason Category',
                  border: OutlineInputBorder(),
                ),
                items: const [
                  DropdownMenuItem(value: 'Academic', child: Text('Academic')),
                  DropdownMenuItem(value: 'Personal', child: Text('Personal')),
                  DropdownMenuItem(value: 'Career', child: Text('Career')),
                ],
                onChanged: (value) {
                  setState(() {
                    _reasonCategory = value!;
                  });
                },
              ),
              const SizedBox(height: 16),
              ListTile(
                title: const Text('Requested Date'),
                subtitle: Text('${_requestedTime.year}-${_requestedTime.month}-${_requestedTime.day}'),
                trailing: const Icon(Icons.calendar_today),
                onTap: _selectDate,
              ),
              const SizedBox(height: 24),
              if (_errorMessage != null)
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.red.shade50,
                    border: Border.all(color: Colors.red.shade200),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    _errorMessage!,
                    style: TextStyle(color: Colors.red.shade900),
                  ),
                ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: _isLoading ? null : _submitRequest,
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
                child: _isLoading
                    ? const CircularProgressIndicator()
                    : const Text('Submit Request'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}