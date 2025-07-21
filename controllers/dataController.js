const Client = require('../models/Client');

const sampleData = {
  revenue: "$45,000.00",
  expenses: "$18,000.00",
//   profit: "$27,000.00",
  tax: "$2,280.00",
  revenueGrowth: 12.5,
//   expenseGrowth: 3.2,
  profitGrowth: 8.7,
  taxGrowth: 5.3
};

exports.getData = (req, res) => {
  res.json(sampleData);
};