const mongoose = require('mongoose');
const { Schema } = mongoose;

const InvoiceSchema = new mongoose.Schema({
    tenantId: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant' },
    invoiceNumber: {type: String, unique:true, required:true},
    clientId: {type: Schema.Types.ObjectId, required: true, ref: 'Client'},
    clientName: { type: String, required: true },
    department: { type: Schema.Types.ObjectId, ref: 'Department'}, // updated to reference Department
    issueDate:{ type: Date},
    dueDate: {type: Date},
    hsnCode: {type: String},
    currency: {type: String},
    lineItems: [{
        service: {type: String},
        description: {type: String},
        quantity: {type:Number},
        rate: {type:Number},
        amount: {type:Number},
    }],
    subtotal: {type:Number},
    discount: {type:Number}, //percentage
    cgst: {type:Number},
    sgst: {type:Number},
    igst: {type:Number},
    taxAmount: {type:Number},
    total: {type:Number},
    status: {type:String, enum: ['paid', 'unpaid', 'partial', 'overdue'], default: 'unpaid'},
    notes: {type: String},
    paymentHistory: [{
        amount: { type: Number, required: true },
        paymentDate: { type: Date, required: true },
        paymentMethod: { type: String },
        reference: { type: String },
        notes: { type: String },
        recordedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        recordedAt: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    createdBy: {type: Schema.Types.ObjectId, ref: 'User'},
    updateHistory: [{
    attribute: { type: String, required: true },
    oldValue: { type: Schema.Types.Mixed },   // can store any type (string, number, object, etc.)
    newValue: { type: Schema.Types.Mixed },
    updatedAt: { type: Date, default: Date.now }, // when this change was made
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' } // optional: who made the change
    }]
})

InvoiceSchema.index({ tenantId: 1, invoiceNumber: 1 }, { unique: true });
InvoiceSchema.index({ tenantId: 1, clientName: 1 });


module.exports = mongoose.model('Invoice', InvoiceSchema);

