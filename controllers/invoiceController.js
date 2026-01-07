const Invoice = require('../models/Invoice');
const mongoose = require('mongoose');
const Client = require('../models/Client');
const invoiceService = require('../services/invoiceService');
const path = require('path');
const puppeteer = require('puppeteer');
const PDFDocument = require('pdfkit');

const FALLBACK_BANK = {
  accountName: 'Witarist IT Services Pvt. Ltd.',
  accountNumber: '123456789012',
  bankName: 'IDFC Bank',
  ifscCode: 'IDFC0001234',
  branch: 'MG Road Branch'
};

const logoPath = path.resolve(__dirname, '../public/logo.jpeg');
// GET /api/invoices
exports.getAllInvoices = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const invoices = await Invoice.find({ 
      tenantId,
      isActive: { $ne: false },
      deletedStatus: { $ne: true }
    })
      .populate('paymentHistory.paymentMethod', 'code')
      .sort({ issueDate: -1 });
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
    const invoice = await Invoice.findOne({ 
      invoiceNumber: invoiceNumber, 
      tenantId,
      isActive: { $ne: false },
      deletedStatus: { $ne: true }
    })
      .populate('paymentHistory.paymentMethod', 'code');
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

    const invoices = await Invoice.find({ 
      tenantId, 
      clientName,
      isActive: { $ne: false },
      deletedStatus: { $ne: true }
    }).sort({ issueDate: -1 });

    if (invoices.length === 0) {
      return res.status(404).json({ error: 'No invoices found for this client' });
    }

    return res.json(invoices);
  } catch (error) {
    console.error('Error fetching invoices by client:', error);
    return res.status(500).json({ error: 'Server error fetching invoices by client' });
  }
};

