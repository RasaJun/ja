<?php
require_once 'config.php';

echo "<h1>🔧 資料庫修復工具</h1>";

try {
    $pdo = getDB();
    
    // 1. 檢查 orders 表
    echo "<h2>1. 檢查 orders 表</h2>";
    
    $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    
    if (in_array('orders', $tables)) {
        echo "<p style='color:green'>✅ orders 表存在</p>";
        
        // 檢查欄位
        $columns = $pdo->query("DESCRIBE orders")->fetchAll(PDO::FETCH_COLUMN);
        echo "<p>現有欄位: " . implode(', ', $columns) . "</p>";
        
        if (!in_array('status', $columns)) {
            echo "<p style='color:orange'>⚠️ 缺少 status 欄位，正在新增...</p>";
            $pdo->exec("ALTER TABLE orders ADD COLUMN status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending' AFTER created_by");
            echo "<p style='color:green'>✅ status 欄位新增成功</p>";
        } else {
            echo "<p style='color:green'>✅ status 欄位已存在</p>";
        }
    } else {
        echo "<p style='color:red'>❌ orders 表不存在，正在建立...</p>";
        $pdo->exec("
            CREATE TABLE orders (
                id INT PRIMARY KEY AUTO_INCREMENT,
                order_number VARCHAR(20) UNIQUE NOT NULL,
                total_amount DECIMAL(10,2) NOT NULL,
                created_by VARCHAR(50),
                status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ");
        echo "<p style='color:green'>✅ orders 表建立成功</p>";
    }
    
    // 2. 檢查 order_items 表
    echo "<h2>2. 檢查 order_items 表</h2>";
    
    if (in_array('order_items', $tables)) {
        echo "<p style='color:green'>✅ order_items 表存在</p>";
    } else {
        echo "<p style='color:red'>❌ order_items 表不存在，正在建立...</p>";
        $pdo->exec("
            CREATE TABLE order_items (
                id INT PRIMARY KEY AUTO_INCREMENT,
                order_id INT,
                product_id INT,
                product_name VARCHAR(100),
                price DECIMAL(10,2),
                quantity INT,
                subtotal DECIMAL(10,2),
                FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
            )
        ");
        echo "<p style='color:green'>✅ order_items 表建立成功</p>";
    }
    
    // 3. 顯示最終結果
    echo "<h2>3. 修復完成</h2>";
    echo "<p style='color:green'>✅ 資料庫修復完成！</p>";
    
    // 顯示 orders 表結構
    echo "<h3>orders 表結構：</h3>";
    $columns = $pdo->query("DESCRIBE orders")->fetchAll();
    echo "<table border='1' cellpadding='5'>";
    echo "<tr><th>欄位</th><th>類型</th><th>允許空值</th><th>預設值</th></tr>";
    foreach ($columns as $col) {
        echo "<tr>";
        echo "<td>{$col['Field']}</td>";
        echo "<td>{$col['Type']}</td>";
        echo "<td>{$col['Null']}</td>";
        echo "<td>{$col['Default']}</td>";
        echo "</tr>";
    }
    echo "</table>";
    
    echo "<p><a href='../pos.html'>返回收銀頁面</a> | <a href='../orders.html'>查看訂單</a></p>";
    
} catch (Exception $e) {
    echo "<p style='color:red'>❌ 錯誤: " . $e->getMessage() . "</p>";
}
?>