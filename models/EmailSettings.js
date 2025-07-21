const mongoose = require('mongoose');
const { Schema } = mongoose;

const EmailSchema = new Schema({
    tenantId: { type: Schema.Types.ObjectId, required: true, unique: true, ref: 'Tenant' },
    smtpServer: {type: Number},
    smtpPort: {type:Number},
    smtpUsername: {type: String},
    smtpPassword: {type: String},
    emailNotifications: {type: Boolean, default: false},
    invoicePaymentReminders: {type: Boolean, default: false},
    paymentreceipts: {type: Boolean, default: false},

});


SettingsSchema.index({ tenantId: 1 });

module.exports = mongoose.model('Settings', SettingsSchema);