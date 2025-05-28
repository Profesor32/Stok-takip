const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth'); // Yetkilendirme middleware'i

// Get user's cart content
router.get('/', authenticateToken, async (req, res) => {
    const userId = req.user.userId; // JWT payload'ından kullanıcı ID'si

    try {
        // Find the user's cart or create one if it doesn't exist
        let [carts] = await pool.query('SELECT id FROM carts WHERE user_id = ?', [userId]);
        let cartId;

        if (carts.length === 0) {
            // Create a new cart for the user
            const [result] = await pool.query('INSERT INTO carts (user_id) VALUES (?)', [userId]);
            cartId = result.insertId;
        } else {
            cartId = carts[0].id;
        }

        // Get cart items for the user's cart, joining with products table
        const [cartItems] = await pool.query(
            'SELECT ci.id, ci.product_id, ci.quantity, p.name, p.price, p.image_url FROM cart_items ci JOIN products p ON ci.product_id = p.id WHERE ci.cart_id = ?',
            [cartId]
        );

        res.json({ success: true, data: cartItems });

    } catch (error) {
        console.error('Sepet içeriği hatası:', error);
        res.status(500).json({ success: false, message: 'Sunucu hatası' });
    }
});

// Add item to cart
router.post('/add', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const { product_id, quantity } = req.body;

    if (!product_id || !quantity || quantity <= 0) {
        return res.status(400).json({ success: false, message: 'Ürün ID ve geçerli miktar gerekli' });
    }

    try {
        // Find the user's cart or create one if it doesn't exist
        let [carts] = await pool.query('SELECT id FROM carts WHERE user_id = ?', [userId]);
        let cartId;

        if (carts.length === 0) {
            const [result] = await pool.query('INSERT INTO carts (user_id) VALUES (?)', [userId]);
            cartId = result.insertId;
        } else {
            cartId = carts[0].id;
        }

        // Check if the product is already in the cart
        const [existingItem] = await pool.query('SELECT id, quantity FROM cart_items WHERE cart_id = ? AND product_id = ?', [cartId, product_id]);

        if (existingItem.length > 0) {
            // If product exists, update the quantity
            const newQuantity = existingItem[0].quantity + quantity;
            await pool.query('UPDATE cart_items SET quantity = ? WHERE id = ?', [newQuantity, existingItem[0].id]);
            res.json({ success: true, message: 'Ürün miktarı güncellendi' });
        } else {
            // If product does not exist, add as a new item
            const [result] = await pool.query('INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, ?)', [cartId, product_id, quantity]);
            res.status(201).json({ success: true, message: 'Ürün sepete eklendi', cartItemId: result.insertId });
        }

    } catch (error) {
        console.error('Sepete ürün ekleme hatası:', error);
        res.status(500).json({ success: false, message: 'Sunucu hatası' });
    }
});

// Update item quantity in cart
router.put('/update/:itemId', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const itemId = req.params.itemId;
    const { quantity } = req.body;

    if (!quantity || quantity <= 0) {
        return res.status(400).json({ success: false, message: 'Geçerli miktar gerekli' });
    }

    try {
        // Find the cart item and ensure it belongs to the user's cart
        const [cartItems] = await pool.query(
            'SELECT ci.id FROM cart_items ci JOIN carts c ON ci.cart_id = c.id WHERE ci.id = ? AND c.user_id = ?',
            [itemId, userId]
        );

        if (cartItems.length === 0) {
            return res.status(404).json({ success: false, message: 'Sepet ürünü bulunamadı' });
        }

        // Update the quantity
        await pool.query('UPDATE cart_items SET quantity = ? WHERE id = ?', [quantity, itemId]);

        res.json({ success: true, message: 'Ürün miktarı güncellendi' });

    } catch (error) {
        console.error('Sepet ürünü güncelleme hatası:', error);
        res.status(500).json({ success: false, message: 'Sunucu hatası' });
    }
});

// Remove item from cart
router.delete('/remove/:itemId', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const itemId = req.params.itemId;

    try {
        // Find the cart item and ensure it belongs to the user's cart
         const [cartItems] = await pool.query(
            'SELECT ci.id FROM cart_items ci JOIN carts c ON ci.cart_id = c.id WHERE ci.id = ? AND c.user_id = ?',
            [itemId, userId]
        );

        if (cartItems.length === 0) {
            return res.status(404).json({ success: false, message: 'Sepet ürünü bulunamadı' });
        }

        // Delete the item
        await pool.query('DELETE FROM cart_items WHERE id = ?', [itemId]);

        res.json({ success: true, message: 'Ürün sepetten silindi' });

    } catch (error) {
        console.error('Sepet ürünü silme hatası:', error);
        res.status(500).json({ success: false, message: 'Sunucu hatası' });
    }
});

module.exports = router; 