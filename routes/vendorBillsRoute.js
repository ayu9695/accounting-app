const express = require('express');
const router = express.Router();
const VendorBill = require('../models/VendorBill');
const Vendor = require('../models/Vendor');
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload');
const { now } = require('mongoose');

// Apply authentication and tenant validation to all routes
router.use(authMiddleware);

// GET /api/vendor-bills - Get all vendor bills with filters
router.get('/vendor-bills', async (req, res) => {
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

    // Build query
    let query = { tenantId };

    query.archive = { $ne: true };
    
    // Add filters
    if (status) {
      query.status = status;
    }
    
    if (vendorId) {
      query.vendorId = vendorId;
    }
    
    // Date range filter
    if (startDate || endDate) {
      query.billDate = {};
      if (startDate) query.billDate.$gte = new Date(startDate);
      if (endDate) query.billDate.$lte = new Date(endDate);
    }
    
    // Search filter
    if (search) {
      query.$or = [
        { billNumber: { $regex: search, $options: 'i' } },
        { vendorName: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ];
    }

    // Sort configuration
    const sortConfig = {};
    sortConfig[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [vendorBills, totalCount] = await Promise.all([
      VendorBill.find(query)
        .populate('vendorId', 'name gstin email phone')
        .populate('paymentMethod', 'code')
        .sort(sortConfig)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      VendorBill.countDocuments(query)
    ]);

    // Transform data to match frontend expectations
    const transformedBills = vendorBills.map(bill => ({
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
      igst: 0,
      tdsAmount: bill.tdsAmount,
      tdsRate: bill.tdsRate,
      payableAmount: bill.payableAmount,
      status: bill.status === 'unpaid' ? 'pending' : bill.status,
      paymentStatus: bill.paymentStatus,
      description: bill.notes || '',
      fileName: bill.attachments?.[0]?.name || '',
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
        // data field excluded - only included when downloading
      }))
    }));

    console.log("returning : ", transformedBills);

    res.json({
      success: true,
      vendorBills: transformedBills,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching vendor bills:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vendor bills',
      error: error.message
    });
  }
});

// GET /api/vendor-bills/:id - Get specific vendor bill
router.get('/vendor-bills/:id', async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { id } = req.params;

    const vendorBill = await VendorBill.findOne({ 
      _id: id, 
      tenantId 
    })
      .populate('vendorId', 'name gstin email phone address')
      .populate('paymentMethod', 'code');

    if (!vendorBill) {
      return res.status(404).json({
        success: false,
        message: 'Vendor bill not found'
      });
    }

    // Transform data
    const transformedBill = {
      _id: vendorBill._id.toString(),
      vendorId: vendorBill.vendorId?._id?.toString() || vendorBill.vendorId,
      vendorName: vendorBill.vendorName || vendorBill.vendorId?.name,
      billNumber: vendorBill.billNumber,
      billDate: vendorBill.billDate,
      dueDate: vendorBill.dueDate,
      uploadDate: vendorBill.createdAt,
      totalAmount: vendorBill.total || vendorBill.amount,
      amount: vendorBill.amount,
      taxableAmount: vendorBill.amount,
      cgst: vendorBill.cgst,
      sgst: vendorBill.sgst,
      igst: 0,
      tdsAmount: vendorBill.tdsAmount,
      tdsRate: vendorBill.tdsRate,
      payableAmount: vendorBill.payableAmount,
      status: vendorBill.status === 'unpaid' ? 'pending' : vendorBill.status,
      paymentStatus: vendorBill.paymentStatus,
      description: vendorBill.notes || '',
      fileName: vendorBill.attachments?.[0]?.name || '',
      paymentDate: vendorBill.paymentDate,
      pendingAmount: vendorBill.pendingAmount,
      paymentMethod: vendorBill.paymentMethod?._id?.toString() || vendorBill.paymentMethod,
      paymentMethodName: vendorBill.paymentMethod?.name || null,
      paymentReference: vendorBill.paymentReference,
      attachments: vendorBill.attachments || []
    };
    console.log ("transformed bill: ", transformedBill);

    res.json({
      success: true,
      vendorBill: transformedBill
    });
  } catch (error) {
    console.error('Error fetching vendor bill:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vendor bill',
      error: error.message
    });
  }
});

