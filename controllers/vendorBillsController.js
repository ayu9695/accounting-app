const VendorBill = require('../models/VendorBill');
const Vendor = require('../models/Vendor');
const logger = require('../utils/logger');

const transformBill = (bill) => ({
  _id: bill._id.toString(),
  vendorId: bill.vendorId?._id?.toString() || bill.vendorId,
  vendorName: bill.vendorName || bill.vendorId?.name,
  billNumber: bill.billNumber,
  billDate: bill.billDate,
  dueDate: bill.dueDate,
  uploadDate: bill.createdAt,
  totalAmount: bill.total || bill.amount,
  amount: bill.amount,
  taxableAmount: bill.amount,
  cgst: bill.cgst,
  sgst: bill.sgst,
  igst: bill.igst || 0,
  tdsAmount: bill.tdsAmount,
  tdsRate: bill.tdsRate,
  payableAmount: bill.payableAmount,
  status: bill.status === 'unpaid' ? 'pending' : bill.status,
  paymentStatus: bill.paymentStatus,
  description: bill.notes || '',
  fileName: bill.attachments?.[0]?.name || bill.fileName || '',
  paymentDate: bill.paymentDate,
  pendingAmount: bill.pendingAmount,
  paymentMethod: bill.paymentMethod?._id?.toString() || bill.paymentMethod,
  paymentMethodName: bill.paymentMethod?.name || null,
  paymentReference: bill.paymentReference,
  attachments: (bill.attachments || []).map((att, index) => ({
    _id: index,
    name: att.name,
    url: att.url,
    type: att.type,
    size: att.size,
    uploadedAt: att.uploadedAt
  }))
});

// GET /api/vendor-bills
exports.getAllVendorBills = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const {
      page = 1,
      limit = 10,
      status,
      vendorId,
      startDate,
      endDate,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = { tenantId, archive: { $ne: true } };

    if (status) query.status = status;
    if (vendorId) query.vendorId = vendorId;

    if (startDate || endDate) {
      query.billDate = {};
      if (startDate) query.billDate.$gte = new Date(startDate);
      if (endDate) query.billDate.$lte = new Date(endDate);
    }

    if (search) {
      query.$or = [
        { billNumber: { $regex: search, $options: 'i' } },
        { vendorName: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ];
    }

    const sortConfig = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [vendorBills, totalCount] = await Promise.all([
      VendorBill.find(query)
        .populate('vendorId', 'name gstin email phone')
        .populate('paymentMethod', 'code name')
        .sort(sortConfig)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      VendorBill.countDocuments(query)
    ]);

    logger.debug('[getAllVendorBills] Returning', { count: vendorBills.length, page, totalCount });

    return res.json({
      success: true,
      vendorBills: vendorBills.map(transformBill),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Error fetching vendor bills:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch vendor bills', error: error.message });
  }
};

// GET /api/vendor-bills/:id
exports.getVendorBillById = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { id } = req.params;

    const vendorBill = await VendorBill.findOne({ _id: id, tenantId })
      .populate('vendorId', 'name gstin email phone address')
      .populate('paymentMethod', 'code name');

    if (!vendorBill) {
      return res.status(404).json({ success: false, message: 'Vendor bill not found' });
    }

    logger.debug('[getVendorBillById] Found bill', { id, billNumber: vendorBill.billNumber });

    return res.json({ success: true, vendorBill: transformBill(vendorBill) });
  } catch (error) {
    logger.error('Error fetching vendor bill:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch vendor bill', error: error.message });
  }
};

// POST /api/vendor-bills
exports.createVendorBill = async (req, res) => {
  try {
    const { tenantId, userId } = req.user;
    const { vendorId, billNumber, billDate, dueDate, amount, tax, tdsRate, cgst, sgst, igst, total, notes, attachments } = req.body;

    const vendor = await Vendor.findOne({ _id: vendorId, tenantId });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    const existingBill = await VendorBill.findOne({ tenantId, billNumber });
    if (existingBill) {
      return res.status(400).json({ success: false, message: 'Bill number already exists' });
    }

    logger.debug('[createVendorBill] Creating bill', { billNumber, amount, tdsRate });

    const vendorBill = new VendorBill({
      tenantId,
      vendorId,
      vendorName: vendor.name,
      billNumber,
      billDate: new Date(billDate),
      dueDate: dueDate ? new Date(dueDate) : null,
      tdsRate: parseFloat(tdsRate) || 0,
      cgst,
      sgst,
      igst,
      amount: parseFloat(amount),
      tax: parseFloat(tax) || 0,
      total: parseFloat(total) || parseFloat(amount),
      notes,
      attachments: attachments || [],
      createdBy: userId
    });

    await vendorBill.save();
    await vendorBill.populate('paymentMethod', 'code name');

    return res.status(201).json({
      success: true,
      message: 'Vendor bill created successfully',
      vendorBill: transformBill(vendorBill)
    });
  } catch (error) {
    logger.error('Error creating vendor bill:', error);
    return res.status(500).json({ success: false, message: 'Failed to create vendor bill', error: error.message });
  }
};

