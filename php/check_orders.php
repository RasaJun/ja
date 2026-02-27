<?php
// 開啟錯誤報告
ini_set('display_errors', 1);
error_reporting(E_ALL);

echo "<h1>📊 資料庫檢查</h1>";

try {
    $pdo = new PDO('mysql:host=localhost;dbname=ja;charset=utf8mb4', 'root', '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // 1. 檢查所有資料表
    echo "<h2>1. 資料表列表</h2>";
    $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    echo "<ul>";
    foreach ($tables as $table) {
        echo "<li>" . $table . "</li>";
    }
    echo "</ul>";
    
    // 2. 檢查 orders 表結構
    echo "<h2>2. orders 表結構</h2>";
    if (in_array('orders', $tables)) {
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
    } else {
        echo "<p style='color:red'>orders 表不存在！</p>";
    }
    
    // 3. 檢查 order_items 表結構
    echo "<h2>3. order_items 表結構</h2>";
    if (in_array('order_items', $tables)) {
        $columns = $pdo->query("DESCRIBE order_items")->fetchAll();
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
    } else {
        echo "<p style='color:red'>order_items 表不存在！</p>";
    }
    
    // 4. 檢查現有訂單
    echo "<h2>4. 現有訂單</h2>";
    if (in_array('orders', $tables)) {
        $orders = $pdo->query("SELECT * FROM orders ORDER BY created_at DESC LIMIT 10")->fetchAll();
        
        if (count($orders) > 0) {
            echo "<table border='1' cellpadding='5'>";
            // 表頭
            echo "<tr>";
            foreach (array_keys($orders[0]) as $key) {
                echo "<th>$key</th>";
            }
            echo "</tr>";
            
            // 資料
            foreach ($orders as $order) {
                echo "<tr>";
                foreach ($order as $value) {
                    echo "<td>" . htmlspecialchars($value ?? '') . "</td>";
                }
                echo "</tr>";
            }
            echo "</table>";
        } else {
            echo "<p>目前沒有訂單資料</p>";
        }
    }
    
} catch (Exception $e) {
    echo "<p style='color:red'>錯誤: " . $e->getMessage() . "</p>";
}
?>