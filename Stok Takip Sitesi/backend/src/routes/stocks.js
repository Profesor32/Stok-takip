const express = require('express');
const Stock = require('../models/Stock');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all stocks
router.get('/', auth, async (req, res) => {
  try {
    const stocks = await Stock.find()
      .populate('category', 'name')
      .sort({ name: 1 });
    
    const formattedStocks = stocks.map(stock => ({
      id: stock._id,
      name: stock.name,
      category_id: stock.category._id,
      category_name: stock.category.name,
      quantity: stock.quantity,
      unit: stock.unit,
      min_quantity: stock.minQuantity,
      price: stock.price,
      description: stock.description,
      is_favorite: stock.isFavorite,
      created_at: stock.createdAt
    }));

    res.json(formattedStocks);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create stock
router.post('/', auth, async (req, res) => {
  try {
    const {
      name,
      category_id,
      quantity,
      unit,
      min_quantity,
      price,
      description,
      is_favorite
    } = req.body;

    const stock = new Stock({
      name,
      category: category_id,
      quantity,
      unit,
      minQuantity: min_quantity,
      price,
      description,
      isFavorite: is_favorite
    });

    await stock.save();
    await stock.populate('category', 'name');

    res.status(201).json({
      id: stock._id,
      name: stock.name,
      category_id: stock.category._id,
      category_name: stock.category.name,
      quantity: stock.quantity,
      unit: stock.unit,
      min_quantity: stock.minQuantity,
      price: stock.price,
      description: stock.description,
      is_favorite: stock.isFavorite,
      created_at: stock.createdAt
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update stock
router.put('/:id', auth, async (req, res) => {
  try {
    const {
      name,
      category_id,
      quantity,
      unit,
      min_quantity,
      price,
      description,
      is_favorite
    } = req.body;

    const stock = await Stock.findByIdAndUpdate(
      req.params.id,
      {
        name,
        category: category_id,
        quantity,
        unit,
        minQuantity: min_quantity,
        price,
        description,
        isFavorite: is_favorite
      },
      { new: true, runValidators: true }
    ).populate('category', 'name');

    if (!stock) {
      return res.status(404).json({ message: 'Stock not found' });
    }

    res.json({
      id: stock._id,
      name: stock.name,
      category_id: stock.category._id,
      category_name: stock.category.name,
      quantity: stock.quantity,
      unit: stock.unit,
      min_quantity: stock.minQuantity,
      price: stock.price,
      description: stock.description,
      is_favorite: stock.isFavorite,
      created_at: stock.createdAt
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete stock
router.delete('/:id', auth, async (req, res) => {
  try {
    const stock = await Stock.findByIdAndDelete(req.params.id);

    if (!stock) {
      return res.status(404).json({ message: 'Stock not found' });
    }

    res.json({ message: 'Stock deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Toggle favorite
router.put('/:id/favorite', auth, async (req, res) => {
  try {
    const stock = await Stock.findById(req.params.id);

    if (!stock) {
      return res.status(404).json({ message: 'Stock not found' });
    }

    stock.isFavorite = !stock.isFavorite;
    await stock.save();
    await stock.populate('category', 'name');

    res.json({
      id: stock._id,
      name: stock.name,
      category_id: stock.category._id,
      category_name: stock.category.name,
      quantity: stock.quantity,
      unit: stock.unit,
      min_quantity: stock.minQuantity,
      price: stock.price,
      description: stock.description,
      is_favorite: stock.isFavorite,
      created_at: stock.createdAt
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 