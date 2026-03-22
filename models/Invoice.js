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
        id: { type: String },
        service: {type: String},
        description: {type: String},
        rate: {type:Number},
        amount: {type:Number},
        resourceName: {type: String},
        periodFrom: {type: Date},
        periodTo: {type: Date},
        rateType: {type: String, enum: ['monthly', 'hourly']},
        lop: {type: Number}, //loss of pay days
        extraDays: {type: Number},
        numberOfHours: {type: Number}
    }],
    subtotal: {type:Number},
    discount: {type:Number}, //percentage
    discountAmount : {type: Number, default:0},
    discountedAmount : {type: Number, default:0},
    cgst: {type:Number},
    sgst: {type:Number},
    igst: {type:Number},
    taxAmount: {type:Number},
    tdsDeducted: {type: Number, default:0},
    tdsTotal: {type: Number, default:0},
    payableAmount: {type: Number, default:0},
    total: {type:Number},
    status: {type:String, enum: ['paid', 'unpaid', 'partial', 'overdue'], default: 'unpaid'},
    paidAmount: { type: Number, default: 0 },
    remainingAmount: { type: Number, default: this.tdsTotal },
    notes: {type: String},
    isActive: { type: Boolean, default: true },
    archive: { type: Boolean, default: false },
    deletedStatus: { type: Boolean, default: false },
    paymentHistory: [{
        amount: { type: Number, required: true },
        paymentDate: { type: Date, required: true },
        paymentMethod: { type: Schema.Types.ObjectId, ref: 'PaymentMethod' },
        reference: { type: String },
        notes: { type: String },
        recordedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        recordedAt: { type: Date, default: Date.now }
    }],
    bankAccountDetails: {
        accountName: { type: String },
        accountNumber: { type: String },
        bankName: { type: String },
        ifscCode: { type: String },
        branch: { type: String }
    },
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
    // Check if we need to recalculate tax/subtotal (new document or relevant fields modified)
    const isNew = this.isNew;
    const subtotalChanged = this.isModified('subtotal');
    const taxFieldsChanged = this.isModified('cgst') || 
        this.isModified('sgst') || 
        this.isModified('igst') || 
        this.isModified('discount');

    // Calculate tax and total amounts
    const tax = ((this.cgst || 0) + (this.sgst || 0) + (this.igst || 0));
    this.discountAmount = (this.discount || 0) * this.subtotal / 100;
    
    if(this.discountAmount > 0){
        this.discountedAmount = this.subtotal - this.discountAmount;
        this.taxAmount = (tax * this.discountedAmount) / 100;
        this.total = this.taxAmount + this.discountedAmount;
    } else {
        this.taxAmount = (tax * this.subtotal) / 100;
        this.total = this.taxAmount + this.subtotal;
    }

    // Calculate TDS Total if needed
    // Only calculate when invoice is created or when tax/subtotal/tdsDeducted is updated
    const tdsDeductedChanged = this.isModified('tdsDeducted');
    const shouldCalculateTds = isNew || taxFieldsChanged || tdsDeductedChanged;
    
    if (shouldCalculateTds) {
        // Check if tdsTotal is already set, if not check if tdsDeducted exists
            console.log("tdsTotal is not set. Checking tdsDeducted to calculate tdsTotal...");
            // tdsTotal not set - check if tdsDeducted exists and calculate
            if (this.tdsDeducted != null && this.tdsDeducted !== undefined && this.tdsDeducted !== 0) {
                this.tdsTotal = ((this.subtotal || 0) * this.tdsDeducted) / 100;
                console.log("Calculated tdsTotal based on tdsDeducted:", this.tdsTotal);
            }
    }

    if (isNew) {
        this.payableAmount = this.total - this.tdsTotal;
    } else if (tdsDeductedChanged) {
        this.payableAmount = this.total - this.tdsTotal;
        this.remainingAmount = this.payableAmount - this.paidAmount;
    }

    console.log("=== Invoice Pre-Save ===");
    console.log("subtotal:", this.subtotal);
    console.log("discount:", this.discount, "| discountAmount:", this.discountAmount, "| discountedAmount:", this.discountedAmount);
    console.log("cgst:", this.cgst, "| sgst:", this.sgst, "| igst:", this.igst, "| taxAmount:", this.taxAmount);
    console.log("total:", this.total);
    console.log("tdsDeducted:", this.tdsDeducted, "| tdsTotal:", this.tdsTotal);
    console.log("payableAmount:", this.payableAmount);
    console.log("paidAmount:", this.paidAmount);
    console.log("tdstotalValue:", this.tdsTotal);
    console.log("=======================");
    // Calculate remainingAmount
    // Initially (new invoice): remainingAmount = total - tdsTotal
    // For updates: if empty, calculate as total - tdsTotal, then remainingAmount = tdsTotal - paidAmount
    // Initially or if empty: remainingAmount = total - tdsTotal
    if (isNew || this.remainingAmount == null || this.remainingAmount === undefined) {
        this.remainingAmount = this.total - this.tdsTotal;
    }

    next();
});

module.exports = mongoose.model('Invoice', InvoiceSchema);


