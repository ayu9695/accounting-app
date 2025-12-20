const mongoose = require('mongoose');
const { Schema } = mongoose;

const DefaultWorkingDaysSchema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant' },
  // Structure: { "2025": { "January": 23, "February": 20, ... }, "2026": { ... } }
  // Using Schema.Types.Mixed to store nested object structure
  yearData: {
    type: Schema.Types.Mixed,
    default: {}
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

DefaultWorkingDaysSchema.index({ tenantId: 1 }, { unique: true });

module.exports = mongoose.model('DefaultWorkingDays', DefaultWorkingDaysSchema);

