const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

// Load environment variables (for JWT secret key)
require('dotenv').config();

const jwtSecret = process.env.JWT_SECRET || 'your_jwt_secret_key'; // Güvenli bir anahtar kullanın!
const saltRounds = 10; // bcrypt için salt tur sayısı

// Kullanıcı Kaydı
router.post('/register', async (req, res) => {
    const { username, password, email } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            success: false,
            message: 'Kullanıcı adı ve şifre gerekli'
        });
    }

    try {
        // Kullanıcı adı veya email kontrolü
        const [existingUsers] = await pool.query(
            'SELECT * FROM users WHERE username = ? OR email = ?',
            [username, email]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Bu kullanıcı adı veya email zaten kullanımda'
            });
        }

        // Şifre hashleme
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Kullanıcı oluşturma
        const [result] = await pool.query(
            'INSERT INTO users (username, password, email) VALUES (?, ?, ?)',
            [username, hashedPassword, email]
        );

        // Token oluşturma
        const payload = {
            userId: result.insertId,
            username: username,
            // Add other relevant user information
        };
        const token = jwt.sign(payload, jwtSecret, { expiresIn: '1h' });

        res.status(201).json({
            success: true,
            message: 'Kullanıcı başarıyla oluşturuldu',
            userId: result.insertId,
            token: token
        });
    } catch (error) {
        console.error('Kayıt hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası'
        });
    }
});

// Kullanıcı Girişi
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            success: false,
            message: 'Kullanıcı adı ve şifre gerekli'
        });
    }

    try {
        // Kullanıcıyı bul
        const [users] = await pool.query(
            'SELECT * FROM users WHERE username = ?',
            [username]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Kullanıcı adı veya şifre hatalı'
            });
        }

        const user = users[0];

        // Şifreyi kontrol et
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({
                success: false,
                message: 'Kullanıcı adı veya şifre hatalı'
            });
        }

        // JWT token oluştur
        const token = jwt.sign(
            { 
                id: user.id,
                username: user.username,
                isAdmin: user.is_admin
            },
            process.env.JWT_SECRET || 'gizli-anahtar',
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            message: 'Giriş başarılı',
            data: {
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    isAdmin: user.is_admin
                }
            }
        });
    } catch (error) {
        console.error('Giriş hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası'
        });
    }
});

module.exports = router; 