// PUT /api/vendor-bills/:id
exports.updateVendorBill = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const id = req.params.id;
    const updates = req.body;

    logger.debug('[updateVendorBill] Updating bill', { id });

    const vendorBill = await VendorBill.findOne({ _id: id, tenantId })
      .populate('paymentMethod', 'code name');

    if (!vendorBill) {
      return res.status(404).json({ success: false, message: 'Vendor bill not found' });
    }

    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined && updates[key] !== null) {
        vendorBill[key] = updates[key];
      }
    });

    await vendorBill.save();
    await vendorBill.populate('paymentMethod', 'code name');

    return res.json({
      success: true,
      message: 'Vendor bill updated successfully',
      vendorBill: transformBill(vendorBill)
    });
  } catch (error) {
    logger.error('Error updating vendor bill:', error);
    return res.status(500).json({ success: false, message: 'Failed to update vendor bill', error: error.message });
  }
};

// PUT /api/vendor-bills/payment/:id
exports.updateVendorBillPayment = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const id = req.params.id;
    const updates = req.body;

    logger.debug('[updateVendorBillPayment] Recording payment for bill', { id });

    const vendorBill = await VendorBill.findOne({ _id: id, tenantId })
      .populate('paymentMethod', 'code name');

    if (!vendorBill) {
      return res.status(404).json({ success: false, message: 'Vendor bill not found' });
    }

    const paidRaw = updates.paidAmount;
    const paid = paidRaw === undefined || paidRaw === null || paidRaw === '' ? 0 : Number(paidRaw);

    if (Number.isNaN(paid)) {
      return res.status(400).json({ success: false, message: 'Invalid paidAmount' });
    }

    const currentPending = vendorBill.pendingAmount ?? vendorBill.payableAmount;
    const pendingAmount = currentPending - paid;
    const totalAmountPaid = vendorBill.paidAmount + paid;

    if (pendingAmount < 0 || totalAmountPaid > vendorBill.payableAmount) {
      return res.status(400).json({
        success: false,
        message: `Payment exceeds payable amount. Pending: ${currentPending}, Already paid: ${vendorBill.paidAmount}`
      });
    }

    vendorBill.paymentMethod = updates.paymentMethod;
    vendorBill.paidAmount += paid;
    vendorBill.pendingAmount = pendingAmount;
    vendorBill.paymentReference = updates.paymentReference;
    vendorBill.paymentDate = new Date();
    vendorBill.status = 'verified';

    if (vendorBill.pendingAmount === 0 || vendorBill.paidAmount === vendorBill.payableAmount) {
      vendorBill.paymentStatus = 'paid';
    } else if (vendorBill.pendingAmount > 0) {
      vendorBill.paymentStatus = 'partial';
    }

    await vendorBill.save();
    await vendorBill.populate('paymentMethod', 'code name');

    logger.debug('[updateVendorBillPayment] Updated payment', { paidAmount: vendorBill.paidAmount, pendingAmount: vendorBill.pendingAmount });

    return res.json({
      success: true,
      message: 'Vendor bill payment recorded successfully',
      vendorBill: transformBill(vendorBill)
    });
  } catch (error) {
    logger.error('Error updating vendor bill payment:', error);
    return res.status(500).json({ success: false, message: 'Failed to update vendor bill', error: error.message });
  }
};

// DELETE /api/vendor-bills/:id
exports.deleteVendorBill = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const _id = req.params.id;

    logger.debug('[deleteVendorBill] Deleting bill', { _id });

    const vendorBill = await VendorBill.findOne({ _id, tenantId });

    if (!vendorBill) {
      return res.status(404).json({ success: false, message: 'Vendor bill not found' });
    }

    vendorBill.archive = true;
    vendorBill.deletedStatus = true;
    vendorBill.isActive = false;

    vendorBill.updateHistory.push({
      attribute: 'deletedStatus',
      oldValue: false,
      newValue: true,
      updatedAt: new Date(),
      updatedBy: req.user.userId
    });

    await vendorBill.save();

    return res.json({ success: true, message: 'Vendor bill deleted successfully' });
  } catch (error) {
    logger.error('Error deleting vendor bill:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete vendor bill', error: error.message });
  }
};

