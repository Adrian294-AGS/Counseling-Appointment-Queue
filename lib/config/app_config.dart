class AppConfig {
  // In a real deployment, these are injected via secure environment variables (e.g., --dart-define).
  // NEVER hardcode production secrets, API keys, or database credentials in source control.
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL', 
    defaultValue: 'https://api.counseling.example.com',
  );
  
  static const String mockJwtSecret = String.fromEnvironment(
    'JWT_SECRET', 
    defaultValue: 'dev-secret-do-not-use-in-production',
  );

  static const bool isProduction = bool.fromEnvironment('dart.vm.product');
}