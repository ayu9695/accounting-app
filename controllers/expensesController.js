const Expense = require('../models/Expense');

// GET /api/expenses
exports.getAllExpenses = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const expenses = await Expense.find({ tenantId }).sort({ expenseDate: -1 });
    return res.json(expenses);
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
    return res.json(expense);
  } catch (error) {
    console.error('Error fetching expense:', error);
    return res.status(500).json({ error: 'Server error fetching expense' });
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
      createdBy
    };

    const expense = new Expense(expenseData);
    await expense.save();

    return res.status(201).json(expense);
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
        expense[key] = updates[key];
      }
    });

    if (updateHistory.length > 0) {
      expense.updateHistory.push(...updateHistory);
    }

    await expense.save();

    return res.json(expense);
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
