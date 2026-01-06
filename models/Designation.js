const mongoose = require('mongoose');
const { Schema } = mongoose;

const DesignationSchema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant' },
  name: { type: String, required: true },
  description: { type: String },
  isActive: { type: Boolean, default: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  updateHistory: [{
    attribute: { type: String, required: true },
    oldValue: { type: Schema.Types.Mixed },
    newValue: { type: Schema.Types.Mixed },
    updatedAt: { type: Date, default: Date.now },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
  }]
}, { timestamps: true });

DesignationSchema.index({ tenantId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Designation', DesignationSchema);
