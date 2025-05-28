const express = require('express');
const Stock = require('../models/Stock');
const Category = require('../models/Category');
const auth = require('../middleware/auth');

const router = express.Router();

// Get dashboard stats
router.get('/stats', auth, async (req, res) => {
  try {
    const [totalStocks, totalCategories, stocks] = await Promise.all([
      Stock.countDocuments(),
      Category.countDocuments(),
      Stock.find()
    ]);

    const lowStocks = stocks.filter(stock => stock.quantity <= stock.minQuantity).length;
    const totalValue = stocks.reduce((sum, stock) => sum + (stock.quantity * stock.price), 0);

    res.json({
      total_stocks: totalStocks,
      total_categories: totalCategories,
      low_stocks: lowStocks,
      total_value: totalValue
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 