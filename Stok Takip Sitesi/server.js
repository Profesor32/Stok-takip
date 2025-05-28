// Basic server file

// This file would typically start the backend server. 

const express = require('express');
const path = require('path');
const usersRoutes = require('./backend/routes/users');
const productsRoutes = require('./backend/routes/products');
const authRoutes = require('./backend/routes/auth');
const cartRoutes = require('./backend/routes/cart');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const JsBarcode = require('jsbarcode');
const { createCanvas } = require('canvas');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the 'frontend' directory
app.use(express.static(path.join(__dirname, '')));

// Database connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'stok_takip'
});

// Connect to database
db.connect((err) => {
    if (err) {
        console.error('Database connection error:', err);
        return;
    }
    console.log('Connected to database');
});

// JWT Secret
const JWT_SECRET = 'your-secret-key';

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, message: 'Token gerekli' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ success: false, message: 'Geçersiz token' });
        }
        req.user = user;
        next();
    });
};

// Use API routes
app.use('/api/users', usersRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/cart', cartRoutes);

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Auth routes
app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const query = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
        
        db.query(query, [username, email, hashedPassword], (err, results) => {
            if (err) {
                console.error('Registration error:', err);
                return res.status(500).json({ success: false, message: 'Kayıt işlemi başarısız' });
            }
            res.json({ success: true, message: 'Kayıt başarılı' });
        });
    } catch (error) {
        console.error('Password hashing error:', error);
        res.status(500).json({ success: false, message: 'Şifre hashleme hatası' });
    }
});

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const query = 'SELECT * FROM users WHERE email = ?';

    db.query(query, [email], async (err, results) => {
        if (err) {
            console.error('Login error:', err);
            return res.status(500).json({ success: false, message: 'Giriş işlemi başarısız' });
        }

        if (results.length === 0) {
            return res.status(401).json({ success: false, message: 'Kullanıcı bulunamadı' });
        }

        const user = results[0];
        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            return res.status(401).json({ success: false, message: 'Geçersiz şifre' });
        }

        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
        res.json({ success: true, token });
    });
});

// Product routes
app.get('/api/products', (req, res) => {
    const query = 'SELECT * FROM products';
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Products fetch error:', err);
            return res.status(500).json({ success: false, message: 'Ürünler yüklenirken hata oluştu' });
        }
        res.json({ success: true, data: results });
    });
});

app.get('/api/products/:id', (req, res) => {
    const query = 'SELECT * FROM products WHERE id = ?';
    
    db.query(query, [req.params.id], (err, results) => {
        if (err) {
            console.error('Product fetch error:', err);
            return res.status(500).json({ success: false, message: 'Ürün yüklenirken hata oluştu' });
        }
        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'Ürün bulunamadı' });
        }
        res.json({ success: true, data: results[0] });
    });
});

// Barkod ile ürün arama
app.get('/api/products/barcode/:barcode', (req, res) => {
    const query = 'SELECT * FROM products WHERE barcode = ?';
    
    db.query(query, [req.params.barcode], (err, results) => {
        if (err) {
            console.error('Barcode search error:', err);
            return res.status(500).json({ success: false, message: 'Barkod araması sırasında hata oluştu' });
        }
        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'Ürün bulunamadı' });
        }
        res.json({ success: true, data: results[0] });
    });
});

// Barkod görseli oluşturma
app.get('/api/products/barcode-image/:barcode', (req, res) => {
    const canvas = createCanvas(200, 100);
    JsBarcode(canvas, req.params.barcode, {
        format: 'CODE128',
        width: 2,
        height: 100,
        displayValue: true
    });

    res.set('Content-Type', 'image/png');
    res.send(canvas.toBuffer());
});

// Stok hareketleri
app.get('/api/products/:id/stock-movements', (req, res) => {
    const query = `
        SELECT * FROM stock_movements 
        WHERE product_id = ? 
        ORDER BY date DESC 
        LIMIT 10
    `;
    
    db.query(query, [req.params.id], (err, results) => {
        if (err) {
            console.error('Stock movements fetch error:', err);
            return res.status(500).json({ success: false, message: 'Stok hareketleri yüklenirken hata oluştu' });
        }
        res.json({ success: true, data: results });
    });
});

// Satış istatistikleri
app.get('/api/products/:id/sales-statistics', (req, res) => {
    const query = `
        SELECT 
            COUNT(*) as total_sales,
            SUM(quantity) as total_quantity,
            AVG(quantity) as average_quantity
        FROM sales 
        WHERE product_id = ? 
        AND date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `;
    
    db.query(query, [req.params.id], (err, results) => {
        if (err) {
            console.error('Sales statistics fetch error:', err);
            return res.status(500).json({ success: false, message: 'Satış istatistikleri yüklenirken hata oluştu' });
        }
        res.json({ success: true, data: results[0] });
    });
});

