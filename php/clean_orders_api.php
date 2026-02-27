<?php
// 清除所有之前的輸出
ob_clean();

// 設定 JSON 標頭
header('Content-Type: application/json');

// 錯誤處理
try {
    // 資料庫連線
    $pdo = new PDO('mysql:host=localhost;dbname=ja;charset=utf8mb4', 'root', '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // 查詢訂單
    $stmt = $pdo->query("
        SELECT o.*, 
               (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count 
        FROM orders o 
        ORDER BY o.created_at DESC 
        LIMIT 100
    ");
    
    $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // 回傳 JSON
    echo json_encode([
        'success' => true,
        'message' => '取得成功',
        'data' => $orders,
        'count' => count($orders)
    ]);
    
} catch (Exception $e) {
    // 回傳錯誤 JSON
    echo json_encode([
        'success' => false,
        'message' => '資料庫錯誤: ' . $e->getMessage()
    ]);
}
?>