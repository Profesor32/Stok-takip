const express = require('express');
const router = express.Router();
const pool = require('../config/database'); // Veritabanı bağlantısı dahil edildi
const { authenticateToken, isAdmin } = require('../middleware/auth'); // isAdmin middleware'i dahil edildi
const bcrypt = require('bcrypt'); // bcrypt modülünü ekledik

// Get all users (Admin only)
router.get('/', authenticateToken, isAdmin, async (req, res) => {
    try {
        const [users] = await pool.query('SELECT id, username, email, created_at FROM users');
        res.json({ success: true, data: users });
    } catch (error) {
        console.error('Kullanıcı listesi hatası:', error);
        res.status(500).json({ success: false, message: 'Sunucu hatası' });
    }
});

// Get a single user by ID (Admin only)
router.get('/:id', authenticateToken, isAdmin, async (req, res) => {
    const userId = req.params.id;
    try {
        const [users] = await pool.query('SELECT id, username, email, created_at FROM users WHERE id = ?', [userId]);
        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı' });
        }
        res.json({ success: true, data: users[0] });
    } catch (error) {
        console.error('Kullanıcı detay hatası:', error);
        res.status(500).json({ success: false, message: 'Sunucu hatası' });
    }
});

// Create a new user (Admin only - typically registration is public, but admin might add users)
// Eğer admin paneli üzerinden kullanıcı ekleniyorsa isAdmin kontrolü eklenmeli.
// Eğer bu endpoint sadece admin tarafından kullanılacaksa:
router.post('/', authenticateToken, isAdmin, async (req, res) => {
    const { username, password, email } = req.body;
    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Kullanıcı adı ve şifre gerekli' });
    }
    try {
        // Şifreyi hashle
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const [result] = await pool.query(
            'INSERT INTO users (username, password, email) VALUES (?, ?, ?)',
            [username, hashedPassword, email]
        );
        
        res.status(201).json({
            success: true,
            message: 'Kullanıcı başarıyla oluşturuldu',
            data: { id: result.insertId, username, email }
        });
    } catch (error) {
        console.error('Kullanıcı oluşturma hatası:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, message: 'Bu kullanıcı adı veya e-posta adresi zaten mevcut' });
        }
        res.status(500).json({ success: false, message: 'Sunucu hatası' });
    }
});

// Update a user by ID (Admin only)
router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
    const userId = req.params.id;
    const { username, password, email } = req.body;
    
    try {
        // Önce kullanıcının var olup olmadığını kontrol et
        const [existingUser] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
        if (existingUser.length === 0) {
            return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı' });
        }

        // Güncellenecek alanları belirle
        const updates = [];
        const values = [];

        if (username) {
            updates.push('username = ?');
            values.push(username);
        }

        if (email) {
            updates.push('email = ?');
            values.push(email);
        }

        if (password) {
            // Şifreyi hashle
            const hashedPassword = await bcrypt.hash(password, 10);
            updates.push('password = ?');
            values.push(hashedPassword);
        }

        if (updates.length === 0) {
            return res.status(400).json({ success: false, message: 'Güncellenecek bilgi yok' });
        }

        // Benzersiz kısıtlamaları kontrol et
        if (username || email) {
            const [duplicateCheck] = await pool.query(
                'SELECT id FROM users WHERE (username = ? OR email = ?) AND id != ?',
                [username || existingUser[0].username, email || existingUser[0].email, userId]
            );
            if (duplicateCheck.length > 0) {
                return res.status(409).json({ success: false, message: 'Bu kullanıcı adı veya e-posta adresi zaten kullanılıyor' });
            }
        }

        // Güncelleme sorgusunu oluştur ve çalıştır
        const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
        values.push(userId);

        const [result] = await pool.query(query, values);

        res.json({ 
            success: true, 
            message: 'Kullanıcı başarıyla güncellendi',
            data: {
                id: userId,
                username: username || existingUser[0].username,
                email: email || existingUser[0].email
            }
        });
    } catch (error) {
        console.error('Kullanıcı güncelleme hatası:', error);
        res.status(500).json({ success: false, message: 'Sunucu hatası' });
    }
});

// Delete a user by ID (Admin only)
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
    const userId = req.params.id;
    try {
        const [result] = await pool.query('DELETE FROM users WHERE id = ?', [userId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı' });
        }
        res.json({ success: true, message: 'Kullanıcı başarıyla silindi' });
    } catch (error) {
        console.error('Kullanıcı silme hatası:', error);
        res.status(500).json({ success: false, message: 'Sunucu hatası' });
    }
});

module.exports = router; 