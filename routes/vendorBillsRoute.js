const express = require('express');
const router = express.Router();
const VendorBill = require('../models/VendorBill');
const Vendor = require('../models/Vendor');
const authMiddleware = require('../middleware/auth');

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
      taxableAmount: bill.amount,
      cgst: bill.tax / 2 || 0,
      sgst: bill.tax / 2 || 0,
      igst: 0,
      tdsAmount: bill.tdsAmount,
      tdsRate: bill.tdsRate,
      payableAmount: bill.payableAmount,
      status: bill.status === 'unpaid' ? 'pending' : bill.status,
      description: bill.notes || '',
      fileName: bill.attachments?.[0]?.name || '',
      paymentDate: bill.status === 'paid' ? bill.updatedAt : null,
      paymentMethod: null,
      paymentReference: null,
      attachments: bill.attachments || []
    }));

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
    }).populate('vendorId', 'name gstin email phone address');

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
      taxableAmount: vendorBill.amount,
      cgst: vendorBill.tax / 2 || 0,
      sgst: vendorBill.tax / 2 || 0,
      igst: 0,
      tdsRate: 0,
      tdsAmount: 0,
      payableAmount: vendorBill.total || vendorBill.amount,
      status: vendorBill.status === 'unpaid' ? 'pending' : vendorBill.status,
      description: vendorBill.notes || '',
      fileName: vendorBill.attachments?.[0]?.name || '',
      paymentDate: vendorBill.status === 'paid' ? vendorBill.updatedAt : null,
      paymentMethod: null,
      paymentReference: null,
      attachments: vendorBill.attachments || [],
      vendor: vendorBill.vendorId
    };

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

    // Transform response
    const transformedBill = {
      _id: vendorBill._id.toString(),
      vendorId: vendorBill.vendorId.toString(),
      vendorName: vendorBill.vendorName,
      billNumber: vendorBill.billNumber,
      billDate: vendorBill.billDate,
      dueDate: vendorBill.dueDate,
      uploadDate: vendorBill.createdAt,
      totalAmount: vendorBill.total,
      taxableAmount: vendorBill.amount,
      cgst: vendorBill.tax / 2,
      sgst: vendorBill.tax / 2,
      igst: 0,
      tdsRate: 0,
      tdsAmount: 0,
      payableAmount: vendorBill.total,
      status: 'pending',
      description: vendorBill.notes || '',
      fileName: vendorBill.attachments?.[0]?.name || '',
      attachments: vendorBill.attachments
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
    const { _id } = req.params;
    const updates = req.body;

    const vendorBill = await VendorBill.findOne({ _id: _id, tenantId });
    
    if (!vendorBill) {
      return res.status(404).json({
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

    // Transform response
    const transformedBill = {
      _id: vendorBill._id.toString(),
      vendorId: vendorBill.vendorId.toString(),
      vendorName: vendorBill.vendorName,
      billNumber: vendorBill.billNumber,
      billDate: vendorBill.billDate,
      dueDate: vendorBill.dueDate,
      uploadDate: vendorBill.createdAt,
      totalAmount: vendorBill.amount,
      taxableAmount: vendorBill.total,
      cgst: vendorBill.tax,
      sgst: vendorBill.tax,
      igst: vendorBill.igst,
      tdsRate: vendorBill.tdsRate,
      tdsAmount: vendorBill.tdsAmount,
      payableAmount: vendorBill.total,
      status: vendorBill.status === 'unpaid' ? 'pending' : vendorBill.status,
      description: vendorBill.notes || '',
      fileName: vendorBill.attachments?.[0]?.name || '',
      attachments: vendorBill.attachments
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
    const { _id } = req.params;

    const vendorBill = await VendorBill.findOneAndDelete({ 
      _id: _id, 
      tenantId 
    });

    if (!vendorBill) {
      return res.status(404).json({
        success: false,
        message: 'Vendor bill not found'
      });
    }

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