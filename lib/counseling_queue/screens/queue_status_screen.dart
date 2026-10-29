import 'package:flutter/material.dart';
import '../models/appointment.dart';
import '../services/appointment_service.dart';

class QueueStatusScreen extends StatefulWidget {
  const QueueStatusScreen({super.key});

  @override
  State<QueueStatusScreen> createState() => _QueueStatusScreenState();
}

class _QueueStatusScreenState extends State<QueueStatusScreen> {
  late List<Appointment> _queue;

  @override
  void initState() {
    super.initState();
    _queue = AppointmentService.getQueue();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Appointment Queue Status'),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
      ),
      body: _queue.isEmpty
          ? const Center(
              child: Text('No appointments in the queue yet.'),
            )
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _queue.length,
              itemBuilder: (context, index) {
                final appt = _queue[index];
                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  child: ListTile(
                    title: Text('Student ID: ${appt.studentId}'),
                    subtitle: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Category: ${appt.reasonCategory}'),
                        Text('Date: ${appt.requestedTime.toString().split(' ')[0]}'),
                        Text(
                          'Status: ${appt.status.name.replaceAll('_', ' ').toUpperCase()}',
                          style: TextStyle(
                            color: appt.status == AppointmentStatus.confirmed
                                ? Colors.green
                                : Colors.orange,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                    isThreeLine: true,
                  ),
                );
              },
            ),
    );
  }
}