// GET /api/invoices/filter/by-date?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
exports.getInvoicesByDateRange = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ 
        error: 'startDate and endDate query parameters are required' 
      });
    }

    // Parse dates as UTC to avoid timezone issues
    const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
    const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
    
    const start = new Date(Date.UTC(startYear, startMonth - 1, startDay, 0, 0, 0, 0));
    const end = new Date(Date.UTC(endYear, endMonth - 1, endDay, 23, 59, 59, 999));

    const tenantObjectId = new mongoose.Types.ObjectId(tenantId);

    // First: fetch invoices strictly within the requested date range
    let invoices = await Invoice.find({
      tenantId: tenantObjectId,
      issueDate: { $gte: start, $lte: end },
      isActive: { $ne: false },
      deletedStatus: { $ne: true }
    }).sort({ issueDate: -1 });

    // If fewer than 5 invoices are found in the range, backfill with most recent invoices
    // for this tenant (ignoring the date filter), sorted by issueDate desc, up to a total of 5.
    if (invoices.length < 5) {
      const existingIds = invoices.map(inv => inv._id.toString());

      const extraInvoices = await Invoice.find({
        tenantId: tenantObjectId,
        isActive: { $ne: false },
        deletedStatus: { $ne: true },
        _id: { $nin: existingIds }
      })
        .sort({ issueDate: -1 })
        .limit(5 - invoices.length);

      invoices = [...invoices, ...extraInvoices];
    }

    return res.json({
      invoices,
      count: invoices.length,
      dateRange: {
        startDate: start.toISOString(),
        endDate: end.toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching invoices by date range:', error);
    return res.status(500).json({ error: 'Server error fetching invoices by date range' });
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

    // Normalize lineItems if present
    const normalizeLineItem = (it) => {
      const item = { ...it };

      // Map hours -> numberOfHours (accept either from FE)
      if (item.hours !== undefined && item.numberOfHours === undefined) {
        item.numberOfHours = item.hours;
      }
      delete item.hours; // remove any leftover

      // Coerce numeric fields
      ['rate', 'amount', 'lop', 'extraDays', 'numberOfHours'].forEach((k) => {
        if (item[k] !== undefined && item[k] !== null && item[k] !== '') {
          const v = Number(item[k]);
          item[k] = Number.isNaN(v) ? undefined : v;
        } else {
          delete item[k];
        }
      });

      // Dates: convert periodFrom / periodTo strings (if provided) to Date
      if (item.periodFrom) {
        const d = new Date(item.periodFrom);
        item.periodFrom = isNaN(d.getTime()) ? undefined : d;
      }
      if (item.periodTo) {
        const d2 = new Date(item.periodTo);
        item.periodTo = isNaN(d2.getTime()) ? undefined : d2;
      }

      // rateType normalization + validation
      if (item.rateType) {
        const rt = String(item.rateType).toLowerCase();
        if (rt === 'monthly' || rt === 'hourly') {
          item.rateType = rt;
        } else {
          delete item.rateType;
        }
      }

      // Ensure id/resourceName/service stay as strings (if present)
      ['id', 'resourceName', 'service', 'description'].forEach(k => {
        if (item[k] !== undefined && item[k] !== null) item[k] = String(item[k]);
      });

      return item;
    };

    if (Array.isArray(newInvoiceData.lineItems)) {
      newInvoiceData.lineItems = newInvoiceData.lineItems.map(normalizeLineItem);
    }

    const newInvoice = new Invoice(newInvoiceData);
    // remainingAmount will be calculated in pre-save hook based on tdsTotal
    await newInvoice.save();

    return res.status(201).json(newInvoice);
  } catch (error) {
    console.error('Error creating invoice:', error);
    return res.status(500).json({ error: 'Server error creating invoice' });
  }
};

// PUT /api/invoices/:id
// exports.updateInvoice = async (req, res) => {
//   try {
//     const tenantId = req.user.tenantId;
//     const invoiceId = req.params.id;
//     const invoice = await Invoice.findOne({ _id: invoiceId, tenantId });
//     if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

//     const updates = req.body;
//     const updateHistory = [];

//     const clientId = updates.clientId;
//     const client = await Client.findOne({ _id: clientId, tenantId });
//     if (!client) {
//       return res.status(404).json({ error: 'Client not found' });
//     }
//     console.log(" updating client : ", client);

//     const fieldMap = {
//         email: 'clientEmail', 
//         address: 'clientAddress', 
//         gstin: 'clientGST', 
//         department: 'department' // Assuming 'department' is sent in newInvoiceData or accessible
//     };
//     const Clientupdates = {};
//     let changesFound = false;

//     // Iterate over the keys expected in the incoming data
//     for (const incomingField in fieldMap) {
//       console.log("incoming field : ", incomingField);
        
//         // The corresponding field name in the database model
//         const modelField = fieldMap[incomingField]; 
//         console.log("model field : ",modelField);

//         // Get the value from the new invoice data
//         // Use String() and trim() for normalization
//         const newValue = updates[incomingField] ? String(updates[incomingField]).trim() : '';
//         console.log("newValue", newValue);

//         // Get the value from the existing client model
//         const existingValue = client[modelField] ? String(client[modelField]).trim() : '';
//         console.log("existingValue",existingValue);
        
//         // 🚨 CRITICAL CHECK:
//         // 1. Is the new value non-empty/non-null? (newValue.length > 0)
//         // 2. Is the new value different from the existing value? (existingValue !== newValue)
//         if (newValue.length > 0 && existingValue !== newValue) {
            
//             // Add the update using the MODEL FIELD name as the key
//             Clientupdates[modelField] = newValue; 
//             changesFound = true;
            
//             console.log(`- Change detected for ${modelField}: '${existingValue}' -> '${newValue}'`);
//         }
//     }

//     // 4. Apply Updates
//     if (changesFound) {
//         console.log("Applying updates:", Clientupdates);
//         await Client.findByIdAndUpdate(clientId, { $set: Clientupdates }, { new: true });
//     }

//     console.log("updated client : ", client);

//     console.log("incoice data received : ", updates);

//     Object.keys(updates).forEach((key) => {
//       if (invoice[key] !== updates[key]) {
//         updateHistory.push({
//           attribute: key,
//           oldValue: invoice[key],
//           newValue: updates[key],
//           updatedAt: new Date(),
//           updatedBy: req.user.userId
//         });
//         invoice[key] = updates[key];
//       }
//     });

//     invoice.updateHistory.push(...updateHistory);
//     invoice.updatedAt = new Date();

//     await invoice.save();

//     return res.json(invoice);
//   } catch (error) {
//     console.error('Error updating invoice:', error);
//     return res.status(500).json({ error: 'Server error updating invoice' });
//   }
// };

// PUT /api/invoices/:id
exports.updateInvoice = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const invoiceId = req.params.id;
    const invoice = await Invoice.findOne({ _id: invoiceId, tenantId });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    // Restrict editing of paid invoices to superadmin only
    if (invoice.status === 'paid' && req.user.role !== 'superadmin') {
      return res.status(403).json({ 
        error: 'Forbidden: Only superadmin can edit paid invoices' 
      });
    }

    const updates = { ...req.body };
    const updateHistory = [];

    // Validate client exists (if clientId supplied; otherwise use invoice.clientId)
    const clientId = updates.clientId || invoice.clientId;
    const client = await Client.findOne({ _id: clientId, tenantId });
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // fieldMap: incomingKey -> modelField (fixed)
    const fieldMap = {
      clientEmail: 'email',
      clientAddress: 'address',
      clientGST: 'gstin',
      department: 'department'
    };
    const Clientupdates = {};
    let changesFound = false;

    for (const incomingField in fieldMap) {
      const modelField = fieldMap[incomingField];
      const newValue = updates[incomingField] ? String(updates[incomingField]).trim() : '';
      const existingValue = client[modelField] ? String(client[modelField]).trim() : '';

      if (newValue.length > 0 && existingValue !== newValue) {
        Clientupdates[modelField] = newValue;
        changesFound = true;
        console.log(`- Change detected for ${modelField}: '${existingValue}' -> '${newValue}'`);
      }
    }

    if (changesFound) {
      console.log("Applying client updates:", Clientupdates);
      await Client.findByIdAndUpdate(client._id, { $set: Clientupdates }, { new: true });
    }

    console.log("invoice update payload:", updates);

    // Normalizer reused from create (or inline copy)
    const normalizeLineItem = (it) => {
      const item = { ...it };
      if (item.hours !== undefined && item.numberOfHours === undefined) {
        item.numberOfHours = item.hours;
      }
      delete item.hours;

      ['rate', 'amount', 'lop', 'extraDays', 'numberOfHours'].forEach((k) => {
        if (item[k] !== undefined && item[k] !== null && item[k] !== '') {
          const v = Number(item[k]);
          item[k] = Number.isNaN(v) ? undefined : v;
        } else {
          delete item[k];
        }
      });

      if (item.periodFrom) {
        const d = new Date(item.periodFrom);
        item.periodFrom = isNaN(d.getTime()) ? undefined : d;
      }
      if (item.periodTo) {
        const d2 = new Date(item.periodTo);
        item.periodTo = isNaN(d2.getTime()) ? undefined : d2;
      }

      if (item.rateType) {
        const rt = String(item.rateType).toLowerCase();
        if (rt === 'monthly' || rt === 'hourly') {
          item.rateType = rt;
        } else {
          delete item.rateType;
        }
      }

      ['id', 'resourceName', 'service', 'description'].forEach(k => {
        if (item[k] !== undefined && item[k] !== null) item[k] = String(item[k]);
      });

      return item;
    };

    // If lineItems provided, normalize them
    if (Array.isArray(updates.lineItems)) {
      updates.lineItems = updates.lineItems.map(normalizeLineItem);
    }

    // Build updateHistory and apply updates
    Object.keys(updates).forEach((key) => {
      // For complex objects like lineItems we just store the whole replacement
      if (key === 'lineItems') {
        const oldVal = invoice.lineItems ? invoice.lineItems.map(li => ({ ...li })) : undefined;
        const newVal = updates.lineItems;
        // Compare JSON stringified versions (simple deep compare)
        const oldJson = JSON.stringify(oldVal || []);
        const newJson = JSON.stringify(newVal || []);
        if (oldJson !== newJson) {
          updateHistory.push({
            attribute: 'lineItems',
            oldValue: oldVal,
            newValue: newVal,
            updatedAt: new Date(),
            updatedBy: req.user.userId
          });
          invoice.lineItems = newVal;
        }
        return;
      }

      // For other fields, shallow compare
      const oldValue = invoice[key];
      const newValue = updates[key];

      // treat undefined vs null vs '' carefully — only record if truly different
      const oldJson = oldValue instanceof Date ? oldValue.toISOString() : JSON.stringify(oldValue);
      const newJson = newValue instanceof Date ? newValue.toISOString() : JSON.stringify(newValue);

      if (oldJson !== newJson) {
        updateHistory.push({
          attribute: key,
          oldValue: oldValue,
          newValue: newValue,
          updatedAt: new Date(),
          updatedBy: req.user.userId
        });
        invoice[key] = newValue;
      }
    });

    if (updateHistory.length > 0) {
      invoice.updateHistory.push(...updateHistory);
    }

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
    invoice.remainingAmount = remainingAmount;
    console.log("remaining amount is : ", remainingAmount);
    if (invoice.remainingAmount == 0 ) {
        invoice.status= 'paid';
        invoice.paidAmount += paidAmount;
        invoiceService.logPaymentHistory(invoice, req.user.userId, paidAmount, new Date(), updates.paymentMethod, updates.reference, updates.notes);
        if ( invoice.paidAmount == invoice.payableAmount ) {
          await invoice.save();
          return res.status(201).json(invoice);
        }
        console.error('Please check total paid amount : ', invoice.paidAmount , " is more than the total amount : ", invoice.tdsAmount);
        const returnVal = ('Please check total paid amount : ', invoice.paidAmount , " is more than the total amount : ", invoice.tdsAmount);
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
    const invoice = await Invoice.findOne({ _id: invoiceId, tenantId });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    // Soft-delete: set archive and deletedStatus to true
    invoice.archive = true;
    invoice.deletedStatus = true;
    invoice.isActive = false;
    invoice.updatedAt = new Date();

    // Log to updateHistory
    invoice.updateHistory.push({
      attribute: 'deletedStatus',
      oldValue: false,
      newValue: true,
      updatedAt: new Date(),
      updatedBy: req.user.userId
    });

    await invoice.save();
    return res.json({ message: 'Invoice soft-deleted successfully' });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    return res.status(500).json({ error: 'Server error deleting invoice' });
  }
};

