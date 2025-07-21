const mongoose = require('mongoose');
const { Schema } = mongoose;

const SalaryRecordSchema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant' },
  employeeId: { type: Schema.Types.ObjectId, required: true, ref: 'Employee' },
  employeeName: { type: String },
  month: { type: String, required: true },
  year: { type: Number, required: true },
  baseSalary: { type: Number, required: true },
  allowances: { type: Number },
  deductions: { type: Number },
  leaveDays: { type: Number, default: 0 },
  workingDays: { type: Number, required: true },
  grossSalary: { type: Number },
  netSalary: { type: Number },
  status: {
    type: String,
    enum: ['pending', 'processed', 'paid'],
    default: 'pending'
  },
  paymentDate: { type: Date },
  paymentMethod: { type: String },
  paymentReference: { type: String },
  processedAt: { type: Date },
  processedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  paidAt: { type: Date },
  paidBy: { type: Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  updateHistory: [{
  attribute: { type: String, required: true },
  oldValue: { type: Schema.Types.Mixed },   // can store any type (string, number, object, etc.)
  newValue: { type: Schema.Types.Mixed },
  updatedAt: { type: Date, default: Date.now }, // when this change was made
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' } // optional: who made the change
}]
}, { timestamps: true });

SalaryRecordSchema.index({ tenantId: 1, employeeId: 1, month: 1, year: 1 }, { unique: true });
SalaryRecordSchema.index({ tenantId: 1, status: 1 });
SalaryRecordSchema.index({ tenantId: 1, month: 1, year: 1 });

module.exports = mongoose.model('SalaryRecord', SalaryRecordSchema);