class AuthService {
  static String? _token;
  static String? _userRole; // 'student', 'counselor', 'intake_staff'

  /// Mock authentication. In production, this sends credentials over HTTPS 
  /// to a backend endpoint that returns a signed JWT.
  static Future<bool> login(String username, String password) async {
    await Future.delayed(const Duration(milliseconds: 500));
    
    // Mock valid credentials for demonstration
    if (username == 'student1' && password == 'password123') {
      _token = 'mock-jwt-token-student-12345';
      _userRole = 'student';
      return true;
    }
    return false;
  }

  static String? get token => _token;
  static String? get userRole => _userRole;
  static bool get isAuthenticated => _token != null;

  static void logout() {
    _token = null;
    _userRole = null;
  }

  static bool hasRole(String requiredRole) {
    return _userRole == requiredRole;
  }
}