exports.getInvoicePDF = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const invoiceNumber = req.params.invoiceNumber;
    const invoice = await Invoice.findOne({ invoiceNumber: invoiceNumber, tenantId });
    console.log("fetching invoice for PDF");
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    const doc = new PDFDocument({ size: 'A4', margin: 36 });
    res.setHeader('Content-Type', 'application/pdf');
    // suggested filename
    res.setHeader('Content-Disposition', `attachment; filename=Invoice-${invoice.invoiceNumber || 'invoice'}.pdf`);

    // Pipe pdf to response
    doc.pipe(res);
    try {
      doc.image(LOGO_PATH, 48, 40, { width: 90 });
    } catch (err) {
      // if logo path invalid, continue without crashing
      console.warn('Logo not found or unreadable at', LOGO_PATH);
    }

    // Header text
    doc.fontSize(16).text('Witarist IT Services Pvt. Ltd.', 160, 45, { align: 'left' });
    doc.fontSize(10).text('Reg. Address - Office No. - 62, Plot No. - 31 G/F', 160);
    doc.moveDown(1);

    // Title bar
    doc.moveTo(36, 120).lineTo(559, 120).strokeColor('#000').stroke();
    doc.fontSize(14).text('Tax Invoice', 36, 125);

    // Invoice & client block
    const startY = 150;
    doc.fontSize(10);
    doc.text(`Invoice No. : ${invoice.invoiceNumber || ''}`, 36, startY);
    doc.text(`Invoice Date : ${invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString() : ''}`, 300, startY);
    doc.text(`HSN Code : ${invoice.hsnCode || ''}`, 36, startY + 15);

    doc.text('Invoice To:', 36, startY + 40);
    doc.font('Helvetica-Bold').text(invoice.clientName || '', 36, startY + 55);
    doc.font('Helvetica').moveDown(1);

    // Bank details block
    const bankY = startY + 90;
    doc.rect(36, bankY - 6, 515, 70).strokeColor('#ccc').stroke();
    doc.fontSize(11).font('Helvetica-Bold').text('Bank Details', 40, bankY - 2);

    doc.fontSize(10).font('Helvetica');
    doc.text('Account Name:', 40, bankY + 15);
    doc.text(bank.accountName || '-', 140, bankY + 15);
    doc.text('Account Number:', 40, bankY + 30);
    doc.text(bank.accountNumber || '-', 140, bankY + 30);
    doc.text('Bank Name:', 40, bankY + 45);
    doc.text(bank.bankName || '-', 140, bankY + 45);

    // IFSC and Branch on the right
    doc.text('IFSC:', 340, bankY + 15);
    doc.text(bank.ifscCode || '-', 400, bankY + 15);
    doc.text('Branch:', 340, bankY + 30);
    doc.text(bank.branch || '-', 400, bankY + 30);

    // Line items table header
    const tableTop = bankY + 90;
    doc.moveTo(36, tableTop - 6).lineTo(559, tableTop - 6).strokeColor('#000').stroke();
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('S. No', 40, tableTop);
    doc.text('Description', 80, tableTop);
    doc.text('Qty', 360, tableTop, { width: 50, align: 'right' });
    doc.text('Rate', 420, tableTop, { width: 60, align: 'right' });
    doc.text('Amount', 490, tableTop, { width: 70, align: 'right' });

    doc.font('Helvetica');
    let y = tableTop + 20;
    invoice.lineItems = invoice.lineItems || [];
    invoice.lineItems.forEach((li, i) => {
      doc.text(String(i + 1), 40, y);
      doc.text(li.description || '-', 80, y, { width: 260 });
      doc.text(String(li.quantity || 0), 360, y, { width: 50, align: 'right' });
      doc.text(`${invoice.currency || 'INR'} ${Number(li.rate || 0).toFixed(2)}`, 420, y, { width: 60, align: 'right' });
      doc.text(`${invoice.currency || 'INR'} ${Number(li.amount || 0).toFixed(2)}`, 490, y, { width: 70, align: 'right' });
      y += 30;
    });

    // Totals on the bottom right
    const totalsY = y + 10;
    doc.fontSize(10).font('Helvetica');
    doc.text(`Sub Total:`, 380, totalsY, { width: 120, align: 'left' });
    doc.text(`${invoice.currency || 'INR'} ${Number(invoice.subtotal || 0).toFixed(2)}`, 490, totalsY, { width: 70, align: 'right' });

    doc.text(`Discount:`, 380, totalsY + 15, { width: 120, align: 'left' });
    doc.text(`${invoice.currency || 'INR'} ${Number(((invoice.subtotal || 0) * (invoice.discount || 0) / 100)).toFixed(2)}`, 490, totalsY + 15, { width: 70, align: 'right' });

    doc.font('Helvetica-Bold');
    doc.text(`Total:`, 380, totalsY + 35, { width: 120, align: 'left' });
    doc.text(`${invoice.currency || 'INR'} ${Number(invoice.total || 0).toFixed(2)}`, 490, totalsY + 35, { width: 70, align: 'right' });

    // Footer notes
    doc.font('Helvetica').fontSize(9).text('Amount Chargeable (in words):', 36, totalsY + 80);
    doc.text(invoice.notes || 'Two Thousand Eight Hundred & Eight Dollars Only', 36, totalsY + 95);

    // Finalize PDF
    doc.end();

  } catch (err) {
    console.error('PDF generation error', err);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
};


