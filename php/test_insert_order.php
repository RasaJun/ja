<?php
// 開啟錯誤報告
ini_set('display_errors', 1);
error_reporting(E_ALL);

// 設定 JSON 標頭
header('Content-Type: application/json');

try {
    // 直接資料庫連線
    $pdo = new PDO('mysql:host=localhost;dbname=ja;charset=utf8mb4', 'root', '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // 開始交易
    $pdo->beginTransaction();
    
    // 1. 插入測試訂單
    $orderNumber = 'TEST' . date('YmdHis');
    $total = 999;
    $createdBy = 'test';
    
    $stmt = $pdo->prepare("INSERT INTO orders (order_number, total_amount, created_by, status) VALUES (?, ?, ?, 'pending')");
    $stmt->execute([$orderNumber, $total, $createdBy]);
    
    $orderId = $pdo->lastInsertId();
    
    // 2. 插入測試明細
    $stmt = $pdo->prepare("INSERT INTO order_items (order_id, product_id, product_name, price, quantity, subtotal) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->execute([$orderId, 1, '測試商品', 100, 1, 100]);
    
    // 提交交易
    $pdo->commit();
    
    echo json_encode([
        'success' => true,
        'message' => '測試訂單建立成功',
        'order_id' => $orderId,
        'order_number' => $orderNumber
    ]);
    
} catch (Exception $e) {
    // 回滾交易
    if (isset($pdo)) {
        $pdo->rollBack();
    }
    
    echo json_encode([
        'success' => false,
        'message' => '錯誤: ' . $e->getMessage()
    ]);
}
?>