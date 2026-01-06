
const Settings = require('../models/Settings');
const mongoose = require('mongoose');
const { Types } = mongoose;

// list of fields allowed to be changed through the settings update endpoint
const ALLOWED_UPDATE_FIELDS = [
  'domain','tenantNumber','name','email','gstNumber','fiscalYearStart','fiscalYearEnd',
  'currency','gstEnabled','defaultTaxRates','defaultTdsRate','phone','address',
  'invoicePrefix','expenseCategories','paymentMethod','bankAccountDetails'
];

// helper: shallow or JSON-serialized deep compare; returns true if different
function valuesDifferent(a, b) {
  // treat undefined vs null vs '' as differences — modify if you want other behavior
  try {
    return JSON.stringify(a) !== JSON.stringify(b);
  } catch (e) {
    // fallback
    return String(a) !== String(b);
  }
}

// build change entries for updateHistory
function buildHistoryEntries(existingDoc, newFields, updatedById) {
  const entries = [];
  for (const key of Object.keys(newFields)) {
    if (!ALLOWED_UPDATE_FIELDS.includes(key)) continue;

    const oldVal = existingDoc ? existingDoc[key] : undefined;
    const newVal = newFields[key];

    if (valuesDifferent(oldVal, newVal)) {
      entries.push({
        attribute: key,
        oldValue: oldVal === undefined ? null : oldVal,
        newValue: newVal,
        updatedAt: new Date(),
        updatedBy: updatedById ? Types.ObjectId(updatedById) : null
      });
    }
  }
  return entries;
}

exports.getSettings = async (req, res) => {
  try {
    const tenantId = req.user.tenantId; // Set by your authMiddleware ✅

        if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID missing in token' });
    }

    // Fetch settings for the authenticated tenant
    const settings = await Settings.findOne({ tenantId });

    if (!settings) {
      return res.status(404).json({ error: 'Settings not found for this tenant' });
    }

    return res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Server error fetching settings' });
  }
};

exports.createSettings = async function createSettings(req, res) {
  const session = await mongoose.startSession();
  try {
    const payload = req.body;
    const tenantId = payload.tenantId || req.params.tenantId || req.user?.tenantId;
    const createdBy = req.user?.id || null;

    if (!tenantId) return res.status(400).json({ error: 'tenantId required' });

    // ensure only allowed fields are passed (helpful)
    const docData = { tenantId: Types.ObjectId(tenantId), createdAt: new Date(), updatedAt: new Date() };
    for (const key of ALLOWED_UPDATE_FIELDS.concat(['invoicePrefix','expenseCategories','paymentMethod'])) {
      if (payload[key] !== undefined) docData[key] = payload[key];
    }
    // include other required fields from schema if provided
    ['domain','name','email','gstNumber','tenantNumber'].forEach(k => {
      if (payload[k] !== undefined) docData[k] = payload[k];
    });
    if (createdBy) docData.updatedBy = Types.ObjectId(createdBy);

    // Use session to be explicit (not strictly necessary for a single insert)
    session.startTransaction();
    const settings = new Settings(docData);
    await settings.save({ session });
    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({ data: settings });
  } catch (err) {
    // duplicate key (unique tenantId or unique domain)
    if (err && err.code === 11000) {
      return res.status(409).json({ error: 'Settings already exist for this tenant or domain already used', details: err.keyValue });
    }
    // validation or other error
    console.error('createSettings error', err);
    try { await session.abortTransaction(); session.endSession(); } catch(e){/* ignore */ }
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

/**
 * POST /api/settings/onboard
 * Special endpoint for creating initial settings for a new tenant
 * NO AUTH REQUIRED - This is used during tenant onboarding
 * 
 * Body: {
 *   tenantId: ObjectId (required) - The tenant _id
 *   domain: string (required)
 *   tenantNumber: number (required)
 *   name: string (required)
 *   email: string (required)
 *   gstNumber: string (required)
 *   ... other optional settings fields
 * }
 */
exports.onboardSettings = async function onboardSettings(req, res) {
  const session = await mongoose.startSession();
  try {
    const payload = req.body;
    const tenantId = payload.tenantId;

    if (!tenantId) {
      return res.status(400).json({ error: 'tenantId is required' });
    }

    // Verify tenant exists
    const Tenant = require('../models/Tenant');
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Check if settings already exist
    const existingSettings = await Settings.findOne({ tenantId: Types.ObjectId(tenantId) });
    if (existingSettings) {
      return res.status(409).json({ error: 'Settings already exist for this tenant' });
    }

    // Validate required fields
    const requiredFields = ['domain', 'tenantNumber', 'name', 'email', 'gstNumber'];
    for (const field of requiredFields) {
      if (!payload[field]) {
        return res.status(400).json({ error: `${field} is required` });
      }
    }

    // Build settings document
    const docData = { 
      tenantId: Types.ObjectId(tenantId), 
      createdAt: new Date(), 
      updatedAt: new Date() 
    };
    
    // Include required fields
    requiredFields.forEach(k => {
      docData[k] = payload[k];
    });

    // Include optional allowed fields
    for (const key of ALLOWED_UPDATE_FIELDS.concat(['invoicePrefix','expenseCategories','paymentMethod'])) {
      if (payload[key] !== undefined) docData[key] = payload[key];
    }

    session.startTransaction();
    const settings = new Settings(docData);
    await settings.save({ session });
    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({ 
      message: 'Settings created successfully',
      data: settings 
    });
  } catch (err) {
    console.error('onboardSettings error', err);
    try { 
      await session.abortTransaction(); 
      session.endSession(); 
    } catch(e) { /* ignore */ }
    
    if (err && err.code === 11000) {
      return res.status(409).json({ 
        error: 'Settings already exist for this tenant or domain already used', 
        details: err.keyValue 
      });
    }
    
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: err.message 
    });
  }
};