exports.downloadInvoicePdf = async (req, res) => {
  try {
    const invoiceId = req.params.id;
    // fetch invoice (or hardcode test invoice if you want)
    const invoice = await Invoice.findById(invoiceId).lean();
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    // If you want to also fetch client data:
    let client = null;
    if (invoice.clientId) {
      client = await Client.findById(invoice.clientId).lean();
    }
    console.log("fetched client for pdf : ", client, " invoice : ", invoice, " logoPath : ", logoPath);

    // --- IMPORTANT: local file path to the uploaded logo (from conversation) ---
    // const logoPath = '/mnt/data/e73f2cb8-6e59-4794-8db1-5da185f2001a.png';
    // You may prefer to resolve from project:
    // const logoPath = path.resolve(__dirname, '../public/logo.png');

    // Build a simple HTML template (hardcode company details — edit later)
    const company = {
      name: 'Witarist IT Services Pvt. Ltd.',
      addressLine1: 'Office No. - 62, Plot No. - 31 G/F, Durga Park Dallupura',
      city: 'New Delhi - 110096',
      gstin: '07AACCW5373R1ZJ',
      bankName: 'IDFC Bank',
      bankBranch: 'MG Road Branch',
      bankAccount: '676757878677',
      bankIfsc: 'IDFC0001234'
    };

    // You can hardcode or derive more values here. For now fill blanks with invoice fields.
    const html = `
      <!doctype html>
        <html lang="en">
        <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>Invoice - {{invoiceNumber}}</title>

        <style>
          /* A4 */
          @page { size: A4; margin: 20mm; }
          html,body {
            font-family: "Helvetica", Arial, sans-serif;
            color: #111827;
            font-size: 12px;
            -webkit-print-color-adjust: exact;
          }

          .page {
            width: 210mm;
            min-height: 297mm;
            box-sizing: border-box;
          }

          .outer-border {
            border: 3px solid #111827;
            padding: 12px;
            box-sizing: border-box;
            height: calc(297mm - 40mm);
          }

          .header {
            display: flex;
            align-items: center;
            gap: 16px;
            padding: 6px 8px;
            border-bottom: 3px solid #111827;
          }

          .logo {
            width: 110px;
            height: 80px;
            object-fit: contain;
            border-right: 1px solid #ddd;
            padding-right: 12px;
          }

          .company {
            flex: 1;
            text-align: center;
            line-height: 1.1;
          }

          .company h1 {
            margin: 0;
            font-size: 22px;
            font-weight: 700;
          }

          .company p {
            margin: 2px 0;
            font-size: 11px;
          }

          .gst {
            font-weight: 700;
            margin-top: 6px;
          }

          .tax-invoice-bar {
            margin-top: 8px;
            background: #666666;
            color: #fff;
            padding: 8px;
            text-align: center;
            font-weight: 700;
            border-radius: 2px;
          }

          .section {
            border: 1px solid #cfcfcf;
            padding: 10px;
            margin-top: 12px;
            border-radius: 2px;
            background: #fff;
          }

          .grid-4 {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
            align-items: start;
          }

          .grid-2-1 {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 8px;
          }

          .label { font-size: 11px; color: #555; }
          .value { font-weight: 600; font-size: 13px; }

          table.items {
            width: 100%;
            border-collapse: collapse;
            margin-top: 8px;
          }

          table.items thead th {
            border-bottom: 2px solid #111827;
            padding: 8px;
            background: #f3f4f6;
            text-align: left;
            font-weight: 700;
            font-size: 12px;
          }

          table.items tbody td {
            padding: 10px;
            vertical-align: top;
            border-bottom: 1px dashed #e5e7eb;
            font-size: 12px;
          }

          .desc-col {
            width: 55%;
            background: #f7f7f7;
            padding: 8px;
          }

          .num-col {
            text-align: right;
          }

          .totals {
            width: 320px;
            float: right;
            margin-top: 12px;
            border-top: 1px solid #ddd;
            padding-top: 8px;
          }

          .totals div { display:flex; justify-content:space-between; padding:4px 0; }
          .total-amount { font-weight: 800; font-size: 14px; }

          .bottom {
            margin-top: 90px;
            display: flex;
            gap: 12px;
          }

          .amount-words {
            flex: 1;
            border: 1px solid #cfcfcf;
            padding: 8px;
            min-height: 60px;
          }

          .bank-block {
            width: 320px;
            border: 1px solid #cfcfcf;
            padding: 8px;
          }

          .stamp {
            width: 160px;
            height: 120px;
            margin-left: auto;
            text-align: center;
          }

          .small { font-size: 11px; color: #444; }
          .right { text-align: right; }

          /* ensure footer stays at bottom visually */
          .footer {
            text-align:center;
            margin-top: 18px;
            font-size: 11px;
            color: #444;
          }

          /* prevent page breaks in important blocks */
          .section, .items, .bottom { page-break-inside: avoid; }

        </style>
        </head>
        <body>
          <div class="page">
            <div class="outer-border">

              <!-- header -->
              <div class="header">
                <img class="logo" src="{{logoUrl}}" alt="Company logo" />
                <div class="company">
                  <h1>Witarist IT Services Pvt. Ltd.</h1>
                  <p>Office No. - 62, Plot No. - 31 G/F, Durga Park Dallupura · New Delhi - 110096</p>
                  <p>New Delhi, India</p>
                  <div class="gst">GSTIN: 07AACCW5373R1ZJ</div>
                </div>
              </div>

              <div class="tax-invoice-bar">TAX INVOICE</div>

              <!-- Invoice info row -->
              <div class="section">
                <div class="grid-4">
                  <div>
                    <div class="label">Invoice To:</div>
                    <div class="value">{{clientName}}</div>
                    <div class="small">{{clientAddress}}</div>
                    <div class="small">GSTIN: {{clientGst || 'NA'}}</div>
                  </div>

                  <div>
                    <div class="label">Invoice No</div>
                    <div class="value">{{invoiceNumber}}</div>
                    <div class="label">Invoice Date</div>
                    <div class="small">{{invoiceDate}}</div>
                  </div>

                  <div>
                    <div class="label">Due Date</div>
                    <div class="value">{{dueDate}}</div>
                    <div class="label">HSN Code</div>
                    <div class="small">{{hsnCode || '-'}}</div>
                  </div>

                  <div>
                    <div class="label">Currency</div>
                    <div class="value">{{currency}}</div>
                  </div>
                </div>
              </div>

              <!-- items table -->
              <div class="section">
                <table class="items">
                  <thead>
                    <tr>
                      <th style="width:6%;">S. No.</th>
                      <th style="width:55%;">Description of Services</th>
                      <th style="width:12%; text-align:center;">Per Unit</th>
                      <th style="width:8%; text-align:center;">Qty</th>
                      <th style="width:19%; text-align:right;">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {{#lineItems}}
                    <tr>
                      <td>{{index}}</td>
                      <td class="desc-col">
                        <div style="font-weight:700;">{{description}}</div>
                        <div class="small">{{service || ''}}</div>
                        {{#extra}}<div class="small">{{extra}}</div>{{/extra}}
                      </td>
                      <td class="num-col">₹{{rate.toFixed(2)}}</td>
                      <td class="num-col">{{quantity}}</td>
                      <td class="num-col">₹{{amount.toFixed(2)}}</td>
                    </tr>
                    {{/lineItems}}

                  </tbody>
                </table>

                <div style="clear:both"></div>

                <div class="totals">
                  <div><span>Subtotal:</span><span>₹{{subtotal.toFixed(2)}}</span></div>
                  <div><span>Discount ({{discount}}%):</span><span>-₹{{discountAmount.toFixed(2)}}</span></div>
                  <div><span>Taxable Amount:</span><span>₹{{taxableAmount.toFixed(2)}}</span></div>
                  <div><span>CGST ({{cgst}}%):</span><span>₹{{cgstAmount.toFixed(2)}}</span></div>
                  <div><span>SGST ({{sgst}}%):</span><span>₹{{sgstAmount.toFixed(2)}}</span></div>
                  <div><span>IGST ({{igst}}%):</span><span>₹{{igstAmount.toFixed(2)}}</span></div>
                  <div style="border-top:1px solid #111827; padding-top:6px;" class="total-amount"><span>Total:</span><span>₹{{total.toFixed(2)}}</span></div>
                </div>

              </div>

              <!-- bottom area: amount words / bank / stamp -->
              <div class="bottom">
                <div class="amount-words">
                  <div class="label">Amount Chargeable (in words)</div>
                  <div style="margin-top:8px; font-weight:700;">{{amountInWords}}</div>
                </div>

                <div class="bank-block">
                  <div class="label">Bank Details</div>
                  <div class="small" style="margin-top:6px;">Name: Witarist IT Services Pvt. Ltd.</div>
                  <div class="small">Bank & Branch: {{bankName}} , {{branch}}</div>
                  <div class="small">Bank A/c No: {{accountNumber}}</div>
                  <div class="small">Bank IFSC: {{ifscCode}}</div>
                </div>

                <div class="stamp">
                  <img src="{{stampUrl}}" alt="stamp" style="max-width:140px; max-height:120px; opacity:0.95;" />
                  <div class="small" style="margin-top:6px;">Witarist IT Services Pvt. Ltd.</div>
                </div>
              </div>

              <div style="clear:both"></div>

              <div class="footer">Thank You For Your Business!</div>

            </div>
          </div>
        </body>
        </html>
    `;

    // Launch puppeteer and generate PDF
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // Puppeteer needs file:// images, so we set content (works with file://)
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' }
    });

    await browser.close();

    // Return PDF as attachment
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=invoice-${invoice.invoiceNumber || invoiceId}.pdf`,
      'Content-Length': pdfBuffer.length
    });
    return res.send(pdfBuffer);

  } catch (err) {
    console.error('PDF generation error', err);
    return res.status(500).json({ error: 'Failed to generate PDF' });
  }
};

exports.generateInvoicePDF = async (req, res) => {
    try {
      const tenantId = req.user.tenantId;
      const invoiceId = req.params.id;
      const invoice = await Invoice.findOne({ _id: invoiceId, tenantId });
      if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

      let client = null;
    if (invoice.clientId) {
      client = await Client.findById(invoice.clientId).lean();
    }
    console.log("fetched client for pdf : ", client, " invoice : ", invoice, " logoPath : ", logoPath);

    const doc = new PDFDocument({ 
            size: 'A4', 
            margin: 50,
            bufferPages: true 
        });

        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.invoiceNumber}.pdf`);

        // Pipe PDF to response
        doc.pipe(res);

        // Generate PDF content
        generateInvoicePDF(doc, invoice);

        // Finalize PDF
        doc.end();

    } catch (error) {
      console.error('Error generating invoice PDF:', error);
      return res.status(500).json({ error: 'Server error generating invoice PDF' });
    }
};

