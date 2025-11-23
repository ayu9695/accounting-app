const mongoose = require('mongoose');
const { Schema } = mongoose;

const InvoiceSchema = new mongoose.Schema({
    tenantId: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant' },
    invoiceNumber: {type: String, unique:true, required:true},
    clientId: {type: Schema.Types.ObjectId, required: true, ref: 'Client'},
    clientName: { type: String, required: true },
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
    discountAmount : {type: Number, default:0},
    discountedAmount : {type: Number, default:0},
    cgst: {type:Number},
    sgst: {type:Number},
    igst: {type:Number},
    taxAmount: {type:Number},
    total: {type:Number},
    status: {type:String, enum: ['paid', 'unpaid', 'partial', 'overdue'], default: 'unpaid'},
    paidAmount: { type: Number, default: 0 },
    remainingAmount: { type: Number, default: this.total },
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

InvoiceSchema.pre('save', function(next) {
    const tax = ((this.cgst || 0) + (this.sgst || 0) + (this.igst || 0));
    this.discountAmount = (this.discount || 0)* this.subtotal /100;
    if(this.discountAmount > 0){
        this.discountedAmount = this.subtotal-this.discountAmount;
        this.taxAmount = (tax * this.discountedAmount) /100;
        this.total = this.taxAmount + this.discountedAmount;
    } else {
        this.taxAmount = (tax * this.subtotal) /100;
        this.total = this.taxAmount + this.subtotal;
    }
    console.log("saved invoice tax");
      next();
});

module.exports = mongoose.model('Invoice', InvoiceSchema);

