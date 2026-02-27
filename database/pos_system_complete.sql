-- =====================================================
-- 藍色收銀系統 - 最終完整版本
-- 資料庫名稱：ja
-- 包含功能：
-- 1. 使用者管理 (staff/admin)
-- 2. 商品管理 (含優惠價格)
-- 3. 訂單管理 (含付款方式)
-- 4. 訂單明細
-- 5. 登入日誌
-- 6. 系統設定
-- 7. 統計檢視表
-- 8. 預存程序
-- =====================================================

-- 選擇資料庫（如果不存在則建立）
DROP DATABASE IF EXISTS ja;
CREATE DATABASE ja;
USE ja;

-- =====================================================
-- 1. 建立使用者資料表
-- =====================================================
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('staff', 'admin') NOT NULL,
    full_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插入預設帳戶（密碼：staff123 和 admin123）
INSERT INTO users (username, password, role, full_name) VALUES
('staff', '$2y$10$HfFB5j5ao5/vhGcQZEMdw.H5kCXC4.iHnl5dgiGSt9ifDNBSfjvPS', 'staff', '一般員工'),
('admin', '$2y$10$lYmj/7e74sFgAo.TAiiJ1u2KDAfm9CpY4421TOD.hB.Rpmn55kvCC', 'admin', '系統管理員');

-- =====================================================
-- 2. 建立商品資料表（含優惠價格）
-- =====================================================
CREATE TABLE products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    discount_price DECIMAL(10,2) NULL,
    discount_updated_at TIMESTAMP NULL,
    discount_updated_by VARCHAR(50) NULL,
    image_filename VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插入3個商品
INSERT INTO products (name, price, image_filename, category, sort_order) VALUES
('鎖匙扣盲盒', 35, 'keychain.png', '盲盒', 1),
('[COMBO] 鎖匙扣盲盒 * 5', 150, 'keychain_combo.png', '盲盒', 2),
('月曆', 50, 'calendar.png', '文具', 3);

-- =====================================================
-- 3. 建立訂單資料表（含付款方式）
-- =====================================================
CREATE TABLE orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_number VARCHAR(20) UNIQUE NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    created_by VARCHAR(50),
    status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending',
    payment_method ENUM('現金', 'AlipayHK', '其他') DEFAULT '現金',
    payment_time TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 4. 建立訂單明細資料表
-- =====================================================
CREATE TABLE order_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT,
    product_id INT,
    product_name VARCHAR(100),
    price DECIMAL(10,2),
    quantity INT,
    subtotal DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 5. 建立登入日誌表
-- =====================================================
CREATE TABLE login_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50),
    role VARCHAR(20),
    login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,
    success BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 6. 建立系統設定表
-- =====================================================
CREATE TABLE settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(50) UNIQUE NOT NULL,
    setting_value TEXT,
    updated_by VARCHAR(50),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插入系統設定
INSERT INTO settings (setting_key, setting_value) VALUES
('store_name', '藍色收銀系統'),
('currency', 'HKD'),
('tax_rate', '0'),
('receipt_footer', '感謝您的購買！');

-- =====================================================
-- 7. 建立索引提升查詢效能
-- =====================================================
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_created_by ON orders(created_by);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_method ON orders(payment_method);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
CREATE INDEX idx_products_discount ON products(discount_price);
CREATE INDEX idx_login_logs_username ON login_logs(username);
CREATE INDEX idx_login_logs_login_time ON login_logs(login_time);

-- =====================================================
-- 9. 建立檢視表（方便查詢）
-- =====================================================

-- 訂單完整資訊檢視表
CREATE VIEW v_order_details AS
SELECT 
    o.id,
    o.order_number,
    o.total_amount,
    o.created_by,
    o.status,
    o.payment_method,
    o.payment_time,
    o.created_at,
    COUNT(oi.id) as item_count,
    GROUP_CONCAT(CONCAT(oi.product_name, ' x', oi.quantity) SEPARATOR ', ') as items_summary
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id;

-- 商品銷售統計檢視表
CREATE VIEW v_product_sales AS
SELECT 
    p.id,
    p.name as product_name,
    p.price,
    p.discount_price,
    p.category,
    COUNT(DISTINCT oi.order_id) as order_count,
    SUM(oi.quantity) as total_quantity,
    SUM(oi.subtotal) as total_sales
FROM products p
LEFT JOIN order_items oi ON p.id = oi.product_id
GROUP BY p.id, p.name;

-- 付款方式統計檢視表
CREATE VIEW v_payment_stats AS
SELECT 
    payment_method,
    COUNT(*) as order_count,
    SUM(total_amount) as total_amount,
    AVG(total_amount) as avg_amount
FROM orders
WHERE status = 'completed'
GROUP BY payment_method;

-- 每日銷售統計檢視表
CREATE VIEW v_daily_sales AS
SELECT 
    DATE(created_at) as sale_date,
    COUNT(*) as order_count,
    SUM(total_amount) as total_sales,
    payment_method,
    COUNT(*) as method_count
FROM orders
WHERE status = 'completed'
GROUP BY DATE(created_at), payment_method;

-- =====================================================
-- 10. 建立預存程序
-- =====================================================

