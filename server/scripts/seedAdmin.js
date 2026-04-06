const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');

const seedAdmin = async () => {
  try {
    // Connect DB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('🗄️ MongoDB Connected');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@example.com' });
    if (existingAdmin) {
      console.log('⚠️ Admin already exists');
      process.exit(0);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('Admin@123', 10);

    // Create admin
    await User.create({
      name: 'System Admin',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'ADMIN', // ✅ FIXED
      isActive: true
    });

    console.log('✅ Admin user created successfully');
    process.exit(0);

  } catch (error) {
    console.error('❌ Failed to seed admin:', error);
    process.exit(1);
  }
};

seedAdmin();
