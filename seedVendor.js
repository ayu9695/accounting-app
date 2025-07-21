const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Client = require('../models/Client'); // Adjust path if needed

dotenv.config(); // Load MONGO_URI from .env

const sampleClients = [
   {
    tenantId: '6852eb75de523aa426a43743',
    name: "Dream Corporation",
    gstin: "27ABCDE1234F1Z5",
    website: "https://dream.example.com",
    industry: "Technology",
    state: "Maharashtra",
    city: "Mumbai",
    pincode: "400001",
    email: "contact@dream.example.com",
    phone: "+91-9000000001",
    pannumber: "ABCDE1234F",
    address: "123 Main Street, Mumbai",
    status: "active",
    rating: 5,
    overdues: 0,
    contactPerson: [
      { name: "John Doe", email: "john.doe@dream.example.com" },
      { name: "Jane Smith", email: "jane.smith@dream.example.com" }
    ],
    notes: "Important tech client.",
    isActive: true,
    country: "India"
  },
  {
    tenantId: '6852eb75de523aa426a43743',
    name: "Globex Industries",
    gstin: "07FGHIJ5678K2Z6",
    website: "https://globex.example.com",
    industry: "Manufacturing",
    state: "Delhi",
    city: "New Delhi",
    pincode: "110001",
    email: "info@globex.example.com",
    phone: "+91-9000000002",
    pannumber: "FGHIJ5678K",
    address: "456 Globex Avenue, New Delhi",
    status: "active",
    rating: 4,
    overdues: 1,
    contactPerson: [
      { name: "Alice Johnson", email: "alice.johnson@globex.example.com" },
      { name: "Bob Brown", email: "bob.brown@globex.example.com" }
    ],
    notes: "Manufacturing sector client with pending invoices.",
    isActive: true,
    country: "India"
  }
];

const seedClients = async () => {
  try { console.log('Loaded MONGO_URI:', process.env.MONGODB_URI);
              await mongoose.connect(process.env.MONGODB_URI);
              console.log('MongoDB connected for seeding');

    await Client.insertMany(sampleClients);
    console.log('✅ Sample clients seeded successfully');

    process.exit();
  } catch (err) {
    console.error('❌ Error seeding clients:', err);
    process.exit(1);
  }
};

seedClients();
