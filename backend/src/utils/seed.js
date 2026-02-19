import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import logger from '../utils/logger.js';

const seedDatabase = async () => {
  try {
    logger.info('🌱 Starting database seed...');

    const existing = await User.findOne({ email: 'admin@railway.com' });
    if (existing) {
      logger.info('✅ Super admin already exists, skipping seed');
      return;
    }

    const hashedPassword = await bcrypt.hash('Admin@123', 12);

    await User.create({
      employeeId: 'ADMIN001',
      name: 'Super Admin',
      email: 'admin@railway.com',
      password: hashedPassword,
      role: 'SUPERADMIN',
      status: 'ACTIVE',
      isVerified: true,
      verifiedAt: new Date(),
      division: 'Administration',
      designation: 'System Administrator',
    });

    await User.create({
      employeeId: 'ADMIN002',
      name: 'Admin User',
      email: 'admin2@railway.com',
      password: hashedPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
      isVerified: true,
      verifiedAt: new Date(),
      division: 'Operations',
      designation: 'Operations Manager',
    });

    logger.info('✅ Seed completed!');
    logger.info('   SuperAdmin → email: admin@railway.com | password: Admin@123');
    logger.info('   Admin      → email: admin2@railway.com | password: Admin@123');
  } catch (error) {
    logger.error('Seed error:', error);
  }
};

export default seedDatabase;
