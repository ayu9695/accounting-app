// scripts/seedTenant.js
require('dotenv').config();
const mongoose = require('mongoose');
const Tenant = require('../models/Tenant');
const Settings = require('../models/Settings');


async function seedSettings() {
  try {
    console.log('Loaded MONGO_URI:', process.env.MONGODB_URI);
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected for seeding');
    const tenant = await Tenant.findOne({ subdomain: 'acme' }); // replace 'acme' with your subdomain
    if (!tenant) {
        console.error('Tenant not found. Please seed tenant first.');
        return;
    }
    
    // Step 2: Create settings for that tenant
    const settings = new Settings({
      tenantId: tenant._id, // 🔗 correct way to reference tenant
      tenantNumber: tenant.id,
      domain: 'www.acme.com',
      name: 'Acme Corp',
      email:'admin@acme.com',
      fiscalYearStart: new Date('2025-04-01'),
      fiscalYearEnd: new Date('2026-03-31'),
      currency: 'INR',
      gstEnabled: true,
      gstNumber:'BHG282781279',
      defaultTaxRates: {
        cgst: 9,
        sgst: 9,
        igst: 0
      },
      phone: '+91-1234567890',
      address: '123 Acme Street, Business Park, India',
      invoicePrefix: 'ACME-INV-',
      expenseCategories: ['Travel', 'Office Supplies', 'Utilities'],
      paymentMethods: ['Cash', 'Bank Transfer', 'UPI'],
      updatedBy: null // optional, can add ObjectId of User
    });

    await settings.save();
    console.log('Settings seeded:', settings);
  } catch (err) {
    console.error('Error seeding settings:', err);
  } finally {
    mongoose.connection.close();
  }
}

seedSettings();
    