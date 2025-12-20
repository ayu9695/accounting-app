const Expense = require('../models/Expense');
const User = require('../models/Users');
const PaymentMethod = require('../models/PaymentMethods');

// GET /api/expenses
exports.getAllExpenses = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const userId = req.user.userId;
    const expenses = await Expense.find({ tenantId }).sort({ expenseDate: -1 });
    const user = await User.findOne({ _id: userId, tenantId });

    const transformedExpenses = expenses.map(expense => ({
      id : expense._id.toString(),
      category : expense.category.toString(),
      amount: expense.amount,
      // paymentMethod: expense.paymentMethod.toString(),
      paymentStatus: expense.paymentStatus,
      approvalStatus: expense.approvalStatus,
      expenseDate: expense.expenseDate,
      description: expense.description,
      createdBy: user.name,
      createdAt: expense.createdAt,
      updatedAt: expense.updatedAt,
    }));
    return res.json(transformedExpenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return res.status(500).json({ error: 'Server error fetching expenses' });
  }
};

// GET /api/expenses/:id
exports.getExpenseById = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const expenseId = req.params.id;
    const expense = await Expense.findOne({ _id: expenseId, tenantId });
    if (!expense) return res.status(404).json({ error: 'Expense not found' });
    const user = await User.findOne({ _id: expense.createdBy, tenantId });
    const paymentMethod = await PaymentMethod.findOne({_id: expense.paymentMethod, tenantId});

    const transformedExpenses = {
      id : expense._id.toString(),
      category : expense.category.toString(),
      amount: expense.amount,
      paymentMethod: paymentMethod.name,
      paymentStatus: expense.paymentStatus,
      approvalStatus: expense.approvalStatus,
      expenseDate: expense.expenseDate,
      description: expense.description,
      createdBy: user.name,
      createdAt: expense.createdAt,
      updatedAt: expense.updatedAt,
    };
    return res.json(transformedExpenses);
  } catch (error) {
    console.error('Error fetching expense:', error);
    return res.status(500).json({ error: 'Server error fetching expense' });
  }
};

// GET /api/expenses/filter/unpaid
exports.getUnpaidExpenses = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const userId = req.user.userId;
    
    // Get all unpaid expenses (paymentStatus: false) sorted by expenseDate descending
    const expenses = await Expense.find({ 
      tenantId, 
      paymentStatus: false 
    }).sort({ expenseDate: -1 });
    
    const user = await User.findOne({ _id: userId, tenantId });

    const transformedExpenses = expenses.map(expense => ({
      id: expense._id.toString(),
      category: expense.category.toString(),
      amount: expense.amount,
      currency: expense.currency,
      paymentStatus: expense.paymentStatus,
      approvalStatus: expense.approvalStatus,
      expenseDate: expense.expenseDate,
      description: expense.description,
      createdBy: user?.name || 'Unknown',
      createdAt: expense.createdAt,
      updatedAt: expense.updatedAt,
    }));

    return res.json({
      expenses: transformedExpenses,
      count: transformedExpenses.length
    });
  } catch (error) {
    console.error('Error fetching unpaid expenses:', error);
    return res.status(500).json({ error: 'Server error fetching unpaid expenses' });
  }
};

// POST /api/expenses
exports.createExpense = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const createdBy = req.user.userId;

    const expenseData = {
      ...req.body,
      tenantId,
      createdBy,
      expenseDate: new Date(req.body.date)
    };

    const expense = new Expense(expenseData);
    console.log("Creating expense : ", expense, " from data received : ", expenseData);
    await expense.save();
    const user = await User.findOne({ _id: req.user.userId, tenantId });

    const transformedExpenses = expenses.map(expense => ({
      id : expense._id.toString(),
      category : expense.category.toString(),
      amount: expense.amount,
      paymentMethod: expense.paymentMethod.toString(),
      paymentStatus: expense.paymentStatus,
      approvalStatus: expense.approvalStatus,
      expenseDate: expense.expenseDate,
      description: expense.description,
      createdBy: user.name,
      createdAt: expense.createdAt,
      updatedAt: expense.updatedAt,
    }));
    return res.status(201).json(transformedExpenses);
  } catch (error) {
    console.error('Error creating expense:', error);
    return res.status(500).json({ error: 'Server error creating expense' });
  }
};

// PUT /api/expenses/:id
exports.updateExpense = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const expenseId = req.params.id;

    const expense = await Expense.findOne({ _id: expenseId, tenantId });
    if (!expense) return res.status(404).json({ error: 'Expense not found' });

    const updates = req.body;
    const updateHistory = [];

    Object.keys(updates).forEach((key) => {
      if (expense[key] !== updates[key]) {
        updateHistory.push({
          attribute: key,
          oldValue: expense[key],
          newValue: updates[key],
          updatedAt: new Date(),
          updatedBy: req.user.userId
        });
          console.log("updates key : ", updates[key], " updates values : ", updates, "expense : ", expense[key]);
          expense[key] = updates[key];
        if (updates.paymentDate) {
          expense.paymentDate = new Date(updates.paymentDate);
        } 
      }
    });

    if (updateHistory.length > 0) {
      expense.updateHistory.push(...updateHistory);
    }
    console.log("saving expense : ", expense);

    await expense.save();

    // const user = await User.findOne({ _id: userId, tenantId });

    const transformedExpenses = {
      id : expense._id.toString(),
      category : expense.category.toString(),
      amount: expense.amount,
      paymentMethod: expense.paymentMethod.toString(),
      paymentStatus: expense.paymentStatus,
      approvalStatus: expense.approvalStatus,
      date: expense.expenseDate,
      description: expense.description,
      // createdBy: user.name,
      createdAt: expense.createdAt,
      updatedAt: expense.updatedAt,
    };
    return res.status(201).json(transformedExpenses);
  } catch (error) {
    console.error('Error updating expense:', error);
    return res.status(500).json({ error: 'Server error updating expense' });
  }
};

// DELETE /api/expenses/:id
exports.deleteExpense = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const expenseId = req.params.id;
    const expense = await Expense.findOneAndDelete({ _id: expenseId, tenantId });
    if (!expense) return res.status(404).json({ error: 'Expense not found' });
    return res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    return res.status(500).json({ error: 'Server error deleting expense' });
  }
};
