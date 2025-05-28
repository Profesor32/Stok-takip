const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Kullanıcı profilini getir
const getProfile = async (req, res) => {
    try {
        const [user] = await pool.query(
            'SELECT id, username, email FROM users WHERE id = ?',
            [req.user.id]
        );

        if (!user) {
            return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
        }

        res.json(user);
    } catch (error) {
        console.error('Profil getirme hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
};

// Profil güncelle
const updateProfile = async (req, res) => {
    const { username, email, password } = req.body;

    try {
        // Kullanıcı adı ve email kontrolü
        const [existingUser] = await pool.query(
            'SELECT id FROM users WHERE (username = ? OR email = ?) AND id != ?',
            [username, email, req.user.id]
        );

        if (existingUser) {
            return res.status(400).json({ error: 'Bu kullanıcı adı veya email zaten kullanılıyor' });
        }

        let updateQuery = 'UPDATE users SET username = ?, email = ?';
        let queryParams = [username, email];

        // Şifre değişikliği varsa
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updateQuery += ', password = ?';
            queryParams.push(hashedPassword);
        }

        updateQuery += ' WHERE id = ?';
        queryParams.push(req.user.id);

        await pool.query(updateQuery, queryParams);

        // Güncellenmiş kullanıcı bilgilerini getir
        const [updatedUser] = await pool.query(
            'SELECT id, username, email FROM users WHERE id = ?',
            [req.user.id]
        );

        res.json(updatedUser);
    } catch (error) {
        console.error('Profil güncelleme hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
};

// Son eklenen stokları getir
const getRecentStocks = async (req, res) => {
    try {
        const [stocks] = await pool.query(
            `SELECT s.*, u.username as added_by 
             FROM stocks s 
             JOIN users u ON s.user_id = u.id 
             ORDER BY s.created_at DESC 
             LIMIT 10`
        );

        res.json({ stocks });
    } catch (error) {
        console.error('Son stokları getirme hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
};

module.exports = {
    getProfile,
    updateProfile,
    getRecentStocks
}; 