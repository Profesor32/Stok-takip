-- SQL script for database schema

-- Veritabanını oluştur
CREATE DATABASE IF NOT EXISTS osmanli3_stock;
USE osmanli3_stock;

-- Kullanıcılar tablosu
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Kategoriler tablosu
CREATE TABLE IF NOT EXISTS categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Örnek kategoriler
INSERT INTO categories (name, description) VALUES
('Elektronik', 'Elektronik ürünler ve aksesuarlar'),
('Gıda', 'Gıda ürünleri ve içecekler'),
('Temizlik', 'Temizlik ve hijyen ürünleri'),
('Kırtasiye', 'Kırtasiye malzemeleri'),
('Ofis', 'Ofis malzemeleri ve ekipmanları');

-- Ürünler tablosu
CREATE TABLE IF NOT EXISTS products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    max_stock INT NOT NULL DEFAULT 100,
    category_id INT,
    barcode VARCHAR(50) UNIQUE,
    image_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Örnek ürünler
INSERT INTO products (name, description, price, stock, max_stock, category_id, barcode, image_url) VALUES
-- Elektronik Ürünler
('iPhone 14 Pro', 'Apple iPhone 14 Pro 256GB', 49999.99, 50, 100, 1, '8680000000001', 'https://example.com/images/iphone14pro.jpg'),
('Samsung Galaxy S23', 'Samsung Galaxy S23 Ultra 512GB', 39999.99, 75, 150, 1, '8680000000002', 'https://example.com/images/samsungs23.jpg'),
('MacBook Pro M2', 'Apple MacBook Pro 14" M2 Pro', 59999.99, 30, 80, 1, '8680000000003', 'https://example.com/images/macbookpro.jpg'),
('AirPods Pro', 'Apple AirPods Pro 2. Nesil', 4999.99, 100, 200, 1, '8680000000004', 'https://example.com/images/airpodspro.jpg'),

-- Gıda Ürünleri
('Türk Kahvesi', 'Özel Harman Türk Kahvesi 250g', 89.99, 200, 500, 2, '8680000000005', 'https://example.com/images/turkkahvesi.jpg'),
('Zeytinyağı', 'Sızma Zeytinyağı 1L', 149.99, 150, 300, 2, '8680000000006', 'https://example.com/images/zeytinyagi.jpg'),
('Bal', 'Doğal Çiçek Balı 850g', 199.99, 100, 250, 2, '8680000000007', 'https://example.com/images/bal.jpg'),
('Kuruyemiş Karışımı', 'Karışık Kuruyemiş 500g', 129.99, 180, 400, 2, '8680000000008', 'https://example.com/images/kuruyemis.jpg'),

-- Temizlik Ürünleri
('Çamaşır Deterjanı', 'Sıvı Çamaşır Deterjanı 5L', 199.99, 120, 300, 3, '8680000000009', 'https://example.com/images/deterjan.jpg'),
('Bulaşık Deterjanı', 'Sıvı Bulaşık Deterjanı 750ml', 49.99, 200, 400, 3, '8680000000010', 'https://example.com/images/bulasik.jpg'),
('Yüzey Temizleyici', 'Çok Amaçlı Yüzey Temizleyici 750ml', 59.99, 150, 350, 3, '8680000000011', 'https://example.com/images/yuzey.jpg'),
('Dezenfektan', 'El Dezenfektanı 500ml', 39.99, 300, 600, 3, '8680000000012', 'https://example.com/images/dezenfektan.jpg'),

-- Kırtasiye Ürünleri
('Not Defteri', 'A4 Spiral Not Defteri 100 Yaprak', 29.99, 500, 1000, 4, '8680000000013', 'https://example.com/images/notdefteri.jpg'),
('Kalem Seti', '12'li Renkli Kalem Seti', 49.99, 200, 400, 4, '8680000000014', 'https://example.com/images/kalemset.jpg'),
('Dosya', 'A4 Plastik Dosya 100'lü', 89.99, 150, 300, 4, '8680000000015', 'https://example.com/images/dosya.jpg'),
('Post-it', 'Post-it Not 100'lü Paket', 19.99, 400, 800, 4, '8680000000016', 'https://example.com/images/postit.jpg'),

-- Ofis Ürünleri
('Ofis Koltuğu', 'Ergonomik Ofis Koltuğu', 2999.99, 20, 50, 5, '8680000000017', 'https://example.com/images/ofiskoltugu.jpg'),
('Yazıcı', 'Lazer Yazıcı Siyah-Beyaz', 3999.99, 15, 40, 5, '8680000000018', 'https://example.com/images/yazici.jpg'),
('Projeksiyon', 'Full HD Projeksiyon Cihazı', 5999.99, 10, 30, 5, '8680000000019', 'https://example.com/images/projeksiyon.jpg'),
('Sunum Tahtası', 'Manyetik Sunum Tahtası 120x90cm', 1499.99, 25, 60, 5, '8680000000020', 'https://example.com/images/sunumtahtasi.jpg');

-- Stok hareketleri tablosu
CREATE TABLE IF NOT EXISTS stock_movements (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    type ENUM('in', 'out') NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Örnek stok hareketleri
INSERT INTO stock_movements (product_id, quantity, type, description) VALUES
(1, 50, 'in', 'İlk stok girişi'),
(2, 75, 'in', 'İlk stok girişi'),
(3, 30, 'in', 'İlk stok girişi'),
(4, 100, 'in', 'İlk stok girişi'),
(5, 200, 'in', 'İlk stok girişi'),
(6, 150, 'in', 'İlk stok girişi'),
(7, 100, 'in', 'İlk stok girişi'),
(8, 180, 'in', 'İlk stok girişi'),
(9, 120, 'in', 'İlk stok girişi'),
(10, 200, 'in', 'İlk stok girişi'),
(11, 150, 'in', 'İlk stok girişi'),
(12, 300, 'in', 'İlk stok girişi'),
(13, 500, 'in', 'İlk stok girişi'),
(14, 200, 'in', 'İlk stok girişi'),
(15, 150, 'in', 'İlk stok girişi'),
(16, 400, 'in', 'İlk stok girişi'),
(17, 20, 'in', 'İlk stok girişi'),
(18, 15, 'in', 'İlk stok girişi'),
(19, 10, 'in', 'İlk stok girişi'),
(20, 25, 'in', 'İlk stok girişi');

-- Satışlar tablosu
CREATE TABLE IF NOT EXISTS sales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status ENUM('completed', 'cancelled', 'pending') DEFAULT 'completed',
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Sepet tablosu
CREATE TABLE IF NOT EXISTS cart (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- This file would contain SQL commands to set up the database. 