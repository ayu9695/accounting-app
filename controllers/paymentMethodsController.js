const PaymentMethod = require('../models/PaymentMethods');
const User = require('../models/Users');

// GET /api/PaymentMethods
exports.getAllPaymentMethods = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const userId = req.user.userId;
    const paymentMethods = await PaymentMethod.find({ tenantId });
    const user = await User.findOne({ _id: userId, tenantId });

    const transformedPaymentMethods = paymentMethods.map(paymentMethod => ({
      id : paymentMethod._id.toString(),
      code: paymentMethod.code,
      name: paymentMethod.name,
      description: paymentMethod.description
    }));
    return res.json(transformedPaymentMethods);
  } catch (error) {
    console.error('Error fetching PaymentMethods:', error);
    return res.status(500).json({ error: 'Server error fetching PaymentMethods' });
  }
};

// GET /api/PaymentMethods/:id
exports.getPaymentMethodById = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const paymentMethodId = req.params.id;
    const paymentMethod = await PaymentMethod.findOne({ _id: paymentMethodId, tenantId });
    if (!paymentMethod) return res.status(404).json({ error: 'PaymentMethod not found' });
    const user = await User.findOne({ _id: userId, tenantId });

    const transformedPaymentMethod = {
      id : paymentMethod._id.toString(),
      code: paymentMethod.code,
      name: paymentMethod.name,
      description: paymentMethod.description
    };
    return res.json(transformedPaymentMethod);
  } catch (error) {
    console.error('Error fetching PaymentMethod:', error);
    return res.status(500).json({ error: 'Server error fetching paymentMethod' });
  }
};

// POST /api/paymentMethods
exports.createPaymentMethod = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const createdBy = req.user.userId;

    const paymentMethodData = {
      ...req.body,
      tenantId,
      createdBy
    };

    const paymentMethod = new PaymentMethod(paymentMethodData);
    await paymentMethod.save();

    // const savedPaymentMethod = await PaymentMethod.findOne({ _id: paymentMethodId, tenantId });

    const transformedPaymentMethod = {
      id : paymentMethod._id.toString(),
      code: paymentMethod.code,
      name: paymentMethod.name,
      description: paymentMethod.description
    };
    return res.status(201).json(transformedPaymentMethod);
  } catch (error) {
    console.error('Error creating PaymentMethod:', error);
    return res.status(500).json({ error: 'Server error creating PaymentMethod' });
  }
};

// PUT /api/paymentMethods/:id
exports.updatePaymentMethod = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const paymentMethodId = req.params.id;

    const paymentMethod = await PaymentMethod.findOne({ _id: paymentMethodId, tenantId });
    if (!paymentMethod) return res.status(404).json({ error: 'paymentMethod not found' });

    const updates = req.body;
    const updateHistory = [];

    Object.keys(updates).forEach((key) => {
      if (paymentMethod[key] !== updates[key]) {
        updateHistory.push({
          attribute: key,
          oldValue: paymentMethod[key],
          newValue: updates[key],
          updatedAt: new Date(),
          updatedBy: req.user.userId
        });
        paymentMethod[key] = updates[key];
      }
    });

    if (updateHistory.length > 0) {
      paymentMethod.updateHistory.push(...updateHistory);
    }

    await paymentMethod.save();

    const transformedPaymentMethods = {
      id : paymentMethod._id.toString(),
      code: paymentMethod.code,
      name: paymentMethod.name,
      description: paymentMethod.description
    };
    return res.status(201).json(transformedPaymentMethods);
  } catch (error) {
    console.error('Error updating PaymentMethod:', error);
    return res.status(500).json({ error: 'Server error updating PaymentMethod' });
  }
};

// DELETE /api/PaymentMethods/:id
exports.deletePaymentMethod = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const paymentMethodId = req.params.id;
    const paymentMethod = await PaymentMethod.findOneAndDelete({ _id: paymentMethodId, tenantId });
    if (!paymentMethod) return res.status(404).json({ error: 'PaymentMethod not found' });
    return res.json({ message: 'PaymentMethod deleted successfully' });
  } catch (error) {
    console.error('Error deleting PaymentMethod:', error);
    return res.status(500).json({ error: 'Server error deleting PaymentMethod' });
  }
};
