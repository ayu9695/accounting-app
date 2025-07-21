const mongoose = require('mongoose');
const { Schema } = mongoose;

const VendorBillSchema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant' },
  vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true },
  vendorName: { type: String },
  billNumber: { type: String, required: true },
  billDate: { type: Date, required: true },
  dueDate: { type: Date },
  amount: { type: Number, required: true },
  tax: { type: Number },
  total: { type: Number },
  status: { type: String, enum: ['unpaid', 'partial', 'paid'], default: 'unpaid' },
  notes: { type: String },
  attachments: [
    {
      name: { type: String },
      url: { type: String },
      uploadedAt: { type: Date, default: Date.now }
    }
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' }
});

VendorBillSchema.index({ tenantId: 1, billNumber: 1 }, { unique: true });
VendorBillSchema.index({ tenantId: 1, vendorId: 1 });


module.exports = mongoose.model('VendorBill', VendorBillSchema);
