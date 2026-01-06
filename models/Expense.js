const mongoose = require('mongoose');
const { Schema } = mongoose;

const ExpenseSchema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant' },
  category: { 
    type: String, 
    required: true, 
    enum: [
      'Rent', 'Software', 'Supplies', 'Utilities', 'Marketing',
      'Travel', 'Equipment', 'Insurance', 'Legal', 'Other'
    ]
  },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, default: "INR"},
  paymentMethod: { type: Schema.Types.ObjectId, ref: 'PaymentMethod' },
  paymentStatus:{type: Boolean, default:false},
  paymentReference: {type: String},
  paymentDate: {type: Date},
  paymentNotes: {type: String},
  approvalStatus:{type: Boolean, default:true},
  expenseDate: { type: Date, required: true },
  description: { type: String },
  receiptUrl: { type: String },
  isActive: { type: Boolean, default: true },
  archive: { type: Boolean, default: false },
  deletedStatus: { type: Boolean, default: false },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  updateHistory: [{
    attribute: { type: String, required: true },
    oldValue: { type: Schema.Types.Mixed },
    newValue: { type: Schema.Types.Mixed },
    updatedAt: { type: Date, default: Date.now },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
  }],
}, { timestamps: true });

ExpenseSchema.index({ tenantId: 1, category: 1 });
ExpenseSchema.index({ tenantId: 1, expenseDate: 1 });


module.exports = mongoose.model('Expense', ExpenseSchema);