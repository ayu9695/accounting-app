const mongoose = require('mongoose');
const { Schema } = mongoose;

const financialSummarySchema = new Schema({
  tenantId: {
    type: Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  month: {
    type: String, // Format: 'YYYY-MM'
    required: true
  },
  year: {
    type: Number,
    required: true
  },

  // Revenue & Invoice
  totalInvoicedAmount: {
    type: Number,
    default: 0
  },
  amountCollected: {
    type: Number,
    default: 0
  },
  outstandingAmount: {
    type: Number,
    default: 0
  },

  // Vendor Bills & TDS
  totalVendorBillAmount: {
    type: Number,
    default: 0
  },
  amountPayable: {
    type: Number,
    default: 0
  },
  tdsCollected: {
    type: Number,
    default: 0
  },
  tdsPaid: {
    type: Number,
    default: 0
  },
  pendingVendorAmount: {
    type: Number,
    default: 0
  },

  // Tax Summary
  gstOutput: {
    type: Number,
    default: 0
  },
  gstInput: {
    type: Number,
    default: 0
  },
  gstNetPayable: {
    type: Number,
    default: 0
  },

  // Summary
  totalRevenue: {
    type: Number,
    default: 0
  },
  totalExpenses: {
    type: Number,
    default: 0
  },
  netProfit: {
    type: Number,
    default: 0
  },

  // Invoice Status Counts
  invoiceStatusCount: {
    paid: { type: Number, default: 0 },
    unpaid: { type: Number, default: 0 },
    partial: { type: Number, default: 0 },
    overdue: { type: Number, default: 0 }
  },

  // Metadata
  lastCalculatedAt: {
    type: Date,
    default: Date.now
  },
  calculatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'users'
  }
}, {
  timestamps: true
});

// Unique index per tenant per month
financialSummarySchema.index({ tenantId: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('FinancialSummary', financialSummarySchema);
