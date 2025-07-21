const mongoose = require('mongoose');
const { Schema } = mongoose;

const SettingsSchema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, required: true, unique: true, ref: 'Tenant' },
  domain: { type: String, required: true, unique: true },
  tenantNumber: {type: Number, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  gstNumber: { type: String, required: true },
  fiscalYearStart: { type: Date },
  fiscalYearEnd: { type: Date },
  currency: { type: String, default: 'INR' },
  gstEnabled: { type: Boolean, default: false },
  defaultTaxRates: {
    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    igst: { type: Number, default: 0 }
  },
  phone: { type: String },
  address: { type: String },
  invoicePrefix: { type: String },
  expenseCategories: [String],
  paymentMethods: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  updateHistory: [{
  attribute: { type: String, required: true },
  oldValue: { type: Schema.Types.Mixed },   // can store any type (string, number, object, etc.)
  newValue: { type: Schema.Types.Mixed },
  updatedAt: { type: Date, default: Date.now }, // when this change was made
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' } // optional: who made the change
}]
});

SettingsSchema.index({ tenantId: 1 });

module.exports = mongoose.model('Settings', SettingsSchema);