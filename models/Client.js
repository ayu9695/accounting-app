const mongoose = require('mongoose');
const { Schema } = mongoose;

const ClientSchema = new mongoose.Schema({
  tenantId: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant' },
  name: { type: String, required: true },
  department: { type: Schema.Types.ObjectId, ref: 'Department'}, // updated to reference Department
  gstin: { type: String },
  website: { type: String },
  industry: { type: String },
  state: { type: String },
  city: { type: String },
  pincode: { type: String },
  email: { type: String, required: true },
  phone: { type: String },
  extension: { type: String, default: '+91' },
  pannumber: { type: String },
  address: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  rating: { type: Number, default: 5 },
  overdues: { type: Number, default: 0 },
  contactPerson: [{
    name: { type: String, required: true },
    email: { type: String, required: true},
    phone: { type: String, required: false },
    extension: {type: String, required: false },
    status: {type: Boolean, required: false, default:true },
    position: {type: String, required: false },
  }],
  notes: {type: String},
  isActive: {type: Boolean, default: true},
  country: {type: String, default:"India" },
  createdBy: {type: Schema.Types.ObjectId, ref: 'User'},
  updateHistory: [{
  attribute: { type: String, required: true },
  oldValue: { type: Schema.Types.Mixed },   // can store any type (string, number, object, etc.)
  newValue: { type: Schema.Types.Mixed },
  updatedAt: { type: Date, default: Date.now }, // when this change was made
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' } // optional: who made the change
}]
});
ClientSchema.index({ tenantId: 1, email: 1 }, { unique: true });
ClientSchema.index({ tenantId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Client', ClientSchema);