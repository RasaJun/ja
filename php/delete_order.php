<?php
require_once 'config.php';

// 關閉錯誤輸出
ini_set('display_errors', 0);
error_reporting(0);

header('Content-Type: application/json');

// 檢查是否登入
checkLogin();

// 只接受 POST 請求
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => '無效的請求方法']);
    exit;
}

// 獲取 POST 數據
$input = file_get_contents('php://input');
$data = json_decode($input, true);
$orderId = $data['id'] ?? 0;

if ($orderId <= 0) {
    echo json_encode(['success' => false, 'message' => '無效的訂單編號']);
    exit;
}

try {
    $pdo = getDB();
    
    // 開始交易
    $pdo->beginTransaction();
    
    // 先檢查訂單是否存在
    $checkStmt = $pdo->prepare("SELECT * FROM orders WHERE id = ?");
    $checkStmt->execute([$orderId]);
    $order = $checkStmt->fetch();
    
    if (!$order) {
        throw new Exception('訂單不存在');
    }
    
    // 記錄訂單資訊以便回傳
    $orderNumber = $order['order_number'];
    
    // 刪除訂單明細
    $stmt = $pdo->prepare("DELETE FROM order_items WHERE order_id = ?");
    $stmt->execute([$orderId]);
    $itemCount = $stmt->rowCount();
    
    // 刪除訂單
    $stmt = $pdo->prepare("DELETE FROM orders WHERE id = ?");
    $stmt->execute([$orderId]);
    
    // 提交交易
    $pdo->commit();
    
    echo json_encode([
        'success' => true, 
        'message' => "訂單 {$orderNumber} 已成功刪除",
        'order_id' => $orderId,
        'order_number' => $orderNumber,
        'item_count' => $itemCount
    ]);
    
} catch (Exception $e) {
    if (isset($pdo)) {
        $pdo->rollBack();
    }
    echo json_encode([
        'success' => false, 
        'message' => '刪除失敗: ' . $e->getMessage()
    ]);
}
?>