exports.updateSettings = async function updateSettings(req, res) {
  const tenantId = req.user.tenantId;
  const updaterId = req.user?.id || null;

  if (!tenantId) return res.status(400).json({ error: 'tenantId required' });

  console.log('updateSettings called for tenantId:', tenantId, 'with body:', req.body);

    // defensive: ensure req.body is an object
  const body = req.body || {};
  if (Object.keys(body).length === 0) {
    // helpful debug response (adjust in prod)
    return res.status(400).json({ error: 'Request body is empty. Did you set Content-Type: application/json?' });
  }
  // pick only allowed keys from body
  const incoming = {};
  for (const key of ALLOWED_UPDATE_FIELDS) {
    if (req.body[key] !== undefined) incoming[key] = req.body[key];
  }

  if (Object.keys(incoming).length === 0) {
    return res.status(400).json({ error: 'No updatable fields provided' });
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const tenantObjectId = new mongoose.Types.ObjectId(tenantId);

    // fetch existing doc with the session to ensure we read latest
    const existing = await Settings.findOne({ tenantId: tenantObjectId }).session(session);
    if (!existing) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ error: 'Settings not found for tenant' });
    }

    // build history entries
    const historyEntries = buildHistoryEntries(existing.toObject(), incoming, updaterId);

    // Build $set object (merge top-level fields)
    // const setObj = { updatedAt: new Date() };
    // for (const k of Object.keys(incoming)) setObj[k] = incoming[k];

    // // Prepare update operation
    // const updateOp = {
    //   $set: setObj
    // };

    // if (historyEntries.length > 0) {
    //   updateOp.$push = {
    //     updateHistory: { $each: historyEntries }
    //   };
    // }

    const updateOp = {};
    updateOp.$set = { updatedAt: new Date() };

    const bankMode = (req.body && req.body.bankAccountMode) || 'append';

    if (incoming.bankAccountDetails) {
      if (bankMode === 'replace') {
        // preserve history: record old array and new array
        historyEntries.push({
          attribute: 'bankAccountDetails',
          oldValue: existing.bankAccountDetails || [],
          newValue: incoming.bankAccountDetails,
          updatedAt: new Date(),
          updatedBy: updaterId ? new mongoose.Types.ObjectId(updaterId) : null
        });

        // replace the array
        updateOp.$set.bankAccountDetails = incoming.bankAccountDetails;
      } else {
        // append (default)
        // record history: record what was appended (so history isn't huge)
        historyEntries.push({
          attribute: 'bankAccountDetails',
          oldValue: existing.bankAccountDetails || [],
          newValue: (existing.bankAccountDetails || []).concat(incoming.bankAccountDetails),
          updatedAt: new Date(),
          updatedBy: updaterId ? new mongoose.Types.ObjectId(updaterId) : null
        });

        // push each incoming account into array
        updateOp.$push = updateOp.$push || {};
        updateOp.$push.bankAccountDetails = { $each: incoming.bankAccountDetails };
        }

        // remove bankAccountDetails from incoming so we don't also set it below
        delete incoming.bankAccountDetails;
      }

      // apply the remaining incoming fields via $set
      for (const k of Object.keys(incoming)) {
        updateOp.$set[k] = incoming[k];
      }

      // push history entries (if any)
      if (historyEntries.length > 0) {
        updateOp.$push = updateOp.$push || {};
        updateOp.$push.updateHistory = { $each: historyEntries };
      }

    // Atomically apply update and return the new document
    const updated = await Settings.findOneAndUpdate(
      { tenantId: tenantObjectId },
      updateOp,
      { new: true, session }
    );

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({ data: updated, historyAdded: historyEntries.length });
  } catch (err) {
    console.error('updateSettings error', err);
    try { await session.abortTransaction(); session.endSession(); } catch(e){/* ignore */ }
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};