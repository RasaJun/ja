<?php
echo "<h1>📋 訂單驗證</h1>";

try {
    $pdo = new PDO('mysql:host=localhost;dbname=ja;charset=utf8mb4', 'root', '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // 顯示所有訂單
    echo "<h2>所有訂單：</h2>";
    $orders = $pdo->query("SELECT * FROM orders ORDER BY id DESC LIMIT 20")->fetchAll();
    
    if (count($orders) > 0) {
        echo "<table border='1' cellpadding='8'>";
        echo "<tr><th>ID</th><th>訂單編號</th><th>金額</th><th>建立者</th><th>狀態</th><th>建立時間</th></tr>";
        
        foreach ($orders as $order) {
            echo "<tr>";
            echo "<td>{$order['id']}</td>";
            echo "<td>{$order['order_number']}</td>";
            echo "<td>\${$order['total_amount']}</td>";
            echo "<td>{$order['created_by']}</td>";
            echo "<td>{$order['status']}</td>";
            echo "<td>{$order['created_at']}</td>";
            echo "</tr>";
        }
        echo "</table>";
    } else {
        echo "<p>目前沒有訂單</p>";
    }
    
    // 顯示訂單明細
    echo "<h2>訂單明細：</h2>";
    $items = $pdo->query("
        SELECT o.order_number, oi.product_name, oi.price, oi.quantity, oi.subtotal 
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        ORDER BY o.id DESC, oi.id
        LIMIT 50
    ")->fetchAll();
    
    if (count($items) > 0) {
        echo "<table border='1' cellpadding='8'>";
        echo "<tr><th>訂單編號</th><th>商品名稱</th><th>單價</th><th>數量</th><th>小計</th></tr>";
        
        foreach ($items as $item) {
            echo "<tr>";
            echo "<td>{$item['order_number']}</td>";
            echo "<td>{$item['product_name']}</td>";
            echo "<td>\${$item['price']}</td>";
            echo "<td>{$item['quantity']}</td>";
            echo "<td>\${$item['subtotal']}</td>";
            echo "</tr>";
        }
        echo "</table>";
    } else {
        echo "<p>目前沒有訂明明細</p>";
    }
    
} catch (Exception $e) {
    echo "<p style='color:red'>錯誤: " . $e->getMessage() . "</p>";
}
?>