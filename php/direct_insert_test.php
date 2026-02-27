<?php
// 開啟錯誤報告
ini_set('display_errors', 1);
error_reporting(E_ALL);

echo "<h1>🔍 直接資料庫插入測試</h1>";

try {
    // 直接連線資料庫
    $pdo = new PDO('mysql:host=localhost;dbname=ja;charset=utf8mb4', 'root', '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "<p style='color:green'>✅ 資料庫連線成功</p>";
    
    // 開始交易
    $pdo->beginTransaction();
    echo "<p>開始交易...</p>";
    
    // 產生測試訂單編號
    $orderNumber = 'TEST' . date('YmdHis');
    
    // 插入測試訂單
    $sql = "INSERT INTO orders (order_number, total_amount, created_by, status) VALUES (?, ?, ?, 'pending')";
    $stmt = $pdo->prepare($sql);
    $result = $stmt->execute([$orderNumber, 999, 'test_user']);
    
    if ($result) {
        $orderId = $pdo->lastInsertId();
        echo "<p style='color:green'>✅ 訂單插入成功，ID: $orderId</p>";
        
        // 插入測試明細
        $sql2 = "INSERT INTO order_items (order_id, product_id, product_name, price, quantity, subtotal) VALUES (?, ?, ?, ?, ?, ?)";
        $stmt2 = $pdo->prepare($sql2);
        $result2 = $stmt2->execute([$orderId, 1, '測試商品', 100, 1, 100]);
        
        if ($result2) {
            echo "<p style='color:green'>✅ 訂單明細插入成功</p>";
        } else {
            echo "<p style='color:red'>❌ 訂單明細插入失敗</p>";
        }
    }
    
    // 選擇是否提交或回滾
    echo "<h2>請選擇：</h2>";
    echo "<a href='?action=commit' style='background: #4caf50; color: white; padding: 10px 20px; text-decoration: none; margin: 10px;'>✅ 提交交易 (COMMIT)</a>";
    echo "<a href='?action=rollback' style='background: #f44336; color: white; padding: 10px 20px; text-decoration: none; margin: 10px;'>❌ 回滾交易 (ROLLBACK)</a>";
    
    if (isset($_GET['action'])) {
        if ($_GET['action'] === 'commit') {
            $pdo->commit();
            echo "<p style='color:green; font-weight: bold;'>✅ 交易已提交！資料已寫入資料庫</p>";
        } else if ($_GET['action'] === 'rollback') {
            $pdo->rollBack();
            echo "<p style='color:orange; font-weight: bold;'>⚠️ 交易已回滾，資料未寫入</p>";
        }
        
        // 顯示目前訂單
        $orders = $pdo->query("SELECT * FROM orders ORDER BY id DESC LIMIT 5")->fetchAll();
        echo "<h3>最新5筆訂單：</h3>";
        echo "<table border='1' cellpadding='5'>";
        echo "<tr><th>ID</th><th>訂單編號</th><th>金額</th><th>建立者</th><th>狀態</th><th>建立時間</th></tr>";
        foreach ($orders as $order) {
            echo "<tr>";
            echo "<td>{$order['id']}</td>";
            echo "<td>{$order['order_number']}</td>";
            echo "<td>{$order['total_amount']}</td>";
            echo "<td>{$order['created_by']}</td>";
            echo "<td>{$order['status']}</td>";
            echo "<td>{$order['created_at']}</td>";
            echo "</tr>";
        }
        echo "</table>";
    }
    
} catch (Exception $e) {
    echo "<p style='color:red'>❌ 錯誤: " . $e->getMessage() . "</p>";
    if (isset($pdo)) {
        $pdo->rollBack();
    }
}
?>