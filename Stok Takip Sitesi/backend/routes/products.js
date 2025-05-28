const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// Tüm ürünleri getir
router.get('/', async (req, res) => {
    try {
        const [products] = await pool.query('SELECT * FROM products');
        res.json({
            success: true,
            data: products
        });
    } catch (error) {
        console.error('Ürün listesi hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası'
        });
    }
});

// Tek ürün getir
router.get('/:id', async (req, res) => {
    try {
        const [products] = await pool.query(
            'SELECT * FROM products WHERE id = ?',
            [req.params.id]
        );

        if (products.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Ürün bulunamadı'
            });
        }

        res.json({
            success: true,
            data: products[0]
        });
    } catch (error) {
        console.error('Ürün detay hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası'
        });
    }
});

// Yeni ürün ekle (Sadece admin)
router.post('/', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { name, description, price, stock, category } = req.body;

        const [result] = await pool.query(
            'INSERT INTO products (name, description, price, stock, category) VALUES (?, ?, ?, ?, ?)',
            [name, description, price, stock, category]
        );

        res.status(201).json({
            success: true,
            message: 'Ürün başarıyla eklendi',
            data: { id: result.insertId, name, description, price, stock, category }
        });
    } catch (error) {
        console.error('Ürün ekleme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası'
        });
    }
});

// Ürün güncelle (Sadece admin)
router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const productId = req.params.id;
        const { name, description, price, stock, category, image_url } = req.body;

        // Önce ürünün var olup olmadığını kontrol et
        const [existingProduct] = await pool.query('SELECT * FROM products WHERE id = ?', [productId]);
        if (existingProduct.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Ürün bulunamadı'
            });
        }

        // Güncellenecek alanları belirle
        const updates = [];
        const values = [];

        if (name !== undefined) {
            updates.push('name = ?');
            values.push(name);
        }

        if (description !== undefined) {
            updates.push('description = ?');
            values.push(description);
        }

        if (price !== undefined) {
            updates.push('price = ?');
            values.push(price);
        }

        if (stock !== undefined) {
            updates.push('stock = ?');
            values.push(stock);
        }

        if (category !== undefined) {
            updates.push('category = ?');
            values.push(category);
        }

        if (image_url !== undefined) {
            updates.push('image_url = ?');
            values.push(image_url);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Güncellenecek bilgi yok'
            });
        }

        // Güncelleme sorgusunu oluştur ve çalıştır
        const query = `UPDATE products SET ${updates.join(', ')} WHERE id = ?`;
        values.push(productId);

        const [result] = await pool.query(query, values);

        res.json({
            success: true,
            message: 'Ürün başarıyla güncellendi',
            data: {
                id: productId,
                name: name || existingProduct[0].name,
                description: description || existingProduct[0].description,
                price: price || existingProduct[0].price,
                stock: stock || existingProduct[0].stock,
                category: category || existingProduct[0].category,
                image_url: image_url || existingProduct[0].image_url
            }
        });
    } catch (error) {
        console.error('Ürün güncelleme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası'
        });
    }
});

// Ürün sil (Sadece admin)
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const [result] = await pool.query(
            'DELETE FROM products WHERE id = ?',
            [req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Ürün bulunamadı'
            });
        }

        res.json({
            success: true,
            message: 'Ürün başarıyla silindi'
        });
    } catch (error) {
        console.error('Ürün silme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası'
        });
    }
});

module.exports = router; 