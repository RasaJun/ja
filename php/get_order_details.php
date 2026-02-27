<?php
require_once 'config.php';

checkLogin();

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

if ($id <= 0) {
    sendResponse(false, '無效的訂單編號');
}

try {
    $pdo = getDB();
    
    // 取得訂單主檔
    $stmt = $pdo->prepare("SELECT * FROM orders WHERE id = ?");
    $stmt->execute([$id]);
    $order = $stmt->fetch();
    
    if (!$order) {
        sendResponse(false, '訂單不存在');
    }
    
    // 取得訂單明細
    $stmt = $pdo->prepare("SELECT * FROM order_items WHERE order_id = ?");
    $stmt->execute([$id]);
    $items = $stmt->fetchAll();
    
    $order['items'] = $items;
    
    sendResponse(true, '取得成功', $order);
    
} catch (Exception $e) {
    error_log("get_order_details.php 錯誤: " . $e->getMessage());
    sendResponse(false, '取得訂單詳情失敗');
}
?>