const Invoice = require('../models/Invoice');
const mongoose = require('mongoose');
const Client = require('../models/Client');
const invoiceService = require('../services/invoiceService');

// GET /api/invoices
exports.getAllInvoices = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const invoices = await Invoice.find({ tenantId }).sort({ issueDate: -1 });
    return res.json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return res.status(500).json({ error: 'Server error fetching invoices' });
  }
};

// GET /api/invoices/:id
exports.getInvoiceById = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const invoiceNumber = req.params.invoiceNumber;
    const invoice = await Invoice.findOne({ invoiceNumber: invoiceNumber, tenantId });
    console.log("fetching invoice");
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    return res.json(invoice);
  } catch (error) {
    console.error('Error fetching invoice by ID:', error);
    return res.status(500).json({ error: 'Server error fetching invoice' });
  }
};

exports.getInvoicesByClient = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const clientName = req.params.clientName;

    const invoices = await Invoice.find({ tenantId, clientName }).sort({ issueDate: -1 });

    if (invoices.length === 0) {
      return res.status(404).json({ error: 'No invoices found for this client' });
    }

    return res.json(invoices);
  } catch (error) {
    console.error('Error fetching invoices by client:', error);
    return res.status(500).json({ error: 'Server error fetching invoices by client' });
  }
};

exports.getGstBilledByMonth = async (req, res) => {
  // --- 1. Get Authentication & Filtering Data ---
    const tenantId = req.user.tenantId; // From FE input
    const createdBy = req.user.userId;   // From FE input
    const { month } = req.body;          // The crucial month input (e.g., "2025-06")

    console.log("fetching tax");
    // --- 2. Input Validation ---
    if (!tenantId || !createdBy || !month) {
        return res.status(400).json({ 
            message: 'Missing required parameters: tenantId, createdBy, or month.' 
        });
    }

    // Basic month format check (Year-Month, e.g., 2025-06)
    if (!/^\d{2}-\d{4}$/.test(month)) {
        return res.status(400).json({ 
            message: 'Invalid month format. Expected MM-YYYY (e.g., 06-2025).' 
        });
    }

    // --- 3. Calculate Date Range for Filtering ---
    try {
console.log("month is : ", month);
        const [monthIndex, year] = month.split('-').map(Number);
        
        // Start date: The 1st day of the specified month
        // We subtract 1 from monthIndex because Date constructor uses 0-11 for months
        const startDate = new Date();
        startDate.setUTCFullYear(year);
        startDate.setUTCMonth(monthIndex - 1); // 0-indexed month
        startDate.setUTCDate(1);
        startDate.setUTCHours(0, 0, 0, 0); // Set time to 00:00:00.000 UTC

        // End date: The 1st day of the *next* month, set directly to UTC midnight
        const endDate = new Date();
        endDate.setUTCFullYear(year);
        endDate.setUTCMonth(monthIndex); // Move to the next month index
        endDate.setUTCDate(1);
        endDate.setUTCHours(0, 0, 0, 0); // Set time to 00:00:00.000 UTC

        // --- 4. Define Mongoose Query Filter ---
        const filter = {
            tenantId: new mongoose.Types.ObjectId(tenantId),
            issueDate: {
                $gte: startDate, // Greater than or equal to the start of the month
                $lt: endDate     // Less than the start of the next month
            }
        };

        // --- 5. Aggregate to Sum Tax Amounts ---
        const result = await Invoice.aggregate([
            { $match: filter }, // Filter the documents
            {
                $group: {
                    _id: null, // Group all matched documents together
                    totalTaxAmount: { $sum: '$taxAmount' }, // Sum the taxAmount field
                    invoiceCount : { $sum : 1 }
                }
            }
        ]);

        // --- 6. Send Response ---
        const totalTaxAmount = result.length > 0 ? result[0].totalTaxAmount : 0;
        const invoiceCount = result.length > 0 ? result[0].invoiceCount : 0;

        return res.status(200).json({
            month: monthIndex,
            year: year,
            totalTaxAmount: totalTaxAmount,
            invoiceCount: invoiceCount,
            message: `Total tax calculated for ${month}.`
        });

    } catch (error) {
        console.error('Error fetching total tax amount:', error);
        return res.status(500).json({ 
            message: 'An error occurred while processing your request.', 
            error: error.message 
        });
    }
}

