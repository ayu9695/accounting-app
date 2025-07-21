// scripts/seedTenant.js
require('dotenv').config();
const mongoose = require('mongoose');
const Tenant = require('../models/Tenant');
const Users = require('../models/Users');
const bcrypt = require('bcrypt');


async function seedUsers() {
    try{
            console.log('Loaded MONGO_URI:', process.env.MONGODB_URI);
            await mongoose.connect(process.env.MONGODB_URI);
            console.log('MongoDB connected for seeding');

    const user = new Users({
        "tenantId": "6852eb75de523aa426a43743",
  "email": "atul@acme.com",
  "name": "Atul Test",
  "code": 1001,
  "role": "superadmin",
  "avatar": "https://example.com/avatar/john.jpg",
  "isActive": true,
   "password": "Atul@123",
  "address": "123 Park Avenue, New Delhi, India",
//   "createdAt": "2024-12-01T10:45:30.000Z",
//   "updatedAt": "2025-06-20T16:22:10.000Z",
  "country": "India",
  "updateHistory": []   
        });

    await user.save();
    console.log('Tenant seeding complete');
    process.exit(0);

    } catch (error) {
        console.error('Error seeding tenant:', error);
        process.exit(1);
      } finally {
        await mongoose.disconnect();
      }

}

seedUsers();