function generateInvoicePDF(doc, invoice) {
    const tenant = invoice.tenantId;
    const client = invoice.clientId;
    // Colors
    const primaryColor = '#2563eb';
    const grayColor = '#6b7280';
    const darkColor = '#1f2937';

    // Company Header
    doc.fontSize(20)
        .fillColor(primaryColor)
        .text(tenant.companyName || 'Witarist IT Services Pvt. Ltd.', 50, 50);

    // Company Details
    doc.fontSize(9)
        .fillColor(grayColor)
        .text(`Reg. Address: ${tenant.address || 'Office No. - 62, Plot No. - 31 G/F'}`, 50, 75)
        .text(`${tenant.city || 'Durga Park Dallupura'}, ${tenant.state || 'New Delhi'} - ${tenant.pincode || '110096'}`, 50, 88)
        .text(`${tenant.country || 'India'}`, 50, 101);
    doc.text(`GSTIN: 6786768768768`, 50, 114);
    // Tax Invoice Title
    doc.fontSize(16)
        .fillColor(darkColor)
        .text('Tax Invoice', 50, 150, { underline: true });

    // Invoice Details - Right Side
    const rightX = 380;
    doc.fontSize(10)
        .fillColor(grayColor)
        .text('Invoice No:', rightX, 75)
        .fillColor(darkColor)
        .text(invoice.invoiceNumber, rightX + 80, 75);

    doc.fillColor(grayColor)
        .text('Invoice Date:', rightX, 90)
        .fillColor(darkColor)
        .text(formatDate(invoice.issueDate), rightX + 80, 90);

    doc.fillColor(grayColor)
        .text('Due Date:', rightX, 105)
        .fillColor(darkColor)
        .text(formatDate(invoice.dueDate), rightX + 80, 105);

    if (invoice.hsnCode) {
        doc.fillColor(grayColor)
            .text('HSN Code:', rightX, 120)
            .fillColor(darkColor)
            .text(invoice.hsnCode, rightX + 80, 120);
    }

    // Client Information Section
    doc.fontSize(12)
        .fillColor(primaryColor)
        .text('Invoice To:', 50, 190);

    doc.fontSize(10)
        .fillColor(grayColor)
        .text('Name:', 50, 210)
        .fillColor(darkColor)
        .text(invoice.clientName, 120, 210);

    if (client && client.address) {
        doc.fillColor(grayColor)
            .text('Address:', 50, 225)
            .fillColor(darkColor)
            .text(`${client.address}, ${client.city || ''}, ${client.state || ''} - ${client.pincode || ''}`, 120, 225, { width: 400 });
    }

    if (client && client.gstin) {
        doc.fillColor(grayColor)
            .text('GSTIN:', 50, 255)
            .fillColor(darkColor)
            .text(client.gstin, 120, 255);
    } else {
        doc.fillColor(grayColor)
            .text('GSTIN:', 50, 255)
            .fillColor(darkColor)
            .text('NA', 120, 255);
    }

    // Bank Details Section
    if (invoice.bankAccountDetails && invoice.bankAccountDetails.accountName) {
        doc.fontSize(12)
            .fillColor(primaryColor)
            .text('Bank Details:', rightX, 190);

        doc.fontSize(9)
            .fillColor(grayColor)
            .text('Account Name:', rightX, 210)
            .fillColor(darkColor)
            .text(invoice.bankAccountDetails.accountName, rightX, 222, { width: 150 });

        doc.fillColor(grayColor)
            .text('Account Number:', rightX, 245)
            .fillColor(darkColor)
            .text(invoice.bankAccountDetails.accountNumber, rightX, 257);

        doc.fillColor(grayColor)
            .text('Bank Name:', rightX, 280)
            .fillColor(darkColor)
            .text(invoice.bankAccountDetails.bankName, rightX, 292);

        doc.fillColor(grayColor)
            .text('IFSC Code:', rightX, 315)
            .fillColor(darkColor)
            .text(invoice.bankAccountDetails.ifscCode, rightX, 327);

        if (invoice.bankAccountDetails.branch) {
            doc.fillColor(grayColor)
                .text('Branch:', rightX, 350)
                .fillColor(darkColor)
                .text(invoice.bankAccountDetails.branch, rightX, 362);
        }
    }

    // Line Items Table
    const tableTop = 310;
    generateTableHeader(doc, tableTop);
    generateTableRows(doc, invoice, tableTop);

    // Summary Section
    const summaryTop = tableTop + 60 + (invoice.lineItems.length * 25);
    generateSummary(doc, invoice, summaryTop);

    // Notes Section
    if (invoice.notes) {
        doc.fontSize(10)
            .fillColor(primaryColor)
            .text('Notes:', 50, summaryTop + 150);
        
        doc.fontSize(9)
            .fillColor(darkColor)
            .text(invoice.notes, 50, summaryTop + 165, { width: 500 });
    }

    // Footer
    const footerTop = doc.page.height - 100;
    doc.fontSize(8)
        .fillColor(grayColor)
        .text('Thank You For Your Business!', 50, footerTop, { align: 'center', width: 500 });

    doc.fontSize(9)
        .fillColor(darkColor)
        .text(tenant.companyName || 'Witarist IT Services Pvt. Ltd.', 400, footerTop + 30);
}