// Benzer ürünler
app.get('/api/products/:id/similar', (req, res) => {
    const query = `
        SELECT * FROM products 
        WHERE category = (SELECT category FROM products WHERE id = ?)
        AND id != ?
        LIMIT 5
    `;
    
    db.query(query, [req.params.id, req.params.id], (err, results) => {
        if (err) {
            console.error('Similar products fetch error:', err);
            return res.status(500).json({ success: false, message: 'Benzer ürünler yüklenirken hata oluştu' });
        }
        res.json({ success: true, data: results });
    });
});

// Satış işlemleri
app.get('/api/sales', (req, res) => {
    const query = `
        SELECT s.*, p.name as product_name 
        FROM sales s 
        JOIN products p ON s.product_id = p.id 
        ORDER BY s.date DESC
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Sales fetch error:', err);
            return res.status(500).json({ success: false, message: 'Satışlar yüklenirken hata oluştu' });
        }
        res.json({ success: true, data: results });
    });
});

app.post('/api/sales', (req, res) => {
    const { product_id, quantity, unit_price } = req.body;
    const total_amount = quantity * unit_price;

    // Transaction başlat
    db.beginTransaction(err => {
        if (err) {
            console.error('Transaction start error:', err);
            return res.status(500).json({ success: false, message: 'İşlem başlatılamadı' });
        }

        // Satışı ekle
        const saleQuery = 'INSERT INTO sales (product_id, quantity, unit_price, total_amount) VALUES (?, ?, ?, ?)';
        db.query(saleQuery, [product_id, quantity, unit_price, total_amount], (err, results) => {
            if (err) {
                return db.rollback(() => {
                    console.error('Sale insert error:', err);
                    res.status(500).json({ success: false, message: 'Satış eklenirken hata oluştu' });
                });
            }

            // Stok miktarını güncelle
            const stockQuery = 'UPDATE products SET stock = stock - ? WHERE id = ?';
            db.query(stockQuery, [quantity, product_id], (err, results) => {
                if (err) {
                    return db.rollback(() => {
                        console.error('Stock update error:', err);
                        res.status(500).json({ success: false, message: 'Stok güncellenirken hata oluştu' });
                    });
                }

                // Stok hareketi ekle
                const movementQuery = 'INSERT INTO stock_movements (product_id, quantity, type, description) VALUES (?, ?, ?, ?)';
                db.query(movementQuery, [product_id, quantity, 'out', 'Satış işlemi'], (err, results) => {
                    if (err) {
                        return db.rollback(() => {
                            console.error('Stock movement insert error:', err);
                            res.status(500).json({ success: false, message: 'Stok hareketi eklenirken hata oluştu' });
                        });
                    }

                    // Transaction'ı tamamla
                    db.commit(err => {
                        if (err) {
                            return db.rollback(() => {
                                console.error('Commit error:', err);
                                res.status(500).json({ success: false, message: 'İşlem tamamlanırken hata oluştu' });
                            });
                        }
                        res.json({ success: true, message: 'Satış başarıyla tamamlandı' });
                    });
                });
            });
        });
    });
});

app.post('/api/sales/:id/cancel', (req, res) => {
    const saleId = req.params.id;

    // Transaction başlat
    db.beginTransaction(err => {
        if (err) {
            console.error('Transaction start error:', err);
            return res.status(500).json({ success: false, message: 'İşlem başlatılamadı' });
        }

        // Satış bilgilerini al
        const saleQuery = 'SELECT * FROM sales WHERE id = ?';
        db.query(saleQuery, [saleId], (err, results) => {
            if (err) {
                return db.rollback(() => {
                    console.error('Sale fetch error:', err);
                    res.status(500).json({ success: false, message: 'Satış bilgileri alınırken hata oluştu' });
                });
            }

            if (results.length === 0) {
                return db.rollback(() => {
                    res.status(404).json({ success: false, message: 'Satış bulunamadı' });
                });
            }

            const sale = results[0];

            // Stok miktarını güncelle
            const stockQuery = 'UPDATE products SET stock = stock + ? WHERE id = ?';
            db.query(stockQuery, [sale.quantity, sale.product_id], (err, results) => {
                if (err) {
                    return db.rollback(() => {
                        console.error('Stock update error:', err);
                        res.status(500).json({ success: false, message: 'Stok güncellenirken hata oluştu' });
                    });
                }

                // Stok hareketi ekle
                const movementQuery = 'INSERT INTO stock_movements (product_id, quantity, type, description) VALUES (?, ?, ?, ?)';
                db.query(movementQuery, [sale.product_id, sale.quantity, 'in', 'Satış iptali'], (err, results) => {
                    if (err) {
                        return db.rollback(() => {
                            console.error('Stock movement insert error:', err);
                            res.status(500).json({ success: false, message: 'Stok hareketi eklenirken hata oluştu' });
                        });
                    }

                    // Satışı iptal et
                    const cancelQuery = 'UPDATE sales SET status = ? WHERE id = ?';
                    db.query(cancelQuery, ['cancelled', saleId], (err, results) => {
                        if (err) {
                            return db.rollback(() => {
                                console.error('Sale cancel error:', err);
                                res.status(500).json({ success: false, message: 'Satış iptal edilirken hata oluştu' });
                            });
                        }

                        // Transaction'ı tamamla
                        db.commit(err => {
                            if (err) {
                                return db.rollback(() => {
                                    console.error('Commit error:', err);
                                    res.status(500).json({ success: false, message: 'İşlem tamamlanırken hata oluştu' });
                                });
                            }
                            res.json({ success: true, message: 'Satış başarıyla iptal edildi' });
                        });
                    });
                });
            });
        });
    });
});

// Satış istatistikleri
app.get('/api/sales/statistics', (req, res) => {
    const query = `
        SELECT 
            SUM(CASE WHEN DATE(date) = CURDATE() THEN total_amount ELSE 0 END) as daily,
            SUM(CASE WHEN date >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN total_amount ELSE 0 END) as weekly,
            SUM(CASE WHEN date >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN total_amount ELSE 0 END) as monthly,
            SUM(total_amount) as total
        FROM sales 
        WHERE status = 'completed'
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Sales statistics fetch error:', err);
            return res.status(500).json({ success: false, message: 'Satış istatistikleri yüklenirken hata oluştu' });
        }
        res.json({ success: true, data: results[0] });
    });
});

