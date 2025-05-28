const pool = require('../config/database');

// Tüm stokları getir
const getAllStocks = async (req, res) => {
    try {
        const [stocks] = await pool.query(
            `SELECT s.*, u.username as added_by 
             FROM stocks s 
             JOIN users u ON s.user_id = u.id 
             ORDER BY s.created_at DESC`
        );

        res.json({ stocks });
    } catch (error) {
        console.error('Stokları getirme hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
};

// Stok detayını getir
const getStockById = async (req, res) => {
    const { id } = req.params;

    try {
        const [stock] = await pool.query(
            `SELECT s.*, u.username as added_by 
             FROM stocks s 
             JOIN users u ON s.user_id = u.id 
             WHERE s.id = ?`,
            [id]
        );

        if (!stock) {
            return res.status(404).json({ error: 'Stok bulunamadı' });
        }

        // Fiyat geçmişini getir
        const [priceHistory] = await pool.query(
            `SELECT price, created_at 
             FROM stock_price_history 
             WHERE stock_id = ? 
             ORDER BY created_at DESC`,
            [id]
        );

        res.json({
            stock: {
                ...stock,
                price_history: priceHistory
            }
        });
    } catch (error) {
        console.error('Stok detayı getirme hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
};

// Yeni stok ekle
const addStock = async (req, res) => {
    const { name, price, quantity, description } = req.body;

    try {
        // Stok ekle
        const [result] = await pool.query(
            'INSERT INTO stocks (name, price, quantity, description, user_id) VALUES (?, ?, ?, ?, ?)',
            [name, price, quantity, description, req.user.id]
        );

        // Fiyat geçmişine ekle
        await pool.query(
            'INSERT INTO stock_price_history (stock_id, price) VALUES (?, ?)',
            [result.insertId, price]
        );

        // Eklenen stoku getir
        const [stock] = await pool.query(
            `SELECT s.*, u.username as added_by 
             FROM stocks s 
             JOIN users u ON s.user_id = u.id 
             WHERE s.id = ?`,
            [result.insertId]
        );

        res.status(201).json({
            message: 'Stok başarıyla eklendi',
            stock
        });
    } catch (error) {
        console.error('Stok ekleme hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
};

// Stok güncelle
const updateStock = async (req, res) => {
    const { id } = req.params;
    const { name, price, quantity, description } = req.body;

    try {
        // Stok kontrolü
        const [stock] = await pool.query(
            'SELECT * FROM stocks WHERE id = ?',
            [id]
        );

        if (!stock) {
            return res.status(404).json({ error: 'Stok bulunamadı' });
        }

        // Stok güncelle
        await pool.query(
            'UPDATE stocks SET name = ?, price = ?, quantity = ?, description = ? WHERE id = ?',
            [name, price, quantity, description, id]
        );

        // Fiyat değiştiyse geçmişe ekle
        if (price !== stock.price) {
            await pool.query(
                'INSERT INTO stock_price_history (stock_id, price) VALUES (?, ?)',
                [id, price]
            );
        }

        // Güncellenmiş stoku getir
        const [updatedStock] = await pool.query(
            `SELECT s.*, u.username as added_by 
             FROM stocks s 
             JOIN users u ON s.user_id = u.id 
             WHERE s.id = ?`,
            [id]
        );

        res.json({
            message: 'Stok başarıyla güncellendi',
            stock: updatedStock
        });
    } catch (error) {
        console.error('Stok güncelleme hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
};

// Stok sil
const deleteStock = async (req, res) => {
    const { id } = req.params;

    try {
        // Stok kontrolü
        const [stock] = await pool.query(
            'SELECT * FROM stocks WHERE id = ?',
            [id]
        );

        if (!stock) {
            return res.status(404).json({ error: 'Stok bulunamadı' });
        }

        // Favorilerden sil
        await pool.query('DELETE FROM favorites WHERE stock_id = ?', [id]);

        // Fiyat geçmişini sil
        await pool.query('DELETE FROM stock_price_history WHERE stock_id = ?', [id]);

        // Stoku sil
        await pool.query('DELETE FROM stocks WHERE id = ?', [id]);

        res.json({ message: 'Stok başarıyla silindi' });
    } catch (error) {
        console.error('Stok silme hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
};

module.exports = {
    getAllStocks,
    getStockById,
    addStock,
    updateStock,
    deleteStock
}; 