function generateTableHeader(doc, y) {
    doc.fontSize(10)
        .fillColor('#1f2937')
        .text('S. No.', 50, y, { width: 40 })
        .text('Description', 95, y, { width: 200 })
        .text('Rate', 300, y, { width: 80, align: 'right' })
        .text('Quantity', 385, y, { width: 60, align: 'right' })
        .text('Amount', 450, y, { width: 95, align: 'right' });

    // Draw line under header
    doc.moveTo(50, y + 15)
        .lineTo(545, y + 15)
        .strokeColor('#e5e7eb')
        .stroke();
}

function generateTableRows(doc, invoice, tableTop) {
    let y = tableTop + 25;

    invoice.lineItems.forEach((item, index) => {
        doc.fontSize(9)
            .fillColor('#374151')
            .text(index + 1, 50, y, { width: 40 })
            .text(item.description || item.service, 95, y, { width: 200 })
            .text(`${invoice.currency || '₹'}${item.rate.toFixed(2)}`, 300, y, { width: 80, align: 'right' })
            .text(item.quantity, 385, y, { width: 60, align: 'right' })
            .text(`${invoice.currency || '₹'}${item.amount.toFixed(2)}`, 450, y, { width: 95, align: 'right' });

        // Add period/notes if available
        if (item.notes) {
            y += 15;
            doc.fontSize(8)
                .fillColor('#6b7280')
                .text(item.notes, 95, y, { width: 200 });
        }

        y += 25;
    });
}

