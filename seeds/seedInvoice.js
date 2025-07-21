const mongoose = require('mongoose');
const dotenv = require('dotenv');
// const Tenant = require('../models/Tenant');
// const Users = require('../models/Users');
const bcrypt = require('bcrypt');
const Invoice = require('../models/Invoice');

dotenv.config(); // Load env variables like MONGO_URI

    // tenantId: '6852eb75de523aa426a43743',
    //     tenantId: '6852eb75de523aa426a43743',
    // clientId:'686187b007bdb202b0c36b76',

const sampleInvoices = [
    {
                tenantId: '6852eb75de523aa426a43743',
    clientId:'686187b007bdb202b0c36b79',
    invoiceNumber: "GLOBEX-001",
    clientName: "Globex Industries",
    clientEmail: "info@globex.example.com",
    clientAddress: "456 Globex Avenue, New Delhi",
    issueDate: new Date("2025-06-05"),
    dueDate: new Date("2025-06-20"),
    hsnCode: "998321",
    currency: "INR",
    lineItems: [
      { service: "Consulting", description: "Business process optimization", quantity: 20, rate: 2000, amount: 40000 }
    ],
    subtotal: 40000,
    discount: 0,
    cgst: 9,
    sgst: 9,
    igst: 0,
    taxAmount: 7200,
    total: 47200,
    status: "unpaid",
    notes: "Consulting services."
  },
  {
            tenantId: '6852eb75de523aa426a43743',
    clientId:'686187b007bdb202b0c36b79',
    invoiceNumber: "GLOBEX-002",
    clientName: "Globex Industries",
    clientEmail: "info@globex.example.com",
    clientAddress: "456 Globex Avenue, New Delhi",
    issueDate: new Date("2025-06-21"),
    dueDate: new Date("2025-07-05"),
    hsnCode: "998322",
    currency: "INR",
    lineItems: [
      { service: "Training", description: "Staff skill development workshop", quantity: 10, rate: 3000, amount: 30000 }
    ],
    subtotal: 30000,
    discount: 10,
    cgst: 9,
    sgst: 9,
    igst: 0,
    taxAmount: 5400,
    total: 32400,
    status: "overdue",
    notes: "Payment overdue."
  },
  {
            tenantId: '6852eb75de523aa426a43743',
    clientId:'686187b007bdb202b0c36b79',
    invoiceNumber: "GLOBEX-003",
    clientName: "Globex Industries",
    clientEmail: "info@globex.example.com",
    clientAddress: "456 Globex Avenue, New Delhi",
    issueDate: new Date("2025-07-06"),
    dueDate: new Date("2025-07-20"),
    hsnCode: "998323",
    currency: "INR",
    lineItems: [
      { service: "Support", description: "Quarterly support plan", quantity: 1, rate: 20000, amount: 20000 }
    ],
    subtotal: 20000,
    discount: 0,
    cgst: 9,
    sgst: 9,
    igst: 0,
    taxAmount: 3600,
    total: 23600,
    status: "paid",
    notes: "Support plan invoice."
  }
];

const seedInvoices = async () => {
  try {
    console.log('Loaded MONGO_URI:', process.env.MONGODB_URI);
                  await mongoose.connect(process.env.MONGODB_URI);
                  console.log('MongoDB connected for seeding');

                  
    await Invoice.insertMany(sampleInvoices);
    console.log('✅ Sample invoices seeded successfully');

    process.exit();
  } catch (error) {
    console.error('❌ Error seeding invoices:', error);
    process.exit(1);
  }
};

seedInvoices();
