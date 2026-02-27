<?php
echo "<h1>🔧 修復訂單明細</h1>";

try {
    $pdo = new PDO('mysql:host=localhost;dbname=ja;charset=utf8mb4', 'root', '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // 1. 找出所有沒有明細的訂單
    $sql = "SELECT o.id, o.order_number, o.total_amount 
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            WHERE oi.id IS NULL";
    
    $stmt = $pdo->query($sql);
    $badOrders = $stmt->fetchAll();
    
    echo "<h2>發現 " . count($badOrders) . " 筆訂單沒有明細</h2>";
    
    if (count($badOrders) > 0) {
        echo "<table border='1' cellpadding='8'>";
        echo "<tr><th>ID</th><th>訂單編號</th><th>金額</th><th>操作</th></tr>";
        
        foreach ($badOrders as $order) {
            echo "<tr>";
            echo "<td>{$order['id']}</td>";
            echo "<td>{$order['order_number']}</td>";
            echo "<td>\${$order['total_amount']}</td>";
            echo "<td><a href='?fix={$order['id']}' onclick='return confirm(\"要為此訂單補上明細嗎？\")'>補上明細</a></td>";
            echo "</tr>";
        }
        echo "</table>";
    }
    
    // 2. 如果有 fix 參數，為特定訂單補上明細
    if (isset($_GET['fix'])) {
        $orderId = $_GET['fix'];
        
        // 取得訂單資訊
        $stmt = $pdo->prepare("SELECT * FROM orders WHERE id = ?");
        $stmt->execute([$orderId]);
        $order = $stmt->fetch();
        
        if ($order) {
            // 根據金額猜測商品組合
            $amount = $order['total_amount'];
            $items = [];
            
            if ($amount == 35) {
                $items[] = ['product_id' => 1, 'name' => '鎖匙扣盲盒', 'price' => 35, 'quantity' => 1];
            } elseif ($amount == 50) {
                $items[] = ['product_id' => 3, 'name' => '月曆', 'price' => 50, 'quantity' => 1];
            } elseif ($amount == 70) {
                $items[] = ['product_id' => 1, 'name' => '鎖匙扣盲盒', 'price' => 35, 'quantity' => 2];
            } elseif ($amount == 85) {
                $items[] = ['product_id' => 1, 'name' => '鎖匙扣盲盒', 'price' => 35, 'quantity' => 1];
                $items[] = ['product_id' => 3, 'name' => '月曆', 'price' => 50, 'quantity' => 1];
            } elseif ($amount == 100) {
                $items[] = ['product_id' => 3, 'name' => '月曆', 'price' => 50, 'quantity' => 2];
            } elseif ($amount == 120) {
                $items[] = ['product_id' => 1, 'name' => '鎖匙扣盲盒', 'price' => 35, 'quantity' => 2];
                $items[] = ['product_id' => 3, 'name' => '月曆', 'price' => 50, 'quantity' => 1];
            } elseif ($amount == 150) {
                $items[] = ['product_id' => 2, 'name' => '[COMBO] 鎖匙扣盲盒 * 5', 'price' => 150, 'quantity' => 1];
            } elseif ($amount == 185) {
                $items[] = ['product_id' => 1, 'name' => '鎖匙扣盲盒', 'price' => 35, 'quantity' => 1];
                $items[] = ['product_id' => 2, 'name' => '[COMBO] 鎖匙扣盲盒 * 5', 'price' => 150, 'quantity' => 1];
            } else {
                // 預設補上一個鎖匙扣盲盒
                $items[] = ['product_id' => 1, 'name' => '鎖匙扣盲盒', 'price' => 35, 'quantity' => 1];
            }
            
            // 插入明細
            $stmt = $pdo->prepare("INSERT INTO order_items (order_id, product_id, product_name, price, quantity, subtotal) VALUES (?, ?, ?, ?, ?, ?)");
            
            foreach ($items as $item) {
                $subtotal = $item['price'] * $item['quantity'];
                $stmt->execute([
                    $orderId,
                    $item['product_id'],
                    $item['name'],
                    $item['price'],
                    $item['quantity'],
                    $subtotal
                ]);
            }
            
            echo "<p style='color:green'>✅ 訂單 #{$order['order_number']} 已補上 " . count($items) . " 筆明細</p>";
            echo "<p><a href='?'>返回</a></p>";
        }
    }
    
} catch (Exception $e) {
    echo "<p style='color:red'>錯誤: " . $e->getMessage() . "</p>";
}
?>