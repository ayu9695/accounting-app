const Invoice = require('../models/Invoice');

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

    const existingInvoice = await Invoice.findOne({ tenantId, invoiceNumber: newInvoiceData.invoiceNumber });
    if (existingInvoice) {
      return res.status(400).json({ error: 'Invoice with this number already exists in this tenant' });
    }

    const newInvoice = new Invoice(newInvoiceData);
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