// POST /api/invoices
exports.createInvoice = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const createdBy = req.user.userId;

    const newInvoiceData = {
      ...req.body,
      tenantId,
      createdBy
    };
    console.log("incoice data received : ", newInvoiceData);
    const clientId = newInvoiceData.clientId;
    const client = await Client.findOne({ _id: clientId, tenantId });
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }
    console.log(" updating client : ", client);

    const fieldMap = {
        // Incoming Key      : Model Key (based on your 'updating client' object)
        'clientEmail': 'email',       
        'clientAddress': 'address',     
        'clientGST': 'gstin',       // Assuming the model field is 'clientGST'
        'department': 'department'      // This one is correct
    };
    const updates = {};
    let changesFound = false;

    // Iterate over the keys expected in the incoming data
    for (const incomingField in fieldMap) {
      console.log("incoming field : ", incomingField, " field map : ", fieldMap);
        
        // The corresponding field name in the database model
        const modelField = fieldMap[incomingField]; 
        console.log("model field : ",modelField);

        // Get the value from the new invoice data
        // Use String() and trim() for normalization
        const newValue = newInvoiceData[incomingField] ? String(newInvoiceData[incomingField]).trim() : '';
        console.log("newValue", newValue);

        // Get the value from the existing client model
        const existingValue = client[modelField] ? String(client[modelField]).trim() : '';
        console.log("existingValue",existingValue);
        
        // 🚨 CRITICAL CHECK:
        // 1. Is the new value non-empty/non-null? (newValue.length > 0)
        // 2. Is the new value different from the existing value? (existingValue !== newValue)
        if (newValue.length > 0 && existingValue !== newValue) {
            
            // Add the update using the MODEL FIELD name as the key
            updates[modelField] = newValue; 
            changesFound = true;
            
            console.log(`- Change detected for ${modelField}: '${existingValue}' -> '${newValue}'`);
        }
    }

    // 4. Apply Updates
    if (changesFound) {
        console.log("Applying updates:", updates);
        await Client.findByIdAndUpdate(clientId, { $set: updates }, { new: true });
    }

    console.log("updated client : ", client);
    const existingInvoice = await Invoice.findOne({ tenantId, invoiceNumber: newInvoiceData.invoiceNumber });
    if (existingInvoice) {
      return res.status(400).json({ error: 'Invoice with this number already exists in this tenant' });
    }

    const newInvoice = new Invoice(newInvoiceData);
    newInvoice.remainingAmount = newInvoice.total;
    await newInvoice.save();

    return res.status(201).json(newInvoice);
  } catch (error) {
    console.error('Error creating invoice:', error);
    return res.status(500).json({ error: 'Server error creating invoice' });
  }
};

// PUT /api/invoices/:id
exports.updateInvoice = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const invoiceId = req.params.id;
    const invoice = await Invoice.findOne({ _id: invoiceId, tenantId });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    const updates = req.body;
    const updateHistory = [];

    const clientId = updates.clientId;
    const client = await Client.findOne({ _id: clientId, tenantId });
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }
    console.log(" updating client : ", client);

    const fieldMap = {
        email: 'clientEmail', 
        address: 'clientAddress', 
        gstin: 'clientGST', 
        department: 'department' // Assuming 'department' is sent in newInvoiceData or accessible
    };
    const Clientupdates = {};
    let changesFound = false;

    // Iterate over the keys expected in the incoming data
    for (const incomingField in fieldMap) {
      console.log("incoming field : ", incomingField);
        
        // The corresponding field name in the database model
        const modelField = fieldMap[incomingField]; 
        console.log("model field : ",modelField);

        // Get the value from the new invoice data
        // Use String() and trim() for normalization
        const newValue = updates[incomingField] ? String(updates[incomingField]).trim() : '';
        console.log("newValue", newValue);

        // Get the value from the existing client model
        const existingValue = client[modelField] ? String(client[modelField]).trim() : '';
        console.log("existingValue",existingValue);
        
        // 🚨 CRITICAL CHECK:
        // 1. Is the new value non-empty/non-null? (newValue.length > 0)
        // 2. Is the new value different from the existing value? (existingValue !== newValue)
        if (newValue.length > 0 && existingValue !== newValue) {
            
            // Add the update using the MODEL FIELD name as the key
            Clientupdates[modelField] = newValue; 
            changesFound = true;
            
            console.log(`- Change detected for ${modelField}: '${existingValue}' -> '${newValue}'`);
        }
    }

    // 4. Apply Updates
    if (changesFound) {
        console.log("Applying updates:", Clientupdates);
        await Client.findByIdAndUpdate(clientId, { $set: Clientupdates }, { new: true });
    }

    console.log("updated client : ", client);

    console.log("incoice data received : ", updates);

    Object.keys(updates).forEach((key) => {
      if (invoice[key] !== updates[key]) {
        updateHistory.push({
          attribute: key,
          oldValue: invoice[key],
          newValue: updates[key],
          updatedAt: new Date(),
          updatedBy: req.user.userId
        });
        invoice[key] = updates[key];
      }
    });

    invoice.updateHistory.push(...updateHistory);
    invoice.updatedAt = new Date();

    await invoice.save();

    return res.json(invoice);
  } catch (error) {
    console.error('Error updating invoice:', error);
    return res.status(500).json({ error: 'Server error updating invoice' });
  }
};

