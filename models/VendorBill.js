const mongoose = require('mongoose');
const { Schema } = mongoose;

const VendorBillSchema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant' },
  vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true },
  department: { type: Schema.Types.ObjectId, ref: 'Department'}, // updated to reference Department
  vendorName: { type: String },
  billNumber: { type: String, required: true },
  billDate: { type: Date, required: true },
  dueDate: { type: Date },
  amount: { type: Number, required: true },
  taxableAmount: { type: Number }, // Amount on which tax is calculated
  cgst: { type: Number, default: 0 },
  sgst: { type: Number, default: 0 },
  igst: { type: Number, default: 0 },
  tax: { type: Number, default: 0 }, // Total tax (cgst + sgst + igst)
  total: { type: Number }, // amount + tax

  tdsRate: { type: Number, default: 0 }, // TDS percentage
  tdsAmount: { type: Number, default: 0 }, // TDS amount
  payableAmount: { type: Number }, // total - tdsAmount
  paymentMethod: { 
    type: String, 
    enum: ['bank_transfer', 'cheque', 'cash', 'upi', 'card', 'other'] 
  },
  paymentReference: { type: String },

    // Verification tracking
  verifiedDate: { type: Date },
  verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  
  status: { type: String, enum: ['pending',, 'unpaid', 'verified', 'paid', 'partial', 'cancelled'], default: 'unpaid' },
    description: { type: String },
  notes: { type: String },
  fileName: { type: String }, // Original uploaded file name
  
  attachments: [
    {
      name: { type: String },
      url: { type: String },
      type: { type: String }, // file type (pdf, jpg, etc.)
      size: { type: Number }, // file size in bytes
      uploadedAt: { type: Date, default: Date.now }
    }
  ],
  // Metadata
  uploadDate: { type: Date, default: Date.now }, // When bill was first uploaded
  isActive: { type: Boolean, default: true },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' }
});

VendorBillSchema.index({ tenantId: 1, billNumber: 1 }, { unique: true });
VendorBillSchema.index({ tenantId: 1, vendorId: 1 });


// Pre-save middleware to calculate derived fields
VendorBillSchema.pre('save', function(next) {
  console.log("presaving");
  // Calculate total tax
  this.tax = ((this.cgst || 0) + (this.sgst || 0) + (this.igst || 0))* this.amount/100;

  this.tdsRate = this.tdsRate || 0;
  console.log("tdsrate while presaving: ", this.tdsRate);
  this.tdsAmount = (this.tdsRate / 100) * this.amount;
  console.log("tdsAMount: ", this.tdsAmount, " total amount: ", this.amount, "total tax: ", this.tax);
  
  // Calculate total amount
  this.total = this.amount + this.tax;
  
  // Calculate payable amount after TDS
  this.payableAmount = this.total - (this.tdsAmount || 0);
    console.log("taxable: ", this.total, " tds: ", this.tdsAmount, " payable: ",this.payableAmount);

  
  // Set taxable amount if not provided
  if (!this.taxableAmount) {
    this.taxableAmount = this.amount;
  }
  
  // Update timestamp
  this.updatedAt = new Date();
  
  next();
});

// Static method to get bills by status
VendorBillSchema.statics.getByStatus = function(tenantId, status) {
  return this.find({ tenantId, status, isActive: true });
};

// Static method to get overdue bills
VendorBillSchema.statics.getOverdueBills = function(tenantId) {
  return this.find({
    tenantId,
    dueDate: { $lt: new Date() },
    status: { $in: ['pending', 'verified'] },
    isActive: true
  });
};

module.exports = mongoose.model('VendorBill', VendorBillSchema);