// POST /api/vendor-bills - Create new vendor bill
router.post('/vendor-bills', async (req, res) => {
  try {
    const { tenantId, userId } = req.user;
    const {
      vendorId,
      billNumber,
      billDate,
      dueDate,
      amount,
      tax,
      tdsRate,
      cgst,
      sgst,
      igst,
      total,
      notes,
      attachments
    } = req.body;

    // Validate vendor exists
    const vendor = await Vendor.findOne({ _id: vendorId, tenantId });
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Check for duplicate bill number
    const existingBill = await VendorBill.findOne({
      tenantId,
      billNumber
    });

    if (existingBill) {
      return res.status(400).json({
        success: false,
        message: 'Bill number already exists'
      });
    }

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
        console.log("taxable: ", amount, " tds: ", tdsRate);

    await vendorBill.save();
    await vendorBill.populate('paymentMethod', 'code');

    // Transform response
    const transformedBill = {
      _id: vendorBill._id.toString(),
      vendorId: vendorBill.vendorId?._id?.toString() || vendorBill.vendorId,
      vendorName: vendorBill.vendorName || vendorBill.vendorId?.name,
      billNumber: vendorBill.billNumber,
      billDate: vendorBill.billDate,
      dueDate: vendorBill.dueDate,
      uploadDate: vendorBill.createdAt,
      totalAmount: vendorBill.total || vendorBill.amount,
      amount: vendorBill.amount,
      taxableAmount: vendorBill.amount,
      cgst: vendorBill.cgst,
      sgst: vendorBill.sgst,
      igst: 0,
      tdsAmount: vendorBill.tdsAmount,
      tdsRate: vendorBill.tdsRate,
      payableAmount: vendorBill.payableAmount,
      status: vendorBill.status === 'unpaid' ? 'pending' : vendorBill.status,
      paymentStatus: vendorBill.paymentStatus,
      description: vendorBill.notes || '',
      fileName: vendorBill.attachments?.[0]?.name || '',
      paymentDate: vendorBill.paymentDate,
      pendingAmount: vendorBill.pendingAmount,
      paymentMethod: vendorBill.paymentMethod?._id?.toString() || vendorBill.paymentMethod,
      paymentMethodName: vendorBill.paymentMethod?.name || null,
      paymentReference: vendorBill.paymentReference,
      attachments: vendorBill.attachments || []
    };

    res.status(201).json({
      success: true,
      message: 'Vendor bill created successfully',
      vendorBill: transformedBill
    });
  } catch (error) {
    console.error('Error creating vendor bill:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create vendor bill',
      error: error.message
    });
  }
});

// PUT /api/vendor-bills/:id - Update vendor bill
router.put('/vendor-bills/:id', async (req, res) => {
  try {
    const { tenantId, userId } = req.user;
    const id = req.params.id;
    const updates = req.body;
    console.log("id is : ", id);

    const vendorBill = await VendorBill.findOne({ _id: id, tenantId })
      .populate('paymentMethod', 'code name');
    
    if (!vendorBill) {
      return res.status(401).json({
        success: false,
        message: 'Vendor bill not found'
      });
    }

    // Update fields
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined && updates[key] !== null) {
        vendorBill[key] = updates[key];
      }
    });

    vendorBill.updatedAt = new Date();
    await vendorBill.save();
    
    // Re-populate after save to get updated paymentMethod
    await vendorBill.populate('paymentMethod', 'code name');

    // Transform response
    const transformedBill = {
      _id: vendorBill._id.toString(),
      vendorId: vendorBill.vendorId?._id?.toString() || vendorBill.vendorId,
      vendorName: vendorBill.vendorName || vendorBill.vendorId?.name,
      billNumber: vendorBill.billNumber,
      billDate: vendorBill.billDate,
      dueDate: vendorBill.dueDate,
      uploadDate: vendorBill.createdAt,
      totalAmount: vendorBill.total || vendorBill.amount,
      amount: vendorBill.amount,
      taxableAmount: vendorBill.amount,
      cgst: vendorBill.cgst,
      sgst: vendorBill.sgst,
      igst: 0,
      tdsAmount: vendorBill.tdsAmount,
      tdsRate: vendorBill.tdsRate,
      payableAmount: vendorBill.payableAmount,
      status: vendorBill.status === 'unpaid' ? 'pending' : vendorBill.status,
      paymentStatus: vendorBill.paymentStatus,
      description: vendorBill.notes || '',
      fileName: vendorBill.attachments?.[0]?.name || '',
      paymentDate: vendorBill.paymentDate,
      pendingAmount: vendorBill.pendingAmount,
      paymentMethod: vendorBill.paymentMethod,
      paymentReference: vendorBill.paymentReference,
      attachments: vendorBill.attachments || []
    };

    res.json({
      success: true,
      message: 'Vendor bill updated successfully',
      vendorBill: transformedBill
    });
  } catch (error) {
    console.error('Error updating vendor bill:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update vendor bill',
      error: error.message
    });
  }
});