// POST /api/vendor-bills/:id/upload
exports.uploadAttachment = async (req, res) => {
  try {
    const { tenantId, userId } = req.user;
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No PDF file uploaded' });
    }

    const vendorBill = await VendorBill.findOne({ _id: id, tenantId });

    if (!vendorBill) {
      return res.status(404).json({ success: false, message: 'Vendor bill not found' });
    }

    const attachment = {
      name: req.file.originalname,
      url: `/api/vendor-bills/${id}/download/${vendorBill.attachments.length}`,
      data: req.file.buffer,
      contentType: 'application/pdf',
      type: 'pdf',
      size: req.file.size,
      uploadedAt: new Date(),
      uploadedBy: userId
    };

    vendorBill.attachments.push(attachment);

    if (!vendorBill.fileName) {
      vendorBill.fileName = req.file.originalname;
    }

    await vendorBill.save();
    await vendorBill.populate('paymentMethod', 'code name');

    return res.json({
      success: true,
      message: 'PDF uploaded successfully',
      vendorBill: transformBill(vendorBill)
    });
  } catch (error) {
    logger.error('Error uploading PDF:', error);
    return res.status(500).json({ success: false, message: 'Failed to upload PDF', error: error.message });
  }
};

// GET /api/vendor-bills/:id/download/:attachmentId
exports.downloadAttachment = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { id, attachmentId } = req.params;

    const vendorBill = await VendorBill.findOne({ _id: id, tenantId });

    if (!vendorBill) {
      return res.status(404).json({ success: false, message: 'Vendor bill not found' });
    }

    const attachmentIndex = parseInt(attachmentId);
    if (isNaN(attachmentIndex) || attachmentIndex < 0 || attachmentIndex >= vendorBill.attachments.length) {
      return res.status(404).json({ success: false, message: 'Attachment not found' });
    }

    const attachment = vendorBill.attachments[attachmentIndex];

    if (!attachment || !attachment.data) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    res.setHeader('Content-Type', attachment.contentType || 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${attachment.name}"`);
    res.setHeader('Content-Length', attachment.size);
    return res.send(attachment.data);
  } catch (error) {
    logger.error('Error downloading PDF:', error);
    return res.status(500).json({ success: false, message: 'Failed to download PDF', error: error.message });
  }
};

// DELETE /api/vendor-bills/:id/attachments/:attachmentId
exports.deleteAttachment = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { id, attachmentId } = req.params;

    const vendorBill = await VendorBill.findOne({ _id: id, tenantId });

    if (!vendorBill) {
      return res.status(404).json({ success: false, message: 'Vendor bill not found' });
    }

    const attachmentIndex = parseInt(attachmentId);
    if (isNaN(attachmentIndex) || attachmentIndex < 0 || attachmentIndex >= vendorBill.attachments.length) {
      return res.status(404).json({ success: false, message: 'Attachment not found' });
    }

    const attachment = vendorBill.attachments[attachmentIndex];
    vendorBill.attachments.splice(attachmentIndex, 1);

    if (vendorBill.fileName === attachment.name) {
      vendorBill.fileName = vendorBill.attachments.length > 0 ? vendorBill.attachments[0].name : null;
    }

    await vendorBill.save();

    return res.json({ success: true, message: 'Attachment deleted successfully' });
  } catch (error) {
    logger.error('Error deleting attachment:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete attachment', error: error.message });
  }
};

// GET /api/vendor-bills/summary/stats
exports.getSummaryStats = async (req, res) => {
  try {
    const { tenantId } = req.user;

    const [totalStats, statusStats] = await Promise.all([
      VendorBill.aggregate([
        { $match: { tenantId } },
        { $group: { _id: null, totalAmount: { $sum: '$total' }, totalBills: { $sum: 1 }, avgAmount: { $avg: '$total' } } }
      ]),
      VendorBill.aggregate([
        { $match: { tenantId } },
        { $group: { _id: '$status', count: { $sum: 1 }, amount: { $sum: '$total' } } }
      ])
    ]);

    return res.json({
      success: true,
      summary: {
        totalAmount: totalStats[0]?.totalAmount || 0,
        totalBills: totalStats[0]?.totalBills || 0,
        averageAmount: totalStats[0]?.avgAmount || 0,
        statusBreakdown: statusStats.reduce((acc, stat) => {
          acc[stat._id] = { count: stat.count, amount: stat.amount };
          return acc;
        }, {})
      }
    });
  } catch (error) {
    logger.error('Error fetching vendor bill summary:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch summary', error: error.message });
  }
};
