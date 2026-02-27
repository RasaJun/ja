<?php
echo "<h1>🔍 優惠價格檢查</h1>";

try {
    $pdo = new PDO('mysql:host=localhost;dbname=ja;charset=utf8mb4', 'root', '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // 檢查 products 表結構
    echo "<h2>1. products 表結構</h2>";
    $columns = $pdo->query("DESCRIBE products")->fetchAll();
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
    
    // 檢查是否有 discount_price 欄位
    $hasDiscount = false;
    foreach ($columns as $col) {
        if ($col['Field'] == 'discount_price') {
            $hasDiscount = true;
            break;
        }
    }
    
    if (!$hasDiscount) {
        echo "<p style='color:red'>❌ discount_price 欄位不存在！</p>";
        
        // 新增欄位
        $pdo->exec("ALTER TABLE products ADD COLUMN discount_price DECIMAL(10,2) NULL AFTER price");
        $pdo->exec("ALTER TABLE products ADD COLUMN discount_updated_at TIMESTAMP NULL AFTER discount_price");
        $pdo->exec("ALTER TABLE products ADD COLUMN discount_updated_by VARCHAR(50) NULL AFTER discount_updated_at");
        echo "<p style='color:green'>✅ 已新增 discount_price 欄位</p>";
    } else {
        echo "<p style='color:green'>✅ discount_price 欄位存在</p>";
    }
    
    // 顯示所有商品
    echo "<h2>2. 商品列表</h2>";
    $products = $pdo->query("SELECT id, name, price, discount_price, discount_updated_at, discount_updated_by FROM products ORDER BY id")->fetchAll();
    
    echo "<table border='1' cellpadding='5'>";
    echo "<tr><th>ID</th><th>商品名稱</th><th>原價</th><th>優惠價</th><th>最後更新</th><th>更新者</th></tr>";
    
    foreach ($products as $product) {
        $discountStyle = $product['discount_price'] ? 'style="color:#ff5252; font-weight:bold;"' : '';
        echo "<tr>";
        echo "<td>{$product['id']}</td>";
        echo "<td>{$product['name']}</td>";
        echo "<td>\${$product['price']}</td>";
        echo "<td {$discountStyle}>" . ($product['discount_price'] ? '$' . $product['discount_price'] : '-') . "</td>";
        echo "<td>{$product['discount_updated_at']}</td>";
        echo "<td>{$product['discount_updated_by']}</td>";
        echo "</tr>";
    }
    echo "</table>";
    
} catch (Exception $e) {
    echo "<p style='color:red'>錯誤: " . $e->getMessage() . "</p>";
}
?>