function generateSummary(doc, invoice, y) {
    const currency = invoice.currency || '₹';
    const labelX = 350;
    const valueX = 480;

    doc.fontSize(9)
        .fillColor('#6b7280');

    // Subtotal
    doc.text('Sub Total:', labelX, y)
        .fillColor('#374151')
        .text(`${currency}${invoice.subtotal.toFixed(2)}`, valueX, y, { align: 'right', width: 65 });
    y += 20;

    // Discount
    if (invoice.discount > 0) {
        doc.fillColor('#6b7280')
            .text(`Discount (${invoice.discount}%):`, labelX, y)
            .fillColor('#374151')
            .text(`-${currency}${invoice.discountAmount.toFixed(2)}`, valueX, y, { align: 'right', width: 65 });
        y += 20;

        doc.fillColor('#6b7280')
            .text('Sub Total After Discount:', labelX, y)
            .fillColor('#374151')
            .text(`${currency}${invoice.discountedAmount.toFixed(2)}`, valueX, y, { align: 'right', width: 65 });
        y += 20;
    }

    // Taxes
    if (invoice.cgst > 0) {
        doc.fillColor('#6b7280')
            .text(`CGST (${invoice.cgst}%):`, labelX, y)
            .fillColor('#374151')
            .text(`${currency}${((invoice.cgst / 100) * (invoice.discountedAmount || invoice.subtotal)).toFixed(2)}`, valueX, y, { align: 'right', width: 65 });
        y += 20;
    }

    if (invoice.sgst > 0) {
        doc.fillColor('#6b7280')
            .text(`SGST (${invoice.sgst}%):`, labelX, y)
            .fillColor('#374151')
            .text(`${currency}${((invoice.sgst / 100) * (invoice.discountedAmount || invoice.subtotal)).toFixed(2)}`, valueX, y, { align: 'right', width: 65 });
        y += 20;
    }

    if (invoice.igst > 0) {
        doc.fillColor('#6b7280')
            .text(`IGST (${invoice.igst}%):`, labelX, y)
            .fillColor('#374151')
            .text(`${currency}${((invoice.igst / 100) * (invoice.discountedAmount || invoice.subtotal)).toFixed(2)}`, valueX, y, { align: 'right', width: 65 });
        y += 20;
    }

    // Draw line before total
    doc.moveTo(350, y)
        .lineTo(545, y)
        .strokeColor('#e5e7eb')
        .stroke();
    y += 10;

    // Total
    doc.fontSize(11)
        .fillColor('#1f2937')
        .text('Total:', labelX, y)
        .font('Helvetica-Bold')
        .text(`${currency}${invoice.total.toFixed(2)}`, valueX, y, { align: 'right', width: 65 });
    y += 25;

    // Amount in words
    doc.font('Helvetica')
        .fontSize(9)
        .fillColor('#6b7280')
        .text('Amount Chargeable (in words):', 50, y);
    
    doc.fontSize(10)
        .fillColor('#374151')
        .text(numberToWords(invoice.total, currency), 50, y + 15, { width: 500 });
}

function formatDate(date) {
    if (!date) return 'N/A';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
}

function numberToWords(amount, currency) {
    // Simple implementation - you can use a library like 'number-to-words' for better conversion
    const currencyWord = currency === '$' ? 'Dollars' : 'Rupees';
    const rounded = Math.round(amount);
    
    // This is a basic implementation. For production, use 'number-to-words' npm package
    return `${rounded} ${currencyWord} Only`;
}