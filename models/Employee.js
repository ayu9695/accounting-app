const mongoose = require('mongoose');
const { Schema } = mongoose;

const EmployeeSchema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant' },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  department: { type: Schema.Types.ObjectId, ref: 'Department', required: true }, // updated to reference Department
  designation: { type: Schema.Types.ObjectId, ref: 'Designation', required: true },
  baseSalary: { type: Number, required: true, min: 0 },
  allowances: [
    {
      name: { type: String, required: true },
      amount: { type: Number, required: true },
      type: { type: String, enum: ['fixed', 'percentage'] }
    }
  ],
  deductions: [
    {
      name: { type: String, required: true },
      amount: { type: Number, required: true },
      type: { type: String, enum: ['fixed', 'percentage'] }
    }
  ],
  joinDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  bankDetails: {
    accountNumber: { type: String },
    ifscCode: { type: String },
    bankName: { type: String }
  },
  documents: [
    {
      type: { type: String },
      url: { type: String },
      uploadedAt: { type: Date }
    }
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  updateHistory: [{
  attribute: { type: String, required: true },
  oldValue: { type: Schema.Types.Mixed },   // can store any type (string, number, object, etc.)
  newValue: { type: Schema.Types.Mixed },
  updatedAt: { type: Date, default: Date.now }, // when this change was made
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' } // optional: who made the change
}]
}, { timestamps: true });

EmployeeSchema.index({ tenantId: 1, email: 1 }, { unique: true });
EmployeeSchema.index({ department: 1 });
EmployeeSchema.index({ isActive: 1 });

module.exports = mongoose.model('Employee', EmployeeSchema);