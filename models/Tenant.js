// models/tenant.model.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const tenantSchema = new mongoose.Schema({
  name: { type: String, required: true }, // company/org name
  id: {type: Number, required: true },
  email: { type: String, required: true },
  subdomain: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  updateHistory: [{
  attribute: { type: String, required: true },
  oldValue: { type: Schema.Types.Mixed },   // can store any type (string, number, object, etc.)
  newValue: { type: Schema.Types.Mixed },
  updatedAt: { type: Date, default: Date.now }, // when this change was made
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' } // optional: who made the change
}]
});

tenantSchema.index({ id: 1 }, { unique: true });           // For finding by auto-incremented ID
tenantSchema.index({ email: 1 }, { unique: true });        // For fast lookup by email
tenantSchema.index({ subdomain: 1 }, { unique: true });    // For routing/tenant resolution


module.exports = mongoose.model('Tenant', tenantSchema);