router.put('/vendor-bills/payment/:id', async (req, res) => {
  try {
    const { tenantId, userId } = req.user;
    const id = req.params.id;
    const updates = req.body;
    console.log("id is : ", id);

    const vendorBill = await VendorBill.findOne({ _id: id, tenantId })
      .populate('paymentMethod', 'code');
    
    if (!vendorBill) {
      return res.status(401).json({
        success: false,
        message: 'Vendor bill not found'
      });
    }

    // Update fields
    // Object.keys(updates).forEach(key => {
    //   if (updates[key] !== undefined && updates[key] !== null) {
    //     vendorBill[key] = updates[key];
    //   }
    // });

    // vendorBill.paymentDate = updates.paymentDate;

    const paidRaw = updates.paidAmount;
    const paid = paidRaw === undefined || paidRaw === null || paidRaw === ""
      ? 0
      : Number(paidRaw);

    if (Number.isNaN(paid)) {
      return res.status(401).json({ success: false, message: 'Invalid paidAmount' });
    }

    const pendingAmount = (vendorBill.pendingAmount ? vendorBill.pendingAmount : vendorBill.payableAmount) - paid;
    const totalAmountPaid = vendorBill.paidAmount + paid;
    if(pendingAmount < 0 || totalAmountPaid > vendorBill.payableAmount){
      console.error('Error updating vendor bill payment :', error);
      const message = ('Pending amount : ', vendorBill.pendingAmount, '. You have already paid : ', vendorBill.paidAmount);
      res.status(500).json({
        success: false,
        error: message
      });
    }
    vendorBill.paymentMethod = updates.paymentMethod;
    vendorBill.paidAmount += paid;
    vendorBill.pendingAmount = pendingAmount;
    vendorBill.paymentReference = updates.paymentReference;
    vendorBill.paymentDate = new Date();
    console.log("vendor bill details : ", vendorBill);
    vendorBill.status = "verified";

    if(vendorBill.pendingAmount == 0 || vendorBill.paidAmount == vendorBill.payableAmount){
      vendorBill.paymentStatus = "paid";
    }
    if(vendorBill.pendingAmount>0){
      vendorBill.paymentStatus = "partial";
    }

    vendorBill.updatedAt = new Date();
    await vendorBill.save();
    
    // Re-populate after save to get updated paymentMethod
    await vendorBill.populate('paymentMethod', 'code');

    // Transform response
    const transformedBill = {
      _id: vendorBill._id.toString(),
      vendorId: vendorBill.vendorId?._id?.toString() || vendorBill.vendorId,
      vendorName: vendorBill.vendorName || vendorBill.vendorId?.name,
      billNumber: vendorBill.billNumber,
      billDate: vendorBill.billDate,
      dueDate: vendorBill.dueDate,
      uploadDate: vendorBill.createdAt,
      totalAmount: vendorBill.total || vendorBill.amount,
      amount: vendorBill.amount,
      taxableAmount: vendorBill.amount,
      cgst: vendorBill.cgst,
      sgst: vendorBill.sgst,
      igst: 0,
      tdsAmount: vendorBill.tdsAmount,
      tdsRate: vendorBill.tdsRate,
      payableAmount: vendorBill.payableAmount,
      status: vendorBill.status === 'unpaid' ? 'pending' : vendorBill.status,
      paymentStatus: vendorBill.paymentStatus,
      description: vendorBill.notes || '',
      fileName: vendorBill.attachments?.[0]?.name || '',
      paymentDate: vendorBill.paymentDate,
      pendingAmount: vendorBill.pendingAmount,
      paymentMethod: vendorBill.paymentMethod?._id?.toString() || vendorBill.paymentMethod,
      paymentMethodName: vendorBill.paymentMethod?.name || null,
      paymentReference: vendorBill.paymentReference,
      attachments: vendorBill.attachments || []
    };

    res.json({
      success: true,
      message: 'Vendor bill updated successfully',
      vendorBill: transformedBill
    });
  } catch (error) {
    console.error('Error updating vendor bill:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update vendor bill',
      error: error.message
    });
  }
});

