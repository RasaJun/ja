<?php
require_once 'config.php';

checkAdmin();

$data = json_decode(file_get_contents('php://input'), true);
$id = $data['id'] ?? 0;
$status = $data['status'] ?? '';

if ($id <= 0 || empty($status)) {
    sendResponse(false, '參數錯誤');
}

try {
    $pdo = getDB();
    
    $stmt = $pdo->prepare("UPDATE orders SET status = ? WHERE id = ?");
    $stmt->execute([$status, $id]);
    
    sendResponse(true, '訂單已更新');
    
} catch (Exception $e) {
    error_log("update_order.php 錯誤: " . $e->getMessage());
    sendResponse(false, '更新失敗');
}
?>