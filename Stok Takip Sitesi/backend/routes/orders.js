const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const orderController = require('../controllers/orderController');

// Tüm siparişleri getir (Admin için)
router.get('/', authenticateToken, isAdmin, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        let query = `
            SELECT o.*, 
                   c.firstName as customerFirstName, 
                   c.lastName as customerLastName,
                   c.email as customerEmail,
                   c.phone as customerPhone,
                   c.address as customerAddress
            FROM orders o
            JOIN customers c ON o.customerId = c.id
            WHERE 1=1
        `;
        const queryParams = [];

        // Apply filters
        if (req.query.search) {
            query += ` AND (o.orderNumber LIKE ? OR CONCAT(c.firstName, ' ', c.lastName) LIKE ?)`;
            queryParams.push(`%${req.query.search}%`, `%${req.query.search}%`);
        }

        if (req.query.status) {
            query += ` AND o.status = ?`;
            queryParams.push(req.query.status);
        }

        if (req.query.dateRange) {
            const now = new Date();
            let startDate;

            switch (req.query.dateRange) {
                case 'today':
                    startDate = new Date(now.setHours(0, 0, 0, 0));
                    break;
                case 'week':
                    startDate = new Date(now.setDate(now.getDate() - 7));
                    break;
                case 'month':
                    startDate = new Date(now.setMonth(now.getMonth() - 1));
                    break;
                case 'year':
                    startDate = new Date(now.setFullYear(now.getFullYear() - 1));
                    break;
            }

            if (startDate) {
                query += ` AND o.createdAt >= ?`;
                queryParams.push(startDate);
            }
        }

        // Apply sorting
        const sortMap = {
            dateDesc: 'o.createdAt DESC',
            dateAsc: 'o.createdAt ASC',
            totalDesc: 'o.total DESC',
            totalAsc: 'o.total ASC'
        };
        const sort = sortMap[req.query.sort] || 'o.createdAt DESC';
        query += ` ORDER BY ${sort}`;

        // Get total count
        const [countResult] = await pool.query(
            query.replace('SELECT o.*, c.firstName', 'SELECT COUNT(*) as total'),
            queryParams
        );
        const total = countResult[0].total;

        // Get paginated results
        query += ` LIMIT ? OFFSET ?`;
        queryParams.push(limit, offset);

        const [orders] = await pool.query(query, queryParams);

        // Format response
        const formattedOrders = orders.map(order => ({
            id: order.id,
            orderNumber: order.orderNumber,
            customer: {
                firstName: order.customerFirstName,
                lastName: order.customerLastName,
                email: order.customerEmail,
                phone: order.customerPhone,
                address: order.customerAddress
            },
            total: order.total,
            status: order.status,
            createdAt: order.createdAt
        }));

        res.json({
            orders: formattedOrders,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            total
        });

    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ message: 'Siparişler yüklenirken bir hata oluştu' });
    }
});

// Kullanıcının siparişlerini getir
router.get('/my-orders', authenticateToken, async (req, res) => {
    try {
        const [orders] = await pool.query(
            'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
            [req.user.id]
        );
        res.json({
            success: true,
            data: orders
        });
    } catch (error) {
        console.error('Kullanıcı siparişleri hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası'
        });
    }
});

