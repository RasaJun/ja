<?php
// 關閉所有輸出緩衝
ob_clean();

// 顯示所有錯誤
ini_set('display_errors', 1);
error_reporting(E_ALL);

echo "<h1>🔍 訂單系統除錯</h1>";

try {
    // 1. 測試資料庫連線
    echo "<h2>1. 測試資料庫連線</h2>";
    $pdo = new PDO('mysql:host=localhost;dbname=ja;charset=utf8mb4', 'root', '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "<p style='color:green'>✅ 資料庫連線成功</p>";
    
    // 2. 列出所有資料表
    echo "<h2>2. 資料表列表</h2>";
    $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    echo "<ul>";
    foreach ($tables as $table) {
        echo "<li>$table</li>";
    }
    echo "</ul>";
    
    // 3. 檢查 orders 表結構
    echo "<h2>3. orders 表結構</h2>";
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
        
        // 4. 查詢訂單資料
        echo "<h2>4. 訂單資料</h2>";
        $orders = $pdo->query("SELECT * FROM orders ORDER BY created_at DESC LIMIT 5")->fetchAll();
        
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
            echo "<p>orders 表中沒有資料</p>";
        }
    } else {
        echo "<p style='color:red'>orders 表不存在</p>";
    }
    
    // 5. 測試 JSON 輸出
    echo "<h2>5. 測試 JSON 輸出</h2>";
    $testData = ['success' => true, 'message' => '測試成功'];
    echo "JSON 輸出測試：<br>";
    echo "<pre>" . json_encode($testData, JSON_PRETTY_PRINT) . "</pre>";
    
} catch (Exception $e) {
    echo "<p style='color:red'>❌ 錯誤: " . $e->getMessage() . "</p>";
    echo "<pre>" . $e->getTraceAsString() . "</pre>";
}
?>