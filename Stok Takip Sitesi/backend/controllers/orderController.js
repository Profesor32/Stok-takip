const pool = require('../config/database');

// Get all orders with filters
exports.getOrders = async (req, res) => {
    try {
        const { search, status, date, sort } = req.query;
        let query = `
            SELECT o.*, u.name as customerName, u.email as customerEmail, u.phone as customerPhone
            FROM orders o
            JOIN users u ON o.userId = u.id
            WHERE 1=1
        `;
        const params = [];

        if (search) {
            query += ` AND (o.orderNumber LIKE ? OR u.name LIKE ? OR u.email LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        if (status) {
            query += ` AND o.status = ?`;
            params.push(status);
        }

        if (date) {
            const startDate = new Date(date);
            const endDate = new Date(date);
            endDate.setDate(endDate.getDate() + 1);
            query += ` AND o.date BETWEEN ? AND ?`;
            params.push(startDate, endDate);
        }

        if (sort) {
            const [field, order] = sort.split(':');
            query += ` ORDER BY o.${field} ${order.toUpperCase()}`;
        } else {
            query += ` ORDER BY o.date DESC`;
        }

        const [orders] = await pool.query(query, params);

        // Get order items for each order
        for (let order of orders) {
            const [items] = await pool.query(`
                SELECT oi.*, p.name as productName
                FROM order_items oi
                JOIN products p ON oi.productId = p.id
                WHERE oi.orderId = ?
            `, [order.id]);
            order.items = items;
        }

        res.json(orders);
    } catch (error) {
        console.error('Error getting orders:', error);
        res.status(500).json({ message: 'Siparişler alınamadı' });
    }
};

// Get order by ID
exports.getOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        const [orders] = await pool.query(`
            SELECT o.*, u.name as customerName, u.email as customerEmail, u.phone as customerPhone
            FROM orders o
            JOIN users u ON o.userId = u.id
            WHERE o.id = ?
        `, [id]);

        if (orders.length === 0) {
            return res.status(404).json({ message: 'Sipariş bulunamadı' });
        }

        const order = orders[0];

        // Get order items
        const [items] = await pool.query(`
            SELECT oi.*, p.name as productName
            FROM order_items oi
            JOIN products p ON oi.productId = p.id
            WHERE oi.orderId = ?
        `, [id]);

        order.items = items;
        res.json(order);
    } catch (error) {
        console.error('Error getting order:', error);
        res.status(500).json({ message: 'Sipariş detayları alınamadı' });
    }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['pending', 'processing', 'completed', 'cancelled'].includes(status)) {
            return res.status(400).json({ message: 'Geçersiz sipariş durumu' });
        }

        const [result] = await pool.query(
            'UPDATE orders SET status = ? WHERE id = ?',
            [status, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Sipariş bulunamadı' });
        }

        res.json({ message: 'Sipariş durumu güncellendi' });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ message: 'Sipariş durumu güncellenemedi' });
    }
}; 