// DELETE /api/vendor-bills/:id - Delete vendor bill
router.delete('/vendor-bills/:id', async (req, res) => {
  try {
    const { tenantId } = req.user;
    const _id  = req.params.id;
    console.log("deleting vendor bill: ", _id);


    const vendorBill = await VendorBill.findOne({ 
      _id: _id, 
      tenantId 
    });
   

    if (!vendorBill) {
      return res.status(404).json({
        success: false,
        message: 'Vendor bill not found'
      });
    }
    
    // Soft-delete: set archive and deletedStatus to true
    vendorBill.archive = true;
    vendorBill.deletedStatus = true;
    vendorBill.isActive = false;
    vendorBill.updatedAt = new Date();

    // Log to updateHistory
    vendorBill.updateHistory.push({
      attribute: 'deletedStatus',
      oldValue: false,
      newValue: true,
      updatedAt: new Date(),
      updatedBy: req.user.userId
    });

    await vendorBill.save();

    res.json({
      success: true,
      message: 'Vendor bill deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting vendor bill:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete vendor bill',
      error: error.message
    });
  }
});

// POST /api/vendor-bills/:id/upload - Upload PDF for vendor bill
router.post('/vendor-bills/:id/upload', upload.single('pdf'), async (req, res) => {
  try {
    const { tenantId, userId } = req.user;
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No PDF file uploaded'
      });
    }

    const vendorBill = await VendorBill.findOne({ _id: id, tenantId });
    
    if (!vendorBill) {
      return res.status(404).json({
        success: false,
        message: 'Vendor bill not found'
      });
    }

    // Create attachment object - store entire PDF in MongoDB
    const attachment = {
      name: req.file.originalname,
      url: `/api/vendor-bills/${id}/download/${vendorBill.attachments.length}`, // URL to download
      data: req.file.buffer, // Store entire PDF as Buffer in MongoDB
      contentType: 'application/pdf',
      type: 'pdf',
      size: req.file.size,
      uploadedAt: new Date(),
      uploadedBy: userId
    };

    // Add to attachments array
    vendorBill.attachments.push(attachment);
    
    // Update fileName if it's the first attachment
    if (!vendorBill.fileName) {
      vendorBill.fileName = req.file.originalname;
    }

    await vendorBill.save();
    await vendorBill.populate('paymentMethod', 'code');

    // Transform response
    const transformedBill = {
      _id: vendorBill._id.toString(),
      vendorId: vendorBill.vendorId?._id?.toString() || vendorBill.vendorId,
      vendorName: vendorBill.vendorName || vendorBill.vendorId?.name,
      billNumber: vendorBill.billNumber,
      billDate: vendorBill.billDate,
      dueDate: vendorBill.dueDate,
      uploadDate: vendorBill.createdAt,
      totalAmount: vendorBill.total || vendorBill.amount,
      amount: vendorBill.amount,
      taxableAmount: vendorBill.amount,
      cgst: vendorBill.cgst,
      sgst: vendorBill.sgst,
      igst: 0,
      tdsAmount: vendorBill.tdsAmount,
      tdsRate: vendorBill.tdsRate,
      payableAmount: vendorBill.payableAmount,
      status: vendorBill.status === 'unpaid' ? 'pending' : vendorBill.status,
      paymentStatus: vendorBill.paymentStatus,
      description: vendorBill.notes || '',
      fileName: vendorBill.fileName,
      paymentDate: vendorBill.paymentDate,
      pendingAmount: vendorBill.pendingAmount,
      paymentMethod: vendorBill.paymentMethod?._id?.toString() || vendorBill.paymentMethod,
      paymentMethodName: vendorBill.paymentMethod?.name || null,
      paymentReference: vendorBill.paymentReference,
      attachments: vendorBill.attachments.map((att, index) => ({
        _id: index,
        name: att.name,
        url: att.url,
        type: att.type,
        size: att.size,
        uploadedAt: att.uploadedAt
      }))
    };

    res.json({
      success: true,
      message: 'PDF uploaded successfully',
      vendorBill: transformedBill
    });
  } catch (error) {
    console.error('Error uploading PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload PDF',
      error: error.message
    });
  }
});