exports.updatePaymentForInvoice = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const invoiceId = req.params.id;
    const invoice = await Invoice.findOne({ _id: invoiceId, tenantId });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    const updates = req.body;

    console.log("incoice data received : ", updates);

    const fieldMap = {
        // Incoming Key      : Model Key (based on your 'updating client' object)
        'total': 'total',       
        'paidAmount': 'paidAmount'
    };
    console.log("saving paid amount : ", updates.paidAmount);
    const paidAmount = updates.paidAmount;
    const remainingAmount = invoice.remainingAmount - paidAmount;
    console.log("invoice remaining amount is : ", invoice.remainingAmount);
      if (remainingAmount <0){
        console.error('Cannot make payment more than remaining amount : ', invoice.remainingAmount);
        const returnVal = ('Cannot make payment more than remaining amount : ', invoice.remainingAmount);
        return res.status(500).json({ error: returnVal });
      }
    // } else if (invoice.remainingAmount == 0 ) {
    //   const invoiceStatus = invoice.status;
    //   console.log("invoice Status is : ", invoiceStatus, ". Updating to paid.");
    //     invoice.status= 'paid';
    //     invoiceService.logUpdateHistory(invoice, req.user.userId, 'status', invoiceStatus, 'paid')
    //     await invoice.save();
    //     return res.status(201).json(invoice);
    // }
    invoice.remainingAmount = remainingAmount;
    console.log("remaining amount is : ", remainingAmount);
    if (invoice.remainingAmount == 0 ) {
        invoice.status= 'paid';
        invoice.paidAmount += paidAmount;
        invoiceService.logPaymentHistory(invoice, req.user.userId, paidAmount, new Date(), updates.paymentMethod, updates.reference, updates.notes);
        if ( invoice.paidAmount == invoice.total ) {
          await invoice.save();
          return res.status(201).json(invoice);
        }
        console.error('Please check total paid amount : ', invoice.paidAmount , " is more than the total amount : ", invoice.total);
        const returnVal = ('Please check total paid amount : ', invoice.paidAmount , " is more than the total amount : ", invoice.total);
        return res.status(500).json({ error: returnVal });
    } else if (invoice.remainingAmount > 0 ) {
      invoice.status= 'partial';
      invoice.paidAmount += paidAmount;
      await invoice.save();
      return res.status(201).json(invoice);
    }
    console.error('No conditions matched:', error);
    return res.status(500).json({ error: 'Server error updating invoice' });
  } catch (error) {
    console.error('Error updating invoice:', error);
    return res.status(500).json({ error: 'Server error updating invoice' });
  }
};

// DELETE /api/invoices/:id
exports.deleteInvoice = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const invoiceId = req.params.id;
    const invoice = await Invoice.findOneAndDelete({ _id: invoiceId, tenantId });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    return res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    return res.status(500).json({ error: 'Server error deleting invoice' });
  }
};
