// scripts/seedTenant.js
require('dotenv').config();
const mongoose = require('mongoose');
const Tenant = require('../models/Tenant');
const getNextSequence = require('../utils/getNextSequence'); // ✅ make sure path is correct



async function seedTenant() {
  try {
    
        console.log('Loaded MONGO_URI:', process.env.MONGODB_URI);
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected for seeding');

    // const tenant = await Tenant.create({
    //   name: 'Demo Company',
    //   email: 'demo@example.com',
    //   subdomain: 'demo',
    // });
        const nextId = await getNextSequence('Tenant'); // call the util function


    
    const tenant = new Tenant({
      id: nextId,
      name: 'Demo Co',
      email: 'admin@demo.com',
      subdomain: 'demo',
      isActive: true,
    });

    await tenant.save();

    console.log('Tenant seeding complete');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding tenant:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

seedTenant();