-- 建立新訂單的預存程序
DELIMITER //
CREATE PROCEDURE sp_create_order(
    IN p_order_number VARCHAR(20),
    IN p_total_amount DECIMAL(10,2),
    IN p_created_by VARCHAR(50),
    IN p_payment_method VARCHAR(20)
)
BEGIN
    INSERT INTO orders (order_number, total_amount, created_by, status, payment_method, payment_time)
    VALUES (p_order_number, p_total_amount, p_created_by, 'pending', p_payment_method, NOW());
    
    SELECT LAST_INSERT_ID() as order_id;
END //
DELIMITER ;

-- 建立訂單明細的預存程序
DELIMITER //
CREATE PROCEDURE sp_add_order_item(
    IN p_order_id INT,
    IN p_product_id INT,
    IN p_product_name VARCHAR(100),
    IN p_price DECIMAL(10,2),
    IN p_quantity INT
)
BEGIN
    DECLARE v_subtotal DECIMAL(10,2);
    SET v_subtotal = p_price * p_quantity;
    
    INSERT INTO order_items (order_id, product_id, product_name, price, quantity, subtotal)
    VALUES (p_order_id, p_product_id, p_product_name, p_price, p_quantity, v_subtotal);
END //
DELIMITER ;

-- 取得付款方式統計的預存程序
DELIMITER //
CREATE PROCEDURE sp_payment_statistics(
    IN p_start_date DATE,
    IN p_end_date DATE
)
BEGIN
    SELECT 
        payment_method,
        COUNT(*) as order_count,
        SUM(total_amount) as total_amount,
        AVG(total_amount) as avg_amount,
        MIN(total_amount) as min_amount,
        MAX(total_amount) as max_amount
    FROM orders
    WHERE status = 'completed'
    AND DATE(created_at) BETWEEN p_start_date AND p_end_date
    GROUP BY payment_method
    ORDER BY total_amount DESC;
END //
DELIMITER ;

-- 取得商品銷售統計的預存程序
DELIMITER //
CREATE PROCEDURE sp_product_statistics(
    IN p_start_date DATE,
    IN p_end_date DATE
)
BEGIN
    SELECT 
        p.id,
        p.name,
        p.price,
        p.discount_price,
        COUNT(DISTINCT o.id) as order_count,
        SUM(oi.quantity) as total_quantity,
        SUM(oi.subtotal) as total_sales
    FROM products p
    LEFT JOIN order_items oi ON p.id = oi.product_id
    LEFT JOIN orders o ON oi.order_id = o.id AND o.status = 'completed'
        AND DATE(o.created_at) BETWEEN p_start_date AND p_end_date
    GROUP BY p.id, p.name
    ORDER BY total_sales DESC;
END //
DELIMITER ;

-- =====================================================
-- 11. 建立觸發器
-- =====================================================

-- 訂單建立後自動記錄付款時間
DELIMITER //
CREATE TRIGGER before_order_insert
BEFORE INSERT ON orders
FOR EACH ROW
BEGIN
    IF NEW.payment_method != '現金' THEN
        SET NEW.payment_time = NOW();
    END IF;
END //
DELIMITER ;

-- 更新商品優惠時記錄時間
DELIMITER //
CREATE TRIGGER before_discount_update
BEFORE UPDATE ON products
FOR EACH ROW
BEGIN
    IF NEW.discount_price != OLD.discount_price THEN
        SET NEW.discount_updated_at = NOW();
    END IF;
END //
DELIMITER ;

-- =====================================================
-- 12. 顯示所有資料和統計
-- =====================================================

-- 顯示所有使用者
SELECT '=== 使用者列表 ===' as '';
SELECT id, username, role, full_name, created_at FROM users;

-- 顯示所有商品（含優惠）
SELECT '=== 商品列表 ===' as '';
SELECT id, name, price, 
       CASE WHEN discount_price IS NOT NULL THEN CONCAT('優惠價 $', discount_price) ELSE '無優惠' END as discount,
       image_filename, category, sort_order 
FROM products ORDER BY sort_order;

-- 顯示訂單統計
SELECT '=== 訂單統計 ===' as '';
SELECT 
    COUNT(*) as 總訂單數,
    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as 處理中訂單,
    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as 已完成訂單,
    SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as 已取消訂單,
    SUM(total_amount) as 總營業額
FROM orders;

-- 顯示付款方式統計
SELECT '=== 付款方式統計 ===' as '';
SELECT payment_method, COUNT(*) as 訂單數, SUM(total_amount) as 營業額
FROM orders WHERE status = 'completed'
GROUP BY payment_method;

-- 顯示最近5筆訂單
SELECT '=== 最近5筆訂單 ===' as '';
SELECT order_number, total_amount, created_by, payment_method, status, created_at 
FROM orders 
ORDER BY created_at DESC 
LIMIT 5;

-- 顯示商品銷售統計
SELECT '=== 商品銷售統計 ===' as '';
SELECT 
    p.name as 商品名稱,
    COUNT(oi.id) as 銷售次數,
    SUM(oi.quantity) as 銷售數量,
    SUM(oi.subtotal) as 銷售總額
FROM products p
LEFT JOIN order_items oi ON p.id = oi.product_id
GROUP BY p.id, p.name
ORDER BY 銷售總額 DESC;