// Sipariş detayı getir
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        // Get order details
        const [orders] = await pool.query(`
            SELECT o.*, 
                   c.firstName as customerFirstName, 
                   c.lastName as customerLastName,
                   c.email as customerEmail,
                   c.phone as customerPhone,
                   c.address as customerAddress
            FROM orders o
            JOIN customers c ON o.customerId = c.id
            WHERE o.id = ?
        `, [req.params.id]);

        if (orders.length === 0) {
            return res.status(404).json({ message: 'Sipariş bulunamadı' });
        }

        const order = orders[0];

        // Sadece admin veya sipariş sahibi görebilir
        if (req.user.role !== 'admin' && order.user_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Bu siparişi görüntüleme yetkiniz yok'
            });
        }

        // Get order items
        const [items] = await pool.query(`
            SELECT oi.*, p.name as productName
            FROM order_items oi
            JOIN products p ON oi.productId = p.id
            WHERE oi.orderId = ?
        `, [req.params.id]);

        // Format response
        const formattedOrder = {
            id: order.id,
            orderNumber: order.orderNumber,
            customer: {
                firstName: order.customerFirstName,
                lastName: order.customerLastName,
                email: order.customerEmail,
                phone: order.customerPhone,
                address: order.customerAddress
            },
            items: items.map(item => ({
                product: {
                    id: item.productId,
                    name: item.productName
                },
                quantity: item.quantity,
                price: item.price
            })),
            total: order.total,
            status: order.status,
            paymentMethod: order.paymentMethod,
            shippingCompany: order.shippingCompany,
            notes: order.notes,
            createdAt: order.createdAt
        };

        res.json(formattedOrder);

    } catch (error) {
        console.error('Error fetching order details:', error);
        res.status(500).json({ message: 'Sipariş detayları yüklenirken bir hata oluştu' });
    }
});

// Yeni sipariş oluştur
router.post('/', authenticateToken, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const {
            customer,
            items,
            paymentMethod,
            shippingCompany,
            notes
        } = req.body;

        // Create customer
        const [customerResult] = await connection.query(`
            INSERT INTO customers (firstName, lastName, email, phone, address)
            VALUES (?, ?, ?, ?, ?)
        `, [
            customer.firstName,
            customer.lastName,
            customer.email,
            customer.phone,
            customer.address
        ]);

        const customerId = customerResult.insertId;

        // Generate order number
        const orderNumber = `ORD${Date.now().toString().slice(-8)}`;

        // Create order
        const [orderResult] = await connection.query(`
            INSERT INTO orders (
                orderNumber,
                customerId,
                total,
                status,
                paymentMethod,
                shippingCompany,
                notes
            )
            VALUES (?, ?, ?, 'pending', ?, ?, ?)
        `, [
            orderNumber,
            customerId,
            items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
            paymentMethod,
            shippingCompany,
            notes
        ]);

        const orderId = orderResult.insertId;

        // Create order items
        for (const item of items) {
            await connection.query(`
                INSERT INTO order_items (orderId, productId, quantity, price)
                VALUES (?, ?, ?, ?)
            `, [
                orderId,
                item.productId,
                item.quantity,
                item.price
            ]);

            // Update product stock
            await connection.query(`
                UPDATE products
                SET stock = stock - ?
                WHERE id = ?
            `, [item.quantity, item.productId]);
        }

        await connection.commit();

        res.status(201).json({
            message: 'Sipariş başarıyla oluşturuldu',
            orderId,
            orderNumber
        });

    } catch (error) {
        await connection.rollback();
        console.error('Error creating order:', error);
        res.status(500).json({ message: 'Sipariş oluşturulurken bir hata oluştu' });
    } finally {
        connection.release();
    }
});

// Sipariş durumunu güncelle (Sadece admin)
router.patch('/:id/status', authenticateToken, isAdmin, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { status, note } = req.body;

        // Update order status
        await connection.query(`
            UPDATE orders
            SET status = ?
            WHERE id = ?
        `, [status, req.params.id]);

        // Add status history
        await connection.query(`
            INSERT INTO order_status_history (orderId, status, note)
            VALUES (?, ?, ?)
        `, [req.params.id, status, note]);

        await connection.commit();

        res.json({ message: 'Sipariş durumu güncellendi' });

    } catch (error) {
        await connection.rollback();
        console.error('Error updating order status:', error);
        res.status(500).json({ message: 'Sipariş durumu güncellenirken bir hata oluştu' });
    } finally {
        connection.release();
    }
});

// Get all orders with filters
router.get('/', authenticateToken, orderController.getOrders);

// Get order by ID
router.get('/:id', authenticateToken, orderController.getOrderById);

// Update order status
router.put('/:id/status', authenticateToken, orderController.updateOrderStatus);

module.exports = router; 