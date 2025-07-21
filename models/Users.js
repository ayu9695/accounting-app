const mongoose = require('mongoose');
const { Schema } = mongoose;
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
    tenantId: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant' },
    email: { type: String, unique: true, required: true },
    name: { type: String, required: true},
    code: { type: Number, unique: true},
    role: { type: String, enum: ['superadmin', 'admin', "team_member"], required: true},
    avatar:{type: String},
    phone:{type: String},
    isActive:{type: Boolean}, 
    status:{type: String, enum: ['active', 'deactivated', 'permanently_deleted'], default: 'active'},
    address: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    country: {type: String, default:"India" },
    password: { type: String, required: true, select: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updateHistory: [{
  attribute: { type: String, required: true },
  oldValue: { type: Schema.Types.Mixed },   // can store any type (string, number, object, etc.)
  newValue: { type: Schema.Types.Mixed },
  updatedAt: { type: Date, default: Date.now }, // when this change was made
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' } // optional: who made the change
}]
});
//Add language & timezone

// Pre-save hook for hashing password
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (err) {
    return next(err);
  }
});

UserSchema.index({ tenantId: 1, email: 1 }, { unique: true });
UserSchema.index({ tenantId: 1, code: 1 }, { unique: true, sparse: true });
UserSchema.index({ tenantId: 1, role: 1 });

module.exports = mongoose.model('User', UserSchema);