// Satış filtreleme
app.post('/api/sales/filter', (req, res) => {
    const { start_date, end_date, product_id, sort_by } = req.body;
    
    let query = `
        SELECT s.*, p.name as product_name 
        FROM sales s 
        JOIN products p ON s.product_id = p.id 
        WHERE 1=1
    `;
    const params = [];

    if (start_date) {
        query += ' AND s.date >= ?';
        params.push(start_date);
    }
    if (end_date) {
        query += ' AND s.date <= ?';
        params.push(end_date);
    }
    if (product_id) {
        query += ' AND s.product_id = ?';
        params.push(product_id);
    }

    // Sıralama
    switch (sort_by) {
        case 'date_asc':
            query += ' ORDER BY s.date ASC';
            break;
        case 'date_desc':
            query += ' ORDER BY s.date DESC';
            break;
        case 'amount_asc':
            query += ' ORDER BY s.total_amount ASC';
            break;
        case 'amount_desc':
            query += ' ORDER BY s.total_amount DESC';
            break;
        default:
            query += ' ORDER BY s.date DESC';
    }
    
    db.query(query, params, (err, results) => {
        if (err) {
            console.error('Sales filter error:', err);
            return res.status(500).json({ success: false, message: 'Satışlar filtrelenirken hata oluştu' });
        }
        res.json({ success: true, data: results });
    });
});

// Admin - Ürün Yönetimi Endpoint'leri (Sadece Adminler Erişebilir)

// Tüm ürünleri getir (Admin için daha detaylı olabilir)
app.get('/api/admin/products', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Yetkisiz erişim' });
    }

    const query = 'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id';
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Admin products fetch error:', err);
            return res.status(500).json({ success: false, message: 'Ürünler yüklenirken hata oluştu' });
        }
        res.json({ success: true, data: results });
    });
});

// Yeni ürün ekle
app.post('/api/admin/products', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Yetkisiz erişim' });
    }

    const { name, description, price, stock, max_stock, category_id, barcode, image_url } = req.body;

    if (!name || !price || !stock || !max_stock) {
        return res.status(400).json({ success: false, message: 'Gerekli alanlar eksik' });
    }

    const query = 'INSERT INTO products (name, description, price, stock, max_stock, category_id, barcode, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    const values = [name, description, price, stock, max_stock, category_id || null, barcode || null, image_url || null];

    db.query(query, values, (err, results) => {
        if (err) {
            console.error('Admin product add error:', err);
             // Duplicate entry for barcode error
            if (err.code === 'ER_DUP_ENTRY') {
                 return res.status(400).json({ success: false, message: 'Bu barkod zaten kullanımda.' });
            }
            return res.status(500).json({ success: false, message: 'Ürün eklenirken hata oluştu' });
        }
        res.json({ success: true, message: 'Ürün başarıyla eklendi', product_id: results.insertId });
    });
});

// Ürün sil
app.delete('/api/admin/products/:id', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Yetkisiz erişim' });
    }

    const productId = req.params.id;
    const query = 'DELETE FROM products WHERE id = ?';

    db.query(query, [productId], (err, results) => {
        if (err) {
            console.error('Admin product delete error:', err);
            return res.status(500).json({ success: false, message: 'Ürün silinirken hata oluştu' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Ürün bulunamadı' });
        }
        res.json({ success: true, message: 'Ürün başarıyla silindi' });
    });
});

// Kategorileri getir (Admin veya Public için)
app.get('/api/categories', (req, res) => {
    const query = 'SELECT * FROM categories';
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Categories fetch error:', err);
            return res.status(500).json({ success: false, message: 'Kategoriler yüklenirken hata oluştu' });
        }
        res.json({ success: true, data: results });
    });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
}); 