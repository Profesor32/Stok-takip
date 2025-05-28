-- Create database
CREATE DATABASE IF NOT EXISTS osmanli3_stock;
USE osmanli3_stock;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    categoryId INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    minStock INT NOT NULL DEFAULT 5,
    description TEXT,
    imageUrl VARCHAR(255),
    supplier VARCHAR(100),
    barcode VARCHAR(50),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (categoryId) REFERENCES categories(id)
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    orderNumber VARCHAR(20) NOT NULL UNIQUE,
    userId INT NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') NOT NULL DEFAULT 'pending',
    paymentMethod ENUM('creditCard', 'bankTransfer', 'cash') NOT NULL,
    shippingAddress TEXT NOT NULL,
    notes TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id)
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    orderId INT NOT NULL,
    productId INT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (orderId) REFERENCES orders(id),
    FOREIGN KEY (productId) REFERENCES products(id)
);

-- Create stock_history table
CREATE TABLE IF NOT EXISTS stock_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    productId INT NOT NULL,
    quantity INT NOT NULL,
    type ENUM('in', 'out') NOT NULL,
    reference VARCHAR(50),
    notes TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (productId) REFERENCES products(id)
);

-- Create Views
CREATE OR REPLACE VIEW product_stock_status AS
SELECT 
    p.id,
    p.code,
    p.name,
    p.stock,
    p.minStock,
    CASE 
        WHEN p.stock <= 0 THEN 'out_of_stock'
        WHEN p.stock <= p.minStock THEN 'low_stock'
        ELSE 'in_stock'
    END as stock_status
FROM products p;

-- Create Stored Procedures
DELIMITER //

CREATE PROCEDURE update_product_stock(
    IN p_product_id INT,
    IN p_quantity INT,
    IN p_type ENUM('in', 'out'),
    IN p_reference VARCHAR(50),
    IN p_notes TEXT
)
BEGIN
    DECLARE current_stock INT;
    
    -- Get current stock
    SELECT stock INTO current_stock FROM products WHERE id = p_product_id;
    
    -- Update stock
    IF p_type = 'in' THEN
        UPDATE products SET stock = current_stock + p_quantity WHERE id = p_product_id;
    ELSE
        UPDATE products SET stock = current_stock - p_quantity WHERE id = p_product_id;
    END IF;
    
    -- Insert into history
    INSERT INTO stock_history (productId, quantity, type, reference, notes)
    VALUES (p_product_id, p_quantity, p_type, p_reference, p_notes);
END //

-- Create Triggers
CREATE TRIGGER after_order_item_insert
AFTER INSERT ON order_items
FOR EACH ROW
BEGIN
    -- Update order total
    UPDATE orders 
    SET total = (
        SELECT SUM(quantity * price) 
        FROM order_items 
        WHERE orderId = NEW.orderId
    )
    WHERE id = NEW.orderId;
    
    -- Update product stock
    CALL update_product_stock(
        NEW.productId,
        NEW.quantity,
        'out',
        CONCAT('Order: ', (SELECT orderNumber FROM orders WHERE id = NEW.orderId)),
        'Order item created'
    );
END //

CREATE TRIGGER check_low_stock
AFTER UPDATE ON products
FOR EACH ROW
BEGIN
    IF NEW.stock <= NEW.minStock AND OLD.stock > NEW.minStock THEN
        INSERT INTO stock_history (productId, quantity, type, reference, notes)
        VALUES (NEW.id, NEW.stock, 'out', 'LOW_STOCK_ALERT', 'Stock level below minimum');
    END IF;
END //

DELIMITER ; 