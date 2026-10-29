const db = require('../config/db');
const { hashPassword } = require('../utils/crypto');

async function seed() {
  console.log('Seeding database...');
  
  const users = [
    { username: 'student1', password: 'password123', role: 'student', studentId: 'S-12345' },
    { username: 'student2', password: 'password123', role: 'student', studentId: 'S-67890' },
    { username: 'counselor1', password: 'password123', role: 'counselor', studentId: null },
    { username: 'staff1', password: 'password123', role: 'intake_staff', studentId: null },
  ];

  for (const user of users) {
    const hash = await hashPassword(user.password);
    await db.execute(
      'INSERT INTO users (username, password_hash, role, student_id) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE password_hash = ?',
      [user.username, hash, user.role, user.studentId, hash]
    );
    console.log(`Created user: ${user.username} (${user.role})`);
  }

  console.log('Seeding complete!');
  await db.end();
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});