// GET /api/vendor-bills/:id/download/:attachmentId - Download PDF
router.get('/vendor-bills/:id/download/:attachmentId', async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { id, attachmentId } = req.params;

    // Query vendor bill - data field will be included automatically
    const vendorBill = await VendorBill.findOne({ _id: id, tenantId });
    
    if (!vendorBill) {
      return res.status(404).json({
        success: false,
        message: 'Vendor bill not found'
      });
    }

    const attachmentIndex = parseInt(attachmentId);
    if (isNaN(attachmentIndex) || attachmentIndex < 0 || attachmentIndex >= vendorBill.attachments.length) {
      return res.status(404).json({
        success: false,
        message: 'Attachment not found'
      });
    }

    const attachment = vendorBill.attachments[attachmentIndex];
    
    if (!attachment || !attachment.data) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Send PDF directly from MongoDB
    res.setHeader('Content-Type', attachment.contentType || 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${attachment.name}"`);
    res.setHeader('Content-Length', attachment.size);
    res.send(attachment.data);
  } catch (error) {
    console.error('Error downloading PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download PDF',
      error: error.message
    });
  }
});

// DELETE /api/vendor-bills/:id/attachments/:attachmentId - Delete attachment
router.delete('/vendor-bills/:id/attachments/:attachmentId', async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { id, attachmentId } = req.params;

    const vendorBill = await VendorBill.findOne({ _id: id, tenantId });
    
    if (!vendorBill) {
      return res.status(404).json({
        success: false,
        message: 'Vendor bill not found'
      });
    }

    const attachmentIndex = parseInt(attachmentId);
    if (isNaN(attachmentIndex) || attachmentIndex < 0 || attachmentIndex >= vendorBill.attachments.length) {
      return res.status(404).json({
        success: false,
        message: 'Attachment not found'
      });
    }

    const attachment = vendorBill.attachments[attachmentIndex];
    
    // Remove from attachments array
    // PDF data will be automatically removed when document is saved
    vendorBill.attachments.splice(attachmentIndex, 1);
    
    // Update fileName if it was the deleted attachment
    if (vendorBill.fileName === attachment.name && vendorBill.attachments.length > 0) {
      vendorBill.fileName = vendorBill.attachments[0].name;
    } else if (vendorBill.attachments.length === 0) {
      vendorBill.fileName = null;
    }

    await vendorBill.save();

    res.json({
      success: true,
      message: 'Attachment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting attachment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete attachment',
      error: error.message
    });
  }
});

// GET /api/vendor-bills/summary/stats - Get summary statistics
router.get('/vendor-bills/summary/stats', async (req, res) => {
  try {
    const { tenantId } = req.user;

    const [totalStats, statusStats] = await Promise.all([
      VendorBill.aggregate([
        { $match: { tenantId: tenantId } },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$total' },
            totalBills: { $sum: 1 },
            avgAmount: { $avg: '$total' }
          }
        }
      ]),
      VendorBill.aggregate([
        { $match: { tenantId: tenantId } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            amount: { $sum: '$total' }
          }
        }
      ])
    ]);

    const summary = {
      totalAmount: totalStats[0]?.totalAmount || 0,
      totalBills: totalStats[0]?.totalBills || 0,
      averageAmount: totalStats[0]?.avgAmount || 0,
      statusBreakdown: statusStats.reduce((acc, stat) => {
        acc[stat._id] = {
          count: stat.count,
          amount: stat.amount
        };
        return acc;
      }, {})
    };

    res.json({
      success: true,
      summary
    });
  } catch (error) {
    console.error('Error fetching summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch summary',
      error: error.message
    });
  }
});

module.exports = router;